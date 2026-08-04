'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { EditEmployeeModal } from '@/components/EditEmployeeModal';
import {
  ArrowLeft, User, Mail, Phone, Briefcase, Building2,
  CalendarDays, FileText, Shield, AlertCircle, Edit2,
  UserX, UserCheck, KeyRound, CheckCircle2, Clock
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

const MOCK_EMPLOYEE = {
  id: 'e1',
  employeeId: 'FCS-2026-0001',
  firstName: 'Rahul',
  lastName: 'Sharma',
  phone: '9876543210',
  gender: 'MALE',
  dob: '1995-08-15T00:00:00.000Z',
  address: '123 Tech Park Suite, Bengaluru, KA 560001',
  emergencyContact: 'Amit Sharma: 9988776655',
  joiningDate: '2026-08-01T00:00:00.000Z',
  onboardingStatus: 'PENDING',
  department: { name: 'Engineering' },
  designation: { name: 'Software Engineer' },
  user: { email: 'rahul@fcs.com', isActive: true, createdAt: '2026-08-01T08:00:00.000Z' },
  profile: { profileCompletion: 30 },
  education: [],
  experience: [],
  documents: [
    { id: 'd1', type: 'RESUME', fileName: 'resume.pdf', status: 'PENDING' },
    { id: 'd2', type: 'AADHAAR', fileName: 'aadhaar.pdf', status: 'APPROVED' },
  ],
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = React.useState(false);

  const { data: empResponse, isLoading } = useQuery({
    queryKey: [`employee-${params.id}`],
    queryFn: async () => {
      try {
        const r = await api.get(`/employees/${params.id}`);
        return r.data;
      } catch { return MOCK_EMPLOYEE; }
    }
  });

  const emp = empResponse;

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

  if (!emp) return null;

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
                <h1 className="font-heading text-2xl font-extrabold text-white">{emp.firstName} {emp.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded">{emp.employeeId}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${emp.user?.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                    {emp.user?.isActive ? 'Active' : 'Inactive'}
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
              onClick={() => activationMutation.mutate({ id: emp.id, active: !emp.user?.isActive })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${emp.user?.isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
            >
              {emp.user?.isActive ? <><UserX className="w-4 h-4" /> Deactivate</> : <><UserCheck className="w-4 h-4" /> Activate</>}
            </button>
          </div>
        </div>

        {/* Profile Completion Banner */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-300">Profile Completion</span>
            <span className="font-mono text-sm font-bold text-white">{emp.profile?.profileCompletion || 0}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${emp.profile?.profileCompletion || 0}%`,
                background: (emp.profile?.profileCompletion || 0) === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
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
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={emp.user?.email} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={emp.phone} />
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Address" value={emp.address} />
            <InfoRow icon={<AlertCircle className="w-4 h-4" />} label="Emergency Contact" value={emp.emergencyContact} />
          </div>

          {/* Employment Details */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-1">
            <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-400" /> Employment Details</h3>
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={emp.department?.name} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Designation" value={emp.designation?.name} />
            <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Date of Joining" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Account Created" value={emp.user?.createdAt ? new Date(emp.user.createdAt).toLocaleDateString() : null} />
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Uploaded Documents ({emp.documents?.length || 0})
          </h3>
          {emp.documents?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {emp.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-white">{doc.type.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-[140px]">{doc.fileName}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${docStatusColor[doc.status] || 'text-neutral-400 bg-neutral-800 border-neutral-700'}`}>
                    {doc.status}
                  </span>
                </div>
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
