'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileText, UploadCloud, CheckCircle2, AlertTriangle,
  XCircle, Clock, Trash2, Eye, Download, Loader2, ArrowUpRight
} from 'lucide-react';

const DOCUMENT_CATEGORIES = {
  PERSONAL: [
    { type: 'PHOTO', label: 'Passport Size Photo', description: 'Recent headshot (JPG/PNG)' },
    { type: 'RESUME', label: 'Resume / CV', description: 'Updated professional CV (PDF)' },
  ],
  GOVERNMENT: [
    { type: 'AADHAAR', label: 'Aadhaar Card', description: 'Front & back combined (PDF/JPG)' },
    { type: 'PAN', label: 'PAN Card', description: 'Clear card scan (PDF/JPG)' },
  ],
  EDUCATIONAL: [
    { type: 'MARKSHEET_10TH', label: '10th Marksheet', description: 'Secondary school marksheet (PDF)' },
    { type: 'MARKSHEET_12TH', label: '12th Marksheet', description: 'Higher secondary marksheet (PDF)' },
    { type: 'GRADUATION_DEGREE', label: 'Graduation Degree', description: 'Bachelor degree/provisional (PDF)' },
    { type: 'POST_GRADUATION_DEGREE', label: 'Post Graduation Degree', description: 'Masters degree, if applicable (PDF)' },
    { type: 'PROFESSIONAL_CERTIFICATIONS', label: 'Professional Certifications', description: 'Scans of certifications (PDF)' },
  ],
  PROFESSIONAL: [
    { type: 'OFFER_LETTER', label: 'Offer Letter', description: 'FCS signed offer letter (PDF)' },
    { type: 'EXPERIENCE_LETTER', label: 'Experience Letter', description: 'Previous employment letter (PDF)' },
    { type: 'RELIEVING_LETTER', label: 'Relieving Letter', description: 'Previous relieving certificate (PDF)' },
    { type: 'SALARY_SLIP', label: 'Salary Slips', description: 'Slips of last 3 months (PDF)' },
    { type: 'INTERNSHIP_CERTIFICATE', label: 'Internship Certificate', description: 'Scans of internship letter (PDF)' },
  ],
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    APPROVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
    RE_UPLOAD_REQUIRED: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    PENDING: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  };

  const current = styles[status] || { bg: 'bg-neutral-800', text: 'text-neutral-400', border: 'border-neutral-700', icon: <Clock className="w-3.5 h-3.5" /> };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${current.bg} ${current.text} ${current.border}`}>
      {current.icon}
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default function EmployeeDocumentsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = React.useState<string | null>(null);
  const [replaceDocId, setReplaceDocId] = React.useState<string | null>(null);

  // Fetch employee uploaded documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['employee-documents'],
    queryFn: async () => {
      const res = await api.get('/documents/my');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string; file: File }) => {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
      setSelectedDocType(null);
    },
    onError: (err: any) => alert(err.message || 'Upload failed. Checks: File size < 10MB, PDF/JPG formats only.'),
  });

  const replaceMutation = useMutation({
    mutationFn: async ({ documentId, file }: { documentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('documentId', documentId);
      formData.append('file', file);
      await api.post('/documents/replace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
      setReplaceDocId(null);
    },
    onError: (err: any) => alert(err.message || 'Replacement failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-documents'] }),
    onError: (err: any) => alert(err.message || 'Cannot delete document'),
  });

  const handleUploadClick = (type: string) => {
    setSelectedDocType(type);
    setReplaceDocId(null);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleReplaceClick = (docId: string) => {
    setReplaceDocId(docId);
    setSelectedDocType(null);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (replaceDocId) {
      replaceMutation.mutate({ documentId: replaceDocId, file });
    } else if (selectedDocType) {
      uploadMutation.mutate({ type: selectedDocType, file });
    }
  };

  const getDocForType = (type: string) => {
    return documents.find((d: any) => d.type === type.toUpperCase());
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-neutral-900 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-neutral-900 rounded-2xl"></div>)}
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            My Onboarding Documents
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Please upload all required files. Supported formats: PDF, PNG, JPG, JPEG (Max 10 MB per file).
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf, image/png, image/jpeg, image/jpg"
          className="hidden"
        />

        {Object.entries(DOCUMENT_CATEGORIES).map(([catKey, items]) => (
          <div key={catKey} className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-white border-b border-neutral-850 pb-2 capitalize">
              {catKey.toLowerCase()} Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => {
                const doc = getDocForType(item.type);
                const isUploading = (selectedDocType === item.type && uploadMutation.isPending) || (doc && replaceDocId === doc.id && replaceMutation.isPending);

                return (
                  <div key={item.type} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-850">
                        <FileText className="w-6 h-6 text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.label}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* HR Feedback Box */}
                    {doc?.verification?.comment && (
                      <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl text-xs text-neutral-400">
                        <span className="font-semibold text-neutral-300">HR Feedback: </span>
                        {doc.verification.comment}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-neutral-900 pt-4 mt-auto">
                      {doc ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={doc.status} />
                            <span className="text-[10px] text-neutral-500 font-mono">v{doc.versions?.[0]?.version || 1} · {doc.fileName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleReplaceClick(doc.id)}
                                disabled={isUploading}
                                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-855 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                Replace
                              </button>
                            )}
                            <a
                              href={`${api.defaults.baseURL?.replace('/api/v1', '')}${doc.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg border border-transparent hover:border-neutral-800 transition-all"
                              title="Preview file"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {doc.status !== 'APPROVED' && (
                              <button
                                onClick={() => { if (confirm(`Remove ${item.label}?`)) deleteMutation.mutate(doc.id); }}
                                className="p-1.5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 rounded-lg border border-transparent hover:border-neutral-800 transition-all"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-neutral-500 italic font-medium">Not uploaded yet</span>
                          <button
                            onClick={() => handleUploadClick(item.type)}
                            disabled={isUploading}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                          >
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                            Upload File
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </EmployeeLayout>
  );
}
