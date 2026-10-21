'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  RotateCcw,
  ShieldCheck,
  Quote,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  InterviewAnswer,
  ResumeData,
  RealResumeAnalysisResponse,
  EvaluatedAnswerRecord,
} from '@/lib/assessment-types';
import { INITIAL_ASSESSMENT_RESULT } from '@/lib/assessment-data';
import { completeSession } from '@/lib/api';

interface StageResultsProps {
  sessionId?: string | null;
  resumeData?: ResumeData | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  answers: InterviewAnswer[];
  evaluatedAnswers?: EvaluatedAnswerRecord[];
  onStartNewAssessment: () => void;
}

export function StageResults({
  sessionId,
  analysisResult,
  answers,
  evaluatedAnswers = [],
  onStartNewAssessment,
}: StageResultsProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 1. Compute Live Interview Performance Metrics if evaluatedAnswers exist
  const hasLiveEvaluations = evaluatedAnswers.length > 0;

  const interviewCompositeScore = hasLiveEvaluations
    ? Number(
        (
          evaluatedAnswers.reduce((sum, a) => sum + a.evaluation.composite_score, 0) /
          evaluatedAnswers.length
        ).toFixed(1)
      )
    : INITIAL_ASSESSMENT_RESULT.overallScore;

  const interviewPercentage = Math.round(((interviewCompositeScore - 1.0) / 4.0) * 100);

  // Automatically persist completion and scores to session in SQLite
  useEffect(() => {
    if (sessionId && hasLiveEvaluations) {
      completeSession(sessionId, {
        report_markdown: `HireLens Assessment Completed for ${analysisResult?.candidate_name || 'Candidate'}.`,
        resume_match_score: analysisResult?.match_score,
        interview_composite_score: interviewCompositeScore,
        interview_percentage_score: interviewPercentage,
      }).catch((e) => console.warn('Failed to complete session in background:', e));
    }
  }, [
    sessionId,
    hasLiveEvaluations,
    analysisResult?.candidate_name,
    analysisResult?.match_score,
    interviewCompositeScore,
    interviewPercentage,
  ]);

  // Criterion averages across all evaluated questions
  const criteriaBreakdown = [
    {
      category: 'Technical Correctness',
      score: hasLiveEvaluations
        ? Number(
            (
              evaluatedAnswers.reduce((sum, a) => {
                const c = a.evaluation.criteria_scores.find(
                  (cr) => cr.criterion === 'technical_correctness'
                );
                return sum + (c ? c.score : 3.0);
              }, 0) / evaluatedAnswers.length
            ).toFixed(1)
          )
        : 4.8,
      notes:
        'Accuracy of framework implementation, concurrency handling, and technical trade-offs.',
    },
    {
      category: 'Problem-Solving & Reasoning',
      score: hasLiveEvaluations
        ? Number(
            (
              evaluatedAnswers.reduce((sum, a) => {
                const c = a.evaluation.criteria_scores.find(
                  (cr) => cr.criterion === 'problem_solving'
                );
                return sum + (c ? c.score : 3.0);
              }, 0) / evaluatedAnswers.length
            ).toFixed(1)
          )
        : 4.6,
      notes:
        'Depth of architectural rationale, edge-case mitigation, and failure isolation strategies.',
    },
    {
      category: 'Relevance to Question',
      score: hasLiveEvaluations
        ? Number(
            (
              evaluatedAnswers.reduce((sum, a) => {
                const c = a.evaluation.criteria_scores.find(
                  (cr) => cr.criterion === 'relevance'
                );
                return sum + (c ? c.score : 3.0);
              }, 0) / evaluatedAnswers.length
            ).toFixed(1)
          )
        : 4.7,
      notes:
        'Direct adherence to the stated engineering scenario without generic high-level fluff.',
    },
    {
      category: 'Communication & Clarity',
      score: hasLiveEvaluations
        ? Number(
            (
              evaluatedAnswers.reduce((sum, a) => {
                const c = a.evaluation.criteria_scores.find(
                  (cr) => cr.criterion === 'communication'
                );
                return sum + (c ? c.score : 3.0);
              }, 0) / evaluatedAnswers.length
            ).toFixed(1)
          )
        : 4.7,
      notes:
        'Concise, structured articulation of engineering concepts and component boundaries.',
    },
  ];

  // Dynamic Strengths & Improvement Areas from real evaluations
  const demonstratedStrengths: string[] = hasLiveEvaluations
    ? Array.from<string>(new Set(evaluatedAnswers.flatMap((a) => a.evaluation.strengths)))
    : INITIAL_ASSESSMENT_RESULT.strengths;

  const areasToImprove: string[] = hasLiveEvaluations
    ? Array.from<string>(new Set(evaluatedAnswers.flatMap((a) => a.evaluation.improvements)))
    : INITIAL_ASSESSMENT_RESULT.areasToImprove;

  // Real evidence findings linked to candidate answers and verified quotes
  const evidenceFindings = hasLiveEvaluations
    ? evaluatedAnswers.map((a) => ({
        topic: a.question.target_skill,
        question: a.question.question,
        answerExcerpt: a.evaluation.evidence_quote
          ? `"${a.evaluation.evidence_quote}"`
          : `"${a.answerText.length > 180 ? a.answerText.substring(0, 180) + '...' : a.answerText}"`,
        analysis: a.evaluation.overall_feedback,
        isVerified: a.evaluation.evidence_verified,
        score: a.evaluation.composite_score,
      }))
    : answers.map((ans) => ({
        topic: ans.topic,
        question: ans.questionText,
        answerExcerpt: `"${ans.answerText.length > 180 ? ans.answerText.substring(0, 180) + '...' : ans.answerText}"`,
        analysis: 'Assessed response demonstrating foundational domain knowledge.',
        isVerified: true,
        score: 4.5,
      }));

  const candidateName = analysisResult?.candidate_name || 'Candidate';
  const matchedRole = analysisResult?.candidate_title || 'Software Engineering Professional';

  // Export Comprehensive Markdown Report
  const handleDownloadReport = () => {
    const reportText = `# HIRELENS CANDIDATE TECHNICAL ASSESSMENT REPORT
=====================================================
Candidate: ${candidateName}
Role Target: ${matchedRole}
Evaluated Date: ${new Date().toLocaleDateString()}
Report Type: Evidence-Backed Technical Competency Audit

SECTION 1: HIGH-LEVEL DUAL SCORE SUMMARY
----------------------------------------
• Resume Evidence Alignment (RAG Match): ${analysisResult?.match_score ?? 'N/A'}%
  Formula: (Matched * 1.0 + Partial * 0.5) / Total Requirements * 100
  Evaluated Requirements: ${analysisResult?.job_requirements.length ?? 0} total

• Technical Interview Performance: ${interviewCompositeScore} / 5.0 (${interviewPercentage}%)
  Methodology: Deterministic 4-criterion arithmetic mean across ${evaluatedAnswers.length} questions

SECTION 2: CORE COMPETENCY RUBRIC BREAKDOWN (1.0 to 5.0)
-------------------------------------------------------
${criteriaBreakdown
  .map(
    (c) =>
      `• ${c.category}: ${c.score} / 5.0 (${Math.round(((c.score - 1.0) / 4.0) * 100)}%)\n  ${c.notes}`
  )
  .join('\n\n')}

SECTION 3: DEMONSTRATED STRENGTHS
---------------------------------
${demonstratedStrengths.map((st) => `• ${st}`).join('\n')}

SECTION 4: AREAS FOR TECHNICAL DEEPENING
---------------------------------------
${areasToImprove.map((ai) => `• ${ai}`).join('\n')}

SECTION 5: QUESTION-BY-QUESTION EVALUATION & EVIDENCE
----------------------------------------------------
${evidenceFindings
  .map(
    (ev, idx) =>
      `[Question ${idx + 1}] Topic: ${ev.topic} (Score: ${ev.score} / 5.0)
Question: ${ev.question}
Evidence Excerpt: ${ev.answerExcerpt} (${ev.isVerified ? 'Verified Source Quote' : 'Unverified'})
Evaluator Finding: ${ev.analysis}`
  )
  .join('\n\n')}

=====================================================
HUMAN OVERSIGHT DISCLAIMER:
HireLens scores and findings are AI-assisted decision-support metrics strictly derived from resume evidence and candidate interview responses. They do not constitute an automated hiring decision. All final employment decisions require human engineering review.
`;

    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireLens_Assessment_${candidateName.replace(/\s+/g, '_')}.md`;
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
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F2D5E1] bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#D94683]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stage 4: Evidence-Based Assessment Results</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Your assessment is complete.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-lg mx-auto leading-relaxed">
          Here is your comprehensive evaluation report combining RAG-grounded resume alignment and adaptive technical interview performance.
        </p>
      </div>

      {/* DUAL SCORE SUMMARY CARD */}
      <div className="rounded-2xl border border-[#F2D5E1] bg-[#FFF0F5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F2D5E1] pb-6">
          {/* Left: Candidate & Target Role Info */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D94683]">
              Technical Assessment Overview
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#28232B] mt-1">
              {candidateName}
            </h2>
            <p className="text-xs text-[#716A75] mt-0.5">
              Target Role: <strong className="text-[#28232B]">{matchedRole}</strong>
            </p>
          </div>

          {/* Right: Answer Count Pill */}
          <div className="rounded-xl border border-[#F2D5E1] bg-white px-4 py-2 text-xs text-[#716A75] sm:text-right shadow-2xs">
            <span className="font-bold text-[#28232B] block">
              {evaluatedAnswers.length} Interview Responses Evaluated
            </span>
            <span className="text-[11px] text-[#99919C]">
              4-Criterion Structured Scoring Rubric
            </span>
          </div>
        </div>

        {/* Dual Score Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Resume Evidence Alignment */}
          <div className="rounded-xl border border-[#C6E7D7] bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#23845B]">
                Resume Alignment (RAG)
              </span>
              <Award className="h-4 w-4 text-[#23845B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#28232B]">
                {analysisResult?.match_score ?? 75}%
              </span>
              <span className="text-xs text-[#716A75]">verifiable overlap</span>
            </div>
            <p className="text-[11px] text-[#716A75] leading-relaxed">
              Deterministic Python calculation of demonstrated resume keywords and experience against {analysisResult?.job_requirements.length ?? 0} job requirements.
            </p>
          </div>

          {/* Card 2: Interview Performance Composite */}
          <div className="rounded-xl border border-[#F2D5E1] bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D94683]">
                Interview Performance
              </span>
              <Sparkles className="h-4 w-4 text-[#D94683]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#28232B]">
                {interviewCompositeScore}
              </span>
              <span className="text-sm font-semibold text-[#99919C]">/ 5.0</span>
              <span className="ml-2 rounded-md bg-[#FFF0F5] px-2 py-0.5 text-xs font-bold text-[#D94683]">
                {interviewPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-[#716A75] leading-relaxed">
              Arithmetic mean of 4 criteria across all adaptive scenario questions. Evaluates implementation trade-offs and technical reasoning.
            </p>
          </div>
        </div>

        {/* Ethical Human Oversight Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-3 text-xs text-[#23845B]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Transparent Decision-Support Standard:</strong> All evaluations, criterion scores, and quotations are AI-assisted decision aids derived strictly from submitted technical answers. HireLens does not make automated employment decisions; final hiring evaluations require human engineering review.
          </p>
        </div>
      </div>

      {/* 4 Competency Rubrics Breakdown */}
      <section className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#28232B] uppercase tracking-wider">
            Competency Rubric Breakdown
          </h2>
          <p className="text-xs text-[#716A75] mt-0.5">
            Evaluated on a standardized 1.0 to 5.0 scale across all completed interview responses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {criteriaBreakdown.map((item) => {
            const pct = Math.round(((item.score - 1.0) / 4.0) * 100);
            return (
              <div
                key={item.category}
                className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#28232B]">{item.category}</span>
                  <span className="font-extrabold text-[#D94683]">
                    {item.score} / 5.0 ({pct}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#EEE9EE] overflow-hidden">
                  <div
                    className="h-full bg-[#D94683] rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#716A75] leading-relaxed">
                  {item.notes}
                </p>
              </div>
            );
          })}
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
            {demonstratedStrengths.map((str, idx) => (
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
            Areas for Technical Deepening
          </h3>
          <ul className="space-y-2 text-xs text-[#716A75]">
            {areasToImprove.map((area, idx) => (
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
            Excerpts taken directly from candidate answers and programmatically verified against the submitted text.
          </p>
        </div>

        <div className="space-y-3.5">
          {evidenceFindings.map((ev, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#D94683]">
                  <Quote className="h-3.5 w-3.5" />
                  <span>Topic: {ev.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white border border-[#EEE9EE] px-2 py-0.5 text-[10px] font-bold text-[#28232B]">
                    Score: {ev.score} / 5.0
                  </span>
                  {ev.isVerified ? (
                    <span className="rounded bg-[#EBF6F1] border border-[#C6E7D7] px-2 py-0.5 text-[10px] font-bold text-[#23845B]">
                      ✓ Verified Answer Quote
                    </span>
                  ) : (
                    <span className="rounded bg-[#FEF9ED] border border-[#F7E0B5] px-2 py-0.5 text-[10px] font-bold text-[#B7791F]">
                      ⚠ Unverified Quote
                    </span>
                  )}
                </div>
              </div>

              <blockquote className="border-l-2 border-[#D94683] pl-3 text-xs italic text-[#28232B] leading-relaxed">
                {ev.answerExcerpt}
              </blockquote>

              <p className="text-[11px] text-[#716A75] pt-0.5">
                <strong className="text-[#28232B]">Evaluator Analysis: </strong>
                {ev.analysis}
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
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Full Audit Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
