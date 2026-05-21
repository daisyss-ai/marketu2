/**
 * @file Product Types
 * @description Tipos para produtos
 */

import { Location, ProductCondition, ProductType } from './search';

export interface Product {
  id: string | number;
  title: string;
  category: string;
  price: number;
  description: string;
  condition: ProductCondition;
  location: Location;
  productType: ProductType;
  gradeLevel?: number;
  subject?: string;
  image: string;
  imageUrl?: string;
  seller: string;
  sellerId: string;
  rating: number;
  reviewCount: number;
  views: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  statusColor?: string;
}

export interface ProductDetail extends Product {
  images: string[];
  details: Record<string, string>;
  tags: string[];
  relatedProducts: Product[];
}

export interface CreateProductInput {
  title: string;
  category: string;
  price: number;
  description: string;
  condition: ProductCondition;
  location: Location;
  productType: ProductType;
  gradeLevel?: number;
  subject?: string;
  image: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string | number;
}

export interface ProductStats {
  totalProducts: number;
  averagePrice: number;
  averageRating: number;
  mostPopularCategory: string;
}
