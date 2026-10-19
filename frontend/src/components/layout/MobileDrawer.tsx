'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useHireLens } from '@/context/HireLensContext';

export function MobileDrawer() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useHireLens();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer from Left */}
      <div className="relative flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out">
        {/* Close Button */}
        <div className="absolute right-2 top-3 z-10">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A] focus:outline-none focus:ring-2 focus:ring-[#D94683]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="h-full overflow-y-auto">
          <Sidebar onNavClick={() => setIsMobileMenuOpen(false)} />
        </div>
      </div>
    </div>
  );
}
