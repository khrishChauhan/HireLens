
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from io import BytesIO

app = FastAPI(
    title="HireLens API",
    description="AI-powered recruitment and adaptive interview platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
async def extract_resume(file: UploadFile = File(...)):
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

        return {
            "filename": file.filename,
            "page_count": len(reader.pages),
            "character_count": len(extracted_text),
            "text": extracted_text,
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
from services.analyzer import (
    ResumeAnalyzer,
    LLMConfigurationError,
    LLMProviderError,
)

analyzer = ResumeAnalyzer()


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

