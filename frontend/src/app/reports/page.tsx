'use client';

import React from 'react';
import { INITIAL_PIPELINE_STAGES } from '@/lib/mock-data';

export default function ReportsPage() {
  const deptData = [
    { dept: 'Engineering', count: 7, percent: 50 },
    { dept: 'AI & Data', count: 2, percent: 14 },
    { dept: 'Product', count: 2, percent: 14 },
    { dept: 'Platform', count: 2, percent: 14 },
    { dept: 'Design', count: 1, percent: 8 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#F0EBEF] pb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
          Recruitment Intelligence Reports
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
          Analyze funnel throughput, department hiring distribution, and rubric completion velocity.
        </p>
      </div>

      {/* Summary KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#6F6873]">Funnel Throughput</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#26212A]">248</span>
            <span className="text-xs font-semibold text-[#23845B]">+12% vs last mo</span>
          </div>
          <p className="mt-1 text-[11px] text-[#99919C]">Total candidates evaluated</p>
        </div>

        <div className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#6F6873]">Avg Time to Rubric Sign-off</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#26212A]">1.8 days</span>
            <span className="text-xs font-semibold text-[#23845B]">Fast</span>
          </div>
          <p className="mt-1 text-[11px] text-[#99919C]">From interview to sign-off</p>
        </div>

        <div className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#6F6873]">Rubric Completion Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#26212A]">96.4%</span>
            <span className="text-xs font-semibold text-[#23845B]">Standard AA</span>
          </div>
          <p className="mt-1 text-[11px] text-[#99919C]">Completed evidence rubrics</p>
        </div>

        <div className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#6F6873]">Active Roles Capacity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#26212A]">12</span>
            <span className="text-xs font-semibold text-[#6F6873]">Roles</span>
          </div>
          <p className="mt-1 text-[11px] text-[#99919C]">Across 5 business units</p>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Funnel Stage Breakdown */}
        <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#26212A]">Hiring Stage Conversion</h3>
              <p className="text-xs text-[#99919C]">Drop-off and retention across hiring funnel</p>
            </div>
            <span className="text-xs font-semibold text-[#D94683]">248 Total</span>
          </div>

          <div className="mt-5 space-y-4">
            {INITIAL_PIPELINE_STAGES.map((stg) => {
              const percent = Math.round((stg.count / 248) * 100);
              return (
                <div key={stg.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#26212A]">{stg.stage}</span>
                    <span className="text-[#6F6873]">
                      {stg.count} candidates ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#FFF0F5] overflow-hidden">
                    <div
                      className="h-full bg-[#D94683] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roles by Department */}
        <section className="rounded-xl border border-[#F0EBEF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#26212A]">Open Positions by Department</h3>
              <p className="text-xs text-[#99919C]">Workforce allocation across teams</p>
            </div>
            <span className="text-xs font-semibold text-[#6F6873]">14 Positions</span>
          </div>

          <div className="mt-5 space-y-4">
            {deptData.map((d) => (
              <div key={d.dept} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#26212A]">{d.dept}</span>
                  <span className="text-[#6F6873]">
                    {d.count} roles ({d.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#FFF9FB] border border-[#F0EBEF] overflow-hidden">
                  <div
                    className="h-full bg-[#BE356D] rounded-full transition-all duration-500"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
