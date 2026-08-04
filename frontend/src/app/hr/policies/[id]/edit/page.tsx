'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Loader2, Save, Eye, ChevronDown, Globe, Archive, FileText } from 'lucide-react';

const CATEGORIES = [
  { value: 'ATTENDANCE', label: 'Attendance Policy' },
  { value: 'LEAVE', label: 'Leave Policy' },
  { value: 'CODE_OF_CONDUCT', label: 'Code of Conduct' },
  { value: 'POSH', label: 'POSH Policy' },
  { value: 'DATA_PRIVACY', label: 'Data Privacy Policy' },
  { value: 'INFO_SEC', label: 'Information Security Policy' },
  { value: 'IT_USAGE', label: 'IT Usage Policy' },
  { value: 'CONFIDENTIALITY', label: 'Confidentiality Agreement' },
  { value: 'NDA', label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'REMOTE_WORK', label: 'Remote Work Policy' },
  { value: 'LAPTOP_ASSET', label: 'Laptop & Asset Policy' },
  { value: 'INTERNET_USAGE', label: 'Internet Usage Policy' },
  { value: 'HANDBOOK', label: 'Employee Handbook' },
  { value: 'TRAVEL', label: 'Travel Policy' },
  { value: 'MEDICAL', label: 'Medical Policy' },
  { value: 'CUSTOM', label: 'Custom Policy' },
];

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors ${className}`} />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors resize-none ${className}`} />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pr-9 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none transition-colors">
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  DRAFT: { label: 'Draft', icon: FileText, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  PUBLISHED: { label: 'Published', icon: Globe, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ARCHIVED: { label: 'Archived', icon: Archive, color: 'bg-neutral-600/20 text-neutral-400 border-neutral-600/20' },
};

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [form, setForm] = useState({
    title: '', category: '', description: '', content: '', effectiveDate: '', expiryDate: '',
  });
  const [statusChange, setStatusChange] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['hr-policy-dashboard'],
    queryFn: async () => {
      const res = await api.get('/policies/dashboard');
      return res.data?.data ?? res.data;
    },
  });

  // We don't have a GET /policies/:id so we'll try to infer from audit logs or just load the form blank
  // A proper GET /policies/:id would be ideal — for now we load from dashboard logs
  // In production, add GET /policies/:id to the controller. For now pre-fill from recentLogs.

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/policies/${id}`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      if (statusChange) {
        await api.post(`/policies/${id}/status`, { status: statusChange });
      }
      router.push('/hr/policies');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update policy';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload: any = {};
    if (form.title) payload.title = form.title;
    if (form.category) payload.category = form.category;
    if (form.description !== undefined) payload.description = form.description;
    if (form.content) payload.content = form.content;
    if (form.effectiveDate) payload.effectiveDate = form.effectiveDate;
    if (form.expiryDate) payload.expiryDate = form.expiryDate;
    updateMutation.mutate(payload);
  };

  if (preview && form.title) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setPreview(false)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white mb-6 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
          </button>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2">{form.title}</h1>
            {form.description && <p className="text-sm text-neutral-400 mb-6">{form.description}</p>}
            <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap bg-neutral-950/50 rounded-xl p-6 border border-neutral-800">
              {form.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/hr/policies')} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Edit Policy</h1>
            <p className="text-xs text-neutral-500">Policy ID: {id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status Change */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
            <div>
              <FieldLabel label="Change Status" />
              <Select value={statusChange} onChange={(e) => setStatusChange(e.target.value)}>
                <option value="">— Keep current status —</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Publish</option>
                <option value="ARCHIVED">Archive</option>
              </Select>
            </div>
            <div className="ml-auto text-xs text-neutral-500 pt-5">
              Only fields you fill will be updated.
            </div>
          </div>

          {/* Core Details */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Update Details</h2>

            <div>
              <FieldLabel label="Policy Title" />
              <Input placeholder="Leave blank to keep existing title" value={form.title} onChange={set('title')} />
            </div>

            <div>
              <FieldLabel label="Category" />
              <Select value={form.category} onChange={set('category')}>
                <option value="">— Keep existing category —</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>

            <div>
              <FieldLabel label="Short Description" />
              <Input placeholder="Leave blank to keep existing description" value={form.description} onChange={set('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Effective Date" />
                <Input type="date" value={form.effectiveDate} onChange={set('effectiveDate')} />
              </div>
              <div>
                <FieldLabel label="Expiry Date" />
                <Input type="date" value={form.expiryDate} onChange={set('expiryDate')} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Policy Content</h2>
              <button type="button" onClick={() => setPreview(true)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>
            <p className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
              ⚠ Saving new content will auto-increment the policy version and archive the previous version.
            </p>
            <Textarea rows={14} placeholder="Leave blank to keep existing content, or enter new text to create a new version." value={form.content} onChange={set('content')} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/hr/policies')} className="flex-1 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-300">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
