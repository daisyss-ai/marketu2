import type { ProductSearchQuery } from './types';

export type SearchProductsRpcParams = {
  p_search: string | null;
  p_category: string | null;
  p_condition: string | null;
  p_min_price: number | null;
  p_max_price: number | null;
  p_grade_level: number | null;
  p_subject: string | null;
  p_product_type: string | null;
  p_location: string | null;
  p_min_rating: number | null;
  p_sort: ProductSearchQuery['sort'];
  p_page: number;
  p_limit: number;
};

export function buildSearchProductsRpcParams(query: ProductSearchQuery): SearchProductsRpcParams {
  return {
    p_search: query.search ?? null,
    p_category: query.category ?? null,
    p_condition: query.condition ?? null,
    p_min_price: query.minPrice ?? null,
    p_max_price: query.maxPrice ?? null,
    p_grade_level: query.gradeLevel ?? null,
    p_subject: query.subject ?? null,
    p_product_type: query.productType ?? null,
    p_location: query.location ?? null,
    p_min_rating: query.minRating ?? null,
    p_sort: query.sort,
    p_page: query.page,
    p_limit: query.limit,
  };
}
