'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  // State
  items: (CartItem & { product?: Product })[];
  totalAmount: number;
  totalItems: number;

  // Actions
  addItem: (productId: string, quantity: number, price: number, product?: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  recalculateTotals: () => void;
}

/**
 * Zustand store for shopping cart state
 * Persisted to localStorage for recovery after page reload
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      totalAmount: 0,
      totalItems: 0,

      // Actions
      addItem: (productId, quantity, price, product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.product_id === productId);

          let newItems: (CartItem & { product?: Product })[];
          if (existingItem) {
            newItems = state.items.map((item) =>
              item.product_id === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [
              ...state.items,
              {
                product_id: productId,
                quantity,
                price,
                product,
              },
            ];
          }

          // Recalculate totals
          const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            items: newItems,
            totalAmount,
            totalItems,
          };
        }),

      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.product_id !== productId);
          const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            items: newItems,
            totalAmount,
            totalItems,
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return get().items.find((item) => item.product_id === productId)
              ? (get().removeItem(productId), {})
              : {};
          }

          const newItems = state.items.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          );

          const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            items: newItems,
            totalAmount,
            totalItems,
          };
        }),

      clearCart: () =>
        set({
          items: [],
          totalAmount: 0,
          totalItems: 0,
        }),

      recalculateTotals: () =>
        set((state) => {
          const totalAmount = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

          return {
            totalAmount,
            totalItems,
          };
        }),
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({
        items: state.items,
        totalAmount: state.totalAmount,
        totalItems: state.totalItems,
      }),
    }
  )
);
