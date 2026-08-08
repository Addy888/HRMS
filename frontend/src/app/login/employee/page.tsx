'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Eye, EyeOff, Loader2, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OtpVerification from '@/components/auth/OtpVerification';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [error, setError] = React.useState('');

  // OTP flow state
  const [requiresOtp, setRequiresOtp] = React.useState(false);
  const [userId, setUserId] = React.useState('');
  const [maskedPhone, setMaskedPhone] = React.useState('');
  const [userData, setUserData] = React.useState<any>(null);

  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post('/auth/login', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      if (data.user?.role !== 'EMPLOYEE') {
        setError('Invalid email or password');
        return;
      }

      // Check if OTP verification is required
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setUserId(data.userId);
        setMaskedPhone(data.maskedPhone);
        setUserData(data.user);
        setError('');
      } else {
        // Direct login for non-employee or if OTP not required
        setAuth(data.accessToken, data.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        localStorage.setItem('fcs_token', data.accessToken);
        localStorage.setItem('fcs_user', JSON.stringify(data.user));

        if (data.mustChangePassword) {
          router.push('/change-password');
        } else {
          router.push('/employee');
        }
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (payload: { userId: string; otp: string }) => {
      const res = await api.post('/auth/verify-otp', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      localStorage.setItem('fcs_token', data.accessToken);
      localStorage.setItem('fcs_user', JSON.stringify(data.user));

      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/employee');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const res = await api.post('/auth/resend-otp', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      setMaskedPhone(data.maskedPhone);
      setError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to resend OTP';
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

  const handleVerifyOtp = async (otp: string) => {
    setError('');
    verifyOtpMutation.mutate({ userId, otp });
  };

  const handleResendOtp = async () => {
    await resendOtpMutation.mutateAsync({ userId });
  };

  const handleBackToLogin = () => {
    setRequiresOtp(false);
    setUserId('');
    setMaskedPhone('');
    setUserData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!requiresOtp && (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-355 transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Selection
          </button>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          {requiresOtp ? (
            <OtpVerification
              maskedPhone={maskedPhone}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={handleBackToLogin}
              isVerifying={verifyOtpMutation.isPending}
              error={error}
              title="Verify Your Mobile Number"
              description="Enter the 6-digit verification code sent to"
            />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Employee Login</h2>
                  <p className="text-xs text-neutral-500">FCS Corporate Operations</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@fcs.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-neutral-400 uppercase">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-355"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="remember-emp"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-neutral-950 border border-neutral-800 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="remember-emp"
                    className="text-xs text-neutral-400 font-medium select-none cursor-pointer"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20"
                >
                  {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loginMutation.isPending ? 'Authenticating...' : 'Sign In as Employee'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
