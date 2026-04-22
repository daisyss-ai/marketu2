'use client';

import { create } from 'zustand';
import type { Product } from '@/types';

interface ProductState {
  // State
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    query: string;
    category: string | null;
    minPrice: number;
    maxPrice: number;
    condition: string | null;
  };

  // Actions
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (
    filters: Partial<{
      query: string;
      category: string | null;
      minPrice: number;
      maxPrice: number;
      condition: string | null;
    }>
  ) => void;
  resetFilters: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
}

const defaultFilters = {
  query: '',
  category: null,
  minPrice: 0,
  maxPrice: 1000000,
  condition: null,
};

/**
 * Zustand store for product state management
 */
export const useProductStore = create<ProductState>((set) => ({
  // Initial state
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,

  // Actions
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  addProduct: (product) =>
    set((state) => ({
      products: [product, ...state.products],
    })),

  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedProduct:
        state.selectedProduct?.id === id
          ? { ...state.selectedProduct, ...updates }
          : state.selectedProduct,
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
    })),
}));
