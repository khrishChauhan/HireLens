import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from main import app
from schemas.analysis import (
    EducationItem,
    LLMAnalysisOutput,
    ProjectItem,
    RequirementMatch,
    SkillCategory,
    WorkExperienceItem,
)
from services.analyzer import (
    LLMConfigurationError,
    LLMProviderError,
    ResumeAnalyzer,
)
from services.rubric import calculate_deterministic_score

client = TestClient(app)


# ============================================================================
# 1. Deterministic Scoring Rubric Unit Tests
# ============================================================================

def test_rubric_empty_requirements():
    score, breakdown = calculate_deterministic_score([])
    assert score == 0
    assert breakdown.total_requirements == 0
    assert breakdown.percentage == 0
    assert "No explicit requirements" in breakdown.limitations


def test_rubric_perfect_match():
    matches = [
        RequirementMatch(
            requirement="Python expertise",
            status="matched",
            evidence="6+ years writing Python",
            explanation="Explicit match in experience section",
            is_inferred=False,
        ),
        RequirementMatch(
            requirement="React experience",
            status="matched",
            evidence="Built React 19 apps",
            explanation="Explicit match in projects",
            is_inferred=False,
        ),
    ]
    score, breakdown = calculate_deterministic_score(matches)
    assert score == 100
    assert breakdown.total_requirements == 2
    assert breakdown.matched_count == 2
    assert breakdown.partially_matched_count == 0
    assert breakdown.not_demonstrated_count == 0
    assert breakdown.percentage == 100


def test_rubric_mixed_evaluation():
    matches = [
        RequirementMatch(
            requirement="FastAPI microservices",
            status="matched",
            evidence="Architected async services in FastAPI",
            explanation="Direct match",
            is_inferred=False,
        ),
        RequirementMatch(
            requirement="Distributed caching with Redis",
            status="partially_matched",
            evidence="Used Redis sliding-window deduping",
            explanation="Partial match, used for deduping rather than distributed clustering",
            is_inferred=True,
        ),
        RequirementMatch(
            requirement="Kubernetes cluster orchestration",
            status="not_demonstrated",
            evidence=None,
            explanation="Not mentioned anywhere in resume text",
            is_inferred=False,
        ),
        RequirementMatch(
            requirement="PostgreSQL schema design",
            status="not_demonstrated",
            evidence=None,
            explanation="No direct mention of relational schema modeling",
            is_inferred=False,
        ),
    ]
    # Points: 1.0 (matched) + 0.5 (partial) + 0.0 + 0.0 = 1.5 / 4 = 37.5% -> rounds to 38%
    score, breakdown = calculate_deterministic_score(matches)
    assert score == 38
    assert breakdown.total_requirements == 4
    assert breakdown.matched_count == 1
    assert breakdown.partially_matched_count == 1
    assert breakdown.not_demonstrated_count == 2
    assert breakdown.raw_points == 1.5
    assert "keyword and experience overlap" in breakdown.limitations


def test_rubric_zero_match():
    matches = [
        RequirementMatch(
            requirement="Cobol mainframe maintenance",
            status="not_demonstrated",
            evidence=None,
            explanation="Not evidenced",
            is_inferred=False,
        )
    ]
    score, breakdown = calculate_deterministic_score(matches)
    assert score == 0
    assert breakdown.percentage == 0
    assert breakdown.not_demonstrated_count == 1


# ============================================================================
# 2. Input Validation Tests (Pydantic Length and Presence Constraints)
# ============================================================================

def test_empty_resume_text_validation():
    response = client.post(
        "/api/resumes/analyze",
        json={"resume_text": "", "job_description": "Valid job description here that has sufficient length."},
    )
    assert response.status_code == 422


def test_short_resume_text_validation():
    response = client.post(
        "/api/resumes/analyze",
        json={"resume_text": "Too short", "job_description": "Valid job description here that has sufficient length."},
    )
    assert response.status_code == 422


def test_empty_job_description_validation():
    response = client.post(
        "/api/resumes/analyze",
        json={"resume_text": "A valid resume with plenty of detailed text explaining technical skills.", "job_description": ""},
    )
    assert response.status_code == 422


# ============================================================================
# 3. Missing Groq Provider Configuration Tests
# ============================================================================

