import logging
import os
from io import BytesIO
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from sqlalchemy.orm import Session

from db.database import get_db, init_db
from db.models import AssessmentSessionModel
from schemas.session import (
    CompleteSessionRequest,
    CreateSessionRequest,
    SaveAnswerRequest,
    SaveQuestionsRequest,
    SessionDetailResponse,
    UpdateAnalysisRequest,
    UpdateResumeRequest,
    UpdateStageRequest,
)
from services.session import SessionNotFoundError, SessionService

logger = logging.getLogger("hirelens.main")

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def parse_allowed_origins(origins_str: Optional[str] = None) -> List[str]:
    """
    Parses a comma-separated string of allowed CORS origins.
    Preserves default localhost origins if no input or empty input is provided.
    Rejects and strips wildcard '*' when credentials are enabled to prevent CORS security violations.
    """
    if not origins_str or not origins_str.strip():
        return list(DEFAULT_ALLOWED_ORIGINS)

    parsed = [o.strip() for o in origins_str.split(",") if o.strip()]
    # Security requirement: Never allow wildcard '*' with allow_credentials=True
    sanitized = [o for o in parsed if o != "*"]

    # If all provided origins were invalid or wildcard, fallback to defaults
    if not sanitized:
        logger.warning(
            "ALLOWED_ORIGINS contained only wildcard or invalid entries; "
            "falling back to default localhost origins for security."
        )
        return list(DEFAULT_ALLOWED_ORIGINS)

    return sanitized


# Initialize SQLite database schema
init_db()

app = FastAPI(
    title="HireLens API",
    description="AI-powered recruitment and adaptive interview platform",
    version="0.1.0",
)

allowed_origins = parse_allowed_origins(os.getenv("ALLOWED_ORIGINS"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@app.get("/")
def root():
    return {
        "message": "Welcome to HireLens API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HireLens backend",
    }


@app.post("/api/resumes/extract")
async def extract_resume(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume.",
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File is too large. Maximum size is 5 MB.",
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    try:
        reader = PdfReader(BytesIO(content))

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="Password-protected PDFs are not supported.",
            )

        if len(reader.pages) == 0:
            raise HTTPException(
                status_code=400,
                detail="The PDF contains no pages.",
            )

        if len(reader.pages) > 30:
            raise HTTPException(
                status_code=400,
                detail="The PDF cannot contain more than 30 pages.",
            )

        extracted_text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        ).strip()

        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text was found. "
                    "Scanned PDFs require OCR, which is not implemented yet."
                ),
            )

        session_obj = None
        if session_id:
            try:
                session_obj = session_service.update_resume(
                    db,
                    session_id,
                    UpdateResumeRequest(
                        resume_filename=file.filename,
                        resume_text=extracted_text,
                        resume_page_count=len(reader.pages),
                        resume_character_count=len(extracted_text),
                    ),
                )
            except SessionNotFoundError:
                session_obj = None

        if not session_obj:
            session_obj = session_service.create_session(
                db,
                CreateSessionRequest(
                    resume_filename=file.filename,
                    resume_text=extracted_text,
                    resume_page_count=len(reader.pages),
                    resume_character_count=len(extracted_text),
                ),
            )

        return {
            "filename": file.filename,
            "page_count": len(reader.pages),
            "character_count": len(extracted_text),
            "text": extracted_text,
            "session_id": session_obj.id,
            "status": "success",
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this PDF. Please try another file.",
        )
    finally:
        await file.close()


from schemas.analysis import ResumeAnalysisRequest, ResumeAnalysisResponse
from schemas.interview import (
    AnswerEvaluationRequest,
    AnswerEvaluationResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    QuestionGenerationRequest,
    QuestionGenerationResponse,
    RealtimeSessionRequest,
    RealtimeSessionResponse,
)
from services.analyzer import (
    ResumeAnalyzer,
    LLMConfigurationError,
    LLMProviderError,
)
from services.interview import InterviewService

analyzer = ResumeAnalyzer()
interview_service = InterviewService()


