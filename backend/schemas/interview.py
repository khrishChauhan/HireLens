from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from schemas.analysis import RequirementMatch


class GeneratedQuestion(BaseModel):
    id: str = Field(description="Unique stable question identifier (e.g., 'q1_fastapi_concurrency')")
    question: str = Field(description="Technically rigorous, job-relevant interview question")
    target_skill: str = Field(description="The specific requirement, technology, or competency being evaluated")
    reason: str = Field(description="Why this question was selected based on resume analysis or requirement gaps")
    difficulty: Literal["foundational", "intermediate", "advanced"] = Field(
        default="intermediate",
        description="Target technical depth appropriate to the role and candidate background"
    )
    rubric: str = Field(description="Evaluation criteria and key concepts the candidate should demonstrate")
    is_follow_up: bool = Field(default=False, description="True if this question is an adaptive follow-up")


class LLMQuestionListOutput(BaseModel):
    """Raw structured output expected from the LLM for question generation."""
    questions: List[GeneratedQuestion] = Field(description="List of targeted technical interview questions")
    focus_areas: List[str] = Field(default_factory=list, description="Primary technical competencies targeted")


class QuestionGenerationRequest(BaseModel):
    job_description: str = Field(
        ...,
        min_length=20,
        max_length=20_000,
        description="Target job description with role requirements"
    )
    matched_requirements: List[RequirementMatch] = Field(
        default_factory=list,
        description="Requirements already evidenced in the candidate resume"
    )
    partially_matched_requirements: List[RequirementMatch] = Field(
        default_factory=list,
        description="Requirements partially evidenced or inferred"
    )
    unmatched_requirements: List[RequirementMatch] = Field(
        default_factory=list,
        description="Requirements not evidenced in the resume"
    )
    uncertainty_notes: List[str] = Field(
        default_factory=list,
        description="Notes on missing technical details or areas needing clarity"
    )
    target_count: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Initial question budget (1 to 5)"
    )


class QuestionGenerationResponse(BaseModel):
    questions: List[GeneratedQuestion]
    total_generated: int
    focus_areas: List[str]
    status: Literal["success"] = "success"


class CriterionScore(BaseModel):
    criterion: Literal["technical_correctness", "problem_solving", "relevance", "communication"]
    score: float = Field(ge=1.0, le=5.0, description="Criterion score on a 1.0 to 5.0 scale")
    feedback: str = Field(description="Specific technical feedback for this criterion")


class RawLLMEvaluationOutput(BaseModel):
    """Raw structured output expected from the LLM when evaluating an answer."""
    technical_correctness_score: float = Field(ge=1.0, le=5.0)
    technical_correctness_feedback: str
    problem_solving_score: float = Field(ge=1.0, le=5.0)
    problem_solving_feedback: str
    relevance_score: float = Field(ge=1.0, le=5.0)
    relevance_feedback: str
    communication_score: float = Field(ge=1.0, le=5.0)
    communication_feedback: str
    evidence_quote: Optional[str] = Field(
        default=None,
        description="Direct verbatim quote from the candidate's answer supporting this evaluation"
    )
    strengths: List[str] = Field(default_factory=list, description="Specific strengths demonstrated in the answer")
    improvements: List[str] = Field(default_factory=list, description="Specific technical gaps or improvement areas")
    overall_feedback: str = Field(description="Concise summary evaluation of the technical response")


class AnswerEvaluationRequest(BaseModel):
    question_id: str = Field(..., description="ID of the question being answered")
    question_text: str = Field(..., min_length=5, description="Full text of the question")
    target_skill: str = Field(..., description="Target skill or requirement")
    rubric: str = Field(..., min_length=5, description="Rubric criteria for evaluation")
    candidate_answer: str = Field(
        ...,
        min_length=10,
        max_length=10_000,
        description="The candidate's typed technical response"
    )


class AnswerEvaluationResponse(BaseModel):
    question_id: str
    composite_score: float = Field(description="Deterministic average of criterion scores on 1.0 - 5.0 scale")
    percentage_score: int = Field(description="Deterministic score mapped to 0 - 100 percentage")
    criteria_scores: List[CriterionScore]
    evidence_quote: Optional[str] = None
    evidence_verified: bool = Field(description="True if cited evidence quote exists verbatim in candidate answer")
    strengths: List[str]
    improvements: List[str]
    overall_feedback: str
    status: Literal["success"] = "success"


class InterviewHistoryItem(BaseModel):
    question_id: str
    question_text: str
    target_skill: str
    candidate_answer: str
    composite_score: float
    is_follow_up: bool = False


class RawLLMNextQuestionDecision(BaseModel):
    """Structured decision output from LLM for adaptive question routing."""
    should_follow_up: bool = Field(
        description="True if the previous answer had gaps or ambiguity requiring a targeted follow-up question"
    )
    decision_reason: str = Field(
        description="Technical justification for following up or transitioning to another requirement"
    )
    follow_up_question: Optional[GeneratedQuestion] = Field(
        default=None,
        description="The follow-up question to ask if should_follow_up is true"
    )
    new_topic_question: Optional[GeneratedQuestion] = Field(
        default=None,
        description="A new question addressing an outstanding requirement if not following up"
    )


class NextQuestionRequest(BaseModel):
    interview_history: List[InterviewHistoryItem] = Field(
        default_factory=list,
        description="Log of previously asked questions and candidate answers"
    )
    current_question: GeneratedQuestion = Field(
        ...,
        description="The question that was just answered"
    )
    last_answer: str = Field(
        ...,
        min_length=10,
        max_length=10_000,
        description="Candidate's most recent answer"
    )
    last_evaluation: AnswerEvaluationResponse = Field(
        ...,
        description="Evaluation result of the most recent answer"
    )
    remaining_budget: int = Field(
        default=2,
        ge=0,
        le=10,
        description="Remaining allowed question count before concluding the interview"
    )
    max_budget: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Maximum total questions allowed in this interview session"
    )
    unaddressed_requirements: List[str] = Field(
        default_factory=list,
        description="Job requirements that have not yet been evaluated"
    )


class NextQuestionResponse(BaseModel):
    has_next_question: bool = Field(description="True if another question is ready to be presented")
    is_completed: bool = Field(description="True if the interview has reached its budget or natural conclusion")
    next_question: Optional[GeneratedQuestion] = None
    decision_reason: str = Field(description="Explanation of why a follow-up or new question was chosen, or why concluded")
    remaining_budget: int = Field(description="Updated remaining question budget")
    status: Literal["success"] = "success"
