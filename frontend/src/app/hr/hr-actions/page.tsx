'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  AlertTriangle, Plus, Search, Filter, Eye, CheckCircle2,
  Clock, XCircle, MessageSquare, FileText, Loader2,
  ChevronLeft, ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react';

const STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-neutral-500/10 text-neutral-400' },
  { value: 'ISSUED', label: 'Issued', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'SENT', label: 'Sent', color: 'bg-purple-500/10 text-purple-400' },
  { value: 'VIEWED', label: 'Viewed', color: 'bg-cyan-500/10 text-cyan-400' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged', color: 'bg-indigo-500/10 text-indigo-400' },
  { value: 'RESPONSE_PENDING', label: 'Response Pending', color: 'bg-amber-500/10 text-amber-400' },
  { value: 'RESPONSE_SUBMITTED', label: 'Response Submitted', color: 'bg-emerald-500/10 text-emerald-400' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500/10 text-green-400' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/10 text-red-400' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const ACTION_TYPES = [
  'LATE_LOGIN_WARNING',
  'ATTENDANCE_WARNING',
  'UNAUTHORIZED_ABSENCE',
  'LEAVE_VIOLATION',
  'POLICY_VIOLATION',
  'MISCONDUCT',
  'PERFORMANCE_WARNING',
  'REPEATED_LATE_LOGIN',
  'SHOW_CAUSE_NOTICE',
  'FINAL_WARNING',
  'GENERAL_WARNING',
  'CUSTOM_NOTICE',
];

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUSES.find(s => s.value === status);
  return (
    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${config?.color || 'bg-neutral-500/10 text-neutral-400'}`}>
      {config?.label || status}
    </span>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const config = SEVERITIES.find(s => s.value === severity);
  return (
    <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${config?.bg || 'bg-neutral-500/10'} ${config?.color || 'text-neutral-400'} border-neutral-700`}>
      {config?.label || severity}
    </span>
  );
};

export default function HRActionsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    actionType: '',
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['hr-actions-statistics'],
    queryFn: async () => {
      const res = await api.get('/hr-actions/statistics');
      return res.data;
    },
  });

  // Fetch HR actions
  const { data, isLoading } = useQuery({
    queryKey: ['hr-actions', search, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.actionType) params.append('actionType', filters.actionType);
      
      const res = await api.get(`/hr-actions?${params.toString()}`);
      return res.data;
    },
  });

  const actions = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
              HR Actions & Disciplinary Records
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage employee warnings, notices, and disciplinary actions
            </p>
          </div>
          <Link
            href="/hr/employees"
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Send HR Action
          </Link>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-neutral-800 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-neutral-800 rounded w-1/3"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-400 uppercase">Total Actions</span>
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/0 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Pending Response</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {(stats?.byStatus?.RESPONSE_PENDING || 0) + (stats?.byStatus?.SENT || 0)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase">Acknowledged</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats?.byStatus?.ACKNOWLEDGED || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-red-500/5 to-red-500/0 border border-red-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-400 uppercase">High/Critical</span>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {(stats?.bySeverity?.HIGH || 0) + (stats?.bySeverity?.CRITICAL || 0)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actions..."
                  className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.actionType}
              onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {ACTION_TYPES.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* HR Actions Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/40 border-b border-neutral-800 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="px-5 py-4 text-left">Action No.</th>
                  <th className="px-5 py-4 text-left">Employee</th>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Severity</th>
                  <th className="px-5 py-4 text-left">Subject</th>
                  <th className="px-5 py-4 text-left">Date</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-neutral-800 animate-pulse rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : actions.length > 0 ? (
                  actions.map((action: any) => (
                    <tr key={action.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-sm font-bold text-blue-400">{action.actionNumber}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-white">
                          {action.employee?.firstName} {action.employee?.lastName}
                        </div>
                        <div className="text-xs text-neutral-500">{action.employee?.employeeId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-neutral-300">
                          {action.actionType?.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <SeverityBadge severity={action.severity} />
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-sm text-neutral-300 truncate">{action.subject}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-neutral-400">
                          {new Date(action.incidentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/hr/hr-actions/${action.id}`}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-blue-400 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <AlertTriangle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-500 font-semibold">No HR actions found</p>
                      <p className="text-xs text-neutral-600 mt-1">Create your first HR action to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-4">
              <span className="text-xs text-neutral-500 font-medium">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, meta.total)} of {meta.total} actions
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-black hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400 font-semibold px-2">Page {page} of {meta.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg bg-black hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
}
