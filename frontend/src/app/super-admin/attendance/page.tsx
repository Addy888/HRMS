'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ABSENT: 'bg-red-500/10 text-red-400 border-red-500/20',
  HALF_DAY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ON_LEAVE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WEEK_OFF: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  HOLIDAY: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  PENDING: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  NOT_MARKED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-white mt-2">{value ?? 0}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function SuperAdminAttendancePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);

  // Fetch attendance summary
  const { data: summary } = useQuery({
    queryKey: ['super-admin-attendance-summary', dateFilter],
    queryFn: async () => {
      const res = await api.get('/attendance/summary', {
        params: { date: dateFilter },
      });
      return res.data;
    },
  });

  // Fetch attendance records
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['super-admin-attendance-records', search, statusFilter, dateFilter, page],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 20,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/attendance', { params });
      return res.data;
    },
  });

  const records = attendanceData?.data ?? [];
  const meta = attendanceData?.meta ?? { totalPages: 1, total: 0 };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const formatHours = (minutes: number | null) => {
    if (!minutes) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/login">
      <SuperAdminLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              Attendance Overview
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Company-wide attendance tracking and reporting
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Employees"
              value={summary?.totalEmployees}
              icon={Users}
              color="bg-purple-500/10 text-purple-400"
            />
            <StatCard
              title="Present"
              value={summary?.present}
              icon={CheckCircle2}
              color="bg-emerald-500/10 text-emerald-400"
            />
            <StatCard
              title="Late"
              value={summary?.late}
              icon={AlertCircle}
              color="bg-amber-500/10 text-amber-400"
            />
            <StatCard
              title="Absent"
              value={summary?.absent}
              icon={XCircle}
              color="bg-red-500/10 text-red-400"
            />
          </div>

          {/* Filters */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-500" /> Filters
              </h2>
              {(search || statusFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                  }}
                  className="text-xs text-neutral-500 hover:text-white font-semibold transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or employee ID..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="WEEK_OFF">Week Off</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="font-heading text-xl font-bold text-white">Attendance Records</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Detailed attendance records for {dateFilter}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Check In</th>
                    <th className="px-6 py-4">Check Out</th>
                    <th className="px-6 py-4">Working Hours</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Late By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <Clock className="w-12 h-12 text-neutral-700" />
                          <span className="text-neutral-400 font-medium">No attendance records found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((record: any) => (
                      <tr
                        key={record.id}
                        className="hover:bg-neutral-900/50 transition-colors text-sm"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-neutral-400">
                            {record.employee?.employeeId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-neutral-400">
                            {record.employee?.department?.name || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-neutral-300 font-mono">
                            {formatTime(record.checkInTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-neutral-300 font-mono">
                            {formatTime(record.checkOutTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-neutral-300 font-mono">
                            {formatHours(record.workingHours ? record.workingHours * 60 : null)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-lg border text-[10px] font-bold uppercase ${
                              STATUS_COLORS[record.status] || STATUS_COLORS.PENDING
                            }`}
                          >
                            {record.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-neutral-400 font-mono">
                            {record.lateBy ? `${record.lateBy}m` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/30">
                <p className="text-xs text-neutral-400">
                  Showing page {page} of {meta.totalPages} ({meta.total} total records)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
