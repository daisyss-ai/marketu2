import type { Product } from '../../../../types';

export type ProductSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export type ProductSearchFilters = {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  gradeLevel?: number;
  subject?: string;
  productType?: 'material' | 'servico';
  location?: string;
  minRating?: number;
};

export type ProductSearchQuery = ProductSearchFilters & {
  page: number;
  limit: number;
  sort: ProductSort;
};

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  offset: number;
  to: number;
};

export type ProductSearchMeta = {
  pagination: ProductPagination;
  sort: ProductSort;
  search?: string;
  appliedFilters: ProductSearchFilters;
};

export type ProductSearchResult = {
  products: Product[];
  meta: ProductSearchMeta;
};

export type ProductSuggestion = {
  type: 'product';
  value: string;
  label: string;
};

export type ProductRow = {
  id: string | number;
  title: string;
  category: string;
  price:  number;
  seller: string;
  img: string;
  description?: string | null;
  condition?: string | null;
  location?: string | null;
  subject?: string | null;
  grade_level?: number | null;
  product_type?: 'material' | 'servico' | null;
  rating?: number | null;
  reviews?: number | null;
  created_at?: string | null;
  user_id?: string | null;
  search_rank?: number | null;
  total_count?: number | null;
};
