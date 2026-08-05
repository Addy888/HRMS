'use client';

import React, { useState, useEffect } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Megaphone, Calendar, Clock, Award, BookOpen, AlertCircle, Loader2, Send } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum([
    'COMPANY_NEWS',
    'HOLIDAY_NOTICE',
    'MEETING_NOTICE',
    'TRAINING_NOTICE',
    'GENERAL_ANNOUNCEMENT'
  ]),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'HOLIDAY_NOTICE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'MEETING_NOTICE':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'TRAINING_NOTICE':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'COMPANY_NEWS':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  }
};

export default function HRAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      category: 'GENERAL_ANNOUNCEMENT',
    },
  });

  // Query: Get previous announcements
  const { data: announcementsData, isLoading: loadingHistory } = useQuery({
    queryKey: ['hr-announcements'],
    queryFn: async () => {
      const res = await api.get('/notifications/announcements');
      return res.data?.data ?? res.data;
    },
  });

  // Mutation: Publish announcement
  const publishMutation = useMutation({
    mutationFn: async (values: AnnouncementFormValues) => {
      await api.post('/notifications/announcements', values);
    },
    onSuccess: () => {
      setSuccessMsg('Announcement broadcasted successfully!');
      setErrorMsg('');
      reset();
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to broadcast announcement');
      setSuccessMsg('');
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    publishMutation.mutate(values);
  };

  const history = announcementsData?.items || [];

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Page title */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-500" />
            Announcement Manager
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Compose and broadcast critical news bulletins to all employees instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Announcement Creator Form */}
          <div className="lg:col-span-1 bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 h-max">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Create Announcement</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Fill in the details to publish a workspace news feed.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Independence Day Notice"
                  className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.title && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.title.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Category</label>
                <select
                  {...register('category')}
                  className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="GENERAL_ANNOUNCEMENT">General Announcement</option>
                  <option value="COMPANY_NEWS">Company News</option>
                  <option value="HOLIDAY_NOTICE">Holiday Notice</option>
                  <option value="MEETING_NOTICE">Meeting Notice</option>
                  <option value="TRAINING_NOTICE">Training Notice</option>
                </select>
                {errors.category && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.category.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Content Body</label>
                <textarea
                  {...register('content')}
                  rows={6}
                  placeholder="Draft your announcement message here..."
                  className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
                {errors.content && (
                  <span className="text-[11px] text-red-400 font-medium">{errors.content.message}</span>
                )}
              </div>

              {successMsg && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-450 font-medium">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={publishMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {publishMutation.isPending ? 'Publishing...' : 'Broadcast Announcement'}
              </button>
            </form>
          </div>

          {/* Previous History list */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Broadcast History</h2>
              <p className="text-xs text-neutral-500 mt-0.5">List of previously sent company notifications.</p>
            </div>

            {loadingHistory ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-12 flex flex-col items-center justify-center text-neutral-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Fetching announcement history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 py-16">
                <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <span className="text-sm font-bold">No history available</span>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                  Once you broadcast your first bulletin, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4 hover:border-neutral-800 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getCategoryBadge(ann.category)}`}>
                        {ann.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(ann.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white">{ann.title}</h3>
                      <p className="text-xs text-neutral-450 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                    </div>

                    <div className="text-[10px] text-neutral-500 border-t border-neutral-900 pt-3">
                      Broadcaster ID: {ann.author}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
