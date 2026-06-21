'use client';
 
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { productsAPI } from '../services/api';
import type { FilterState, Product, ProductSearchOptions, ProductSort } from '../types';
 
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
 
function buildSearchOptions(filters: FilterState, sort: ProductSort, page: number): ProductSearchOptions {
  return {
    page,
    limit: 12,
    sort,
    condition: filters.condition,
    category: filters.category,
    minPrice: filters.priceMin > 0 ? filters.priceMin : undefined,
    maxPrice: Number.isFinite(filters.priceMax) ? filters.priceMax : undefined,
    rating: filters.rating,
    search: filters.search || undefined,
    gradeLevel: filters.gradeLevel,
    subject: filters.subject,
    productType: filters.productType,
    location: filters.location,
  };
}
 
export const useFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
 
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilters(searchParams));
  const [sorting, setSorting] = useState<ProductSort>((searchParams.get('sort') as ProductSort) || 'newest');
  const [page, setPage] = useState(searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1);
 
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
 
  const [favorites, setFavorites] = useState<(string | number)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketu_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
 
  // Sincroniza estado com searchParams (navegação back/forward) — nunca chama updateURL
  useEffect(() => {
    const nextFilters = getInitialFilters(searchParams);
    setFilters((prev) => (JSON.stringify(prev) === JSON.stringify(nextFilters) ? prev : nextFilters));
 
    const nextSort = (searchParams.get('sort') as ProductSort) || 'newest';
    setSorting((prev) => (prev === nextSort ? prev : nextSort));
 
    const nextPage = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [searchParams]);
 
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
 
  const fetchProducts = useCallback(async (nextFilters: FilterState, nextSort: ProductSort, nextPage: number) => {
    setLoading(true);
    setError(null);
 
    try {
      const response = await productsAPI.listProducts(buildSearchOptions(nextFilters, nextSort, nextPage));
 
      setProducts(Array.isArray(response?.products) ? response.products : []);
      setTotalProducts(typeof response?.total === 'number' ? response.total : 0);
      setTotalPages(typeof response?.totalPages === 'number' ? response.totalPages : 1);
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos. Tente novamente.');
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);
 
  // Apenas fetch — separado do updateURL para evitar loop
  useEffect(() => {
    fetchProducts(filters, sorting, page);
  }, [fetchProducts, filters, sorting, page]);
 
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: FilterState[keyof FilterState]) => {
    const next = { ...filters, [filterType]: value };
    setFilters(next);
    setPage(1);
    updateURL(next, sorting, 1);
  }, [filters, sorting, updateURL]);
 
  const handlePriceChange = useCallback((min: number, max: number) => {
    const next = { ...filters, priceMin: min, priceMax: max };
    setFilters(next);
    setPage(1);
    updateURL(next, sorting, 1);
  }, [filters, sorting, updateURL]);
 
  const handleSortChange = useCallback((newSort: string) => {
    setSorting(newSort as ProductSort);
    setPage(1);
    updateURL(filters, newSort as ProductSort, 1);
  }, [filters, updateURL]);
 
  const handlePageChange = useCallback((newPage: number) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setPage(newPage);
    updateURL(filters, sorting, newPage);
  }, [filters, sorting, updateURL]);
 
  const handleClearAllFilters = useCallback(() => {
    const clean: FilterState = {
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
    };
    setFilters(clean);
    setSorting('newest');
    setPage(1);
    updateURL(clean, 'newest', 1);
  }, [updateURL]);
 
  const handleClearFilter = useCallback((filterType: keyof FilterState) => {
    const next = {
      ...filters,
      [filterType]:
        filterType === 'priceMin'
          ? 0
          : filterType === 'priceMax'
          ? Infinity
          : filterType === 'search'
          ? ''
          : null,
    };
    setFilters(next);
    setPage(1);
    updateURL(next, sorting, 1);
  }, [filters, sorting, updateURL]);
 
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
    products,
    loading,
    error,
    totalProducts,
    totalPages,
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