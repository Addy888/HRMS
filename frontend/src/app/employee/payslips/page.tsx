'use client';

import React, { useState } from 'react';
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
  Download,
  Eye,
  X,
  Printer,
  Building2,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface PayslipDetail {
  payslipId?: string;
  payslipNumber?: string;
  generatedAt?: string;
  employee: {
    employeeId: string;
    name: string;
    email?: string;
    department?: string;
    designation?: string;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  earnings: {
    basicSalary: number;
    allowances: number;
    grossSalary: number;
  };
  deductions: {
    total: number;
  };
  netSalary: number;
  status: string;
}

export default function EmployeePayslipsPage() {
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);

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

  // Fetch employee's salary / payslip history
  const { data: salaryHistory, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ['my-salary-history'],
    queryFn: async () => {
      const response = await api.get('/employee-salary/my-salary-history');
      return response.data?.data ?? response.data;
    },
  });

  // Fetch specific payslip details when modal is open
  const { data: payslipDetail, isLoading: payslipDetailLoading } = useQuery<PayslipDetail>({
    queryKey: ['employee-payslip-detail', selectedPayrollRunId],
    queryFn: async () => {
      if (!selectedPayrollRunId) return null;
      const response = await api.get(`/employee-salary/payslip/${selectedPayrollRunId}`);
      return response.data?.data ?? response.data;
    },
    enabled: !!selectedPayrollRunId,
  });

  const isLoading = salaryLoading || statusLoading || historyLoading;
  const isError = salaryError || statusError || historyError;

  const handleDownload = async (payslipId?: string) => {
    if (payslipId) {
      try {
        await api.get(`/salary-slip/${payslipId}/download`);
      } catch (err) {
        console.warn('Could not record download event:', err);
      }
    }
    window.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'PROCESSED':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <InfoIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Paid' },
      PROCESSED: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Processed' },
      PENDING: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Pending' },
      NOT_GENERATED: { bg: 'bg-secondary text-muted-foreground', text: 'text-muted-foreground', label: 'Not Generated' },
    };
    const badge = badges[status] || badges.NOT_GENERATED;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border border-current/20`}>
        {badge.label}
      </span>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Handle loading state with skeleton loaders
  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                  My Payslips
                </h1>
                <p className="text-sm text-muted-foreground">View your salary slips, payment history, and salary structure</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-secondary rounded mb-4"></div>
            <div className="h-20 bg-secondary rounded"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-32 bg-secondary rounded mb-6"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 w-32 bg-secondary rounded"></div>
                      <div className="h-4 w-24 bg-secondary rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-secondary rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-secondary rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-red-600" />
          <h2 className="font-heading text-xl font-bold text-foreground">Failed to load payslip information</h2>
          <p className="text-sm text-muted-foreground">Please contact HR if this issue persists</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                My Payslips
              </h1>
              <p className="text-sm text-muted-foreground">View your salary slips, payment history, and salary structure</p>
            </div>
          </div>
        </div>

        {/* Current Month Payroll Status */}
        {!statusLoading && payrollStatus?.currentMonth && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Current Month Status</h3>
                <p className="text-sm text-muted-foreground">
                  {monthNames[payrollStatus.currentMonth.month - 1]} {payrollStatus.currentMonth.year}
                </p>
              </div>
              {getStatusBadge(payrollStatus.currentMonth.status)}
            </div>
            {payrollStatus.currentMonth.status !== 'NOT_GENERATED' && (
              <div className="flex items-center justify-between bg-secondary/80 rounded-xl p-4 border border-border">
                <span className="text-sm text-muted-foreground">Net Salary</span>
                <span className="text-2xl font-bold text-emerald-600 font-mono">
                  ₹{(payrollStatus.currentMonth.netSalary ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {payrollStatus.currentMonth.status === 'NOT_GENERATED' && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-600 flex items-center gap-2">
                  <InfoIcon className="w-4 h-4" />
                  Payroll for this month has not been generated yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Payslips History */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Salary Slips & History</h3>
              <p className="text-xs text-muted-foreground">Download or view your monthly payslips</p>
            </div>
          </div>

          {salaryHistory && salaryHistory.length > 0 ? (
            <div className="space-y-3">
              {salaryHistory.map((record: any) => (
                <div
                  key={record.payrollRunId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/80 rounded-xl border border-border hover:border-border transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{record.period}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gross: ₹{(record?.grossSalary ?? 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 font-mono">
                        ₹{(record?.netSalary ?? 0).toLocaleString('en-IN')}
                      </p>
                      {getStatusBadge(record.status)}
                    </div>

                    <button
                      onClick={() => setSelectedPayrollRunId(record.payrollRunId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                      title="View Payslip"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No Payslips Generated Yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your monthly payslips will appear here once processed by HR.
              </p>
            </div>
          )}
        </div>

        {/* Salary Structure (if available) */}
        {salaryData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Salary Structure — Earnings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Basic Salary</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.basicSalary ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">HRA</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.hra ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conveyance</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.conveyance ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Medical Allowance</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.medicalAllowance ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Special Allowance</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.specialAllowance ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {(salaryData?.otherAllowances ?? 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Other Allowances</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{(salaryData?.otherAllowances ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Gross Salary</span>
                    <span className="text-lg font-bold text-emerald-600 font-mono">
                      ₹{(salaryData?.grossSalary ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Salary Structure — Deductions</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">PF (Provident Fund)</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.pf ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ESI</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.esi ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Professional Tax</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.professionalTax ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">TDS</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{(salaryData?.tds ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {(salaryData?.otherDeductions ?? 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Other Deductions</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{(salaryData?.otherDeductions ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Total Deductions</span>
                    <span className="text-lg font-bold text-rose-400 font-mono">
                      ₹{(
                        (salaryData?.pf ?? 0) +
                        (salaryData?.esi ?? 0) +
                        (salaryData?.professionalTax ?? 0) +
                        (salaryData?.tds ?? 0) +
                        (salaryData?.otherDeductions ?? 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-950 to-teal-950 border border-emerald-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-300 font-medium">Net Salary (Take Home)</p>
                    <p className="text-xs text-emerald-400/70 mt-1">Gross Salary - Total Deductions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-400 font-mono">
                    ₹{(salaryData?.netSalary ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-emerald-300/60 mt-1">per month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-600">
              <p className="font-semibold mb-1">Employee Access — Read Only</p>
              <p className="text-blue-600/80">
                You can view and print your monthly payslips. For any discrepancies or concerns, please contact the HR department.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedPayrollRunId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    Salary Slip
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {payslipDetail?.period
                      ? `${payslipDetail.period.monthName} ${payslipDetail.period.year}`
                      : 'Loading payslip...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {payslipDetail && (
                  <button
                    onClick={() => handleDownload(payslipDetail.payslipId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save
                  </button>
                )}
                <button
                  onClick={() => setSelectedPayrollRunId(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {payslipDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading salary slip details...</p>
              </div>
            ) : payslipDetail ? (
              <div className="p-6 space-y-6" id="printable-payslip">
                {/* Organization & Slip Info */}
                <div className="bg-secondary/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <span className="font-heading text-base font-bold text-foreground">FCS HRMS</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Salary Slip for Period</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {payslipDetail.period.monthName} {payslipDetail.period.year}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    {payslipDetail.payslipNumber && (
                      <p className="text-xs font-mono text-muted-foreground">
                        Slip #: <span className="text-foreground font-semibold">{payslipDetail.payslipNumber}</span>
                      </p>
                    )}
                    <div className="mt-2">
                      {getStatusBadge(payslipDetail.status)}
                    </div>
                  </div>
                </div>

                {/* Employee Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-xl border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Employee</span>
                    <span className="text-sm font-bold text-foreground">{payslipDetail.employee.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Employee ID</span>
                    <span className="text-sm font-mono font-semibold text-foreground">{payslipDetail.employee.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Department</span>
                    <span className="text-sm text-foreground">{payslipDetail.employee.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Designation</span>
                    <span className="text-sm text-foreground">{payslipDetail.employee.designation || 'N/A'}</span>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border border-border rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Earnings
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Basic Salary</span>
                        <span className="font-semibold text-foreground">
                          ₹{payslipDetail.earnings.basicSalary.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Allowances</span>
                        <span className="font-semibold text-foreground">
                          ₹{payslipDetail.earnings.allowances.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                        <span>Gross Salary</span>
                        <span className="text-emerald-600">
                          ₹{payslipDetail.earnings.grossSalary.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-border rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" /> Deductions
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Deductions</span>
                        <span className="font-semibold text-rose-400">
                          ₹{payslipDetail.deductions.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                        <span>Total Deductions</span>
                        <span className="text-rose-400">
                          ₹{payslipDetail.deductions.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Take Home */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Net Salary Payable</p>
                    <p className="text-[11px] text-muted-foreground">Gross Salary - Total Deductions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-emerald-600 font-mono">
                      ₹{payslipDetail.netSalary.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>Could not load payslip details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
