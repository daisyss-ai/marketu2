import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../services/api';

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [filters, setFilters] = useState({
    condition: searchParams.get('condition') || null,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')) : 0,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')) : Infinity,
    category: searchParams.get('category') || null,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')) : null,
    searchTerm: searchParams.get('search') || '',
  });

  const [sorting, setSorting] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(searchParams.get('page') ? parseInt(searchParams.get('page')) : 1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('marketu_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters, newSort, newPage) => {
    const params = new URLSearchParams();

    if (newFilters?.condition) params.set('condition', newFilters.condition);
    if (newFilters?.category) params.set('category', newFilters.category);
    if (newFilters?.priceMin && newFilters.priceMin > 0) params.set('priceMin', newFilters.priceMin);
    if (newFilters?.priceMax && newFilters.priceMax !== Infinity) params.set('priceMax', newFilters.priceMax);
    if (newFilters?.rating) params.set('rating', newFilters.rating);
    if (newFilters?.searchTerm) params.set('search', newFilters.searchTerm);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    if (newPage && newPage > 1) params.set('page', newPage);

    setSearchParams(params);
  }, [setSearchParams]);

  // Fetch products
  const fetchProducts = useCallback(async (filterParams, sortParam, pageParam) => {
    setLoading(true);
    setError(null);

    try {
      const apiOptions = {
        page: pageParam,
        limit: 12,
        sort: sortParam,
      };

      if (filterParams.condition) apiOptions.condition = filterParams.condition;
      if (filterParams.category) apiOptions.category = filterParams.category;
      if (filterParams.priceMin && filterParams.priceMin > 0) apiOptions.minPrice = filterParams.priceMin;
      if (filterParams.priceMax && filterParams.priceMax !== Infinity) apiOptions.maxPrice = filterParams.priceMax;
      if (filterParams.searchTerm) apiOptions.search = filterParams.searchTerm;

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
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [filterType]: value };
      return updated;
    });
    setPage(1); // Reset to page 1 when filter changes
  }, []);

  // Handle price range change
  const handlePriceChange = useCallback((min, max) => {
    setFilters((prev) => ({
      ...prev,
      priceMin: min,
      priceMax: max,
    }));
    setPage(1);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSort) => {
    setSorting(newSort);
    setPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setFilters({
      condition: null,
      priceMin: 0,
      priceMax: Infinity,
      category: null,
      rating: null,
      searchTerm: '',
    });
    setSorting('newest');
    setPage(1);
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Clear specific filter
  const handleClearFilter = useCallback((filterType) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: filterType === 'priceMin' || filterType === 'priceMax' ? (filterType === 'priceMin' ? 0 : Infinity) : null,
    }));
    setPage(1);
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback((productId) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem('marketu_favorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.condition !== null ||
      filters.category !== null ||
      filters.rating !== null ||
      filters.searchTerm !== '' ||
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
    if (filters.searchTerm) count++;
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
