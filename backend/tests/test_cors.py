import pytest
from fastapi.testclient import TestClient
from main import app, parse_allowed_origins, DEFAULT_ALLOWED_ORIGINS
from db.database import parse_database_url


client = TestClient(app)


class TestCorsOriginParsing:
    """Test suite for CORS origin parsing and security validation."""

    def test_default_origins_when_none(self):
        origins = parse_allowed_origins(None)
        assert origins == DEFAULT_ALLOWED_ORIGINS
        assert "http://localhost:3000" in origins
        assert "http://127.0.0.1:3000" in origins

    def test_default_origins_when_empty_or_whitespace(self):
        assert parse_allowed_origins("") == DEFAULT_ALLOWED_ORIGINS
        assert parse_allowed_origins("   ") == DEFAULT_ALLOWED_ORIGINS

    def test_single_custom_origin(self):
        origins = parse_allowed_origins("https://hirelens.vercel.app")
        assert origins == ["https://hirelens.vercel.app"]

    def test_multiple_comma_separated_origins(self):
        raw = "https://hirelens.vercel.app, https://hirelens.com, http://localhost:3000"
        origins = parse_allowed_origins(raw)
        assert origins == [
            "https://hirelens.vercel.app",
            "https://hirelens.com",
            "http://localhost:3000",
        ]

    def test_strips_empty_entries_and_whitespace(self):
        raw = " https://app.example.com , , https://admin.example.com , "
        origins = parse_allowed_origins(raw)
        assert origins == [
            "https://app.example.com",
            "https://admin.example.com",
        ]

    def test_rejects_wildcard_origin_for_credentials_safety(self):
        # Security invariant: wildcard '*' must never be permitted when credentials are true
        origins = parse_allowed_origins("*")
        assert "*" not in origins
        # Falls back to default safe origins
        assert origins == DEFAULT_ALLOWED_ORIGINS

    def test_strips_trailing_slashes_from_origins(self):
        raw = "https://hire-sliant-six.vercel.app/, https://example.com///"
        origins = parse_allowed_origins(raw)
        assert origins == [
            "https://hire-sliant-six.vercel.app",
            "https://example.com",
        ]

    def test_strips_surrounding_quotes_from_origins(self):
        raw = '"https://hire-sliant-six.vercel.app/", \'https://another.com\''
        origins = parse_allowed_origins(raw)
        assert origins == [
            "https://hire-sliant-six.vercel.app",
            "https://another.com",
        ]

    def test_strips_wildcard_from_mixed_origins(self):
        raw = "https://valid-domain.com, *, https://another-valid.com"
        origins = parse_allowed_origins(raw)
        assert "*" not in origins
        assert origins == ["https://valid-domain.com", "https://another-valid.com"]


class TestCorsMiddlewareIntegration:
    """Integration tests verifying CORS headers on HTTP responses for the demo configuration."""

    def test_demo_cors_preflight_from_deployed_vercel_origin(self):
        """Preflight OPTIONS from the deployed Vercel domain must succeed with 200 OK and wildcard ACAO."""
        response = client.options(
            "/health",
            headers={
                "Origin": "https://hire-sliant-six.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"
        assert response.headers.get("access-control-allow-credentials") is None
        assert "GET" in response.headers.get("access-control-allow-methods", "")

    def test_demo_cors_preflight_post_api_request_from_deployed_vercel_origin(self):
        """Preflight OPTIONS for POST API endpoints must succeed with 200 OK."""
        response = client.options(
            "/api/resumes/extract",
            headers={
                "Origin": "https://hire-sliant-six.vercel.app",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"
        assert "POST" in response.headers.get("access-control-allow-methods", "")

    def test_demo_cors_get_health_from_deployed_vercel_origin(self):
        """GET /health from deployed Vercel domain must succeed and include wildcard ACAO."""
        response = client.get(
            "/health",
            headers={"Origin": "https://hire-sliant-six.vercel.app"},
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"
        assert response.json()["status"] == "healthy"

    def test_demo_cors_post_api_request_from_deployed_vercel_origin(self):
        """POST /api/resumes/extract response must include wildcard ACAO."""
        response = client.post(
            "/api/resumes/extract",
            headers={"Origin": "https://hire-sliant-six.vercel.app"},
        )
        # 422 Unprocessable Entity expected due to missing multipart file payload,
        # but CORS headers must be attached by the middleware
        assert response.status_code == 422
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_demo_cors_get_from_localhost_origin(self):
        """Localhost development frontend continues to work with wildcard ACAO."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_demo_cors_allows_arbitrary_vercel_preview_origin(self):
        """Vercel branch/preview deployments work out-of-the-box without preflight 400 rejection."""
        response = client.options(
            "/health",
            headers={
                "Origin": "https://hirelens-preview-abc123.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_production_cors_preflight_origin_configured_with_trailing_slash(self):
        """Unit test confirming parse_allowed_origins normalizes trailing slashes for future production use."""
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware

        prod_app = FastAPI()
        prod_origins = parse_allowed_origins("https://hire-sliant-six.vercel.app/")
        prod_app.add_middleware(
            CORSMiddleware,
            allow_origins=prod_origins,
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @prod_app.get("/health")
        def health():
            return {"status": "healthy"}

        c = TestClient(prod_app)
        response = c.options(
            "/health",
            headers={
                "Origin": "https://hire-sliant-six.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "https://hire-sliant-six.vercel.app"


class TestDatabaseUrlParsing:
    """Test suite for database URL parsing and normalization."""

    def test_default_sqlite_url(self):
        url = parse_database_url(None)
        assert url.startswith("sqlite:///")
        assert "hirelens.db" in url

    def test_empty_string_defaults_to_sqlite(self):
        url = parse_database_url("   ")
        assert url.startswith("sqlite:///")

    def test_postgres_legacy_url_normalized(self):
        legacy = "postgres://user:secret@db.host.com:5432/hirelens"
        normalized = parse_database_url(legacy)
        assert normalized == "postgresql://user:secret@db.host.com:5432/hirelens"

    def test_postgresql_url_preserved(self):
        pg_url = "postgresql://user:secret@db.host.com:5432/hirelens"
        assert parse_database_url(pg_url) == pg_url


class TestFastEmbedWarmup:
    """Test suite for FastEmbed warmup helper."""

    def test_fastembed_has_warmup_method(self):
        from services.rag.embeddings import FastEmbedEmbeddingService
        service = FastEmbedEmbeddingService()
        assert hasattr(service, "warmup")
        assert callable(service.warmup)
