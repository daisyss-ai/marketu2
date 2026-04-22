'use client';

import { useState, useCallback } from 'react';
import type { Order } from '@/types';

interface UseCartState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

export interface UseCartReturn extends UseCartState {
  createOrder: (items: { product_id: string; quantity: number; price: number }[], totalAmount: number, shippingAddress?: string) => Promise<Order | null>;
  getOrders: () => Promise<Order[]>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for client-side cart and order operations
 */
export function useCart(): UseCartReturn {
  const [state, setState] = useState<UseCartState>({
    orders: [],
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const createOrder = useCallback(
    async (
      items: { product_id: string; quantity: number; price: number }[],
      totalAmount: number,
      shippingAddress?: string
    ): Promise<Order | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            total_amount: totalAmount,
            shipping_address: shippingAddress,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          const errorMsg = data.error || `Failed to create order (${response.status})`;
          setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
          return null;
        }

        const data = await response.json();
        const order = data.data || data;

        setState((prev) => ({
          ...prev,
          orders: [order, ...prev.orders],
          isLoading: false,
        }));

        return order;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error creating order';
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        return null;
      }
    },
    []
  );

  const getOrders = useCallback(async (): Promise<Order[]> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || `Failed to fetch orders (${response.status})`;
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        return [];
      }

      const data = await response.json();
      const orders = data.data || data.orders || [];

      setState((prev) => ({
        ...prev,
        orders,
        isLoading: false,
      }));

      return orders;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching orders';
      setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
      return [];
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || `Failed to cancel order (${response.status})`;
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        return false;
      }

      // Remove from local orders list
      setState((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== orderId),
        isLoading: false,
      }));

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error cancelling order';
      setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
      return false;
    }
  }, []);

  return {
    ...state,
    createOrder,
    getOrders,
    cancelOrder,
    clearError,
  };
}
