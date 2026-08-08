'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tantml:react-query';
import api from '@/lib/api';
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  // Extract token from query param if present
  React.useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const resetMutation = useMutation({
    mutationFn: async (payload: { resetToken: string; newPassword: string }) => {
      const res = await api.post('/auth/reset-password', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      setSuccess('Your password has been successfully reset! You can now log in.');
      setError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    resetMutation.mutate({ resetToken: token, newPassword });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-white">Reset Password</h2>
          <p className="text-xs text-neutral-500">Enter your new credentials</p>
        </div>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 leading-relaxed">
              <p className="font-semibold text-emerald-400">Password Updated</p>
              <p className="mt-1">{success}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Back to Login Selection
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Reset Token</label>
            <input
              type="text"
              placeholder="Enter the reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">New Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20"
          >
            {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {resetMutation.isPending ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-350 transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </button>

        <Suspense
          fallback={
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
