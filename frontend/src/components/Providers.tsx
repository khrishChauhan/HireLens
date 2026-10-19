'use client';

import React from 'react';
import { HireLensProvider } from '@/context/HireLensContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <HireLensProvider>{children}</HireLensProvider>;
}
