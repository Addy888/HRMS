'use client';

import React, { Suspense, useState, useEffect } from 'react';
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
// Organized by category: Attendance-Related and Disciplinary/HR
const ACTION_TYPES_ATTENDANCE = [
  { value: 'LATE_LOGIN', label: 'Late Login' },
  { value: 'LATE_ATTENDANCE', label: 'Late Attendance' },
  { value: 'REPEATED_LATE_ATTENDANCE', label: 'Repeated Late Attendance' },
  { value: 'EARLY_CHECKOUT', label: 'Early Checkout' },
  { value: 'ABSENT_WITHOUT_NOTICE', label: 'Absent Without Notice' },
  { value: 'UNAUTHORIZED_ABSENCE', label: 'Unauthorized Absence' },
  { value: 'LOW_WORKING_HOURS', label: 'Low Working Hours' },
  { value: 'MISSED_CHECK_IN', label: 'Missed Check-in' },
  { value: 'MISSED_CHECK_OUT', label: 'Missed Check-out' },
  { value: 'ATTENDANCE_IRREGULARITY', label: 'Attendance Irregularity' },
];

const ACTION_TYPES_DISCIPLINARY = [
  { value: 'WARNING', label: 'Warning' },
  { value: 'WRITTEN_WARNING', label: 'Written Warning' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'COUNSELLING', label: 'Counselling' },
  { value: 'PERFORMANCE_IMPROVEMENT_PLAN', label: 'Performance Improvement Plan' },
  { value: 'COMMENDATION', label: 'Commendation' },
  { value: 'OTHER', label: 'Other' },
];

// Combined list for backward compatibility
const ACTION_TYPES = [...ACTION_TYPES_ATTENDANCE, ...ACTION_TYPES_DISCIPLINARY];

// Helper to check if action type is attendance-related
const isAttendanceRelated = (actionType: string) => {
  return ACTION_TYPES_ATTENDANCE.some(type => type.value === actionType);
};

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
];

