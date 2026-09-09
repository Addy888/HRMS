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
  Upload,
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
  
  // ✅ NEW: Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  // ✅ NEW: Fetch recent upload history
  const { data: uploadHistory, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['upload-history-recent'],
    queryFn: async () => {
      const res = await api.get('/attendance/import/history', {
        params: { page: 1, limit: 5 },
      });
      
      // Handle API envelope
      let payload = res.data;
      if (res.data && typeof res.data.success === 'boolean' && res.data.data !== undefined) {
        payload = res.data.data;
      }
      
      return payload;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // ✅ NEW: Handle direct file upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Upload and preview
      const formData = new FormData();
      formData.append('file', selectedFile);

      const previewRes = await api.post('/attendance/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      let previewData = previewRes.data;
      if (previewData && typeof previewData.success === 'boolean' && previewData.data !== undefined) {
        previewData = previewData.data;
      }

      console.log('[UPLOAD] Preview response:', previewData);

      if (!previewData.sessionId) {
        throw new Error('No session ID received from server');
      }

      // Step 2: Confirm upload immediately
      const confirmRes = await api.post('/attendance/import/confirm', {
        sessionId: previewData.sessionId,
      });

      let confirmData = confirmRes.data;
      if (confirmData && typeof confirmData.success === 'boolean' && confirmData.data !== undefined) {
        confirmData = confirmData.data;
      }

      console.log('[UPLOAD] Confirm response:', confirmData);

      // Success!
      setUploadSuccess(true);
      setSelectedFile(null);
      
      // Refetch upload history
      await refetchHistory();

      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('[UPLOAD] Error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Upload failed';
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-500" /> Attendance Management
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Track and manage employee attendance records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/hr/attendance/import/history')}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Upload History
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>
          </div>
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

        {/* ✅ NEW: Uploaded Attendance Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Uploaded Attendance
            </h2>
            <button
              onClick={() => router.push('/hr/attendance/import/history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All →
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : !uploadHistory || !uploadHistory.data || uploadHistory.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-400">No attendance files uploaded yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Upload First Attendance Excel
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      File Name
                    </th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      Attendance Month
                    </th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      Uploaded By
                    </th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      Upload Date
                    </th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      Rows
                    </th>
                    <th className="text-left text-xs font-bold text-neutral-400 uppercase px-3 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.data.map((upload: any) => {
                    const uploadedByName = upload.uploadedByUser?.employee
                      ? `${upload.uploadedByUser.employee.firstName} ${upload.uploadedByUser.employee.lastName}`
                      : upload.uploadedByUser?.email || 'Unknown';
                    
                    const statusColor = 
                      upload.status === 'COMPLETED' ? 'text-emerald-400' :
                      upload.status === 'PARTIAL' ? 'text-amber-400' :
                      upload.status === 'FAILED' ? 'text-red-400' :
                      'text-neutral-400';

                    const statusText =
                      upload.status === 'COMPLETED' ? 'Uploaded Successfully' :
                      upload.status === 'PARTIAL' ? 'Partially Uploaded' :
                      upload.status === 'FAILED' ? 'Upload Failed' :
                      upload.status;

                    // Extract attendance month/year from filename
                    const extractMonthYear = (fileName: string) => {
                      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                         'July', 'August', 'September', 'October', 'November', 'December'];
                      const lowerFileName = fileName.toLowerCase();
                      
                      let detectedMonth = null;
                      let detectedYear = null;
                      
                      for (let i = 0; i < monthNames.length; i++) {
                        if (lowerFileName.includes(monthNames[i].toLowerCase())) {
                          detectedMonth = monthNames[i];
                          break;
                        }
                      }
                      
                      const yearMatch = fileName.match(/20\d{2}/);
                      if (yearMatch) {
                        detectedYear = yearMatch[0];
                      }
                      
                      if (detectedMonth && detectedYear) {
                        return `${detectedMonth} ${detectedYear}`;
                      }
                      return '—';
                    };

                    const attendanceMonth = extractMonthYear(upload.fileName);

                    return (
                      <tr key={upload.id} className="border-b border-neutral-800/40 hover:bg-neutral-800/20 transition-colors">
                        <td className="px-3 py-3 text-sm text-white font-medium">
                          {upload.fileName}
                        </td>
                        <td className="px-3 py-3 text-xs text-blue-400 font-semibold">
                          {attendanceMonth}
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-300">
                          {uploadedByName}
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-300 font-mono">
                          {format(new Date(upload.uploadedAt), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-300">
                          {upload.totalRows}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

      {/* ✅ NEW: Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-500" />
                Upload Attendance Excel
              </h3>
              <button
                onClick={closeUploadModal}
                disabled={uploading}
                className="text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Upload Successful!</h4>
                <p className="text-sm text-neutral-400">
                  Attendance Excel uploaded successfully
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      Select Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-xs text-neutral-400">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                    <p className="text-xs text-neutral-400">
                      📋 Your Excel can contain any columns (Agent ID, Name, dates, attendance marks, etc.). 
                      The system will preserve all columns and data as-is.
                    </p>
                  </div>

                  {uploadError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {uploadError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={closeUploadModal}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
