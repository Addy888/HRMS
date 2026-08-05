'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  HR_ISSUE: 'HR Issue',
  SALARY_ISSUE: 'Salary Issue',
  ATTENDANCE: 'Attendance',
  LEAVE: 'Leave',
  MANAGER: 'Manager Relationship',
  IT_SUPPORT: 'IT Support',
  PAYROLL: 'Payroll Query',
  DOCUMENT_VERIFICATION: 'Documents',
  WORK_ENVIRONMENT: 'Work Environment',
  HARASSMENT: 'Harassment',
  POSH: 'POSH Policy Issue',
  ASSET_ISSUE: 'Asset Allocation',
  SYSTEM_BUG: 'System Bug',
  OTHER: 'Other Concerns',
};

const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
};

const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ASSIGNED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WAITING_FOR_EMPLOYEE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CLOSED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-white mt-2">{value ?? 0}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function EmployeeHelpdeskDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['employee-complaint-stats'],
    queryFn: async () => {
      const res = await api.get('/complaints/dashboard/stats');
      return res.data?.data ?? res.data;
    },
  });

  // Fetch Complaints
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['employee-complaints', search, statusFilter, categoryFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await api.get(`/complaints/my?${params.toString()}`);
      return res.data?.data ?? res.data;
    },
  });

  const complaintsList = complaintsData?.data ?? [];
  const meta = complaintsData?.meta ?? { totalPages: 1, total: 0 };

  return (
    <EmployeeLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-8 h-8 text-blue-500" /> Employee Helpdesk
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Raise support tickets, flag grievances, and communicate directly with HR operations.</p>
          </div>
          <Link
            href="/employee/complaints/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-extrabold text-white transition-all shadow-lg shadow-blue-950/40"
          >
            <Plus className="w-4.5 h-4.5" /> File Complaint
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Open Tickets" value={stats?.open} icon={MessageSquare} color="bg-blue-500/10 text-blue-400" />
          <StatCard title="Waiting Response" value={stats?.pendingReply} icon={Clock} color="bg-amber-500/10 text-amber-400" />
          <StatCard title="Resolved" value={stats?.resolved} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-400" />
          <StatCard title="Closed" value={stats?.closed} icon={XCircle} color="bg-neutral-800 text-neutral-400" />
        </div>

        {/* Filters */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Filter & Search Queue
            </h2>
            {(search || statusFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setCategoryFilter('');
                }}
                className="text-xs text-neutral-500 hover:text-white font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket ID, subject..."
                className="w-full bg-black border border-neutral-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none text-left bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_EMPLOYEE">Waiting for Employee</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none text-left bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Ticket ID</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Subject</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Category</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Priority</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Created Date</th>
                  <th className="text-right text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-neutral-500 text-xs font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        Loading support ticket queue...
                      </div>
                    </td>
                  </tr>
                ) : complaintsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-neutral-550 text-xs">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center">
                          <LifeBuoy className="w-6 h-6 text-neutral-600" />
                        </div>
                        <p className="text-neutral-500">No support tickets found in your list.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  complaintsList.map((item: any) => (
                    <tr key={item.id} className="hover:bg-neutral-800/35 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-neutral-400 font-bold">
                        {item.complaintNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-white leading-normal truncate max-w-xs">{item.title}</p>
                          <p className="text-[10px] text-neutral-550 truncate max-w-xs mt-0.5">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-300">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.LOW}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${STATUS_BADGES[item.status] || STATUS_BADGES.OPEN}`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-450">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/employee/complaints/${item.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-400 hover:text-blue-300"
                        >
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/20">
              <p className="text-[10px] text-neutral-550">
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total tickets)
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 rounded-xl text-[10px] font-bold text-neutral-300"
                >
                  Previous
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 rounded-xl text-[10px] font-bold text-neutral-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
