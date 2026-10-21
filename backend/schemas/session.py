from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from schemas.interview import (
    AnswerEvaluationResponse,
    GeneratedQuestion,
)


class CreateSessionRequest(BaseModel):
    candidate_name: Optional[str] = Field(default=None, description="Candidate name if provided")
    target_role: Optional[str] = Field(default=None, description="Target job title or role")
    resume_filename: Optional[str] = Field(default=None, description="Uploaded PDF file name")
    resume_text: Optional[str] = Field(default=None, description="Extracted resume text")
    resume_page_count: Optional[int] = Field(default=None, description="Number of pages in resume")
    resume_character_count: Optional[int] = Field(default=None, description="Character count")
    job_description: Optional[str] = Field(default=None, description="Target job description")


class UpdateResumeRequest(BaseModel):
    resume_filename: str = Field(..., description="PDF filename")
    resume_text: str = Field(..., description="Extracted text")
    resume_page_count: Optional[int] = Field(default=1, description="Page count")
    resume_character_count: Optional[int] = Field(default=0, description="Character count")


class UpdateAnalysisRequest(BaseModel):
    analysis_result: Dict[str, Any] = Field(..., description="Full structured ResumeAnalysisResponse dictionary")
    job_description: Optional[str] = Field(default=None, description="Job description text")


class SaveQuestionsRequest(BaseModel):
    questions: List[GeneratedQuestion] = Field(..., description="List of generated technical questions")


class SaveAnswerRequest(BaseModel):
    question: GeneratedQuestion = Field(..., description="Question answered")
    answer_text: str = Field(..., min_length=1, description="Candidate answer text")
    evaluation: AnswerEvaluationResponse = Field(..., description="Answer evaluation result")
    timestamp: Optional[str] = Field(default=None, description="Formatted local timestamp")


class UpdateStageRequest(BaseModel):
    stage: Literal["upload", "analysis", "interview", "results"] = Field(..., description="Target UI stage")
    status: Optional[str] = Field(default=None, description="Optional backend lifecycle status")


class CompleteSessionRequest(BaseModel):
    report_markdown: str = Field(..., description="Generated markdown assessment report")
    resume_match_score: Optional[int] = Field(default=None, description="Final resume alignment score")
    interview_composite_score: Optional[float] = Field(default=None, description="Final interview composite score")
    interview_percentage_score: Optional[int] = Field(default=None, description="Final interview percentage")


class SavedAnswerItem(BaseModel):
    question: GeneratedQuestion
    answerText: str
    evaluation: AnswerEvaluationResponse
    timestamp: str


class SessionDetailResponse(BaseModel):
    session_id: str
    status: str
    stage: str
    candidate_name: Optional[str] = None
    candidate_title: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None
    job_description: Optional[str] = None
    analysis_result: Optional[Dict[str, Any]] = None
    questions: List[GeneratedQuestion] = Field(default_factory=list)
    evaluated_answers: List[SavedAnswerItem] = Field(default_factory=list)
    final_report: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    api_status: Literal["success"] = "success"
