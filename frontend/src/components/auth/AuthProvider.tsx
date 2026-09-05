'use client';

import React, { useEffect, useRef } from 'react';
import useAuthStore from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      initializeAuth();
    }
  }, [initializeAuth]);

  return <>{children}</>;
}
