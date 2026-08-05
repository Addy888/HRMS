'use client';

import React, { useState, useEffect } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { Megaphone, Calendar, Users, Award, BookOpen, Clock, Inbox, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface Announcement {
  id: string;
  recipientId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  read: boolean;
  author: string;
}

const getCategoryIcon = (category: string) => {
  switch (category.toUpperCase()) {
    case 'HOLIDAY_NOTICE':
      return <Calendar className="w-5 h-5 text-emerald-400" />;
    case 'MEETING_NOTICE':
      return <Clock className="w-5 h-5 text-blue-400" />;
    case 'TRAINING_NOTICE':
      return <Award className="w-5 h-5 text-purple-400" />;
    case 'COMPANY_NEWS':
      return <Megaphone className="w-5 h-5 text-amber-400" />;
    default:
      return <BookOpen className="w-5 h-5 text-indigo-400" />;
  }
};

const getCategoryLabel = (category: string) => {
  return category.replace(/_/g, ' ');
};

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/announcements');
      const data = res.data?.data ?? res.data;
      setAnnouncements(data.items || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (recipientId: string) => {
    try {
      await api.patch(`/notifications/announcements/${recipientId}/read`);
      setAnnouncements((prev) =>
        prev.map((a) => (a.recipientId === recipientId ? { ...a, read: true } : a))
      );
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-indigo-500" />
              Company Announcements
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Stay up to date with official company news, holiday schedules, and training notices.
            </p>
          </div>
          <button
            onClick={fetchAnnouncements}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-450 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-16 flex flex-col items-center justify-center text-neutral-500 gap-2">
            <div className="w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
            <span className="text-xs">Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
            <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl">
              <Inbox className="w-10 h-10 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-350">No announcements yet</h3>
              <p className="text-xs text-neutral-500 max-w-[280px] mx-auto mt-1">
                Your HR department has not posted any announcements recently. Check back later!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onMouseEnter={() => !ann.read && markRead(ann.recipientId)}
                className={`border rounded-3xl p-6 flex flex-col justify-between transition-all relative overflow-hidden ${
                  ann.read
                    ? 'border-neutral-900 bg-neutral-950/20 text-neutral-450 hover:bg-neutral-900/10'
                    : 'border-neutral-850 bg-neutral-900/20 text-neutral-100 hover:bg-neutral-900/40 shadow-xl'
                }`}
              >
                {/* Unread Indicator Glow */}
                {!ann.read && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {getCategoryIcon(ann.category)}
                      {getCategoryLabel(ann.category)}
                    </div>

                    {!ann.read && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                        New
                      </span>
                    )}
                  </div>

                  {/* Title & Content */}
                  <div className="space-y-2">
                    <h3 className={`text-lg font-bold ${ann.read ? 'text-neutral-350' : 'text-white'}`}>
                      {ann.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="border-t border-neutral-900/60 pt-4 mt-6 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Posted by {ann.author}</span>
                  </div>
                  <span className="font-mono">
                    {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
