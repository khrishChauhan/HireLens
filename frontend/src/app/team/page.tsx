'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export default function TeamPage() {
  const { teamMembers, setIsInviteTeamModalOpen } = useHireLens();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0EBEF] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
              Team & Interviewers
            </h2>
            <span className="rounded-full bg-[#FFF0F5] border border-[#F5D5E2] px-2.5 py-0.5 text-xs font-semibold text-[#D94683]">
              {teamMembers.length} Members
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
            Manage recruitment leads, technical interviewers, and rubric reviewer permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteTeamModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Invite Team Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="rounded-xl border border-[#F0EBEF] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0EBEF] bg-[#FFF9FB] text-[#99919C]">
                <th className="px-5 py-3.5 font-semibold">Member</th>
                <th className="px-4 py-3.5 font-semibold">Role</th>
                <th className="px-4 py-3.5 font-semibold">Department</th>
                <th className="px-4 py-3.5 font-semibold">Active Interviews</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBEF]">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#FFF9FB]/60 transition-colors">
                  {/* Member Name & Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-xs font-bold text-[#BE356D]">
                        {member.avatarInitials}
                      </div>
                      <div>
                        <span className="font-bold text-[#26212A] block">
                          {member.name}
                        </span>
                        <span className="text-[11px] text-[#99919C]">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4">
                    <span className="font-semibold text-[#26212A]">
                      {member.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-4 text-[#6F6873]">
                    {member.department}
                  </td>

                  {/* Active Interviews */}
                  <td className="px-4 py-4 font-semibold text-[#26212A]">
                    {member.activeInterviewsCount} assigned
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        member.status === 'Active'
                          ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                          : 'bg-[#FEF8EC] text-[#B7791F] border border-[#F8E6C3]'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      className="rounded-md border border-[#F0EBEF] px-2.5 py-1 text-[11px] font-medium text-[#6F6873] hover:border-[#D94683] hover:text-[#D94683]"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
