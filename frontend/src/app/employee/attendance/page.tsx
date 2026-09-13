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
  formatWorkingHours,
  formatISTDate 
} from '@/lib/timezone-utils';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  LATE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  ABSENT: 'bg-red-500/10 text-red-600 border-red-500/20',
  HALF_DAY: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  LEAVE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  WEEK_OFF: 'bg-secondary text-muted-foreground border-border',
  HOLIDAY: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WFH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ON_DUTY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  PENDING: 'bg-secondary text-muted-foreground border-border',
  NOT_MARKED: 'bg-secondary text-muted-foreground border-border',
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
    
    // Use the calendar date portion for API ISO values so timezone conversion
    // cannot move an attendance record into a neighboring day.
    const getDateKey = (value: string | Date): string => {
      if (typeof value === 'string') return value.slice(0, 10);
      return formatISTDate(value, 'yyyy-MM-dd');
    };

    const attendanceMap = new Map();
    const apiAttendances = Array.isArray(monthlyData?.attendances) ? monthlyData.attendances : [];
    console.log('[CALENDAR-DEBUG]', {
      selectedMonth,
      selectedYear,
      apiRecordsCount: apiAttendances.length,
      apiRecordDates: apiAttendances.map((a: any) => getDateKey(a.date)),
    });
    apiAttendances.forEach((a: any) => {
        const calendarDate = getDateKey(a.date);
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

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
            {day}
          </div>
        ))}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="min-h-[70px]" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAttendance = attendanceMap.get(dateKey);
          console.log('[CALENDAR-DEBUG]', {
            selectedMonth,
            selectedYear,
            apiRecordsCount: apiAttendances.length,
            apiRecordDates: apiAttendances.map((a: any) => getDateKey(a.date)),
            calendarDate: dateKey,
            matchedAttendance: dayAttendance?.status ?? null,
          });
          const isToday = isSameDay(day, new Date());
          
          // ============================================
          // BUSINESS RULE: MONDAY = WEEK OFF
          // ============================================
          const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday
          const isMonday = dayOfWeek === 1;
          
          // If it's Monday and no attendance record, show WEEK_OFF
          // If there IS an attendance record for Monday, respect backend status
          const status = dayAttendance?.status || (isMonday ? 'WEEK_OFF' : 'NOT_MARKED');

          return (
            <div
              key={dateKey}
              className={`relative border rounded-lg p-2 min-h-[100px] ${
                isToday ? 'border-blue-500 bg-blue-500/5' : 'border-border'
              } ${dayAttendance || isMonday ? STATUS_COLORS[status] : 'bg-secondary'}`}
            >
              <div className="text-[11px] font-bold mb-1">{format(day, 'd')}</div>
              {/* Show WEEK OFF for Monday even without attendance record */}
              {isMonday && !dayAttendance ? (
                <div className="text-[8px] font-bold uppercase">
                  WEEK OFF
                </div>
              ) : dayAttendance ? (
                <>
                  <div className="text-[8px] font-bold uppercase mb-1">
                    {status.replace(/_/g, ' ')}
                  </div>
                  {dayAttendance.checkInTime && (
                    <div className="text-[8px] text-muted-foreground">
                      IN: {formatAttendanceTime(dayAttendance.checkInTime, 'hh:mm a')}
                    </div>
                  )}
                  {dayAttendance.checkOutTime && (
                    <div className="text-[8px] text-muted-foreground">
                      OUT: {formatAttendanceTime(dayAttendance.checkOutTime, 'hh:mm a')}
                    </div>
                  )}
                  {dayAttendance.workingHours && (
                    <div className="text-[8px] text-muted-foreground font-mono">
                      {formatWorkingHours(dayAttendance.workingHours)}
                    </div>
                  )}
                  {dayAttendance.history?.length > 0 && (
                    <div className="text-[8px] font-semibold text-blue-600 mt-1" title={dayAttendance.history[0].reason || undefined}>
                      Updated by HR{dayAttendance.history[0].reason ? ` · ${dayAttendance.history[0].reason}` : ''}
                    </div>
                  )}
                </>
              ) : null}
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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-500" /> My Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mark your daily attendance and track your attendance history
          </p>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-secondary border border-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Attendance
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
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
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
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
                  <span className="ml-3 text-xs text-amber-600">
                    Late by {attendance.lateBy} minutes
                  </span>
                )}
                {attendance?.history?.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-blue-600">
                    Regularized by HR{attendance.history[0].reason ? ` · ${attendance.history[0].reason}` : ''}
                  </p>
                )}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    Check In
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {formatAttendanceTime(attendance?.checkInTime)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    Check Out
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {formatAttendanceTime(attendance?.checkOutTime)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    Working Hours
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {formatWorkingHours(attendance?.workingHours)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {todayData?.isMonday ? (
                <div className="p-4 bg-secondary border border-border rounded-xl">
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    ðŸ“… Today is a weekly off.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCheckIn}
                      disabled={!canCheckIn || checkInMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed text-foreground font-bold rounded-xl transition-all"
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
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed text-foreground font-bold rounded-xl transition-all"
                    >
                      {checkOutMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                      {attendance?.checkOutTime ? 'Checked Out' : 'Check Out'}
                    </button>
                  </div>
                </>
              )}

              {/* Location Warning */}
              {settings?.locationVerificationEnabled && !location && !locationError && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-600">
                    Location verification is enabled. Please allow location access to mark attendance.
                  </p>
                </div>
              )}

              {/* Location Error */}
              {locationError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-600">{locationError}</p>
                </div>
              )}

              {/* Error Messages */}
              {checkInMutation.isError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-600">
                    {getErrorMessage(checkInMutation.error)}
                  </p>
                </div>
              )}
              {checkOutMutation.isError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-600">
                    {getErrorMessage(checkOutMutation.error)}
                  </p>
                </div>
              )}

              {/* Success Messages */}
              {checkInMutation.isSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p className="text-xs text-emerald-600">
                    Checked in successfully!
                  </p>
                </div>
              )}
              {checkOutMutation.isSuccess && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-600">
                    Checked out successfully!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Monthly Summary */}
        {monthlyData?.summary && (
          <div className="bg-secondary border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Monthly Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Present</p>
                <p className="text-2xl font-bold text-emerald-600">{monthlyData.summary.totalPresent}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Late</p>
                <p className="text-2xl font-bold text-amber-600">{monthlyData.summary.totalLate}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Absent</p>
                <p className="text-2xl font-bold text-red-600">{monthlyData.summary.totalAbsent}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Attendance %</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyData.summary.attendancePercentage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Calendar */}
        <div className="bg-secondary border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">Monthly Calendar</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
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
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
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

        {/* âœ… NEW: Uploaded Attendance Section */}
        <UploadedAttendanceSection selectedMonth={selectedMonth} selectedYear={selectedYear} />
      </div>
    </EmployeeLayout>
  );
}

