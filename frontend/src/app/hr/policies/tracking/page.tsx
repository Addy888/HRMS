'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, Search, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'All Accepted', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  NO_POLICIES: { label: 'No Policies', color: 'text-muted-foreground bg-secondary/20 border-neutral-600/20', icon: AlertCircle },
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
    <div className="min-h-screen bg-card p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Policy Acceptance Tracking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor which employees have accepted all assigned policies</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or employee ID…"
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-neutral-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {meta.total ?? '—'} employees total
        </div>
      </div>

      {/* Table */}
      <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Employee', 'ID', 'Department', 'Policies Assigned', 'Accepted', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
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
                      <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : employees.map((emp) => {
                const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                const pct = emp.totalAssigned > 0 ? Math.round((emp.acceptedCount / emp.totalAssigned) * 100) : 0;
                return (
                  <tr key={emp.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-xl flex items-center justify-center text-xs font-bold text-blue-300">
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{emp.firstName} {emp.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-muted-foreground">{emp.employeeId}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {emp.department}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-foreground font-medium">{emp.acceptedCount} / {emp.totalAssigned}</p>
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{pct}%</td>
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} employees
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="w-8 h-8 bg-secondary disabled:opacity-40 hover:bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="w-8 h-8 bg-secondary disabled:opacity-40 hover:bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
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
