'use client';

import React from 'react';
import { HireLensProvider } from '@/context/HireLensContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { CreateJobModal } from '@/components/modals/CreateJobModal';
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal';
import { InviteTeamModal } from '@/components/modals/InviteTeamModal';
import { CandidateDetailDrawer } from '@/components/modals/CandidateDetailDrawer';
import { EvaluationDetailModal } from '@/components/modals/EvaluationDetailModal';
import { ToastContainer } from '@/components/ui/ToastContainer';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <HireLensProvider>
      <div className="flex min-h-screen bg-white text-[#26212A]">
        {/* Desktop Sidebar (Fixed left ~260px) */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-20">
          <Sidebar />
        </div>

        {/* Main Application Area (Pushed right by sidebar width on desktop) */}
        <div className="flex flex-1 flex-col md:pl-64">
          <Header />
          <main className="flex-1 bg-[#FFFFFF] px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileDrawer />

        {/* Global Modals & Drawers */}
        <CreateJobModal />
        <ScheduleInterviewModal />
        <InviteTeamModal />
        <CandidateDetailDrawer />
        <EvaluationDetailModal />
        <ToastContainer />
      </div>
    </HireLensProvider>
  );
}
