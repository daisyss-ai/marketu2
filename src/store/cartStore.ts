import { create } from 'zustand';

interface CartState {
  savedCount: number;
  setSavedCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  savedCount: 0,

  setSavedCount: (count: number) => {
    set({ savedCount: Math.max(0, count) });
  },

  increment: () => {
    set((state) => ({ savedCount: state.savedCount + 1 }));
  },

  decrement: () => {
    set((state) => ({ savedCount: Math.max(0, state.savedCount - 1) }));
  },
}));
