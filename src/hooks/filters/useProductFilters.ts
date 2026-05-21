/**
 * @file useProductFilters Hook
 * @description Hook para gerenciar filtros sincronizados com URL
 */

'use client';

import { PAGINATION } from '@/lib/constants/search';
import { searchQueryToUrl, urlToSearchQuery } from '@/lib/utils/url-sync';
import type {
  FilterState,
  SearchQuery,
  SortOption,
  URLSearchParams as URLSearchParamsType,
} from '@/types/search';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface UseFiltersReturn {
  query: SearchQuery;
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: unknown) => void;
  updateFilters: (newFilters: Partial<Omit<FilterState, 'search' | 'sort'>>) => void;
  resetFilters: () => void;
  clearSearch: () => void;
  setPage: (page: number) => void;
  setSort: (sort: SortOption) => void;
  hasActiveFilters: () => boolean;
  getShareableURL: () => string;
}

export function useProductFilters(): UseFiltersReturn {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<SearchQuery>(() => {
    const params = Object.fromEntries(searchParams.entries()) as URLSearchParamsType;
    return urlToSearchQuery(params);
  });

  useEffect(() => {
    const url = searchQueryToUrl(query);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/home${url}`);
    }
  }, [query]);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries()) as URLSearchParamsType;
    const nextQuery = urlToSearchQuery(params);
    if (JSON.stringify(nextQuery) !== JSON.stringify(query)) {
      setQuery(nextQuery);
    }
  }, [query, searchParams]);

  const updateFilter = useCallback((key: keyof FilterState, value: unknown) => {
    setQuery((prev) => {
      if (key === 'search') {
        return {
          ...prev,
          search: (value as string | null) ?? null,
          page: 1,
        };
      }

      if (key === 'sort') {
        return {
          ...prev,
          sort: value as SortOption,
          page: 1,
        };
      }

      return {
        ...prev,
        filters: {
          ...prev.filters,
          [key]: value,
        },
        page: 1,
      };
    });
  }, []);

  const updateFilters = useCallback((newFilters: Partial<Omit<FilterState, 'search' | 'sort'>>) => {
    setQuery((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
      },
      page: 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setQuery({
      search: null,
      filters: {
        category: null,
        condition: null,
        price: { min: 0, max: 1000000 },
        gradeLevel: null,
        subject: null,
        productType: null,
        location: null,
        rating: null,
      },
      sort: 'newest' as SortOption,
      page: 1,
      limit: PAGINATION.DEFAULT_LIMIT,
    });
  }, []);

  const clearSearch = useCallback(() => {
    updateFilter('search', null);
  }, [updateFilter]);

  const setPage = useCallback((page: number) => {
    setQuery((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setQuery((prev) => ({
      ...prev,
      sort,
      page: 1,
    }));
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      query.search !== null ||
      query.filters.category !== null ||
      query.filters.condition !== null ||
      query.filters.price.min > 0 ||
      query.filters.price.max < 1000000 ||
      query.filters.gradeLevel !== null ||
      query.filters.subject !== null ||
      query.filters.productType !== null ||
      query.filters.location !== null ||
      query.filters.rating !== null ||
      query.sort !== ('newest' as SortOption)
    );
  }, [query]);

  const getShareableURL = useCallback(() => {
    const url = searchQueryToUrl(query);
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/home${url}`;
    }
    return '';
  }, [query]);

  return {
    query,
    filters: {
      ...query.filters,
      search: query.search,
      sort: query.sort,
    } as FilterState,
    updateFilter,
    updateFilters,
    resetFilters,
    clearSearch,
    setPage,
    setSort,
    hasActiveFilters,
    getShareableURL,
  };
}

export function useFilterValue<K extends keyof FilterState>(key: K) {
  const { filters, updateFilter } = useProductFilters();

  return {
    value: filters[key],
    setValue: (value: FilterState[K]) => updateFilter(key, value),
  };
}
