'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';

interface OtpVerificationProps {
  maskedPhone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  isVerifying: boolean;
  error: string;
  title?: string;
  description?: string;
}

export default function OtpVerification({
  maskedPhone,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  error,
  title = 'Verify Your Mobile Number',
  description = 'Enter the 6-digit verification code sent to',
}: OtpVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only process if it's exactly 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      
      // Auto-submit on paste
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const otpString = otpValue || otp.join('');
    if (otpString.length !== 6) return;
    await onVerify(otpString);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(60); // 60 seconds cooldown
      setOtp(['', '', '', '', '', '']); // Clear OTP inputs
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-neutral-500">FCS Security Verification</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-neutral-400 leading-relaxed">
            {description}
          </p>
          <p className="text-sm font-bold text-emerald-400">{maskedPhone}</p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isVerifying}
              className="w-12 h-14 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={!isComplete || isVerifying}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>

        {/* Resend OTP */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-neutral-600 disabled:cursor-not-allowed font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isVerifying}
              className="text-xs text-neutral-500 hover:text-neutral-350 disabled:opacity-50 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          )}
        </div>
      </div>

      <div className="text-center text-[10px] text-neutral-600 leading-relaxed">
        🔒 OTP is valid for 5 minutes. Never share your OTP with anyone.
      </div>
    </div>
  );
}
