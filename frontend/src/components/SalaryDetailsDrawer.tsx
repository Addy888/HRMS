'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  X,
  User,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  payrollStatus: string;
  paymentStatus: string;
}

interface SalaryDetails {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
    bankAccountNumber?: string;
    bankName?: string;
    bankIfsc?: string;
  };
  attendance: {
    workingDays: number;
    present: number;
    leaves: number;
    holidays: number;
    weekOffs: number;
    overtime: number;
  };
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    medical: number;
    travel: number;
    bonus: number;
    otherAllowances: number;
    total: number;
  };
  deductions: {
    pf: number;
    esi: number;
    professionalTax: number;
    tds: number;
    loanEmi: number;
    advanceSalary: number;
    otherDeductions: number;
    total: number;
  };
  payment: {
    netSalary: number;
    paymentDate: string | null;
    paymentMethod: string | null;
    referenceNumber: string | null;
    processedBy: string | null;
    remarks: string | null;
  };
  timeline: Array<{
    status: string;
    date: string;
    by: string;
  }>;
}


interface Props {
  record: SalaryRecord;
  onClose: () => void;
}

export default function SalaryDetailsDrawer({ record, onClose }: Props) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Fetch detailed salary information
  const { data: details, isLoading } = useQuery<SalaryDetails>({
    queryKey: ['salary-details', record.id],
    queryFn: async () => {
      const response = await api.get(`/salary-history/${record.id}`);
      return (
        response.data?.data || {
          employee: {
            id: record.employeeId,
            employeeId: record.employeeCode,
            name: record.employeeName,
            department: record.department,
            designation: record.designation,
          },
          attendance: {
            workingDays: 26,
            present: 24,
            leaves: 2,
            holidays: 2,
            weekOffs: 4,
            overtime: 0,
          },
          earnings: {
            basic: record.basicSalary,
            hra: record.basicSalary * 0.4,
            specialAllowance: record.basicSalary * 0.2,
            medical: 1500,
            travel: 1600,
            bonus: 0,
            otherAllowances: 0,
            total: record.grossSalary,
          },
          deductions: {
            pf: record.basicSalary * 0.12,
            esi: record.grossSalary * 0.0075,
            professionalTax: 200,
            tds: record.grossSalary * 0.05,
            loanEmi: 0,
            advanceSalary: 0,
            otherDeductions: 0,
            total: record.deductions,
          },
          payment: {
            netSalary: record.netSalary,
            paymentDate: record.paymentDate,
            paymentMethod: record.paymentMethod,
            referenceNumber: null,
            processedBy: null,
            remarks: null,
          },
          timeline: [
            {
              status: 'Generated',
              date: new Date().toISOString(),
              by: 'System',
            },
          ],
        }
      );
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-neutral-950 border-l border-neutral-800 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Salary Details</h2>
              <p className="text-sm text-neutral-400 mt-1">
                {months[record.month - 1]} {record.year} • {record.employeeName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors group"
            >
              <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-neutral-900 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Employee Details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Employee Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Employee ID</div>
                  <div className="text-sm text-white font-mono">{details?.employee.employeeId}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Name</div>
                  <div className="text-sm text-white font-medium">{details?.employee.name}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Department</div>
                  <div className="text-sm text-white">{details?.employee.department}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Designation</div>
                  <div className="text-sm text-white">{details?.employee.designation}</div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            {details?.employee.bankAccountNumber && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Bank Name</div>
                    <div className="text-sm text-white">{details?.employee.bankName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">IFSC Code</div>
                    <div className="text-sm text-white font-mono">{details?.employee.bankIfsc || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Account Number</div>
                    <div className="text-sm text-white font-mono">{details?.employee.bankAccountNumber}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Attendance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="text-xs text-blue-400 font-semibold uppercase mb-1">Working Days</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.workingDays}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="text-xs text-emerald-400 font-semibold uppercase mb-1">Present</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.present}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">Leaves</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.leaves}</div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                  <div className="text-xs text-indigo-400 font-semibold uppercase mb-1">Holidays</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.holidays}</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="text-xs text-purple-400 font-semibold uppercase mb-1">Week Offs</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.weekOffs}</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="text-xs text-cyan-400 font-semibold uppercase mb-1">Overtime</div>
                  <div className="text-2xl font-bold text-white">{details?.attendance.overtime}h</div>
                </div>
              </div>
            </div>

            {/* Salary Breakdown - Earnings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Salary Breakdown - Earnings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Basic Salary</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.basic.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">House Rent Allowance (HRA)</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.hra.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Special Allowance</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.specialAllowance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Medical Allowance</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.medical.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Travel Allowance</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.travel.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Bonus</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.bonus.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Other Allowances</span>
                  <span className="text-sm font-mono text-white">
                    ₹{details?.earnings.otherAllowances.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 mt-4">
                  <span className="text-sm font-semibold text-emerald-400">Gross Salary</span>
                  <span className="text-lg font-mono font-bold text-white">
                    ₹{details?.earnings.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Deductions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Provident Fund (PF)</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.pf.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">ESI</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.esi.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Professional Tax</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.professionalTax.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Income Tax (TDS)</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.tds.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Loan EMI</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.loanEmi.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Advance Salary</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.advanceSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <span className="text-sm text-neutral-300">Other Deductions</span>
                  <span className="text-sm font-mono text-red-400">
                    -₹{details?.deductions.otherDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 mt-4">
                  <span className="text-sm font-semibold text-red-400">Total Deductions</span>
                  <span className="text-lg font-mono font-bold text-white">
                    ₹{details?.deductions.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-400 uppercase font-semibold">Net Salary</div>
                    <div className="text-xs text-neutral-500 mt-1">Take Home Pay</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white font-mono">
                    ₹{details?.payment.netSalary.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-400 mt-1">Gross - Deductions</div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Payment Date</div>
                  <div className="text-sm text-white">
                    {details?.payment.paymentDate
                      ? new Date(details.payment.paymentDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Payment Method</div>
                  <div className="text-sm text-white">{details?.payment.paymentMethod || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Reference Number</div>
                  <div className="text-sm text-white font-mono">
                    {details?.payment.referenceNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Processed By</div>
                  <div className="text-sm text-white">{details?.payment.processedBy || '—'}</div>
                </div>
                {details?.payment.remarks && (
                  <div className="col-span-2">
                    <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Remarks</div>
                    <div className="text-sm text-white">{details.payment.remarks}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            {details?.timeline && details.timeline.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  {details.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                        {index < details.timeline.length - 1 && (
                          <div className="absolute top-3 left-1.5 w-0.5 h-12 bg-neutral-800" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{event.status}</span>
                          <span className="text-xs text-neutral-500">
                            {new Date(event.date).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400">By {event.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
