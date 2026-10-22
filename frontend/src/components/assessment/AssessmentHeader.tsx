'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ShieldCheck } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';

export function AssessmentHeader() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let ignore = false;
    checkBackendHealth()
      .then(() => {
        if (!ignore) setBackendStatus('connected');
      })
      .catch(() => {
        if (!ignore) setBackendStatus('disconnected');
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#EEE9EE] bg-white px-4 sm:px-8">
      {/* Left: Brand Monogram & Wordmark */}
      <div className="flex items-center gap-3">
        {/* Custom geometric monogram */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F2D5E1] bg-[#FFF0F5] shadow-xs">
          <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#D94683]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#BE356D]" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-[#28232B]">
              HireLens
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D94683]" />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-[#99919C]">
            Beyond Resumes. Proving Skills.
          </span>
        </div>
      </div>

      {/* Right: Workspace Badge, Backend Status, and Help */}
      <div className="flex items-center gap-3">
        {/* Backend live indicator pill */}
        <div
          title={
            backendStatus === 'connected'
              ? 'FastAPI Backend Online (200 OK)'
              : 'FastAPI Backend Offline'
          }
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            backendStatus === 'connected'
              ? 'border-[#C6E7D7] bg-[#EBF6F1] text-[#23845B]'
              : 'border-[#EEE9EE] bg-[#FFF9FB] text-[#716A75]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backendStatus === 'connected' ? 'bg-[#23845B] animate-pulse' : 'bg-[#99919C]'
            }`}
          />
          <span>{backendStatus === 'connected' ? 'FastAPI Online' : 'Local Mode'}</span>
        </div>

        {/* AI Assessment Workspace Label */}
        <span className="rounded-full border border-[#F2D5E1] bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#D94683]">
          AI Assessment Workspace
        </span>

        {/* Help Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EEE9EE] text-[#716A75] hover:bg-[#FFF9FB] hover:text-[#28232B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683]"
          aria-label="How HireLens assessment works"
          title="How the assessment works"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EEE9EE] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#D94683]" />
                <h3 className="text-sm font-bold text-[#28232B]">
                  About HireLens Assessment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EEE9EE] text-[#716A75] hover:bg-[#FFF9FB] hover:text-[#28232B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#716A75] leading-relaxed">
              <p>
                HireLens is an evidence-based assessment workspace designed to evaluate technical competencies through tailored dialogue rather than static resumes alone.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-[10px] font-bold text-[#D94683]">
                    1
                  </span>
                  <div>
                    <strong className="text-[#28232B]">Resume Upload:</strong>{' '}
                    Provide your PDF resume to extract demonstrated engineering background and project evidence.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-[10px] font-bold text-[#D94683]">
                    2
                  </span>
                  <div>
                    <strong className="text-[#28232B]">AI Analysis:</strong>{' '}
                    Review extracted skills, target role match, and tailored interview roadmap.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-[10px] font-bold text-[#D94683]">
                    3
                  </span>
                  <div>
                    <strong className="text-[#28232B]">Adaptive Interview:</strong>{' '}
                    Answer 5 targeted architectural and problem-solving questions personalized to your experience.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-[10px] font-bold text-[#D94683]">
                    4
                  </span>
                  <div>
                    <strong className="text-[#28232B]">Final Evaluation:</strong>{' '}
                    Receive a transparent rubric score, highlighted strengths, and recommended areas of study.
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#F2D5E1] bg-[#FFF0F5] p-3 text-[11px] text-[#BE356D]">
                <strong>Objective Assessment:</strong> HireLens evaluates strictly objective, job-relevant skills. No automated facial, emotion, or personality proxies are ever utilized.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="rounded-lg bg-[#D94683] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#BE356D]"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
