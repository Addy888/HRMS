'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { X, Loader2, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

interface AssignProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSuccess?: () => void;
}

export function AssignProcessModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: AssignProcessModalProps) {
  const [departmentId, setDepartmentId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (employee?.departmentId) {
      setDepartmentId(employee.departmentId);
    } else {
      setDepartmentId('');
    }
  }, [employee]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const r = await api.get('/departments');
      return Array.isArray(r.data) ? r.data : r.data?.data || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { employeeId: string; departmentId: string }) => {
      const res = await api.put(`/employees/${data.employeeId}`, {
        departmentId: data.departmentId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-process-overview'] });
      if (employee?.id) {
        queryClient.invalidateQueries({ queryKey: ['employee-detail', employee.id] });
      }
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

    if (!employee?.id) {
      alert('Employee not found');
      return;
    }

    assignMutation.mutate({
      employeeId: employee.id,
      departmentId,
    });
  };

  if (!isOpen || !employee) return null;

  const currentDept = departments.find((d: any) => d.id === employee.departmentId);
  const newDept = departments.find((d: any) => d.id === departmentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Change Process</h3>
              <p className="text-sm text-neutral-400 mt-0.5">
                {employee.firstName} {employee.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-heading text-sm font-bold text-white uppercase shrink-0">
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-xs text-neutral-500">{employee.employeeId}</p>
              </div>
            </div>
          </div>

          {/* Current Process */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Current Process
            </label>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
              <p className="text-white">
                {currentDept?.name || (
                  <span className="text-neutral-500 italic">Unassigned</span>
                )}
              </p>
            </div>
          </div>

          {/* New Process Selection */}
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              New Process / Department *
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
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

          {/* Change Summary */}
          {departmentId && departmentId !== employee.departmentId && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                Summary
              </p>
              <p className="text-sm text-blue-200">
                Moving from <span className="font-semibold">{currentDept?.name || 'Unassigned'}</span> to{' '}
                <span className="font-semibold">{newDept?.name}</span>
              </p>
            </div>
          )}

          {/* Error Display */}
          {assignMutation.isError && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">
                {(assignMutation.error as any)?.response?.data?.message || 'Failed to assign process. Please try again.'}
              </p>
            </div>
          )}

          {/* Success Display */}
          {assignMutation.isSuccess && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200">
                Process updated successfully!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-semibold transition-colors"
              disabled={assignMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || !departmentId || departmentId === employee.departmentId}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
