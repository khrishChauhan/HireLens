import json
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Literal, Optional, Set, Tuple
from pydantic import BaseModel, Field, ValidationError

from schemas.interview import (
    AgentActivity,
    AnswerEvaluationResponse,
    GeneratedQuestion,
    InterviewHistoryItem,
)
from services.rag.chunking import TextChunker
from services.rag.embeddings import (
    BaseEmbeddingService,
    FastEmbedEmbeddingService,
    MockEmbeddingService,
)
from services.rag.retrieval import VectorSearchIndex
from services.rag.verifier import EvidenceVerifier

logger = logging.getLogger("hirelens.agent_tools")


class SearchResumeEvidenceInput(BaseModel):
    """Input parameters for searching candidate resume evidence."""
    claim: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="The technical claim, technology, architectural decision, or experience statement to verify against the resume."
    )
    technical_topic: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional technical domain, tool, or skill (e.g., 'FastAPI', 'PostgreSQL', 'Docker', 'RAG')."
    )


class GetInterviewEvidenceInput(BaseModel):
    """Input parameters for retrieving prior interview turns and performance evidence."""
    topic: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional skill, keyword, or concept to filter matching prior questions and answers."
    )


class PlanNextInterviewActionInput(BaseModel):
    """Input parameters for planning the next strategic interview action."""
    action: Literal[
        "ask_follow_up",
        "investigate_claim",
        "increase_difficulty",
        "change_topic",
        "wrap_up",
    ] = Field(
        ...,
        description="The planned next routing action for the technical interview."
    )
    target_skill: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="The target competency, framework, or requirement being assessed."
    )
    rationale: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Grounded justification for selecting this action based on candidate answers and evidence."
    )
    difficulty: Optional[Literal["foundational", "intermediate", "advanced"]] = Field(
        default=None,
        description="Target difficulty level for the next question."
    )


class AgentToolContext:
    """
    Context passed into tool executions.
    Scoped strictly to the current candidate's session to ensure privacy and isolation.
    """

    def __init__(
        self,
        session_id: Optional[str] = None,
        resume_text: Optional[str] = None,
        interview_history: Optional[List[InterviewHistoryItem]] = None,
        current_question: Optional[GeneratedQuestion] = None,
        last_answer: Optional[str] = None,
        last_evaluation: Optional[AnswerEvaluationResponse] = None,
        remaining_budget: int = 2,
        max_budget: int = 5,
        unaddressed_requirements: Optional[List[str]] = None,
        candidate_projects: Optional[List[str]] = None,
        embedding_service: Optional[BaseEmbeddingService] = None,
    ):
        self.session_id = session_id
        self.resume_text = resume_text or ""
        self.interview_history = interview_history or []
        self.current_question = current_question
        self.last_answer = last_answer or ""
        self.last_evaluation = last_evaluation
        self.remaining_budget = remaining_budget
        self.max_budget = max_budget
        self.unaddressed_requirements = unaddressed_requirements or []
        self.candidate_projects = candidate_projects or []

        self._embedding_service = embedding_service
        self._index: Optional[VectorSearchIndex] = None
        self._indexed_text: Optional[str] = None

    def get_or_create_index(self) -> Optional[VectorSearchIndex]:
        """Lazy-initializes an in-memory VectorSearchIndex scoped to current candidate's resume."""
        if not self.resume_text or not self.resume_text.strip():
            return None

        if self._index is not None and self._indexed_text == self.resume_text:
            return self._index

        # Initialize embedding service (prefer existing, then FastEmbed, then Mock fallback)
        if self._embedding_service is None:
            try:
                self._embedding_service = FastEmbedEmbeddingService()
            except Exception as e:
                logger.warning("FastEmbed not available in tool context (%s); using MockEmbeddingService", e)
                self._embedding_service = MockEmbeddingService()

        index = VectorSearchIndex(embedding_service=self._embedding_service, chunker=TextChunker())
        index.index_text(self.resume_text, source_doc=f"resume_session_{self.session_id or 'ephemeral'}")
        self._index = index
        self._indexed_text = self.resume_text
        return self._index


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Tool Implementations
# ---------------------------------------------------------------------------

