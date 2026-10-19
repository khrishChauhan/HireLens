'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { InterviewQuestion, InterviewAnswer } from '@/lib/assessment-types';
import { INTERVIEW_QUESTIONS } from '@/lib/assessment-data';

interface StageInterviewProps {
  answers: InterviewAnswer[];
  onAnswerSubmitted: (answer: InterviewAnswer) => void;
  onInterviewCompleted: () => void;
  onEndEarly: () => void;
}

export function StageInterview({
  answers,
  onAnswerSubmitted,
  onInterviewCompleted,
  onEndEarly,
}: StageInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(answers.length);
  const [answerText, setAnswerText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const questions: InterviewQuestion[] = INTERVIEW_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const totalQuestions = questions.length;
  const currentNumber = currentQuestionIndex + 1;
  const progressPercent = Math.round(((currentQuestionIndex) / totalQuestions) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsSubmitting(true);

    const newAnswer: InterviewAnswer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      topic: currentQuestion.topic,
      answerText: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTimeout(() => {
      onAnswerSubmitted(newAnswer);
      setAnswerText('');
      setIsSubmitting(false);

      if (currentNumber >= totalQuestions) {
        onInterviewCompleted();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 400);
  };

  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10 space-y-8">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Let&apos;s put your skills into practice.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-lg mx-auto leading-relaxed">
          This interview adapts to your resume and the matched role. Questions target architecture, problem-solving, and implementation trade-offs.
        </p>
      </div>

      {/* Main Interview Panel */}
      <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Progress Bar & Counter */}
        <div className="space-y-2 border-b border-[#EEE9EE] pb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#D94683]">
                Question {currentNumber} of {totalQuestions}
              </span>
              <span className="text-[#99919C]">•</span>
              <span className="rounded-full bg-[#FFF0F5] border border-[#F2D5E1] px-2.5 py-0.5 text-[11px] font-semibold text-[#D94683]">
                {currentQuestion.topic}
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

        {/* Personalized Context Banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#F2D5E1] bg-[#FFF0F5] p-3 text-xs text-[#BE356D]">
          <Sparkles className="h-4 w-4 shrink-0 text-[#D94683] mt-0.5" />
          <div>
            <span className="font-semibold text-[#28232B]">Adaptive Context: </span>
            <span>{currentQuestion.context}</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-[#28232B] leading-snug">
            {currentQuestion.question}
          </h2>
          <p className="text-[11px] text-[#99919C]">
            <strong className="text-[#716A75]">Evaluation Focus:</strong> {currentQuestion.rubricFocus}
          </p>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Outline your architectural approach, concrete trade-offs, technologies used, and edge-case mitigations..."
              className="w-full rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs sm:text-sm text-[#28232B] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683] transition-colors leading-relaxed"
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
            {/* Optional Guidance Accordion */}
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
              disabled={isSubmitting || !answerText.trim()}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all shadow-xs ${
                answerText.trim() && !isSubmitting
                  ? 'bg-[#D94683] text-white hover:bg-[#BE356D] cursor-pointer'
                  : 'bg-[#EEE9EE] text-[#99919C] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Evaluating Response...</span>
                </>
              ) : currentNumber === totalQuestions ? (
                <>
                  <span>Submit & Complete Assessment</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Collapsible Guidance Notes */}
          {showInstructions && (
            <div className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs text-[#716A75] space-y-2 animate-in fade-in duration-200">
              <p className="font-semibold text-[#28232B]">
                Tips for a high rubric evaluation:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>
                  <strong>Be specific:</strong> Mention concrete algorithms, libraries, failure modes, and metrics rather than generic high-level summaries.
                </li>
                <li>
                  <strong>Discuss trade-offs:</strong> High scores recognize that every technical decision involves balancing latency, memory, consistency, and operational complexity.
                </li>
                <li>
                  <strong>Ground in experience:</strong> Feel free to refer to the systems, tools, and challenges you encountered in your past projects.
                </li>
              </ul>
            </div>
          )}
        </form>
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
              You are currently on Question {currentNumber} of {totalQuestions}. Ending early will generate your final report based only on submitted answers.
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
