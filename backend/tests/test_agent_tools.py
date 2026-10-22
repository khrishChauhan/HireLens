import json
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from main import app
from db.database import SessionLocal, Base, engine
from db.models import AssessmentSessionModel
from schemas.interview import (
    AnswerEvaluationResponse,
    CriterionScore,
    GeneratedQuestion,
    InterviewHistoryItem,
    NextQuestionRequest,
    NextQuestionResponse,
    RawLLMNextQuestionDecision,
)
from services.agent_tools import (
    AgentToolContext,
    AgentToolRegistry,
    GetInterviewEvidenceInput,
    PlanNextInterviewActionInput,
    SearchResumeEvidenceInput,
    execute_get_interview_evidence,
    execute_plan_next_interview_action,
    execute_search_resume_evidence,
)
from services.interview import InterviewService
from services.rag.embeddings import MockEmbeddingService
from services.session import SessionService

test_client = TestClient(app)


SAMPLE_RESUME_TEXT = """
Jane Doe — Senior Backend Engineer
Technical Skills: Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, AWS, Pytest, Git.
Experience:
Senior Software Engineer at CloudCorp (2021-Present)
- Architected high-throughput microservices using FastAPI and asyncpg with PostgreSQL connection pooling.
- Designed real-time event processing pipeline handling 10,000 events/sec with Redis Streams and Docker.
- Implemented automated CI/CD deployment pipelines using Kubernetes Helm charts and Pytest test suites.
"""


# ============================================================================
# 1. Tool A: Resume Evidence Search Tests
# ============================================================================

def test_search_resume_evidence_found():
    """Verifies that technical claims evidenced in the resume are retrieved and verified."""
    context = AgentToolContext(
        resume_text=SAMPLE_RESUME_TEXT,
        embedding_service=MockEmbeddingService(),
    )
    params = SearchResumeEvidenceInput(
        claim="Architected high-throughput microservices using FastAPI",
        technical_topic="FastAPI",
    )

    obs, activity = execute_search_resume_evidence(params, context)

    assert obs["found"] is True
    assert "FastAPI" in obs["matched_keywords"] or len(obs["evidence_chunks"]) > 0
    assert activity.action == "search_resume_evidence"
    assert "FastAPI" in activity.summary
    assert "Found" in activity.details or "verified" in activity.details.lower()


def test_search_resume_evidence_not_found_absence_is_not_inability():
    """Verifies that claims absent from the resume are reported cleanly without falsely declaring candidate inability."""
    context = AgentToolContext(
        resume_text=SAMPLE_RESUME_TEXT,
        embedding_service=MockEmbeddingService(),
    )
    params = SearchResumeEvidenceInput(
        claim="Built mobile applications with Flutter and Dart",
        technical_topic="Flutter",
    )

    obs, activity = execute_search_resume_evidence(params, context)

    assert obs["found"] is False
    assert len(obs["matched_keywords"]) == 0
    assert "Absence in the resume is not proof of lack of skill" in obs["notes"]
    assert "absence != inability" in activity.details.lower() or "no explicit" in activity.details.lower()


def test_search_resume_evidence_empty_resume():
    """Verifies graceful handling when no resume text is available."""
    context = AgentToolContext(
        resume_text="",
        embedding_service=MockEmbeddingService(),
    )
    params = SearchResumeEvidenceInput(claim="Python backend", technical_topic="Python")

    obs, activity = execute_search_resume_evidence(params, context)

    assert obs["found"] is False
    assert "No resume text was provided" in obs["notes"]
    assert "No resume text available" in activity.details


def test_quote_verification_against_resume():
    """Verifies that quotes cited in chunks match the original resume text."""
    context = AgentToolContext(
        resume_text=SAMPLE_RESUME_TEXT,
        embedding_service=MockEmbeddingService(),
    )
    params = SearchResumeEvidenceInput(
        claim="PostgreSQL connection pooling",
        technical_topic="PostgreSQL",
    )

    obs, _ = execute_search_resume_evidence(params, context)

    assert obs["found"] is True
    if obs["verified_quotes"]:
        for quote in obs["verified_quotes"]:
            assert quote.lower() in SAMPLE_RESUME_TEXT.lower()


