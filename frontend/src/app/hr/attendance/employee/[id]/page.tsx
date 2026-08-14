'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/layouts/HRLayout';
import {
  Calendar,
  ChevronLeft,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  Coffee,
  Home,
  TrendingUp,
  Loader2,
  Printer,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ABSENT: 'bg-red-500/10 text-red-400 border-red-500/20',
  HALF_DAY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ON_LEAVE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  LEAVE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WEEK_OFF: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  HOLIDAY: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WFH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ON_DUTY: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  NOT_MARKED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

// Helper to unwrap API response envelope
function unwrapResponse(response: any) {
  if (response?.success !== undefined && response?.data !== undefined) {
    return response.data;
  }
  return response;
}

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

export default function EmployeeMonthlyAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Fetch employee details
  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`);
      return unwrapResponse(res.data);
    },
  });

  // Fetch monthly attendance
  const { data: monthlyData, isLoading: attendanceLoading, refetch } = useQuery({
    queryKey: ['employee-monthly-attendance', employeeId, selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/attendance/employee/${employeeId}/monthly`, {
        params: { month: selectedMonth, year: selectedYear },
      });
      return unwrapResponse(res.data);
    },
  });

  const employee = employeeData;
  const attendances = monthlyData?.attendances || [];
  const summary = monthlyData?.summary || {};

  // Generate complete month calendar
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return allDays.map((day) => {
      // Normalize to India date for comparison
      const indiaDate = toZonedTime(day, 'Asia/Kolkata');
      const dateKey = format(indiaDate, 'yyyy-MM-dd');

      // Find matching attendance record
      const attendance = attendances.find((att: any) => {
        const attDate = new Date(att.date);
        const attDateKey = format(toZonedTime(attDate, 'Asia/Kolkata'), 'yyyy-MM-dd');
        return attDateKey === dateKey;
      });

      return {
        date: day,
        dateKey,
        dayNumber: format(day, 'd'),
        dayName: format(day, 'EEEE'),
        attendance: attendance || null,
      };
    });
  }, [selectedMonth, selectedYear, attendances]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    const date = toZonedTime(new Date(timestamp), 'Asia/Kolkata');
    return format(date, 'hh:mm a');
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return '00h 00m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Placeholder for Excel export
    alert('Excel export functionality coming soon!');
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert('PDF export functionality coming soon!');
  };

  if (employeeLoading) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    );
  }

  if (!employee) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-neutral-400">Employee not found</p>
        </div>
      </HRLayout>
    );
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <HRLayout>
      <div className="space-y-8 print:space-y-6">
        {/* Breadcrumb - Hide on print */}
        <div className="print:hidden">
          <button
            onClick={() => router.push('/hr/attendance')}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Attendance</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between print:mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              Employee Attendance
            </h1>
            <p className="text-sm text-neutral-400 mt-1 print:text-neutral-600">
              {employee.firstName} {employee.lastName}
            </p>
          </div>

          {/* Action Buttons - Hide on print */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Employee Information Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 print:border-neutral-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                Employee Name
              </p>
              <p className="text-sm font-semibold text-white mt-1 print:text-black">
                {employee.firstName} {employee.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                Employee ID
              </p>
              <p className="text-sm font-semibold text-white mt-1 font-mono print:text-black">
                {employee.employeeId}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                Department
              </p>
              <p className="text-sm font-semibold text-white mt-1 print:text-black">
                {employee.department?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                Designation
              </p>
              <p className="text-sm font-semibold text-white mt-1 print:text-black">
                {employee.designation?.name || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Month & Year Selector - Hide on print */}
        <div className="flex items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-400 font-semibold">Select Period:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Print-only header with selected month/year */}
        <div className="hidden print:block mb-4">
          <p className="text-lg font-bold">
            Attendance Report - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>

        {attendanceLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:gap-2">
              <StatCard
                title="Total Working Days"
                value={summary.totalWorkingDays || 0}
                icon={Calendar}
                color="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                title="Present"
                value={summary.totalPresent || 0}
                icon={CheckCircle2}
                color="bg-emerald-500/10 text-emerald-400"
              />
              <StatCard
                title="Late"
                value={summary.totalLate || 0}
                icon={AlertCircle}
                color="bg-amber-500/10 text-amber-400"
              />
              <StatCard
                title="Half Day"
                value={summary.totalHalfDay || 0}
                icon={MinusCircle}
                color="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                title="Absent"
                value={summary.totalAbsent || 0}
                icon={XCircle}
                color="bg-red-500/10 text-red-400"
              />
              <StatCard
                title="Week Off"
                value={summary.totalWeekOffs || 0}
                icon={Home}
                color="bg-neutral-700/50 text-neutral-300"
              />
              <StatCard
                title="Leave"
                value={(summary.totalWFH || 0) + (summary.totalOnDuty || 0)}
                icon={Coffee}
                color="bg-purple-500/10 text-purple-400"
              />
              <StatCard
                title="Attendance %"
                value={`${summary.attendancePercentage || 0}%`}
                icon={TrendingUp}
                color="bg-green-500/10 text-green-400"
              />
            </div>

            {/* Working Hours Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 print:border-neutral-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                      Total Working Hours
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-0.5 print:text-black">
                      {formatHours(summary.totalWorkingHours)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 print:border-neutral-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider print:text-neutral-600">
                      Average Working Hours
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-0.5 print:text-black">
                      {formatHours(summary.averageWorkingHours)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Attendance Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden print:border-neutral-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/50 print:bg-neutral-100 print:border-neutral-300">
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Date
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Day
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Check In
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Check Out
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Working Hours
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Status
                      </th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-6 py-4 print:text-neutral-700">
                        Late By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40 print:divide-neutral-300">
                    {monthDays.map((day) => {
                      const att = day.attendance;
                      const status = att?.status || 'NOT_MARKED';
                      return (
                        <tr
                          key={day.dateKey}
                          className="hover:bg-neutral-800/35 transition-colors print:hover:bg-transparent"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-white print:text-black">
                            {format(day.date, 'dd MMM')}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-400 print:text-neutral-700">
                            {day.dayName}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-300 font-mono print:text-black">
                            {att ? formatTime(att.checkInTime) : '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-300 font-mono print:text-black">
                            {att ? formatTime(att.checkOutTime) : '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-300 font-mono print:text-black">
                            {att && att.workingHours ? formatHours(att.workingHours) : '00h 00m'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${
                                STATUS_COLORS[status] || STATUS_COLORS.NOT_MARKED
                              } print:border-black`}
                            >
                              {status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-400 font-mono print:text-neutral-700">
                            {att?.lateBy ? `${att.lateBy}m` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          /* Hide sidebar and header */
          aside, header, nav, button {
            display: none !important;
          }
          
          /* Full width for content */
          main {
            max-width: 100% !important;
            padding: 20px !important;
          }
          
          /* Page breaks */
          .break-inside-avoid {
            break-inside: avoid;
          }
          
          /* Remove shadows and rounded corners */
          * {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </HRLayout>
  );
}
