'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { X, AlertTriangle, Users, DollarSign, Calendar, CheckCircle } from 'lucide-react';

interface Props {
  month: number;
  year: number;
  employeeCount: number;
  estimatedPayroll: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProcessPayrollModal({
  month,
  year,
  employeeCount,
  estimatedPayroll,
  onClose,
  onSuccess,
}: Props) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const processMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/payroll-processing/process', {
        month,
        year,
      });
    },
    onSuccess: () => {
      toast.success('Payroll processed successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payroll');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Process Payroll</h3>
              <p className="text-xs text-neutral-400">Confirm payroll processing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processMutation.isPending}
            className="p-2 hover:bg-neutral-900 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-400 mb-1">Important</div>
              <div className="text-sm text-neutral-300">
                This will process payroll for all employees. Make sure all attendance, leaves, and adjustments are finalized.
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-4 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-neutral-300">Processing Month</span>
              </div>
              <span className="text-sm font-bold text-white">
                {months[month - 1]} {year}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-neutral-300">Employee Count</span>
              </div>
              <span className="text-sm font-bold text-white">{employeeCount} employees</span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-neutral-300">Estimated Payroll</span>
              </div>
              <span className="text-sm font-bold text-white">
                ₹{((estimatedPayroll || 0) / 100000).toFixed(2)}L
              </span>
            </div>
          </div>

          {/* Process Steps Info */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="text-xs font-semibold text-blue-400 uppercase mb-3">Processing Steps</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Calculate salary based on attendance
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Apply leave deductions
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Calculate overtime payments
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Compute statutory deductions (PF, ESI, TDS)
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Update payroll records
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            disabled={processMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {processMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Start Processing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
