'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import {
  Shield, CheckCircle2, AlertCircle, Loader2, ArrowLeft,
  User, Calendar, Clock, Monitor, Hash, FileCheck
} from 'lucide-react';

const DECLARATION_TEXT = `I hereby confirm that I have read, understood, and accepted all company policies assigned to me by FCS (Fovus Corporate Solutions).

I agree to follow all company rules, regulations, and policies outlined in these documents. I understand that violation of any company policy may result in disciplinary action, up to and including termination of employment.

I acknowledge that:
1. I have read each policy document in full.
2. I understand my responsibilities and obligations as an employee.
3. I will comply with all policies in the performance of my duties.
4. I will report any violations I become aware of to the appropriate authority.

This digital acknowledgement serves as my binding agreement to adhere to all policies.`;

export default function FinalAcknowledgementPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState('');
  const [checked, setChecked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [currentTime] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['employee-policies'],
    queryFn: async () => {
      const res = await api.get('/policies/assigned');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const total = policies.length;
  const accepted = policies.filter((p: any) => p.accepted).length;
  const allAccepted = total > 0 && accepted === total;
  const pending = total - accepted;

  const ackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/policies/acknowledge', { fullName });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!checked) { setError('Please tick the confirmation checkbox.'); return; }
    if (!allAccepted) { setError('You must accept all assigned policies before submitting.'); return; }
    ackMutation.mutate();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
          {/* Success icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-50" />
            <div className="relative w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white font-heading">Acknowledgement Complete!</h1>
            <p className="text-sm text-neutral-400">
              Your digital signature has been recorded. Onboarding is complete pending HR verification.
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-left space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Acknowledgement Summary</h3>
            {[
              { label: 'Full Name', value: fullName },
              { label: 'Date', value: currentDate },
              { label: 'Time', value: currentTime },
              { label: 'Policies Accepted', value: `${accepted} of ${total}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{item.label}</span>
                <span className="text-xs text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/employee" className="flex-1 py-2.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 rounded-xl text-xs font-bold text-neutral-300 transition-colors text-center">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/employee/policies" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Final Acknowledgement</h1>
            <p className="text-xs text-neutral-500">Onboarding Step 4 of 5</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center">
            {[
              { label: 'Profile', n: 1 },
              { label: 'Documents', n: 2 },
              { label: 'Policies', n: 3 },
              { label: 'Sign-off', n: 4, active: true },
              { label: 'Verified', n: 5 },
            ].map((step, i) => (
              <React.Fragment key={step.n}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    step.active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : step.n < 4 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}>
                    {step.n < 4 ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                  </div>
                  <span className={`text-[9px] font-semibold ${step.active ? 'text-blue-400' : step.n < 4 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                    {step.label}
                  </span>
                </div>
                {i < 4 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step.n < 4 ? 'bg-emerald-500/30' : 'bg-neutral-800'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Policies status check */}
        {!allAccepted && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Policies Incomplete</p>
              <p className="text-xs text-neutral-400 mt-1">
                You have {pending} pending {pending === 1 ? 'policy' : 'policies'} to accept before you can proceed with the final acknowledgement.
              </p>
              <Link href="/employee/policies" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300">
                Review Pending Policies →
              </Link>
            </div>
          </div>
        )}

        {/* Declaration Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-neutral-800 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Official Declaration</h2>
              <p className="text-[10px] text-neutral-500">Read carefully before signing</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-neutral-500">Policies Accepted</p>
              <p className="text-sm font-bold text-white">{accepted} / {total}</p>
            </div>
          </div>

          {/* Declaration text */}
          <div className="p-6">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-xs text-neutral-300 leading-[1.85] whitespace-pre-wrap font-mono">
              {DECLARATION_TEXT}
            </div>
          </div>
        </div>

        {/* Metadata preview */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Digital Record (Auto-captured)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: 'Date', value: currentDate },
              { icon: Clock, label: 'Time', value: currentTime },
              { icon: FileCheck, label: 'Policies', value: `${accepted} accepted` },
              { icon: Hash, label: 'Status', value: allAccepted ? '✓ Ready to Sign' : `${pending} pending` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 bg-neutral-950 rounded-xl p-3">
                <item.icon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-600 font-semibold uppercase">{item.label}</p>
                  <p className="text-xs text-white font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Form */}
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Your Digital Signature</h3>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              Full Name (as per employment records) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Type your full legal name"
                disabled={!allAccepted}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-600 font-semibold uppercase">Date & Time</p>
              <p className="text-xs text-neutral-300 font-semibold">{currentDate} · {currentTime}</p>
            </div>
            <p className="ml-auto text-[10px] text-neutral-600 italic">Auto-captured</p>
          </div>

          {/* Checkbox */}
          <label className={`flex items-start gap-3 cursor-pointer group p-4 rounded-xl border transition-all ${checked ? 'bg-blue-500/5 border-blue-500/30' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'} ${!allAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-neutral-600 group-hover:border-blue-500'}`}>
              {checked && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
            </div>
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={!allAccepted} />
            <p className="text-xs text-neutral-300 leading-relaxed">
              I confirm that I have read, understood and agree to all the terms mentioned in this declaration and in all company policies assigned to me.
            </p>
          </label>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!allAccepted || !checked || !fullName.trim() || ackMutation.isPending}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              allAccepted && checked && fullName.trim()
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/30'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            {ackMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Declaration…</>
            ) : (
              <><Shield className="w-4 h-4" /> Submit Final Acknowledgement</>
            )}
          </button>

          <p className="text-[10px] text-neutral-600 text-center">
            Your name, date, time, IP address, and browser information will be recorded with this submission.
          </p>
        </form>
      </div>
    </div>
  );
}
