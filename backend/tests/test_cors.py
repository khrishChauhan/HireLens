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

    def test_strips_wildcard_from_mixed_origins(self):
        raw = "https://valid-domain.com, *, https://another-valid.com"
        origins = parse_allowed_origins(raw)
        assert "*" not in origins
        assert origins == ["https://valid-domain.com", "https://another-valid.com"]


class TestCorsMiddlewareIntegration:
    """Integration tests verifying CORS headers on HTTP responses."""

    def test_cors_preflight_allowed_origin(self):
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_cors_get_allowed_origin(self):
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_cors_disallowed_origin(self):
        response = client.get(
            "/health",
            headers={"Origin": "https://malicious-unauthorized-site.com"},
        )
        assert response.status_code == 200
        # Disallowed origin must not receive Access-Control-Allow-Origin matching the malicious site
        assert response.headers.get("access-control-allow-origin") != "https://malicious-unauthorized-site.com"


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
