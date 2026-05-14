export interface Product {
  id: string | number;
  title: string;
  category: string;
  price: string | number;
  seller: string;
  img: string;
  statusColor?: string;
  description?: string;
  condition?: string;
  location?: string;
  subject?: string;
  gradeLevel?: number;
  productType?: 'material' | 'servico';
  rating?: number;
  reviews?: number;
  createdAt?: string;
  userId?: string;
  searchScore?: number;
}

export interface FilterState {
  condition: string | null;
  category: string | null;
  priceMin: number;
  priceMax: number;
  rating: number | null;
  search: string;
  gradeLevel: number | null;
  subject: string | null;
  productType: 'material' | 'servico' | null;
  location: string | null;
}

export type ProductSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  category?: string | null;
  condition?: string | null;
  minPrice?: number;
  maxPrice?: number;
  rating?: number | null;
  search?: string;
  gradeLevel?: number | null;
  subject?: string | null;
  productType?: 'material' | 'servico' | null;
  location?: string | null;
  sort?: ProductSort;
}

export interface ProductSearchMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    offset: number;
    to: number;
  };
  sort: ProductSort;
  search?: string;
  appliedFilters: Record<string, unknown>;
}

export interface ProductSuggestion {
  type: 'product';
  value: string;
  label: string;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sort: ProductSort;
  appliedFilters: Record<string, unknown>;
  search?: string;
  meta: ProductSearchMeta;
}

export interface ProductSuggestionOptions {
  limit?: number;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface User {
  id: string;
  email?: string;
  fullName?: string;
  studentId?: string;
  phone?: string;
  avatarUrl?: string;
  token?: string;
}

export interface FormOption {
  label: string;
  value: string | number;
}
