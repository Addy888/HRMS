'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  Layers, 
  Award, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  FolderOpen,
  BookOpen,
  LifeBuoy,
  DollarSign,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  History,
  Clock
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
          ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

interface SidebarMenuProps {
  label: string;
  icon: React.ReactNode;
  subItems: Array<{ href: string; label: string }>;
  pathname: string;
}

const SidebarMenu = ({ label, icon, subItems, pathname }: SidebarMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return subItems.some(item => pathname.startsWith(item.href));
  });

  const isActive = subItems.some(item => pathname.startsWith(item.href));

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          {label}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {subItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                pathname === item.href
                  ? 'bg-neutral-800/50 text-white border-l-2 border-blue-500'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HRLayout({ children }: { children: React.ReactNode }) {
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
    // ✅ Allow HR_ADMIN, HR_USER, and legacy HR role
    const isHRRole = ['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role);
    if (!isHRRole) {
      router.push('/employee');
      return;
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ✅ Check if user is HR role
  const isHRRole = ['HR_ADMIN', 'HR_USER', 'HR'].includes(user.role);
  if (!isHRRole) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ✅ Check if user is HR_ADMIN (for admin-only features)
  const isHRAdmin = user.role === 'HR_ADMIN';

  // ✅ Role-based navigation links
  const commonLinks = [
    { href: '/hr', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/hr/employees', label: 'Employees', icon: <Users className="w-5 h-5" /> },
    { href: '/hr/attendance', label: 'Attendance', icon: <Clock className="w-5 h-5" /> },
  ];

  const adminOnlyLinks = [
    { href: '/hr/hr-users', label: 'HR Users', icon: <Users className="w-5 h-5" /> },
    { href: '/hr/departments', label: 'Departments', icon: <Layers className="w-5 h-5" /> },
    { href: '/hr/designations', label: 'Designations', icon: <Award className="w-5 h-5" /> },
  ];

  const operationalLinks = [
    { href: '/hr/documents', label: 'Documents', icon: <FolderOpen className="w-5 h-5" /> },
    { href: '/hr/policies', label: 'Policies', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/hr/hr-actions', label: 'HR Actions', icon: <AlertTriangle className="w-5 h-5" /> },
    { href: '/hr/action-history', label: 'HR Action History', icon: <History className="w-5 h-5" /> },
    { href: '/hr/complaints', label: 'Helpdesk', icon: <LifeBuoy className="w-5 h-5" /> },
  ];

  // ✅ Build final links based on role
  const links = [
    ...commonLinks,
    ...(isHRAdmin ? adminOnlyLinks : []),
    ...operationalLinks,
  ];

  // ✅ Payroll is admin-only
  const payrollMenu = isHRAdmin ? {
    label: 'Payroll',
    icon: <DollarSign className="w-5 h-5" />,
    subItems: [
      { href: '/hr/payroll', label: 'Payroll Dashboard' },
      { href: '/hr/payroll/employees', label: 'Employee Salary' },
      { href: '/hr/payroll/salary-structure', label: 'Salary Structure' },
      { href: '/hr/payroll/processing', label: 'Payroll Processing' },
      { href: '/hr/payroll/payslips', label: 'Salary Slip Generator' },
      { href: '/hr/payroll/history', label: 'Salary History' },
      { href: '/hr/payroll/reports', label: 'Payroll Reports' },
    ],
  } : null;

  // ✅ Display role badge based on actual role
  const roleBadge = isHRAdmin ? 'HR ADMIN' : 'HR USER';

  return (
    <NotificationToastProvider>
      <div className="flex min-h-screen bg-black text-white antialiased">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-950 p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
              FCS HRMS
            </span>
          </div>

          {/* User Card */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Signed In As</span>
            <span className="text-sm font-semibold truncate">{user?.email || 'hr@fcs.com'}</span>
            <span className={`text-[10px] ${isHRAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} border px-2 py-0.5 rounded w-max mt-1 font-bold`}>
              {roleBadge}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            {links.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                active={pathname === link.href || (link.href !== '/hr' && pathname.startsWith(link.href))}
              >
                {link.label}
              </SidebarLink>
            ))}
            
            {/* Payroll Menu with Submenu (Admin Only) */}
            {payrollMenu && (
              <SidebarMenu
                label={payrollMenu.label}
                icon={payrollMenu.icon}
                subItems={payrollMenu.subItems}
                pathname={pathname}
              />
            )}
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
                className="md:hidden p-1 rounded-lg text-neutral-450 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500 md:hidden" />
                <span className="font-heading font-bold text-white md:hidden">FCS HRMS</span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
                  HR Portal Dashboard
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
                  <span className="font-heading text-lg font-bold">HR Menu</span>
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
                        active={pathname === link.href || (link.href !== '/hr' && pathname.startsWith(link.href))}
                      >
                        {link.label}
                      </SidebarLink>
                    </div>
                  ))}
                  
                  {/* Payroll Menu with Submenu for Mobile */}
                  {payrollMenu && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <SidebarMenu
                        label={payrollMenu.label}
                        icon={payrollMenu.icon}
                        subItems={payrollMenu.subItems}
                        pathname={pathname}
                      />
                    </div>
                  )}
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