def execute_search_resume_evidence(
    params: SearchResumeEvidenceInput,
    context: AgentToolContext,
) -> Tuple[Dict[str, Any], AgentActivity]:
    """
    Tool A: Resume Evidence Search
    Retrieves matching chunks and verified quotes from the candidate's resume.
    Ensures single-candidate scoping and reports absence without falsely assuming candidate inability.
    """
    topic_label = params.technical_topic or params.claim[:30]

    # Handle missing resume text
    if not context.resume_text or not context.resume_text.strip():
        obs = {
            "found": False,
            "claim": params.claim,
            "technical_topic": params.technical_topic,
            "evidence_chunks": [],
            "verified_quotes": [],
            "notes": (
                "No resume text was provided for this candidate session. "
                "Important: Absence from the resume does not mean the candidate lacks competence; "
                "inquire conversationally to explore their experience."
            ),
        }
        activity = AgentActivity(
            action="search_resume_evidence",
            summary=f"Checked resume evidence for '{topic_label}'",
            details="No resume text available for session",
            timestamp=_now_iso(),
        )
        return obs, activity

    index = context.get_or_create_index()
    evidence_chunks: List[Dict[str, Any]] = []
    verified_quotes: List[str] = []

    # Extract keywords to check in resume
    term_matches = []
    keywords_to_check = []
    if params.technical_topic:
        keywords_to_check.append(params.technical_topic.strip())
    # Extract significant alphanumeric tokens from claim (ignoring common stop words)
    stop_words = {"with", "using", "built", "have", "that", "from", "their", "this", "some", "work", "were", "been"}
    claim_tokens = [
        w.strip(",.;:!?()[]\"'")
        for w in params.claim.split()
        if len(w) > 3 and w.lower() not in stop_words
    ]
    keywords_to_check.extend(claim_tokens[:6])

    resume_lower = context.resume_text.lower()
    for kw in keywords_to_check:
        if kw and kw.lower() in resume_lower and kw.lower() not in [m.lower() for m in term_matches]:
            term_matches.append(kw)

    # Semantic RAG retrieval: retrieve chunks if topic/claim matches or if high relevance
    if index is not None and index.total_chunks > 0 and term_matches:
        query = f"{params.claim} {params.technical_topic or ''}".strip()
        search_results = index.search(query, top_k=3, min_score=0.20)
        for res in search_results:
            is_verified, cleaned = EvidenceVerifier.verify_quote(res.chunk.text, context.resume_text)
            chunk_data = {
                "chunk_index": getattr(res.chunk, "index", 0),
                "text": res.chunk.text,
                "start_char": res.chunk.start_char,
                "end_char": res.chunk.end_char,
                "relevance_score": round(res.score, 3),
                "is_quote_verified": is_verified,
            }
            evidence_chunks.append(chunk_data)
            if is_verified and cleaned:
                # Add first 120 chars as verified quote reference
                verified_quotes.append(cleaned[:120].strip())

    found = bool(term_matches) and (bool(evidence_chunks) or len(term_matches) > 0)

    if found:
        notes = (
            f"Evidence found in candidate's resume matching '{params.claim}'. "
            f"Verified relevant keywords/excerpts: {', '.join(term_matches) if term_matches else 'Semantically matched chunks'}. "
            "Use this grounded evidence to inform your follow-up or next technical question."
        )
        details = f"Found {len(evidence_chunks)} matching excerpts ({len(term_matches)} keywords verified)"
    else:
        notes = (
            f"No direct evidence or explicit mention found in candidate's resume for '{params.claim}'. "
            "Note: Absence in the resume is not proof of lack of skill; the candidate may have unlisted experience. "
            "Ask an open-ended question to let them explain their hands-on familiarity."
        )
        details = "No explicit resume evidence found (absence != inability)"

    obs = {
        "found": found,
        "claim": params.claim,
        "technical_topic": params.technical_topic,
        "matched_keywords": term_matches,
        "evidence_chunks": evidence_chunks,
        "verified_quotes": verified_quotes[:3],
        "notes": notes,
    }
    activity = AgentActivity(
        action="search_resume_evidence",
        summary=f"Checked resume evidence for '{topic_label}'",
        details=details,
        timestamp=_now_iso(),
    )
    return obs, activity


