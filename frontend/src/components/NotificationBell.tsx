'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import useNotificationStore from '@/store/notificationStore';
import NotificationDrawer from './NotificationDrawer';

export default function NotificationBell() {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Ring the bell when unreadCount increases
  useEffect(() => {
    if (unreadCount > 0) {
      controls.start({
        rotate: [0, -15, 12, -10, 8, -4, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
    }
  }, [unreadCount, controls]);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative p-2.5 rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all shadow-inner"
        >
          <motion.div animate={controls}>
            <Bell className="w-5 h-5" />
          </motion.div>
          
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white ring-2 ring-black font-mono animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
