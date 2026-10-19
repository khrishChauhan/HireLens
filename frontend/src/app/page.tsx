'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  Award,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { INITIAL_PIPELINE_STAGES, APPLICATION_TREND_DATA } from '@/lib/mock-data';

export default function OverviewPage() {
  const {
    jobs,
    candidates,
    interviews,
    evaluations,
    activities,
    setIsCreateJobModalOpen,
    setIsScheduleInterviewModalOpen,
    setSelectedCandidateId,
  } = useHireLens();

  // Metrics
  const activeJobs = jobs.filter((j) => j.status === 'Active').length;
  const totalCandidates = candidates.length > 8 ? 248 : candidates.length; // 248 sample baseline
  const scheduledInterviews = interviews.filter((i) => i.status === 'Scheduled').length;
  const pendingEvaluations = evaluations.filter((e) => e.status === 'Pending Review').length;

  const kpis = [
    {
      label: 'Active Jobs',
      value: activeJobs,
      sublabel: 'Across 5 departments',
      icon: Briefcase,
      href: '/jobs',
      trend: '+2 this week',
    },
    {
      label: 'Total Candidates',
      value: totalCandidates,
      sublabel: 'Active in hiring funnel',
      icon: Users,
      href: '/candidates',
      trend: '+18 past 7 days',
    },
    {
      label: 'Interviews Scheduled',
      value: scheduledInterviews,
      sublabel: 'Technical & domain rounds',
      icon: Calendar,
      href: '/interviews',
      trend: '6 scheduled today',
    },
    {
      label: 'Pending Evaluations',
      value: pendingEvaluations,
      sublabel: 'Require recruiter rubric sign-off',
      icon: CheckCircle2,
      href: '/evaluations',
      alert: pendingEvaluations > 0,
      trend: 'Action needed',
    },
  ];

  // Candidates for recent table (top 5)
  const recentCandidates = candidates.slice(0, 5);

  // Upcoming interviews (scheduled only, up to 4)
  const upcomingInterviews = interviews
    .filter((i) => i.status === 'Scheduled')
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Page Intro / Greeting Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
              Good morning, Alex
            </h2>
            <span className="rounded-full bg-[#FFF0F5] border border-[#F5D5E2] px-2.5 py-0.5 text-xs font-semibold text-[#D94683]">
              Senior Recruiter
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Here&apos;s what&apos;s happening across your hiring pipeline and technical interview rubrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsScheduleInterviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0EBEF] bg-white px-3.5 py-2 text-xs font-semibold text-[#6F6873] shadow-2xs hover:bg-[#FFF9FB] hover:text-[#26212A] transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-[#D94683]" />
            Schedule Interview
          </button>
          <button
            type="button"
            onClick={() => setIsCreateJobModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Create Job
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section aria-label="KPI Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group relative rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs transition-all hover:border-[#F5D5E2] hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6F6873]">
                    {kpi.label}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      kpi.alert
                        ? 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                        : 'bg-[#FFF9FB] text-[#6F6873] border border-[#F0EBEF]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#26212A] tracking-tight">
                    {kpi.value}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      kpi.alert ? 'text-[#D94683]' : 'text-[#23845B]'
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-[#99919C]">{kpi.sublabel}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Hiring Pipeline Section */}
      <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EBEF] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#26212A]">Hiring Pipeline Progression</h3>
            <p className="text-xs text-[#99919C]">
              Real-time distribution of 248 candidates across operational hiring stages
            </p>
          </div>
          <Link
            href="/candidates"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D94683] hover:text-[#BE356D]"
          >
            <span>View All Candidates</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal Pipeline Visualization */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {INITIAL_PIPELINE_STAGES.map((stg) => {
            return (
              <div
                key={stg.stage}
                className="relative rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-left transition-colors hover:border-[#F5D5E2]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6F6873] uppercase tracking-wider">
                    {stg.stage}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#26212A] border border-[#F0EBEF]">
                    {stg.count}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-[#99919C] leading-snug">
                  {stg.description}
                </p>

                {/* Progress mini-bar */}
                <div className="mt-3 h-1 w-full rounded-full bg-[#F0EBEF] overflow-hidden">
                  <div
                    className="h-full bg-[#D94683] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((stg.count / 248) * 100 * 2))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Operational Split: Left (Trend Chart + Recent Candidates Table), Right (Upcoming Interviews + Activity) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="space-y-8 lg:col-span-8">
          {/* Application Trend Chart (Accessible lightweight SVG) */}
          <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#26212A]">Application Volume Trend</h3>
                <p className="text-xs text-[#99919C]">New candidate submissions over the past 7 days</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D94683]" />
                <span className="text-xs text-[#6F6873]">Daily Applications</span>
              </div>
            </div>

            {/* SVG Trend Line / Area Chart */}
            <div className="mt-4 pt-2">
              <div className="h-40 w-full flex items-end justify-between gap-2 px-2">
                {APPLICATION_TREND_DATA.map((item) => {
                  const heightPercent = Math.round((item.count / 40) * 100);
                  return (
                    <div
                      key={item.day}
                      className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded bg-[#26212A] text-white text-[10px] px-1.5 py-0.5 whitespace-nowrap mb-1">
                        {item.count} apps ({item.date})
                      </div>

                      {/* Bar with pink brand fill */}
                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-[#FFF0F5] border-t border-x border-[#F5D5E2] group-hover:bg-[#D94683] group-hover:border-[#BE356D] transition-colors"
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Day Label */}
                      <span className="text-[11px] font-medium text-[#6F6873] group-hover:text-[#26212A]">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Recent Candidates Table */}
          <section className="rounded-xl border border-[#F0EBEF] bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F0EBEF] p-5">
              <div>
                <h3 className="text-sm font-bold text-[#26212A]">Recent Candidates</h3>
                <p className="text-xs text-[#99919C]">
                  Reviewed and processed through structured skill rubrics
                </p>
              </div>
              <Link
                href="/candidates"
                className="text-xs font-semibold text-[#D94683] hover:text-[#BE356D]"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F0EBEF] bg-[#FFF9FB] text-[#99919C]">
                    <th className="px-5 py-3 font-semibold">Candidate</th>
                    <th className="px-4 py-3 font-semibold">Applied Role</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Skill Match</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBEF]">
                  {recentCandidates.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#FFF9FB]/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidateId(c.id)}
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-[11px] font-bold text-[#BE356D]">
                            {c.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <span className="font-semibold text-[#26212A] block">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-[#99919C]">
                              {c.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 text-[#6F6873] font-medium">
                        {c.role}
                      </td>

                      {/* Stage Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            c.stage === 'Interview'
                              ? 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                              : c.stage === 'Evaluation'
                              ? 'bg-[#FEF8EC] text-[#B7791F] border border-[#F8E6C3]'
                              : c.stage === 'Decision'
                              ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                              : 'bg-[#F0EBEF] text-[#6F6873]'
                          }`}
                        >
                          {c.stage}
                        </span>
                      </td>

                      {/* Match Score */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full text-[11px]">
                          <Award className="h-3 w-3" />
                          {c.matchScore}%
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="px-4 py-3.5 text-[#99919C] text-[11px]">
                        {c.appliedDate}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(c.id);
                          }}
                          className="rounded-md border border-[#F0EBEF] px-2.5 py-1 text-[11px] font-medium text-[#6F6873] hover:border-[#D94683] hover:text-[#D94683] transition-colors"
                        >
                          View Rubric
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Upcoming Interviews & Activity Timeline */}
        <div className="space-y-8 lg:col-span-4">
          {/* Upcoming Interviews Panel */}
          <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#D94683]" />
                <h3 className="text-sm font-bold text-[#26212A]">Upcoming Interviews</h3>
              </div>
              <Link
                href="/interviews"
                className="text-xs font-semibold text-[#D94683] hover:text-[#BE356D]"
              >
                Schedule
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-xs space-y-1.5 transition-colors hover:border-[#F5D5E2]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#26212A]">{item.candidateName}</h4>
                      <p className="text-[11px] text-[#6F6873]">{item.candidateRole}</p>
                    </div>
                    <span className="rounded-md bg-[#FFF0F5] border border-[#F5D5E2] px-1.5 py-0.5 text-[10px] font-semibold text-[#BE356D]">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#99919C] pt-1 border-t border-[#F0EBEF]">
                    <span>{item.date} • {item.time}</span>
                    <span className="font-medium text-[#26212A]">{item.interviewer}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/interviews"
              className="mt-4 block text-center text-xs font-semibold text-[#6F6873] hover:text-[#26212A] border-t border-[#F0EBEF] pt-3"
            >
              See all scheduled interviews ({scheduledInterviews})
            </Link>
          </section>

          {/* Recruitment Activity Timeline */}
          <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-3">
              <h3 className="text-sm font-bold text-[#26212A]">Operational Activity</h3>
              <span className="text-[11px] text-[#99919C]">Live timeline</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-[#D94683]">
                    <Clock className="h-2.5 w-2.5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#26212A] leading-tight">{act.title}</p>
                    <p className="text-[11px] text-[#6F6873] mt-0.5 leading-snug">{act.description}</p>
                    <span className="text-[10px] text-[#99919C] block mt-1">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
