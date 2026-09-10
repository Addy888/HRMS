'use client';

import React from 'react';
import { X, User, DollarSign, TrendingUp, TrendingDown, Calendar, CheckCircle } from 'lucide-react';

interface PayrollReport {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  paymentDate: string | null;
  status: string;
}

interface Props {
  report: PayrollReport;
  onClose: () => void;
}

export default function PayrollReportDrawer({ report, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-card backdrop-blur-sm border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Payroll Details</h2>
              <p className="text-sm text-muted-foreground mt-1">{report.employeeName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors group"
            >
              <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Employee Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Employee ID</div>
                <div className="text-sm text-foreground font-mono">{report.employeeCode}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Name</div>
                <div className="text-sm text-foreground font-medium">{report.employeeName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Department</div>
                <div className="text-sm text-foreground">{report.department}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Designation</div>
                <div className="text-sm text-foreground">{report.designation}</div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Salary Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-card-foreground">Basic Salary</span>
                <span className="text-sm font-mono text-foreground">₹{report.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-card-foreground">Allowances</span>
                <span className="text-sm font-mono text-emerald-600">+₹{report.allowances.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4">
                <span className="text-sm font-semibold text-emerald-600">Gross Salary</span>
                <span className="text-lg font-mono font-bold text-foreground">₹{report.grossSalary.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-card-foreground">Deductions</span>
                <span className="text-sm font-mono text-red-600">-₹{report.deductions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 mt-4">
                <span className="text-sm font-semibold text-blue-600">Net Salary</span>
                <span className="text-lg font-mono font-bold text-foreground">₹{report.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {report.paymentDate && (
            <div className="bg-secondary border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Payment Date</div>
                  <div className="text-sm text-foreground">{new Date(report.paymentDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${report.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
