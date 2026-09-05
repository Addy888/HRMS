'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  UserCog,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/admin/hr-users', label: 'HR Management', icon: <UserCog className="w-5 h-5" /> },
    { href: '/admin/employees', label: 'Employees', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/audit', label: 'Audit Logs', icon: <FileText className="w-5 h-5" /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login/admin');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-neutral-950 border-b border-neutral-800 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white">Super Admin Portal</h1>
              <p className="text-xs text-neutral-500">System Management</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg">
            <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center font-bold text-sm">
              SA
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white">Super Admin</p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 bottom-0 w-64 bg-neutral-950 border-r border-neutral-800 p-4 space-y-2 overflow-y-auto transition-transform lg:translate-x-0 z-40 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {links.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              active={pathname === link.href}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </SidebarLink>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full mt-8"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </div>
  );
}
