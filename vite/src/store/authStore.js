import { create } from 'zustand';

// simple authentication store with persistence to localStorage
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('marketu_user') || 'null'),

  login: (userData) => {
    console.log('authStore login', userData);
    localStorage.setItem('marketu_user', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: () => {
    console.log('authStore logout');
    localStorage.removeItem('marketu_user');
    set({ user: null });
  },
}));
