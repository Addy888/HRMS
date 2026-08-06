'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, FileText, Shield, ExternalLink } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function CompanyPolicyViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { token } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    const loadPolicyAndPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
          setError('Invalid policy ID');
          setLoading(false);
          return;
        }

        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Fetch policy metadata
        const policyResponse = await fetch(`${baseUrl}/company-policies/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!policyResponse.ok) {
          throw new Error('Failed to load policy');
        }

        const data = await policyResponse.json();
        const policyData = data?.data || data;
        
        if (!policyData) {
          setError('Policy not found');
          setLoading(false);
          return;
        }

        console.log('✅ Policy loaded');
        setPolicy(policyData);
        setLoading(false);

        // Fetch PDF with authentication and create blob URL
        console.log('📄 Fetching PDF from backend...');
        const pdfResponse = await fetch(`${baseUrl}/company-policies/${resolvedParams.id}/view`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!pdfResponse.ok) {
          console.error('❌ PDF fetch failed:', pdfResponse.status);
          throw new Error('Failed to load PDF');
        }

        console.log('✅ PDF response received, converting to blob...');
        const blob = await pdfResponse.blob();
        console.log('✅ Blob created:', blob.size, 'bytes, type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Empty PDF received');
        }

        // Create blob URL for viewing
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Blob URL created');
        setPdfBlobUrl(blobUrl);
        
        // Remove loading after a short delay to ensure iframe has time to load
        setTimeout(() => {
          setPdfLoading(false);
          console.log('✅ PDF ready to display');
        }, 500);

      } catch (err: any) {
        console.error('❌ Error:', err);
        setError(err.message || 'Failed to load policy');
        setLoading(false);
        setPdfLoading(false);
        setPdfError(true);
      }
    };

    if (token) {
      loadPolicyAndPdf();
    }

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        console.log('🧹 Blob URL cleaned up');
      }
    };
  }, [resolvedParams.id, token, baseUrl]);

  // Prevent right-click and text selection
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventSelection);
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventSelection);
    };
  }, []);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const preventShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'a'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', preventShortcuts);
    return () => document.removeEventListener('keydown', preventShortcuts);
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
    <div className="min-h-screen bg-neutral-950 flex flex-col select-none">
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
      <div className="flex-1 bg-neutral-900 p-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto h-full">
          {pdfLoading && !pdfError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-900 z-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-neutral-400">Loading document...</p>
            </div>
          )}
          
          {pdfError && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm text-neutral-400 mb-2">Unable to display PDF</p>
              <p className="text-xs text-neutral-500 mb-4">{error || 'Your browser may not support inline PDF viewing'}</p>
              {pdfBlobUrl && (
                <a
                  href={pdfBlobUrl}
                  download={policy?.fileName || 'policy.pdf'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download PDF
                </a>
              )}
            </div>
          )}
          
          {pdfBlobUrl && !pdfError && (
            <iframe
              ref={iframeRef}
              src={pdfBlobUrl}
              className="w-full h-full border border-neutral-800 rounded-lg"
              title={policy?.policyName || 'Policy Document'}
              style={{ minHeight: '700px' }}
            />
          )}
        </div>
      </div>

      {/* Watermark Overlay */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-5 z-10">
        <div className="transform -rotate-45 text-white text-6xl font-bold whitespace-nowrap">
          CONFIDENTIAL
        </div>
      </div>

      {/* Prevent print styles */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
        * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        object, embed {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}
