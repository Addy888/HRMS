'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Layers, 
  Award, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

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

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const links = [
    { href: '/hr', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/hr/employees', label: 'Employees', icon: <Users className="w-5 h-5" /> },
    { href: '/hr/departments', label: 'Departments', icon: <Layers className="w-5 h-5" /> },
    { href: '/hr/designations', label: 'Designations', icon: <Award className="w-5 h-5" /> },
  ];

  return (
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
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded w-max mt-1 font-bold">
            HR ADMIN
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

      {/* Mobile Top Header */}
      <div className="flex md:hidden flex-col w-full min-h-screen">
        <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 p-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-md font-bold text-white">FCS HRMS</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg border border-neutral-800"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 top-[65px] bg-black/90 z-20 p-6 flex flex-col space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-md font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-6 border-t border-neutral-800">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-md font-medium text-red-400"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Mobile main content wrapper */}
        <main className="flex-1 p-6 overflow-y-auto bg-black">
          {children}
        </main>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden md:block flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-black">
        {children}
      </main>
    </div>
  );
}