def test_session_isolation_across_candidates():
    """Ensures retrieval in Candidate A's context cannot view or search Candidate B's resume."""
    resume_candidate_a = "Candidate A: 5 years experience with Rust and WebAssembly."
    resume_candidate_b = "Candidate B: 5 years experience with Go and Kafka."

    context_a = AgentToolContext(session_id="sess_a", resume_text=resume_candidate_a, embedding_service=MockEmbeddingService())
    context_b = AgentToolContext(session_id="sess_b", resume_text=resume_candidate_b, embedding_service=MockEmbeddingService())

    # Candidate A searches for Go (present only in Candidate B's resume)
    params_search_go = SearchResumeEvidenceInput(claim="Go and Kafka streaming", technical_topic="Go")
    obs_a, _ = execute_search_resume_evidence(params_search_go, context_a)
    assert obs_a["found"] is False

    # Candidate B searches for Go
    obs_b, _ = execute_search_resume_evidence(params_search_go, context_b)
    assert obs_b["found"] is True


# ============================================================================
# 2. Tool B: Interview History Search Tests
# ============================================================================

def test_get_interview_evidence_topic_filtering():
    """Verifies searching previous interview turns by topic."""
    history = [
        InterviewHistoryItem(
            question_id="q1_intro",
            question_text="Could you introduce yourself?",
            target_skill="Background",
            candidate_answer="I have built web services with FastAPI.",
            composite_score=4.0,
            stage="warm_up",
        ),
        InterviewHistoryItem(
            question_id="q2_db",
            question_text="How did you configure PostgreSQL pooling?",
            target_skill="Database Optimization",
            candidate_answer="We configured asyncpg with max 20 connections.",
            composite_score=4.2,
            stage="project_deep_dive",
        ),
    ]

    current_q = GeneratedQuestion(
        id="q3_cache",
        question="What caching strategy did you use?",
        target_skill="Redis Caching",
        reason="Evaluating caching",
        difficulty="intermediate",
        rubric="Redis TTL",
        stage="technical_depth",
    )

    context = AgentToolContext(
        interview_history=history,
        current_question=current_q,
        last_answer="We used Redis cache-aside with TTL invalidation.",
        last_evaluation=AnswerEvaluationResponse(
            question_id="q3_cache",
            composite_score=4.5,
            percentage_score=88,
            criteria_scores=[],
            evidence_quote=None,
            evidence_verified=True,
            strengths=["Clear TTL explanation"],
            improvements=[],
            overall_feedback="Great answer",
        ),
    )

    # Search for PostgreSQL
    obs_db, activity_db = execute_get_interview_evidence(GetInterviewEvidenceInput(topic="PostgreSQL"), context)
    assert len(obs_db["matching_turns"]) == 1
    assert obs_db["matching_turns"][0]["target_skill"] == "Database Optimization"
    assert "Database Optimization" in obs_db["skills_covered"]

    # Search across all turns
    obs_all, _ = execute_get_interview_evidence(GetInterviewEvidenceInput(topic=None), context)
    assert obs_all["total_turns_completed"] == 3
    assert len(obs_all["skills_covered"]) == 3
    assert obs_all["average_score"] == pytest.approx(4.23, 0.05)


def test_get_interview_evidence_repeated_skills_warning():
    """Verifies warning when a skill has already been tested multiple times."""
    history = [
        InterviewHistoryItem(
            question_id="q1_api",
            question_text="Tell me about FastAPI routing.",
            target_skill="FastAPI",
            candidate_answer="Used APIRouter.",
            composite_score=3.5,
        ),
        InterviewHistoryItem(
            question_id="q2_api",
            question_text="How do you handle dependency injection in FastAPI?",
            target_skill="FastAPI",
            candidate_answer="Used Depends().",
            composite_score=3.8,
        ),
    ]
    context = AgentToolContext(interview_history=history)

    obs, _ = execute_get_interview_evidence(GetInterviewEvidenceInput(), context)
    assert "FastAPI" in obs["repeated_skills"]
    assert obs["warning"] is not None
    assert "Warning: The following skills have already been asked about multiple times: FastAPI" in obs["warning"]


# ============================================================================
# 3. Tool C: Question Planning Tests
# ============================================================================

