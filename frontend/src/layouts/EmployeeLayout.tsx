'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, User, FileText, CheckSquare, ShieldCheck,
  Settings, LogOut, Menu, X, ShieldAlert, LifeBuoy, Wallet, FileWarning
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import NotificationBell from '@/components/NotificationBell';
import NotificationToastProvider from '@/components/NotificationToastProvider';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
}

const SidebarLink = ({ href, icon, children, active }: SidebarLinkProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (user.role === 'HR') {
      router.push('/hr');
      return;
    }
    if (user.mustChangePassword && pathname !== '/change-password') {
      router.push('/change-password');
    }
  }, [isAuthenticated, user, pathname, router]);

  if (!isAuthenticated || !user || user.role !== 'EMPLOYEE') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const links = [
    { href: '/employee', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/employee/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
    { href: '/employee/my-salary', label: 'My Salary', icon: <Wallet className="w-5 h-5" /> },
    { href: '/employee/documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { href: '/employee/policies', label: 'Policies', icon: <ShieldCheck className="w-5 h-5" /> },
    { href: '/employee/acknowledge', label: 'Acknowledgement', icon: <CheckSquare className="w-5 h-5" /> },
    { href: '/employee/hr-actions', label: 'HR Actions', icon: <FileWarning className="w-5 h-5" /> },
    { href: '/employee/complaints', label: 'Helpdesk', icon: <LifeBuoy className="w-5 h-5" /> },
    { href: '/employee/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <NotificationToastProvider>
      <div className="flex min-h-screen bg-black text-white antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-950 p-6 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">FCS Employee</span>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <SidebarLink
              key={link.label}
              href={link.href}
              icon={link.icon}
              active={pathname === link.href || (link.href !== '/employee' && pathname.startsWith(link.href))}
            >
              {link.label}
            </SidebarLink>
          ))}
        </nav>

        {/* User profile & Logout */}
        <div className="border-t border-neutral-800 pt-6 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user.employee?.firstName?.charAt(0)}{user.employee?.lastName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-white">
                {user.employee?.firstName} {user.employee?.lastName}
              </p>
              <p className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">
                {user.employee?.employeeId}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
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
              className="md:hidden p-1 rounded-lg text-neutral-450 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-500 md:hidden" />
              <span className="font-heading font-bold text-white md:hidden">FCS Portal</span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
                Employee Dashboard
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
                <span className="font-heading text-lg font-bold">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {links.map((link) => (
                  <div key={link.label} onClick={() => setMobileOpen(false)}>
                    <SidebarLink
                      href={link.href}
                      icon={link.icon}
                      active={pathname === link.href || (link.href !== '/employee' && pathname.startsWith(link.href))}
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
                  Sign Out
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
