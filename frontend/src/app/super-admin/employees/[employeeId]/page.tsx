'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  IndianRupee,
  Layers,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminEmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.employeeId as string;

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['super-admin-employee-detail', employeeId],
    queryFn: async () => {
      const res = await api.get(`/super-admin/employees/${employeeId}`);
      return res.data?.data || res.data;
    },
    enabled: !!employeeId,
    retry: false,
  });

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.response?.status === 404
      ? 'Employee not found'
      : (error as any)?.response?.status === 403
      ? 'Access denied'
      : (error as any)?.response?.status === 401
      ? 'Authentication required'
      : 'Failed to load employee details';

    return (
      <SuperAdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-white">{errorMessage}</h2>
          <p className="text-neutral-400">
            {(error as any)?.response?.data?.message || 'Please try again later'}
          </p>
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!employee) {
    return (
      <SuperAdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <User className="w-16 h-16 text-neutral-600" />
          <h2 className="text-2xl font-bold text-white">Employee Not Found</h2>
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="p-2 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-purple-500" />
              Employee Details
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Complete profile and activity information
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            employee.isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {employee.isActive ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="font-semibold">Inactive</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Employee Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Basic Information
              </h2>
              
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-neutral-800">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-2xl font-bold text-white uppercase shrink-0">
                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {employee.fullName || `${employee.firstName} ${employee.lastName}`}
                  </h3>
                  <p className="text-neutral-400 text-sm mb-2">{employee.employeeId}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Mail className="w-4 h-4" />
                      {employee.email || employee.user?.email}
                    </span>
                    {employee.phone && (
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Phone className="w-4 h-4" />
                        {employee.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Department / Process
                  </p>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <p className="text-white font-medium">
                      {employee.departmentName || employee.department?.name || (
                        <span className="text-neutral-500 italic">Unassigned</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Designation
                  </p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    <p className="text-white font-medium">
                      {employee.designationTitle || employee.designation?.name || (
                        <span className="text-neutral-500 italic">Not assigned</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Joining Date
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <p className="text-white font-medium">
                      {formatDate(employee.joiningDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Created By
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <p className="text-white font-medium">
                      {employee.createdByName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary & Payroll Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                Salary & Compensation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Monthly Salary
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(employee.monthlySalary || employee.totalSalary)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                    Incentive
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(employee.incentive || 0)}
                  </p>
                </div>
              </div>

              {employee.payslips && employee.payslips.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <p className="text-sm font-semibold text-neutral-400 mb-3">
                    Recent Payslips
                  </p>
                  <div className="space-y-2">
                    {employee.payslips.slice(0, 3).map((payslip: any) => (
                      <div
                        key={payslip.id}
                        className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg"
                      >
                        <span className="text-sm text-neutral-300">
                          {new Date(payslip.year, payslip.month - 1).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          ₹{payslip.netSalary?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Summary */}
            {employee.attendanceSummary && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Attendance Summary (Last 30 Days)
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {employee.attendanceSummary.present}
                    </p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                      Present
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {employee.attendanceSummary.absent}
                    </p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                      Absent
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {employee.attendanceSummary.late}
                    </p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                      Late
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {employee.attendanceSummary.halfDay}
                    </p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                      Half Day
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Personal Details</h2>
              
              <div className="space-y-3 text-sm">
                {employee.dob && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Date of Birth</span>
                    <span className="text-white font-medium">{formatDate(employee.dob)}</span>
                  </div>
                )}
                {employee.gender && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Gender</span>
                    <span className="text-white font-medium">{employee.gender}</span>
                  </div>
                )}
                {employee.bloodGroup && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Blood Group</span>
                    <span className="text-white font-medium">{employee.bloodGroup}</span>
                  </div>
                )}
                {employee.employmentType && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Employment Type</span>
                    <span className="text-white font-medium">{employee.employmentType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* HR Actions */}
            {employee.hrActions && employee.hrActions.length > 0 && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Recent HR Actions
                </h2>
                <div className="space-y-3">
                  {employee.hrActions.slice(0, 5).map((action: any) => (
                    <div key={action.id} className="p-3 bg-neutral-900 rounded-lg border-l-2 border-amber-500">
                      <p className="text-xs font-mono text-neutral-500 mb-1">
                        {action.actionNumber}
                      </p>
                      <p className="text-sm font-semibold text-white mb-1">
                        {action.subject}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatDate(action.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">System Info</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Employee ID</span>
                  <span className="text-white font-mono font-medium">{employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">User ID</span>
                  <span className="text-white font-mono text-xs">{employee.user?.id || employee.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">First Login</span>
                  <span className="text-white font-medium">
                    {employee.user?.isFirstLogin ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Account Created</span>
                  <span className="text-white font-medium">
                    {formatDate(employee.user?.createdAt || employee.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
