'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sparkles,
  DollarSign,
  Clock,
  UserCog,
  Shield,
  Search,
  BarChart3,
  Settings,
  FileText,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import NotificationBell from '@/components/NotificationBell';
import NotificationToastProvider from '@/components/NotificationToastProvider';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon, children, active, onClick }: SidebarLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-white shadow-md border border-purple-500/30'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const isSuperAdmin = Boolean(user && user.role === 'SUPER_ADMIN');

  React.useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login/admin');
      return;
    }

    if (!isSuperAdmin) {
      if (['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role)) {
        router.replace('/hr');
      } else if (user.role === 'EMPLOYEE') {
        router.replace('/employee');
      } else {
        router.replace('/login');
      }
      return;
    }
  }, [isAuthenticated, user, isHydrated, isSuperAdmin, router]);

  if (!isHydrated || !isAuthenticated || !user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const links = [
    { href: '/super-admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/super-admin/employees', label: 'Employees', icon: <Users className="w-5 h-5" /> },
    { href: '/super-admin/admins', label: 'Admins', icon: <UserCog className="w-5 h-5" /> },
    { href: '/super-admin/processes', label: 'Processes', icon: <Layers className="w-5 h-5" /> },
    { href: '/super-admin/attendance', label: 'Attendance', icon: <Clock className="w-5 h-5" /> },
    { href: '/super-admin/payroll', label: 'Payroll', icon: <DollarSign className="w-5 h-5" /> },
    { href: '/super-admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { href: '/super-admin/reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <NotificationToastProvider>
      <div className="flex min-h-screen bg-black text-white antialiased">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-950 p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="bg-gradient-to-tr from-purple-500 to-indigo-600 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              FCS HRMS
            </span>
          </div>

          {/* User Card */}
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Company Owner</span>
            <span className="text-sm font-semibold truncate">{user?.email || 'owner@fcs.com'}</span>
            <span className="text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded w-max mt-1 font-bold uppercase tracking-wider">
              SUPER ADMIN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            {links.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                active={pathname === link.href || (link.href !== '/super-admin' && pathname.startsWith(link.href))}
              >
                {link.label}
              </SidebarLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky Unified Top Header */}
          <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6 py-4 sticky top-0 z-30 backdrop-blur-md bg-neutral-950/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500 md:hidden" />
                <span className="font-heading font-bold text-white md:hidden">FCS HRMS</span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-purple-500" />
                  Super Admin Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </header>

          {/* Mobile Sidebar overlay */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <aside className="relative flex flex-col w-64 bg-neutral-950 p-6 border-r border-neutral-800 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-heading text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Super Admin
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1">
                  {links.map((link) => (
                    <div key={link.href} onClick={() => setMobileOpen(false)}>
                      <SidebarLink
                        href={link.href}
                        icon={link.icon}
                        active={pathname === link.href || (link.href !== '/super-admin' && pathname.startsWith(link.href))}
                      >
                        {link.label}
                      </SidebarLink>
                    </div>
                  ))}
                </nav>
                <div className="border-t border-neutral-800 pt-6 mt-auto">
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </aside>
            </div>
          )}

          <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </NotificationToastProvider>
  );
}
