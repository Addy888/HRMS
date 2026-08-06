'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AlertCircle, Loader2, FileText, Shield } from 'lucide-react';

export default function CompanyPolicyViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate ID
        if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
          setError('Invalid policy ID');
          setLoading(false);
          return;
        }

        // Fetch policy details
        const res = await api.get(`/company-policies/${resolvedParams.id}`);
        const policyData = res.data?.data || res.data;
        
        if (!policyData) {
          setError('Policy not found');
          setLoading(false);
          return;
        }

        setPolicy(policyData);
        
        // Set PDF URL for viewing
        setPdfUrl(`${api.defaults.baseURL}/company-policies/${resolvedParams.id}/view`);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading policy:', err);
        if (err.response?.status === 404) {
          setError('Policy not found');
        } else {
          setError('Failed to load policy. Please try again.');
        }
        setLoading(false);
      }
    };

    loadPolicy();
  }, [resolvedParams.id]);

  // Prevent right-click
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu);
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-neutral-400">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Policy Not Found</h2>
          <p className="text-sm text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{policy.policyName}</h1>
              <p className="text-xs text-neutral-400">Version {policy.version} • Secure Viewer</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-500/5 border-b border-amber-500/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-amber-400">
          <Shield className="w-4 h-4" />
          <span className="font-semibold">Secure Document:</span>
          <span>This document is confidential. Downloading, printing, and copying are disabled.</span>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-neutral-900 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <iframe
            src={pdfUrl}
            className="w-full h-full border border-neutral-800 rounded-lg"
            title="Company Policy Document"
            style={{
              minHeight: 'calc(100vh - 200px)',
            }}
          />
        </div>
      </div>

      {/* Watermark Overlay (Subtle) */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <div className="transform -rotate-45 text-white text-6xl font-bold whitespace-nowrap">
          CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
