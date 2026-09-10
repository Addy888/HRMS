'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  User, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Clock,
  FileText,
  BookOpen,
  LifeBuoy,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import NotificationBell from '@/components/NotificationBell';
import NotificationToastProvider from '@/components/NotificationToastProvider';
import ThemeToggle from '@/components/ThemeToggle';

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
          ? 'bg-secondary text-card-foreground shadow-sm border border-border'
          : 'text-muted-foreground hover:text-card-foreground hover:bg-secondary/50'
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
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const isEmployee = Boolean(user && user.role === 'EMPLOYEE');

  React.useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (!isEmployee) {
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/super-admin');
      } else if (['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role)) {
        router.replace('/hr');
      } else {
        router.replace('/login');
      }
      return;
    }
  }, [isAuthenticated, user, isHydrated, isEmployee, router]);

  if (!isHydrated || !isAuthenticated || !user || !isEmployee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const links = [
    { href: '/employee', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/employee/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
    { href: '/employee/attendance', label: 'Attendance', icon: <Clock className="w-5 h-5" /> },
    { href: '/employee/hr-actions', label: 'Warnings', icon: <AlertTriangle className="w-5 h-5" /> },
    { href: '/employee/documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { href: '/employee/payslips', label: 'Payslips', icon: <DollarSign className="w-5 h-5" /> },
    { href: '/employee/policies', label: 'Policies', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/employee/complaints', label: 'Helpdesk', icon: <LifeBuoy className="w-5 h-5" /> },
  ];

  return (
    <NotificationToastProvider>
      <div className="flex min-h-screen bg-background text-foreground antialiased">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 space-y-6 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 bg-clip-text text-transparent">
              FCS HRMS
            </span>
          </div>

          {/* User Card */}
          <div className="bg-secondary/50 border border-border rounded-xl p-4 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Signed In As</span>
            <span className="text-sm font-semibold truncate text-card-foreground">{user?.email || 'employee@fcs.com'}</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border px-2 py-0.5 rounded w-max mt-1 font-bold">
              EMPLOYEE
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            {links.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                active={pathname === link.href || (link.href !== '/employee' && pathname.startsWith(link.href))}
              >
                {link.label}
              </SidebarLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-300 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky Unified Top Header */}
          <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-1 rounded-lg text-muted-foreground hover:text-card-foreground"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500 md:hidden" />
                <span className="font-heading font-bold text-card-foreground md:hidden">FCS HRMS</span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Employee Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          {/* Mobile Sidebar overlay */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <aside className="relative flex flex-col w-64 bg-card p-6 border-r border-border animate-in slide-in-from-left duration-200 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-heading text-lg font-bold text-card-foreground">Employee Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-card-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1">
                  {links.map((link) => (
                    <div key={link.href} onClick={() => setMobileOpen(false)}>
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
                <div className="border-t border-border pt-6 mt-auto">
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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
