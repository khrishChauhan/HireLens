import json
import logging
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from db.models import (
    AnalysisResultModel,
    AssessmentSessionModel,
    CandidateAnswerModel,
    FinalReportModel,
    InterviewQuestionModel,
)
from schemas.interview import (
    AnswerEvaluationResponse,
    GeneratedQuestion,
)
from schemas.session import (
    CompleteSessionRequest,
    CreateSessionRequest,
    SavedAnswerItem,
    SaveAnswerRequest,
    SaveQuestionsRequest,
    SessionDetailResponse,
    UpdateAnalysisRequest,
    UpdateResumeRequest,
    UpdateStageRequest,
)

logger = logging.getLogger("hirelens.session")


class SessionNotFoundError(Exception):
    """Raised when the specified session ID does not exist."""
    pass


class SessionService:
    """
    Service managing persistence, transactional updates, and recovery of assessment sessions.
    """

    def create_session(
        self,
        db: Session,
        req: Optional[CreateSessionRequest] = None,
    ) -> AssessmentSessionModel:
        session_id = f"hl_{uuid.uuid4().hex[:16]}"
        session = AssessmentSessionModel(
            id=session_id,
            status="created",
            stage="upload",
            candidate_name=req.candidate_name if req else None,
            target_role=req.target_role if req else None,
            resume_filename=req.resume_filename if req else None,
            resume_text=req.resume_text if req else None,
            resume_page_count=req.resume_page_count if req else None,
            resume_character_count=req.resume_character_count if req else None,
            job_description=req.job_description if req else None,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info("Created new assessment session %s", session_id)
        return session

    def get_session(self, db: Session, session_id: str) -> AssessmentSessionModel:
        session = db.query(AssessmentSessionModel).filter_by(id=session_id).first()
        if not session:
            raise SessionNotFoundError(f"Assessment session '{session_id}' not found.")
        return session

    def update_resume(
        self,
        db: Session,
        session_id: str,
        req: UpdateResumeRequest,
    ) -> AssessmentSessionModel:
        session = self.get_session(db, session_id)
        session.resume_filename = req.resume_filename
        session.resume_text = req.resume_text
        session.resume_page_count = req.resume_page_count
        session.resume_character_count = req.resume_character_count
        session.status = "extracted"
        db.commit()
        db.refresh(session)
        return session

    def save_analysis(
        self,
        db: Session,
        session_id: str,
        req: UpdateAnalysisRequest,
    ) -> AssessmentSessionModel:
        session = self.get_session(db, session_id)
        analysis_data = req.analysis_result

        candidate_name = analysis_data.get("candidate_name") or session.candidate_name
        candidate_title = analysis_data.get("candidate_title") or session.candidate_title
        match_score = int(analysis_data.get("match_score", 0))

        session.candidate_name = candidate_name
        session.candidate_title = candidate_title
        session.resume_match_score = match_score
        session.status = "analysis_complete"
        session.stage = "analysis"
        if req.job_description:
            session.job_description = req.job_description

        # Upsert analysis record
        existing_analysis = db.query(AnalysisResultModel).filter_by(session_id=session_id).first()
        raw_json_str = json.dumps(analysis_data)
        if existing_analysis:
            existing_analysis.match_score = match_score
            existing_analysis.raw_analysis = raw_json_str
        else:
            analysis_rec = AnalysisResultModel(
                session_id=session_id,
                match_score=match_score,
                raw_analysis=raw_json_str,
            )
            db.add(analysis_rec)

        db.commit()
        db.refresh(session)
        logger.info("Saved analysis for session %s (Score: %d%%)", session_id, match_score)
        return session

    def save_questions(
        self,
        db: Session,
        session_id: str,
        req: SaveQuestionsRequest,
    ) -> List[InterviewQuestionModel]:
        session = self.get_session(db, session_id)
        existing_q_ids = {
            q.question_id
            for q in db.query(InterviewQuestionModel).filter_by(session_id=session_id).all()
        }

        saved_records = []
        current_count = len(existing_q_ids)
        for idx, q in enumerate(req.questions):
            if q.id in existing_q_ids:
                continue
            question_model = InterviewQuestionModel(
                session_id=session_id,
                question_id=q.id,
                question_text=q.question,
                target_skill=q.target_skill,
                reason=q.reason,
                difficulty=q.difficulty,
                rubric=q.rubric,
                is_follow_up=q.is_follow_up,
                order_index=current_count + idx,
            )
            db.add(question_model)
            saved_records.append(question_model)
            existing_q_ids.add(q.id)

        db.commit()
        return saved_records

    def save_answer(
        self,
        db: Session,
        session_id: str,
        req: SaveAnswerRequest,
    ) -> CandidateAnswerModel:
        session = self.get_session(db, session_id)

        # Ensure question exists in questions table
        existing_q = (
            db.query(InterviewQuestionModel)
            .filter_by(session_id=session_id, question_id=req.question.id)
            .first()
        )
        if not existing_q:
            q_model = InterviewQuestionModel(
                session_id=session_id,
                question_id=req.question.id,
                question_text=req.question.question,
                target_skill=req.question.target_skill,
                reason=req.question.reason,
                difficulty=req.question.difficulty,
                rubric=req.question.rubric,
                is_follow_up=req.question.is_follow_up,
                order_index=len(session.questions),
            )
            db.add(q_model)

        raw_eval_json = req.evaluation.model_dump_json()

        # Check for existing answer for this question (idempotency)
        existing_ans = (
            db.query(CandidateAnswerModel)
            .filter_by(session_id=session_id, question_id=req.question.id)
            .first()
        )
        if existing_ans:
            existing_ans.answer_text = req.answer_text
            existing_ans.composite_score = req.evaluation.composite_score
            existing_ans.percentage_score = req.evaluation.percentage_score
            existing_ans.evidence_quote = req.evaluation.evidence_quote
            existing_ans.evidence_verified = req.evaluation.evidence_verified
            existing_ans.raw_evaluation = raw_eval_json
            ans_record = existing_ans
        else:
            ans_record = CandidateAnswerModel(
                session_id=session_id,
                question_id=req.question.id,
                answer_text=req.answer_text,
                composite_score=req.evaluation.composite_score,
                percentage_score=req.evaluation.percentage_score,
                evidence_quote=req.evaluation.evidence_quote,
                evidence_verified=req.evaluation.evidence_verified,
                raw_evaluation=raw_eval_json,
            )
            db.add(ans_record)

        session.stage = "interview"
        session.status = "interviewing"
        db.commit()
        db.refresh(ans_record)
        return ans_record

    def update_stage(
        self,
        db: Session,
        session_id: str,
        req: UpdateStageRequest,
    ) -> AssessmentSessionModel:
        session = self.get_session(db, session_id)
        session.stage = req.stage
        if req.status:
            session.status = req.status
        db.commit()
        db.refresh(session)
        return session

    def complete_session(
        self,
        db: Session,
        session_id: str,
        req: CompleteSessionRequest,
    ) -> AssessmentSessionModel:
        session = self.get_session(db, session_id)
        session.status = "completed"
        session.stage = "results"

        # Compute or update scores
        if req.resume_match_score is not None:
            session.resume_match_score = req.resume_match_score
        if req.interview_composite_score is not None:
            session.interview_composite_score = req.interview_composite_score
        if req.interview_percentage_score is not None:
            session.interview_percentage_score = req.interview_percentage_score

        # Save or update final report
        existing_report = db.query(FinalReportModel).filter_by(session_id=session_id).first()
        resume_score = session.resume_match_score or 0
        comp_score = session.interview_composite_score or 0.0
        pct_score = session.interview_percentage_score or 0

        if existing_report:
            existing_report.resume_match_score = resume_score
            existing_report.interview_composite_score = comp_score
            existing_report.interview_percentage_score = pct_score
            existing_report.report_markdown = req.report_markdown
        else:
            report_model = FinalReportModel(
                session_id=session_id,
                resume_match_score=resume_score,
                interview_composite_score=comp_score,
                interview_percentage_score=pct_score,
                report_markdown=req.report_markdown,
            )
            db.add(report_model)

        db.commit()
        db.refresh(session)
        return session

    def to_detail_response(self, session: AssessmentSessionModel) -> SessionDetailResponse:
        # Build resume data dict if extracted
        resume_data = None
        if session.resume_filename or session.resume_text:
            resume_data = {
                "name": session.resume_filename or "Resume.pdf",
                "extractedText": session.resume_text or "",
                "pageCount": session.resume_page_count or 1,
                "characterCount": session.resume_character_count or len(session.resume_text or ""),
                "isExtracted": bool(session.resume_text),
            }

        # Build analysis_result dict if present
        analysis_dict = None
        if session.analysis_record and session.analysis_record.raw_analysis:
            try:
                analysis_dict = json.loads(session.analysis_record.raw_analysis)
            except Exception:
                analysis_dict = None

        # Build questions list
        questions = [
            GeneratedQuestion(
                id=q.question_id,
                question=q.question_text,
                target_skill=q.target_skill,
                reason=q.reason or "",
                difficulty=q.difficulty,  # type: ignore[arg-type]
                rubric=q.rubric,
                is_follow_up=q.is_follow_up,
            )
            for q in session.questions
        ]

        # Build evaluated answers list
        q_map = {q.question_id: q for q in session.questions}
        evaluated_answers = []
        for ans in session.answers:
            q_info = q_map.get(ans.question_id)
            if not q_info:
                # Reconstruct question from answer if question not found
                q_obj = GeneratedQuestion(
                    id=ans.question_id,
                    question=f"Question on {ans.question_id}",
                    target_skill="Technical Competency",
                    reason="Assessed interview question",
                    difficulty="intermediate",
                    rubric="Technical evaluation rubric",
                    is_follow_up=False,
                )
            else:
                q_obj = GeneratedQuestion(
                    id=q_info.question_id,
                    question=q_info.question_text,
                    target_skill=q_info.target_skill,
                    reason=q_info.reason or "",
                    difficulty=q_info.difficulty,  # type: ignore[arg-type]
                    rubric=q_info.rubric,
                    is_follow_up=q_info.is_follow_up,
                )

            try:
                eval_dict = json.loads(ans.raw_evaluation)
                eval_obj = AnswerEvaluationResponse(**eval_dict)
            except Exception:
                continue

            evaluated_answers.append(
                SavedAnswerItem(
                    question=q_obj,
                    answerText=ans.answer_text,
                    evaluation=eval_obj,
                    timestamp=ans.created_at.strftime("%I:%M %p"),
                )
            )

        # Build final report dict if present
        final_report = None
        if session.final_report:
            final_report = {
                "resume_match_score": session.final_report.resume_match_score,
                "interview_composite_score": session.final_report.interview_composite_score,
                "interview_percentage_score": session.final_report.interview_percentage_score,
                "report_markdown": session.final_report.report_markdown,
                "created_at": session.final_report.created_at.isoformat(),
            }

        return SessionDetailResponse(
            session_id=session.id,
            status=session.status,
            stage=session.stage,
            candidate_name=session.candidate_name,
            candidate_title=session.candidate_title,
            resume_data=resume_data,
            job_description=session.job_description,
            analysis_result=analysis_dict,
            questions=questions,
            evaluated_answers=evaluated_answers,
            final_report=final_report,
            created_at=session.created_at,
            updated_at=session.updated_at,
            api_status="success",
        )