function CreateHRActionForm() {
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
    selectedAttendanceDate: '', // For attendance-related actions
  });

  // State for attendance data
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [lateCount, setLateCount] = useState<number>(0);

  // Fetch attendance history when employee changes or attendance action type is selected
  const { data: attendanceHistory, isLoading: loadingAttendance } = useQuery({
    queryKey: ['employee-attendance', employeeId, formData.actionType],
    queryFn: async () => {
      if (!employeeId || !isAttendanceRelated(formData.actionType)) return null;
      
      // Fetch last 30 days of attendance
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const res = await api.get(`/attendance/employee/${employeeId}`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }
      });
      return res.data;
    },
    enabled: !!employeeId && isAttendanceRelated(formData.actionType),
  });

  // Update attendance records when data is fetched
  useEffect(() => {
    if (attendanceHistory?.data) {
      setAttendanceRecords(attendanceHistory.data);
      
      // Calculate late count for repeated late attendance
      const lateRecords = attendanceHistory.data.filter((record: any) => 
        record.status === 'LATE' || record.lateBy > 0
      );
      setLateCount(lateRecords.length);
    }
  }, [attendanceHistory]);

  // When a specific attendance date is selected, load its details
  useEffect(() => {
    if (formData.selectedAttendanceDate && attendanceRecords.length > 0) {
      const selected = attendanceRecords.find(
        (record: any) => record.date.split('T')[0] === formData.selectedAttendanceDate
      );
      setSelectedAttendance(selected);
      
      // Auto-populate incident date with selected attendance date
      if (selected && !formData.incidentDate) {
        handleChange('incidentDate', formData.selectedAttendanceDate);
      }
    }
  }, [formData.selectedAttendanceDate, attendanceRecords]);

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
          <AlertCircle className="w-16 h-16 text-red-600" />
          <h2 className="text-xl font-bold text-foreground">Employee ID Missing</h2>
          <p className="text-muted-foreground">Please select an employee from the Employees page.</p>
          <button
            onClick={() => router.push('/hr/employees')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-foreground rounded-lg transition-colors"
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
          <AlertCircle className="w-16 h-16 text-red-600" />
          <h2 className="text-xl font-bold text-foreground">Employee Not Found</h2>
          <p className="text-muted-foreground">Unable to load employee details.</p>
          <button
            onClick={() => router.push('/hr/employees')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-foreground rounded-lg transition-colors"
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
            className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
              Create HR Action
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a warning, notice, or disciplinary action for an employee
            </p>
          </div>
        </div>

        {/* Employee Information Card */}
        {loadingEmployee ? (
          <div className="bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-1/3 animate-pulse"></div>
                <div className="h-3 bg-secondary rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : employee ? (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Selected Employee
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-bold text-foreground uppercase shrink-0">
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Name</div>
                  <div className="font-semibold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Employee ID</div>
                  <div className="font-mono text-card-foreground">{employee.employeeId}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Department
                  </div>
                  <div className="text-card-foreground">{employee.department?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Designation</div>
                  <div className="text-card-foreground">{employee.designation?.name || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* HR Action Form */}
        <div className="bg-secondary border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            HR Action Details
          </h3>

          <div className="space-y-6">
            {/* Action Type & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Action Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.actionType}
                  onChange={(e) => handleChange('actionType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select action type</option>
                  
                  <optgroup label="📅 Attendance Related">
                    {ACTION_TYPES_ATTENDANCE.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                  
                  <optgroup label="⚠️ Disciplinary / HR">
                    {ACTION_TYPES_DISCIPLINARY.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Severity <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Subject <span className="text-red-600">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({formData.subject.length}/200 characters)
                </span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                maxLength={200}
                placeholder="Brief summary of the HR action"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Reason / Description <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={5}
                placeholder="Detailed explanation of why this HR action is being issued..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Incident Date */}
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Incident Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleChange('incidentDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Attendance Context Section - Only for attendance-related actions */}
            {isAttendanceRelated(formData.actionType) && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-bold text-foreground">Attendance Context</h4>
                  {formData.actionType === 'REPEATED_LATE_ATTENDANCE' && lateCount > 0 && (
                    <span className="ml-auto px-3 py-1 bg-red-500/20 text-red-600 text-xs font-bold rounded-full">
                      {lateCount} Late Records in Last 30 Days
                    </span>
                  )}
                </div>

                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading attendance records...</span>
                  </div>
                ) : attendanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {/* Attendance Date Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-2">
                        Select Attendance Date
                      </label>
                      <select
                        value={formData.selectedAttendanceDate}
                        onChange={(e) => handleChange('selectedAttendanceDate', e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a date</option>
                        {attendanceRecords.map((record: any) => {
                          const date = new Date(record.date).toLocaleDateString('en-GB');
                          const status = record.status || '—';
                          const late = record.lateBy > 0 ? ` (Late by ${record.lateBy} min)` : '';
                          return (
                            <option key={record.id} value={record.date.split('T')[0]}>
                              {date} - {status}{late}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Selected Attendance Details */}
                    {selectedAttendance && (
                      <div className="bg-background/40 border border-border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Date</div>
                            <div className="text-foreground font-semibold">
                              {new Date(selectedAttendance.date).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <div className={`font-semibold ${
                              selectedAttendance.status === 'PRESENT' ? 'text-green-400' :
                              selectedAttendance.status === 'LATE' ? 'text-amber-600' :
                              selectedAttendance.status === 'ABSENT' ? 'text-red-600' :
                              'text-muted-foreground'
                            }`}>
                              {selectedAttendance.status || '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Working Hours</div>
                            <div className="text-foreground font-semibold">
                              {selectedAttendance.workingHours?.toFixed(2) || '0.00'} hrs
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border">
                          {selectedAttendance.checkInTime && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Check In</div>
                              <div className="text-foreground font-mono text-sm">
                                {new Date(selectedAttendance.checkInTime).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          )}
                          {selectedAttendance.checkOutTime && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Check Out</div>
                              <div className="text-foreground font-mono text-sm">
                                {new Date(selectedAttendance.checkOutTime).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          )}
                          {selectedAttendance.lateBy > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Late By</div>
                              <div className="text-red-600 font-semibold">
                                {selectedAttendance.lateBy} min
                              </div>
                            </div>
                          )}
                          {selectedAttendance.earlyExitBy > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Early Exit By</div>
                              <div className="text-orange-400 font-semibold">
                                {selectedAttendance.earlyExitBy} min
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedAttendance.remarks && (
                          <div className="pt-3 border-t border-border">
                            <div className="text-xs text-muted-foreground mb-1">Remarks</div>
                            <div className="text-card-foreground text-sm">
                              {selectedAttendance.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attendance History Table */}
                    <div className="pt-4">
                      <div className="text-sm font-semibold text-muted-foreground mb-2">
                        Recent Attendance History (Last 30 Days)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Date</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Check In</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Check Out</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Hours</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                              <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Late</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.slice(0, 10).map((record: any) => (
                              <tr 
                                key={record.id} 
                                className={`border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors ${
                                  formData.selectedAttendanceDate === record.date.split('T')[0] ? 'bg-blue-500/10' : ''
                                }`}
                                onClick={() => handleChange('selectedAttendanceDate', record.date.split('T')[0])}
                              >
                                <td className="py-2 px-3 text-foreground">
                                  {new Date(record.date).toLocaleDateString('en-GB')}
                                </td>
                                <td className="py-2 px-3 text-card-foreground font-mono text-xs">
                                  {record.checkInTime 
                                    ? new Date(record.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                    : '—'}
                                </td>
                                <td className="py-2 px-3 text-card-foreground font-mono text-xs">
                                  {record.checkOutTime 
                                    ? new Date(record.checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                    : '—'}
                                </td>
                                <td className="py-2 px-3 text-card-foreground">
                                  {record.workingHours?.toFixed(1) || '0.0'}h
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`text-xs font-semibold ${
                                    record.status === 'PRESENT' ? 'text-green-400' :
                                    record.status === 'LATE' ? 'text-amber-600' :
                                    record.status === 'ABSENT' ? 'text-red-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    {record.status || '—'}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  {record.lateBy > 0 ? (
                                    <span className="text-red-600 font-semibold text-xs">
                                      {record.lateBy}m
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No attendance records found for the last 30 days</p>
                  </div>
                )}
              </div>
            )}

            {/* Corrective Action */}
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Required Corrective Action
                <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.correctiveAction}
                onChange={(e) => handleChange('correctiveAction', e.target.value)}
                rows={3}
                placeholder="What actions must the employee take to address this issue?"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Additional Remarks */}
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Additional Remarks
                <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.additionalRemarks}
                onChange={(e) => handleChange('additionalRemarks', e.target.value)}
                rows={3}
                placeholder="Any additional notes or comments..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Response Required */}
            <div className="bg-background/40 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Response Required <span className="text-red-600">*</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
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
                    formData.responseRequired ? 'bg-blue-600' : 'bg-secondary'
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
                  <label className="block text-sm font-semibold text-card-foreground mb-2">
                    Response Deadline
                    <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={formData.responseDeadline}
                      onChange={(e) => handleChange('responseDeadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 bg-secondary border border-border rounded-xl p-6">
          <button
            onClick={() => router.back()}
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/50 text-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-secondary hover:bg-secondary/70 text-foreground rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-foreground rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
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

export default function CreateHRActionPage() {
  return (
    <Suspense fallback={
      <HRLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    }>
      <CreateHRActionForm />
    </Suspense>
  );
}
