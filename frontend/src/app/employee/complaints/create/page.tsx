'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  LifeBuoy,
  ArrowLeft,
  Upload,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'HR_ISSUE', label: 'HR Issue' },
  { value: 'SALARY_ISSUE', label: 'Salary Issue' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'LEAVE', label: 'Leave' },
  { value: 'MANAGER', label: 'Manager Relationship' },
  { value: 'IT_SUPPORT', label: 'IT Support' },
  { value: 'PAYROLL', label: 'Payroll Query' },
  { value: 'DOCUMENT_VERIFICATION', label: 'Documents' },
  { value: 'WORK_ENVIRONMENT', label: 'Work Environment' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'POSH', label: 'POSH Policy Issue' },
  { value: 'ASSET_ISSUE', label: 'Asset Allocation' },
  { value: 'SYSTEM_BUG', label: 'System Bug' },
  { value: 'OTHER', label: 'Other Concerns' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'Non-urgent query' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Regular priority' },
  { value: 'HIGH', label: 'High', desc: 'Needs quick attention' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Urgent issue' },
];

export default function CreateComplaintPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('anonymous', String(anonymous));
      if (file) {
        formData.append('file', file);
      }

      const response = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Complaint filed successfully!');
      router.push('/employee/complaints');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to file complaint');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    createMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <EmployeeLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Helpdesk
          </button>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-blue-500" />
            File a Complaint
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Submit your issue or concern to the HR team
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Priority <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      priority === p.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{p.label}</div>
                    <div className="text-xs text-neutral-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject & Description */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your issue"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about your issue..."
                rows={6}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Attachment (Optional)
            </label>
            <p className="text-xs text-neutral-500 mb-4">
              Upload supporting documents, screenshots, or evidence (Max 10MB)
            </p>

            {file ? (
              <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{file.name}</div>
                    <div className="text-xs text-neutral-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-neutral-800 rounded-xl p-8 text-center hover:border-neutral-700 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    PNG, JPG, PDF, DOC up to 10MB
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1 w-4 h-4 bg-neutral-950 border-neutral-800 rounded"
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Submit Anonymously
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Your identity will be hidden from the ticket. Only HR admins can see your details.
                </p>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-300">
              <strong className="text-white">Note:</strong> Your complaint will be reviewed by the HR team.
              You'll receive updates via notifications and can track the status in your helpdesk dashboard.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <LifeBuoy className="w-4 h-4" />
                  File Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </EmployeeLayout>
  );
}
