'use client';

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { InterviewType } from '@/lib/types';

export function ScheduleInterviewModal() {
  const {
    isScheduleInterviewModalOpen,
    setIsScheduleInterviewModalOpen,
    candidates,
    teamMembers,
    scheduleInterview,
  } = useHireLens();

  const [candidateId, setCandidateId] = useState(candidates[0]?.id || '');
  const [date, setDate] = useState('Tomorrow, Oct 20');
  const [time, setTime] = useState('2:00 PM — 3:00 PM EDT');
  const [type, setType] = useState<InterviewType>('Live Problem Solving');
  const [interviewer, setInterviewer] = useState('David Chen');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isScheduleInterviewModalOpen) return null;

  const selectedCandidate = candidates.find((c) => c.id === candidateId) || candidates[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    scheduleInterview({
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      candidateRole: selectedCandidate.role,
      jobTitle: selectedCandidate.role,
      date,
      time,
      type,
      status: 'Scheduled',
      interviewer,
      meetingRoom: `lens-room-${Math.random().toString(36).substring(2, 6)}`,
      notes,
    });

    setIsScheduleInterviewModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[#F0EBEF] bg-white p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF0F5] border border-[#F5D5E2] text-[#D94683]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#26212A]">Schedule Interview</h2>
              <p className="text-xs text-[#99919C]">
                Arrange technical or rubric-based candidate interview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScheduleInterviewModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="text-xs text-[#C24155] bg-[#FDF2F4] p-2 rounded-lg">{error}</p>
          )}

          {/* Candidate Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Select Candidate *
            </label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.role} ({c.stage})
                </option>
              ))}
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Assessment Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InterviewType)}
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            >
              <option value="Live Problem Solving">Live Problem Solving (Coding & Concurrency)</option>
              <option value="System Architecture">System Architecture & Scalability</option>
              <option value="Technical Screen">Technical Screen & Fundamental Verification</option>
              <option value="Domain & Culture Fit">Domain & Culture Fit</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Date *
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Oct 22, 2026"
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Time Slot *
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 2:00 PM — 3:00 PM EDT"
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              />
            </div>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Interviewer
            </label>
            <select
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            >
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.name}>
                  {tm.name} — {tm.role} ({tm.department})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Assessment Objectives & Focus Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on distributed cache invalidation and database rollback strategies."
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] placeholder-[#99919C] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EBEF]">
            <button
              type="button"
              onClick={() => setIsScheduleInterviewModalOpen(false)}
              className="rounded-lg border border-[#F0EBEF] px-4 py-2 text-xs font-medium text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D94683] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] focus:outline-none focus:ring-2 focus:ring-[#D94683]"
            >
              Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
