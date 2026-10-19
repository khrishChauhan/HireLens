'use client';

import React, { useState } from 'react';
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
} from '@/lib/assessment-types';

export default function AssessmentWorkspacePage() {
  const [stage, setStage] = useState<AssessmentStage>('upload');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);

  // Stage transitions
  const handleResumeSelected = (data: ResumeData) => {
    setResumeData(data);
  };

  const handleResumeRemoved = () => {
    setResumeData(null);
  };

  const handleStartAnalysis = () => {
    setStage('analysis');
  };

  const handleBackToUpload = () => {
    setStage('upload');
  };

  const handleStartInterview = () => {
    setStage('interview');
  };

  const handleAnswerSubmitted = (answer: InterviewAnswer) => {
    setAnswers((prev) => [...prev, answer]);
  };

  const handleInterviewCompleted = () => {
    setStage('results');
  };

  const handleEndEarly = () => {
    setStage('results');
  };

  const handleStartNewAssessment = () => {
    setStage('upload');
    setResumeData(null);
    setAnswers([]);
  };

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
            onStartInterview={handleStartInterview}
            onBackToUpload={handleBackToUpload}
          />
        )}

        {(stage === 'interview' || stage === 'evaluating') && (
          <StageInterview
            answers={answers}
            onAnswerSubmitted={handleAnswerSubmitted}
            onInterviewCompleted={handleInterviewCompleted}
            onEndEarly={handleEndEarly}
          />
        )}

        {stage === 'results' && (
          <StageResults
            resumeData={resumeData}
            answers={answers}
            onStartNewAssessment={handleStartNewAssessment}
          />
        )}
      </main>

      {/* Subtle Minimal Footer */}
      <footer className="border-t border-[#EEE9EE] bg-white py-4 px-4 sm:px-8 text-center text-xs text-[#99919C]">
        <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HireLens Assessment OS • Beyond Resumes. Proving Skills.</span>
          <span>Light Theme Design System</span>
        </div>
      </footer>
    </div>
  );
}
