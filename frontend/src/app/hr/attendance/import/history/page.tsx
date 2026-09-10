'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/layouts/HRLayout';
import {
  Clock,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PARTIAL: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export default function ImportHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['import-history', page],
    queryFn: async () => {
      const res = await api.get('/attendance/import/history', {
        params: { page, limit: 20 },
      });
      return res.data;
    },
  });

  const records = data?.data ?? [];
  const pagination = data?.pagination ?? { totalPages: 1, total: 0 };

  const downloadFile = async (id: string, fileName: string) => {
    try {
      const response = await api.get(`/attendance/import/file/${id}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const downloadErrorReport = async (id: string) => {
    try {
      const response = await api.get(`/attendance/import/history/${id}/errors`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Import_Errors_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download error report:', error);
    }
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-500" /> Import History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View attendance import history and download error reports
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    File Name
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Uploaded By
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Upload Date
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Total Rows
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Successful
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Failed
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Duplicates
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-20">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No import history found</p>
                    </td>
                  </tr>
                ) : (
                  records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        <button
                          onClick={() => downloadFile(record.id, record.fileName)}
                          className="text-blue-600 hover:text-blue-300 hover:underline transition-colors"
                        >
                          {record.fileName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {record.uploadedByUser?.employee
                          ? `${record.uploadedByUser.employee.firstName} ${record.uploadedByUser.employee.lastName}`
                          : record.uploadedByUser?.email || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {format(new Date(record.uploadedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-xs text-card-foreground font-mono">
                        {record.totalRows}
                      </td>
                      <td className="px-6 py-4 text-xs text-emerald-600 font-mono font-bold">
                        {record.successfulRows}
                      </td>
                      <td className="px-6 py-4 text-xs text-red-600 font-mono font-bold">
                        {record.failedRows}
                      </td>
                      <td className="px-6 py-4 text-xs text-amber-600 font-mono font-bold">
                        {record.duplicateRows}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${
                            STATUS_COLORS[record.status] || STATUS_COLORS.PROCESSING
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadFile(record.id, record.fileName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-700 rounded-lg text-[10px] font-semibold text-foreground transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            File
                          </button>
                          {record.failedRows > 0 && record.errorReport && (
                            <button
                              onClick={() => downloadErrorReport(record.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/50 border border-border rounded-lg text-[10px] font-semibold text-foreground transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Errors
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
              <p className="text-[10px] text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/50 disabled:opacity-40 rounded-xl text-[10px] font-bold text-card-foreground"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/50 disabled:opacity-40 rounded-xl text-[10px] font-bold text-card-foreground"
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
