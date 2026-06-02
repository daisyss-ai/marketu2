/**
 * @file Search & Filter Types
 */

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

export interface SearchQuery {
  search: string | null;
  filters: Omit<FilterState, 'search' | 'sort'>;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface SearchRankingFactors {
  titleMatch: number;
  descriptionMatch: number;
  popularity: number;
  recency: number;
  rating: number;
  category: number;
}

export interface RankedProduct {
  id: string | number;
  score: number;
  factors: SearchRankingFactors;
}

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

export interface SearchRequest {
  query: SearchQuery;
}

export interface SearchResult {
  id: string | number;
  title: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  condition: ProductCondition | string;
  location: Location | string;
  productType?: ProductType | string;
  gradeLevel?: number;
  subject?: string;
  rating: number;
  reviewCount: number;
  views?: number;
  sales?: number;
  createdAt: string;
  updatedAt?: string;
  sellerId: string;
  score?: number;
}

export type Product = SearchResult;

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

export interface FacetOptions {
  categories: FilterOption[];
  conditions: FilterOption[];
  gradeLevel: FilterOption[];
  subjects: FilterOption[];
  productTypes: FilterOption[];
  locations: FilterOption[];
  priceRanges: FilterOption[];
}

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
