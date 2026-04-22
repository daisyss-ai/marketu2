/**
 * Helper functions for filtering, sorting, and formatting products
 */

import type { Product } from '@/types';

export const formatPrice = (price: number): string => {
  if (typeof price !== 'number') return String(price);
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(price);
};

export const formatPriceShort = (price: number): string => {
  if (typeof price !== 'number') return String(price);
  return price.toLocaleString('pt-AO');
};

export const conditionLabels: Record<string, string> = {
  novo: 'Novo',
  como_novo: 'Como Novo',
  usado: 'Usado',
};

export const categoryLabels: Record<string, string> = {
  material_escolar: 'Material Escolar',
  tecnologia: 'Tecnologia',
  livros: 'Livros',
  roupas: 'Roupas e Acessórios',
  servicos: 'Serviços',
  outros: 'Outros',
};

export const sortLabels: Record<string, string> = {
  newest: 'Mais Recentes',
  price_asc: 'Menor Preço',
  price_desc: 'Maior Preço',
  rating: 'Melhores Avaliações',
};

export interface ProductFilters {
  query?: string;
  category?: string | null;
  minPrice?: number;
  maxPrice?: number;
  condition?: string | null;
  status?: string;
}

/**
 * Builds URLSearchParams for product API queries
 */
export const buildQueryString = (filters: ProductFilters, sorting?: string, page?: number): string => {
  const params = new URLSearchParams();

  if (filters?.condition) params.set('condition', filters.condition);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.minPrice && filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice && filters.maxPrice !== Infinity) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.query) params.set('query', filters.query);
  if (sorting && sorting !== 'newest') params.set('sort', sorting);
  if (page && page > 1) params.set('page', String(page));

  return params.toString();
};

/**
 * Builds Supabase filter query from filters object
 * Returns URL query string for API endpoint
 */
export const buildFilterQuery = (filters: ProductFilters): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.query?.trim()) {
    params.set('query', filters.query.trim());
  }

  if (filters.category && filters.category !== 'todos') {
    params.set('category', filters.category);
  }

  if (filters.condition && filters.condition !== 'todos') {
    params.set('condition', filters.condition);
  }

  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.set('minPrice', String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== Infinity) {
    params.set('maxPrice', String(filters.maxPrice));
  }

  if (filters.status && filters.status !== 'active') {
    params.set('status', filters.status);
  }

  return params;
};

/**
 * Client-side product search and filtering
 * Searches product title and description
 */
export const applySearch = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm?.trim()) return products;

  const lowerTerm = searchTerm.toLowerCase();
  return products.filter(
    (product) =>
      product.title.toLowerCase().includes(lowerTerm) ||
      (product.description?.toLowerCase() || '').includes(lowerTerm)
  );
};

/**
 * Client-side product filtering by multiple criteria
 */
export const applyFilters = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter((product) => {
    // Category filter
    if (filters.category && filters.category !== 'todos' && product.category !== filters.category) {
      return false;
    }

    // Condition filter
    if (filters.condition && filters.condition !== 'todos' && product.condition !== filters.condition) {
      return false;
    }

    // Price range filter
    if (filters.minPrice !== undefined && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
      return false;
    }

    return true;
  });
};

/**
 * Sort products by various criteria
 */
export const sortProducts = (
  products: Product[],
  sortBy: string = 'newest'
): Product[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);

    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    case 'newest':
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
};

/**
 * Combined search, filter, and sort
 */
export const processProducts = (
  products: Product[],
  filters: ProductFilters,
  sortBy: string = 'newest'
): Product[] => {
  let result = products;

  if (filters.query) {
    result = applySearch(result, filters.query);
  }

  result = applyFilters(result, filters);
  result = sortProducts(result, sortBy);

  return result;
};

export const getActiveFiltersCount = (filters: ProductFilters): number => {
  let count = 0;
  if (filters.query?.trim()) count++;
  if (filters.condition && filters.condition !== 'todos') count++;
  if (filters.category && filters.category !== 'todos') count++;
  if (filters.minPrice !== undefined && filters.minPrice > 0) count++;
  if (filters.maxPrice !== undefined && filters.maxPrice !== Infinity) count++;
  return count;
};

export const hasAnyActiveFilter = (filters: ProductFilters): boolean => {
  return getActiveFiltersCount(filters) > 0;
};

export const getStockStatus = (stock: number): { label: string; color: string } => {
  if (stock > 5) return { label: 'Em stock', color: 'bg-green-400' };
  if (stock > 0) return { label: 'Poucas unidades', color: 'bg-red-400' };
  return { label: 'Fora de stock', color: 'bg-gray-400' };
};
