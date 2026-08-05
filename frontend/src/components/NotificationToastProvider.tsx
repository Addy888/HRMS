'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Bell, ShieldAlert, FileText, MessageSquare, Sparkles, Megaphone } from 'lucide-react';
import Link from 'next/link';
import useNotificationStore, { NotificationItem } from '@/store/notificationStore';
import { useSocket } from '@/hooks/useSocket';

// Synthesize a beautiful harmonic chime using Web Audio API (Zero external file dependencies)
const playHarmonicChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Pleasant dual-note chime (arpeggio D5 -> A5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
    osc2.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15); // D5

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Ignore context blocked errors on first load
  }
};

const getModuleIcon = (module: string) => {
  switch (module.toUpperCase()) {
    case 'AUTH':
      return <ShieldAlert className="w-5 h-5 text-amber-400" />;
    case 'DOCUMENT':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'COMPLAINT':
      return <MessageSquare className="w-5 h-5 text-rose-400" />;
    case 'POLICY':
      return <Sparkles className="w-5 h-5 text-emerald-400" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-400" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return 'border-rose-500 bg-rose-950/20 text-rose-300';
    case 'HIGH':
      return 'border-amber-500 bg-amber-950/20 text-amber-300';
    case 'LOW':
      return 'border-neutral-800 bg-neutral-900/50 text-neutral-400';
    default:
      return 'border-blue-500 bg-blue-950/20 text-blue-300';
  }
};

export default function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { toastQueue, addNotificationLocally, removeToastFromQueue, preferences } = useNotificationStore();

  useEffect(() => {
    if (!socket) return;

    // Listen to real-time notification creation
    socket.on('notification.created', (notif: NotificationItem) => {
      addNotificationLocally(notif);
      if (preferences?.sound && !preferences?.doNotDisturb) {
        playHarmonicChime();
      }
    });

    // Listen to announcement creation
    socket.on('announcement.created', (ann: any) => {
      // Map announcement to a system notification
      const convertedNotification: NotificationItem = {
        id: ann.id,
        notificationId: ann.id,
        title: `📢 Announcement: ${ann.title}`,
        description: ann.content.substring(0, 100) + (ann.content.length > 100 ? '...' : ''),
        type: 'announcement.created',
        module: 'SYSTEM',
        priority: 'MEDIUM',
        icon: 'megaphone',
        actionUrl: '/employee/announcements',
        read: false,
        createdAt: new Date().toISOString(),
      };
      addNotificationLocally(convertedNotification);
      if (preferences?.sound && !preferences?.doNotDisturb) {
        playHarmonicChime();
      }
    });

    return () => {
      socket.off('notification.created');
      socket.off('announcement.created');
    };
  }, [socket, addNotificationLocally, preferences]);

  return (
    <>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              onAnimationComplete={() => {
                // Auto dismiss toast after 6 seconds
                setTimeout(() => {
                  removeToastFromQueue(toast.id);
                }, 6000);
              }}
              className={`pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-md flex gap-3.5 relative overflow-hidden ${getPriorityColor(
                toast.priority
              )}`}
            >
              {/* Sliding progress timer line */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 6, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30"
              />

              <div className="shrink-0 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-850 h-max">
                {toast.type === 'announcement.created' ? (
                  <Megaphone className="w-5 h-5 text-amber-400" />
                ) : (
                  getModuleIcon(toast.module)
                )}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {toast.module}
                  </h4>
                  {toast.priority !== 'MEDIUM' && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                      {toast.priority}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug truncate">
                  {toast.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                  {toast.description}
                </p>

                {toast.actionUrl && (
                  <Link
                    href={toast.actionUrl}
                    onClick={() => removeToastFromQueue(toast.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors pt-1"
                  >
                    View details &rarr;
                  </Link>
                )}
              </div>

              <button
                onClick={() => removeToastFromQueue(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-850 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
