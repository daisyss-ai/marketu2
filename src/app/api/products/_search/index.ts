import type { Product } from '../../../../types';
import { applyInMemoryFilters } from './filters';
import { normalizeText } from './fulltext';
import { buildSearchMeta } from './mapping';
import { paginateProducts } from './pagination';
import { sortProducts } from './sorting';
import { buildSuggestions } from './suggestions';
import type { ProductSearchQuery, ProductSearchResult, ProductSort } from './types';

const VALID_SORTS: ProductSort[] = ['relevance', 'newest', 'price_asc', 'price_desc', 'rating'];

function parseInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}


function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
}

export function parseProductQuery(searchParams: URLSearchParams): ProductSearchQuery {
  const page = Math.max(1, parseInteger(searchParams.get('page'), 1));
  const limit = Math.min(48, Math.max(1, parseInteger(searchParams.get('limit'), 12)));
  const sortValue = searchParams.get('sort');
  const sort = VALID_SORTS.includes(sortValue as ProductSort) ? (sortValue as ProductSort) : 'newest';

  const productTypeValue = searchParams.get('productType');
  const productType =
    productTypeValue === 'material' || productTypeValue === 'servico' ? productTypeValue : undefined;

  return {
    page,
    limit,
    sort,
    category: searchParams.get('category') || undefined,
    condition: searchParams.get('condition') || undefined,
    minPrice: parseOptionalNumber(searchParams.get('minPrice')),
    maxPrice: parseOptionalNumber(searchParams.get('maxPrice')),
    search: (searchParams.get('search') || '').trim() || undefined,
    gradeLevel: parseOptionalNumber(searchParams.get('gradeLevel')),
    subject: (searchParams.get('subject') || '').trim() ? normalizeText(searchParams.get('subject') || '') : undefined,
    productType,
    location: (searchParams.get('location') || '').trim() ? normalizeText(searchParams.get('location') || '') : undefined,
  };
}

export function searchProductsInMemory(products: Product[], query: ProductSearchQuery): ProductSearchResult {
  const filtered = applyInMemoryFilters(products, query);
  const sorted = sortProducts(filtered, query);
  const meta = buildSearchMeta(query, sorted.length);
  const paginated = paginateProducts(sorted, meta.pagination);

  return {
    products: paginated,
    meta,
  };
}

export function getSuggestionsFromProducts(products: Product[], search: string, limit: number) {
  return buildSuggestions(products, search, limit);
}

export * from './filters';
export * from './fulltext';
export * from './mapping';
export * from './pagination';
export * from './query-builder';
export * from './ranking';
export * from './rpc';
export * from './sorting';
export * from './suggestions';
export * from './types';

