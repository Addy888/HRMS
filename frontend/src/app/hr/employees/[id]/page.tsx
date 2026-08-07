'use client';

console.log("🔴 PAGE FILE EXECUTED - MODULE LEVEL");

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { EditEmployeeModal } from '@/components/EditEmployeeModal';
import {
  ArrowLeft, User, Mail, Phone, Briefcase, Building2,
  CalendarDays, FileText, Shield, AlertCircle, Edit2,
  UserX, UserCheck, KeyRound, CheckCircle2, Clock, Eye,
  Check, X, Download
} from 'lucide-react';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 py-3 border-b border-neutral-800/50 last:border-0">
    <div className="text-neutral-500 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm text-white font-medium mt-0.5 truncate">{value || '—'}</div>
    </div>
  </div>
);

// Document Card Component with Verification Actions
function DocumentCard({ doc, onRefresh }: { doc: any; onRefresh: () => void }) {
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  const docStatusColor: Record<string, string> = {
    APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
    PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const approveMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post(`/documents/${docId}/verify`, {
        action: 'APPROVE',
        comment: 'Approved by HR',
      });
    },
    onSuccess: () => {
      onRefresh();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      await api.post(`/documents/${docId}/verify`, {
        action: 'REJECT',
        comment: reason,
      });
    },
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectionReason('');
      onRefresh();
    },
  });

  const handleView = () => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const handleApprove = () => {
    if (confirm(`Approve ${doc.type.replace(/_/g, ' ')} document?`)) {
      approveMutation.mutate(doc.id);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    rejectMutation.mutate({ docId: doc.id, reason: rejectionReason });
  };

  return (
    <>
      <div className="flex flex-col p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">{doc.type.replace(/_/g, ' ')}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{doc.fileName}</div>
            {doc.verification?.rejectionReason && (
              <div className="text-[10px] text-red-400 mt-1 italic">Reason: {doc.verification.rejectionReason}</div>
            )}
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${docStatusColor[doc.status] || 'text-neutral-400 bg-neutral-800 border-neutral-700'}`}>
            {doc.status}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={handleView}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] font-semibold transition-colors"
            title="View Document"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>

          {doc.status !== 'APPROVED' && (
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 border border-emerald-500/20"
              title="Approve Document"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>
          )}

          {doc.status !== 'REJECTED' && (
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={rejectMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 border border-red-500/20"
              title="Reject Document"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white">Reject Document</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-neutral-400">
              Document: <span className="font-semibold text-white">{doc.type.replace(/_/g, ' ')}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Image is blurred, Document is expired, etc."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 border border-red-500/20"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = React.useState(false);

  console.log("========== COMPONENT RENDER ==========");
  console.log("params:", params);
  console.log("params.id:", params.id);
  console.log("typeof params.id:", typeof params.id);
  console.log("!!params.id:", !!params.id);
  console.log("params.id is string?", typeof params.id === 'string');
  console.log("params.id is array?", Array.isArray(params.id));
  console.log("======================================");

  const employeeId = Array.isArray(params.id) ? params.id[0] : params.id;
  console.log("employeeId after processing:", employeeId);

  const { data: empResponse, isLoading, error, status, fetchStatus } = useQuery({
    queryKey: [`employee`, employeeId],
    queryFn: async () => {
      console.log("🟢 QUERY FN STARTED - INSIDE FUNCTION");
      console.log("========== QUERY FUNCTION STARTED ==========");
      console.log("Query is executing with ID:", employeeId);
      
      console.log("Making axios request...");
      console.log("🔵 ABOUT TO CALL api.get");
      const response = await api.get(`/employees/${employeeId}`);
      console.log("🟢 api.get RETURNED");
      console.log("Axios request completed!");
      
      console.log("========== RAW RESPONSE ==========");
      console.log("response:", response);
      console.log("response.data:", response.data);
      console.log("response.data.data (employee):", response.data.data);
      console.log("JSON.stringify(response.data):", JSON.stringify(response.data, null, 2));
      console.log("typeof response.data:", typeof response.data);
      console.log("Object.keys(response.data):", Object.keys(response.data || {}));
      console.log("response.data.data.firstName:", response.data?.data?.firstName);
      console.log("==================================");
      
      return response.data.data;
    },
    enabled: !!employeeId && typeof employeeId === 'string',
  });

  console.log("========== REACT QUERY STATE ==========");
  console.log("status:", status);
  console.log("fetchStatus:", fetchStatus);
  console.log("isLoading:", isLoading);
  console.log("error:", error);
  console.log("empResponse:", empResponse);
  console.log("typeof empResponse:", typeof empResponse);
  console.log("=======================================");

  const emp = empResponse;
  
  console.log("========== AFTER ASSIGNMENT ==========");
  console.log("EMP =", emp);
  console.log("typeof emp:", typeof emp);
  console.log("emp === undefined?", emp === undefined);
  console.log("emp === null?", emp === null);
  console.log("emp?.firstName:", emp?.firstName);
  console.log("======================================");

  if (error) {
    return (
      <HRLayout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Failed to Load Employee</h2>
            <p className="text-sm text-neutral-400 mb-4">
              {error instanceof Error ? error.message : 'Unable to fetch employee details. Please try again.'}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Back to Employees
            </button>
          </div>
        </div>
      </HRLayout>
    );
  }

  const activationMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post(`/employees/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`employee-${params.id}`] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/employees/${id}/reset-password`),
    onSuccess: () => alert('Password reset to 1234. Employee will be prompted to change it on next login.'),
  });

  const docStatusColor: Record<string, string> = {
    APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
    PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  if (isLoading) {
    console.log('⏳ Page is LOADING, empResponse is:', empResponse);
    return (
      <HRLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-neutral-900 rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-neutral-900 rounded-2xl"></div>)}
          </div>
        </div>
      </HRLayout>
    );
  }

  if (!emp) {
    console.log('❌ emp is null/undefined, empResponse was:', empResponse);
    console.log('❌ This should not happen if API returned data');
    return null;
  }

  console.log('✅ RENDERING PAGE with emp:', emp);
  console.log('✅ emp.firstName:', emp.firstName);
  console.log('✅ emp.fullName:', emp.fullName);

  return (
    <HRLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-3 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Employees
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-heading text-xl font-bold text-white uppercase">
                {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-white">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded">{emp.employeeId}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${emp.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-sm font-semibold transition-colors border border-neutral-700"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => { if (confirm('Reset password to 1234?')) resetPasswordMutation.mutate(emp.id); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-sm font-semibold transition-colors border border-amber-500/20"
            >
              <KeyRound className="w-4 h-4" /> Reset Password
            </button>
            <button
              onClick={() => activationMutation.mutate({ id: emp.id, active: !emp.isActive })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${emp.isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
            >
              {emp.isActive ? <><UserX className="w-4 h-4" /> Deactivate</> : <><UserCheck className="w-4 h-4" /> Activate</>}
            </button>
          </div>
        </div>

        {/* Profile Completion Banner */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-300">Profile Completion</span>
            <span className="font-mono text-sm font-bold text-white">{emp.profileCompletion || 0}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${emp.profileCompletion || 0}%`,
                background: (emp.profileCompletion || 0) === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }}
            />
          </div>
        </div>

        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-1">
            <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> Basic Information</h3>
            <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={`${emp.firstName} ${emp.lastName}`} />
            <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Date of Birth" value={emp.dob ? new Date(emp.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            <InfoRow icon={<User className="w-4 h-4" />} label="Gender" value={emp.gender} />
            <InfoRow icon={<Shield className="w-4 h-4" />} label="Blood Group" value={emp.bloodGroup} />
          </div>

          {/* Contact Information */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-1">
            <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-teal-400" /> Contact Details</h3>
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={emp.email} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={emp.phone} />
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Address" value={emp.address} />
            <InfoRow icon={<AlertCircle className="w-4 h-4" />} label="Emergency Contact" value={emp.emergencyContact} />
          </div>

          {/* Employment Details */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-1">
            <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-400" /> Employment Details</h3>
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={emp.departmentName} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Designation" value={emp.designationTitle} />
            <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Date of Joining" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Account Created" value={emp.user?.createdAt ? new Date(emp.user.createdAt).toLocaleDateString() : null} />
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Uploaded Documents
            </h3>
            {emp.documents?.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white">{emp.documents.length}</span>
                  <span className="text-neutral-500">Total</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-400">{emp.documents.filter((d: any) => d.status === 'APPROVED').length}</span>
                  <span className="text-neutral-500">Approved</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-400">{emp.documents.filter((d: any) => d.status === 'PENDING').length}</span>
                  <span className="text-neutral-500">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-red-400">{emp.documents.filter((d: any) => d.status === 'REJECTED').length}</span>
                  <span className="text-neutral-500">Rejected</span>
                </div>
              </div>
            )}
          </div>
          {emp.documents?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {emp.documents.map((doc: any) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-sm">No documents uploaded yet.</div>
          )}
        </div>
      </div>

      {showEdit && emp && (
        <EditEmployeeModal employee={emp} isOpen={showEdit} onClose={() => setShowEdit(false)} />
      )}
    </HRLayout>
  );
}
