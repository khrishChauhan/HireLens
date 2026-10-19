'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  RotateCcw,
  ShieldCheck,
  Quote,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import {
  AssessmentResult,
  InterviewAnswer,
  ResumeData,
} from '@/lib/assessment-types';
import { INITIAL_ASSESSMENT_RESULT } from '@/lib/assessment-data';

interface StageResultsProps {
  resumeData?: ResumeData | null;
  answers: InterviewAnswer[];
  onStartNewAssessment: () => void;
}

export function StageResults({
  answers,
  onStartNewAssessment,
}: StageResultsProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const result: AssessmentResult = INITIAL_ASSESSMENT_RESULT;

  // Build evidence findings using real submitted answers if present
  const evidenceList =
    answers.length > 0
      ? answers.map((ans, idx) => ({
          topic: ans.topic,
          answerExcerpt: `"${ans.answerText.length > 180 ? ans.answerText.substring(0, 180) + '...' : ans.answerText}"`,
          analysis:
            idx === 0
              ? 'Demonstrates strong grasp of distributed message idempotency and queue partitioning.'
              : idx === 1
              ? 'Sound architectural strategy for UI thread optimization and frame-budget scheduling.'
              : idx === 2
              ? 'Solid approach to backward compatibility and circuit-breaker fault containment.'
              : idx === 3
              ? 'Demonstrates practical understanding of transaction isolation and PostgreSQL index maintenance.'
              : 'Clear incident response methodology prioritizing observability metrics and post-mortem safeguards.',
        }))
      : result.evidenceFindings;

  const handleDownloadReport = () => {
    const reportText = `HIRELENS TECHNICAL ASSESSMENT REPORT
=====================================
Candidate: ${result.candidateName}
Matched Role: ${result.matchedRole}
Evaluated: ${result.evaluatedAt}
Overall Rubric Composite: ${result.overallScore} / ${result.maxScore} (${result.percentile})

CORE COMPETENCY BREAKDOWN:
-------------------------
${result.skillBreakdown
  .map((s) => `• ${s.category}: ${s.score} / ${s.max} (${s.percentage}%)\n  ${s.notes}`)
  .join('\n\n')}

DEMONSTRATED STRENGTHS:
----------------------
${result.strengths.map((st) => `• ${st}`).join('\n')}

AREAS TO IMPROVE:
----------------
${result.areasToImprove.map((ai) => `• ${ai}`).join('\n')}

VERIFIABLE EVIDENCE & EXCERPTS:
------------------------------
${evidenceList
  .map(
    (ev) =>
      `• Topic: ${ev.topic}\n  Excerpt: ${ev.answerExcerpt}\n  Analysis: ${ev.analysis}`
  )
  .join('\n\n')}

RECOMMENDED STUDY TOPICS:
------------------------
${result.recommendedLearning
  .map((rl) => `• ${rl.topic}: ${rl.reason}`)
  .join('\n')}

=====================================
DISCLAIMER: HireLens rubrics evaluate objective, job-relevant technical skills and code evidence. Final hiring decisions should always be reviewed by a human team.
`;

    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireLens_Assessment_${result.candidateName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10 space-y-8">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Your assessment is complete.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-lg mx-auto leading-relaxed">
          Here&apos;s a structured summary of your demonstrated skills, rubric breakdown, and interview evidence.
        </p>
      </div>

      {/* Top Overall Score Card */}
      <div className="rounded-2xl border border-[#F2D5E1] bg-[#FFF0F5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D94683]">
              Overall Assessment Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[#28232B] tracking-tight">
                {result.overallScore}
              </span>
              <span className="text-base font-semibold text-[#99919C]">
                / {result.maxScore.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#23845B]">
              {result.percentile}
            </p>
          </div>

          <div className="rounded-xl border border-[#F2D5E1] bg-white p-4 text-xs space-y-1 sm:text-right shadow-2xs">
            <span className="font-bold text-[#28232B] block">
              {result.matchedRole}
            </span>
            <span className="text-[11px] text-[#716A75] block">
              Candidate: {result.candidateName}
            </span>
            <span className="text-[11px] text-[#99919C] block">
              Based on {answers.length || 5} answered interview questions
            </span>
          </div>
        </div>

        {/* Human review ethical notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-3 text-xs text-[#23845B]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Transparent Rubric Standard:</strong> This score reflects demonstrated technical evidence from your answers. HireLens rubrics do not claim to predict real-world job performance, and all hiring decisions remain human-supervised.
          </p>
        </div>
      </div>

      {/* 4 Skill Categories Breakdown */}
      <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#28232B] uppercase tracking-wider">
            Competency Rubric Breakdown
          </h2>
          <p className="text-xs text-[#716A75] mt-0.5">
            Evaluated against the target role requirements using 5-point competency rubrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.skillBreakdown.map((item) => (
            <div
              key={item.category}
              className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#28232B]">{item.category}</span>
                <span className="font-extrabold text-[#D94683]">
                  {item.score} / {item.max.toFixed(1)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[#EEE9EE] overflow-hidden">
                <div
                  className="h-full bg-[#D94683] rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <p className="text-[11px] text-[#716A75] leading-relaxed">
                {item.notes}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengths */}
        <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#23845B] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Demonstrated Strengths
          </h3>
          <ul className="space-y-2 text-xs text-[#716A75]">
            {result.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#23845B] font-bold mt-0.5">•</span>
                <span className="leading-snug">{str}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Areas to Improve */}
        <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#B7791F] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Areas to Further Refine
          </h3>
          <ul className="space-y-2 text-xs text-[#716A75]">
            {result.areasToImprove.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#B7791F] font-bold mt-0.5">•</span>
                <span className="leading-snug">{area}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Verifiable Evidence Section */}
      <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#28232B] uppercase tracking-wider">
            Verifiable Answer Evidence & Analysis
          </h2>
          <p className="text-xs text-[#716A75] mt-0.5">
            Excerpts taken directly from your interview answers that substantiate your score.
          </p>
        </div>

        <div className="space-y-3.5">
          {evidenceList.map((ev, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D94683]">
                <Quote className="h-3.5 w-3.5" />
                <span>Topic: {ev.topic}</span>
              </div>
              <blockquote className="border-l-2 border-[#D94683] pl-3 text-xs italic text-[#28232B] leading-relaxed">
                {ev.answerExcerpt}
              </blockquote>
              <p className="text-[11px] text-[#716A75] pt-0.5">
                <strong className="text-[#28232B]">Evaluator Finding: </strong>
                {ev.analysis}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Learning */}
      <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#D94683]" />
          <h2 className="text-sm font-bold text-[#28232B] uppercase tracking-wider">
            Recommended Topics for Mastery
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {result.recommendedLearning.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-1.5"
            >
              <h4 className="text-xs font-bold text-[#28232B]">
                {item.topic}
              </h4>
              <p className="text-[11px] text-[#716A75] leading-snug">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#EEE9EE] bg-white p-5 shadow-xs">
        <button
          type="button"
          onClick={onStartNewAssessment}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EEE9EE] px-4 py-2.5 text-xs font-semibold text-[#716A75] hover:bg-[#FFF9FB] hover:text-[#28232B] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Start New Assessment
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EEE9EE] px-4 py-2.5 text-xs font-semibold text-[#716A75] hover:bg-[#FFF9FB] transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-[#716A75]" />
            Print
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D94683] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
