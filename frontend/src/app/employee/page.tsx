'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  User, Briefcase, Calendar, ShieldCheck,
  CheckCircle2, Clock, FileText, ChevronRight, Sparkles, Building
} from 'lucide-react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';

export default function EmployeeDashboard() {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const isEmployee = Boolean(user && user.role === 'EMPLOYEE');

  // Fetch detailed profile completion
  const { data: profileCompletionResponse, isLoading: loadingCompletion } = useQuery({
    queryKey: ['employee-profile-completion'],
    queryFn: async () => {
      const res = await api.get('/employees/profile/completion');
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(isHydrated && isAuthenticated && isEmployee),
  });

  // Fetch full profile info
  const { data: profileResponse, isLoading: loadingProfile } = useQuery({
    queryKey: ['employee-profile-details'],
    queryFn: async () => {
      const res = await api.get('/employees/profile');
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(isHydrated && isAuthenticated && isEmployee),
  });

  const completion = profileCompletionResponse || { percentage: 0, sections: {} };
  const emp = profileResponse || {};
  const isLoaded = !loadingCompletion && !loadingProfile;

  // Debug log to verify onboarding status
  React.useEffect(() => {
    if (isLoaded && emp.onboardingStatus) {
      console.log('📊 Dashboard loaded. Onboarding Status:', emp.onboardingStatus);
    }
  }, [isLoaded, emp.onboardingStatus]);

  const incompleteSections = Object.entries(completion.sections || {})
    .filter(([_, val]: any) => val.percentage < 100)
    .map(([key, val]: any) => ({ key, ...val }));

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Welcome Card banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/20 border border-neutral-800 rounded-3xl p-8">
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                <Sparkles className="w-3.5 h-3.5" /> Welcome to FCS Portal
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-white">
                Hello, {isLoaded ? `${emp.firstName} ${emp.lastName}` : 'Employee'}
              </h1>
              <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
                Your onboarding progress determines when your setup is finalized. Complete your profile details and submit documents to get verified by HR.
              </p>
            </div>
            <div className="shrink-0 flex gap-4">
              <div className="p-4 bg-neutral-950/80 border border-neutral-850 rounded-2xl text-center min-w-[100px]">
                <div className="text-[10px] text-neutral-500 font-bold uppercase">Status</div>
                <div className="text-xs font-bold text-amber-400 uppercase mt-1">
                  {emp.onboardingStatus?.replace(/_/g, ' ') || 'PENDING'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Progress Dashboard widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Profile Onboarding Completion</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Maintain 100% profile completeness to pass initial verification.</p>
                </div>
                <span className="font-mono text-2xl font-extrabold text-white">{completion.percentage}%</span>
              </div>

              {/* Progress Slider */}
              <div className="h-3 bg-neutral-900 border border-neutral-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>

              {/* Incomplete checklist */}
              {completion.percentage < 100 ? (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pending Action Items</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {incompleteSections.map((sect) => (
                      <Link
                        key={sect.key}
                        href="/employee/profile"
                        className="flex items-center justify-between p-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition-all group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                            Fill {sect.label}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {sect.filled} of {sect.total} fields filled
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400 font-medium">
                    Profile completed! HR will review and update your status.
                  </p>
                </div>
              )}
            </div>

            {/* Employment Details Grid */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-white">Employment Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <User className="w-4 h-4 text-neutral-400" />, label: 'Employee ID', value: emp.employeeId },
                  { icon: <Building className="w-4 h-4 text-neutral-400" />, label: 'Department', value: emp.department?.name },
                  { icon: <Briefcase className="w-4 h-4 text-neutral-400" />, label: 'Designation', value: emp.designation?.name },
                  { icon: <Calendar className="w-4 h-4 text-neutral-400" />, label: 'Date of Joining', value: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-850 rounded-xl">
                    <div className="p-2 bg-neutral-950 rounded-lg">{item.icon}</div>
                    <div>
                      <div className="text-[10px] text-neutral-500 font-semibold uppercase">{item.label}</div>
                      <div className="text-sm text-white font-semibold mt-0.5">{item.value || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar widget - document checklists and reminders */}
          <div className="space-y-6">
            {/* Quick Summary card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-white">Tasks Checklist</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-850 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-neutral-300">Change Password</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Done</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-850 rounded-xl">
                  <div className="flex items-center gap-2">
                    {completion.percentage === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs text-neutral-300">Complete Profile Form</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${completion.percentage === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {completion.percentage === 100 ? 'Done' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-850 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs text-neutral-300">Document Upload</span>
                  </div>
                  <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded font-bold uppercase">Locked</span>
                </div>
              </div>
            </div>

            {/* Quick details */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h3 className="font-heading text-base font-bold text-white mb-2">Onboarding Notice</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Initial document uploads and corporate policies will unlock once your basic profile data is verified. Please verify all sections before submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
