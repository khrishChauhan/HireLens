'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import {
  AdaptiveQuestion,
  AnswerEvaluationResponse,
  EvaluatedAnswerRecord,
  RealResumeAnalysisResponse,
} from '@/lib/assessment-types';
import {
  evaluateInterviewAnswer,
  generateInterviewQuestions,
  getNextInterviewQuestion,
  saveSessionQuestions,
} from '@/lib/api';
import { INTERVIEW_QUESTIONS } from '@/lib/assessment-data';

interface StageInterviewProps {
  sessionId?: string | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  evaluatedAnswers: EvaluatedAnswerRecord[];
  onAnswerEvaluated: (record: EvaluatedAnswerRecord) => void;
  onInterviewCompleted: () => void;
  onEndEarly: () => void;
}

const MAX_INTERVIEW_BUDGET = 4;

export function StageInterview({
  sessionId,
  analysisResult,
  evaluatedAnswers,
  onAnswerEvaluated,
  onInterviewCompleted,
  onEndEarly,
}: StageInterviewProps) {
  // Adaptive questions queue and state
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [questionsHistory, setQuestionsHistory] = useState<AdaptiveQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [questionGenError, setQuestionGenError] = useState<string | null>(null);

  // Form & Evaluation states
  const [answerText, setAnswerText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] =
    useState<AnswerEvaluationResponse | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);

  // UI state
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Fetch initial adaptive questions on mount or resume active interview
  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      // If already has active question, don't re-fetch
      if (currentQuestion) return;

      // If budget already met, conclude
      if (evaluatedAnswers.length >= MAX_INTERVIEW_BUDGET) {
        onInterviewCompleted();
        return;
      }

      setIsLoadingQuestions(true);
      setQuestionGenError(null);

      // Scenario A: Resuming session with prior evaluated answers
      if (evaluatedAnswers.length > 0) {
        try {
          const lastRecord = evaluatedAnswers[evaluatedAnswers.length - 1];
          const historyPayload = evaluatedAnswers.map((item) => ({
            question_id: item.question.id,
            question_text: item.question.question,
            target_skill: item.question.target_skill,
            candidate_answer: item.answerText,
            composite_score: item.evaluation.composite_score,
            is_follow_up: item.question.is_follow_up,
          }));

          const unaddressed = (analysisResult?.unmatched_requirements || [])
            .map((r) => r.requirement)
            .filter((req) => !evaluatedAnswers.some((a) => a.question.target_skill.includes(req)));

          const nextRes = await getNextInterviewQuestion({
            interview_history: historyPayload,
            current_question: lastRecord.question,
            last_answer: lastRecord.answerText,
            last_evaluation: lastRecord.evaluation,
            remaining_budget: Math.max(0, MAX_INTERVIEW_BUDGET - evaluatedAnswers.length),
            max_budget: MAX_INTERVIEW_BUDGET,
            unaddressed_requirements: unaddressed,
          });

          if (!ignore) {
            if (nextRes.is_completed || !nextRes.has_next_question || !nextRes.next_question) {
              onInterviewCompleted();
            } else {
              setCurrentQuestion(nextRes.next_question);
              setQuestionsHistory([nextRes.next_question]);
            }
          }
        } catch (err) {
          if (!ignore) {
            loggerFallbackQuestions(err);
          }
        } finally {
          if (!ignore) setIsLoadingQuestions(false);
        }
        return;
      }

      // Scenario B: Fresh start with 0 answers evaluated
      try {
        const payload = {
          job_description:
            analysisResult?.job_requirements && analysisResult.job_requirements.length > 0
              ? `Requirements:\n${analysisResult.job_requirements.join('\n')}`
              : 'Target role: Senior Systems Engineer with Python, React, and distributed systems experience.',
          partially_matched_requirements: analysisResult?.partially_matched_requirements || [],
          unmatched_requirements: analysisResult?.unmatched_requirements || [],
          matched_requirements: analysisResult?.matched_requirements || [],
          uncertainty_notes: analysisResult?.uncertainty_notes || [],
          target_count: 3,
        };

        const res = await generateInterviewQuestions(payload);
        if (!ignore && res.questions && res.questions.length > 0) {
          setCurrentQuestion(res.questions[0]);
          setQuestionsHistory(res.questions);
          if (sessionId) {
            saveSessionQuestions(sessionId, res.questions).catch(() => {});
          }
        }
      } catch (err) {
        if (!ignore) {
          loggerFallbackQuestions(err);
        }
      } finally {
        if (!ignore) setIsLoadingQuestions(false);
      }
    }

    function loggerFallbackQuestions(err: unknown) {
      console.warn('Backend interview question generation failed, falling back to curated questions:', err);
      // Fallback to initial curated question set
      const fallbackQuestions: AdaptiveQuestion[] = INTERVIEW_QUESTIONS.slice(0, 3).map((q) => ({
        id: `q${q.id}`,
        question: q.question,
        target_skill: q.topic,
        reason: 'Curated technical question evaluating target competency',
        difficulty: 'intermediate',
        rubric: q.rubricFocus,
        is_follow_up: false,
      }));
      setCurrentQuestion(fallbackQuestions[0]);
      setQuestionsHistory(fallbackQuestions);
    }

    loadQuestions();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult, currentQuestion]);

  const totalAsked = evaluatedAnswers.length + (currentEvaluation ? 1 : 0);
  const currentNumber = evaluatedAnswers.length + 1;
  const progressPercent = Math.min(
    100,
    Math.round((evaluatedAnswers.length / MAX_INTERVIEW_BUDGET) * 100)
  );

  // 1. Submit Answer for Real AI Evaluation
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    setValidationError(null);
    const trimmed = answerText.trim();

    if (!trimmed) {
      setValidationError('Please type your answer before submitting.');
      return;
    }

    if (trimmed.length < 20) {
      setValidationError(
        'Please provide a more substantive technical response (at least 20 characters) explaining your rationale.'
      );
      return;
    }

    setIsEvaluating(true);

    try {
      const evalResponse = await evaluateInterviewAnswer({
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        target_skill: currentQuestion.target_skill,
        rubric: currentQuestion.rubric,
        candidate_answer: trimmed,
      });

      const record: EvaluatedAnswerRecord = {
        question: currentQuestion,
        answerText: trimmed,
        evaluation: evalResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onAnswerEvaluated(record);
      setCurrentEvaluation(evalResponse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation service error occurred.';
      setValidationError(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 2. Advance to Adaptive Next Question or Complete
  const handleAdvanceToNextQuestion = async () => {
    if (!currentQuestion || !currentEvaluation) return;

    if (totalAsked >= MAX_INTERVIEW_BUDGET) {
      onInterviewCompleted();
      return;
    }

    setIsLoadingNext(true);

    try {
      const historyPayload = evaluatedAnswers.map((item) => ({
        question_id: item.question.id,
        question_text: item.question.question,
        target_skill: item.question.target_skill,
        candidate_answer: item.answerText,
        composite_score: item.evaluation.composite_score,
        is_follow_up: item.question.is_follow_up,
      }));

      const unaddressed = (analysisResult?.unmatched_requirements || [])
        .map((r) => r.requirement)
        .filter((req) => !evaluatedAnswers.some((a) => a.question.target_skill.includes(req)));

      const nextRes = await getNextInterviewQuestion({
        interview_history: historyPayload,
        current_question: currentQuestion,
        last_answer: answerText,
        last_evaluation: currentEvaluation,
        remaining_budget: Math.max(0, MAX_INTERVIEW_BUDGET - totalAsked),
        max_budget: MAX_INTERVIEW_BUDGET,
        unaddressed_requirements: unaddressed,
      });

      if (nextRes.is_completed || !nextRes.has_next_question || !nextRes.next_question) {
        onInterviewCompleted();
      } else {
        setCurrentQuestion(nextRes.next_question);
        setQuestionsHistory((prev) => [...prev, nextRes.next_question!]);
        setCurrentEvaluation(null);
        setAnswerText('');
        setValidationError(null);
        if (sessionId) {
          saveSessionQuestions(sessionId, [nextRes.next_question]).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Next question routing failed, checking remaining budget:', err);
      // Fallback: if more questions were pre-generated, use next one, else complete
      const nextIndex = evaluatedAnswers.length;
      if (nextIndex < questionsHistory.length) {
        setCurrentQuestion(questionsHistory[nextIndex]);
        setCurrentEvaluation(null);
        setAnswerText('');
      } else {
        onInterviewCompleted();
      }
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Loading initial questions state
  if (isLoadingQuestions) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F5] border border-[#F2D5E1] text-[#D94683]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#28232B]">
          Synthesizing Adaptive Interview Plan...
        </h2>
        <p className="text-xs text-[#716A75] max-w-md mx-auto leading-relaxed">
          HireLens is analyzing your resume alignment gaps, unverified evidence, and target role requirements to formulate personalized technical questions.
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF2F4] border border-[#F7CCD3] text-[#C24155]">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[#28232B]">Unable to Initialize Interview</h2>
        <p className="text-xs text-[#716A75]">
          {questionGenError || 'An error occurred while formulating interview questions.'}
        </p>
        <button
          type="button"
          onClick={onEndEarly}
          className="rounded-xl bg-[#D94683] px-4 py-2 text-xs font-semibold text-white"
        >
          View Assessment Results
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10 space-y-8">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F2D5E1] bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#D94683]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stage 3: Adaptive Technical Interview</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Let&apos;s put your skills into practice.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-lg mx-auto leading-relaxed">
          Questions dynamically adapt to your resume evidence and previous answers. Responses are evaluated across 4 technical criteria.
        </p>
      </div>

      {/* Main Interview Panel */}
      <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Progress Bar & Counter */}
        <div className="space-y-2 border-b border-[#EEE9EE] pb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#D94683]">
                Question {currentNumber} of {MAX_INTERVIEW_BUDGET}
              </span>
              <span className="text-[#99919C]">•</span>
              <span className="rounded-full bg-[#FFF0F5] border border-[#F2D5E1] px-2.5 py-0.5 text-[11px] font-semibold text-[#D94683]">
                {currentQuestion.target_skill}
              </span>
              <span className="rounded-full bg-[#F4F2F4] border border-[#EEE9EE] px-2 py-0.5 text-[10px] font-medium text-[#716A75] capitalize">
                {currentQuestion.difficulty}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="text-[11px] font-medium text-[#99919C] hover:text-[#C24155] transition-colors"
            >
              End Early
            </button>
          </div>

          {/* Progress track */}
          <div className="h-1.5 w-full rounded-full bg-[#EEE9EE] overflow-hidden">
            <div
              className="h-full bg-[#D94683] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Adaptive Context Banner */}
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
            currentQuestion.is_follow_up
              ? 'border-[#B7791F]/30 bg-[#FEF9ED] text-[#B7791F]'
              : 'border-[#F2D5E1] bg-[#FFF0F5] text-[#BE356D]'
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#28232B]">
              {currentQuestion.is_follow_up ? 'Adaptive Follow-Up: ' : 'Adaptive Focus: '}
            </span>
            <span>{currentQuestion.reason}</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-[#28232B] leading-snug">
            {currentQuestion.question}
          </h2>
          <p className="text-[11px] text-[#99919C]">
            <strong className="text-[#716A75]">Evaluation Rubric:</strong> {currentQuestion.rubric}
          </p>
        </div>

        {/* State A: Before Evaluation -> Answer Input Form */}
        {!currentEvaluation && (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="interview-answer"
                  className="text-xs font-semibold text-[#28232B]"
                >
                  Your Technical Response
                </label>
                <span className="text-[11px] text-[#99919C]">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words • {answerText.length} chars
                </span>
              </div>

              <textarea
                id="interview-answer"
                rows={7}
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isEvaluating}
                placeholder="Outline your architectural approach, concrete trade-offs, technologies used, and edge-case mitigations..."
                className="w-full rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs sm:text-sm text-[#28232B] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683] transition-colors leading-relaxed disabled:opacity-50"
              />
            </div>

            {validationError && (
              <div className="flex items-center gap-2 rounded-xl border border-[#F7CCD3] bg-[#FDF2F4] p-3 text-xs text-[#C24155]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A75] hover:text-[#28232B]"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#D94683]" />
                <span>Interview Guidance & Tips</span>
                {showInstructions ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              <button
                type="submit"
                disabled={isEvaluating || !answerText.trim()}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all shadow-xs ${
                  answerText.trim() && !isEvaluating
                    ? 'bg-[#D94683] text-white hover:bg-[#BE356D] cursor-pointer'
                    : 'bg-[#EEE9EE] text-[#99919C] cursor-not-allowed'
                }`}
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer for Evaluation</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Guidance Notes */}
            {showInstructions && (
              <div className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs text-[#716A75] space-y-2 animate-in fade-in duration-200">
                <p className="font-semibold text-[#28232B]">
                  Evaluation criteria evaluated by Python rubric:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>Technical Correctness:</strong> Accuracy of frameworks, protocols, and concurrency models.
                  </li>
                  <li>
                    <strong>Problem-Solving & Trade-Offs:</strong> Balancing memory, latency, query complexity, and failure modes.
                  </li>
                  <li>
                    <strong>Relevance:</strong> Direct adherence to the stated scenario without conversational fluff.
                  </li>
                  <li>
                    <strong>Communication:</strong> Crisp, professional explanation of implementation trade-offs.
                  </li>
                </ul>
              </div>
            )}
          </form>
        )}

        {/* State B: After Evaluation -> Live Structured Feedback Card */}
        {currentEvaluation && (
          <div className="space-y-5 rounded-2xl border border-[#C6E7D7] bg-[#EBF6F1]/30 p-5 animate-in fade-in duration-300">
            {/* Header Score Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C6E7D7] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#23845B]" />
                <h3 className="text-sm font-bold text-[#28232B]">
                  Answer Evaluated ({currentEvaluation.composite_score} / 5.0)
                </h3>
              </div>
              <span className="rounded-full bg-white border border-[#C6E7D7] px-3 py-1 text-xs font-extrabold text-[#23845B]">
                {currentEvaluation.percentage_score}% Demonstrated Mastery
              </span>
            </div>

            {/* 4 Criteria Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentEvaluation.criteria_scores.map((c, i) => (
                <div key={i} className="rounded-xl border border-[#EEE9EE] bg-white p-2.5 text-center space-y-1">
                  <div className="text-base font-black text-[#28232B]">{c.score.toFixed(1)}</div>
                  <div className="text-[10px] font-semibold text-[#716A75] capitalize">
                    {c.criterion.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Feedback */}
            <p className="text-xs text-[#28232B] leading-relaxed">
              {currentEvaluation.overall_feedback}
            </p>

            {/* Quoted Evidence */}
            {currentEvaluation.evidence_quote && (
              <div className="flex items-start gap-2 rounded-lg bg-white border border-[#EEE9EE] p-2.5 text-xs text-[#716A75]">
                <Quote className="h-3.5 w-3.5 shrink-0 text-[#D94683] mt-0.5" />
                <div className="space-y-1">
                  <span className="italic">&ldquo;{currentEvaluation.evidence_quote}&rdquo;</span>
                  <div className="text-[10px] text-[#23845B] font-semibold">
                    {currentEvaluation.evidence_verified
                      ? '✓ Verified quote from candidate answer'
                      : '⚠ Unverified quote'}
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {currentEvaluation.strengths.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-[#23845B]">Demonstrated Strengths:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#716A75]">
                    {currentEvaluation.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {currentEvaluation.improvements.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-[#B7791F]">Areas to Deepen:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#716A75]">
                    {currentEvaluation.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Advance Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAdvanceToNextQuestion}
                disabled={isLoadingNext}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D94683] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#BE356D] transition-colors shadow-xs"
              >
                {isLoadingNext ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Routing Next Question...</span>
                  </>
                ) : totalAsked >= MAX_INTERVIEW_BUDGET ? (
                  <>
                    <span>Complete Assessment & View Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Advance to Next Question</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Ending Early */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEE9EE] pb-3">
              <h3 className="text-sm font-bold text-[#28232B]">
                End Assessment Early?
              </h3>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="text-[#99919C] hover:text-[#28232B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#716A75] leading-relaxed">
              You have completed {evaluatedAnswers.length} question(s). Ending early will generate your final report based strictly on the answers evaluated so far.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-lg border border-[#EEE9EE] px-3.5 py-1.5 text-xs font-semibold text-[#716A75] hover:bg-[#FFF9FB]"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onEndEarly();
                }}
                className="rounded-lg bg-[#C24155] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#a83547]"
              >
                End & View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