def test_plan_next_interview_action_valid():
    """Verifies planning a valid difficulty progression when candidate demonstrates mastery."""
    context = AgentToolContext(
        remaining_budget=3,
        max_budget=5,
        last_evaluation=AnswerEvaluationResponse(
            question_id="q2",
            composite_score=4.5,
            percentage_score=88,
            criteria_scores=[],
            evidence_quote=None,
            evidence_verified=True,
            strengths=[],
            improvements=[],
            overall_feedback="Excellent",
        ),
    )
    params = PlanNextInterviewActionInput(
        action="increase_difficulty",
        target_skill="Concurrency and Async Event Loop",
        rationale="Candidate demonstrated strong knowledge; probe async trade-offs.",
    )

    obs, activity = execute_plan_next_interview_action(params, context)

    assert obs["status"] == "approved"
    assert obs["action"] == "increase_difficulty"
    assert obs["recommended_difficulty"] == "advanced"
    assert activity.action == "plan_next_interview_action"
    assert "Increase Difficulty" in activity.summary


def test_plan_next_interview_action_budget_enforcement():
    """Verifies that when remaining budget is 0, action is forced to wrap_up."""
    context = AgentToolContext(remaining_budget=0, max_budget=4)
    params = PlanNextInterviewActionInput(
        action="ask_follow_up",
        target_skill="PostgreSQL",
        rationale="Need to follow up on indexing.",
    )

    obs, activity = execute_plan_next_interview_action(params, context)

    assert obs["status"] == "budget_exhausted"
    assert obs["action"] == "wrap_up"
    assert "Question budget exhausted" in obs["notes"]
    assert "Wrap Up" in activity.summary


# ============================================================================
# 4. Tool Registry Safety & Guardrail Tests
# ============================================================================

def test_registry_rejects_unknown_tool():
    """Verifies that arbitrary or unregistered tools are rejected safely."""
    registry = AgentToolRegistry()
    context = AgentToolContext()

    obs, activity = registry.execute("execute_arbitrary_shell_command", {"command": "ls -la"}, context)

    assert "error" in obs
    assert "Unknown tool" in obs["error"]
    assert activity.action == "execute_arbitrary_shell_command"
    assert "rejected" in activity.details.lower()


def test_registry_rejects_malformed_arguments():
    """Verifies that invalid or missing required parameters are rejected with validation error."""
    registry = AgentToolRegistry()
    context = AgentToolContext()

    # SearchResumeEvidenceInput requires "claim"
    obs, activity = registry.execute("search_resume_evidence", {"technical_topic": "FastAPI"}, context)

    assert "error" in obs
    assert "Invalid arguments" in obs["error"]
    assert "validation failed" in activity.details.lower()


def test_registry_handles_malformed_json_string():
    """Verifies that malformed JSON strings in tool calling do not crash the registry."""
    registry = AgentToolRegistry()
    context = AgentToolContext()

    obs, activity = registry.execute("search_resume_evidence", "{bad_json: missing_quotes", context)

    assert "error" in obs
    assert "Malformed JSON" in obs["error"]
    assert activity.details == "Malformed JSON input"


# ============================================================================
# 5. Agent Decision Loop Integration Tests
# ============================================================================

