'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  InfoIcon,
} from 'lucide-react';

export default function MySalaryPage() {
  // Fetch employee's salary structure
  const { data: salaryData, isLoading: salaryLoading, isError: salaryError } = useQuery({
    queryKey: ['my-salary'],
    queryFn: async () => {
      const response = await api.get('/employee-salary/my-salary');
      return response.data?.data ?? response.data;
    },
  });

  // Fetch employee's payroll status
  const { data: payrollStatus, isLoading: statusLoading, isError: statusError } = useQuery({
    queryKey: ['my-payroll-status'],
    queryFn: async () => {
      const response = await api.get('/employee-salary/my-payroll-status');
      return response.data?.data ?? response.data;
    },
  });

  // Fetch employee's salary history
  const { data: salaryHistory, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ['my-salary-history'],
    queryFn: async () => {
      const response = await api.get('/employee-salary/my-salary-history');
      return response.data?.data ?? response.data;
    },
  });

  const isLoading = salaryLoading || statusLoading || historyLoading;
  const isError = salaryError || statusError || historyError;

  // Handle error state
  if (isError) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="font-heading text-xl font-bold text-white">Failed to load salary information</h2>
          <p className="text-sm text-neutral-400">Please contact HR if this issue persists</p>
        </div>
      </EmployeeLayout>
    );
  }

  // Handle empty state - no salary structure exists
  if (!isLoading && !salaryData) {
    return (
      <EmployeeLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                  My Salary
                </h1>
                <p className="text-sm text-neutral-400">View your salary structure and payment history</p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center">
              <Wallet className="w-10 h-10 text-neutral-500" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white">No Salary Information Available</h2>
            <p className="text-sm text-neutral-400 text-center max-w-md">
              No salary has been generated yet. Your salary structure will appear here once HR sets it up.
            </p>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 max-w-md">
              <div className="flex gap-3">
                <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-400">
                  <p className="font-semibold mb-1">Need Help?</p>
                  <p className="text-blue-400/80">
                    Please contact HR if you believe your salary structure should be available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'PROCESSED':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <InfoIcon className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Paid' },
      PROCESSED: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Processed' },
      PENDING: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Pending' },
      NOT_GENERATED: { bg: 'bg-neutral-500/10', text: 'text-neutral-400', label: 'Not Generated' },
    };
    const badge = badges[status] || badges.NOT_GENERATED;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border border-current/20`}>
        {badge.label}
      </span>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                My Salary
              </h1>
              <p className="text-sm text-neutral-400">View your salary structure and payment history</p>
            </div>
          </div>
        </div>

        {/* Current Month Payroll Status */}
        {!statusLoading && payrollStatus?.currentMonth && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Current Month Status</h3>
                <p className="text-sm text-neutral-400">
                  {monthNames[payrollStatus.currentMonth.month - 1]} {payrollStatus.currentMonth.year}
                </p>
              </div>
              {getStatusBadge(payrollStatus.currentMonth.status)}
            </div>
            {payrollStatus.currentMonth.status !== 'NOT_GENERATED' && (
              <div className="flex items-center justify-between bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
                <span className="text-sm text-neutral-400">Net Salary</span>
                <span className="text-2xl font-bold text-emerald-400">
                  ₹{payrollStatus.currentMonth.netSalary.toLocaleString()}
                </span>
              </div>
            )}
            {payrollStatus.currentMonth.status === 'NOT_GENERATED' && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400 flex items-center gap-2">
                  <InfoIcon className="w-4 h-4" />
                  Payroll for this month has not been generated yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Salary Structure */}
        {!salaryLoading && salaryData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Earnings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Basic Salary</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.basicSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">HRA</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.hra.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Conveyance</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.conveyance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Medical Allowance</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.medicalAllowance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Special Allowance</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.specialAllowance.toLocaleString()}
                  </span>
                </div>
                {salaryData.otherAllowances > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Other Allowances</span>
                    <span className="text-sm font-semibold text-white">
                      ₹{salaryData.otherAllowances.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-neutral-800 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Gross Salary</span>
                    <span className="text-lg font-bold text-emerald-400">
                      ₹{salaryData.grossSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Deductions</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">PF (Provident Fund)</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.pf.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">ESI</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.esi.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Professional Tax</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.professionalTax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">TDS</span>
                  <span className="text-sm font-semibold text-white">
                    ₹{salaryData.tds.toLocaleString()}
                  </span>
                </div>
                {salaryData.otherDeductions > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Other Deductions</span>
                    <span className="text-sm font-semibold text-white">
                      ₹{salaryData.otherDeductions.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-neutral-800 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Total Deductions</span>
                    <span className="text-lg font-bold text-rose-400">
                      ₹{(salaryData.pf + salaryData.esi + salaryData.professionalTax + salaryData.tds + salaryData.otherDeductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Card - Full Width */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-950 to-teal-950 border border-emerald-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-400/80 font-medium">Net Salary (Take Home)</p>
                    <p className="text-xs text-emerald-400/60 mt-1">Gross Salary - Total Deductions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-400">
                    ₹{salaryData.netSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-400/60 mt-1">per month</p>
                </div>
              </div>
            </div>

            {/* CTC Card */}
            <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 font-medium">Cost to Company (CTC)</p>
                    <p className="text-xs text-neutral-500 mt-1">Annual package including all benefits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    ₹{salaryData.ctc.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">per month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Salary History */}
        {!historyLoading && salaryHistory && salaryHistory.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Recent Payroll History</h3>
            </div>

            <div className="space-y-3">
              {salaryHistory.slice(0, 6).map((record: any) => (
                <div
                  key={record.payrollRunId}
                  className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="text-sm font-semibold text-white">{record.period}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Gross: ₹{record.grossSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        ₹{record.netSalary.toLocaleString()}
                      </p>
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-semibold mb-1">Employee Access - Read Only</p>
              <p className="text-blue-400/80">
                You can view your salary structure and payment history. For any changes or concerns, please contact HR.
              </p>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
