import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: 'HR' | 'EMPLOYEE';
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
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (fields: Partial<AuthUser>) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fcs_token');
          localStorage.removeItem('fcs_user');
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),
    }),
    {
      name: 'fcs-auth-storage',
      // Only persist non-sensitive fields in localStorage via Zustand
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
