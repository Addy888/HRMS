'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  DollarSign,
  Users,
  TrendingUp,
  Layers,
  IndianRupee,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, gradient }: any) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminPayrollPage() {
  const [search, setSearch] = useState('');

  // Fetch process overview (contains payroll data)
  const { data: processOverview, isLoading: processLoading } = useQuery({
    queryKey: ['super-admin-payroll-process-overview'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/process-overview');
      return res.data.data || res.data;
    },
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-payroll-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/stats');
      return res.data.data || res.data;
    },
  });

  const isLoading = processLoading || statsLoading;

  const filteredProcesses = React.useMemo(() => {
    if (!processOverview) return [];
    if (!search) return processOverview;

    return processOverview.filter((process: any) =>
      process.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [processOverview, search]);

  const totalPayroll = filteredProcesses.reduce(
    (sum: number, p: any) => sum + (p.totalMonthlyPayroll || 0),
    0
  );
  const totalBasicSalary = filteredProcesses.reduce(
    (sum: number, p: any) => sum + (p.monthlyBasicSalary || 0),
    0
  );
  const totalIncentive = filteredProcesses.reduce(
    (sum: number, p: any) => sum + (p.monthlyIncentive || 0),
    0
  );

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/login">
      <SuperAdminLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-500" />
              Payroll Overview
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Company-wide payroll summary by department and process
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Monthly Payroll"
              value={`₹${(stats?.totalMonthlyPayroll || 0).toLocaleString('en-IN')}`}
              icon={IndianRupee}
              gradient="bg-gradient-to-br from-purple-600 to-indigo-700"
            />
            <StatCard
              title="Total Employees"
              value={stats?.totalEmployees || 0}
              icon={Users}
              gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
            />
            <StatCard
              title="Active Employees"
              value={stats?.activeEmployees || 0}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
            />
            <StatCard
              title="Total Processes"
              value={stats?.totalProcesses || 0}
              icon={Layers}
              gradient="bg-gradient-to-br from-amber-600 to-orange-700"
            />
          </div>

          {/* Search */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by process/department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Summary Cards */}
          {!isLoading && filteredProcesses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
                  Total Basic Salary
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalBasicSalary.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
                  Total Incentive
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalIncentive.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
                  Total Monthly Payroll
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalPayroll.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Process Payroll Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                Payroll by Process/Department
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Detailed payroll breakdown by organizational structure
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Process/Department</th>
                    <th className="px-6 py-4 text-center">Employees</th>
                    <th className="px-6 py-4 text-center">Active</th>
                    <th className="px-6 py-4 text-center">Inactive</th>
                    <th className="px-6 py-4 text-right">Basic Salary</th>
                    <th className="px-6 py-4 text-right">Incentive</th>
                    <th className="px-6 py-4 text-right">Total Payroll</th>
                    <th className="px-6 py-4 text-right">Avg Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredProcesses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <Layers className="w-12 h-12 text-neutral-700" />
                          <span className="text-neutral-400 font-medium">
                            {search ? 'No matching processes found' : 'No payroll data available'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProcesses.map((process: any) => (
                      <tr key={process.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">{process.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-neutral-300">{process.totalEmployees}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-emerald-400">{process.activeEmployees}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-red-400">{process.inactiveEmployees}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-neutral-300">
                            ₹{process.monthlyBasicSalary.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-neutral-300">
                            ₹{process.monthlyIncentive.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-white">
                            ₹{process.totalMonthlyPayroll.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-neutral-400">
                            ₹{process.avgSalary.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && filteredProcesses.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/30">
                <div className="text-sm text-neutral-400">
                  Total: {filteredProcesses.length} process{filteredProcesses.length !== 1 ? 'es' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
