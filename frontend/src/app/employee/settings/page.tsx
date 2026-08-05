'use client';

import React, { useState, useEffect } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { KeyRound, Loader2, Save, CheckCircle, Bell, Volume2, Moon } from 'lucide-react';
import useNotificationStore from '@/store/notificationStore';

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
  const [activeTab, setActiveTab] = useState<'security' | 'notifications'>('security');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const {
    preferences,
    fetchPreferences,
    updatePreferences,
  } = useNotificationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

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

  const onSubmitPassword = (values: PasswordFormValues) => {
    changeMutation.mutate(values);
  };

  const handleTogglePreference = async (key: 'email' | 'inApp' | 'push' | 'sound' | 'doNotDisturb') => {
    if (!preferences) return;
    try {
      await updatePreferences({
        [key]: !preferences[key],
      });
      setSuccess('Notification preferences updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    }
  };

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Title */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-amber-500" />
            Account Settings
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Update your account password, security settings, and notification delivery options.
          </p>
        </div>

        {/* Tab switcher bar */}
        <div className="flex gap-2 border-b border-neutral-900 pb-px">
          <button
            onClick={() => { setActiveTab('security'); setSuccess(''); setError(''); }}
            className={`text-xs font-bold px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-500 text-white bg-neutral-950/20'
                : 'border-transparent text-neutral-450 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Security Settings
          </button>
          <button
            onClick={() => { setActiveTab('notifications'); setSuccess(''); setError(''); }}
            className={`text-xs font-bold px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-white bg-neutral-950/20'
                : 'border-transparent text-neutral-450 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" /> Notification Preferences
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'security' ? (
              /* Change Password Form */
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Change Password</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Protect your account with a strong, custom password.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
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

                  {success && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-450 font-medium flex items-center gap-2">
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
            ) : (
              /* Notification Preferences Form */
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Delivery Preferences</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Control where and how you get alerted about work activity.</p>
                </div>

                {!preferences ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* In App Alert Option */}
                    <div className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-400" /> In-App Notifications
                        </h4>
                        <p className="text-xs text-neutral-500">Show notification items inside the portal top drawer alert feed.</p>
                      </div>
                      <button
                        onClick={() => handleTogglePreference('inApp')}
                        className={`w-11 h-6 rounded-full p-1 transition-all ${
                          preferences.inApp ? 'bg-blue-600' : 'bg-neutral-800'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transition-all transform ${
                            preferences.inApp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Email Option */}
                    <div className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          Email Notifications
                        </h4>
                        <p className="text-xs text-neutral-500">Forward copy of alerts to your registered email account.</p>
                      </div>
                      <button
                        onClick={() => handleTogglePreference('email')}
                        className={`w-11 h-6 rounded-full p-1 transition-all ${
                          preferences.email ? 'bg-blue-600' : 'bg-neutral-800'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transition-all transform ${
                            preferences.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Sound Alert Option */}
                    <div className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-emerald-400" /> Sound Chime
                        </h4>
                        <p className="text-xs text-neutral-500">Play a pleasant synth sound when a new alert drops in real-time.</p>
                      </div>
                      <button
                        onClick={() => handleTogglePreference('sound')}
                        className={`w-11 h-6 rounded-full p-1 transition-all ${
                          preferences.sound ? 'bg-blue-600' : 'bg-neutral-800'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transition-all transform ${
                            preferences.sound ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Do Not Disturb Option */}
                    <div className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl border-dashed">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Moon className="w-4 h-4 text-indigo-400" /> Do Not Disturb (DND)
                        </h4>
                        <p className="text-xs text-neutral-500">Mute all real-time audio and floating toast alerts. Unreads compile silently.</p>
                      </div>
                      <button
                        onClick={() => handleTogglePreference('doNotDisturb')}
                        className={`w-11 h-6 rounded-full p-1 transition-all ${
                          preferences.doNotDisturb ? 'bg-indigo-600' : 'bg-neutral-800'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transition-all transform ${
                            preferences.doNotDisturb ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {success && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-450 font-medium">
                        {success}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklist Sidebar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 h-max space-y-4">
            <h3 className="font-heading text-base font-bold text-white">Guidelines</h3>
            <ul className="text-xs text-neutral-450 space-y-2.5 list-disc list-inside leading-relaxed">
              {activeTab === 'security' ? (
                <>
                  <li>Must be at least 6 characters in length.</li>
                  <li>Avoid using easily guessable passwords.</li>
                  <li>Include numbers and special symbols.</li>
                </>
              ) : (
                <>
                  <li>Muting in-app alerts will keep unread counts active but disable prompt boxes.</li>
                  <li>DND is useful when screen sharing during presentations.</li>
                  <li>Sound chime relies on Web Audio support.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
