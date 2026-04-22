/**
 * API request and response types for MarketU Student Marketplace
 */

// ============ Auth API ============

export interface SignupRequest {
  email: string;
  password: string;
  student_id: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    student_id: string;
    first_name: string | null;
    last_name: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ============ Product API ============

export interface CreateProductRequest {
  title: string;
  description: string;
  category: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images?: File[]; // For multipart upload
}

export interface ProductResponse {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  status: 'available' | 'sold' | 'reserved';
  images: {
    id: string;
    url: string;
    display_order: number;
  }[];
  seller: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: ProductResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  status?: 'available' | 'sold' | 'reserved';
}

// ============ Cart API ============

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number; // Price at time of adding to cart
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface CartResponse {
  items: (CartItem & { product: ProductResponse })[];
  total_items: number;
  total_amount: number;
}

export interface UpdateCartRequest {
  product_id: string;
  quantity: number;
}

// ============ Order API ============

export interface CreateOrderRequest {
  items: {
    product_id: string;
    quantity: number;
  }[];
  delivery_address: string;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  buyer_id: string;
  seller_id: string;
  items: {
    product_id: string;
    title: string;
    quantity: number;
    price_at_purchase: number;
  }[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: OrderResponse[];
  total: number;
  page: number;
  per_page: number;
}

// ============ Review API ============

export interface CreateReviewRequest {
  product_id: string;
  rating: number; // 1-5
  comment?: string;
  reviewer_role: 'buyer' | 'seller';
}

export interface ReviewResponse {
  id: string;
  product_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  reviewer_role: 'buyer' | 'seller';
  created_at: string;
}

// ============ Message API ============

export interface SendMessageRequest {
  recipient_id: string;
  content: string;
}

export interface MessageResponse {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface ConversationResponse {
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  last_message: MessageResponse | null;
  unread_count: number;
}

// ============ Notification API ============

export interface NotificationResponse {
  id: string;
  user_id: string;
  type: 'order' | 'message' | 'review' | 'product' | 'system';
  title: string;
  message: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

// ============ Error Response ============

export interface ErrorResponse {
  error: true;
  message: string;
  code?: string;
  details?: unknown;
}

// ============ Success Response Wrapper ============

export interface SuccessResponse<T> {
  data: T;
  message?: string;
}

// ============ Pagination ============

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============ Search & Filter ============

export interface ProductSearchParams extends PaginationParams {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  status?: 'available' | 'sold' | 'reserved';
}
