'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileCheck,
  Quote,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { Evaluation } from '@/lib/types';

interface EvaluationModalContentProps {
  evaluation: Evaluation;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => void;
  onMarkReviewed: (id: string) => void;
}

function EvaluationModalContent({
  evaluation,
  onClose,
  onSaveNotes,
  onMarkReviewed,
}: EvaluationModalContentProps) {
  const [notes, setNotes] = useState(evaluation.reviewerNotes);

  const handleSaveNotes = () => {
    onSaveNotes(evaluation.id, notes);
  };

  const handleMarkReviewed = () => {
    onMarkReviewed(evaluation.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#F0EBEF] bg-white p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF0F5] border border-[#F5D5E2] text-[#D94683]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#26212A]">
                  Evaluation: {evaluation.candidateName}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    evaluation.status === 'Reviewed'
                      ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                      : 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                  }`}
                >
                  {evaluation.status}
                </span>
              </div>
              <p className="text-xs text-[#6F6873]">
                {evaluation.candidateRole} • Interview conducted on {evaluation.interviewDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-6 max-h-[72vh] overflow-y-auto pr-1">
          {/* Ethical Guardrail Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-3 text-xs text-[#23845B]">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Objective Rubric Assessment:</span>
              <p className="text-[11px] text-[#23845B]/90 mt-0.5 leading-relaxed">
                HireLens evaluates candidate competencies solely based on verifiable technical accuracy, code solutions, and structured question relevance. No biometric, emotion, or personality proxies are ever used.
              </p>
            </div>
          </div>

          {/* Overall Score Highlight */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-[#F5D5E2] bg-[#FFF0F5] p-4">
            <div>
              <span className="text-xs font-semibold text-[#BE356D] uppercase tracking-wider">
                Overall Rubric Composite
              </span>
              <h3 className="text-2xl font-black text-[#26212A] mt-0.5">
                {evaluation.overallScore.toFixed(1)}{' '}
                <span className="text-sm font-normal text-[#99919C]">/ 5.0</span>
              </h3>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0 text-xs text-[#6F6873]">
              <p>Evaluator: Alex Vance / David Chen</p>
              <p className="text-[11px] text-[#99919C]">Scale: 1.0 (Low) to 5.0 (Exceptional)</p>
            </div>
          </div>

          {/* 4 Structured Rubric Criteria */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#26212A] uppercase tracking-wider">
              Core Competency Rubric
            </h4>

            {/* 1. Technical Correctness */}
            <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#26212A]">
                  1. Technical Correctness
                </span>
                <span className="text-xs font-bold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full">
                  {evaluation.rubric.technicalCorrectness.score} / {evaluation.rubric.technicalCorrectness.max}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#6F6873]">
                {evaluation.rubric.technicalCorrectness.notes}
              </p>
            </div>

            {/* 2. Problem-solving and Reasoning */}
            <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#26212A]">
                  2. Problem-solving & Algorithmic Reasoning
                </span>
                <span className="text-xs font-bold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full">
                  {evaluation.rubric.problemSolving.score} / {evaluation.rubric.problemSolving.max}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#6F6873]">
                {evaluation.rubric.problemSolving.notes}
              </p>
            </div>

            {/* 3. Relevance to Question */}
            <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#26212A]">
                  3. Relevance to Question & Requirements
                </span>
                <span className="text-xs font-bold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full">
                  {evaluation.rubric.questionRelevance.score} / {evaluation.rubric.questionRelevance.max}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#6F6873]">
                {evaluation.rubric.questionRelevance.notes}
              </p>
            </div>

            {/* 4. Communication Clarity */}
            <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#26212A]">
                  4. Communication Clarity & Architectural Rationale
                </span>
                <span className="text-xs font-bold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full">
                  {evaluation.rubric.communicationClarity.score} / {evaluation.rubric.communicationClarity.max}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#6F6873]">
                {evaluation.rubric.communicationClarity.notes}
              </p>
            </div>
          </div>

          {/* Evidence and Supporting Excerpts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#26212A] uppercase tracking-wider">
              Verifiable Evidence & Interview Excerpts
            </h4>
            {evaluation.evidenceExcerpts.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#F0EBEF] bg-[#FFF9FB] p-4 space-y-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D94683]">
                  <Quote className="h-3.5 w-3.5" />
                  <span>Topic: {item.topic}</span>
                </div>
                <blockquote className="border-l-2 border-[#D94683] pl-3 text-xs italic text-[#26212A]">
                  {item.excerpt}
                </blockquote>
                <p className="text-[11px] text-[#6F6873]">
                  <span className="font-semibold text-[#26212A]">Evidence Analysis: </span>
                  {item.analysis}
                </p>
              </div>
            ))}
          </div>

          {/* Reviewer Notes & Decision Sign-off */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#26212A] uppercase tracking-wider">
              Recruiter & Hiring Lead Notes
            </h4>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter internal recruiter notes, next round recommendations, or compensation ranges..."
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-xs text-[#26212A] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-[#F0EBEF] pt-4">
          <button
            type="button"
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0EBEF] bg-white px-3.5 py-2 text-xs font-medium text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <Save className="h-3.5 w-3.5" />
            Save Notes
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#F0EBEF] px-4 py-2 text-xs font-medium text-[#6F6873] hover:bg-[#FFF9FB]"
            >
              Close
            </button>
            {evaluation.status !== 'Reviewed' ? (
              <button
                type="button"
                onClick={handleMarkReviewed}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#23845B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1e6f4d]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sign Off & Mark Reviewed
              </button>
            ) : (
              <span className="text-xs font-semibold text-[#23845B] flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed by {evaluation.reviewedBy}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EvaluationDetailModal() {
  const {
    selectedEvaluationId,
    setSelectedEvaluationId,
    evaluations,
    updateEvaluationNotes,
    markEvaluationReviewed,
  } = useHireLens();

  if (!selectedEvaluationId) return null;

  const evaluation = evaluations.find((e) => e.id === selectedEvaluationId);
  if (!evaluation) return null;

  return (
    <EvaluationModalContent
      key={evaluation.id}
      evaluation={evaluation}
      onClose={() => setSelectedEvaluationId(null)}
      onSaveNotes={updateEvaluationNotes}
      onMarkReviewed={markEvaluationReviewed}
    />
  );
}
