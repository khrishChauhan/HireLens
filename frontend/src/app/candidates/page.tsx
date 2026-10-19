'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Award,
  Eye,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { CandidateStage } from '@/lib/types';

export default function CandidatesPage() {
  const { candidates, jobs, setSelectedCandidateId, updateCandidateStage } = useHireLens();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<string>('All');

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesStage =
      selectedStage === 'All' ? true : c.stage === selectedStage;

    const matchesJob =
      selectedJob === 'All' ? true : c.jobId === selectedJob;

    return matchesSearch && matchesStage && matchesJob;
  });

  const stages: ('All' | CandidateStage)[] = [
    'All',
    'Applied',
    'Screening',
    'Interview',
    'Evaluation',
    'Decision',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
              Candidates
            </h2>
            <span className="rounded-full bg-[#FFF0F5] border border-[#F5D5E2] px-2.5 py-0.5 text-xs font-semibold text-[#D94683]">
              {candidates.length} in Pool
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Track applicant progress, resume verification, and objective skill rubrics.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#F0EBEF] bg-white p-3.5 shadow-2xs">
        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {stages.map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedStage === stg
                  ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
                  : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
              }`}
            >
              {stg}
              {stg !== 'All' && (
                <span className="ml-1.5 text-[10px] text-[#99919C]">
                  {candidates.filter((c) => c.stage === stg).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Job Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99919C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or skill..."
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] py-1.5 pl-9 pr-3 text-xs text-[#26212A] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>

          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-1.5 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
          >
            <option value="All">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="rounded-xl border border-[#F0EBEF] bg-white shadow-2xs overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-[#99919C] mb-2" />
            <h3 className="text-sm font-semibold text-[#26212A]">No candidates match filters</h3>
            <p className="mt-1 text-xs text-[#6F6873]">
              Try clearing your search query or switching to another hiring stage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0EBEF] bg-[#FFF9FB] text-[#99919C]">
                  <th className="px-5 py-3.5 font-semibold">Candidate</th>
                  <th className="px-4 py-3.5 font-semibold">Applied Role</th>
                  <th className="px-4 py-3.5 font-semibold">Hiring Stage</th>
                  <th className="px-4 py-3.5 font-semibold">Rubric Match</th>
                  <th className="px-4 py-3.5 font-semibold">Skills Verified</th>
                  <th className="px-4 py-3.5 font-semibold">Applied</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBEF]">
                {filteredCandidates.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#FFF9FB]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedCandidateId(c.id)}
                  >
                    {/* Name & Contact */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-xs font-bold text-[#BE356D]">
                          {c.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="font-bold text-[#26212A] block hover:text-[#D94683] transition-colors">
                            {c.name}
                          </span>
                          <span className="text-[11px] text-[#99919C]">
                            {c.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Applied Role */}
                    <td className="px-4 py-4 font-medium text-[#26212A]">
                      {c.role}
                      <span className="block text-[10px] text-[#99919C]">
                        {c.department}
                      </span>
                    </td>

                    {/* Stage Selector */}
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={c.stage}
                        onChange={(e) =>
                          updateCandidateStage(c.id, e.target.value as CandidateStage)
                        }
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                          c.stage === 'Interview'
                            ? 'bg-[#FFF0F5] text-[#D94683] border-[#F5D5E2]'
                            : c.stage === 'Evaluation'
                            ? 'bg-[#FEF8EC] text-[#B7791F] border-[#F8E6C3]'
                            : c.stage === 'Decision'
                            ? 'bg-[#EBF6F1] text-[#23845B] border-[#C6E7D7]'
                            : 'bg-white text-[#6F6873] border-[#F0EBEF]'
                        }`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Screening">Screening</option>
                        <option value="Interview">Interview</option>
                        <option value="Evaluation">Evaluation</option>
                        <option value="Decision">Decision</option>
                      </select>
                    </td>

                    {/* Rubric Match Score */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full text-[11px]">
                        <Award className="h-3 w-3" />
                        {c.matchScore}% Match
                      </span>
                    </td>

                    {/* Skills Verified */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {c.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md border border-[#F0EBEF] bg-[#FFF9FB] px-1.5 py-0.5 text-[10px] font-medium text-[#6F6873]"
                          >
                            {skill}
                          </span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="text-[10px] text-[#99919C] self-center">
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-[#99919C] text-[11px]">
                      {c.appliedDate}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidateId(c.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-[#F0EBEF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6F6873] hover:border-[#D94683] hover:text-[#D94683] transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
