'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isHydrated } = useAuthStore();

  const isPlatformAdmin = Boolean(user && user.role === 'PLATFORM_SUPER_ADMIN');

  React.useEffect(() => {
    if (isHydrated && !isPlatformAdmin) {
      router.replace('/login');
    }
  }, [isHydrated, isPlatformAdmin, router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/platform-admin',
      icon: LayoutDashboard,
      current: pathname === '/platform-admin',
    },
    {
      name: 'Companies',
      href: '/platform-admin/companies',
      icon: Building2,
      current: pathname.startsWith('/platform-admin/companies'),
    },
    {
      name: 'Reports',
      href: '/platform-admin/reports',
      icon: BarChart3,
      current: pathname.startsWith('/platform-admin/reports'),
    },
    {
      name: 'Settings',
      href: '/platform-admin/settings',
      icon: Settings,
      current: pathname.startsWith('/platform-admin/settings'),
    },
  ];

  if (!isHydrated || !isPlatformAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 text-foreground flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Platform Admin</h1>
              <p className="text-xs text-muted-foreground">System Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${
                    item.current
                      ? 'bg-primary text-foreground shadow-lg'
                      : 'text-card-foreground hover:bg-secondary/50 hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                Platform Admin
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="min-h-full">{children}</main>
      </div>
    </div>
  );
}
