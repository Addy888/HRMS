'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  BookOpen, CheckCircle2, Clock, Search,
  FileText, Star, Calendar, Hash, ExternalLink, Shield
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
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['employee-policies'],
    queryFn: async () => {
      const res = await api.get('/policies/assigned');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: companyPolicies = [] } = useQuery({
    queryKey: ['active-company-policies-employee'],
    queryFn: async () => {
      try {
        const res = await api.get('/company-policies/employee/active');
        const data = res.data?.data || res.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Failed to load company policies:', error);
        return [];
      }
    },
  });

  const acceptCompanyPolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      await api.post(`/company-policies/${policyId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-company-policies-employee'] });
      queryClient.invalidateQueries({ queryKey: ['employee-policies'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to accept company policy');
    },
  });

  const stats = useMemo(() => {
    // ========================================
    // FIX: Include BOTH regular policies AND company policies
    // The progress must count ALL policies shown on the page
    // ========================================
    
    // Count regular policies
    const regularPoliciesTotal = policies.length;
    const regularPoliciesAccepted = policies.filter((p: any) => {
      if (typeof p.accepted === 'boolean') {
        return p.accepted === true;
      }
      if (p.status) {
        return String(p.status).toUpperCase() === 'ACCEPTED';
      }
      return false;
    }).length;
    
    // Count company policies
    const companyPoliciesTotal = companyPolicies.length;
    const companyPoliciesAccepted = companyPolicies.filter((p: any) => {
      // Company policies use 'accepted' boolean field
      return p.accepted === true;
    }).length;
    
    // Combine totals
    const total = regularPoliciesTotal + companyPoliciesTotal;
    const accepted = regularPoliciesAccepted + companyPoliciesAccepted;
    const pending = total - accepted;
    const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const allAccepted = total > 0 && accepted === total;
    
    return { total, accepted, pending, pct, allAccepted };
  }, [policies, companyPolicies]);

  const filtered = useMemo(() => {
    return policies.filter((p: any) => {
      const searchLower = search.toLowerCase();
      const matchSearch = !search || 
        p.title?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.policyNumber?.toLowerCase().includes(searchLower) ||
        `v${p.version}`.toLowerCase().includes(searchLower) ||
        (p.effectiveDate && new Date(p.effectiveDate).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }).toLowerCase().includes(searchLower));
      
      let isAccepted = false;
      if (typeof p.accepted === 'boolean') {
        isAccepted = p.accepted === true;
      } else if (p.status) {
        isAccepted = String(p.status).toUpperCase() === 'ACCEPTED';
      }
      
      const matchFilter = filter === 'ALL' || 
        (filter === 'ACCEPTED' ? isAccepted : !isAccepted);
      
      return matchSearch && matchFilter;
    }).sort((a: any, b: any) => {
      const dateA = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
      const dateB = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [policies, search, filter]);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">Policy Center</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Read and accept all assigned company policies</p>
          </div>
          {stats.allAccepted && (
            <Link href="/employee/acknowledge" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-emerald-950/30">
              <CheckCircle2 className="w-4 h-4" /> Final Sign-Off
            </Link>
          )}
        </div>

        {/* Progress Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-white">Acceptance Progress</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                <span className="text-emerald-400 font-semibold">{stats.accepted}</span> of <span className="text-white font-semibold">{stats.total}</span> policies accepted
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{stats.pct}%</p>
              <p className="text-[10px] text-neutral-500">{stats.pending > 0 ? `${stats.pending} pending` : 'All done!'}</p>
            </div>
          </div>
          <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${stats.allAccepted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          {stats.allAccepted && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 font-medium">All policies accepted! Proceed to the Final Acknowledgement to complete your onboarding.</p>
              <Link href="/employee/acknowledge" className="ml-auto text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 transition-colors">
                Sign Now →
              </Link>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, version, date..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            {(['ALL', 'PENDING', 'ACCEPTED'] as const).map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {f === 'ALL' ? `All (${stats.total})` : f === 'PENDING' ? `Pending (${stats.pending})` : `Accepted (${stats.accepted})`}
              </button>
            ))}
          </div>
        </div>

        {/* Company Policy Cards */}
        {companyPolicies.length > 0 && (
          <div className="space-y-4">
            {companyPolicies.map((companyPolicy: any) => (
              <div 
                key={companyPolicy.id}
                className="bg-gradient-to-br from-purple-950 to-pink-950 border border-purple-800 rounded-2xl p-6 hover:border-purple-700 transition-all"
              >
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
                      {companyPolicy.accepted ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-bold">
                          ✓ ACCEPTED
                        </span>
                      ) : (
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
                      <Link 
                        href={`/company-policies/${companyPolicy.id}/view`} 
                        target="_blank" 
                        className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Policy
                      </Link>
                      {!companyPolicy.accepted && (
                        <button
                          onClick={() => acceptCompanyPolicyMutation.mutate(companyPolicy.id)}
                          disabled={acceptCompanyPolicyMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {acceptCompanyPolicyMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accept Policy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Policy Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : stats.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-500">No policies assigned yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-500">No policies match your search or filter.</p>
            <button 
              onClick={() => {
                setSearch('');
                setFilter('ALL');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((policy: any) => {
              const Icon = CATEGORY_ICONS[policy.category] || FileText;
              
              let isAccepted = false;
              if (typeof policy.accepted === 'boolean') {
                isAccepted = policy.accepted === true;
              } else if (policy.status) {
                isAccepted = String(policy.status).toUpperCase() === 'ACCEPTED';
              }
              
              return (
                <div 
                  key={policy.id}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col gap-3.5 group transition-all hover:shadow-lg hover:shadow-neutral-950/50"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isAccepted 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {isAccepted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      isAccepted 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {isAccepted ? '✓ ACCEPTED' : 'PENDING'}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-800 rounded px-2 py-0.5">
                        {policy.policyNumber}
                      </span>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5">
                        {CATEGORY_LABELS[policy.category] || policy.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug mb-1.5">
                      {policy.title}
                    </h3>
                    {policy.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2">{policy.description}</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" /> v{policy.version}
                      </span>
                      {policy.effectiveDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(policy.effectiveDate).toLocaleDateString('en-US', { 
                              year: 'numeric', month: 'short', day: 'numeric' 
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/employee/policies/${policy.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all text-center"
                      >
                        View Policy
                      </Link>
                      {isAccepted ? (
                        <div className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                        </div>
                      ) : (
                        <Link 
                          href={`/employee/policies/${policy.id}`}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                        >
                          Accept
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
