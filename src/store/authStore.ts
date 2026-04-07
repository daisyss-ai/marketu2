import { create } from 'zustand';

// Definir a interface do usuário (podes expandir consoante os dados da DB)
export interface User {
  id: string;
  email?: string;
  token?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// Obter usuário do localStorage de forma segura (evita erro SSR do Next.js)
const getUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem('marketu_user');
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Erro a analisar marketu_user', error);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromStorage(),

  login: (userData: User) => {
    console.log('authStore login', userData);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('marketu_user', JSON.stringify(userData));
    }
    set({ user: userData });
  },

  logout: () => {
    console.log('authStore logout');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('marketu_user');
    }
    set({ user: null });
  },
}));
