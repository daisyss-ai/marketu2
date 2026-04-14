'use client';

import React, { use } from 'react';
import ProductGrid from '@/components/produtos/ProductGrid';
import { FilterState, Product } from '@/types';

type ProductsApiResponse = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
};

const promiseCache = new Map<string, Promise<ProductsApiResponse>>();

function fetchProducts(key: string, url: string) {
  const cached = promiseCache.get(key);
  if (cached) return cached;

  const p = fetch(url, { method: 'GET' })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || 'Erro ao carregar produtos';
        throw new Error(msg);
      }
      return (json?.data ?? json) as ProductsApiResponse;
    })
    .then((data) => ({
      products: Array.isArray(data.products) ? data.products : [],
      total: typeof data.total === 'number' ? data.total : 0,
      page: typeof data.page === 'number' ? data.page : 1,
      limit: typeof data.limit === 'number' ? data.limit : 12,
    }));

  promiseCache.set(key, p);
  return p;
}

function buildQuery(filters: FilterState, sorting: string, page: number) {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('limit', '12');
  if (sorting && sorting !== 'newest') params.set('sort', sorting);

  if (filters.condition) params.set('condition', String(filters.condition));
  if (filters.category) params.set('category', String(filters.category));
  if (filters.search) params.set('search', filters.search);
  if (filters.rating) params.set('rating', String(filters.rating));

  if (filters.priceMin && filters.priceMin > 0) params.set('minPrice', String(filters.priceMin));
  if (filters.priceMax && filters.priceMax !== Infinity) params.set('maxPrice', String(filters.priceMax));

  return params.toString();
}

export default function ProductsFeed({
  filters,
  sorting,
  page,
  favorites,
  onPageChange,
  onToggleFavorite,
}: {
  filters: FilterState;
  sorting: string;
  page: number;
  favorites: (string | number)[];
  onPageChange: (page: number) => void;
  onToggleFavorite: (id: string | number) => void;
}) {
  const qs = buildQuery(filters, sorting, page);
  const url = `/api/products?${qs}`;

  const data = use(fetchProducts(qs, url));
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 12)));

  return (
    <ProductGrid
      products={data.products}
      loading={false}
      error={null}
      totalProducts={data.total}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onToggleFavorite={onToggleFavorite}
      favorites={favorites}
    />
  );
}

