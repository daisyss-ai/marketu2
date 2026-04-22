'use client';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterState } from '../types';

export const useFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<FilterState>(() => ({
    condition: searchParams.get('condition') || null,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!, 10) : 0,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!, 10) : Infinity,
    category: searchParams.get('category') || null,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : null,
    search: searchParams.get('search') || '',
  }), [searchParams]);

  const sorting = useMemo(() => searchParams.get('sort') || 'newest', [searchParams]);
  const page = useMemo(() => (searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1), [searchParams]);
  const [favorites, setFavorites] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketu_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState, newSort: string, newPage: number) => {
    const params = new URLSearchParams();

    if (newFilters?.condition) params.set('condition', newFilters.condition);
    if (newFilters?.category) params.set('category', newFilters.category);
    if (newFilters?.priceMin && newFilters.priceMin > 0) params.set('priceMin', String(newFilters.priceMin));
    if (newFilters?.priceMax && newFilters.priceMax !== Infinity) params.set('priceMax', String(newFilters.priceMax));
    if (newFilters?.rating) params.set('rating', String(newFilters.rating));
    if (newFilters?.search) params.set('search', newFilters.search);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    if (newPage && newPage > 1) params.set('page', String(newPage));

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {
    updateURL({ ...filters, [filterType]: value }, sorting, 1);
  }, [filters, sorting, updateURL]);

  // Handle price range change
  const handlePriceChange = useCallback((min: number, max: number) => {
    updateURL({ ...filters, priceMin: min, priceMax: max }, sorting, 1);
  }, [filters, sorting, updateURL]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: string) => {
    updateURL(filters, newSort, 1);
  }, [filters, updateURL]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    updateURL(filters, sorting, newPage);
  }, [filters, sorting, updateURL]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    updateURL({
      condition: null,
      priceMin: 0,
      priceMax: Infinity,
      category: null,
      rating: null,
      search: '',
    }, 'newest', 1);
  }, [updateURL]);

  // Clear specific filter
  const handleClearFilter = useCallback((filterType: keyof FilterState) => {
    updateURL({
      ...filters,
      [filterType]: filterType === 'priceMin' || filterType === 'priceMax'
        ? (filterType === 'priceMin' ? 0 : Infinity)
        : (filterType === 'search' ? '' : null),
    }, sorting, 1);
  }, [filters, sorting, updateURL]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((productId: string | number) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('marketu_favorites', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.condition !== null ||
      filters.category !== null ||
      filters.rating !== null ||
      filters.search !== '' ||
      filters.priceMin > 0 ||
      filters.priceMax !== Infinity
    );
  }, [filters]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.condition) count++;
    if (filters.category) count++;
    if (filters.rating) count++;
    if (filters.search) count++;
    if (filters.priceMin > 0 || filters.priceMax !== Infinity) count++;
    return count;
  }, [filters]);

  return {
    // State
    filters,
    sorting,
    page,
    favorites,

    // Handlers
    handleFilterChange,
    handlePriceChange,
    handleSortChange,
    handlePageChange,
    handleClearAllFilters,
    handleClearFilter,
    handleToggleFavorite,

    // Helpers
    hasActiveFilters,
    getActiveFilterCount,
  };
};
