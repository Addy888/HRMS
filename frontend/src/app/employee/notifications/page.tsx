'use client';

import React, { useState, useEffect } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import {
  Bell, Search, Filter, Check, Trash2, ShieldAlert,
  FileText, MessageSquare, Sparkles, Inbox, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import useNotificationStore, { NotificationItem } from '@/store/notificationStore';
import Link from 'next/link';

const getModuleIcon = (module: string) => {
  switch (module.toUpperCase()) {
    case 'AUTH':
      return <ShieldAlert className="w-5 h-5 text-amber-500" />;
    case 'DOCUMENT':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'COMPLAINT':
      return <MessageSquare className="w-5 h-5 text-rose-500" />;
    case 'POLICY':
      return <Sparkles className="w-5 h-5 text-emerald-500" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-500" />;
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-400 border-red-500/25';
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
    case 'LOW':
      return 'bg-neutral-800 text-neutral-450 border-neutral-700/50';
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
  }
};

export default function NotificationsCenterPage() {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
    unreadCount
  } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadNotifications = async (targetPage = 1) => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (selectedModule) filters.module = selectedModule;
    if (selectedPriority) filters.priority = selectedPriority;
    if (readFilter === 'UNREAD') filters.read = false;
    if (readFilter === 'READ') filters.read = true;

    const data = await fetchNotifications(targetPage, 10, filters);
    if (data?.meta) {
      setTotalPages(data.meta.totalPages || 1);
    }
  };

  useEffect(() => {
    loadNotifications(page);
  }, [page, readFilter, selectedModule, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadNotifications(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedModule('');
    setSelectedPriority('');
    setReadFilter('ALL');
    setPage(1);
  };

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              Notification Center
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              View, search, and manage your support alerts, compliance guidelines, and HR notices.
            </p>
          </div>

          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-sm font-bold rounded-xl text-neutral-250 transition-all hover:text-white"
              >
                <Check className="w-4 h-4 text-emerald-500" /> Mark all read
              </button>
            )}
            <button
              onClick={() => { setPage(1); loadNotifications(1); }}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-450 hover:text-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 h-max space-y-6">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Filters
            </h3>

            {/* Read / Unread Status Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Status</label>
              <div className="flex flex-col gap-1.5">
                {(['ALL', 'UNREAD', 'READ'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setReadFilter(mode); setPage(1); }}
                    className={`w-full text-left text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                      readFilter === mode
                        ? 'bg-neutral-900 border border-neutral-800 text-white'
                        : 'text-neutral-450 hover:text-white hover:bg-neutral-900/50 border border-transparent'
                    }`}
                  >
                    {mode === 'ALL' ? 'All Alerts' : mode === 'UNREAD' ? 'Unread Only' : 'Read Only'}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
                className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Modules</option>
                <option value="AUTH">Authentication</option>
                <option value="EMPLOYEE">Employee Details</option>
                <option value="DOCUMENT">Documents</option>
                <option value="POLICY">Policies</option>
                <option value="COMPLAINT">Helpdesk</option>
                <option value="SYSTEM">System Notices</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
                className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-bold text-neutral-450 hover:text-white rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>

          {/* List Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search notifications by title or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-24 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all"
              >
                Search
              </button>
            </form>

            {/* Cards container */}
            <div className="space-y-3.5">
              {loading && notifications.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-16 flex flex-col items-center justify-center text-neutral-500 gap-2">
                  <div className="w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                  <span className="text-xs">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
                  <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl">
                    <Inbox className="w-10 h-10 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-350">Inbox clean!</h3>
                    <p className="text-xs text-neutral-500 max-w-[280px] mx-auto mt-1">
                      No notifications matched your query parameters. Let's try adjusting them.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !item.read && markAsRead(item.id)}
                    className={`border rounded-2xl p-5 flex gap-4 relative transition-all group cursor-pointer ${
                      item.read
                        ? 'border-neutral-900 bg-neutral-950/20 text-neutral-450 hover:bg-neutral-900/20'
                        : 'border-neutral-800 bg-neutral-900/30 text-neutral-100 hover:bg-neutral-900/60 shadow-lg'
                    }`}
                  >
                    {/* Unread circle */}
                    {!item.read && (
                      <div className="absolute top-5 left-5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}

                    <div className="shrink-0 p-3 bg-neutral-950 border border-neutral-850 rounded-xl h-max">
                      {getModuleIcon(item.module)}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0 pr-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
                          {item.module}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPriorityStyle(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-[10px] text-neutral-550 font-mono ml-auto">
                          {new Date(item.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <h3 className={`text-base font-bold leading-tight ${item.read ? 'text-neutral-450' : 'text-white'}`}>
                        {item.title}
                      </h3>
                      
                      <p className={`text-sm leading-relaxed max-w-3xl ${item.read ? 'text-neutral-550' : 'text-neutral-400'}`}>
                        {item.description}
                      </p>

                      {item.actionUrl && (
                        <div className="pt-2">
                          <Link
                            href={item.actionUrl}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl"
                          >
                            Open action items &rarr;
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Delete action button */}
                    <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="p-2 rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-450 hover:text-red-400 transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-900 pt-6">
                <span className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 bg-neutral-950 border border-neutral-850 text-neutral-450 hover:text-white rounded-xl transition-all disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 bg-neutral-950 border border-neutral-850 text-neutral-450 hover:text-white rounded-xl transition-all disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
