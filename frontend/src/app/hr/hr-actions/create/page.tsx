'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HRLayout from '@/layouts/HRLayout';
import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Save, Send, Loader2, User, Building, Calendar, Mail, Phone } from 'lucide-react';
import { toast } from '@/lib/toast';

const ACTION_TYPES = [
  { value: 'LATE_LOGIN_WARNING', label: 'Late Login Warning' },
  { value: 'ATTENDANCE_WARNING', label: 'Attendance Warning' },
  { value: 'UNAUTHORIZED_ABSENCE', label: 'Unauthorized Absence' },
  { value: 'LEAVE_VIOLATION', label: 'Leave Violation' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'MISCONDUCT', label: 'Misconduct' },
  { value: 'PERFORMANCE_WARNING', label: 'Performance Warning' },
  { value: 'REPEATED_LATE_LOGIN', label: 'Repeated Late Login' },
  { value: 'SHOW_CAUSE_NOTICE', label: 'Show Cause Notice' },
  { value: 'FINAL_WARNING', label: 'Final Warning' },
  { value: 'GENERAL_WARNING', label: 'General Warning' },
  { value: 'CUSTOM_NOTICE', label: 'Custom HR Notice' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400' },
];

function CreateHRActionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [formData, setFormData] = useState({
    employeeId: employeeId || '',
    actionType: '',
    severity: '',
    subject: '',
    reason: '',
    incidentDate: new Date().toISOString().split('T')[0],
    correctiveAction: '',
    additionalRemarks: '',
    responseRequired: false,
    responseDeadline: '',
  });

  // Fetch employee details
  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await api.get(`/employees/${employeeId}`);
      return res.data;
    },
    enabled: !!employeeId,
  });

  // Create HR Action mutation (with sendImmediately flag)
  const createMutation = useMutation({
    mutationFn: async ({ data, sendImmediately }: { data: any; sendImmediately: boolean }) => {
      const params = sendImmediately ? '?sendImmediately=true' : '';
      const res = await api.post(`/hr-actions${params}`, data);
      return res.data;
    },
    onSuccess: (data, variables) => {
      const message = variables.sendImmediately 
        ? 'HR Action sent to employee successfully' 
        : 'HR Action saved as draft successfully';
      toast.success(message);
      router.push('/hr/hr-actions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create HR Action');
    },
  });

  const handleSubmit = (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault();
    
    // Validation
    if (!formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!formData.actionType) {
      toast.error('Please select action type');
      return;
    }
    if (!formData.severity) {
      toast.error('Please select severity');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Please enter subject');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please enter reason/description');
      return;
    }
    if (formData.responseRequired && !formData.responseDeadline) {
      toast.error('Please set response deadline');
      return;
    }

    // Prepare data - convert dates to ISO 8601 format
    const submitData = {
      ...formData,
      incidentDate: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : new Date().toISOString(),
      responseDeadline: formData.responseRequired && formData.responseDeadline 
        ? new Date(formData.responseDeadline + 'T23:59:59').toISOString()
        : null,
    };

    createMutation.mutate({ data: submitData, sendImmediately });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingEmployee) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    );
  }

  if (!employee) {
    return (
      <HRLayout>
        <div className="text-center py-16">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Employee Not Found</h2>
          <p className="text-neutral-400 mb-6">The selected employee could not be found.</p>
          <button
            onClick={() => router.push('/hr/employees')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Employees
          </button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                Send HR Action / Warning
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Issue an official HR warning or notice to employee
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, true)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Information Card */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Employee Information
              </h3>
              
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white uppercase">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Name</div>
                    <div className="font-semibold text-white">{employee.firstName} {employee.lastName}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Employee ID</div>
                    <div className="font-mono text-neutral-300">{employee.employeeId}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    <div className="text-neutral-300">{employee.email}</div>
                  </div>
                  
                  {employee.phone && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </div>
                      <div className="text-neutral-300">{employee.phone}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Department
                    </div>
                    <div className="text-neutral-300">{employee.departmentName || '—'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Designation</div>
                    <div className="text-neutral-300">{employee.designationTitle || '—'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joining Date
                    </div>
                    <div className="text-neutral-300">
                      {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HR Action Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Action Details</h3>
              
              <div className="space-y-5">
                {/* Action Type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Action Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.actionType}
                    onChange={(e) => handleChange('actionType', e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Action Type</option>
                    {ACTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Severity <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleChange('severity', e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Severity</option>
                    {SEVERITIES.map(sev => (
                      <option key={sev.value} value={sev.value}>{sev.label}</option>
                    ))}
                  </select>
                </div>

                {/* Incident Date */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Incident Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => handleChange('incidentDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="e.g., Late Login - 05 Aug 2026"
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                    required
                  />
                  <div className="text-xs text-neutral-500 mt-1">{formData.subject.length}/200 characters</div>
                </div>

                {/* Reason/Description */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Reason / Incident Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="Provide detailed description of the incident..."
                    rows={6}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Corrective Action */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Required Corrective Action
                  </label>
                  <textarea
                    value={formData.correctiveAction}
                    onChange={(e) => handleChange('correctiveAction', e.target.value)}
                    placeholder="Specify what corrective action the employee must take..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Additional Remarks */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Additional Remarks
                  </label>
                  <textarea
                    value={formData.additionalRemarks}
                    onChange={(e) => handleChange('additionalRemarks', e.target.value)}
                    placeholder="Any additional comments or notes..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Response Required */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="responseRequired"
                    checked={formData.responseRequired}
                    onChange={(e) => handleChange('responseRequired', e.target.checked)}
                    className="w-4 h-4 bg-black border-neutral-800 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="responseRequired" className="text-sm font-semibold text-neutral-300">
                    Response Required from Employee
                  </label>
                </div>

                {/* Response Deadline */}
                {formData.responseRequired && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      Response Deadline <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.responseDeadline}
                      onChange={(e) => handleChange('responseDeadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e: any) => handleSubmit(e, false)}
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send HR Action
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </HRLayout>
  );
}

export default function CreateHRActionPage() {
  return (
    <Suspense fallback={
      <HRLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    }>
      <CreateHRActionForm />
    </Suspense>
  );
}