def test_missing_api_key_configuration():
    analyzer = ResumeAnalyzer(api_key="", client=None)
    with pytest.raises(LLMConfigurationError) as exc_info:
        analyzer.get_client()
    assert "GROQ_API_KEY in backend/.env" in str(exc_info.value)
    assert "console.groq.com" in str(exc_info.value)


# ============================================================================
# 4. Valid Structured Analysis with Mocked Groq Client
# ============================================================================

@pytest.mark.anyio
async def test_valid_structured_analysis_mocked():
    mock_output = LLMAnalysisOutput(
        candidate_name="Alex Vance",
        candidate_title="Senior Systems & Full-Stack Engineer",
        profile_summary="Senior engineer with 6+ years specializing in distributed Python backend and React frontends.",
        skills_by_category=[
            SkillCategory(category="Languages", skills=["Python", "TypeScript"]),
            SkillCategory(category="Frameworks", skills=["FastAPI", "React 19"]),
        ],
        education=[
            EducationItem(degree="B.S. in Computer Science", institution="University of Washington", year="2020")
        ],
        work_experience=[
            WorkExperienceItem(
                role="Senior Software Engineer",
                company="Apex Cloud Platforms",
                duration="2023 - Present",
                description="Built high-throughput async event microservices in FastAPI.",
                key_achievements=["Achieved 42% latency reduction in p99 metrics"],
            )
        ],
        projects=[
            ProjectItem(
                name="HireLens Assessment OS",
                description="Adaptive interview platform",
                technologies=["FastAPI", "Next.js"],
            )
        ],
        job_requirements=[
            "Experience with FastAPI microservices",
            "Modern React & TypeScript expertise",
            "Production Kubernetes orchestration",
        ],
        requirement_matches=[
            RequirementMatch(
                requirement="Experience with FastAPI microservices",
                status="matched",
                evidence="Architected async data processing microservices in FastAPI",
                explanation="Direct verified match in work history",
                is_inferred=False,
            ),
            RequirementMatch(
                requirement="Modern React & TypeScript expertise",
                status="matched",
                evidence="Redesigned client portal with React 19 and strict TypeScript",
                explanation="Direct verified match",
                is_inferred=False,
            ),
            RequirementMatch(
                requirement="Production Kubernetes orchestration",
                status="not_demonstrated",
                evidence=None,
                explanation="No evidence of Kubernetes cluster management found in resume",
                is_inferred=False,
            ),
        ],
        uncertainty_notes=[
            "No details provided on database replication topologies.",
        ],
    )

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = mock_output.model_dump_json()
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    analyzer = ResumeAnalyzer(client=mock_client)
    result = await analyzer.analyze(
        resume_text="Alex Vance resume text with sufficient length for testing.",
        job_description="Target job description with sufficient length for testing.",
    )

    assert result.candidate_name == "Alex Vance"
    assert result.candidate_title == "Senior Systems & Full-Stack Engineer"
    assert len(result.skills_by_category) == 2
    assert "FastAPI" in result.all_skills
    assert len(result.matched_requirements) == 2
    assert len(result.partially_matched_requirements) == 0
    assert len(result.unmatched_requirements) == 1
    assert result.unmatched_requirements[0].evidence is None
    # 2 matched out of 3 = 66.67% -> rounds to 67%
    assert result.match_score == 67
    assert result.scoring_breakdown.matched_count == 2
    assert result.scoring_breakdown.not_demonstrated_count == 1
    assert len(result.uncertainty_notes) == 1


# ============================================================================
# 5. Invalid Model Response & Rate Limiting Error Handling
# ============================================================================

@pytest.mark.anyio
async def test_invalid_model_response():
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "This is not valid JSON and violates schema"
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    analyzer = ResumeAnalyzer(client=mock_client)
    with pytest.raises(LLMProviderError) as exc_info:
        await analyzer.analyze("Sample resume text with sufficient length for test.", "Sample job description with sufficient length.")
    assert "schema" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()


@pytest.mark.anyio
async def test_rate_limit_error_handling():
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("429 Rate limit reached")

    analyzer = ResumeAnalyzer(client=mock_client)
    with pytest.raises(LLMProviderError) as exc_info:
        await analyzer.analyze("Sample resume text with sufficient length for test.", "Sample job description with sufficient length.")
    assert "rate limit" in str(exc_info.value).lower()
