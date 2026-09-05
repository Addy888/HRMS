import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTokenExpired } from '@/lib/jwt';

export interface AuthUser {
  id: string;
  email: string;
  role: 'HR_ADMIN' | 'HR_USER' | 'HR' | 'EMPLOYEE' | 'SUPER_ADMIN';
  mustChangePassword: boolean;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    onboardingStatus: string;
    department: string | null;
    designation: string | null;
  } | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  setHydrated: (isHydrated: boolean) => void;
  initializeAuth: () => void;
}

function setAuthCookies(token: string, role: string) {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    document.cookie = `fcs_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `fcs_role=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (e) {
    console.error('Failed to set auth cookies:', e);
  }
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = 'fcs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'fcs_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch (e) {
    console.error('Failed to clear auth cookies:', e);
  }
}

function syncAxiosHeader(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const api = require('@/lib/api').default;
    if (api?.defaults?.headers?.common) {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    }
  } catch {
    // ignore if api module not yet available
  }
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          setAuthCookies(token, user.role);
          try {
            localStorage.setItem('fcs_token', token);
            localStorage.setItem('fcs_user', JSON.stringify(user));
          } catch {}
          syncAxiosHeader(token);
        }
        set({ token, user, isAuthenticated: true, isHydrated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          clearAuthCookies();
          try {
            localStorage.removeItem('fcs_token');
            localStorage.removeItem('fcs_user');
            localStorage.removeItem('fcs-auth-storage');
          } catch {}
          syncAxiosHeader(null);
        }
        set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
      },

      updateUser: (fields) =>
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...fields } : null;
          if (updatedUser && typeof window !== 'undefined') {
            try {
              localStorage.setItem('fcs_user', JSON.stringify(updatedUser));
              setAuthCookies(state.token || '', updatedUser.role);
            } catch {}
          }
          return { user: updatedUser };
        }),

      setHydrated: (isHydrated) => set({ isHydrated }),

      initializeAuth: () => {
        if (typeof window === 'undefined') return;

        const state = get();
        let token = state.token;
        let user = state.user;

        // Fallback to localStorage if state does not have it yet
        if (!token || !user) {
          try {
            const rawStorage = localStorage.getItem('fcs-auth-storage');
            if (rawStorage) {
              const parsed = JSON.parse(rawStorage);
              token = parsed?.state?.token || token;
              user = parsed?.state?.user || user;
            }
          } catch {}
        }

        // Additional fallback to direct fcs_token / fcs_user keys
        if (!token || !user) {
          try {
            const directToken = localStorage.getItem('fcs_token');
            const directUser = localStorage.getItem('fcs_user');
            if (directToken && directUser) {
              token = directToken;
              user = JSON.parse(directUser);
            }
          } catch {}
        }

        // Validate token - both token AND user must exist
        if (token && user) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            // Expired token -> clear stale auth state completely
            console.log('[AuthStore] Token expired, clearing auth state');
            state.logout();
            return;
          }

          // Valid token -> sync cookies and header
          setAuthCookies(token, user.role);
          syncAxiosHeader(token);
          set({ token, user, isAuthenticated: true, isHydrated: true });
        } else {
          // Incomplete or absent credentials -> clear any orphan storage
          if (token || user) {
            console.log('[AuthStore] Incomplete credentials, clearing auth state');
            state.logout();
          } else {
            clearAuthCookies();
            set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
          }
        }
      },
    }),
    {
      name: 'fcs-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Validate both token and user exist
        if (state.token && state.user) {
          // Check if token is expired
          if (isTokenExpired(state.token)) {
            console.log('[AuthStore] Rehydration: Token expired, clearing state');
            state.logout();
          } else {
            // Valid token - sync cookies and axios header
            setAuthCookies(state.token, state.user.role);
            syncAxiosHeader(state.token);
            state.setHydrated(true);
          }
        } else {
          // Missing token or user - clear everything
          console.log('[AuthStore] Rehydration: Missing token or user, clearing state');
          if (state.token || state.user) {
            state.logout();
          } else {
            clearAuthCookies();
            syncAxiosHeader(null);
            state.setHydrated(true);
          }
        }
      },
    }
  )
);

export default useAuthStore;
