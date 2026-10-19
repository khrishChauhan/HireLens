'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';

export function ToastContainer() {
  const { toasts, removeToast } = useHireLens();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3.5 shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'border-[#C6E7D7] bg-white text-[#26212A]'
              : toast.type === 'error'
              ? 'border-[#F7CCD3] bg-white text-[#26212A]'
              : 'border-[#CCDDF7] bg-white text-[#26212A]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#23845B] mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C24155] mt-0.5" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-[#5378C9] mt-0.5" />
          )}

          <p className="flex-1 text-xs font-medium text-[#26212A]">
            {toast.message}
          </p>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#99919C] hover:text-[#26212A] ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
