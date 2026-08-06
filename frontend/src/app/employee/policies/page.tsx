'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen, CheckCircle2, Clock, Search, Filter, ChevronRight,
  Shield, AlertCircle, FileText, Star
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  ATTENDANCE: 'Attendance', LEAVE: 'Leave', CODE_OF_CONDUCT: 'Code of Conduct',
  POSH: 'POSH', DATA_PRIVACY: 'Data Privacy', INFO_SEC: 'Info Security',
  IT_USAGE: 'IT Usage', CONFIDENTIALITY: 'Confidentiality', NDA: 'NDA',
  REMOTE_WORK: 'Remote Work', LAPTOP_ASSET: 'Laptop & Asset', INTERNET_USAGE: 'Internet Usage',
  HANDBOOK: 'Employee Handbook', TRAVEL: 'Travel', MEDICAL: 'Medical', CUSTOM: 'Custom',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  POSH: Shield, NDA: Shield, CONFIDENTIALITY: Shield,
  HANDBOOK: BookOpen, CODE_OF_CONDUCT: Star,
};

export default function EmployeePoliciesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['employee-policies'],
    queryFn: async () => {
      const res = await api.get('/policies/assigned');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: companyPolicy } = useQuery({
    queryKey: ['active-company-policy-employee'],
    queryFn: async () => {
      try {
        const res = await api.get('/company-policies/employee/active');
        // Ensure we return the data correctly, handle nested structure
        const data = res.data?.data || res.data;
        console.log('Company Policy Data:', data); // Debug log
        return data;
      } catch (error) {
        console.error('Failed to load company policy:', error);
        return null;
      }
    },
  });

  const filtered = policies.filter((p: any) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search.toUpperCase());
    const matchFilter = filter === 'ALL' || (filter === 'ACCEPTED' ? p.accepted : !p.accepted);
    return matchSearch && matchFilter;
  });

  const total = policies.length;
  const accepted = policies.filter((p: any) => p.accepted).length;
  const pending = total - accepted;
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const allAccepted = total > 0 && accepted === total;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Policy Center</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Read and accept all assigned company policies</p>
        </div>
        {allAccepted && (
          <Link href="/employee/acknowledge" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-emerald-950/30">
            <CheckCircle2 className="w-4 h-4" /> Final Sign-Off
          </Link>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-white">Acceptance Progress</p>
            <p className="text-xs text-neutral-500 mt-0.5">{accepted} of {total} policies accepted</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{pct}%</p>
            <p className="text-[10px] text-neutral-500">{pending > 0 ? `${pending} pending` : 'All done!'}</p>
          </div>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allAccepted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {allAccepted && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">All policies accepted! Proceed to the Final Acknowledgement to complete your onboarding.</p>
            <Link href="/employee/acknowledge" className="ml-auto text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0">
              Sign Now →
            </Link>
          </div>
        )}
      </div>

      {/* Company Policy Card */}
      {companyPolicy && (
        <div className="block bg-gradient-to-br from-purple-950 to-pink-950 border border-purple-800 rounded-2xl p-6 relative">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-bold text-white">{companyPolicy.policyName}</h3>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-bold">
                  COMPANY POLICY
                </span>
                {companyPolicy.accepted && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-bold">
                    ✓ ACCEPTED
                  </span>
                )}
                {!companyPolicy.accepted && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300/80 mb-3">
                Official company policy document. Please review and accept.
              </p>
              <div className="flex items-center gap-3 text-xs text-purple-400 flex-wrap">
                <span>Version {companyPolicy.version || '1.0'}</span>
                <span>•</span>
                <span>
                  Uploaded: {companyPolicy.uploadedAt 
                    ? new Date(companyPolicy.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A'}
                </span>
                {companyPolicy.accepted && companyPolicy.acceptedAt && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">
                      Accepted: {new Date(companyPolicy.acceptedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Link href={`/company-policies/${companyPolicy.id}/view`} target="_blank" className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition-colors">
                  View Policy
                </Link>
                {!companyPolicy.accepted && (
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/company-policies/${companyPolicy.id}/accept`);
                        alert('Company policy accepted successfully!');
                        window.location.reload();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to accept policy');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Accept Policy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies…"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
          {(['ALL', 'PENDING', 'ACCEPTED'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
            >
              {f === 'ALL' ? `All (${total})` : f === 'PENDING' ? `Pending (${pending})` : `Accepted (${accepted})`}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-500">
            {search || filter !== 'ALL' ? 'No policies match your search or filter.' : 'No policies assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((policy: any) => {
            const Icon = CATEGORY_ICONS[policy.category] || FileText;
            return (
              <Link href={`/employee/policies/${policy.id}`} key={policy.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-blue-500/40 rounded-2xl p-5 flex flex-col gap-3 group transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${policy.accepted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {policy.accepted ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Icon className="w-4.5 h-4.5" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${policy.accepted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {policy.accepted ? 'ACCEPTED' : 'PENDING'}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] text-neutral-500 font-semibold">{policy.policyNumber} · {CATEGORY_LABELS[policy.category] || policy.category}</p>
                  <h3 className="text-sm font-bold text-white mt-0.5 leading-snug">{policy.title}</h3>
                  {policy.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{policy.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                  <div className="text-[10px] text-neutral-600">
                    {policy.accepted ? (
                      <span className="text-emerald-500">✓ Accepted v{policy.versionAccepted}</span>
                    ) : (
                      <span>Version {policy.version} · Must Accept</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 group-hover:text-blue-300">
                    {policy.accepted ? 'Review' : 'Read & Accept'} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
