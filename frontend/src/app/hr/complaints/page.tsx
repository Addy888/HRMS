'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import HRLayout from '@/layouts/HRLayout';
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Loader2,
  Users,
  Building,
  TrendingUp
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
  LOW: 'bg-neutral-800 text-neutral-455 border-neutral-700',
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

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1.5">{value ?? 0}</p>
        {subtitle && <p className="text-[10px] text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function HRHelpdeskQueue() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [page, setPage] = useState(1);

  // Fetch HR Stats
  const { data: stats } = useQuery({
    queryKey: ['hr-complaint-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/complaints/dashboard/stats');
      return res.data.data;
    },
  });

  // Fetch HR Team (for assignment filter dropdown)
  const { data: hrTeam = [] } = useQuery({
    queryKey: ['hr-employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=50&onboardingStatus=VERIFIED');
      const list = res.data?.data ?? res.data ?? [];
      const array = Array.isArray(list) ? list : list.data ?? [];
      return array;
    },
  });

  // Fetch Complaints List
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['hr-complaints-queue', search, statusFilter, priorityFilter, categoryFilter, assignedToId, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search && search.trim()) params.set('search', search);
      if (statusFilter && statusFilter.trim()) params.set('status', statusFilter);
      if (priorityFilter && priorityFilter.trim()) params.set('priority', priorityFilter);
      if (categoryFilter && categoryFilter.trim()) params.set('category', categoryFilter);
      if (assignedToId && assignedToId.trim()) params.set('assignedToId', assignedToId);

      console.log('[HELPDESK] Fetching complaints with params:', params.toString());
      const res = await api.get(`/admin/complaints?${params.toString()}`);
      console.log('[HELPDESK] API Response:', res.data);
      console.log('[HELPDESK] Response data type:', typeof res.data);
      console.log('[HELPDESK] Response data keys:', res.data ? Object.keys(res.data) : 'null');
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        console.log('[HELPDESK] Tickets array length:', res.data.data.length);
        res.data.data.forEach((ticket: any, index: number) => {
          console.log(`[HELPDESK] Ticket ${index + 1}:`, {
            ticketNumber: ticket.complaintNumber,
            raisedByName: ticket.raisedByName,
            raisedByEmployeeId: ticket.raisedByEmployeeId,
            anonymous: ticket.anonymous,
            department: ticket.department,
            hasRaisedBy: !!ticket.raisedBy,
          });
        });
      }
      
      return res.data;
    },
  });

  const queueList = queueData?.data ?? [];
  const meta = queueData?.meta ?? { totalPages: 1, total: 0 };

  console.log('[HELPDESK] Final queueList:', queueList);
  console.log('[HELPDESK] Queue list length:', queueList.length);

  const formatResolutionTime = (minutes: number) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  return (
    <HRLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-blue-500" /> Helpdesk Tickets Queue
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track, assign, reply and resolve support tickets and grievances filed by employees.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Open Tickets" value={stats?.open} icon={MessageSquare} color="bg-blue-500/10 text-blue-400" subtitle={`${stats?.highPriority || 0} High Priority`} />
          <StatCard title="In Progress" value={stats?.inProgress} icon={Clock} color="bg-indigo-500/10 text-indigo-400" subtitle={`${stats?.critical || 0} Critical`} />
          <StatCard title="Resolved Cases" value={stats?.resolved} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-400" subtitle="Ready for closure" />
          <StatCard
            title="Avg Resolution Time"
            value={formatResolutionTime(stats?.averageResolutionTime)}
            icon={TrendingUp}
            color="bg-purple-500/10 text-purple-400"
            subtitle="From submission to resolution"
          />
        </div>

        {/* Filters */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Advanced Filters
            </h2>
            {(search || statusFilter || priorityFilter || categoryFilter || assignedToId) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setCategoryFilter('');
                  setAssignedToId('');
                }}
                className="text-xs text-neutral-500 hover:text-white font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket #, employee ID, name..."
                className="w-full bg-black border border-neutral-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
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

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
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

        {/* Complaints Table Queue */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Ticket</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Raised By</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Department</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Category</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Priority</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Assignee</th>
                  <th className="text-right text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-neutral-550 text-xs font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        Loading complaints queue...
                      </div>
                    </td>
                  </tr>
                ) : queueList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-neutral-550 text-xs">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center">
                          <LifeBuoy className="w-6 h-6 text-neutral-600" />
                        </div>
                        <p className="text-neutral-500">No support tickets match the selected filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queueList.map((item: any) => (
                    <tr key={item.id} className="hover:bg-neutral-800/35 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-white">{item.title}</p>
                          <p className="text-[9px] font-mono text-neutral-550 font-bold mt-0.5">{item.complaintNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-neutral-200">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {item.raisedByName || 'Unknown'}
                            {item.anonymous && (
                              <span className="text-[8px] bg-neutral-800 text-neutral-500 border border-neutral-700 px-1 py-0.5 rounded font-bold uppercase">
                                Anon
                              </span>
                            )}
                          </div>
                          {item.raisedByEmployeeId && !item.anonymous && (
                            <div className="text-[9px] text-neutral-500 font-mono">
                              {item.raisedByEmployeeId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-450">
                        {item.department}
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
                      <td className="px-6 py-4 text-xs text-neutral-300">
                        {item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : <span className="text-neutral-600 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/hr/complaints/${item.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-400 hover:text-blue-300"
                        >
                          Manage <ChevronRight className="w-3.5 h-3.5" />
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
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total cases)
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
    </HRLayout>
  );
}
