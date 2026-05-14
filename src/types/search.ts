/**
 * @file Search & Filter Types
 * @description Tipos compartilhados para todo o sistema de busca
 * Tipagem forte, imutável, validável
 */

// ============================================================================
// ENUMS (Definições constantes)
// ============================================================================

export enum SortOption {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
  MOST_VIEWED = 'most_viewed',
}

export enum ProductCondition {
  NEW = 'novo',
  USED = 'usado',
  REFURBISHED = 'refurbished',
}

export enum ProductType {
  MATERIAL = 'material',
  SERVICE = 'servico',
}

export enum Location {
  LUANDA = 'Luanda',
  HUAMBO = 'Huambo',
  BENGUELA = 'Benguela',
  CABINDA = 'Cabinda',
  ONLINE = 'Online',
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface PriceRange {
  min: number;
  max: number;
}

export interface FilterState {
  search: string | null;
  category: string | null;
  condition: ProductCondition | null;
  price: PriceRange;
  gradeLevel: number | null;
  subject: string | null;
  productType: ProductType | null;
  location: Location | null;
  rating: number | null;
  sort: SortOption;
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchQuery {
  search: string | null;
  filters: Omit<FilterState, 'search' | 'sort'>;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface SearchRankingFactors {
  titleMatch: number;      // 0-100: relevância do título
  descriptionMatch: number; // 0-50: relevância da descrição
  popularity: number;       // 0-30: visualizações/vendas
  recency: number;          // 0-20: produtos recentes
  rating: number;           // 0-20: classificação
  category: number;         // 0-20: match de categoria
}

export interface RankedProduct {
  id: string | number;
  score: number;
  factors: SearchRankingFactors;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPagination {
  cursor: string | null;
  limit: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SearchRequest {
  query: SearchQuery;
}

export interface SearchResult {
  id: string | number;
  title: string;
  price: number;
  category: string;
  image: string;
  condition: ProductCondition;
  location: Location;
  rating: number;
  reviewCount: number;
  createdAt: string;
  sellerId: string;
  score?: number; // ranking score
}

export interface SearchResponse {
  success: boolean;
  data: {
    products: SearchResult[];
    pagination: PaginationState;
    facets: FacetOptions;
    timing: {
      queryTime: number;
      rankingTime: number;
      totalTime: number;
    };
  };
  error?: string;
}

export interface SuggestionResponse {
  suggestions: SuggestionItem[];
  timing: number;
}

export interface SuggestionItem {
  text: string;
  type: 'search' | 'category' | 'product';
  popularity: number;
  icon?: string;
}

// ============================================================================
// FACETS (para filtering dinâmico)
// ============================================================================

export interface FacetOptions {
  categories: FilterOption[];
  conditions: FilterOption[];
  gradeLevel: FilterOption[];
  subjects: FilterOption[];
  productTypes: FilterOption[];
  locations: FilterOption[];
  priceRanges: FilterOption[];
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheMetadata {
  timestamp: number;
  expiresAt: number;
  isStale: boolean;
  source: 'memory' | 'indexeddb' | 'network';
}

export interface CachedSearchResult {
  result: SearchResponse;
  metadata: CacheMetadata;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class SearchError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

export enum SearchErrorCode {
  INVALID_QUERY = 'INVALID_QUERY',
  INVALID_FILTERS = 'INVALID_FILTERS',
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',
}

// ============================================================================
// URL SYNC TYPES
// ============================================================================

export interface URLSearchParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  gradeLevel?: string;
  subject?: string;
  productType?: string;
  location?: string;
  rating?: string;
  sort?: string;
}
