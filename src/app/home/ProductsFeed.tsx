'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProductGrid from '@/components/produtos/ProductGrid';
import { FilterState, Product } from '@/types';

type ProductsApiResponse = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
};

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
  const qs = useMemo(() => buildQuery(filters, sorting, page), [filters, sorting, page]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductsApiResponse>({
    products: [],
    total: 0,
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    const url = `/api/products?${qs}`;
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setData((prev) => ({ ...prev, products: [] }));

    fetch(url, { method: 'GET', signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (json && (json.error || json.message)) || 'Erro ao carregar produtos';
          throw new Error(msg);
        }
        return (json?.data ?? json) as ProductsApiResponse;
      })
      .then((next) => {
        setData({
          products: Array.isArray(next.products) ? next.products : [],
          total: typeof next.total === 'number' ? next.total : 0,
          page: typeof next.page === 'number' ? next.page : page,
          limit: typeof next.limit === 'number' ? next.limit : 12,
        });
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Erro ao carregar produtos';
        setError(msg);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [page, qs]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 12)));

  return (
    <ProductGrid
      products={data.products}
      loading={loading}
      error={error}
      totalProducts={data.total}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onToggleFavorite={onToggleFavorite}
      favorites={favorites}
    />
  );
}
