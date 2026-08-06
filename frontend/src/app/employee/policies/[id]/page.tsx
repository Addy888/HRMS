'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, ChevronRight, Loader2, BookOpen,
  Calendar, Hash, Tag, AlertCircle, Download
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  ATTENDANCE: 'Attendance', LEAVE: 'Leave', CODE_OF_CONDUCT: 'Code of Conduct',
  POSH: 'POSH Policy', DATA_PRIVACY: 'Data Privacy', INFO_SEC: 'Info Security',
  IT_USAGE: 'IT Usage', CONFIDENTIALITY: 'Confidentiality', NDA: 'NDA',
  REMOTE_WORK: 'Remote Work', LAPTOP_ASSET: 'Laptop & Asset',
  INTERNET_USAGE: 'Internet Usage', HANDBOOK: 'Employee Handbook',
  TRAVEL: 'Travel', MEDICAL: 'Medical', CUSTOM: 'Custom',
};

export default function PolicyReaderPage() {
  const router = useRouter();
  const params = useParams();
  const qc = useQueryClient();
  const id = params?.id as string;

  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  // Fetch all assigned policies to find this one
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['employee-policies'],
    queryFn: async () => {
      const res = await api.get('/policies/assigned');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const policy = policies.find((p: any) => p.id === id);

  // Track scroll progress on the content area
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setScrollPct(Math.min(100, pct));
    if (pct >= 90) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, policy]);

  // If content is short enough to not need scroll
  useEffect(() => {
    const el = contentRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 20) {
      setHasScrolledToBottom(true);
      setScrollPct(100);
    }
  }, [policy]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/policies/${id}/accept`, { versionAccepted: policy?.version ?? 1 });
    },
    onSuccess: async () => {
      setAccepted(true);
      // Invalidate queries to update the main list immediately
      await qc.invalidateQueries({ queryKey: ['employee-policies'] });

      // Navigate to next pending policy or back to list
      const nextPending = policies.find((p: any) => !p.accepted && p.id !== id);
      setTimeout(() => {
        if (nextPending) {
          router.push(`/employee/policies/${nextPending.id}`);
        } else {
          router.push('/employee/policies');
        }
      }, 1800);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-semibold">Policy not found or not assigned to you.</p>
          <Link href="/employee/policies" className="text-blue-400 text-sm hover:underline">← Back to Policies</Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    const nextPending = policies.find((p: any) => !p.accepted && p.id !== id);
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Policy Accepted!</h2>
          <p className="text-sm text-neutral-400">
            You've accepted <strong className="text-white">{policy.title}</strong>.
            {nextPending ? ' Loading next policy…' : ' All policies done!'}
          </p>
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const canAccept = hasScrolledToBottom && acknowledged && !policy.accepted;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-neutral-900/80 border-b border-neutral-800 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/employee/policies" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All Policies
          </Link>
          <div className="h-4 w-px bg-neutral-700" />
          <p className="text-xs text-neutral-400 truncate flex-1">{policy.title}</p>

          {/* Scroll progress */}
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-semibold">
            <div className="w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scrollPct}%` }} />
            </div>
            {scrollPct}% read
          </div>

          {policy.accepted && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" /> Accepted v{policy.versionAccepted}
            </span>
          )}
        </div>

        {/* Thin scroll progress bar */}
        <div className="h-0.5 bg-neutral-800">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 space-y-5">
        {/* Policy meta */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-800 rounded-lg px-2 py-0.5 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {policy.policyNumber}
                </span>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-0.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {CATEGORY_LABELS[policy.category] || policy.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-600">Version {policy.version}</span>
              </div>
              <h1 className="text-2xl font-bold text-white font-heading">{policy.title}</h1>
              {policy.description && (
                <p className="text-sm text-neutral-400 mt-2">{policy.description}</p>
              )}
            </div>
          </div>

          {policy.effectiveDate && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-4">
              <Calendar className="w-3.5 h-3.5" />
              Effective from: <span className="text-neutral-300">{new Date(policy.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Instruction banner */}
        {!policy.accepted && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-300 font-medium">
              Please read the complete policy below. The acceptance checkbox will appear after you scroll to the bottom.
            </p>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-y-auto"
          style={{ maxHeight: '55vh' }}
        >
          <div className="p-8">
            <div className="text-sm text-neutral-300 leading-[1.85] whitespace-pre-wrap font-[Inter]">
              {policy.content}
            </div>

            {/* Fade sentinel — appears at bottom */}
            <div className="mt-8 pt-6 border-t border-neutral-800/60">
              <p className="text-xs text-neutral-600 text-center italic">— End of Policy Document —</p>
            </div>
          </div>
        </div>

        {/* Acceptance panel */}
        <div className={`bg-neutral-900 border rounded-2xl p-5 transition-all duration-300 ${hasScrolledToBottom ? 'border-blue-500/30' : 'border-neutral-800 opacity-60'}`}>
          {!hasScrolledToBottom && (
            <p className="text-xs text-neutral-500 text-center flex items-center justify-center gap-2">
              <span className="animate-bounce">↓</span>
              Scroll to the bottom of the policy to enable acceptance
              <span className="animate-bounce">↓</span>
            </p>
          )}

          {hasScrolledToBottom && !policy.accepted && (
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${acknowledged ? 'bg-blue-600 border-blue-600' : 'border-neutral-600 group-hover:border-blue-500'}`}>
                  {acknowledged && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                <p className="text-sm text-neutral-300 leading-relaxed">
                  I have read and understood this policy — <strong className="text-white">{policy.title}</strong>.
                  I agree to comply with all the terms and conditions stated herein.
                </p>
              </label>

              <button
                onClick={() => acceptMutation.mutate()}
                disabled={!canAccept || acceptMutation.isPending}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  canAccept
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                {acceptMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Acceptance…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Accept Policy</>
                )}
              </button>
            </div>
          )}

          {policy.accepted && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400">Policy Accepted</p>
                <p className="text-xs text-neutral-500">
                  You accepted version {policy.versionAccepted} on {policy.acceptedAt ? new Date(policy.acceptedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <Link href="/employee/policies" className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold">
                Back to List <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
