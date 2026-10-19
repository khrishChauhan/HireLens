'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const { jobs, candidates, interviews, evaluations } = useHireLens();

  const activeJobsCount = jobs.filter((j) => j.status === 'Active').length;
  const pendingEvalsCount = evaluations.filter((e) => e.status === 'Pending Review').length;
  const scheduledInterviewsCount = interviews.filter((i) => i.status === 'Scheduled').length;

  const workspaceNav = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      badge: activeJobsCount.toString(),
    },
    {
      name: 'Candidates',
      href: '/candidates',
      icon: Users,
      badge: candidates.length.toString(),
    },
    {
      name: 'Interviews',
      href: '/interviews',
      icon: Calendar,
      badge: scheduledInterviewsCount.toString(),
    },
    {
      name: 'Evaluations',
      href: '/evaluations',
      icon: CheckCircle2,
      badge: pendingEvalsCount > 0 ? pendingEvalsCount.toString() : null,
      badgeAlert: pendingEvalsCount > 0,
    },
  ];

  const managementNav = [
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
    {
      name: 'Team',
      href: '/team',
      icon: ShieldCheck,
    },
  ];

  const settingsNav = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const renderNavItem = (item: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string | null;
    badgeAlert?: boolean;
  }) => {
    const isActive =
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavClick}
        className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#FFF0F5] text-[#BE356D]'
            : 'text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]'
        }`}
      >
        {/* Active left indicator pill */}
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#D94683]" />
        )}

        <div className="flex items-center gap-2.5">
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive
                ? 'text-[#D94683]'
                : 'text-[#99919C] group-hover:text-[#6F6873]'
            }`}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          <span>{item.name}</span>
        </div>

        {item.badge && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              isActive
                ? 'bg-[#D94683] text-white'
                : item.badgeAlert
                ? 'bg-[#FFF0F5] text-[#D94683] border border-[#F5D5E2]'
                : 'bg-[#F0EBEF] text-[#6F6873]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col justify-between border-r border-[#F0EBEF] bg-white">
      {/* Top Brand Section */}
      <div>
        <div className="flex items-center justify-between border-b border-[#F0EBEF] px-5 py-4">
          <Link
            href="/"
            onClick={onNavClick}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683] rounded-md"
          >
            {/* Custom geometric lens monogram */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#F5D5E2] bg-[#FFF0F5] shadow-xs">
              <div className="h-4 w-4 rounded-full border-2 border-[#D94683] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#BE356D]" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#26212A] flex items-center gap-1">
                HireLens
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D94683]" />
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#99919C] font-semibold">
                Recruitment OS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-6 px-3 py-4">
          {/* Workspace */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#99919C] uppercase">
              Workspace
            </div>
            <nav className="space-y-1">
              {workspaceNav.map(renderNavItem)}
            </nav>
          </div>

          {/* Management */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#99919C] uppercase">
              Management
            </div>
            <nav className="space-y-1">
              {managementNav.map(renderNavItem)}
            </nav>
          </div>

          {/* Settings */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#99919C] uppercase">
              Settings
            </div>
            <nav className="space-y-1">
              {settingsNav.map(renderNavItem)}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-[#F0EBEF] p-3">
        <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[#FFF9FB]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-xs font-bold text-[#BE356D]">
              AV
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="truncate text-xs font-semibold text-[#26212A]">
                Alex Vance
              </span>
              <span className="truncate text-[11px] text-[#99919C]">
                Lead Recruiter
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#23845B]" title="Active" />
        </div>
      </div>
    </aside>
  );
}
