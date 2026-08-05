import { create } from 'zustand';
import api from '@/lib/api';

export interface NotificationItem {
  id: string;
  notificationId: string;
  title: string;
  description: string;
  type: string;
  module: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  icon: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  recipientId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  read: boolean;
  author: string;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  sound: boolean;
  doNotDisturb: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  announcements: AnnouncementItem[];
  preferences: NotificationPreferences | null;
  loading: boolean;
  toastQueue: NotificationItem[];
  
  // Actions
  fetchNotifications: (page?: number, limit?: number, filters?: any) => Promise<any>;
  fetchUnreadCount: () => Promise<void>;
  fetchAnnouncements: (page?: number, limit?: number) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Real-time local state mutations
  addNotificationLocally: (notif: NotificationItem) => void;
  addAnnouncementLocally: (ann: AnnouncementItem) => void;
  removeToastFromQueue: (id: string) => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  announcements: [],
  preferences: null,
  loading: false,
  toastQueue: [],

  fetchNotifications: async (page = 1, limit = 10, filters = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications', {
        params: { page, limit, ...filters },
      });
      const data = res.data?.data ?? res.data;
      set({
        notifications: page === 1 ? data.items : [...get().notifications, ...data.items],
      });
      return data;
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread');
      const data = res.data?.data ?? res.data;
      set({ unreadCount: data.count });
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  },

  fetchAnnouncements: async (page = 1, limit = 10) => {
    try {
      const res = await api.get('/notifications/announcements', { params: { page, limit } });
      const data = res.data?.data ?? res.data;
      set({
        announcements: page === 1 ? data.items : [...get().announcements, ...data.items],
      });
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  },

  fetchPreferences: async () => {
    try {
      const res = await api.get('/notifications/preferences');
      const data = res.data?.data ?? res.data;
      set({ preferences: data });
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const res = await api.patch('/notifications/preferences', prefs);
      const data = res.data?.data ?? res.data;
      set({ preferences: data });
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => {
        const wasUnread = state.notifications.find((n) => n.id === id && !n.read);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  },

  addNotificationLocally: (notif) => {
    const soundEnabled = get().preferences?.sound ?? true;
    const dndEnabled = get().preferences?.doNotDisturb ?? false;

    if (dndEnabled) return;

    // Play micro audio chime if allowed
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {}); // catch auto-play blocks
      } catch (e) {
        // ignore audio errors
      }
    }

    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      toastQueue: [...state.toastQueue, notif],
    }));
  },

  addAnnouncementLocally: (ann) => {
    set((state) => ({
      announcements: [ann, ...state.announcements],
    }));
  },

  removeToastFromQueue: (id) => {
    set((state) => ({
      toastQueue: state.toastQueue.filter((t) => t.id !== id),
    }));
  },
}));

export default useNotificationStore;
