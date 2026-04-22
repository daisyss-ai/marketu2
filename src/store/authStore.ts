import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definir a interface do usuário (podes expandir consoante os dados da DB)
export interface User {
  id: string;
  email?: string;
  token?: string;
  student_id?: string;
  first_name?: string;
  last_name?: string;
  student_id_verified?: boolean;
  avatar_url?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (userData: User) => void;
  logout: () => void;
  clearError: () => void;
  refreshSession: (userData: User) => void;
}

// SSR-safe storage persistence
const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem('marketu_user');
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Erro a analisar marketu_user', error);
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      login: (userData: User) => {
        console.log('authStore login', userData);
        set({
          user: userData,
          isAuthenticated: true,
          error: null,
        });
      },

      logout: () => {
        console.log('authStore logout');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshSession: (userData: User) => {
        console.log('authStore refreshSession', userData);
        set({
          user: userData,
          isAuthenticated: true,
          error: null,
        });
      },
    }),
    {
      name: 'marketu_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
