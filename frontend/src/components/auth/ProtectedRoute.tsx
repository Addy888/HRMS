'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for hydration to complete before making redirect decisions
    if (!isHydrated) return;

    // Not authenticated -> redirect to login
    if (!isAuthenticated || !user) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to:', redirectTo);
      router.replace(redirectTo);
      return;
    }

    // Authenticated but wrong role -> redirect to correct dashboard
    if (!allowedRoles.includes(user.role)) {
      console.log('[ProtectedRoute] Wrong role. User role:', user.role, 'Allowed:', allowedRoles);
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/super-admin');
      } else if (['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role)) {
        router.replace('/hr');
      } else if (user.role === 'EMPLOYEE') {
        router.replace('/employee');
      } else {
        router.replace(redirectTo);
      }
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Not authenticated - block render and show loading
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Wrong role - block render and show loading
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Authenticated with correct role
  return <>{children}</>;
}
