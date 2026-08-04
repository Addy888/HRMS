'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, MoreVertical, Eye, Edit2, Trash2,
  CheckCircle2, Archive, Send, Globe, Loader2, BarChart2, Users,
  BookOpen, AlertCircle, ChevronRight, Copy
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  ATTENDANCE: 'Attendance', LEAVE: 'Leave', CODE_OF_CONDUCT: 'Code of Conduct',
  POSH: 'POSH', DATA_PRIVACY: 'Data Privacy', INFO_SEC: 'Info Security',
  IT_USAGE: 'IT Usage', CONFIDENTIALITY: 'Confidentiality', NDA: 'NDA',
  REMOTE_WORK: 'Remote Work', LAPTOP_ASSET: 'Laptop & Asset', INTERNET_USAGE: 'Internet Usage',
  HANDBOOK: 'Handbook', TRAVEL: 'Travel', MEDICAL: 'Medical', CUSTOM: 'Custom',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ARCHIVED: 'bg-neutral-600/20 text-neutral-400 border-neutral-600/20',
};

function MetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function HRPoliciesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data: dashboard } = useQuery({
    queryKey: ['hr-policy-dashboard'],
    queryFn: async () => {
      const res = await api.get('/policies/dashboard');
      return res.data?.data ?? res.data;
    },
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['hr-policies'],
    queryFn: async () => {
      const res = await api.get('/policies/dashboard');
      // Fallback to empty array — for now list pulls from individual management route
      return [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.post(`/policies/${id}/status`, { status });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-policy-dashboard'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/policies/${id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-policy-dashboard'] }); },
  });

  const metrics = dashboard?.metrics || {};

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Policy Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage company policies and track employee acceptance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hr/policies/tracking" className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 transition-colors">
            <BarChart2 className="w-4 h-4" /> Tracking
          </Link>
          <Link href="/hr/policies/create" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-blue-950/30">
            <Plus className="w-4 h-4" /> New Policy
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard icon={FileText} label="Total Policies" value={metrics.total} color="bg-blue-500/10 text-blue-400" />
        <MetricCard icon={Globe} label="Published" value={metrics.published} color="bg-emerald-500/10 text-emerald-400" />
        <MetricCard icon={Edit2} label="Drafts" value={metrics.draft} color="bg-amber-500/10 text-amber-400" />
        <MetricCard icon={Archive} label="Archived" value={metrics.archived} color="bg-neutral-600/20 text-neutral-400" />
        <MetricCard icon={AlertCircle} label="Emp. Pending" value={metrics.employeesPending} color="bg-red-500/10 text-red-400" />
        <MetricCard icon={CheckCircle2} label="Emp. Completed" value={metrics.employeesCompleted} color="bg-purple-500/10 text-purple-400" />
      </div>

      {/* Recent Audit Logs */}
      {dashboard?.recentLogs?.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Recent Activity
          </h2>
          <div className="space-y-2">
            {dashboard.recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-xs text-white font-medium">{log.policy?.title}</p>
                    <p className="text-[10px] text-neutral-500">{log.action} · {log.details}</p>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-600">
                  {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/hr/policies/create" className="bg-neutral-900 border border-neutral-800 hover:border-blue-500/40 rounded-2xl p-5 group transition-all">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-3">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Create New Policy</h3>
          <p className="text-xs text-neutral-500 mt-1">Draft a new company policy with rich content editor</p>
          <div className="flex items-center gap-1 text-xs text-blue-400 mt-3 font-semibold group-hover:translate-x-0.5 transition-transform">
            Get started <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        <Link href="/hr/policies/tracking" className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-5 group transition-all">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Employee Tracking</h3>
          <p className="text-xs text-neutral-500 mt-1">Monitor policy acceptance status across all employees</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-3 font-semibold group-hover:translate-x-0.5 transition-transform">
            View Report <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-3">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Policy Summary</h3>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Total Published', val: metrics.published ?? '—', color: 'text-emerald-400' },
              { label: 'Pending Acceptance', val: metrics.employeesPending ?? '—', color: 'text-amber-400' },
              { label: 'All Completed', val: metrics.employeesCompleted ?? '—', color: 'text-blue-400' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-[11px] text-neutral-500">{item.label}</span>
                <span className={`text-xs font-bold ${item.color}`}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
