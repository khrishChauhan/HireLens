'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AssessmentHeader } from '@/components/assessment/AssessmentHeader';
import { ProgressIndicator } from '@/components/assessment/ProgressIndicator';
import { StageUpload } from '@/components/assessment/StageUpload';
import { StageAnalysis } from '@/components/assessment/StageAnalysis';
import { StageInterview } from '@/components/assessment/StageInterview';
import { StageResults } from '@/components/assessment/StageResults';
import {
  AssessmentStage,
  ResumeData,
  InterviewAnswer,
  RealResumeAnalysisResponse,
  EvaluatedAnswerRecord,
} from '@/lib/assessment-types';
import {
  getSession,
  saveSessionAnalysis,
  saveSessionAnswer,
  updateSessionStage,
} from '@/lib/api';

const SESSION_STORAGE_KEY = 'hirelens_session_id';

export default function AssessmentWorkspacePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<AssessmentStage>('upload');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<RealResumeAnalysisResponse | null>(null);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<EvaluatedAnswerRecord[]>([]);
  const [isRestoring, setIsRestoring] = useState<boolean>(
    () => typeof window !== 'undefined' && Boolean(localStorage.getItem(SESSION_STORAGE_KEY))
  );

  // Restore session from SQLite on page load / browser refresh
  useEffect(() => {
    let ignore = false;
    const savedSessionId =
      typeof window !== 'undefined'
        ? localStorage.getItem(SESSION_STORAGE_KEY)
        : null;

    if (!savedSessionId) return;

    async function recoverSession() {
      try {
        const session = await getSession(savedSessionId!);
        if (ignore) return;

        setSessionId(session.session_id);
        setStage(session.stage);

        if (session.resume_data) {
          setResumeData({
            file: null,
            name: session.resume_data.name,
            size: `${(session.resume_data.characterCount / 1000).toFixed(1)} KB`,
            rawSize: session.resume_data.characterCount,
            extractedText: session.resume_data.extractedText,
            pageCount: session.resume_data.pageCount,
            characterCount: session.resume_data.characterCount,
            isExtracted: session.resume_data.isExtracted,
            sessionId: session.session_id,
          });
        }

        if (session.analysis_result) {
          setAnalysisResult(session.analysis_result);
        }

        if (session.evaluated_answers && session.evaluated_answers.length > 0) {
          setEvaluatedAnswers(session.evaluated_answers);
          setAnswers(
            session.evaluated_answers.map((rec) => ({
              questionId: rec.question.id,
              questionText: rec.question.question,
              topic: rec.question.target_skill,
              answerText: rec.answerText,
              timestamp: rec.timestamp,
            }))
          );
        }
      } catch (err) {
        console.warn('Session expired or unavailable in SQLite, resetting to upload:', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (!ignore) setIsRestoring(false);
      }
    }

    recoverSession();

    return () => {
      ignore = true;
    };
  }, []);

  // Stage transitions with SQLite session synchronization
  const handleResumeSelected = (data: ResumeData) => {
    setResumeData(data);
    if (data.sessionId) {
      setSessionId(data.sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      updateSessionStage(data.sessionId, 'upload').catch(() => {});
    }
    setAnalysisResult(null);
    setAnswers([]);
    setEvaluatedAnswers([]);
  };

  const handleResumeRemoved = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setResumeData(null);
    setAnalysisResult(null);
    setAnswers([]);
    setEvaluatedAnswers([]);
  };

  const handleStartAnalysis = () => {
    setStage('analysis');
    if (sessionId) {
      updateSessionStage(sessionId, 'analysis').catch(() => {});
    }
  };

  const handleBackToUpload = () => {
    setStage('upload');
    if (sessionId) {
      updateSessionStage(sessionId, 'upload').catch(() => {});
    }
  };

  const handleAnalysisComplete = (result: RealResumeAnalysisResponse) => {
    setAnalysisResult(result);
    if (sessionId) {
      saveSessionAnalysis(sessionId, result).catch((err) =>
        console.warn('Failed to save analysis to session:', err)
      );
    }
  };

  const handleStartInterview = () => {
    if (!analysisResult) return;
    setStage('interview');
    if (sessionId) {
      updateSessionStage(sessionId, 'interview').catch(() => {});
    }
  };

  const handleAnswerEvaluated = (record: EvaluatedAnswerRecord) => {
    setEvaluatedAnswers((prev) => [...prev, record]);
    setAnswers((prev) => [
      ...prev,
      {
        questionId: record.question.id,
        questionText: record.question.question,
        topic: record.question.target_skill,
        answerText: record.answerText,
        timestamp: record.timestamp,
      },
    ]);
    if (sessionId) {
      saveSessionAnswer(sessionId, record).catch((err) =>
        console.warn('Failed to save answer to session:', err)
      );
    }
  };

  const handleInterviewCompleted = () => {
    setStage('results');
    if (sessionId) {
      updateSessionStage(sessionId, 'results').catch(() => {});
    }
  };

  const handleEndEarly = () => {
    setStage('results');
    if (sessionId) {
      updateSessionStage(sessionId, 'results').catch(() => {});
    }
  };

  const handleStartNewAssessment = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setStage('upload');
    setResumeData(null);
    setAnalysisResult(null);
    setAnswers([]);
    setEvaluatedAnswers([]);
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#28232B] space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F5] border border-[#F2D5E1] text-[#D94683]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-[#28232B]">Restoring Assessment Session</h2>
          <p className="text-xs text-[#716A75]">Retrieving saved progress from SQLite database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#28232B]">
      {/* 1. Shared Minimal Header */}
      <AssessmentHeader />

      {/* 2. Four-Stage Progress Indicator */}
      <ProgressIndicator currentStage={stage} />

      {/* 3. Main Dynamic Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 bg-white">
        {stage === 'upload' && (
          <StageUpload
            resumeData={resumeData}
            onResumeSelected={handleResumeSelected}
            onResumeRemoved={handleResumeRemoved}
            onStartAnalysis={handleStartAnalysis}
          />
        )}

        {(stage === 'analyzing' || stage === 'analysis') && (
          <StageAnalysis
            resumeData={resumeData}
            analysisResult={analysisResult}
            onAnalysisComplete={handleAnalysisComplete}
            onStartInterview={handleStartInterview}
            onBackToUpload={handleBackToUpload}
          />
        )}

        {(stage === 'interview' || stage === 'evaluating') && (
          <StageInterview
            sessionId={sessionId}
            analysisResult={analysisResult}
            evaluatedAnswers={evaluatedAnswers}
            onAnswerEvaluated={handleAnswerEvaluated}
            onInterviewCompleted={handleInterviewCompleted}
            onEndEarly={handleEndEarly}
          />
        )}

        {stage === 'results' && (
          <StageResults
            sessionId={sessionId}
            resumeData={resumeData}
            analysisResult={analysisResult}
            answers={answers}
            evaluatedAnswers={evaluatedAnswers}
            onStartNewAssessment={handleStartNewAssessment}
          />
        )}
      </main>

      {/* Subtle Minimal Footer */}
      <footer className="border-t border-[#EEE9EE] bg-white py-4 px-4 sm:px-8 text-center text-xs text-[#99919C]">
        <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HireLens Assessment OS • Beyond Resumes. Proving Skills.</span>
          <span>SQLite Persistent Session Engine</span>
        </div>
      </footer>
    </div>
  );
}
