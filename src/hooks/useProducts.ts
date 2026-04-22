'use client';

import { useCallback, useState } from 'react';
import type { Product, CreateProductRequest, ProductListResponse } from '@/types';

export interface UseProductsState {
  products: Product[];
  product: Product | null;
  isLoading: boolean;
  error: string | null;
}

interface UseProductsReturn extends UseProductsState {
  searchProducts: (filters: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    page?: number;
    perPage?: number;
  }) => Promise<boolean>;
  getProduct: (id: string) => Promise<boolean>;
  createProduct: (data: CreateProductRequest) => Promise<string | null>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  uploadImages: (productId: string, files: File[]) => Promise<string[]>;
  clearError: () => void;
}

/**
 * Custom hook for product operations
 */
export function useProducts(): UseProductsReturn {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    product: null,
    isLoading: false,
    error: null,
  });

  const searchProducts = useCallback(
    async (filters: {
      query?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      page?: number;
      perPage?: number;
    }): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const params = new URLSearchParams();
        if (filters.query) params.append('query', filters.query);
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('perPage', filters.perPage.toString());

        const response = await fetch(`/api/products?${params.toString()}`);

        if (!response.ok) {
          const error = await response.json();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to search products',
          }));
          return false;
        }

        const result = (await response.json()) as ProductListResponse;
        setState((prev) => ({
          ...prev,
          products: result.products as any,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  const getProduct = useCallback(async (id: string): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/products/${id}`);

      if (!response.ok) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Product not found',
        }));
        return false;
      }

      const product = (await response.json()) as Product;
      setState((prev) => ({
        ...prev,
        product,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const createProduct = useCallback(async (data: CreateProductRequest): Promise<string | null> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to create product',
        }));
        return null;
      }

      const product = (await response.json()) as Product;
      setState((prev) => ({
        ...prev,
        product,
        isLoading: false,
      }));
      return product.id as string;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to update product',
          }));
          return false;
        }

        const product = (await response.json()) as Product;
        setState((prev) => ({
          ...prev,
          product,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to delete product',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        product: null,
        products: prev.products.filter((p) => p.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const uploadImages = useCallback(async (productId: string, files: File[]): Promise<string[]> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to upload images',
        }));
        return [];
      }

      const result = (await response.json()) as { urls: string[] };
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      return result.urls;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    searchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
    clearError,
  };
}
