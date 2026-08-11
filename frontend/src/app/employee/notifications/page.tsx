'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Check, Trash2, Search, Filter, X, ShieldAlert,
  FileText, MessageSquare, Sparkles, Inbox, ExternalLink,
  Calendar, AlertTriangle, Info, CheckCircle, Archive,
} from 'lucide-react';
import Link from 'next/link';
import useNotificationStore, { NotificationItem } from '@/store/notificationStore';

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
    case 'ATTENDANCE':
      return <Calendar className="w-5 h-5 text-purple-500" />;
    case 'PAYROLL':
      return <FileText className="w-5 h-5 text-green-500" />;
    case 'HR_ACTION':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'SYSTEM':
      return <Bell className="w-5 h-5 text-indigo-500" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-500" />;
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return {
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        border: 'border-red-500/30',
        icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        border: 'border-orange-500/30',
        icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
      };
    case 'LOW':
      return {
        badge: 'bg-neutral-800 text-neutral-400 border-neutral-700/50',
        border: 'border-neutral-700/50',
        icon: <Info className="w-4 h-4 text-neutral-400" />,
      };
    default:
      return {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        border: 'border-blue-500/30',
        icon: <Info className="w-4 h-4 text-blue-400" />,
      };
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterReadStatus, setFilterReadStatus] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterTimeRange, setFilterTimeRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const loadNotifications = async (pageNum: number) => {
    const result = await fetchNotifications(pageNum, 20);
    if (result && result.meta) {
      setHasMore(pageNum < result.meta.totalPages);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedNotifications) {
      await deleteNotification(id);
    }
    setSelectedNotifications(new Set());
  };

  const toggleSelectNotification = (id: string) => {
    const newSet = new Set(selectedNotifications);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedNotifications(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  // Apply filters
  const filteredNotifications = notifications.filter((n) => {
    // Search filter
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Module filter
    if (filterModule !== 'ALL' && n.module.toUpperCase() !== filterModule) {
      return false;
    }

    // Read status filter
    if (filterReadStatus === 'UNREAD' && n.read) return false;
    if (filterReadStatus === 'READ' && !n.read) return false;

    // Priority filter
    if (filterPriority !== 'ALL' && n.priority.toUpperCase() !== filterPriority) {
      return false;
    }

    // Time range filter
    if (filterTimeRange !== 'ALL') {
      const notifDate = new Date(n.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      if (filterTimeRange === 'TODAY' && notifDate < today) return false;
      if (filterTimeRange === 'WEEK' && notifDate < weekAgo) return false;
      if (filterTimeRange === 'MONTH' && notifDate < monthAgo) return false;
    }

    return true;
  });

  const modules = ['ALL', 'AUTH', 'DOCUMENT', 'COMPLAINT', 'POLICY', 'ATTENDANCE', 'PAYROLL', 'SYSTEM'];
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">Notification Center</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Manage all your enterprise notifications and alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {unreadCount} unread
                </div>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                showFilters
                  ? 'bg-white text-black'
                  : 'bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Module filter */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Module
                  </label>
                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {modules.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Read status filter */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Status
                  </label>
                  <select
                    value={filterReadStatus}
                    onChange={(e) => setFilterReadStatus(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All</option>
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                  </select>
                </div>

                {/* Priority filter */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorities.map((pri) => (
                      <option key={pri} value={pri}>
                        {pri}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time range filter */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Time Range
                  </label>
                  <select
                    value={filterTimeRange}
                    onChange={(e) => setFilterTimeRange(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="WEEK">Last 7 Days</option>
                    <option value="MONTH">Last 30 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-500">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={() => {
                    setFilterModule('ALL');
                    setFilterReadStatus('ALL');
                    setFilterPriority('ALL');
                    setFilterTimeRange('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedNotifications.size > 0 && (
        <div className="border-b border-neutral-900 bg-neutral-900/50 backdrop-blur-sm sticky top-[137px] z-10">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-neutral-400">
              {selectedNotifications.size} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete selected
              </button>
              <button
                onClick={() => setSelectedNotifications(new Set())}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-neutral-500">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <Inbox className="w-12 h-12 text-neutral-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">No notifications found</h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md">
                  {searchQuery || filterModule !== 'ALL' || filterReadStatus !== 'ALL' || filterPriority !== 'ALL' || filterTimeRange !== 'ALL'
                    ? 'Try adjusting your filters or search query'
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select all checkbox */}
              <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/50 border border-neutral-900 rounded-xl">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-neutral-500">Select all</span>
              </div>

              {/* Notification cards */}
              {filteredNotifications.map((notif) => {
                const priorityConfig = getPriorityConfig(notif.priority);
                const isSelected = selectedNotifications.has(notif.id);

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group border rounded-2xl p-5 transition-all cursor-pointer ${
                      notif.read
                        ? 'border-neutral-900 bg-neutral-950/20 hover:bg-neutral-900/40'
                        : `${priorityConfig.border} bg-neutral-900/40 hover:bg-neutral-900/80 shadow-lg`
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectNotification(notif.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>

                      {/* Icon */}
                      <div
                        className={`shrink-0 p-3 rounded-xl border ${
                          notif.read
                            ? 'bg-neutral-950 border-neutral-900'
                            : 'bg-neutral-950 border-neutral-800'
                        }`}
                      >
                        {getModuleIcon(notif.module)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              )}
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
                                {notif.module}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priorityConfig.badge}`}
                              >
                                {notif.priority}
                              </span>
                            </div>
                            <h3 className={`text-base font-bold ${notif.read ? 'text-neutral-400' : 'text-white'}`}>
                              {notif.title}
                            </h3>
                            <p className={`text-sm leading-relaxed ${notif.read ? 'text-neutral-550' : 'text-neutral-400'}`}>
                              {notif.description}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:text-green-400 transition-all"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:text-red-400 transition-all"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-neutral-550 font-mono">
                            {formatTimeAgo(notif.createdAt)}
                          </span>

                          {notif.actionUrl && (
                            <Link
                              href={notif.actionUrl}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View details
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load more notifications'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
