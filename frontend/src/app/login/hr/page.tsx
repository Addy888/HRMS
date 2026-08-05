'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Eye, EyeOff, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// HR portal accepts: HR and Super Admin roles (both are administrative roles)
const HR_PORTAL_ROLES = ['HR', 'Super Admin'];

export default function HRLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [error, setError] = React.useState('');

  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post('/auth/login', payload);
      // TransformInterceptor wraps response: { success, statusCode, data: <payload> }
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      // Role check: only HR and Super Admin can access the HR portal
      // This is a UX guard — backend RBAC is the real security layer
      if (!HR_PORTAL_ROLES.includes(data.user?.role)) {
        setError('Invalid email or password');
        return;
      }

      // Persist auth state
      setAuth(data.accessToken, data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      localStorage.setItem('fcs_token', data.accessToken);
      localStorage.setItem('fcs_user', JSON.stringify(data.user));

      // Redirect
      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/hr');
      }
    },
    onError: (err: any) => {
      // Show exact backend error or generic fallback
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid email or password';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Both email and password are required.');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Selection
        </button>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">HR Admin Login</h2>
              <p className="text-xs text-neutral-500">FCS Corporate Operations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Email Address</label>
              <input
                id="hr-email"
                type="email"
                placeholder="hr@fcs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="hr-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="hr-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-neutral-950 border border-neutral-800 rounded text-blue-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="hr-remember" className="text-xs text-neutral-400 font-medium select-none cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <button
              id="hr-login-btn"
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/20"
            >
              {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loginMutation.isPending ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
