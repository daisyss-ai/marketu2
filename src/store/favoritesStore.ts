import { create } from 'zustand';

interface FavoritesState {
  favoritesCount: number;
  setFavoritesCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoritesCount: 0,

  setFavoritesCount: (count: number) => {
    set({ favoritesCount: Math.max(0, count) });
  },

  increment: () => {
    set((state) => ({ favoritesCount: state.favoritesCount + 1 }));
  },

  decrement: () => {
    set((state) => ({ favoritesCount: Math.max(0, state.favoritesCount - 1) }));
  },
}));