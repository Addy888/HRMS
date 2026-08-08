'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import OtpVerification from '@/components/auth/OtpVerification';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  // OTP flow state
  const [requiresOtp, setRequiresOtp] = React.useState(false);
  const [maskedPhone, setMaskedPhone] = React.useState('');
  const [resetToken, setResetToken] = React.useState('');

  const forgotMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await api.post('/auth/forgot-password', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      if (data.requiresOtp) {
        // Employee - needs OTP verification
        setRequiresOtp(true);
        setMaskedPhone(data.maskedPhone);
        setError('');
      } else {
        // HR/Admin - uses token-based reset
        setSuccess(
          data.message ||
            'Reset instructions have been logged to the server terminal. In production, an email is sent.',
        );
        setError('');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to submit request';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const res = await api.post('/auth/verify-reset-otp', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      setResetToken(data.resetToken);
      setError('');
      // Redirect to reset password page with token
      router.push(`/reset-password?token=${data.resetToken}&email=${email}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await api.post('/auth/resend-reset-otp', payload);
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
    setSuccess('');
    if (!email) {
      setError('Email address is required.');
      return;
    }
    forgotMutation.mutate({ email });
  };

  const handleVerifyOtp = async (otp: string) => {
    setError('');
    verifyOtpMutation.mutate({ email, otp });
  };

  const handleResendOtp = async () => {
    await resendOtpMutation.mutateAsync({ email });
  };

  const handleBackToEmail = () => {
    setRequiresOtp(false);
    setMaskedPhone('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!requiresOtp && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-350 transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {requiresOtp ? (
            <OtpVerification
              maskedPhone={maskedPhone}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={handleBackToEmail}
              isVerifying={verifyOtpMutation.isPending}
              error={error}
              title="Verify Your Mobile Number"
              description="Enter the 6-digit verification code sent to"
            />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-neutral-500">Recover your account credentials</p>
                </div>
              </div>

              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-300 leading-relaxed">
                      <p className="font-semibold text-emerald-400">Request Sent Successfully</p>
                      <p className="mt-1">{success}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/reset-password')}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold transition-colors border border-neutral-700"
                  >
                    Proceed to Enter Reset Token
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Enter your registered corporate email address. Employees will receive an OTP on their
                    registered mobile number.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400 uppercase">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="you@fcs.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotMutation.isPending}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/20"
                  >
                    {forgotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {forgotMutation.isPending ? 'Sending...' : 'Request Password Reset'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
