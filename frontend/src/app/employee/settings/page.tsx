'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { KeyRound, Loader2, Save, CheckCircle } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function EmployeeSettingsPage() {
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const changeMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
    onSuccess: () => {
      setSuccess('Password updated successfully!');
      setError('');
      reset();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update password');
      setSuccess('');
    },
  });

  const onSubmit = (values: PasswordFormValues) => {
    changeMutation.mutate(values);
  };

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-amber-500" />
            Account Settings
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Update your account password and security preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Change Password Form */}
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Change Password</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Protect your account with a strong, custom password.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  {...register('currentPassword')}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.currentPassword && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.currentPassword.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  {...register('newPassword')}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.newPassword && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.newPassword.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.confirmPassword && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.confirmPassword.message}</span>
                )}
              </div>

              {/* Feedback banners */}
              {success && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {success}
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={changeMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
              >
                {changeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {changeMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Guidelines Sidebar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 h-max space-y-4">
            <h3 className="font-heading text-base font-bold text-white">Security Checklist</h3>
            <ul className="text-xs text-neutral-450 space-y-2 list-disc list-inside leading-relaxed">
              <li>Must be at least 6 characters in length.</li>
              <li>Avoid using easily guessable passwords (like 123456).</li>
              <li>Include numbers and special symbols for maximum strength.</li>
              <li>Never share your credentials with anyone.</li>
            </ul>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
