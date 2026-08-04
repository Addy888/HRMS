'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [error, setError] = React.useState('');

  const changeMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await api.post('/auth/change-password', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      // Update mustChangePassword flag in store
      if (user) {
        useAuthStore.getState().setAuth(
          localStorage.getItem('fcs_token') || '',
          { ...user, mustChangePassword: false }
        );
        localStorage.setItem('fcs_user', JSON.stringify({ ...user, mustChangePassword: false }));
      }

      if (user?.role === 'HR') {
        router.push('/hr');
      } else {
        router.push('/employee');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to change password';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required'); return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match'); return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from the current one'); return;
    }
    changeMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-amber-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-900/40 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white">Change Your Password</h1>
          <p className="text-sm text-neutral-400 mt-1">
            A new password is required before you continue.
          </p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-amber-400/80 font-medium text-center">
            🔐 For your security, please set a strong personal password to replace your temporary credentials.
          </p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Current Password (Temporary)', value: currentPassword, onChange: setCurrentPassword, id: 'current-pw', show: true },
              { label: 'New Password', value: newPassword, onChange: setNewPassword, id: 'new-pw', show: showNew, toggle: () => setShowNew(v => !v) },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, id: 'confirm-pw', show: showNew },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{field.label}</label>
                <div className="relative">
                  <input
                    id={field.id}
                    type={field.show ? 'text' : 'password'}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  {field.toggle && (
                    <button type="button" onClick={field.toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                      {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-medium animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={changeMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/30 mt-2"
            >
              {changeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating password...</>
              ) : 'Set New Password & Continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          © {new Date().getFullYear()} FCS · Secure Enterprise HRMS
        </p>
      </div>
    </div>
  );
}
