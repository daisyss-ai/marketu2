import { LucideIcon } from 'lucide-react';

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
  studentId?: string;
  phone?: string;
  avatarUrl?: string;
  token?: string;
}

export interface FormOption {
  label: string;
  value: string | number;
}
