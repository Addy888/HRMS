import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  role: 'HR' | 'EMPLOYEE';
  isFirstLogin: boolean;
  isActive: boolean;
  token?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: 'hr-admin-uuid',
        email: 'hr@fcs.com',
        role: 'HR',
        isFirstLogin: false,
        isActive: true,
        token: 'mock-jwt-token-fcs-hrms',
      },
      isAuthenticated: true,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
    }),
    {
      name: 'fcs-auth-storage',
    }
  )
);
