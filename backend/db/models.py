from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from db.database import Base


def utc_now() -> datetime:
    """Returns current UTC datetime."""
    return datetime.now(timezone.utc)


class AssessmentSessionModel(Base):
    """
    Main entity representing a candidate assessment session.
    Tracks overall progress across the 4 stages (upload, analysis, interview, results).
    """
    __tablename__ = "assessment_sessions"

    id = Column(String(64), primary_key=True, index=True)
    status = Column(String(32), default="created", nullable=False, index=True)
    stage = Column(String(32), default="upload", nullable=False)

    candidate_name = Column(String(255), nullable=True)
    candidate_title = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True)

    resume_filename = Column(String(255), nullable=True)
    resume_text = Column(Text, nullable=True)
    resume_page_count = Column(Integer, nullable=True)
    resume_character_count = Column(Integer, nullable=True)

    job_description = Column(Text, nullable=True)

    resume_match_score = Column(Integer, nullable=True)
    interview_composite_score = Column(Float, nullable=True)
    interview_percentage_score = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    analysis_record = relationship(
        "AnalysisResultModel",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )
    questions = relationship(
        "InterviewQuestionModel",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewQuestionModel.order_index",
    )
    answers = relationship(
        "CandidateAnswerModel",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="CandidateAnswerModel.created_at",
    )
    final_report = relationship(
        "FinalReportModel",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AnalysisResultModel(Base):
    """
    Persisted RAG resume analysis results linked to an assessment session.
    """
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    match_score = Column(Integer, nullable=False)
    raw_analysis = Column(Text, nullable=False)  # JSON-serialized RealResumeAnalysisResponse

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    session = relationship("AssessmentSessionModel", back_populates="analysis_record")


class InterviewQuestionModel(Base):
    """
    Generated interview questions associated with a session.
    """
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = Column(String(64), nullable=False)
    question_text = Column(Text, nullable=False)
    target_skill = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    difficulty = Column(String(32), default="intermediate", nullable=False)
    rubric = Column(Text, nullable=False)
    is_follow_up = Column(Boolean, default=False, nullable=False)
    parent_question_id = Column(String(64), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    stage = Column(String(32), default="technical_depth", nullable=True)
    acknowledgement = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("AssessmentSessionModel", back_populates="questions")


class CandidateAnswerModel(Base):
    """
    Candidate answer submissions and evaluation results.
    """
    __tablename__ = "candidate_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = Column(String(64), nullable=False)
    answer_text = Column(Text, nullable=False)
    composite_score = Column(Float, nullable=False)
    percentage_score = Column(Integer, nullable=False)
    evidence_quote = Column(Text, nullable=True)
    evidence_verified = Column(Boolean, default=False, nullable=False)
    raw_evaluation = Column(Text, nullable=False)  # JSON-serialized AnswerEvaluationResponse

    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("AssessmentSessionModel", back_populates="answers")


class FinalReportModel(Base):
    """
    Final consolidated assessment report and audit summary.
    """
    __tablename__ = "final_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    resume_match_score = Column(Integer, nullable=False)
    interview_composite_score = Column(Float, nullable=False)
    interview_percentage_score = Column(Integer, nullable=False)
    report_markdown = Column(Text, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("AssessmentSessionModel", back_populates="final_report")