@pytest.mark.anyio
async def test_agent_decision_loop_with_tool_calling_and_activities():
    """
    Simulates a multi-turn agent decision cycle:
    Turn 1: Model requests tool `search_resume_evidence`.
    Agent loop executes the tool, returns observation.
    Turn 2: Model returns final structured decision.
    Verifies that agent_activities are collected and returned in NextQuestionResponse.
    """
    mock_client = MagicMock()

    # Turn 1: Model invokes search_resume_evidence
    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_resume_1"
    mock_tool_call.function.name = "search_resume_evidence"
    mock_tool_call.function.arguments = json.dumps({
        "claim": "FastAPI microservices",
        "technical_topic": "FastAPI",
    })

    msg_turn1 = MagicMock()
    msg_turn1.tool_calls = [mock_tool_call]
    msg_turn1.content = None

    resp_turn1 = MagicMock()
    resp_turn1.choices = [MagicMock(message=msg_turn1)]

    # Turn 2: Model returns structured decision
    next_q = GeneratedQuestion(
        id="q3_fastapi_deep",
        question="How did you structure background tasks and connection pooling in your FastAPI microservices?",
        target_skill="FastAPI Microservices",
        reason="Verified resume evidence; probing implementation depth.",
        difficulty="intermediate",
        rubric="Async task lifespan and pooling.",
        stage="project_deep_dive",
    )

    decision = RawLLMNextQuestionDecision(
        conversational_stage="project_deep_dive",
        should_follow_up=False,
        decision_reason="Verified candidate claims on FastAPI in resume; proceeding to technical deep dive.",
        acknowledgement="Got it.",
        new_topic_question=next_q,
    )

    msg_turn2 = MagicMock()
    msg_turn2.tool_calls = None
    msg_turn2.content = decision.model_dump_json()

    resp_turn2 = MagicMock()
    resp_turn2.choices = [MagicMock(message=msg_turn2)]

    # Mock client returns resp_turn1, then resp_turn2
    mock_client.chat.completions.create.side_effect = [resp_turn1, resp_turn2]

    service = InterviewService(client=mock_client)

    request = NextQuestionRequest(
        resume_text=SAMPLE_RESUME_TEXT,
        interview_history=[
            InterviewHistoryItem(
                question_id="q1_intro",
                question_text="Tell me about your background.",
                target_skill="Intro",
                candidate_answer="I have built backend services with FastAPI.",
                composite_score=4.0,
            )
        ],
        current_question=GeneratedQuestion(
            id="q2_proj",
            question="Can you describe your project?",
            target_skill="Project Overview",
            reason="Project intro",
            difficulty="foundational",
            rubric="Clarity",
        ),
        last_answer="I architected high-throughput microservices using FastAPI and asyncpg.",
        last_evaluation=AnswerEvaluationResponse(
            question_id="q2_proj",
            composite_score=4.2,
            percentage_score=80,
            criteria_scores=[],
            evidence_quote="FastAPI and asyncpg",
            evidence_verified=True,
            strengths=[],
            improvements=[],
            overall_feedback="Strong",
        ),
        remaining_budget=2,
        max_budget=4,
    )

    response = await service.get_next_question(request)

    assert response.has_next_question is True
    assert response.next_question is not None
    assert response.next_question.id == "q3_fastapi_deep"
    assert response.remaining_budget == 1

    # Verify agent activities were captured and returned
    assert len(response.agent_activities) >= 1
    assert response.agent_activities[0].action == "search_resume_evidence"
    assert "FastAPI" in response.agent_activities[0].summary


@pytest.mark.anyio
async def test_agent_decision_loop_repeated_tool_call_prevention():
    """Verifies that duplicate tool calls with identical inputs are intercepted and skipped."""
    mock_client = MagicMock()

    # Tool call with identical inputs
    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_repeat_1"
    mock_tool_call.function.name = "get_interview_evidence"
    mock_tool_call.function.arguments = json.dumps({"topic": "FastAPI"})

    msg_turn1 = MagicMock()
    msg_turn1.tool_calls = [mock_tool_call, mock_tool_call]  # Duplicate in same batch
    msg_turn1.content = None
    resp_turn1 = MagicMock(choices=[MagicMock(message=msg_turn1)])

    decision = RawLLMNextQuestionDecision(
        conversational_stage="topic_transition",
        should_follow_up=False,
        decision_reason="Transitioning topic.",
        acknowledgement="Makes sense.",
        new_topic_question=GeneratedQuestion(
            id="q3_docker",
            question="How do you configure multi-stage builds in Docker?",
            target_skill="Docker",
            reason="Transitioning",
            difficulty="intermediate",
            rubric="Docker layers",
            stage="topic_transition",
        ),
    )
    msg_turn2 = MagicMock(tool_calls=None, content=decision.model_dump_json())
    resp_turn2 = MagicMock(choices=[MagicMock(message=msg_turn2)])

    mock_client.chat.completions.create.side_effect = [resp_turn1, resp_turn2]

    service = InterviewService(client=mock_client)
    request = NextQuestionRequest(
        interview_history=[],
        current_question=GeneratedQuestion(
            id="q1", question="Intro", target_skill="Intro", reason="", difficulty="foundational", rubric=""
        ),
        last_answer="I am a developer with experience in Python and Docker.",
        last_evaluation=AnswerEvaluationResponse(
            question_id="q1", composite_score=3.5, percentage_score=70, criteria_scores=[],
            evidence_quote=None, evidence_verified=True, strengths=[], improvements=[], overall_feedback="",
        ),
        remaining_budget=2,
        max_budget=4,
    )

    response = await service.get_next_question(request)

    assert response.has_next_question is True
    # One executed, second detected as duplicate and recorded
    assert any("Skipped duplicate" in a.summary for a in response.agent_activities)


