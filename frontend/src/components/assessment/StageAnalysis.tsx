'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Award,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Quote,
  Check,
  FileText,
} from 'lucide-react';
import { ResumeAnalysis, ResumeData } from '@/lib/assessment-types';
import { SAMPLE_ANALYSIS_PREVIEW } from '@/lib/assessment-data';

interface StageAnalysisProps {
  resumeData: ResumeData | null;
  onStartInterview: () => void;
  onBackToUpload: () => void;
}

export function StageAnalysis({
  resumeData,
  onStartInterview,
  onBackToUpload,
}: StageAnalysisProps) {
  const [analyzingStep, setAnalyzingStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const analysis: ResumeAnalysis = SAMPLE_ANALYSIS_PREVIEW;

  // Run a brief realistic 2-second progression through the 5 steps when first entering
  useEffect(() => {
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      if (current <= 5) {
        setAnalyzingStep(current);
      } else {
        setIsSimulating(false);
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const analysisSteps = [
    'Reading resume content and structured text blocks',
    'Extracting skills, frameworks, and domain competencies',
    'Identifying projects, technical scope, and experience highlights',
    'Matching job requirements against verified evidence',
    'Preparing your personalized 5-question technical interview',
  ];

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Understanding your experience.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-xl mx-auto leading-relaxed">
          We&apos;re extracting relevant skills and identifying opportunities that align with your experience.
        </p>
      </div>

      {/* Analysis Pipeline Stepper */}
      <div className="rounded-2xl border border-[#EEE9EE] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEE9EE] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D94683]" />
            <h2 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
              {isSimulating ? 'Analysis In Progress...' : 'Analysis Complete'}
            </h2>
          </div>
          <span className="text-[11px] text-[#99919C]">
            Target: {resumeData?.name || 'Uploaded Resume'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
          {analysisSteps.map((step, idx) => {
            const stepNum = idx + 1;
            const isDone = analyzingStep > stepNum || !isSimulating;
            const isCurrent = analyzingStep === stepNum && isSimulating;

            return (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isDone
                    ? 'border-[#C6E7D7] bg-[#EBF6F1]/50 text-[#23845B]'
                    : isCurrent
                    ? 'border-[#D94683] bg-[#FFF0F5] text-[#D94683] ring-1 ring-[#D94683]'
                    : 'border-[#EEE9EE] bg-[#FFF9FB] text-[#99919C]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold">Step {stepNum}</span>
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-[#23845B]" />
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-[#D94683] animate-ping" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#EEE9EE]" />
                  )}
                </div>
                <p className="text-[11px] font-medium leading-snug line-clamp-2">
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Findings (Visible once steps complete) */}
      {!isSimulating && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Extracted Resume Text (FastAPI Verified) */}
          {resumeData?.extractedText && (
            <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEE9EE] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D94683]" />
                  <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                    Extracted Resume Content (FastAPI Verified)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#716A75]">
                  <span className="rounded-full bg-[#EBF6F1] border border-[#C6E7D7] px-2.5 py-0.5 font-semibold text-[#23845B]">
                    {resumeData.pageCount || 1} Page(s) • {(resumeData.characterCount ?? resumeData.extractedText.length).toLocaleString()} Chars
                  </span>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs font-mono text-[#28232B] whitespace-pre-wrap leading-relaxed selection:bg-[#FFF0F5] selection:text-[#BE356D]">
                {resumeData.extractedText}
              </div>
            </div>
          )}

          {/* Matched Role Highlight Card */}
          <div className="rounded-2xl border border-[#F2D5E1] bg-[#FFF0F5] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D94683]">
                  Best Matched Opportunity
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#28232B] mt-1">
                  {analysis.matchedRole}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white border border-[#F2D5E1] px-4 py-2 text-right shadow-2xs">
                <Award className="h-5 w-5 text-[#23845B]" />
                <div>
                  <div className="text-lg font-black text-[#23845B]">
                    {analysis.matchScore}%
                  </div>
                  <div className="text-[10px] font-medium text-[#716A75]">
                    Skill Alignment Score
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#716A75] leading-relaxed">
              {analysis.matchRationale}
            </p>

            {/* Matching vs Missing Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F2D5E1]/60">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#23845B] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Matching Competencies
                </h4>
                <ul className="space-y-1.5 text-xs text-[#716A75]">
                  {analysis.matchingRequirements.slice(0, 3).map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#23845B] font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#B7791F] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Unverified / Interview Focus
                </h4>
                <ul className="space-y-1.5 text-xs text-[#716A75]">
                  {analysis.unverifiedRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#B7791F] font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Extracted Skills & Technologies */}
          <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
              Extracted Skills & Competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.extractedSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-[#F2D5E1] bg-[#FFF0F5] px-3 py-1.5 text-xs font-semibold text-[#D94683]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience Highlights with Resume Evidence */}
          <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
              Extracted Project & Career Highlights
            </h3>

            <div className="space-y-4">
              {analysis.experienceHighlights.map((exp, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#28232B]">
                      {exp.role} • {exp.company}
                    </span>
                    <span className="text-[11px] text-[#99919C]">
                      {exp.duration}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-white border border-[#EEE9EE] p-3 text-xs italic text-[#716A75]">
                    <Quote className="h-3.5 w-3.5 shrink-0 text-[#D94683] mt-0.5" />
                    <span>&ldquo;{exp.evidence}&rdquo;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#EEE9EE] bg-white p-5 shadow-xs">
            <button
              type="button"
              onClick={onBackToUpload}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A75] hover:text-[#28232B]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Upload Different Resume
            </button>

            <button
              type="button"
              onClick={onStartInterview}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#D94683] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
            >
              <span>Start Technical Interview</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
