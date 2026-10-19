'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Users,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { JobStatus } from '@/lib/types';

export default function JobsPage() {
  const { jobs, setIsCreateJobModalOpen, updateJobStatus } = useHireLens();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  // Filtering
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'All' ? true : job.status === selectedStatus;

    const matchesDept =
      selectedDepartment === 'All' ? true : job.department === selectedDepartment;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const statuses: ('All' | JobStatus)[] = ['All', 'Active', 'Draft', 'Paused', 'Closed'];
  const departments = ['All', 'Engineering', 'AI & Data', 'Product', 'Design', 'Platform'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
            Job Openings
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Manage open roles, structured evaluation rubrics, and active applicant pools.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateJobModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create Job Opening
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#F0EBEF] bg-white p-3.5 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-[#FFF0F5] text-[#BE356D] border border-[#F5D5E2] font-semibold'
                  : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
              }`}
            >
              {st}
              {st !== 'All' && (
                <span className="ml-1.5 text-[10px] text-[#99919C]">
                  {jobs.filter((j) => j.status === st).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Department Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99919C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or skills..."
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] py-1.5 pl-9 pr-3 text-xs text-[#26212A] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-1.5 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#F0EBEF] bg-white p-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-[#99919C] mb-2" />
            <h3 className="text-sm font-semibold text-[#26212A]">No jobs found</h3>
            <p className="mt-1 text-xs text-[#6F6873]">
              No positions matched your active filter criteria. Try adjusting your search.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group relative rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-2xs transition-all hover:border-[#F5D5E2] hover:shadow-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#26212A] group-hover:text-[#D94683] transition-colors">
                      {job.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        job.status === 'Active'
                          ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                          : job.status === 'Draft'
                          ? 'bg-[#F0EBEF] text-[#6F6873]'
                          : job.status === 'Paused'
                          ? 'bg-[#FEF8EC] text-[#B7791F] border border-[#F8E6C3]'
                          : 'bg-[#FDF2F4] text-[#C24155] border border-[#F7CCD3]'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-[11px] text-[#99919C] font-medium">
                      {job.department} • {job.type}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-[#6F6873] line-clamp-2 max-w-2xl leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-[#F0EBEF] bg-[#FFF9FB] px-2 py-0.5 text-[11px] font-medium text-[#6F6873]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Metadata & Actions */}
                <div className="flex flex-row sm:flex-col sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBEF]">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#6F6873]">
                      <MapPin className="h-3 w-3 text-[#99919C]" />
                      {job.location}
                    </span>
                    <Link
                      href="/candidates"
                      className="flex items-center gap-1 font-semibold text-[#D94683] hover:text-[#BE356D]"
                    >
                      <Users className="h-3 w-3" />
                      {job.candidatesCount} Candidates
                    </Link>
                  </div>

                  {/* Status Toggle Controls */}
                  <div className="flex items-center gap-1.5">
                    {job.status === 'Active' ? (
                      <button
                        type="button"
                        onClick={() => updateJobStatus(job.id, 'Paused')}
                        className="rounded-md border border-[#F0EBEF] px-2.5 py-1 text-[11px] font-medium text-[#6F6873] hover:bg-[#FFF9FB]"
                      >
                        Pause Role
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateJobStatus(job.id, 'Active')}
                        className="rounded-md border border-[#C6E7D7] bg-[#EBF6F1] px-2.5 py-1 text-[11px] font-medium text-[#23845B] hover:bg-[#d8efe4]"
                      >
                        Activate Role
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Summary snippet */}
              <div className="mt-4 rounded-lg bg-[#FFF0F5]/60 border border-[#F5D5E2] p-2.5 text-[11px] text-[#BE356D]">
                <span className="font-semibold text-[#26212A]">Evaluation Rubric: </span>
                {job.rubricSummary}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