def execute_get_interview_evidence(
    params: GetInterviewEvidenceInput,
    context: AgentToolContext,
) -> Tuple[Dict[str, Any], AgentActivity]:
    """
    Tool B: Interview History Search
    Retrieves previous answers, questions, and scores from the current session.
    Detects repeated topics to prevent cycling.
    """
    # Compile all turns from history and current question
    all_turns: List[Dict[str, Any]] = []

    for idx, item in enumerate(context.interview_history, start=1):
        all_turns.append({
            "turn": idx,
            "question_id": item.question_id,
            "question_text": item.question_text,
            "target_skill": item.target_skill,
            "candidate_answer": item.candidate_answer,
            "composite_score": item.composite_score,
            "stage": item.stage,
            "is_follow_up": item.is_follow_up,
        })

    # Include current turn if answered
    if context.current_question and context.last_answer:
        cur_score = context.last_evaluation.composite_score if context.last_evaluation else None
        all_turns.append({
            "turn": len(context.interview_history) + 1,
            "question_id": context.current_question.id,
            "question_text": context.current_question.question,
            "target_skill": context.current_question.target_skill,
            "candidate_answer": context.last_answer,
            "composite_score": cur_score,
            "stage": getattr(context.current_question, "stage", None),
            "is_follow_up": context.current_question.is_follow_up,
        })

    # Filter by topic if requested
    query_topic = (params.topic or "").strip().lower()
    if query_topic:
        matching_turns = [
            t for t in all_turns
            if query_topic in t["question_text"].lower()
            or query_topic in (t["target_skill"] or "").lower()
            or query_topic in t["candidate_answer"].lower()
        ]
    else:
        matching_turns = all_turns

    # Track skills covered and detect repeated topics
    skills_covered = [t["target_skill"] for t in all_turns if t["target_skill"]]
    unique_skills = sorted(list(set(skills_covered)))
    repeated_skills = [s for s in unique_skills if skills_covered.count(s) > 1]

    scores = [t["composite_score"] for t in all_turns if t["composite_score"] is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    warning = ""
    if repeated_skills:
        warning = f"Warning: The following skills have already been asked about multiple times: {', '.join(repeated_skills)}. Do not ask another question on these unless resolving a critical ambiguity."

    obs = {
        "total_turns_completed": len(all_turns),
        "skills_covered": unique_skills,
        "repeated_skills": repeated_skills,
        "average_score": avg_score,
        "matching_turns": matching_turns,
        "warning": warning or None,
        "notes": f"Found {len(matching_turns)} relevant turns in current session.",
    }

    summary_topic = params.topic if params.topic else "interview history"
    activity = AgentActivity(
        action="get_interview_evidence",
        summary=f"Reviewed prior interview evidence for '{summary_topic}'",
        details=f"{len(matching_turns)} turns found ({len(unique_skills)} skills evaluated, avg score: {avg_score or 'N/A'})",
        timestamp=_now_iso(),
    )
    return obs, activity


def execute_plan_next_interview_action(
    params: PlanNextInterviewActionInput,
    context: AgentToolContext,
) -> Tuple[Dict[str, Any], AgentActivity]:
    """
    Tool C: Question Planning
    Validates the proposed routing action against question budgets, stages, and deterministic guardrails.
    """
    current_total = len(context.interview_history) + (1 if context.current_question else 0)

    # Hard budget enforcement
    if context.remaining_budget <= 0 or current_total >= context.max_budget:
        effective_action = "wrap_up"
        status = "budget_exhausted"
        notes = (
            f"Question budget exhausted ({current_total}/{context.max_budget} questions completed). "
            "Action forced to 'wrap_up'. Conclude the interview gracefully."
        )
    else:
        effective_action = params.action
        status = "approved"
        notes = (
            f"Action '{params.action}' approved for skill '{params.target_skill}'. "
            f"Remaining budget: {context.remaining_budget}. Proceed with formulating the next question."
        )

    # Determine recommended difficulty
    if effective_action == "increase_difficulty":
        rec_diff = "advanced"
    elif effective_action == "wrap_up":
        rec_diff = "foundational"
    elif params.difficulty:
        rec_diff = params.difficulty
    else:
        # Default based on last score
        last_score = context.last_evaluation.composite_score if context.last_evaluation else 3.0
        rec_diff = "advanced" if last_score >= 4.0 else ("foundational" if last_score < 2.5 else "intermediate")

    obs = {
        "status": status,
        "action": effective_action,
        "requested_action": params.action,
        "target_skill": params.target_skill,
        "recommended_difficulty": rec_diff,
        "budget_remaining": context.remaining_budget,
        "current_total_questions": current_total,
        "max_budget": context.max_budget,
        "rationale": params.rationale,
        "notes": notes,
    }

    action_label = effective_action.replace("_", " ").title()
    activity = AgentActivity(
        action="plan_next_interview_action",
        summary=f"Planned strategic action: {action_label} ({params.target_skill})",
        details=params.rationale[:80],
        timestamp=_now_iso(),
    )
    return obs, activity


# ---------------------------------------------------------------------------
# Tool Registry
# ---------------------------------------------------------------------------

OPENAI_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_resume_evidence",
            "description": (
                "Search the candidate's resume using RAG semantic retrieval and verbatim quote verification "
                "to check whether a claimed technology, project, or implementation was explicitly listed. "
                "Strictly scoped to the current candidate's resume. Absence does not equal inability."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "claim": {
                        "type": "string",
                        "description": "The specific candidate claim, framework, architecture, or project detail to verify against the resume."
                    },
                    "technical_topic": {
                        "type": "string",
                        "description": "Optional specific technical skill or domain keyword (e.g., 'FastAPI', 'PostgreSQL', 'Docker', 'RAG')."
                    }
                },
                "required": ["claim"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_interview_evidence",
            "description": (
                "Retrieve previous candidate answers, questions, scores, and skills already covered "
                "in this interview session to prevent repetitive questioning and ground performance evaluation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Optional technical topic, skill, or keyword to filter prior turns."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "plan_next_interview_action",
            "description": (
                "Formulate and validate the next strategic interview routing decision "
                "(ask_follow_up, investigate_claim, increase_difficulty, change_topic, wrap_up) "
                "against deterministic interview budget and stage constraints."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["ask_follow_up", "investigate_claim", "increase_difficulty", "change_topic", "wrap_up"],
                        "description": "The planned interview routing action."
                    },
                    "target_skill": {
                        "type": "string",
                        "description": "The target competency or skill to evaluate next."
                    },
                    "rationale": {
                        "type": "string",
                        "description": "Evidence-grounded rationale for selecting this action."
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["foundational", "intermediate", "advanced"],
                        "description": "Recommended difficulty level."
                    }
                },
                "required": ["action", "target_skill", "rationale"]
            }
        }
    }
]


