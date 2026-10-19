'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { AssessmentStage } from '@/lib/assessment-types';

interface ProgressIndicatorProps {
  currentStage: AssessmentStage;
}

export function ProgressIndicator({ currentStage }: ProgressIndicatorProps) {
  const stages = [
    { id: 1, key: 'upload', label: 'Resume' },
    { id: 2, key: 'analysis', label: 'Analysis' },
    { id: 3, key: 'interview', label: 'Interview' },
    { id: 4, key: 'results', label: 'Results' },
  ];

  // Map application stages to index (1 to 4)
  const getStageIndex = (stage: AssessmentStage): number => {
    switch (stage) {
      case 'upload':
        return 1;
      case 'analyzing':
      case 'analysis':
        return 2;
      case 'interview':
      case 'evaluating':
        return 3;
      case 'results':
        return 4;
      default:
        return 1;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <nav aria-label="Assessment Progress" className="w-full border-b border-[#EEE9EE] bg-[#FFF9FB]/50 py-3.5 px-4 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <ol className="flex items-center justify-between">
          {stages.map((stage, idx) => {
            const isCompleted = currentIndex > stage.id;
            const isCurrent = currentIndex === stage.id;

            return (
              <li
                key={stage.id}
                className={`relative flex items-center ${
                  idx !== stages.length - 1 ? 'w-full' : ''
                }`}
              >
                {/* Step Circle & Label */}
                <div className="flex items-center gap-2 z-10 bg-white sm:bg-transparent pr-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#23845B] text-white'
                        : isCurrent
                        ? 'border-2 border-[#D94683] bg-[#FFF0F5] text-[#D94683] shadow-xs'
                        : 'border border-[#EEE9EE] bg-white text-[#99919C]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                    ) : (
                      <span>{stage.id}</span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                      isCompleted
                        ? 'text-[#28232B]'
                        : isCurrent
                        ? 'text-[#D94683]'
                        : 'text-[#99919C]'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connecting Line (for all except last) */}
                {idx !== stages.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-[2px] bg-[#EEE9EE] overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        isCompleted ? 'bg-[#23845B] w-full' : isCurrent ? 'bg-[#D94683] w-1/2' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
