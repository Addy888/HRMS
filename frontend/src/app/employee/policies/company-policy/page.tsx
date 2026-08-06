'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import SecurePolicyViewer from '@/components/SecurePolicyViewer';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function EmployeeCompanyPolicyPage() {
  const user = useAuthStore((state) => state.user);
  const employee = user?.employee;

  const { data: policy, isLoading, isError } = useQuery({
    queryKey: ['active-company-policy'],
    queryFn: async () => {
      const response = await api.get('/company-policies/active');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-neutral-400 text-sm">Loading company policy...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (isError || !policy) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-amber-400" />
          <h2 className="font-heading text-xl font-bold text-white">No Company Policy Available</h2>
          <p className="text-sm text-neutral-400">
            No active company policy has been published yet. Please check back later.
          </p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white mb-1">
              {policy.policyName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
              <span>Version {policy.version}</span>
              <span>•</span>
              <span>Published {new Date(policy.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Secure PDF Viewer */}
        {employee && (
          <SecurePolicyViewer
            policyId={policy.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            employeeId={employee.employeeId}
            employeeEmail={user?.email || ''}
          />
        )}
      </div>
    </EmployeeLayout>
  );
}
