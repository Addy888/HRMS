'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/layouts/HRLayout';
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-1.5">{value ?? 0}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function HRAttendancePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);

  // Fetch today's summary
  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', dateFilter],
    queryFn: async () => {
      const res = await api.get('/attendance/summary', {
        params: { date: dateFilter },
      });
      return res.data;
    },
  });

  // Fetch attendance records
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-records', search, statusFilter, dateFilter, page],
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
    <HRLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-500" /> Attendance Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track and manage employee attendance records
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={summary?.totalEmployees}
            icon={Users}
            color="bg-blue-500/10 text-blue-400"
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Filters
            </h2>
            {(search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="text-xs text-neutral-500 hover:text-white font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or employee ID..."
                className="w-full bg-black border border-neutral-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Employee
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Employee ID
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Department
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Check In
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Check Out
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Working Hours
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4">
                    Late By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-neutral-500 text-sm">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((record: any) => (
                    <tr 
                      key={record.id} 
                      onClick={() => router.push(`/hr/attendance/employee/${record.employee?.id}`)}
                      className="hover:bg-neutral-800/35 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-white hover:text-blue-400 transition-colors">
                        {record.employee?.firstName} {record.employee?.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-neutral-400">
                        {record.employee?.employeeId}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {record.employee?.department?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-300 font-mono">
                        {formatTime(record.checkInTime)}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-300 font-mono">
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-300 font-mono">
                        {formatHours(record.workingHours ? record.workingHours * 60 : null)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${
                            STATUS_COLORS[record.status] || STATUS_COLORS.PENDING
                          }`}
                        >
                          {record.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-400 font-mono">
                        {record.lateBy ? `${record.lateBy}m` : '—'}
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
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total records)
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
