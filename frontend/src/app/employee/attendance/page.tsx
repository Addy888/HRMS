'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay } from 'date-fns';
import { 
  formatAttendanceTime, 
  getAttendanceCalendarDate, 
  formatWorkingHours,
  formatISTDate 
} from '@/lib/timezone-utils';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ABSENT: 'bg-red-500/10 text-red-400 border-red-500/20',
  HALF_DAY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LEAVE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WEEK_OFF: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  HOLIDAY: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WFH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ON_DUTY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  PENDING: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  NOT_MARKED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch today's attendance status
  const { data: todayData, isLoading: loadingToday, refetch: refetchToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      const res = await api.get('/attendance/my/today');
      console.log('[ATTENDANCE-UI] ========================================');
      console.log('[ATTENDANCE-UI] RAW API RESPONSE from /attendance/my/today:');
      console.log('[ATTENDANCE-UI] Full res:', res);
      console.log('[ATTENDANCE-UI] res.data:', res.data);
      console.log('[ATTENDANCE-UI] res.data type:', typeof res.data);
      console.log('[ATTENDANCE-UI] res.data keys:', Object.keys(res.data || {}));
      
      // Handle API envelope: {success, statusCode, message, data}
      let payload = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        console.log('[ATTENDANCE-UI] Detected API envelope, unwrapping res.data.data');
        payload = res.data.data;
      }
      
      console.log('[ATTENDANCE-UI] UNWRAPPED PAYLOAD:', payload);
      console.log('[ATTENDANCE-UI] payload.attendance:', payload?.attendance);
      console.log('[ATTENDANCE-UI] payload.canCheckIn:', payload?.canCheckIn);
      console.log('[ATTENDANCE-UI] payload.canCheckOut:', payload?.canCheckOut);
      console.log('[ATTENDANCE-UI] payload.hasAttendance:', payload?.hasAttendance);
      
      if (payload?.attendance) {
        console.log('[ATTENDANCE-UI] attendance.status:', payload.attendance.status);
        console.log('[ATTENDANCE-UI] attendance.checkInTime:', payload.attendance.checkInTime);
        console.log('[ATTENDANCE-UI] attendance.checkOutTime:', payload.attendance.checkOutTime);
        console.log('[ATTENDANCE-UI] attendance.workingHours:', payload.attendance.workingHours);
      }
      console.log('[ATTENDANCE-UI] ========================================');
      
      return payload;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch monthly attendance
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['attendance-monthly', selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get('/attendance/my/monthly', {
        params: { month: selectedMonth, year: selectedYear },
      });
      console.log('[ATTENDANCE-UI] Monthly attendance RAW response:', res.data);
      
      // Handle API envelope: {success, statusCode, message, data}
      let payload = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        console.log('[ATTENDANCE-UI] Detected API envelope for monthly, unwrapping res.data.data');
        payload = res.data.data;
      }
      
      console.log('[ATTENDANCE-UI] Monthly attendance UNWRAPPED payload:', payload);
      return payload;
    },
  });

  // Fetch attendance settings
  const { data: settings } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: async () => {
      const res = await api.get('/attendance/settings');
      
      // Handle API envelope: {success, statusCode, message, data}
      let payload = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        payload = res.data.data;
      }
      
      return payload;
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (location && settings?.locationVerificationEnabled) {
        payload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }
      const res = await api.post('/attendance/check-in', payload);
      console.log('[ATTENDANCE-UI] Check-in RAW response:', res.data);
      
      // Handle API envelope
      let result = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        result = res.data.data;
      }
      
      console.log('[ATTENDANCE-UI] Check-in UNWRAPPED response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('[ATTENDANCE-UI] Check-in success, refetching data...');
      // Immediately refetch today's data and wait for it
      await refetchToday();
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      console.log('[ATTENDANCE-UI] Data refetch complete');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (location && settings?.locationVerificationEnabled) {
        payload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }
      const res = await api.post('/attendance/check-out', payload);
      console.log('[ATTENDANCE-UI] Check-out RAW response:', res.data);
      
      // Handle API envelope
      let result = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        result = res.data.data;
      }
      
      console.log('[ATTENDANCE-UI] Check-out UNWRAPPED response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('[ATTENDANCE-UI] Check-out success, refetching data...');
      // Immediately refetch today's data and wait for it
      await refetchToday();
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      console.log('[ATTENDANCE-UI] Data refetch complete');
    },
  });

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError('Location permission denied. Please enable location access.');
          console.error('Location error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const handleCheckIn = () => {
    if (settings?.locationVerificationEnabled) {
      requestLocation();
      setTimeout(() => {
        if (location || !settings.locationVerificationEnabled) {
          checkInMutation.mutate();
        }
      }, 500);
    } else {
      checkInMutation.mutate();
    }
  };

  const handleCheckOut = () => {
    if (settings?.locationVerificationEnabled) {
      requestLocation();
      setTimeout(() => {
        if (location || !settings.locationVerificationEnabled) {
          checkOutMutation.mutate();
        }
      }, 500);
    } else {
      checkOutMutation.mutate();
    }
  };

  const attendance = todayData?.attendance;
  const canCheckIn = todayData?.canCheckIn ?? true;
  const canCheckOut = todayData?.canCheckOut ?? false;

  // Debug logging for today's attendance
  React.useEffect(() => {
    console.log('[ATTENDANCE-UI] ========== STATE UPDATE ==========');
    console.log('[ATTENDANCE-UI] todayData:', todayData);
    console.log('[ATTENDANCE-UI] todayData type:', typeof todayData);
    console.log('[ATTENDANCE-UI] todayData is null?:', todayData === null);
    console.log('[ATTENDANCE-UI] todayData is undefined?:', todayData === undefined);
    
    if (todayData) {
      console.log('[ATTENDANCE-UI] todayData keys:', Object.keys(todayData));
      console.log('[ATTENDANCE-UI] todayData.attendance:', todayData.attendance);
      console.log('[ATTENDANCE-UI] todayData.canCheckIn:', todayData.canCheckIn);
      console.log('[ATTENDANCE-UI] todayData.canCheckOut:', todayData.canCheckOut);
    }
    
    console.log('[ATTENDANCE-UI] Extracted attendance:', attendance);
    console.log('[ATTENDANCE-UI] attendance type:', typeof attendance);
    console.log('[ATTENDANCE-UI] attendance is null?:', attendance === null);
    console.log('[ATTENDANCE-UI] attendance is undefined?:', attendance === undefined);
    
    console.log('[ATTENDANCE-UI] Computed canCheckIn:', canCheckIn);
    console.log('[ATTENDANCE-UI] Computed canCheckOut:', canCheckOut);
    
    if (attendance) {
      console.log('[ATTENDANCE-UI] attendance.id:', attendance.id);
      console.log('[ATTENDANCE-UI] attendance.status:', attendance.status);
      console.log('[ATTENDANCE-UI] attendance.checkInTime:', attendance.checkInTime);
      console.log('[ATTENDANCE-UI] attendance.checkOutTime:', attendance.checkOutTime);
      console.log('[ATTENDANCE-UI] attendance.workingHours:', attendance.workingHours);
      console.log('[ATTENDANCE-UI] Formatted checkIn:', formatAttendanceTime(attendance.checkInTime));
      console.log('[ATTENDANCE-UI] Formatted checkOut:', formatAttendanceTime(attendance.checkOutTime));
      console.log('[ATTENDANCE-UI] Formatted workingHours:', formatWorkingHours(attendance.workingHours));
      
      // Calculate what buttons SHOULD be
      const hasCheckedIn = !!attendance.checkInTime;
      const hasCheckedOut = !!attendance.checkOutTime;
      console.log('[ATTENDANCE-UI] hasCheckedIn:', hasCheckedIn);
      console.log('[ATTENDANCE-UI] hasCheckedOut:', hasCheckedOut);
      console.log('[ATTENDANCE-UI] SHOULD canCheckIn be:', !hasCheckedIn);
      console.log('[ATTENDANCE-UI] SHOULD canCheckOut be:', hasCheckedIn && !hasCheckedOut);
      console.log('[ATTENDANCE-UI] ACTUAL canCheckIn:', canCheckIn);
      console.log('[ATTENDANCE-UI] ACTUAL canCheckOut:', canCheckOut);
    } else {
      console.log('[ATTENDANCE-UI] attendance is null/undefined - showing NOT MARKED');
    }
    console.log('[ATTENDANCE-UI] =====================================');
  }, [todayData, attendance, canCheckIn, canCheckOut]);

  const getStatusDisplay = () => {
    if (!attendance) return 'NOT MARKED';
    return attendance.status.replace(/_/g, ' ');
  };

  const getErrorMessage = (error: any) => {
    const msg = error?.response?.data?.message || error?.message || 'An error occurred';
    return msg;
  };

  // Calendar view
  const renderCalendar = () => {
    if (loadingMonthly) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      );
    }

    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(monthStart);
    
    // Calculate padding days for the calendar grid
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
    const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create attendance map using timezone-safe date conversion
    const attendanceMap = new Map();
    if (monthlyData?.attendances) {
      console.log('[ATTENDANCE-UI] Processing attendances for calendar:', monthlyData.attendances.length);
      monthlyData.attendances.forEach((a: any) => {
        // Convert canonical DB date to IST calendar date
        const calendarDate = getAttendanceCalendarDate(a.date);
        console.log('[ATTENDANCE-UI] Calendar mapping:', {
          dbDate: a.date,
          calendarDate,
          status: a.status,
          checkInTime: a.checkInTime,
          checkOutTime: a.checkOutTime,
          workingHours: a.workingHours
        });
        attendanceMap.set(calendarDate, a);
      });
      console.log('[ATTENDANCE-UI] Attendance map size:', attendanceMap.size);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-neutral-500 py-2">
            {day}
          </div>
        ))}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="min-h-[70px]" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAttendance = attendanceMap.get(dateKey);
          const status = dayAttendance?.status || 'NOT_MARKED';
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateKey}
              className={`relative border rounded-lg p-2 min-h-[100px] ${
                isToday ? 'border-blue-500 bg-blue-500/5' : 'border-neutral-800'
              } ${dayAttendance ? STATUS_COLORS[status] : 'bg-neutral-900'}`}
            >
              <div className="text-[11px] font-bold mb-1">{format(day, 'd')}</div>
              {dayAttendance && (
                <>
                  <div className="text-[8px] font-bold uppercase mb-1">
                    {status.replace(/_/g, ' ')}
                  </div>
                  {dayAttendance.checkInTime && (
                    <div className="text-[8px] text-neutral-400">
                      IN: {formatAttendanceTime(dayAttendance.checkInTime, 'hh:mm a')}
                    </div>
                  )}
                  {dayAttendance.checkOutTime && (
                    <div className="text-[8px] text-neutral-400">
                      OUT: {formatAttendanceTime(dayAttendance.checkOutTime, 'hh:mm a')}
                    </div>
                  )}
                  {dayAttendance.workingHours && (
                    <div className="text-[8px] text-neutral-400 font-mono">
                      {formatWorkingHours(dayAttendance.workingHours)}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <EmployeeLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-500" /> My Attendance
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Mark your daily attendance and track your attendance history
          </p>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Today's Attendance
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              {formatISTDate(new Date(), 'dd MMM yyyy, EEEE')}
            </span>
          </div>

          {loadingToday ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="mb-6">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">
                  Status
                </p>
                <span
                  className={`inline-flex px-3 py-1.5 rounded-lg border text-sm font-extrabold ${
                    STATUS_COLORS[attendance?.status || 'NOT_MARKED']
                  }`}
                >
                  {getStatusDisplay()}
                </span>
                {attendance?.lateBy && attendance.lateBy > 0 && (
                  <span className="ml-3 text-xs text-amber-400">
                    Late by {attendance.lateBy} minutes
                  </span>
                )}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">
                    Check In
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatAttendanceTime(attendance?.checkInTime)}
                  </p>
                </div>
                <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">
                    Check Out
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatAttendanceTime(attendance?.checkOutTime)}
                  </p>
                </div>
                <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">
                    Working Hours
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatWorkingHours(attendance?.workingHours)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || checkInMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {!canCheckIn && attendance?.checkInTime ? 'Checked In' : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!canCheckOut || checkOutMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  {checkOutMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                  {attendance?.checkOutTime ? 'Checked Out' : 'Check Out'}
                </button>
              </div>

              {/* Location Warning */}
              {settings?.locationVerificationEnabled && !location && !locationError && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Location verification is enabled. Please allow location access to mark attendance.
                  </p>
                </div>
              )}

              {/* Location Error */}
              {locationError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <p className="text-xs text-red-400">{locationError}</p>
                </div>
              )}

              {/* Error Messages */}
              {checkInMutation.isError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <p className="text-xs text-red-400">
                    {getErrorMessage(checkInMutation.error)}
                  </p>
                </div>
              )}
              {checkOutMutation.isError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <p className="text-xs text-red-400">
                    {getErrorMessage(checkOutMutation.error)}
                  </p>
                </div>
              )}

              {/* Success Messages */}
              {checkInMutation.isSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <p className="text-xs text-emerald-400">
                    Checked in successfully!
                  </p>
                </div>
              )}
              {checkOutMutation.isSuccess && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-400">
                    Checked out successfully!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Monthly Summary */}
        {monthlyData?.summary && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Monthly Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Total Present</p>
                <p className="text-2xl font-bold text-emerald-400">{monthlyData.summary.totalPresent}</p>
              </div>
              <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Total Late</p>
                <p className="text-2xl font-bold text-amber-400">{monthlyData.summary.totalLate}</p>
              </div>
              <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Total Absent</p>
                <p className="text-2xl font-bold text-red-400">{monthlyData.summary.totalAbsent}</p>
              </div>
              <div className="bg-black/40 border border-neutral-850 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Attendance %</p>
                <p className="text-2xl font-bold text-blue-400">{monthlyData.summary.attendancePercentage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Calendar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Monthly Calendar</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format(new Date(2024, i), 'MMMM')}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {renderCalendar()}
        </div>
      </div>
    </EmployeeLayout>
  );
}
