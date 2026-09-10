'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  UserCheck,
  UserX,
  Loader2,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';

function AnalyticsCard({ title, value, subtitle, icon: Icon, gradient, trend }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${gradient} shrink-0`}>
          <Icon className="w-6 h-6 text-foreground" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 mt-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-emerald-600 font-semibold">{trend}</span>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-analytics-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/stats');
      return res.data.data || res.data;
    },
  });

  // Fetch process overview
  const { data: processes, isLoading: processLoading } = useQuery({
    queryKey: ['super-admin-analytics-processes'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/process-overview');
      return res.data.data || res.data;
    },
  });

  const isLoading = statsLoading || processLoading;

  // Calculate analytics metrics
  const activeRate = stats?.totalEmployees > 0 
    ? ((stats?.activeEmployees / stats?.totalEmployees) * 100).toFixed(1) 
    : '0';

  const avgPayrollPerEmployee = stats?.activeEmployees > 0 && stats?.totalMonthlyPayroll > 0
    ? Math.round(stats.totalMonthlyPayroll / stats.activeEmployees)
    : 0;

  const attendanceRate = stats?.totalEmployees > 0 && stats?.presentToday !== undefined
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)
    : '0';

  const largestProcess = processes?.reduce((max: any, p: any) => 
    p.totalEmployees > (max?.totalEmployees || 0) ? p : max
  , null);

  const highestPayrollProcess = processes?.reduce((max: any, p: any) =>
    p.totalMonthlyPayroll > (max?.totalMonthlyPayroll || 0) ? p : max
  , null);

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/login">
      <SuperAdminLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Company-wide metrics, trends, and insights
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Total Employees"
              value={stats?.totalEmployees || 0}
              subtitle={`${stats?.activeEmployees || 0} active, ${stats?.inactiveEmployees || 0} inactive`}
              icon={Users}
              gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
            />
            <AnalyticsCard
              title="Active Rate"
              value={`${activeRate}%`}
              subtitle="Employee activation ratio"
              icon={UserCheck}
              gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
            />
            <AnalyticsCard
              title="Monthly Payroll"
              value={`₹${(stats?.totalMonthlyPayroll || 0).toLocaleString('en-IN')}`}
              subtitle={`Avg: ₹${avgPayrollPerEmployee.toLocaleString('en-IN')} per employee`}
              icon={IndianRupee}
              gradient="bg-gradient-to-br from-purple-600 to-pink-700"
            />
            <AnalyticsCard
              title="Today's Attendance"
              value={`${attendanceRate}%`}
              subtitle={`${stats?.presentToday || 0} present out of ${stats?.totalEmployees || 0}`}
              icon={Clock}
              gradient="bg-gradient-to-br from-amber-600 to-orange-700"
            />
          </div>

          {/* Attendance Metrics */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Attendance Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-secondary border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Present Today
                  </p>
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600">{stats?.presentToday || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Employees checked in</p>
              </div>

              <div className="bg-secondary border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Late Today
                  </p>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-amber-600">{stats?.lateToday || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Late check-ins</p>
              </div>

              <div className="bg-secondary border border-border rounded-xl p-5">
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
          </div>

          {/* Department/Process Analytics */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Process Analytics
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Largest Process */}
                <div className="bg-secondary border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    Largest Process by Headcount
                  </p>
                  {largestProcess ? (
                    <>
                      <h3 className="text-xl font-bold text-foreground mb-2">{largestProcess.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Employees: </span>
                          <span className="text-foreground font-semibold">{largestProcess.totalEmployees}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Active: </span>
                          <span className="text-emerald-600 font-semibold">{largestProcess.activeEmployees}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  )}
                </div>

                {/* Highest Payroll Process */}
                <div className="bg-secondary border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    Highest Payroll Process
                  </p>
                  {highestPayrollProcess ? (
                    <>
                      <h3 className="text-xl font-bold text-foreground mb-2">{highestPayrollProcess.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Monthly: </span>
                          <span className="text-foreground font-semibold">
                            ₹{(highestPayrollProcess.totalMonthlyPayroll || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg: </span>
                          <span className="text-purple-600 font-semibold">
                            ₹{highestPayrollProcess.avgSalary.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  )}
                </div>

                {/* Total Processes */}
                <div className="bg-secondary border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    Total Processes/Departments
                  </p>
                  <h3 className="text-3xl font-bold text-foreground">{stats?.totalProcesses || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Organizational units</p>
                </div>

                {/* HR Admins */}
                <div className="bg-secondary border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    HR Administrators
                  </p>
                  <h3 className="text-3xl font-bold text-foreground">{stats?.totalHRAdmins || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Managing operations</p>
                </div>
              </div>
            )}
          </div>

          {/* Process Distribution Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-foreground">Process Distribution</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Employee and payroll distribution across processes
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-secondary border-b border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Process</th>
                    <th className="px-6 py-4 text-center">Total</th>
                    <th className="px-6 py-4 text-center">Active</th>
                    <th className="px-6 py-4 text-center">Inactive</th>
                    <th className="px-6 py-4 text-right">Avg Salary</th>
                    <th className="px-6 py-4 text-right">Total Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : processes && processes.length > 0 ? (
                    processes.map((process: any) => (
                      <tr key={process.id} className="hover:bg-secondary/30 transition-colors text-sm">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-foreground" />
                            </div>
                            <span className="font-semibold text-foreground">{process.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-card-foreground">{process.totalEmployees}</td>
                        <td className="px-6 py-4 text-center text-emerald-600">{process.activeEmployees}</td>
                        <td className="px-6 py-4 text-center text-red-600">{process.inactiveEmployees}</td>
                        <td className="px-6 py-4 text-right text-card-foreground">
                          ₹{process.avgSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          ₹{(process.totalMonthlyPayroll || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No process data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
