'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/layouts/HRLayout';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Users,
  Clock,
} from 'lucide-react';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  employeesFound: number;
  employeesNotFound: number;
  results: any[];
  warnings: string[];
  sessionId: string;
}

export default function ImportAttendancePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  // Download template mutation
  const downloadTemplate = async () => {
    const response = await api.get('/attendance/import/template', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Attendance_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Upload and preview mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/attendance/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setPreview(data);
      setStep('preview');
    },
  });

  // Confirm import mutation
  const confirmMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post('/attendance/import/confirm', {
        sessionId,
        fileId: sessionId,
      });
      return res.data;
    },
    onSuccess: () => {
      setStep('complete');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleConfirm = () => {
    if (preview?.sessionId) {
      confirmMutation.mutate(preview.sessionId);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setStep('upload');
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Upload className="w-8 h-8 text-blue-500" /> Import Attendance
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Upload Excel file to import employee attendance records
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-10 h-10 text-blue-400" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Select Excel File
                </h2>
                <p className="text-sm text-neutral-400">
                  Upload an Excel file (.xlsx or .xls) containing attendance data
                </p>
              </div>

              <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-8 hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-12 h-12 text-neutral-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Excel files only (Max 5MB)
                    </p>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Preview
                  </>
                )}
              </button>

              {uploadMutation.isError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-red-400">
                    {(uploadMutation.error as any)?.response?.data?.message || 'Failed to upload file'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase">Total Rows</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{preview.totalRows}</p>
                  </div>
                  <FileText className="w-8 h-8 text-neutral-600" />
                </div>
              </div>
              <div className="bg-neutral-900 border border-emerald-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-500 font-bold uppercase">Valid Rows</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">{preview.validRows}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-500 font-bold uppercase">Invalid Rows</p>
                    <p className="text-2xl font-extrabold text-red-400 mt-1">{preview.invalidRows}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-neutral-900 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-500 font-bold uppercase">Duplicates</p>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">{preview.duplicateRows}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-400 mb-2">Warnings</p>
                    <ul className="space-y-1">
                      {preview.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-amber-300/80">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800">
                <h2 className="text-sm font-bold text-white">Preview Results</h2>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-neutral-900/50 sticky top-0">
                    <tr>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Row</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Employee ID</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Name</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Date</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Check In</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Check Out</th>
                      <th className="text-left text-[10px] font-bold text-neutral-500 uppercase px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {preview.results.map((result, idx) => (
                      <tr key={idx} className={!result.success ? 'bg-red-500/5' : result.isDuplicate ? 'bg-amber-500/5' : ''}>
                        <td className="px-4 py-3 text-xs text-neutral-400">{result.rowNumber}</td>
                        <td className="px-4 py-3 text-xs font-mono text-white">{result.employeeId}</td>
                        <td className="px-4 py-3 text-xs text-neutral-300">{result.employeeName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-neutral-300">{result.date}</td>
                        <td className="px-4 py-3 text-xs text-neutral-300">{result.checkIn || '—'}</td>
                        <td className="px-4 py-3 text-xs text-neutral-300">{result.checkOut || '—'}</td>
                        <td className="px-4 py-3">
                          {result.success ? (
                            result.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg text-[9px] font-bold">
                                <AlertCircle className="w-3 h-3" />
                                DUPLICATE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                VALID
                              </span>
                            )
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-lg text-[9px] font-bold w-fit">
                                <XCircle className="w-3 h-3" />
                                ERROR
                              </span>
                              <span className="text-[10px] text-red-400/70">{result.error}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={preview.validRows === 0 || confirmMutation.isPending}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Import ({preview.validRows} Records)
                  </>
                )}
              </button>
            </div>

            {confirmMutation.isError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-400">
                  {(confirmMutation.error as any)?.response?.data?.message || 'Failed to import attendance'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Import Successful!
                </h2>
                <p className="text-sm text-neutral-400">
                  Attendance records have been imported successfully
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl font-semibold text-white transition-colors"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => router.push('/hr/attendance/import/history')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  View Import History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
}
