'use client';

import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Building,
  Save,
  CheckCircle,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export default function SettingsPage() {
  const { showToast } = useHireLens();

  const [companyName, setCompanyName] = useState('HireLens Technologies Inc.');
  const [domain, setDomain] = useState('hirelens.internal');
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [candidateAlerts, setCandidateAlerts] = useState(true);
  const [evaluationAlerts, setEvaluationAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Settings saved successfully!');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="border-b border-[#F0EBEF] pb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26212A]">
          Workspace Settings
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#6F6873]">
          Configure workspace identity, light theme design system, and notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Workspace Identity */}
        <section className="rounded-xl border border-[#F0EBEF] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0EBEF] pb-3">
            <Building className="h-4 w-4 text-[#D94683]" />
            <h3 className="text-sm font-bold text-[#26212A]">Workspace Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Authorized Talent Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              />
            </div>
          </div>
        </section>

        {/* Appearance & Design System */}
        <section className="rounded-xl border border-[#F0EBEF] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0EBEF] pb-3">
            <Sun className="h-4 w-4 text-[#D94683]" />
            <h3 className="text-sm font-bold text-[#26212A]">Theme & Aesthetics</h3>
          </div>

          <p className="text-xs text-[#6F6873]">
            HireLens is strictly engineered around a high-clarity Light Theme design system with warm white backgrounds, soft blush surfaces, and rose-pink accents.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border-2 border-[#D94683] bg-[#FFF0F5] p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#BE356D]">Light Mode (Active)</span>
                <CheckCircle className="h-4 w-4 text-[#D94683]" />
              </div>
              <p className="mt-1 text-[11px] text-[#6F6873]">
                Default and enforced enterprise theme for optimal contrast and readability.
              </p>
            </div>

            <div className="rounded-xl border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-left opacity-60">
              <span className="text-xs font-semibold text-[#99919C]">Dark Mode</span>
              <p className="mt-1 text-[11px] text-[#99919C]">
                Disabled per design specification.
              </p>
            </div>

            <div className="rounded-xl border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-left opacity-60">
              <span className="text-xs font-semibold text-[#99919C]">High Contrast</span>
              <p className="mt-1 text-[11px] text-[#99919C]">
                WCAG 2.1 AA compliant by default.
              </p>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-xl border border-[#F0EBEF] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0EBEF] pb-3">
            <Bell className="h-4 w-4 text-[#D94683]" />
            <h3 className="text-sm font-bold text-[#26212A]">Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-[#F0EBEF] p-3 cursor-pointer hover:bg-[#FFF9FB]">
              <div>
                <span className="text-xs font-bold text-[#26212A] block">
                  Interview Reminders
                </span>
                <span className="text-[11px] text-[#6F6873]">
                  Receive notifications 1 hour and 10 minutes before scheduled technical rounds
                </span>
              </div>
              <input
                type="checkbox"
                checked={interviewReminders}
                onChange={(e) => setInterviewReminders(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D94683]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-[#F0EBEF] p-3 cursor-pointer hover:bg-[#FFF9FB]">
              <div>
                <span className="text-xs font-bold text-[#26212A] block">
                  Evaluation Sign-off Alerts
                </span>
                <span className="text-[11px] text-[#6F6873]">
                  Alert when an interviewer submits a completed candidate rubric
                </span>
              </div>
              <input
                type="checkbox"
                checked={evaluationAlerts}
                onChange={(e) => setEvaluationAlerts(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D94683]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-[#F0EBEF] p-3 cursor-pointer hover:bg-[#FFF9FB]">
              <div>
                <span className="text-xs font-bold text-[#26212A] block">
                  New Candidate Applications
                </span>
                <span className="text-[11px] text-[#6F6873]">
                  Notify on new submissions to active open roles
                </span>
              </div>
              <input
                type="checkbox"
                checked={candidateAlerts}
                onChange={(e) => setCandidateAlerts(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D94683]"
              />
            </label>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
