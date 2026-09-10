'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BulkAssignProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployees: any[];
  onSuccess?: () => void;
}

export function BulkAssignProcessModal({
  isOpen,
  onClose,
  selectedEmployees,
  onSuccess,
}: BulkAssignProcessModalProps) {
  const [departmentId, setDepartmentId] = useState('');
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const r = await api.get('/departments');
      return Array.isArray(r.data) ? r.data : r.data?.data || [];
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async (data: { departmentId: string; employeeIds: string[] }) => {
      const res = await api.post('/employees/bulk/assign-department', {
        departmentId: data.departmentId,
        employeeIds: data.employeeIds,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-process-overview'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      alert('Please select a process/department');
      return;
    }

    const selectedDept = departments.find((d: any) => d.id === departmentId);
    const confirmMsg = `You are about to assign ${selectedEmployees.length} employee(s) to "${selectedDept?.name || 'selected process'}".\n\nAre you sure?`;
    
    if (confirm(confirmMsg)) {
      bulkAssignMutation.mutate({
        departmentId,
        employeeIds: selectedEmployees.map(e => e.id),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-xl font-bold text-foreground">Bulk Assign Process</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Employees Preview */}
          <div className="bg-secondary rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Selected Employees
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedEmployees.slice(0, 5).map((emp, idx) => (
                <div key={emp.id} className="text-sm text-card-foreground flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  {emp.firstName} {emp.lastName}
                  {emp.department?.name && (
                    <span className="text-xs text-muted-foreground">
                      (from {emp.department.name})
                    </span>
                  )}
                </div>
              ))}
              {selectedEmployees.length > 5 && (
                <p className="text-xs text-muted-foreground italic">
                  ... and {selectedEmployees.length - 5} more
                </p>
              )}
            </div>
          </div>

          {/* Process Selection */}
          <div>
            <label className="block text-sm font-semibold text-card-foreground mb-2">
              Assign to Process / Department *
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select Process...</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept._count?.employees || 0} employees)
                </option>
              ))}
            </select>
          </div>

          {/* Warning */}
          {selectedEmployees.length > 10 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                You are about to move {selectedEmployees.length} employees. This operation will update all their records.
              </p>
            </div>
          )}

          {/* Error Display */}
          {bulkAssignMutation.isError && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">
                {(bulkAssignMutation.error as any)?.response?.data?.message || 'Failed to assign employees. Please try again.'}
              </p>
            </div>
          )}

          {/* Success Display */}
          {bulkAssignMutation.isSuccess && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200">
                Successfully assigned {selectedEmployees.length} employees!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary text-card-foreground rounded-xl font-semibold transition-colors"
              disabled={bulkAssignMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkAssignMutation.isPending || !departmentId}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-muted-foreground text-foreground rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {bulkAssignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Selected'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
