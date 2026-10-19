'use client';

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { TeamRole } from '@/lib/types';

export function InviteTeamModal() {
  const { isInviteTeamModalOpen, setIsInviteTeamModalOpen, addTeamMember } = useHireLens();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState<TeamRole>('Technical Interviewer');
  const [error, setError] = useState('');

  if (!isInviteTeamModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide full name and work email.');
      return;
    }

    addTeamMember({
      name,
      email,
      department,
      role,
    });

    setName('');
    setEmail('');
    setError('');
    setIsInviteTeamModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#F0EBEF] bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF0F5] border border-[#F5D5E2] text-[#D94683]">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#26212A]">Invite Team Member</h2>
              <p className="text-xs text-[#99919C]">Add interviewers or hiring managers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInviteTeamModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="text-xs text-[#C24155] bg-[#FDF2F4] p-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Lee"
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Work Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jordan.lee@company.com"
              className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
                <option value="Engineering">Engineering</option>
                <option value="AI & Data">AI & Data</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
                <option value="Technical Interviewer">Technical Interviewer</option>
                <option value="Hiring Manager">Hiring Manager</option>
                <option value="Lead Recruiter">Lead Recruiter</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EBEF]">
            <button
              type="button"
              onClick={() => setIsInviteTeamModalOpen(false)}
              className="rounded-lg border border-[#F0EBEF] px-4 py-2 text-xs font-medium text-[#6F6873] hover:bg-[#FFF9FB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D94683] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D]"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
