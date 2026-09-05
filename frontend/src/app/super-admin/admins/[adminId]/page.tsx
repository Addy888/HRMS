'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  designationId: string;
  status: string;
  isActive: boolean;
  basicSalary: number;
  incentive: number;
  totalSalary: number;
  joiningDate: string;
}

interface Process {
  id: string;
  name: string;
  description: string;
  code: string;
  isActive: boolean;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  basicSalary: number;
  incentive: number;
  totalPayroll: number;
  avgSalary: number;
  employees: Employee[];
  createdAt: string;
}

interface AdminDetails {
  admin: {
    id: string;
    email: string;
    role: string;
    roleDisplay: string;
    isActive: boolean;
    isFirstLogin: boolean;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    joiningDate: string;
    createdAt: string;
  };
  summary: {
    totalProcesses: number;
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalBasicSalary: number;
    totalIncentive: number;
    totalPayroll: number;
  };
  processes: Process[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const [expandedProcesses, setExpandedProcesses] = React.useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<AdminDetails>({
    queryKey: ['super-admin-admin-details', adminId],
    queryFn: async () => {
      const res = await api.get(`/super-admin/admins/${adminId}`);
      return res.data.data || res.data;
    },
    enabled: !!adminId,
  });

  const toggleProcess = (processId: string) => {
    setExpandedProcesses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-neutral-400 font-medium">Loading HR admin details...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (error || !data) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h2 className="font-heading text-2xl font-bold text-white">HR Admin Not Found</h2>
            <p className="text-neutral-400">
              {(error as any)?.message || 'The HR admin you are looking for does not exist or you do not have permission to view it.'}
            </p>
            <button
              onClick={() => router.push('/super-admin/admins')}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Management
            </button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const { admin, summary, processes } = data;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/super-admin/admins')}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Management
        </button>

        {/* Header */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-2xl font-bold text-white uppercase flex-shrink-0">
                {admin.firstName?.charAt(0)}{admin.lastName?.charAt(0)}
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-extrabold text-white">{admin.fullName}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                    {admin.roleDisplay}
                  </span>
                  {admin.isActive ? (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg font-bold uppercase">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg font-bold uppercase">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-xl">
              <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Email</p>
                <p className="text-sm text-white truncate">{admin.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-xl">
              <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Phone</p>
                <p className="text-sm text-white">{admin.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-xl">
              <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Joined</p>
                <p className="text-sm text-white">{formatDate(admin.joiningDate || admin.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Total Processes</p>
                <p className="text-2xl font-heading font-extrabold text-white">{summary.totalProcesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Total Employees</p>
                <p className="text-2xl font-heading font-extrabold text-white">{summary.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Active / Inactive</p>
                <p className="text-2xl font-heading font-extrabold text-white">
                  {summary.activeEmployees} / {summary.inactiveEmployees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Total Payroll</p>
                <p className="text-lg font-heading font-extrabold text-white">{formatCurrency(summary.totalPayroll)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Breakdown */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Payroll Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-900/50 rounded-xl">
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-1">Basic Salary</p>
              <p className="text-2xl font-heading font-extrabold text-white">{formatCurrency(summary.totalBasicSalary)}</p>
            </div>
            <div className="p-4 bg-neutral-900/50 rounded-xl">
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-1">Incentives</p>
              <p className="text-2xl font-heading font-extrabold text-white">{formatCurrency(summary.totalIncentive)}</p>
            </div>
            <div className="p-4 bg-neutral-900/50 rounded-xl">
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-1">Total Monthly</p>
              <p className="text-2xl font-heading font-extrabold text-purple-400">{formatCurrency(summary.totalPayroll)}</p>
            </div>
          </div>
        </div>

        {/* Processes Managed */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              Processes Managed ({processes.length})
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Departments and teams created and managed by this HR admin
            </p>
          </div>

          {processes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Building2 className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">No processes created by this HR admin yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-900">
              {processes.map((process) => {
                const isExpanded = expandedProcesses.has(process.id);
                return (
                  <div key={process.id}>
                    <div
                      className="px-6 py-4 hover:bg-neutral-900/30 cursor-pointer transition-colors"
                      onClick={() => toggleProcess(process.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <button className="text-neutral-400 hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-heading text-lg font-bold text-white">{process.name}</h3>
                              {process.code && (
                                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono">
                                  {process.code}
                                </span>
                              )}
                              {!process.isActive && (
                                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {process.description && (
                              <p className="text-sm text-neutral-400 mt-1">{process.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Employees</p>
                            <p className="text-lg font-heading font-bold text-white">{process.totalEmployees}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Payroll</p>
                            <p className="text-lg font-heading font-bold text-purple-400">{formatCurrency(process.totalPayroll)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Process Stats */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 ml-9">
                        <div className="p-3 bg-neutral-900/50 rounded-lg">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Active</p>
                          <p className="text-sm font-bold text-emerald-400">{process.activeEmployees}</p>
                        </div>
                        <div className="p-3 bg-neutral-900/50 rounded-lg">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Inactive</p>
                          <p className="text-sm font-bold text-red-400">{process.inactiveEmployees}</p>
                        </div>
                        <div className="p-3 bg-neutral-900/50 rounded-lg">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Avg Salary</p>
                          <p className="text-sm font-bold text-white">{formatCurrency(process.avgSalary)}</p>
                        </div>
                        <div className="p-3 bg-neutral-900/50 rounded-lg">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Created</p>
                          <p className="text-sm font-bold text-white">{formatDate(process.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Employees in Process */}
                    {isExpanded && (
                      <div className="bg-neutral-900/20 px-6 py-4">
                        <h4 className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-3 ml-9">
                          Employees in {process.name} ({process.employees.length})
                        </h4>
                        {process.employees.length === 0 ? (
                          <div className="ml-9 py-8 text-center">
                            <Users className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No employees in this process yet</p>
                          </div>
                        ) : (
                          <div className="ml-9 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-neutral-900 border-b border-neutral-800 text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                  <th className="px-4 py-3">Employee</th>
                                  <th className="px-4 py-3">ID</th>
                                  <th className="px-4 py-3">Designation</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3">Basic Salary</th>
                                  <th className="px-4 py-3">Incentive</th>
                                  <th className="px-4 py-3">Total</th>
                                  <th className="px-4 py-3">Joined</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-900">
                                {process.employees.map((employee) => (
                                  <tr key={employee.id} className="hover:bg-neutral-900/30 transition-colors text-xs">
                                    <td className="px-4 py-3">
                                      <div>
                                        <div className="font-semibold text-white">{employee.fullName}</div>
                                        <div className="text-[10px] text-neutral-500 mt-0.5">{employee.email}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-neutral-300 font-mono text-[11px]">{employee.employeeId}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-neutral-300">{employee.designation}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {employee.isActive ? (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                          Inactive
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-neutral-300">{formatCurrency(employee.basicSalary)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-neutral-300">{formatCurrency(employee.incentive)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-white font-semibold">{formatCurrency(employee.totalSalary)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-neutral-400 text-[11px]">{formatDate(employee.joiningDate)}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
