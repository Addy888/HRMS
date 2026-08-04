'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, Search, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'All Accepted', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
  NO_POLICIES: { label: 'No Policies', color: 'text-neutral-400 bg-neutral-700/20 border-neutral-600/20', icon: AlertCircle },
};

export default function PolicyTrackingPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['policy-tracking', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      const res = await api.get(`/policies/tracking?${params}`);
      return res.data?.data ?? res.data;
    },
  });

  const employees: any[] = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">Policy Acceptance Tracking</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Monitor which employees have accepted all assigned policies</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or employee ID…"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          {meta.total ?? '—'} employees total
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                {['Employee', 'ID', 'Department', 'Policies Assigned', 'Accepted', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-neutral-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      Loading tracking data…
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-neutral-500" />
                      </div>
                      <p className="text-sm text-neutral-500">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : employees.map((emp) => {
                const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                const pct = emp.totalAssigned > 0 ? Math.round((emp.acceptedCount / emp.totalAssigned) * 100) : 0;
                return (
                  <tr key={emp.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-xl flex items-center justify-center text-xs font-bold text-blue-300">
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{emp.firstName} {emp.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-neutral-400">{emp.employeeId}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                        {emp.department}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-white font-medium">{emp.acceptedCount} / {emp.totalAssigned}</p>
                        <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-400">{pct}%</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} employees
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="w-8 h-8 bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="w-8 h-8 bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
