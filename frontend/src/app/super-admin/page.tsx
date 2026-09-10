'use client';

import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users,
  UserCog,
  UserCheck,
  UserX,
  Layers,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Activity,
  Loader2,
  ArrowUpRight,
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, subtitle, icon, gradient, href }: any) => {
  const Wrapper = href ? Link : 'div';
  
  return (
    <Wrapper
      href={href || '#'}
      className={`bg-card border border-border rounded-2xl p-6 shadow-sm ${href ? 'hover:border-purple-500/50 transition-all cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-card-foreground mb-1">{value}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          {icon}
        </div>
      </div>
      {href && (
        <div className="mt-4 flex items-center gap-1 text-xs text-purple-600 font-medium group-hover:gap-2 transition-all">
          View Details <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      )}
    </Wrapper>
  );
};

const ProcessRow = ({ process }: any) => {
  return (
    <tr className="hover:bg-secondary/30 transition-colors border-b border-border">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
            <Layers className="w-4 h-4 text-foreground" />
          </div>
          <span className="font-semibold text-card-foreground">{process.name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="text-card-foreground">{process.totalEmployees}</span>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="text-emerald-600">{process.activeEmployees}</span>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="text-red-600">{process.inactiveEmployees}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="text-card-foreground">₹{process.monthlyBasicSalary.toLocaleString('en-IN')}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="text-card-foreground">₹{process.monthlyIncentive.toLocaleString('en-IN')}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="font-semibold text-card-foreground">₹{(process.totalMonthlyPayroll || 0).toLocaleString('en-IN')}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="text-muted-foreground">₹{process.avgSalary.toLocaleString('en-IN')}</span>
      </td>
    </tr>
  );
};

import useAuthStore from '@/store/authStore';

export default function SuperAdminDashboard() {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const isSuperAdmin = Boolean(user && user.role === 'SUPER_ADMIN');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/stats');
      return res.data.data || res.data;
    },
    enabled: Boolean(isHydrated && isAuthenticated && isSuperAdmin),
  });

  const { data: processOverview, isLoading: processLoading } = useQuery({
    queryKey: ['super-admin-process-overview'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/process-overview');
      return res.data.data || res.data;
    },
    enabled: Boolean(isHydrated && isAuthenticated && isSuperAdmin),
  });

  if (statsLoading || processLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/login">
      <SuperAdminLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-500" />
            Company Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete overview of your organization — employees, admins, processes, and payroll
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            subtitle={`${stats?.activeEmployees || 0} active, ${stats?.inactiveEmployees || 0} inactive`}
            icon={<Users className="w-6 h-6 text-foreground" />}
            gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
            href="/super-admin/employees"
          />
          <StatCard
            title="HR Admins"
            value={stats?.totalHRAdmins || 0}
            subtitle="Managing operations"
            icon={<UserCog className="w-6 h-6 text-foreground" />}
            gradient="bg-gradient-to-br from-purple-600 to-pink-700"
            href="/super-admin/admins"
          />
          <StatCard
            title="Total Processes"
            value={stats?.totalProcesses || 0}
            subtitle="Departments/Teams"
            icon={<Layers className="w-6 h-6 text-foreground" />}
            gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
            href="/super-admin/processes"
          />
          <StatCard
            title="Monthly Payroll"
            value={`₹${(stats?.totalMonthlyPayroll || 0).toLocaleString('en-IN')}`}
            subtitle={`Basic: ₹${(stats?.totalPayrollCost || 0).toLocaleString('en-IN')}`}
            icon={<IndianRupee className="w-6 h-6 text-foreground" />}
            gradient="bg-gradient-to-br from-amber-600 to-orange-700"
            href="/super-admin/payroll"
          />
        </div>

        {/* Attendance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Present Today
              </p>
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-600">{stats?.presentToday || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">Employees checked in</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Late Today
              </p>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-amber-600">{stats?.lateToday || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">Late check-ins</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Absent Today
              </p>
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-600">{stats?.absentToday || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">No attendance marked</p>
          </div>
        </div>

        {/* Process Overview Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-heading text-xl font-bold text-card-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Process Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Employee count, payroll breakdown by department/process
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary border-b border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="px-4 py-4">Process</th>
                  <th className="px-4 py-4 text-center">Employees</th>
                  <th className="px-4 py-4 text-center">Active</th>
                  <th className="px-4 py-4 text-center">Inactive</th>
                  <th className="px-4 py-4 text-right">Basic Salary</th>
                  <th className="px-4 py-4 text-right">Incentive</th>
                  <th className="px-4 py-4 text-right">Total Payroll</th>
                  <th className="px-4 py-4 text-right">Avg Salary</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {processOverview && processOverview.length > 0 ? (
                  processOverview.map((process: any) => (
                    <ProcessRow key={process.id} process={process} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No processes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {processOverview && processOverview.length > 0 && (
            <div className="px-6 py-4 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total: {processOverview.length} process{processOverview.length !== 1 ? 'es' : ''}
                </span>
                <Link
                  href="/super-admin/processes"
                  className="text-purple-600 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                >
                  View All Processes <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/super-admin/employees"
            className="bg-card border border-border hover:border-purple-500/50 rounded-xl p-4 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-card-foreground group-hover:text-purple-600 transition-colors">
                Manage Employees
              </span>
            </div>
          </Link>

          <Link
            href="/super-admin/admins"
            className="bg-card border border-border hover:border-purple-500/50 rounded-xl p-4 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-card-foreground group-hover:text-purple-600 transition-colors">
                Manage Admins
              </span>
            </div>
          </Link>

          <Link
            href="/super-admin/payroll"
            className="bg-card border border-border hover:border-purple-500/50 rounded-xl p-4 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-card-foreground group-hover:text-purple-600 transition-colors">
                View Payroll
              </span>
            </div>
          </Link>

          <Link
            href="/super-admin/analytics"
            className="bg-card border border-border hover:border-purple-500/50 rounded-xl p-4 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-card-foreground group-hover:text-purple-600 transition-colors">
                View Analytics
              </span>
            </div>
          </Link>
        </div>
      </div>
    </SuperAdminLayout>
    </ProtectedRoute>
  );
}
