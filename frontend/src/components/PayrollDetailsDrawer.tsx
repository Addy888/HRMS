'use client';

import React from 'react';
import { X, User, Calendar, DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  workingDays: number;
  present: number;
  leaves: number;
  weekOffs: number;
  holidays: number;
  overtime: number;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: string;
}

interface Props {
  payroll: PayrollRecord;
  onClose: () => void;
}

export default function PayrollDetailsDrawer({ payroll, onClose }: Props) {
  // Calculate breakdown (mock values for now)
  const earnings = {
    basic: payroll.basicSalary,
    hra: payroll.basicSalary * 0.4,
    specialAllowance: payroll.basicSalary * 0.2,
    medical: 1500,
    travel: 1600,
    bonus: payroll.overtime * 200,
  };

  const deductions = {
    pf: payroll.basicSalary * 0.12,
    esi: payroll.grossSalary * 0.0075,
    professionalTax: 200,
    tds: payroll.grossSalary * 0.05,
    loan: 0,
    advance: 0,
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-neutral-950 border-l border-neutral-800 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Payroll Details</h2>
              <p className="text-sm text-neutral-400 mt-1">Complete salary breakdown and attendance summary</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors group"
            >
              <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Employee Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Name</div>
                <div className="text-sm text-white font-medium">{payroll.employeeName}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Employee ID</div>
                <div className="text-sm text-white font-mono">{payroll.employeeCode}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Department</div>
                <div className="text-sm text-white">{payroll.department}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Designation</div>
                <div className="text-sm text-white">{payroll.designation}</div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="text-xs text-blue-400 font-semibold uppercase mb-1">Working Days</div>
                <div className="text-2xl font-bold text-white">{payroll.workingDays}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="text-xs text-emerald-400 font-semibold uppercase mb-1">Present</div>
                <div className="text-2xl font-bold text-white">{payroll.present}</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="text-xs text-amber-400 font-semibold uppercase mb-1">Leaves</div>
                <div className="text-2xl font-bold text-white">{payroll.leaves}</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-xs text-purple-400 font-semibold uppercase mb-1">Week Offs</div>
                <div className="text-2xl font-bold text-white">{payroll.weekOffs}</div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="text-xs text-indigo-400 font-semibold uppercase mb-1">Holidays</div>
                <div className="text-2xl font-bold text-white">{payroll.holidays}</div>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="text-xs text-cyan-400 font-semibold uppercase mb-1">Overtime</div>
                <div className="text-2xl font-bold text-white">{payroll.overtime}h</div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Earnings Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Basic Salary</span>
                <span className="text-sm font-mono text-white">₹{earnings.basic.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">House Rent Allowance (HRA)</span>
                <span className="text-sm font-mono text-white">₹{earnings.hra.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Special Allowance</span>
                <span className="text-sm font-mono text-white">₹{earnings.specialAllowance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Medical Allowance</span>
                <span className="text-sm font-mono text-white">₹{earnings.medical.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Travel Allowance</span>
                <span className="text-sm font-mono text-white">₹{earnings.travel.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Overtime Bonus</span>
                <span className="text-sm font-mono text-white">₹{earnings.bonus.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 mt-4">
                <span className="text-sm font-semibold text-emerald-400">Gross Salary</span>
                <span className="text-lg font-mono font-bold text-white">₹{payroll.grossSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Deductions Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Provident Fund (PF)</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.pf.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">ESI</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.esi.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Professional Tax</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.professionalTax.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Income Tax (TDS)</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.tds.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Loan Recovery</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.loan.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">Advance Salary</span>
                <span className="text-sm font-mono text-red-400">-₹{deductions.advance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 mt-4">
                <span className="text-sm font-semibold text-red-400">Total Deductions</span>
                <span className="text-lg font-mono font-bold text-white">₹{payroll.deductions.toLocaleString()}</span>
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
                  ₹{payroll.netSalary.toLocaleString()}
                </div>
                <div className="text-sm text-emerald-400 mt-1">Gross - Deductions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
