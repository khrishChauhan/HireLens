'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Quote,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export default function EvaluationsPage() {
  const { evaluations, setSelectedEvaluationId } = useHireLens();

  const [activeFilter, setActiveFilter] = useState<'Pending' | 'Reviewed' | 'All'>('All');

  const filtered = evaluations.filter((e) => {
    if (activeFilter === 'Pending') return e.status === 'Pending Review';
    if (activeFilter === 'Reviewed') return e.status === 'Reviewed';
    return true;
  });

  const pendingCount = evaluations.filter((e) => e.status === 'Pending Review').length;
  const reviewedCount = evaluations.filter((e) => e.status === 'Reviewed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
              Evaluations & Rubrics
            </h2>
            <span className="rounded-full bg-[#FFF0F5] border border-[#F5D5E2] px-2.5 py-0.5 text-xs font-semibold text-[#D94683]">
              {pendingCount} Pending Sign-off
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Structured assessment rubrics evaluating technical correctness, problem-solving, and verifiable code evidence.
          </p>
        </div>
      </div>

      {/* Ethical Standards Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-4 text-xs text-[#23845B]">
        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-[#23845B]">Evidence-Based Assessment Protocol</h3>
          <p className="text-[11px] text-[#23845B]/90 mt-0.5 leading-relaxed">
            All HireLens evaluations are anchored in objective criteria and direct evidence excerpts. We strictly prohibit scoring based on vocal inflection, facial expressions, emotion proxies, or non-job-related heuristics.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#F0EBEF] bg-white p-2 shadow-2xs w-fit">
        <button
          onClick={() => setActiveFilter('All')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === 'All'
              ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
              : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
          }`}
        >
          All ({evaluations.length})
        </button>
        <button
          onClick={() => setActiveFilter('Pending')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === 'Pending'
              ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
              : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setActiveFilter('Reviewed')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilter === 'Reviewed'
              ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
              : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
          }`}
        >
          Reviewed ({reviewedCount})
        </button>
      </div>

      {/* Evaluation Cards Grid */}
      <div className="space-y-4">
        {filtered.map((evalItem) => (
          <div
            key={evalItem.id}
            className="group rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-2xs transition-all hover:border-[#F5D5E2] hover:shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F5] border border-[#F5D5E2] text-sm font-bold text-[#BE356D]">
                  {evalItem.overallScore.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#26212A]">
                      {evalItem.candidateName}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        evalItem.status === 'Reviewed'
                          ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                          : 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                      }`}
                    >
                      {evalItem.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6F6873]">
                    {evalItem.candidateRole} • Interviewed {evalItem.interviewDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvaluationId(evalItem.id)}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-[#D94683] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Open Full Rubric
              </button>
            </div>

            {/* Sub-scores breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-2.5">
                <span className="text-[10px] font-semibold text-[#99919C] uppercase">
                  Technical
                </span>
                <p className="text-xs font-bold text-[#26212A] mt-0.5">
                  {evalItem.rubric.technicalCorrectness.score} / 5.0
                </p>
              </div>
              <div className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-2.5">
                <span className="text-[10px] font-semibold text-[#99919C] uppercase">
                  Problem Solving
                </span>
                <p className="text-xs font-bold text-[#26212A] mt-0.5">
                  {evalItem.rubric.problemSolving.score} / 5.0
                </p>
              </div>
              <div className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-2.5">
                <span className="text-[10px] font-semibold text-[#99919C] uppercase">
                  Relevance
                </span>
                <p className="text-xs font-bold text-[#26212A] mt-0.5">
                  {evalItem.rubric.questionRelevance.score} / 5.0
                </p>
              </div>
              <div className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-2.5">
                <span className="text-[10px] font-semibold text-[#99919C] uppercase">
                  Communication
                </span>
                <p className="text-xs font-bold text-[#26212A] mt-0.5">
                  {evalItem.rubric.communicationClarity.score} / 5.0
                </p>
              </div>
            </div>

            {/* Evidence excerpt preview */}
            {evalItem.evidenceExcerpts[0] && (
              <div className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB]/70 p-3 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D94683] mb-1">
                  <Quote className="h-3 w-3" />
                  <span>Key Evidence Excerpt: {evalItem.evidenceExcerpts[0].topic}</span>
                </div>
                <p className="italic text-[#6F6873] text-[11px]">
                  {evalItem.evidenceExcerpts[0].excerpt}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
