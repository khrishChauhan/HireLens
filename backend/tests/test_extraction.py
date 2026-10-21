import io
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_extract_invalid_extension():
    response = client.post(
        "/api/resumes/extract",
        files={"file": ("resume.docx", b"some text content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 400
    assert "Please upload a PDF resume" in response.json()["detail"]


def test_extract_invalid_pdf_magic_bytes():
    response = client.post(
        "/api/resumes/extract",
        files={"file": ("fake.pdf", b"NOT_A_PDF_CONTENT", "application/pdf")},
    )
    assert response.status_code == 400
    assert "not a valid PDF" in response.json()["detail"]


def test_extract_file_too_large():
    large_content = b"%PDF-" + b"0" * (5 * 1024 * 1024 + 10)
    response = client.post(
        "/api/resumes/extract",
        files={"file": ("huge.pdf", large_content, "application/pdf")},
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()
