'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'SUPER_ADMIN') {
      router.replace('/super-admin');
    } else if (['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role)) {
      router.replace('/hr');
    } else if (user.role === 'EMPLOYEE') {
      router.replace('/employee');
    } else {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="h-7 w-7 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
    </div>
  );
}
