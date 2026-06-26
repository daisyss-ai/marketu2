import { create } from 'zustand';

export interface User {
  id: string;
  email?: string;
  enrollment_code?: string;
  full_name?: string;
  username?: string | null;
  course?: string | null;
  phone?: string;
  role?: string;
  status?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  institution?: {
    name: string;
  };
  token?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  hasHydrated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hydrate: () => void;
  setUser: (userData: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Nunca ler localStorage aqui — corre de forma síncrona no primeiro render,
  // tanto no servidor como no cliente, e teria de dar sempre o mesmo resultado nos dois.
  user: null,
  hasHydrated: false,

  // Chamado uma vez, manualmente, depois do componente montar no cliente.
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem('marketu_user');
      const user = item ? JSON.parse(item) : null;
      set({ user, hasHydrated: true });
    } catch (error) {
      console.warn('Erro a analisar marketu_user', error);
      set({ hasHydrated: true });
    }
  },

  login: (userData: User) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('marketu_user', JSON.stringify(userData));
    }
    set({ user: userData, hasHydrated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('marketu_user');
    }
    set({ user: null, hasHydrated: true });
  },

  setUser: (userData: User) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('marketu_user', JSON.stringify(userData));
    }
    set({ user: userData, hasHydrated: true });
  },
}));