@pytest.mark.anyio
async def test_agent_decision_loop_safe_fallback_on_tool_failure():
    """Verifies safe fallback to direct structured output if tool calling raises an exception."""
    mock_client = MagicMock()

    decision = RawLLMNextQuestionDecision(
        conversational_stage="technical_depth",
        should_follow_up=False,
        decision_reason="Fallback decision executed successfully.",
        acknowledgement="Understood.",
        new_topic_question=GeneratedQuestion(
            id="q3_fallback",
            question="What caching trade-offs did you consider?",
            target_skill="Caching",
            reason="Fallback evaluation",
            difficulty="intermediate",
            rubric="Caching trade-offs",
            stage="technical_depth",
        ),
    )

    # First call (with tools) raises an exception (e.g. model unsupported)
    # Second call (structured completion fallback) succeeds
    mock_client.chat.completions.create.side_effect = [
        RuntimeError("Model does not support tools or rate limit encountered"),
        MagicMock(choices=[MagicMock(message=MagicMock(content=decision.model_dump_json()))]),
    ]

    service = InterviewService(client=mock_client)
    request = NextQuestionRequest(
        interview_history=[],
        current_question=GeneratedQuestion(
            id="q1", question="Intro", target_skill="Intro", reason="", difficulty="foundational", rubric=""
        ),
        last_answer="I built microservices using caching and async queues.",
        last_evaluation=AnswerEvaluationResponse(
            question_id="q1", composite_score=3.5, percentage_score=70, criteria_scores=[],
            evidence_quote=None, evidence_verified=True, strengths=[], improvements=[], overall_feedback="",
        ),
        remaining_budget=2,
        max_budget=4,
    )

    response = await service.get_next_question(request)

    assert response.has_next_question is True
    assert response.next_question.id == "q3_fallback"
    assert "Fallback decision executed" in response.decision_reason


@pytest.mark.anyio
async def test_hard_budget_enforcement_skips_llm():
    """Verifies that when remaining budget is 0 or max budget reached, interview finishes without calling LLM."""
    mock_client = MagicMock()
    service = InterviewService(client=mock_client)

    request = NextQuestionRequest(
        interview_history=[
            InterviewHistoryItem(
                question_id=f"q{i}", question_text="Q", target_skill="Skill", candidate_answer="A", composite_score=3.5
            )
            for i in range(1, 5)
        ],
        current_question=GeneratedQuestion(
            id="q5", question="Q5", target_skill="Skill", reason="", difficulty="intermediate", rubric=""
        ),
        last_answer="Final answer given by candidate.",
        last_evaluation=AnswerEvaluationResponse(
            question_id="q5", composite_score=3.5, percentage_score=70, criteria_scores=[],
            evidence_quote=None, evidence_verified=True, strengths=[], improvements=[], overall_feedback="",
        ),
        remaining_budget=0,
        max_budget=5,
    )

    response = await service.get_next_question(request)

    assert response.has_next_question is False
    assert response.is_completed is True
    assert response.remaining_budget == 0
    assert "Interview budget reached" in response.decision_reason
    # LLM chat create was NOT called
    mock_client.chat.completions.create.assert_not_called()


@pytest.mark.anyio
async def test_session_persistence_recovery_with_agent_tools():
    """Verifies SQLite session persistence integration with agent tools."""
    Base.metadata.create_all(bind=engine)
    session_id = "hl_test_agent_sess"

    with SessionLocal() as db:
        # Clean up existing test session if any
        existing = db.query(AssessmentSessionModel).filter_by(id=session_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        # Create session with resume text
        session = AssessmentSessionModel(
            id=session_id,
            status="extracted",
            stage="interview",
            candidate_name="Alice Smith",
            resume_text=SAMPLE_RESUME_TEXT,
        )
        db.add(session)
        db.commit()

    try:
        # Tool context initialized only with session_id (no explicit resume_text)
        # Verify that tool execution recovers resume_text from session db
        from services.interview import _fetch_session_resume_text
        recovered_text = _fetch_session_resume_text(session_id)
        assert recovered_text is not None
        assert "Senior Backend Engineer" in recovered_text

        context = AgentToolContext(session_id=session_id, resume_text=recovered_text, embedding_service=MockEmbeddingService())
        obs, activity = execute_search_resume_evidence(
            SearchResumeEvidenceInput(claim="FastAPI microservices", technical_topic="FastAPI"),
            context,
        )
        assert obs["found"] is True
        assert "FastAPI" in activity.summary
    finally:
        with SessionLocal() as db:
            to_clean = db.query(AssessmentSessionModel).filter_by(id=session_id).first()
            if to_clean:
                db.delete(to_clean)
                db.commit()
