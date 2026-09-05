'use client';

import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  Users,
  IndianRupee,
  UserCheck,
  UserX,
  Building2,
  CalendarDays,
  AlertCircle,
  Loader2,
  Eye,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) => (
  <div className="flex items-start gap-3 py-3 border-b border-neutral-800/50 last:border-0">
    <div className="text-neutral-500 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm text-white font-medium mt-0.5 truncate">{value || '—'}</div>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, gradient }: any) => (
  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
          {label}
        </p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${gradient}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function ProcessDetailPage() {
  const params = useParams();
  const router = useRouter();

  const processId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: processResponse, isLoading, error } = useQuery({
    queryKey: ['super-admin-process-detail', processId],
    queryFn: async () => {
      const res = await api.get(`/departments/${processId}`);
      return res.data.data || res.data;
    },
    enabled: !!processId && typeof processId === 'string',
  });

  const process = processResponse;

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Failed to Load Process</h2>
            <p className="text-sm text-neutral-400 mb-4">
              {error instanceof Error ? error.message : 'Unable to fetch process details. Please try again.'}
            </p>
            <button
              onClick={() => router.push('/super-admin/processes')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Back to Processes
            </button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!process) {
    return (
      <SuperAdminLayout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8">
            <Layers className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Process Not Found</h2>
            <p className="text-sm text-neutral-400 mb-4">
              The process you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/super-admin/processes')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Back to Processes
            </button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Calculate stats
  const activeEmployees = process.employees?.filter((e: any) => e.user?.isActive).length || 0;
  const inactiveEmployees = (process.employees?.length || 0) - activeEmployees;
  let totalMonthlyPayroll = 0;

  process.employees?.forEach((emp: any) => {
    totalMonthlyPayroll += emp.monthlySalary || 0;
  });

  const avgSalary = process.employees?.length > 0 ? Math.round(totalMonthlyPayroll / process.employees.length) : 0;

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/super-admin/processes')}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-3 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Processes
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-white">{process.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded">
                    {process.id.substring(0, 8)}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border text-purple-400 bg-purple-500/10 border-purple-500/20">
                    Process
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {process.description && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <p className="text-sm text-neutral-300">{process.description}</p>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            label="Total Employees"
            value={process.employees?.length || 0}
            gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6 text-white" />}
            label="Active Employees"
            value={activeEmployees}
            gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
          />
          <StatCard
            icon={<UserX className="w-6 h-6 text-white" />}
            label="Inactive Employees"
            value={inactiveEmployees}
            gradient="bg-gradient-to-br from-red-600 to-rose-700"
          />
          <StatCard
            icon={<IndianRupee className="w-6 h-6 text-white" />}
            label="Monthly Payroll"
            value={`₹${totalMonthlyPayroll.toLocaleString('en-IN')}`}
            gradient="bg-gradient-to-br from-amber-600 to-orange-700"
          />
        </div>

        {/* Process Information Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-1">
          <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" /> Process Information
          </h3>
          <InfoRow icon={<Layers className="w-4 h-4" />} label="Process Name" value={process.name} />
          <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Created Date" value={process.createdAt ? new Date(process.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
          <InfoRow icon={<IndianRupee className="w-4 h-4" />} label="Average Salary" value={`₹${avgSalary.toLocaleString('en-IN')}`} />
          <InfoRow icon={<Users className="w-4 h-4" />} label="Total Employees" value={process.employees?.length || 0} />
        </div>

        {/* Employees Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Employees in {process.name}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {process.employees?.length || 0} employee{process.employees?.length !== 1 ? 's' : ''} assigned to this process
            </p>
          </div>

          {process.employees && process.employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Designation</th>
                    <th className="px-5 py-4">Joining Date</th>
                    <th className="px-5 py-4">Salary</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {process.employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-xs font-bold text-white uppercase">
                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{emp.fullName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-neutral-300 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {emp.user?.email || emp.email || '—'}
                        </div>
                        <div className="text-neutral-500 text-[10px] mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {emp.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-neutral-300 text-xs">
                          <Briefcase className="w-3 h-3" />
                          {emp.designation?.name || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-neutral-300 text-xs">
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-semibold">
                          ₹{(emp.totalSalary || emp.monthlySalary || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">per month</div>
                      </td>
                      <td className="px-5 py-4">
                        {emp.user?.isActive ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/super-admin/employees/${emp.id}`}
                            className="p-1.5 hover:bg-purple-500/10 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                            title="View employee details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">No employees assigned to this process</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
