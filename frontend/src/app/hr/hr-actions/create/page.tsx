'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HRLayout from '@/layouts/HRLayout';
import api from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowLeft, Save, Send, User, Building, Mail,
  Calendar, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from '@/lib/toast';

// Action type mappings with user-friendly labels
// These MUST match the backend HRActionType enum values exactly
const ACTION_TYPES = [
  { value: 'WARNING', label: 'Warning' },
  { value: 'WRITTEN_WARNING', label: 'Written Warning' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'COUNSELLING', label: 'Counselling' },
  { value: 'PERFORMANCE_IMPROVEMENT_PLAN', label: 'Performance Improvement Plan' },
  { value: 'COMMENDATION', label: 'Commendation' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400' },
];

export default function CreateHRActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  // Form state
  const [formData, setFormData] = useState({
    employeeId: employeeId || '',
    actionType: '',
    severity: '',
    subject: '',
    reason: '',
    incidentDate: '',
    correctiveAction: '',
    additionalRemarks: '',
    responseRequired: false,
    responseDeadline: '',
  });

  // Fetch employee details
  const { data: employee, isLoading: loadingEmployee, error: employeeError } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await api.get(`/employees/${employeeId}`);
      return res.data;
    },
    enabled: !!employeeId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async ({ data, sendImmediately }: { data: any; sendImmediately: boolean }) => {
      const url = sendImmediately ? '/hr-actions?sendImmediately=true' : '/hr-actions';
      const res = await api.post(url, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('HR Action created successfully');
      const actionId = data?.id || data?.data?.id;
      if (actionId) {
        router.push(`/hr/hr-actions/${actionId}`);
      } else {
        router.push('/hr/hr-actions');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create HR Action');
    },
  });

  // Handle form change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.employeeId) errors.push('Employee is required');
    if (!formData.actionType) errors.push('Action Type is required');
    if (!formData.severity) errors.push('Severity is required');
    if (!formData.subject.trim()) errors.push('Subject is required');
    if (formData.subject.length > 200) errors.push('Subject must be 200 characters or less');
    if (!formData.reason.trim()) errors.push('Reason is required');
    if (!formData.incidentDate) errors.push('Incident Date is required');
    
    return errors;
  };

  // Handle submit
  const handleSubmit = (sendImmediately: boolean) => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    // Prepare payload
    const payload: any = {
      employeeId: formData.employeeId,
      actionType: formData.actionType,
      severity: formData.severity,
      subject: formData.subject.trim(),
      reason: formData.reason.trim(),
      incidentDate: new Date(formData.incidentDate).toISOString(),
      responseRequired: formData.responseRequired,
    };

    if (formData.correctiveAction?.trim()) {
      payload.correctiveAction = formData.correctiveAction.trim();
    }

    if (formData.additionalRemarks?.trim()) {
      payload.additionalRemarks = formData.additionalRemarks.trim();
    }

    if (formData.responseRequired && formData.responseDeadline) {
      payload.responseDeadline = new Date(formData.responseDeadline).toISOString();
    }

    createMutation.mutate({ data: payload, sendImmediately });
  };

  // Error state
  if (!employeeId) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-16 h-16 text-red-400" />
          <h2 className="text-xl font-bold text-white">Employee ID Missing</h2>
          <p className="text-neutral-400">Please select an employee from the Employees page.</p>
          <button
            onClick={() => router.push('/hr/employees')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Employees
          </button>
        </div>
      </HRLayout>
    );
  }

  if (employeeError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-16 h-16 text-red-400" />
          <h2 className="text-xl font-bold text-white">Employee Not Found</h2>
          <p className="text-neutral-400">Unable to load employee details.</p>
          <button
            onClick={() => router.push('/hr/employees')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Employees
          </button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
              Create HR Action
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Create a warning, notice, or disciplinary action for an employee
            </p>
          </div>
        </div>

        {/* Employee Information Card */}
        {loadingEmployee ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-1/3 animate-pulse"></div>
                <div className="h-3 bg-neutral-800 rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : employee ? (
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Selected Employee
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-bold text-white uppercase shrink-0">
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Name</div>
                  <div className="font-semibold text-white">
                    {employee.firstName} {employee.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Employee ID</div>
                  <div className="font-mono text-neutral-300">{employee.employeeId}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Department
                  </div>
                  <div className="text-neutral-300">{employee.department?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Designation</div>
                  <div className="text-neutral-300">{employee.designation?.name || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* HR Action Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            HR Action Details
          </h3>

          <div className="space-y-6">
            {/* Action Type & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Action Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.actionType}
                  onChange={(e) => handleChange('actionType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select action type</option>
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Severity <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select severity</option>
                  {SEVERITIES.map(severity => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Subject <span className="text-red-400">*</span>
                <span className="text-xs text-neutral-500 ml-2">
                  ({formData.subject.length}/200 characters)
                </span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                maxLength={200}
                placeholder="Brief summary of the HR action"
                className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Reason / Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={5}
                placeholder="Detailed explanation of why this HR action is being issued..."
                className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Incident Date */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Incident Date <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleChange('incidentDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Corrective Action */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Required Corrective Action
                <span className="text-xs text-neutral-500 ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.correctiveAction}
                onChange={(e) => handleChange('correctiveAction', e.target.value)}
                rows={3}
                placeholder="What actions must the employee take to address this issue?"
                className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Additional Remarks */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Additional Remarks
                <span className="text-xs text-neutral-500 ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.additionalRemarks}
                onChange={(e) => handleChange('additionalRemarks', e.target.value)}
                rows={3}
                placeholder="Any additional notes or comments..."
                className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Response Required */}
            <div className="bg-black/40 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">
                    Response Required <span className="text-red-400">*</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Does the employee need to provide a written response?
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('responseRequired', !formData.responseRequired);
                    if (formData.responseRequired) {
                      handleChange('responseDeadline', '');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.responseRequired ? 'bg-blue-600' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.responseRequired ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Response Deadline - Only show if response required */}
              {formData.responseRequired && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Response Deadline
                    <span className="text-xs text-neutral-500 ml-2">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.responseDeadline}
                      onChange={(e) => handleChange('responseDeadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <button
            onClick={() => router.back()}
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save as Draft
            </button>
            
            <button
              onClick={() => handleSubmit(true)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Issue & Send
            </button>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
