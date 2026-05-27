/**
 * @file useProducts Hook
 * @description Hook principal para busca de produtos com React Query
 * Substitui toda lógica de Home.tsx espalhada
 * 
 * Features:
 * - Cache automático
 * - Deduplicação de requisições
 * - Retry automático
 * - Refetch on focus
 * - Otimista updates support
 */

'use client';

import { API_ENDPOINTS } from '@/lib/constants/search';
import { cacheKeys, createCacheKey } from '@/lib/services/cache-key';
import { queryConfigs } from '@/lib/services/query-client';
import { SearchError, SearchErrorCode, SearchQuery, SearchResponse } from '@/types/search';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

/**
 * Hook para buscar produtos com filtros
 * Exemplo:
 * const { products, isPending, error, pagination } = useProducts(query);
 */
export function useProducts(query: SearchQuery): UseQueryResult<SearchResponse['data']> {
  return useQuery({
    queryKey: createCacheKey.searchQuery(query),
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new SearchError(
          error.code || SearchErrorCode.DATABASE_ERROR,
          error.message || 'Erro ao buscar produtos',
          response.status
        );
      }

      const data = await response.json();
      return data.data;
    },
    ...queryConfigs.productSearch,

    // Manter dados anteriores enquanto carregam novos
    // Evita "flashing" ao mudar de página
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook para buscar um único produto (detail page)
 */
export function useProductDetail(productId: string | number) {
  return useQuery({
    queryKey: createCacheKey.productDetail(productId),
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new SearchError(
          SearchErrorCode.NOT_FOUND,
          'Produto não encontrado',
          404
        );
      }

      return response.json();
    },
    ...queryConfigs.productDetail,
    enabled: !!productId, // Só fetch se temos ID
  });
}

/**
 * Hook para produtos em destaque (homepage)
 */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: cacheKeys.products.featured(),
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/featured`);

      if (!response.ok) {
        throw new SearchError(
          SearchErrorCode.DATABASE_ERROR,
          'Erro ao buscar produtos em destaque',
          response.status
        );
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  });
}

/**
 * Hook para produtos em tendência
 */
export function useTrendingProducts(days: number = 7) {
  return useQuery({
    queryKey: [...cacheKeys.products.trending(), days],
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/trending?days=${days}`);

      if (!response.ok) {
        throw new SearchError(
          SearchErrorCode.DATABASE_ERROR,
          'Erro ao buscar produtos em tendência',
          response.status
        );
      }

      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  });
}

/**
 * Hook para produtos de um usuário (profile page)
 */
export function useUserProducts(
  userId: string | undefined,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: createCacheKey.userProducts(userId || '', page, limit),
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${userId}/products?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new SearchError(
          SearchErrorCode.DATABASE_ERROR,
          'Erro ao buscar produtos do usuário',
          response.status
        );
      }

      return response.json();
    },
    enabled: !!userId, // Só fetch se temos userId
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  });
}

/**
 * Type helper para acessar response data
 */
export type ProductsQueryResult = ReturnType<typeof useProducts>;
