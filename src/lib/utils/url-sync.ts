/**
 * @file URL Synchronization Utilities
 * @description Sincroniza estado de filtros com URL
 * Permite bookmark de buscas, share de filtros, back/forward do browser
 */

import { PAGINATION, URL_PARAMS } from '@/lib/constants/search';
import { SearchQuery, SortOption, URLSearchParams as URLSearchParamsType } from '@/types/search';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Converte URL params para QueryState
 * ?page=1&q=matematica&category=livros&sort=price_asc -> { search, filters, sort, page }
 */
export function urlToSearchQuery(params: URLSearchParamsType): SearchQuery {
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, parseInt(params.limit || String(PAGINATION.DEFAULT_LIMIT), 10))
  );

  const priceMin = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const priceMax = params.maxPrice ? parseFloat(params.maxPrice) : undefined;

  return {
    search: params.search?.trim() || null,
    filters: {
      category: params.category || null,
      condition: (params.condition as any) || null,
      price: {
        min: priceMin ?? 0,
        max: priceMax ?? 1000000,
      },
      gradeLevel: params.gradeLevel ? parseInt(params.gradeLevel, 10) : null,
      subject: params.subject || null,
      productType: (params.productType as any) || null,
      location: (params.location as any) || null,
      rating: params.rating ? parseFloat(params.rating) : null,
    },
    sort: (params.sort as SortOption) || SortOption.NEWEST,
    page,
    limit,
  };
}

/**
 * Converte SearchQuery para URL params string
 * { search: 'matematica', ... } -> "?q=matematica&page=1&sort=newest"
 */
export function searchQueryToUrl(query: SearchQuery): string {
  const params = new URLSearchParams();

  // Pagination
  if (query.page !== PAGINATION.DEFAULT_PAGE) {
    params.set(URL_PARAMS.PAGE, String(query.page));
  }
  if (query.limit !== PAGINATION.DEFAULT_LIMIT) {
    params.set(URL_PARAMS.LIMIT, String(query.limit));
  }

  // Search
  if (query.search) {
    params.set(URL_PARAMS.SEARCH, query.search);
  }

  // Sort
  if (query.sort !== SortOption.NEWEST) {
    params.set(URL_PARAMS.SORT, query.sort);
  }

  // Filters
  if (query.filters.category) {
    params.set(URL_PARAMS.CATEGORY, query.filters.category);
  }
  if (query.filters.condition) {
    params.set(URL_PARAMS.CONDITION, query.filters.condition);
  }
  if (query.filters.price.min > 0) {
    params.set(URL_PARAMS.PRICE_MIN, String(query.filters.price.min));
  }
  if (query.filters.price.max < 1000000) {
    params.set(URL_PARAMS.PRICE_MAX, String(query.filters.price.max));
  }
  if (query.filters.gradeLevel) {
    params.set(URL_PARAMS.GRADE_LEVEL, String(query.filters.gradeLevel));
  }
  if (query.filters.subject) {
    params.set(URL_PARAMS.SUBJECT, query.filters.subject);
  }
  if (query.filters.productType) {
    params.set(URL_PARAMS.PRODUCT_TYPE, query.filters.productType);
  }
  if (query.filters.location) {
    params.set(URL_PARAMS.LOCATION, query.filters.location);
  }
  if (query.filters.rating) {
    params.set(URL_PARAMS.RATING, String(query.filters.rating));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Hook para sincronizar estado com URL
 * Atualiza URL quando estado muda
 * Atualiza estado quando URL muda (navegação do browser)
 */
export function useURLSync(
  query: SearchQuery,
  onQueryChange: (query: SearchQuery) => void
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sincronizar URL quando query muda
  const updateURL = useCallback((newQuery: SearchQuery) => {
    const url = searchQueryToUrl(newQuery);
    window.history.pushState({}, '', `/home${url}`);
  }, []);

  // Sincronizar estado quando URL muda (browser back/forward)
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const newQuery = urlToSearchQuery(params as URLSearchParamsType);

    // Só atualiza se realmente mudou
    if (JSON.stringify(newQuery) !== JSON.stringify(query)) {
      onQueryChange(newQuery);
    }
  }, [searchParams, query, onQueryChange]);

  return { updateURL };
}

/**
 * Extrai e valida URL params do NextJS
 */
export function parseURLSearchParams(searchParams: URLSearchParamsType): SearchQuery {
  return urlToSearchQuery(searchParams);
}

/**
 * Cria URL shareable com todos os filtros
 */
export function getShareableURL(query: SearchQuery): string {
  const url = searchQueryToUrl(query);
  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseURL}/home${url}`;
}

/**
 * Limpa URL removendo parâmetros
 */
export function clearURLParams(): string {
  const defaultQuery: SearchQuery = {
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
    sort: SortOption.NEWEST,
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
  };

  return searchQueryToUrl(defaultQuery);
}
