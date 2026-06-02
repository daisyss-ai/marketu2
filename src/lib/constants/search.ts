/**
 * @file Search Constants
 * @description Constantes do sistema de busca
 */

import { Location, ProductCondition, SortOption } from '@/types/search';

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  PAGE_SIZES: [12, 24, 48],
} as const;

// ============================================================================
// SEARCH
// ============================================================================

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 256,
  DEBOUNCE_MS: 300,
  DEBOUNCE_AUTOCOMPLETE_MS: 200,
} as const;

// ============================================================================
// FILTERING
// ============================================================================

export const FILTERS = {
  PRICE: {
    MIN: 0,
    MAX: 1000000, // 1 milhão de KZS
    STEP: 1000,
  },
  GRADE_LEVEL: {
    MIN: 1,
    MAX: 12,
  },
  RATING: {
    MIN: 0,
    MAX: 5,
    STEP: 0.5,
  },
} as const;

export const CONDITION_OPTIONS = [
  { value: ProductCondition.NEW, label: 'Novo' },
  { value: ProductCondition.USED, label: 'Usado' },
  { value: ProductCondition.REFURBISHED, label: 'Refurbished' },
] as const;

export const LOCATION_OPTIONS = [
  { value: Location.LUANDA, label: 'Luanda' },
  { value: Location.HUAMBO, label: 'Huambo' },
  { value: Location.BENGUELA, label: 'Benguela' },
  { value: Location.CABINDA, label: 'Cabinda' },
  { value: Location.ONLINE, label: 'Online' },
] as const;

export const SORT_OPTIONS = [
  { value: SortOption.RELEVANCE, label: 'Relevância', default: false },
  { value: SortOption.NEWEST, label: 'Mais Recente', default: true },
  { value: SortOption.PRICE_ASC, label: 'Preço: Menor' },
  { value: SortOption.PRICE_DESC, label: 'Preço: Maior' },
  { value: SortOption.RATING, label: 'Melhor Avaliação' },
  { value: SortOption.MOST_VIEWED, label: 'Mais Vistos' },
] as const;

// ============================================================================
// CATEGORIES
// ============================================================================

export const CATEGORIES = [
  'Material Escolar',
  'Tecnologia',
  'Serviços',
  'Roupas e Acessórios',
  'Livros',
  'Eletrónicos',
] as const;

export const SUBJECTS = [
  'Matemática',
  'Português',
  'Inglês',
  'Ciências',
  'História',
  'Geografia',
  'Biologia',
  'Física',
  'Química',
] as const;

// ============================================================================
// SEARCH RANKING WEIGHTS
// ============================================================================

export const RANKING_WEIGHTS = {
  TITLE_MATCH: 0.35,      // 35% do score
  DESCRIPTION_MATCH: 0.15, // 15% do score
  POPULARITY: 0.20,        // 20% do score (views + sales)
  RECENCY: 0.15,          // 15% do score (produtos recentes)
  RATING: 0.10,           // 10% do score
  CATEGORY_MATCH: 0.05,   // 5% do score
} as const;

// ============================================================================
// CACHE
// ============================================================================

export const CACHE = {
  STALE_TIME: 5 * 60 * 1000,        // 5 minutos
  CACHE_TIME: 10 * 60 * 1000,       // 10 minutos
  SUGGEST_STALE_TIME: 30 * 60 * 1000, // 30 minutos
  SUGGEST_CACHE_TIME: 60 * 60 * 1000, // 1 hora
  PRODUCT_DETAIL_STALE_TIME: 15 * 60 * 1000, // 15 minutos
  PRODUCT_DETAIL_CACHE_TIME: 30 * 60 * 1000, // 30 minutos
  GC_INTERVAL: 60 * 60 * 1000,     // 1 hora
} as const;

// ============================================================================
// URL PARAMETERS
// ============================================================================

export const URL_PARAMS = {
  PAGE: 'page',
  LIMIT: 'limit',
  SEARCH: 'q',
  SORT: 'sort',
  CATEGORY: 'category',
  CONDITION: 'condition',
  PRICE_MIN: 'priceMin',
  PRICE_MAX: 'priceMax',
  GRADE_LEVEL: 'gradeLevel',
  SUBJECT: 'subject',
  PRODUCT_TYPE: 'productType',
  LOCATION: 'location',
  RATING: 'rating',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  PRODUCTS_SEARCH: '/api/products/search',
  PRODUCTS_SUGGEST: '/api/products/suggest',
  PRODUCTS_DETAIL: (id: string) => `/api/products/${id}`,
  PRODUCTS_FACETS: '/api/products/facets',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  INVALID_QUERY: 'Consulta inválida. Tente novamente.',
  INVALID_FILTERS: 'Filtros inválidos.',
  INVALID_PAGINATION: 'Paginação inválida.',
  NO_RESULTS: 'Nenhum produto encontrado.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  RATE_LIMIT: 'Muitas requisições. Aguarde um momento.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Produto criado com sucesso!',
  PRODUCT_UPDATED: 'Produto atualizado com sucesso!',
  PRODUCT_DELETED: 'Produto deletado com sucesso!',
  FILTERS_APPLIED: 'Filtros aplicados.',
  FILTERS_CLEARED: 'Filtros limpos.',
} as const;
