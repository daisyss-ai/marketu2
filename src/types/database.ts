/**
 * Database entity types for MarketU Student Marketplace
 * Generated from Supabase schema
 */

export interface User {
  id: string; // UUID
  institution_id: string; // UUID
  enrollment_code: string;
  password_hash?: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'suspended' | null;
  is_verified: boolean | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Product {
  id: string; // UUID
  seller_id: string; // UUID, FK to users.id
  title: string;
  description: string;
  category: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  status: 'available' | 'sold' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string; // UUID
  product_id: string; // UUID, FK to products.id
  image_url: string; // Path in Supabase Storage
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string; // UUID
  buyer_id: string; // UUID, FK to users.id
  seller_id: string; // UUID, FK to users.id
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string; // UUID
  order_id: string; // UUID, FK to orders.id
  product_id: string; // UUID, FK to products.id
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export interface Message {
  id: string; // UUID
  sender_id: string; // UUID, FK to users.id
  recipient_id: string; // UUID, FK to users.id
  content: string;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string; // UUID
  product_id: string; // UUID, FK to products.id
  reviewer_id: string; // UUID, FK to users.id
  reviewer_role: 'buyer' | 'seller';
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string; // UUID
  user_id: string; // UUID, FK to users.id
  type: 'order' | 'message' | 'review' | 'product' | 'system';
  title: string;
  message: string;
  related_id: string | null; // ID of related entity (product, order, etc.)
  read: boolean;
  created_at: string;
}

/**
 * Database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductImage, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
