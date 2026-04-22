import { LucideIcon } from 'lucide-react';

// ============ Database Entity Types ============
export type {
  User as DatabaseUser,
  Product as DatabaseProduct,
  ProductImage,
  Order,
  OrderItem,
  Message,
  Review,
  Notification,
  Database,
} from './database';

// ============ API Request/Response Types ============
export type {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  LogoutResponse,
  CreateProductRequest,
  ProductResponse,
  ProductListResponse,
  UpdateProductRequest,
  CartItem,
  AddToCartRequest,
  CartResponse,
  UpdateCartRequest,
  CreateOrderRequest,
  OrderResponse,
  OrderListResponse,
  CreateReviewRequest,
  ReviewResponse,
  SendMessageRequest,
  MessageResponse,
  ConversationResponse,
  NotificationResponse,
  ErrorResponse,
  SuccessResponse,
  PaginationParams,
  ProductSearchParams,
} from './api';

// ============ UI Component Types (Legacy) ============
// These types are used by existing components and should be gradually migrated to the new types above

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
  rating?: number;
  reviews?: number;
  createdAt?: string;
  userId?: string;
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
  firstName?: string;
  lastName?: string;
  studentId?: string;
  studentIdVerified?: boolean;
  phone?: string;
  avatarUrl?: string;
  token?: string;
}

export interface FormOption {
  label: string;
  value: string | number;
}
