export type ProductType = 'physical' | 'digital' | 'service';
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
  price: number;
  seller: string;
  img: string;
  statusColor?: string;
  description?: string;
  rating?: number;
  createdAt?: string;
}

export interface FilterState {
  condition: string | null;
  category: string | null;
  priceMin: number;
  priceMax: number;
  rating: number | null;
  search: string;
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