@app.post("/api/resumes/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(request: ResumeAnalysisRequest):
    try:
        result = await analyzer.analyze(
            resume_text=request.resume_text,
            job_description=request.job_description,
        )
        return result
    except LLMConfigurationError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except LLMProviderError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during resume analysis.",
        )


@app.post("/api/interviews/generate-questions", response_model=QuestionGenerationResponse)
async def generate_interview_questions(request: QuestionGenerationRequest):
    try:
        return await interview_service.generate_questions(request)
    except LLMConfigurationError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except LLMProviderError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating interview questions.",
        )


@app.post("/api/interviews/evaluate", response_model=AnswerEvaluationResponse)
async def evaluate_interview_answer(request: AnswerEvaluationRequest):
    try:
        return await interview_service.evaluate_answer(request)
    except LLMConfigurationError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except LLMProviderError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while evaluating candidate answer.",
        )


@app.post("/api/interviews/next-question", response_model=NextQuestionResponse)
async def get_next_interview_question(request: NextQuestionRequest):
    try:
        return await interview_service.get_next_question(request)
    except LLMConfigurationError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except LLMProviderError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while selecting the next interview question.",
        )


@app.post("/api/interviews/realtime-session", response_model=RealtimeSessionResponse)
async def create_realtime_interview_session(request: RealtimeSessionRequest):
    try:
        return await interview_service.create_realtime_session(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while establishing real-time voice session: {str(e)}",
        )


# ----------------- SESSION PERSISTENCE ENDPOINTS -----------------

session_service = SessionService()


@app.post("/api/sessions", response_model=SessionDetailResponse, status_code=201)
def create_assessment_session(
    request: Optional[CreateSessionRequest] = None,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.create_session(db, request)
        return session_service.to_detail_response(session_obj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@app.get("/api/sessions/{session_id}", response_model=SessionDetailResponse)
def get_assessment_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.get_session(db, session_id)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")


@app.put("/api/sessions/{session_id}/resume", response_model=SessionDetailResponse)
def update_session_resume(
    session_id: str,
    request: UpdateResumeRequest,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.update_resume(db, session_id, request)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update session resume: {str(e)}")


@app.put("/api/sessions/{session_id}/analysis", response_model=SessionDetailResponse)
def save_session_analysis(
    session_id: str,
    request: UpdateAnalysisRequest,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.save_analysis(db, session_id, request)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session analysis: {str(e)}")


@app.post("/api/sessions/{session_id}/questions", response_model=SessionDetailResponse)
def save_session_questions(
    session_id: str,
    request: SaveQuestionsRequest,
    db: Session = Depends(get_db),
):
    try:
        session_service.save_questions(db, session_id, request)
        session_obj = session_service.get_session(db, session_id)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save questions: {str(e)}")


@app.post("/api/sessions/{session_id}/answers", response_model=SessionDetailResponse)
def save_session_answer(
    session_id: str,
    request: SaveAnswerRequest,
    db: Session = Depends(get_db),
):
    try:
        session_service.save_answer(db, session_id, request)
        session_obj = session_service.get_session(db, session_id)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save answer: {str(e)}")


@app.put("/api/sessions/{session_id}/stage", response_model=SessionDetailResponse)
def update_session_stage(
    session_id: str,
    request: UpdateStageRequest,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.update_stage(db, session_id, request)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update stage: {str(e)}")


@app.post("/api/sessions/{session_id}/complete", response_model=SessionDetailResponse)
def complete_assessment_session(
    session_id: str,
    request: CompleteSessionRequest,
    db: Session = Depends(get_db),
):
    try:
        session_obj = session_service.complete_session(db, session_id, request)
        return session_service.to_detail_response(session_obj)
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete session: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    server_port = int(os.getenv("PORT", "8000"))
    logger.info("Starting HireLens backend in production mode on 0.0.0.0:%d (workers=1)", server_port)
    uvicorn.run("main:app", host="0.0.0.0", port=server_port, reload=False, workers=1)

