'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileCheck, Search, Filter, Eye, Download, CheckCircle,
  XCircle, AlertTriangle, Loader2, ChevronLeft, ChevronRight, MessageSquare
} from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    RE_UPLOAD_REQUIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PENDING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${styles[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default function HRDocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedDoc, setSelectedDoc] = React.useState<any>(null);
  const [comment, setComment] = React.useState('');
  const LIMIT = 10;

  // Fetch document queue
  const { data: queueResponse, isLoading } = useQuery({
    queryKey: ['hr-documents-queue', search, typeFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      const res = await api.get(`/documents/queue?${params.toString()}`);
      return res.data?.data ?? res.data ?? { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
    },
  });

  const docs = queueResponse?.data || [];
  const meta = queueResponse?.meta || { total: 0, page: 1, totalPages: 1 };

  const verifyMutation = useMutation({
    mutationFn: async ({ documentId, action, comment }: { documentId: string; action: string; comment?: string }) => {
      await api.post(`/documents/${documentId}/verify`, { action, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-documents-queue'] });
      setSelectedDoc(null);
      setComment('');
    },
    onError: (err: any) => alert(err.message || 'Failed to submit verification status'),
  });

  const handleAction = (action: string) => {
    if (!selectedDoc) return;
    if ((action === 'REJECT' || action === 'REQUEST_RE_UPLOAD') && !comment.trim()) {
      alert('Please provide a comment/reason for rejection or re-upload.');
      return;
    }
    verifyMutation.mutate({
      documentId: selectedDoc.id,
      action,
      comment,
    });
  };

  const documentTypes = [
    'PHOTO', 'RESUME', 'AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE',
    'MARKSHEET_10TH', 'MARKSHEET_12TH', 'DIPLOMA_CERTIFICATE',
    'GRADUATION_DEGREE', 'POST_GRADUATION_DEGREE', 'PROFESSIONAL_CERTIFICATIONS',
    'OFFER_LETTER', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER', 'SALARY_SLIP',
    'INTERNSHIP_CERTIFICATE'
  ];

  return (
    <HRLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-emerald-500" />
            Document Verification Queue
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review, preview, and approve or reject uploaded employee onboarding documents.
          </p>
        </div>

        {/* Search & Filter bar */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by Employee name, ID, or Code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Document Types</option>
              {documentTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RE_UPLOAD_REQUIRED">Re-upload Required</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-850 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Document Details</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Uploaded Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-neutral-900 animate-pulse rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : docs.length > 0 ? (
                  docs.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{doc.employee?.firstName} {doc.employee?.lastName}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{doc.employee?.employeeId} · {doc.employee?.department?.name}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-neutral-200 font-medium">{doc.type.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-[200px]">{doc.fileName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-5 py-4 text-neutral-400 text-xs">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => { setSelectedDoc(doc); setComment(doc.verification?.comment || ''); }}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-neutral-800"
                        >
                          Review File
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-neutral-500">No documents found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-4">
              <span className="text-xs text-neutral-500 font-medium">
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, meta.total)} of {meta.total} uploads
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 transition-colors border border-neutral-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400 font-semibold px-2">Page {page} of {meta.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 transition-colors border border-neutral-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal Dialog */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-800 animate-in zoom-in-95 duration-200">
            {/* File Preview Left */}
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">{selectedDoc.type.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{selectedDoc.fileName}</p>
                </div>
                <a
                  href={`${api.defaults.baseURL?.replace('/api/v1', '')}${selectedDoc.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1 border border-neutral-800"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>

              {/* Embedded PDF/Image view */}
              <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 min-h-[350px] relative overflow-hidden flex items-center justify-center">
                {selectedDoc.fileUrl.endsWith('.pdf') ? (
                  <iframe
                    src={`${api.defaults.baseURL?.replace('/api/v1', '')}${selectedDoc.fileUrl}`}
                    className="w-full h-full border-0 absolute inset-0"
                  />
                ) : (
                  <img
                    src={`${api.defaults.baseURL?.replace('/api/v1', '')}${selectedDoc.fileUrl}`}
                    alt="Document preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Verification Right Panel */}
            <div className="w-full md:w-80 p-6 flex flex-col gap-6 bg-neutral-950/40">
              <div>
                <h4 className="font-heading text-sm font-bold text-white">Employee Info</h4>
                <div className="mt-2 text-xs space-y-1 text-neutral-400">
                  <p className="font-semibold text-white">{selectedDoc.employee?.firstName} {selectedDoc.employee?.lastName}</p>
                  <p>ID: {selectedDoc.employee?.employeeId}</p>
                  <p>Dept: {selectedDoc.employee?.department?.name}</p>
                </div>
              </div>

              <div className="border-t border-neutral-850 pt-4">
                <h4 className="font-heading text-sm font-bold text-white flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-neutral-500" /> HR Verification Details
                </h4>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase">Comments / Reasons</label>
                    <textarea
                      placeholder="Add HR verification comments here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => handleAction('APPROVE')}
                      disabled={verifyMutation.isPending}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      {verifyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve File
                    </button>
                    <button
                      onClick={() => handleAction('REQUEST_RE_UPLOAD')}
                      disabled={verifyMutation.isPending}
                      className="w-full py-2 bg-amber-600/10 hover:bg-amber-600/20 disabled:opacity-50 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
                    >
                      Request Re-upload
                    </button>
                    <button
                      onClick={() => handleAction('REJECT')}
                      disabled={verifyMutation.isPending}
                      className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 disabled:opacity-50 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                    >
                      Reject File
                    </button>
                    <button
                      onClick={() => { setSelectedDoc(null); setComment(''); }}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 rounded-xl text-xs font-bold transition-colors"
                    >
                      Close Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
