/**
 * @file React Query Configuration
 * @description Setup profissional do React Query/TanStack Query
 * - Default cache times
 * - Retry policies
 * - Error handling
 * - Persister (LocalStorage)
 */

import { CACHE } from '@/lib/constants/search';
import { QueryClient } from '@tanstack/react-query';

/**
 * Criar QueryClient com configuração profissional
 * Executar UMA VEZ na aplicação (em layout.tsx)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // ====================================================================
      // QUERIES (data fetching)
      // ====================================================================
      queries: {
        /**
         * Tempo até dados ficarem "stale" (desatualizados)
         * Stale queries serão refetch quando:
         * - Mudar focus da aba
         * - Reconectar internet
         * - Componente remountou
         */
        staleTime: CACHE.STALE_TIME,

        /**
         * Tempo que dados ficam em cache
         * Após isso, são removidos da memória
         */
        gcTime: CACHE.CACHE_TIME,

        /**
         * Retry automático em falhas
         * 3 tentativas, com backoff exponencial
         */
        retry: (failureCount, error: any) => {
          // Não retentar erros 4xx (exceto 408, 429)
          if (error?.status >= 400 && error?.status < 500) {
            if (error?.status === 408 || error?.status === 429) {
              return failureCount < 3;
            }
            return false;
          }
          // Retentar erros 5xx e network errors até 3 vezes
          return failureCount < 3;
        },

        /**
         * Delay entre retries (exponencial)
         */
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        /**
         * Refetch quando componente fica em focus
         * Útil para dados que mudam frequentemente
         */
        refetchOnWindowFocus: 'stale',

        /**
         * Refetch quando reconectar internet
         */
        refetchOnReconnect: 'stale',

        /**
         * Refetch quando componente montar (e dados são stale)
         */
        refetchOnMount: 'stale',

        /**
         * Evitar refetch duplicado em componentes irmãos
         */
        networkMode: 'always', // 'online' | 'always' | 'offlineFirst'
      },

      // ====================================================================
      // MUTATIONS (data mutations)
      // ====================================================================
      mutations: {
        /**
         * Retry para mutations é mais conservador
         * Evitar múltiplas submissões acidentais
         */
        retry: 1,
        retryDelay: 1000,

        /**
         * Usar optimistic updates quando possível
         */
        networkMode: 'always',
      },
    },
  });
}

/**
 * Singleton de QueryClient
 * Usar assim: getQueryClient().invalidateQueries(...)
 */
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

/**
 * Invalidar queries específicas
 * Força refetch automático
 */
export const invalidateQueries = {
  /**
   * Invalidar toda busca de produtos
   */
  products: () => getQueryClient().invalidateQueries({
    queryKey: ['products'],
  }),

  /**
   * Invalidar lista específica de produtos
   */
  productsList: () => getQueryClient().invalidateQueries({
    queryKey: ['products', 'list'],
  }),

  /**
   * Invalidar sugestões
   */
  suggestions: () => getQueryClient().invalidateQueries({
    queryKey: ['products', 'suggestions'],
  }),

  /**
   * Invalidar facets
   */
  facets: () => getQueryClient().invalidateQueries({
    queryKey: ['products', 'facets'],
  }),

  /**
   * Invalidar detail de um produto específico
   */
  productDetail: (id: string | number) => getQueryClient().invalidateQueries({
    queryKey: ['products', 'detail', id],
  }),

  /**
   * Invalidar all (nuclear option, use com cuidado)
   */
  all: () => getQueryClient().invalidateQueries(),
};

/**
 * Remover queries do cache
 * Usar para logout, etc
 */
export const removeQueries = {
  products: () => getQueryClient().removeQueries({
    queryKey: ['products'],
  }),

  all: () => getQueryClient().clear(),
};

/**
 * Configuração específica para diferentes tipos de queries
 */
export const queryConfigs = {
  // Busca rápida, dados mudam frequentemente
  productSearch: {
    staleTime: CACHE.STALE_TIME,
    gcTime: CACHE.CACHE_TIME,
  },

  // Sugestões, cache maior porque mudam menos
  suggestions: {
    staleTime: CACHE.SUGGEST_STALE_TIME,
    gcTime: CACHE.SUGGEST_CACHE_TIME,
  },

  // Detail page, cache muito grande porque raramente muda
  productDetail: {
    staleTime: CACHE.PRODUCT_DETAIL_STALE_TIME,
    gcTime: CACHE.PRODUCT_DETAIL_CACHE_TIME,
  },

  // Dados do usuário, muda com frequência média
  userProducts: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
};
