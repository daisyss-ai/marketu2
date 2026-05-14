/**
 * @file useProductFilters Hook
 * @description Hook para gerenciar filtros sincronizados com URL
 * - Sincroniza com URL (bookmarkable, shareable)
 * - Monitora mudanças
 * - Aplica filtros de forma otimizada
 */

'use client';

import { PAGINATION } from '@/lib/constants/search';
import {
    searchQueryToUrl,
    URLSearchParams as URLSearchParamsType,
    urlToSearchQuery,
} from '@/lib/utils/url-sync';
import {
    FilterState,
    SearchQuery,
    SortOption
} from '@/types/search';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface UseFiltersReturn {
  query: SearchQuery;
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearSearch: () => void;
  setPage: (page: number) => void;
  setSort: (sort: SortOption) => void;
  hasActiveFilters: () => boolean;
  getShareableURL: () => string;
}

const DEFAULT_FILTERS: FilterState = {
  search: null,
  category: null,
  condition: null,
  price: { min: 0, max: 1000000 },
  gradeLevel: null,
  subject: null,
  productType: null,
  location: null,
  rating: null,
  sort: SortOption.NEWEST,
};

/**
 * Hook central para gerenciar filtros de busca
 * Sincroniza com URL, gerencia estado, aplica mudanças
 */
export function useProductFilters(): UseFiltersReturn {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<SearchQuery>(() => {
    const params = Object.fromEntries(searchParams.entries()) as URLSearchParamsType;
    return urlToSearchQuery(params);
  });

  // Sincronizar URL quando query muda
  useEffect(() => {
    const url = searchQueryToUrl(query);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/home${url}`);
    }
  }, [query]);

  // Sincronizar quando URL muda (browser back/forward)
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries()) as URLSearchParamsType;
    const newQuery = urlToSearchQuery(params);

    // Só atualiza se realmente mudou
    if (JSON.stringify(newQuery) !== JSON.stringify(query)) {
      setQuery(newQuery);
    }
  }, [searchParams]);

  /**
   * Atualizar um filtro específico
   */
  const updateFilter = useCallback(
    (key: keyof FilterState, value: any) => {
      setQuery((prev) => ({
        ...prev,
        [key]: value,
        page: 1, // Reset página ao mudar filtro
      }));
    },
    []
  );

  /**
   * Atualizar múltiplos filtros
   */
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setQuery((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset página ao mudar filtros
    }));
  }, []);

  /**
   * Limpar todos os filtros
   */
  const resetFilters = useCallback(() => {
    setQuery({
      ...DEFAULT_FILTERS,
      page: 1,
      limit: PAGINATION.DEFAULT_LIMIT,
    });
  }, []);

  /**
   * Limpar apenas a busca
   */
  const clearSearch = useCallback(() => {
    updateFilter('search', null);
  }, [updateFilter]);

  /**
   * Mudar página de paginação
   */
  const setPage = useCallback((page: number) => {
    setQuery((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }, []);

  /**
   * Mudar ordenação
   */
  const setSort = useCallback((sort: SortOption) => {
    setQuery((prev) => ({
      ...prev,
      sort,
      page: 1, // Reset página ao mudar sort
    }));
  }, []);

  /**
   * Verificar se tem filtros ativos (não padrão)
   */
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
      query.sort !== SortOption.NEWEST
    );
  }, [query]);

  /**
   * Gerar URL compartilhável com todos os filtros
   */
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
    },
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

/**
 * Hook para apenas um filtro específico (mais simples)
 */
export function useFilterValue<K extends keyof FilterState>(key: K) {
  const { filters, updateFilter } = useProductFilters();

  return {
    value: filters[key],
    setValue: (value: any) => updateFilter(key, value),
  };
}
