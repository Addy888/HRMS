'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Check, Trash2, Settings, ShieldAlert,
  FileText, MessageSquare, Sparkles, Bell, Inbox, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import useNotificationStore, { NotificationItem } from '@/store/notificationStore';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const getModuleIcon = (module: string) => {
  switch (module.toUpperCase()) {
    case 'AUTH':
      return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    case 'DOCUMENT':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'COMPLAINT':
      return <MessageSquare className="w-4 h-4 text-rose-500" />;
    case 'POLICY':
      return <Sparkles className="w-4 h-4 text-emerald-500" />;
    default:
      return <Bell className="w-4 h-4 text-indigo-500" />;
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'LOW':
      return 'bg-neutral-800 text-neutral-400 border-neutral-700/50';
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
};

// Grouping logic by date relative intervals
const groupNotifications = (items: NotificationItem[]) => {
  const groups: { [key: string]: NotificationItem[] } = {
    Today: [],
    'This Week': [],
    Earlier: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  items.forEach((item) => {
    const d = new Date(item.createdAt);
    if (d >= today) {
      groups.Today.push(item);
    } else if (d >= oneWeekAgo) {
      groups['This Week'].push(item);
    } else {
      groups.Earlier.push(item);
    }
  });

  return Object.entries(groups).filter(([_, list]) => list.length > 0);
};

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'HIGH'>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, 40);
    }
  }, [isOpen, fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'HIGH') return n.priority === 'CRITICAL' || n.priority === 'HIGH';
    return true;
  });

  const grouped = groupNotifications(filteredNotifications);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Background Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Slideout Panel Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative w-full max-w-md h-full bg-neutral-950 border-l border-neutral-850 flex flex-col z-10 shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-850 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">Real-time enterprise alerts stream</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/employee/settings"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-450 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all"
              title="Notification Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-455 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="px-6 py-3 border-b border-neutral-900/60 bg-neutral-950 flex gap-2">
          {(['ALL', 'UNREAD', 'HIGH'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                activeFilter === filter
                  ? 'bg-white border-white text-black'
                  : 'bg-neutral-900 border-neutral-850 text-neutral-450 hover:text-white hover:bg-neutral-850'
              }`}
            >
              {filter === 'HIGH' ? 'High & Critical' : filter}
            </button>
          ))}

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="ml-auto text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Notification Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading && notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
              <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              <span className="text-xs">Fetching alerts...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3 text-center py-20">
              <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl">
                <Inbox className="w-8 h-8 text-neutral-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-350">All caught up!</h3>
                <p className="text-xs text-neutral-500 max-w-[200px] mx-auto mt-1">
                  You have no notifications matching this filter.
                </p>
              </div>
            </div>
          ) : (
            grouped.map(([groupName, list]) => (
              <div key={groupName} className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {groupName}
                </h3>
                <div className="space-y-2.5">
                  {list.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !item.read && markAsRead(item.id)}
                      className={`group border rounded-2xl p-4 transition-all flex gap-3 relative cursor-pointer ${
                        item.read
                          ? 'border-neutral-900 bg-neutral-950/20 text-neutral-450 hover:bg-neutral-900/40'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-100 hover:bg-neutral-900/80 shadow-md'
                      }`}
                    >
                      {/* Unread pulsing circle indicator */}
                      {!item.read && (
                        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}

                      <div
                        className={`shrink-0 p-2.5 rounded-xl border h-max transition-all ${
                          item.read
                            ? 'bg-neutral-950 border-neutral-900'
                            : 'bg-neutral-950 border-neutral-800'
                        }`}
                      >
                        {getModuleIcon(item.module)}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0 pr-8 pl-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
                            {item.module}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityStyle(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold truncate ${item.read ? 'text-neutral-400' : 'text-white'}`}>
                          {item.title}
                        </h4>
                        <p className={`text-xs leading-relaxed ${item.read ? 'text-neutral-550' : 'text-neutral-400'}`}>
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-neutral-550 font-mono">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {item.actionUrl && (
                            <Link
                              href={item.actionUrl}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Action <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (Delete) on hover */}
                      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:text-red-400 transition-all"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer footer link */}
        <div className="p-4 border-t border-neutral-900/60 bg-neutral-950/80 text-center">
          <Link
            href="/employee/notifications"
            onClick={onClose}
            className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors inline-block"
          >
            Open Full Notifications Center &rarr;
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
