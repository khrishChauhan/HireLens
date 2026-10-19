'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Plus,
  RefreshCw,
  X,
  ChevronDown,
  User,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export function Header() {
  const pathname = usePathname();
  const {
    backendStatus,
    backendMessage,
    checkBackendConnection,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsCreateJobModalOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
  } = useHireLens();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleManualCheck = async () => {
    setIsCheckingBackend(true);
    await checkBackendConnection();
    setTimeout(() => setIsCheckingBackend(false), 500);
  };

  // Determine current page title
  const getPageTitle = () => {
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/jobs')) return 'Job Openings';
    if (pathname.startsWith('/candidates')) return 'Candidates';
    if (pathname.startsWith('/interviews')) return 'Interviews';
    if (pathname.startsWith('/evaluations')) return 'Evaluations & Rubrics';
    if (pathname.startsWith('/reports')) return 'Recruitment Reports';
    if (pathname.startsWith('/team')) return 'Team & Interviewers';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#F0EBEF] bg-white px-4 md:px-8">
      {/* Left: Mobile hamburger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A] md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683]"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#99919C] hidden sm:inline">
            HireLens /
          </span>
          <h1 className="text-base font-semibold text-[#26212A]">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden max-w-xs flex-1 px-4 lg:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99919C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates, roles, skills..."
            className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] py-1.5 pl-9 pr-8 text-xs text-[#26212A] placeholder-[#99919C] transition-colors focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#99919C] hover:text-[#26212A]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* FastAPI Backend Connection Pill */}
        <button
          type="button"
          onClick={handleManualCheck}
          title={`Backend status: ${backendMessage}. Click to re-check.`}
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
            backendStatus === 'connected'
              ? 'border-[#C6E7D7] bg-[#EBF6F1] text-[#23845B] hover:bg-[#d8efe4]'
              : backendStatus === 'checking'
              ? 'border-[#F8E6C3] bg-[#FEF8EC] text-[#B7791F]'
              : 'border-[#F7CCD3] bg-[#FDF2F4] text-[#C24155] hover:bg-[#fadce1]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-[#23845B] animate-pulse'
                : backendStatus === 'checking'
                ? 'bg-[#B7791F] animate-ping'
                : 'bg-[#C24155]'
            }`}
          />
          <span>
            {backendStatus === 'connected'
              ? 'FastAPI Online'
              : backendStatus === 'checking'
              ? 'Checking...'
              : 'API Offline (Local)'}
          </span>
          <RefreshCw
            className={`h-2.5 w-2.5 text-[#99919C] ml-0.5 ${
              isCheckingBackend ? 'animate-spin' : ''
            }`}
          />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] transition-colors hover:bg-[#FFF9FB] hover:text-[#26212A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683]"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D94683] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D94683]" />
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border border-[#F0EBEF] bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#26212A]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FFF0F5] px-1.5 py-0.5 text-[10px] font-bold text-[#D94683]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-[#D94683] hover:text-[#BE356D]"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`cursor-pointer rounded-lg p-2.5 text-xs transition-colors ${
                      n.unread ? 'bg-[#FFF9FB] border border-[#F5D5E2]' : 'hover:bg-[#FFF9FB]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-[#26212A]">{n.title}</span>
                      <span className="text-[10px] text-[#99919C] shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#6F6873]">{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => setIsCreateJobModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94683] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#BE356D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683] focus-visible:ring-offset-2"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Create Job</span>
          <span className="sm:hidden">Job</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-[#FFF9FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94683]"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-xs font-bold text-[#BE356D]">
              AV
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#99919C] hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[#F0EBEF] bg-white p-2 shadow-lg">
              <div className="border-b border-[#F0EBEF] px-2 py-1.5 text-left">
                <p className="text-xs font-semibold text-[#26212A]">Alex Vance</p>
                <p className="text-[11px] text-[#99919C]">alex.vance@hirelens.internal</p>
              </div>

              <div className="mt-1 space-y-0.5">
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A] cursor-pointer">
                  <User className="h-3.5 w-3.5 text-[#99919C]" />
                  Recruiter Profile
                </div>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A] cursor-pointer">
                  <HelpCircle className="h-3.5 w-3.5 text-[#99919C]" />
                  Documentation & Help
                </div>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#C24155] hover:bg-[#FDF2F4] cursor-pointer">
                  <LogOut className="h-3.5 w-3.5 text-[#C24155]" />
                  Sign Out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
