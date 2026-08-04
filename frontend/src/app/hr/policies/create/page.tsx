'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FileText, ArrowLeft, Loader2, Save, Eye, ChevronDown } from 'lucide-react';

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

const TARGET_TYPES = [
  { value: 'ALL', label: 'All Employees' },
  { value: 'DEPARTMENT', label: 'By Department' },
  { value: 'DESIGNATION', label: 'By Designation' },
  { value: 'EMPLOYEE', label: 'Specific Employee' },
];

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors resize-none ${className}`}
    />
  );
}

function Select({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pr-9 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none transition-colors ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
    </div>
  );
}

export default function CreatePolicyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    policyNumber: '',
    category: '',
    description: '',
    content: '',
    effectiveDate: '',
    expiryDate: '',
    targetType: 'ALL',
    targetId: '',
  });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [publishAfter, setPublishAfter] = useState(false);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['designations-list'],
    queryFn: async () => {
      const res = await api.get('/designations');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees');
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : list.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/policies', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async (policy) => {
      // Assign target
      if (form.targetType !== 'ALL' || policy?.id) {
        await api.post(`/policies/${policy.id}/assign`, {
          targetType: form.targetType,
          targetId: form.targetId || undefined,
        });
      }
      // Optionally publish immediately
      if (publishAfter && policy?.id) {
        await api.post(`/policies/${policy.id}/status`, { status: 'PUBLISHED' });
      }
      router.push('/hr/policies');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create policy';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.policyNumber || !form.category || !form.content) {
      setError('Title, Policy Number, Category and Content are required.');
      return;
    }
    const payload: any = {
      title: form.title,
      policyNumber: form.policyNumber,
      category: form.category,
      content: form.content,
    };
    if (form.description) payload.description = form.description;
    if (form.effectiveDate) payload.effectiveDate = form.effectiveDate;
    if (form.expiryDate) payload.expiryDate = form.expiryDate;
    createMutation.mutate(payload);
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setPreview(false)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white mb-6 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
          </button>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-neutral-500 font-semibold">{form.policyNumber} · {CATEGORIES.find(c => c.value === form.category)?.label}</p>
                <h1 className="text-2xl font-bold text-white mt-1">{form.title || 'Untitled Policy'}</h1>
                {form.description && <p className="text-sm text-neutral-400 mt-2">{form.description}</p>}
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold">DRAFT</span>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap bg-neutral-950/50 rounded-xl p-6 border border-neutral-800">
                {form.content || <span className="text-neutral-600 italic">No content yet…</span>}
              </div>
            </div>
            {form.effectiveDate && (
              <p className="text-xs text-neutral-500 mt-4">Effective from: <span className="text-white">{form.effectiveDate}</span></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/hr/policies')} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Create Policy</h1>
            <p className="text-xs text-neutral-500">New policy will be saved as Draft</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Core Details Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Policy Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Policy Title" required />
                <Input placeholder="e.g. Remote Work Policy 2026" value={form.title} onChange={set('title')} />
              </div>
              <div>
                <FieldLabel label="Policy Number" required />
                <Input placeholder="e.g. POL-009" value={form.policyNumber} onChange={set('policyNumber')} />
              </div>
            </div>

            <div>
              <FieldLabel label="Category" required />
              <Select value={form.category} onChange={set('category')}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>

            <div>
              <FieldLabel label="Short Description" />
              <Input placeholder="One-line summary of this policy" value={form.description} onChange={set('description')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Content Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Policy Content</h2>
              <button type="button" onClick={() => setPreview(true)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>
            <FieldLabel label="Full Policy Text" required />
            <Textarea
              rows={16}
              placeholder="Enter the complete policy content here. Use plain text — employees will see this in a formatted reader."
              value={form.content}
              onChange={set('content')}
            />
            <p className="text-[10px] text-neutral-600">
              Tip: Structure with clear headings (e.g. 1. Purpose, 2. Scope, 3. Policy Details, 4. Consequences).
            </p>
          </div>

          {/* Assignment Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Assign To</h2>

            <div>
              <FieldLabel label="Target Scope" />
              <Select value={form.targetType} onChange={set('targetType')}>
                {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>

            {form.targetType === 'DEPARTMENT' && (
              <div>
                <FieldLabel label="Select Department" />
                <Select value={form.targetId} onChange={set('targetId')}>
                  <option value="">Select department…</option>
                  {(Array.isArray(departments) ? departments : []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
            )}
            {form.targetType === 'DESIGNATION' && (
              <div>
                <FieldLabel label="Select Designation" />
                <Select value={form.targetId} onChange={set('targetId')}>
                  <option value="">Select designation…</option>
                  {(Array.isArray(designations) ? designations : []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
            )}
            {form.targetType === 'EMPLOYEE' && (
              <div>
                <FieldLabel label="Select Employee" />
                <Select value={form.targetId} onChange={set('targetId')}>
                  <option value="">Select employee…</option>
                  {(Array.isArray(employees) ? employees : []).map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </Select>
              </div>
            )}
          </div>

          {/* Publish Option */}
          <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
            <input type="checkbox" id="publish-now" checked={publishAfter} onChange={(e) => setPublishAfter(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 bg-neutral-950 border-neutral-700 focus:ring-0 cursor-pointer" />
            <label htmlFor="publish-now" className="text-xs text-neutral-300 font-medium cursor-pointer">
              Publish immediately after creation (make available to employees)
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/hr/policies')} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {createMutation.isPending ? 'Creating…' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
