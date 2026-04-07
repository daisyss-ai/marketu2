'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { productsAPI } from '../services/api';
import { FilterState } from '../types';

export const useFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [filters, setFilters] = useState<FilterState>({
    condition: searchParams.get('condition') || null,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : 0,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : Infinity,
    category: searchParams.get('category') || null,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null,
    search: searchParams.get('search') || '',
  });

  const [sorting, setSorting] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  // Fetch products
  const fetchProducts = useCallback(async (filterParams: FilterState, sortParam: string, pageParam: number) => {
    setLoading(true);
    setError(null);

    try {
      const apiOptions: any = {
        page: pageParam,
        limit: 12,
        sort: sortParam,
      };

      if (filterParams.condition) apiOptions.condition = filterParams.condition;
      if (filterParams.category) apiOptions.category = filterParams.category;
      if (filterParams.priceMin && filterParams.priceMin > 0) apiOptions.minPrice = filterParams.priceMin;
      if (filterParams.priceMax && filterParams.priceMax !== Infinity) apiOptions.maxPrice = filterParams.priceMax;
      if (filterParams.search) apiOptions.search = filterParams.search;

      const response = await productsAPI.listProducts(apiOptions);

      setProducts(response.products || []);
      setTotalProducts(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / 12));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erro ao carregar produtos. Tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on filter/sort/page change
  useEffect(() => {
    fetchProducts(filters, sorting, page);
    updateURL(filters, sorting, page);
  }, [filters, sorting, page, fetchProducts, updateURL]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {
    setFilters((prev) => {
      const updated = { ...prev, [filterType]: value };
      return updated;
    });
    setPage(1); // Reset to page 1 when filter changes
  }, []);

  // Handle price range change
  const handlePriceChange = useCallback((min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      priceMin: min,
      priceMax: max,
    }));
    setPage(1);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSort: string) => {
    setSorting(newSort);
    setPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setFilters({
      condition: null,
      priceMin: 0,
      priceMax: Infinity,
      category: null,
      rating: null,
      search: '',
    });
    setSorting('newest');
    setPage(1);
  }, []);

  // Clear specific filter
  const handleClearFilter = useCallback((filterType: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: filterType === 'priceMin' || filterType === 'priceMax' 
        ? (filterType === 'priceMin' ? 0 : Infinity) 
        : (filterType === 'search' ? '' : null),
    }));
    setPage(1);
  }, []);

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
    products,
    loading,
    error,
    totalProducts,
    totalPages,
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
