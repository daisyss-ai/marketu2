/**
 * @file Cache Key Factory
 * @description Factory pattern para gerar cache keys consistentes
 * Crucial para React Query, Redis caching, etc
 */

import { SearchQuery } from '@/types/search';

/**
 * Cache keys para React Query
 * Padrão: ['resource', 'action', ...params]
 * Importante para invalidação, updates, etc
 */
export const cacheKeys = {
  // ========================================================================
  // PRODUCTS
  // ========================================================================

  products: {
    all: () => ['products'] as const,

    lists: () => [...cacheKeys.products.all(), 'list'] as const,

    /**
     * Key para busca específica
     * Varia com cada filtro/sort/page
     */
    list: (query: SearchQuery) => [
      ...cacheKeys.products.lists(),
      JSON.stringify(query), // Estável, determinístico
    ] as const,

    /**
     * Key para sugestões (autocomplete)
     */
    suggestions: () => [...cacheKeys.products.all(), 'suggestions'] as const,
    suggestion: (term: string) => [
      ...cacheKeys.products.suggestions(),
      term,
    ] as const,

    /**
     * Key para facets (contagens de filtros)
     */
    facets: () => [...cacheKeys.products.all(), 'facets'] as const,

    /**
     * Key para produtos em destaque
     */
    featured: () => [...cacheKeys.products.all(), 'featured'] as const,

    /**
     * Key para trending products
     */
    trending: () => [...cacheKeys.products.all(), 'trending'] as const,

    /**
     * Key para detail de um produto
     */
    details: () => [...cacheKeys.products.all(), 'detail'] as const,
    detail: (id: string | number) => [
      ...cacheKeys.products.details(),
      id,
    ] as const,

    /**
     * Key para produtos de um usuário
     */
    userProducts: () => [...cacheKeys.products.all(), 'userProducts'] as const,
    userProductsList: (userId: string, page: number = 1, limit: number = 20) => [
      ...cacheKeys.products.userProducts(),
      userId,
      page,
      limit,
    ] as const,
  },

  // ========================================================================
  // SEARCH (namespace separado)
  // ========================================================================

  search: {
    all: () => ['search'] as const,

    /**
     * Key para estado de filtros (sincronizado com URL)
     */
    filters: () => [...cacheKeys.search.all(), 'filters'] as const,

    /**
     * Key para estado de paginação
     */
    pagination: () => [...cacheKeys.search.all(), 'pagination'] as const,

    /**
     * Key para histórico de buscas
     */
    history: () => [...cacheKeys.search.all(), 'history'] as const,
    historyItem: (query: string) => [
      ...cacheKeys.search.history(),
      query,
    ] as const,
  },

  // ========================================================================
  // INFINITE QUERIES (para scroll infinito/cursor pagination)
  // ========================================================================

  infinite: {
    products: (baseQuery: Omit<SearchQuery, 'page'>) => [
      'products',
      'infinite',
      JSON.stringify(baseQuery),
    ] as const,
  },
};

/**
 * Validar que cache key é estável
 * Importante: cache keys devem ser determinísticas
 */
export function validateCacheKey(key: readonly any[]): boolean {
  return Array.isArray(key) && key.length > 0;
}

/**
 * String representation de cache key
 * Para debugging
 */
export function cacheKeyToString(key: readonly any[]): string {
  return key.map((part) => {
    if (typeof part === 'string') return part;
    if (typeof part === 'number') return String(part);
    if (typeof part === 'object') return JSON.stringify(part);
    return String(part);
  }).join(':');
}

/**
 * Factory para criar cache keys para queries dinâmicas
 */
export const createCacheKey = {
  /**
   * Criar key para busca customizada
   */
  searchQuery: (query: SearchQuery) => cacheKeys.products.list(query),

  /**
   * Criar key para produto por ID
   */
  productDetail: (id: string | number) => cacheKeys.products.detail(id),

  /**
   * Criar key para produtos do usuário
   */
  userProducts: (userId: string, page?: number, limit?: number) =>
    cacheKeys.products.userProductsList(userId, page, limit),

  /**
   * Criar key para sugestão
   */
  suggestion: (term: string) => cacheKeys.products.suggestion(term),
};
