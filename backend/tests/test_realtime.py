import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from main import app
from schemas.interview import RealtimeSessionRequest
from services.interview import InterviewService

client = TestClient(app)


def test_realtime_session_missing_credentials(monkeypatch):
    """When OPENAI_API_KEY is unset, the endpoint returns status='missing_credentials' with clear guidance."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    response = client.post(
        "/api/interviews/realtime-session",
        json={
            "candidate_name": "Alex Chen",
            "target_role": "Staff Distributed Systems Engineer",
            "candidate_projects": ["HireLens", "CloudStream"],
            "top_project_name": "HireLens",
            "max_budget": 4,
            "remaining_budget": 4,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "missing_credentials"
    assert data["provider"] == "openai"
    assert data["env_variable"] == "OPENAI_API_KEY"
    assert "OPENAI_API_KEY is not configured" in data["message"]
    assert "Alex Chen" in data["instructions"]
    assert "HireLens" in data["instructions"]


def test_realtime_system_prompt_structure():
    """Verify system instructions enforce the 6-stage progressive arc and voice constraints."""
    service = InterviewService()
    req = RealtimeSessionRequest(
        candidate_name="Sarah Miller",
        target_role="Lead Backend Engineer",
        candidate_projects=["NexusDB", "AsyncMesh"],
        top_project_name="NexusDB",
        max_budget=4,
    )

    instructions = service.build_realtime_system_prompt(req)

    # Candidate and role grounding
    assert "Sarah Miller" in instructions
    assert "Lead Backend Engineer" in instructions
    assert "NexusDB" in instructions

    # Progressive stages
    assert "Stage A: Warm-Up" in instructions
    assert "Stage B: Project Overview" in instructions
    assert "Stage C: Deep Dive" in instructions
    assert "Stage D/E: Transition & Depth" in instructions
    assert "Stage F: Conclusion" in instructions

    # Crucial voice conversation rules
    assert "SPOKEN CONCISENESS" in instructions
    assert "ONE QUESTION AT A TIME" in instructions
    assert "HANDLE INTERRUPTIONS" in instructions
    assert "NO EVALUATION SPOILERS" in instructions


@pytest.mark.anyio
async def test_realtime_session_active_with_mock_provider(monkeypatch):
    """When OPENAI_API_KEY is configured and provider succeeds, returns ephemeral client_secret."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-test-mock-realtime-key")

    mock_resp_data = {
        "id": "sess_mock_12345",
        "object": "realtime.session",
        "model": "gpt-4o-realtime-preview-2024-12-17",
        "client_secret": {
            "value": "ek_mock_ephemeral_client_secret_998877",
            "expires_at": 1729000000,
        },
    }

    class MockResponse:
        status_code = 200

        def json(self):
            return mock_resp_data

    service = InterviewService()
    req = RealtimeSessionRequest(
        candidate_name="Alex Chen",
        top_project_name="HireLens",
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MockResponse()
        result = await service.create_realtime_session(req)

        assert result.status == "active"
        assert result.client_secret == "ek_mock_ephemeral_client_secret_998877"
        assert result.session_id == "sess_mock_12345"
        assert result.provider == "openai"


@pytest.mark.anyio
async def test_realtime_session_provider_error(monkeypatch):
    """When OpenAI returns an error, returns provider_error with response details."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-invalid-key")

    class MockErrorResponse:
        status_code = 401
        text = '{"error": {"message": "Incorrect API key provided"}}'

        def json(self):
            return {"error": {"message": "Incorrect API key provided"}}

    service = InterviewService()
    req = RealtimeSessionRequest(candidate_name="Alex Chen")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MockErrorResponse()
        result = await service.create_realtime_session(req)

        assert result.status == "provider_error"
        assert result.client_secret is None
        assert "OpenAI Realtime API error (401)" in result.message
