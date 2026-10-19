'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Video,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export default function InterviewsPage() {
  const {
    interviews,
    setIsScheduleInterviewModalOpen,
    updateInterviewStatus,
  } = useHireLens();

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'All'>('Upcoming');
  const [search, setSearch] = useState('');

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      item.candidateRole.toLowerCase().includes(search.toLowerCase()) ||
      item.interviewer.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === 'Upcoming'
        ? item.status === 'Scheduled'
        : activeTab === 'Completed'
        ? item.status === 'Completed'
        : true;

    return matchesSearch && matchesTab;
  });

  const scheduledCount = interviews.filter((i) => i.status === 'Scheduled').length;
  const completedCount = interviews.filter((i) => i.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
              Interviews
            </h2>
            <span className="rounded-full bg-[#FFF0F5] border border-[#F5D5E2] px-2.5 py-0.5 text-xs font-semibold text-[#D94683]">
              {scheduledCount} Scheduled
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Coordinate live coding assessments, system architecture evaluations, and technical screening rounds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsScheduleInterviewModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Schedule Interview
        </button>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#F0EBEF] bg-white p-3.5 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('Upcoming')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'Upcoming'
                ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
                : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
            }`}
          >
            Upcoming ({scheduledCount})
          </button>
          <button
            onClick={() => setActiveTab('Completed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'Completed'
                ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
                : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('All')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'All'
                ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
                : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
            }`}
          >
            All ({interviews.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99919C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate or interviewer..."
            className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] py-1.5 pl-9 pr-3 text-xs text-[#26212A] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
          />
        </div>
      </div>

      {/* Interviews Grid / Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredInterviews.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[#F0EBEF] bg-white p-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-[#99919C] mb-2" />
            <h3 className="text-sm font-semibold text-[#26212A]">No interviews found</h3>
            <p className="mt-1 text-xs text-[#6F6873]">
              No sessions match your selected filter or search.
            </p>
          </div>
        ) : (
          filteredInterviews.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-2xs transition-all hover:border-[#F5D5E2] hover:shadow-xs space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-md bg-[#FFF0F5] border border-[#F5D5E2] px-2 py-0.5 text-[10px] font-bold text-[#BE356D] uppercase tracking-wider mb-1.5">
                    {item.type}
                  </span>
                  <h3 className="text-sm font-bold text-[#26212A]">
                    {item.candidateName}
                  </h3>
                  <p className="text-xs text-[#6F6873]">{item.candidateRole}</p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.status === 'Scheduled'
                      ? 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                      : item.status === 'Completed'
                      ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                      : 'bg-[#FDF2F4] text-[#C24155]'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Timing & Room */}
              <div className="space-y-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0EBEF] p-3 text-xs">
                <div className="flex items-center gap-2 text-[#26212A] font-medium">
                  <Calendar className="h-3.5 w-3.5 text-[#D94683]" />
                  <span>{item.date}</span>
                  <span className="text-[#99919C]">•</span>
                  <Clock className="h-3.5 w-3.5 text-[#99919C]" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6F6873] pt-1">
                  <span>Interviewer: <strong className="text-[#26212A]">{item.interviewer}</strong></span>
                  <span className="font-mono text-[#99919C]">{item.meetingRoom}</span>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-[11px] text-[#6F6873] italic">
                  &ldquo;{item.notes}&rdquo;
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-[#F0EBEF] pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-[#99919C]">
                  <Video className="h-3.5 w-3.5 text-[#D94683]" />
                  <span>Integrated Coding Sandbox</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'Scheduled' ? (
                    <button
                      type="button"
                      onClick={() => updateInterviewStatus(item.id, 'Completed')}
                      className="inline-flex items-center gap-1 rounded-md border border-[#C6E7D7] bg-[#EBF6F1] px-2.5 py-1 text-[11px] font-semibold text-[#23845B] hover:bg-[#d8efe4]"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Mark Completed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateInterviewStatus(item.id, 'Scheduled')}
                      className="rounded-md border border-[#F0EBEF] px-2 py-1 text-[11px] font-medium text-[#6F6873] hover:bg-[#FFF9FB]"
                    >
                      Re-open
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