// âœ… UPLOADED ATTENDANCE COMPONENT
function UploadedAttendanceSection({ selectedMonth: parentMonth, selectedYear: parentYear }: { selectedMonth: number; selectedYear: number }) {
  // Independent month/year state for uploaded attendance
  const [uploadMonth, setUploadMonth] = useState<number | null>(null);
  const [uploadYear, setUploadYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const { data: uploadedData, isLoading } = useQuery({
    queryKey: ['uploaded-attendance', uploadMonth, uploadYear],
    queryFn: async () => {
      console.log('[UPLOADED-ATTENDANCE-UI] ========== FETCHING ==========');
      console.log('[UPLOADED-ATTENDANCE-UI] Month:', uploadMonth);
      console.log('[UPLOADED-ATTENDANCE-UI] Year:', uploadYear);
      
      // ✅ ALWAYS send month and year parameters
      const params: any = {
        month: uploadMonth || parentMonth,
        year: uploadYear || parentYear,
      };
      
      const res = await api.get('/attendance/my/imported', { params });
      
      console.log('[UPLOADED-ATTENDANCE-UI] RAW API Response:', res);
      console.log('[UPLOADED-ATTENDANCE-UI] res.data:', res.data);
      
      // Handle API envelope
      let payload = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        console.log('[UPLOADED-ATTENDANCE-UI] Detected API envelope, unwrapping res.data.data');
        payload = res.data.data;
      }
      
      console.log('[UPLOADED-ATTENDANCE-UI] UNWRAPPED payload:', payload);
      console.log('[UPLOADED-ATTENDANCE-UI] payload.attendances:', payload?.attendances?.length || 0);
      console.log('[UPLOADED-ATTENDANCE-UI] payload.total:', payload?.total);
      
      console.log('[UPLOADED-ATTENDANCE-UI] ========== END ==========');
      
      return payload;
    },
  });

  // Fetch available years on mount
  React.useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await api.get('/attendance/my/imported', { params: {} });
        let payload = res.data;
        if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
          payload = res.data.data;
        }
        
        if (payload?.attendances && payload.attendances.length > 0) {
          const years = new Set<number>();
          payload.attendances.forEach((r: any) => {
            const year = new Date(r.date).getUTCFullYear();
            if (year) years.add(year);
          });
          
          if (years.size > 0) {
            const yearsArray = Array.from(years).sort((a, b) => b - a);
            setAvailableYears(yearsArray);
          }
          
        }
      } catch (error) {
        console.error('[UPLOADED-ATTENDANCE-UI] Error fetching initial data:', error);
        // Set defaults
        if (uploadMonth === null && uploadYear === null) {
          const now = new Date();
          setUploadMonth(now.getMonth() + 1);
          setUploadYear(now.getFullYear());
        }
      }
    };
    
    fetchYears();
  }, []);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (isLoading || uploadMonth === null || uploadYear === null) {
    return (
      <div className="bg-secondary border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Uploaded Attendance</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const records = uploadedData?.attendances || [];

  if (!uploadedData || records.length === 0) {
    return (
      <div className="bg-secondary border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Uploaded Attendance</h2>
        
        {/* Month/Year Filters */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={uploadMonth}
            onChange={(e) => setUploadMonth(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground"
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={uploadYear}
            onChange={(e) => setUploadYear(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground"
          >
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))
            ) : (
              [2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))
            )}
          </select>
        </div>
        
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No attendance Excel uploaded for {monthNames[uploadMonth - 1]} {uploadYear}
          </p>
        </div>
      </div>
    );
  }

  console.log('[UPLOADED-ATTENDANCE-UI] Rendering', records.length, 'Attendance rows');

  return (
    <div className="bg-secondary border border-border rounded-2xl p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Uploaded Attendance</h2>
      
      {/* Month/Year Filters + File Name */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <select
            value={uploadMonth}
            onChange={(e) => setUploadMonth(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground font-semibold"
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={uploadYear}
            onChange={(e) => setUploadYear(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground font-semibold"
          >
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))
            ) : (
              [2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))
            )}
          </select>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Showing BIOMETRIC attendance records for {monthNames[uploadMonth - 1]} {uploadYear}
        </div>
      </div>

      {/* Horizontally Scrollable Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-border rounded-xl">
        <table className="w-full border-collapse min-w-max">
          <thead className="sticky top-0 bg-secondary z-10">
            <tr className="border-b border-border">
              {['Date', 'Status', 'Check In', 'Check Out', 'Working Hours', 'Late By', 'Source'].map((column) => (
                <th key={column} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3 border-r border-border whitespace-nowrap bg-secondary">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record: any, rowIdx: number) => {
              return (
                <tr key={record.id || rowIdx} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{formatISTDate(record.date, 'yyyy-MM-dd')}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{record.status || '--'}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{formatAttendanceTime(record.checkInTime, 'hh:mm a')}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{formatAttendanceTime(record.checkOutTime, 'hh:mm a')}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{formatWorkingHours(record.workingHours)}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{record.lateBy ?? '--'}</td>
                  <td className="px-4 py-3 text-xs text-card-foreground border-r border-border whitespace-nowrap">{record.source || '--'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-muted-foreground italic">
        â„¹ï¸ This is a read-only view of the uploaded attendance Excel. Scroll horizontally to see all columns.
      </div>
    </div>
  );
}
