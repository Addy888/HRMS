'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  User, Phone, Briefcase, Building, CreditCard, ShieldCheck,
  Edit2, Camera, Trash2, Loader2, Landmark, History, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function EmployeeProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch full profile info
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['employee-profile-details'],
    queryFn: async () => {
      const res = await api.get('/employees/profile');
      return res.data?.data ?? res.data;
    },
  });

  const emp = profileResponse || {};

  // ✅ Fetch own change history
  const { data: changeHistory = [], isLoading: loadingHistory, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['employee-own-change-history', emp.id],
    queryFn: async () => {
      if (!emp.id) return [];
      console.log('[EMPLOYEE-CHANGE-HISTORY] Fetching own history for employee:', emp.id);
      const response = await api.get(`/employees/${emp.id}/change-history`);
      console.log('[EMPLOYEE-CHANGE-HISTORY] API Response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!emp.id,
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/employees/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile-details'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to upload photo'),
  });

  // Photo delete mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/employees/profile/photo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile-details'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to delete photo'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const [activeTab, setActiveTab] = React.useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Info', icon: <Phone className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional Info', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'bank', label: 'Bank Details', icon: <Landmark className="w-4 h-4" /> },
    { id: 'government', label: 'Government details', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'history', label: 'Change History', icon: <History className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-secondary rounded-3xl"></div>
          <div className="h-8 w-64 bg-secondary rounded-xl"></div>
          <div className="h-64 bg-secondary rounded-3xl"></div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Banner with Profile Picture */}
        <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-border overflow-hidden flex items-center justify-center font-heading text-3xl font-extrabold text-foreground uppercase shadow-xl relative">
              {emp.photoUrl ? (
                <img
                  src={`${api.defaults.baseURL?.replace('/api/v1', '')}${emp.photoUrl}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                `${emp.firstName?.charAt(0)}${emp.lastName?.charAt(0)}`
              )}
              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg shadow-lg border border-blue-500/30 transition-colors"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {emp.photoUrl && (
                <button
                  onClick={() => { if (confirm('Delete photo?')) deletePhotoMutation.mutate(); }}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-foreground rounded-lg shadow-lg border border-red-500/30 transition-colors"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <h1 className="font-heading text-2xl font-extrabold text-foreground truncate">{emp.firstName} {emp.lastName}</h1>
            <p className="text-xs text-muted-foreground font-mono font-medium">{emp.employeeId} · {emp.designation?.name || 'Designation Pending'}</p>
            <p className="text-xs text-muted-foreground">{emp.department?.name || 'Department Pending'}</p>
          </div>

          <Link
            href="/employee/profile/edit"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground rounded-xl text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile Details
          </Link>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-border overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'First Name', val: emp.firstName },
                { label: 'Last Name', val: emp.lastName },
                { label: "Father's Name", val: emp.fatherName },
                { label: "Mother's Name", val: emp.motherName },
                { label: 'Date of Birth', val: emp.dob ? new Date(emp.dob).toLocaleDateString() : '' },
                { label: 'Gender', val: emp.gender },
                { label: 'Blood Group', val: emp.bloodGroup },
                { label: 'Marital Status', val: emp.maritalStatus },
                { label: 'Nationality', val: emp.nationality },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Mobile Number', val: emp.phone },
                { label: 'Alternate Mobile Number', val: emp.alternatePhone },
                { label: 'Personal Email', val: emp.personalEmail },
                { label: 'Permanent Address', val: emp.permanentAddress },
                { label: 'Current Address', val: emp.currentAddress },
                { label: 'Emergency Contact Name', val: emp.emergencyContactName },
                { label: 'Emergency Contact Number', val: emp.emergencyContactPhone },
                { label: 'Emergency Contact Relation', val: emp.emergencyContactRelation },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Employee ID', val: emp.employeeId },
                { label: 'Department', val: emp.department?.name },
                { label: 'Designation', val: emp.designation?.name },
                { label: 'Reporting Manager', val: emp.reportingManager },
                { label: 'Employment Type', val: emp.employmentType },
                { label: 'Joining Date', val: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '' },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Account Holder Name', val: emp.bankAccountHolder },
                { label: 'Bank Name', val: emp.bankName },
                { label: 'Branch Name', val: emp.bankBranch },
                { label: 'Account Number', val: emp.bankAccountNumber },
                { label: 'IFSC Code', val: emp.bankIfsc },
                { label: 'UPI ID', val: emp.upiId },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'government' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Aadhaar Number', val: emp.aadhaarNumber },
                { label: 'PAN Card Number', val: emp.panNumber },
                { label: 'Passport Number', val: emp.passportNumber },
                { label: 'Driving License Number', val: emp.drivingLicenseNumber },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ NEW: Change History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Your Profile Change History</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    View all updates made to your employee profile
                  </p>
                </div>
                {changeHistory.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">{changeHistory.length}</span> {changeHistory.length === 1 ? 'update' : 'updates'}
                    </span>
                    <button
                      onClick={() => refetchHistory()}
                      className="text-xs text-blue-600 hover:text-blue-500 font-semibold transition-colors"
                      title="Refresh history"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingHistory && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">Loading your change history...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!loadingHistory && historyError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                  <p className="text-sm text-red-600 font-semibold mb-2">Failed to load change history</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {historyError instanceof Error ? historyError.message : 'Unable to fetch change history'}
                  </p>
                  <button
                    onClick={() => refetchHistory()}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-sm font-semibold transition-colors border border-red-500/20"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loadingHistory && !historyError && changeHistory.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No Changes Recorded</p>
                  <p className="text-xs text-muted-foreground">
                    No changes have been recorded for your profile yet.
                  </p>
                </div>
              )}

              {/* Change History Timeline */}
              {!loadingHistory && !historyError && changeHistory.length > 0 && (
                <div className="space-y-3 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-border"></div>

                  {changeHistory.map((record: any) => {
                    const changes = typeof record.changes === 'string' ? JSON.parse(record.changes) : record.changes;
                    const changesArray = Object.entries(changes || {});
                    
                    return (
                      <div key={record.id} className="relative pl-10">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border-4 border-card flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>

                        {/* Change Card */}
                        <div className="bg-secondary border border-border rounded-xl p-4 space-y-3 hover:border-purple-500/30 transition-colors">
                          {/* Header: Date, Time, User */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-foreground">
                                  {new Date(record.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm font-semibold text-purple-600">
                                  {new Date(record.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">Updated by:</span>
                                <span className="text-xs font-semibold text-foreground">{record.updatedByName}</span>
                                <span className="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 border border-blue-500/20">
                                  {record.updatedByRole}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="pt-2 border-t border-border">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Reason:</span>
                              <p className="text-sm text-foreground font-medium leading-relaxed">{record.reason}</p>
                            </div>
                          </div>

                          {/* Changed Fields */}
                          {changesArray.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Changed Fields ({changesArray.length})
                              </div>
                              <div className="space-y-2.5">
                                {changesArray.map(([field, values]: [string, any]) => {
                                  // Format field name
                                  const fieldLabel = field
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                    .trim();

                                  // Handle null/empty values
                                  const oldValue = values.old === null || values.old === undefined || values.old === '' 
                                    ? 'Not Set' 
                                    : String(values.old);
                                  const newValue = values.new === null || values.new === undefined || values.new === '' 
                                    ? 'Not Set' 
                                    : String(values.new);

                                  return (
                                    <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-card p-3 rounded-lg border border-border">
                                      <span className="text-xs font-bold text-foreground min-w-[140px] uppercase tracking-wider">
                                        {fieldLabel}
                                      </span>
                                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20 flex-1 min-w-0">
                                          <span className="text-[10px] font-bold text-red-600 uppercase shrink-0">Old:</span>
                                          <span className="text-xs text-red-600 font-semibold truncate">{oldValue}</span>
                                        </div>
                                        <span className="text-muted-foreground shrink-0">→</span>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex-1 min-w-0">
                                          <span className="text-[10px] font-bold text-emerald-600 uppercase shrink-0">New:</span>
                                          <span className="text-xs text-emerald-600 font-semibold truncate">{newValue}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
