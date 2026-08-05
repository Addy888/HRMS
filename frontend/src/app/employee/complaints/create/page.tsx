'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  ArrowLeft,
  LifeBuoy,
  Save,
  Loader2,
  FileUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'HR_ISSUE', label: 'HR Issue' },
  { value: 'SALARY_ISSUE', label: 'Salary Issue' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'LEAVE', label: 'Leave' },
  { value: 'MANAGER', label: 'Manager Relationship' },
  { value: 'IT_SUPPORT', label: 'IT Support' },
  { value: 'PAYROLL', label: 'Payroll Query' },
  { value: 'DOCUMENT_VERIFICATION', label: 'Document Verification' },
  { value: 'WORK_ENVIRONMENT', label: 'Work Environment' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'POSH', label: 'POSH Complaint' },
  { value: 'ASSET_ISSUE', label: 'Asset Issue' },
  { value: 'SYSTEM_BUG', label: 'System Bug' },
  { value: 'OTHER', label: 'Other Concerns' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical / Urgent' },
];

export default function CreateComplaintPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      router.push('/employee/complaints');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit ticket';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError('Attachment size exceeds the 10 MB limit');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !category || !priority || !description.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('description', description.trim());
    formData.append('anonymous', String(anonymous));
    if (file) {
      formData.append('file', file);
    }

    submitMutation.mutate(formData);
  };

  return (
    <EmployeeLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/employee/complaints')}
            className="w-9 h-9 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <LifeBuoy className="w-5 h-5 text-blue-500" /> Raise Support Ticket
            </h1>
            <p className="text-xs text-neutral-500">File a complaint, support request or grievance to HR.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Core Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ticket Details</h2>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                Ticket Title / Brief Subject <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your concern..."
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="">Select Category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                  Priority <span className="text-red-400">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65em_auto] bg-[right_1rem_center] bg-no-repeat"
                >
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                Detailed Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Explain your issue in detail. Provide dates, times or ticket numbers if applicable..."
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Attachment</h2>

            <div className="border border-dashed border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative group transition-all">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="w-8 h-8 text-neutral-600 mb-2 group-hover:text-blue-500 transition-colors" />
              <p className="text-xs font-bold text-neutral-350">
                {file ? file.name : 'Upload support documentation'}
              </p>
              <p className="text-[10px] text-neutral-650 mt-1">
                Supports PDF, PNG, JPG, JPEG, DOCX. Max Size: 10 MB
              </p>
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="mt-3 text-[10px] font-extrabold text-red-400 hover:underline z-10"
                >
                  Remove File
                </button>
              )}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 bg-neutral-950 border-neutral-700 focus:ring-0 cursor-pointer mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="anonymous" className="block text-xs font-bold text-neutral-200 cursor-pointer">
                Submit Anonymously
              </label>
              <p className="text-[10px] text-neutral-500 mt-1">
                Your profile details (Name, ID) will be hidden from other employees, but HR will review it securely to maintain safety and address compliance concerns.
              </p>
            </div>
          </div>

          {/* Errors */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/employee/complaints')}
              className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitMutation.isPending ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </EmployeeLayout>
  );
}
