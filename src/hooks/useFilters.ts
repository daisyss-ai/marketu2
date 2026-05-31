'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterState, ProductSort } from '../types';

type SearchParamsLike = Pick<URLSearchParams, 'get'>;

function getInitialFilters(searchParams: SearchParamsLike): FilterState {
  const productTypeRaw = searchParams.get('productType');

  return {
    condition: searchParams.get('condition') || null,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin') || '0', 10) : 0,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax') || '0', 10) : Infinity,
    category: searchParams.get('category') || null,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating') || '0', 10) : null,
    search: searchParams.get('search') || '',
    gradeLevel: searchParams.get('gradeLevel') ? parseInt(searchParams.get('gradeLevel') || '0', 10) : null,
    subject: searchParams.get('subject') || null,
    productType:
      productTypeRaw === 'material' || productTypeRaw === 'servico' ? productTypeRaw : null,
    location: searchParams.get('location') || null,
  };
}

export const useFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => getInitialFilters(searchParams), [searchParams]);
  const sorting = useMemo<ProductSort>(() => {
    const sortParam = searchParams.get('sort');
    return sortParam === 'relevance' ||
      sortParam === 'price_asc' ||
      sortParam === 'price_desc' ||
      sortParam === 'rating'
      ? sortParam
      : 'newest';
  }, [searchParams]);
  const page = useMemo(
    () => (searchParams.get('page') ? parseInt(searchParams.get('page') || '1', 10) : 1),
    [searchParams]
  );
  const [favorites, setFavorites] = useState<(string | number)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketu_favorites');
      return saved ? JSON.parse(saved) : [];
    }

    return [];
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('marketu_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const updateURL = useCallback(
    (nextFilters: FilterState, nextSort: ProductSort, nextPage: number) => {
      const params = new URLSearchParams();

      if (nextFilters.condition) params.set('condition', nextFilters.condition);
      if (nextFilters.category) params.set('category', nextFilters.category);
      if (nextFilters.priceMin > 0) params.set('priceMin', String(nextFilters.priceMin));
      if (Number.isFinite(nextFilters.priceMax)) params.set('priceMax', String(nextFilters.priceMax));
      if (nextFilters.rating) params.set('rating', String(nextFilters.rating));
      if (nextFilters.search) params.set('search', nextFilters.search);
      if (nextFilters.gradeLevel) params.set('gradeLevel', String(nextFilters.gradeLevel));
      if (nextFilters.subject) params.set('subject', nextFilters.subject);
      if (nextFilters.productType) params.set('productType', nextFilters.productType);
      if (nextFilters.location) params.set('location', nextFilters.location);
      if (nextSort !== 'newest') params.set('sort', nextSort);
      if (nextPage > 1) params.set('page', String(nextPage));

      const query = params.toString();
      const href = (query ? `${pathname}?${query}` : pathname) as Route;
      router.push(href, { scroll: false });
    },
    [pathname, router]
  );

  const handleFilterChange = useCallback(
    (filterType: keyof FilterState, value: FilterState[keyof FilterState]) => {
      updateURL({ ...filters, [filterType]: value }, sorting, 1);
    },
    [filters, sorting, updateURL]
  );

  const handlePriceChange = useCallback(
    (min: number, max: number) => {
      updateURL({ ...filters, priceMin: min, priceMax: max }, sorting, 1);
    },
    [filters, sorting, updateURL]
  );

  const handleSortChange = useCallback(
    (newSort: string) => {
      updateURL(filters, newSort as ProductSort, 1);
    },
    [filters, updateURL]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      updateURL(filters, sorting, newPage);
    },
    [filters, sorting, updateURL]
  );

  const handleClearAllFilters = useCallback(() => {
    updateURL(
      {
        condition: null,
        priceMin: 0,
        priceMax: Infinity,
        category: null,
        rating: null,
        search: '',
        gradeLevel: null,
        subject: null,
        productType: null,
        location: null,
      },
      'newest',
      1
    );
  }, [updateURL]);

  const handleClearFilter = useCallback(
    (filterType: keyof FilterState) => {
      updateURL(
        {
          ...filters,
          [filterType]:
            filterType === 'priceMin' || filterType === 'priceMax'
              ? filterType === 'priceMin'
                ? 0
                : Infinity
              : filterType === 'search'
                ? ''
                : null,
        },
        sorting,
        1
      );
    },
    [filters, sorting, updateURL]
  );

  const handleToggleFavorite = useCallback((productId: string | number) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.condition !== null ||
      filters.category !== null ||
      filters.rating !== null ||
      filters.search !== '' ||
      filters.gradeLevel !== null ||
      filters.subject !== null ||
      filters.productType !== null ||
      filters.location !== null ||
      filters.priceMin > 0 ||
      filters.priceMax !== Infinity
    );
  }, [filters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.condition) count++;
    if (filters.category) count++;
    if (filters.rating) count++;
    if (filters.search) count++;
    if (filters.gradeLevel) count++;
    if (filters.subject) count++;
    if (filters.productType) count++;
    if (filters.location) count++;
    if (filters.priceMin > 0 || filters.priceMax !== Infinity) count++;
    return count;
  }, [filters]);

  return {
    filters,
    sorting,
    page,
    favorites,
    handleFilterChange,
    handlePriceChange,
    handleSortChange,
    handlePageChange,
    handleClearAllFilters,
    handleClearFilter,
    handleToggleFavorite,
    hasActiveFilters,
    getActiveFilterCount,
  };
};