class AgentToolRegistry:
    """
    Registry for managing tool schemas and safe deterministic execution.
    Handles argument validation, repeated-call guards, and error translation.
    """

    def __init__(self):
        self._handlers: Dict[str, Tuple[type, Callable]] = {
            "search_resume_evidence": (SearchResumeEvidenceInput, execute_search_resume_evidence),
            "get_interview_evidence": (GetInterviewEvidenceInput, execute_get_interview_evidence),
            "plan_next_interview_action": (PlanNextInterviewActionInput, execute_plan_next_interview_action),
        }

    def get_definitions(self) -> List[Dict[str, Any]]:
        """Returns tool definitions formatted for Groq/OpenAI function calling."""
        return OPENAI_TOOL_DEFINITIONS

    def execute(
        self,
        tool_name: str,
        raw_arguments: Any,
        context: AgentToolContext,
    ) -> Tuple[Dict[str, Any], AgentActivity]:
        """
        Safely validates arguments and executes the requested tool.
        Returns an observation dictionary and an AgentActivity log entry.
        Never raises uncaught exceptions.
        """
        if tool_name not in self._handlers:
            err_obs = {
                "error": f"Unknown tool '{tool_name}'. Available tools: {list(self._handlers.keys())}"
            }
            activity = AgentActivity(
                action=tool_name,
                summary=f"Attempted unrecognized tool '{tool_name}'",
                details="Tool execution rejected: not in allowed registry",
                timestamp=_now_iso(),
            )
            return err_obs, activity

        schema_cls, handler = self._handlers[tool_name]

        # Parse string arguments if received as JSON string
        if isinstance(raw_arguments, str):
            try:
                parsed_args = json.loads(raw_arguments) if raw_arguments.strip() else {}
            except Exception as e:
                err_obs = {
                    "error": f"Malformed JSON in tool arguments: {str(e)}"
                }
                activity = AgentActivity(
                    action=tool_name,
                    summary=f"Invalid arguments for {tool_name}",
                    details="Malformed JSON input",
                    timestamp=_now_iso(),
                )
                return err_obs, activity
        elif isinstance(raw_arguments, dict):
            parsed_args = raw_arguments
        else:
            parsed_args = {}

        # Validate with Pydantic
        try:
            validated_params = schema_cls.model_validate(parsed_args)
        except ValidationError as val_err:
            logger.warning("Tool %s input validation error: %s", tool_name, val_err)
            err_obs = {
                "error": f"Invalid arguments for {tool_name}: {val_err.errors()}"
            }
            activity = AgentActivity(
                action=tool_name,
                summary=f"Rejected invalid arguments for {tool_name}",
                details="Schema validation failed",
                timestamp=_now_iso(),
            )
            return err_obs, activity

        # Execute safe handler
        try:
            return handler(validated_params, context)
        except Exception as exc:
            logger.exception("Error executing tool %s: %s", tool_name, exc)
            err_obs = {
                "error": f"Execution error in {tool_name}: {str(exc)}"
            }
            activity = AgentActivity(
                action=tool_name,
                summary=f"Error executing {tool_name}",
                details=str(exc)[:80],
                timestamp=_now_iso(),
            )
            return err_obs, activity
