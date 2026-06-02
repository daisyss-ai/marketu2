export type ProductEntityType = 'physical' | 'digital' | 'service';
export type ProductConditionEntity = 'new' | 'used' | 'digital';
export type ProductCondition = 'new' | 'used' | 'digital';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  type: ProductType;
  title: string;
  description: string | null;
  price: number | null;
  is_free: boolean | null;
  is_active: boolean | null;
  is_approved: boolean | null;
  rating: number | null;
  total_reviews: number | null;
  total_sales: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  media_type: string | null;
  filename: string | null;
  size_bytes: number | null;
  position: number | null;
  is_preview: boolean | null;
  created_at: string;
}

export interface ProductStock {
  id: string;
  product_id: string;
  quantity: number | null;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  preview_url: string | null;
  stock: number | null;
  moderation_status: ModerationStatus | null;
  category_name: string | null;
}

export interface ProductFormData {
  title: string;
  description: string;
  category_id: string;
  condition: ProductCondition;
  price: number;
  is_free: boolean;
  quantity: number;
  images: File[];
}

// UI model used by feed/product cards (kept to avoid leaking DB shape to the UI).
export interface ProductCardItem {
  id: string;
  title: string;
  category: string;
  price: number | string;
  seller: string;
  img: string;
  statusColor?: string;
  description?: string;
  condition?: string;
  location?: string;
  subject?: string;
  gradeLevel?: number;
  productType?: 'material' | 'servico';
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

