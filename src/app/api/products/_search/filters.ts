import type { Product } from '../../../../types';
import { buildSearchOrClause, normalizeText } from './fulltext';
import { calculateRelevanceScore } from './ranking';
import type { ProductSearchQuery } from './types';
export function matchesFilters(product: Product, query: ProductSearchQuery) {
  if (query.category && product.category !== query.category) return false;
  if (query.condition && product.condition !== query.condition) return false;
  if (query.productType && product.productType !== query.productType) return false;
  if (query.location && normalizeText(product.location || '') !== normalizeText(query.location)) return false;
  if (typeof query.gradeLevel === 'number' && product.gradeLevel !== query.gradeLevel) return false;
  if (query.subject && normalizeText(product.subject || '') !== normalizeText(query.subject)) return false;
  if (typeof query.minRating === 'number' && (product.rating || 0) < query.minRating) return false;

  const price = typeof product.price === 'number' ? product.price : Number(product.price);
  if (typeof query.minPrice === 'number' && Number.isFinite(query.minPrice) && price < query.minPrice) return false;
  if (typeof query.maxPrice === 'number' && Number.isFinite(query.maxPrice) && price > query.maxPrice) return false;

  if (query.search) {
    return calculateRelevanceScore(product, query.search) > 0;
  }

  return true;
}

export function applyInMemoryFilters(products: Product[], query: ProductSearchQuery) {
  return products.filter((product) => matchesFilters(product, query));
}

export function applyDatabaseFilters(
  queryBuilder: any,
  query: ProductSearchQuery,
  options: { includeSearch?: boolean } = {}
): any {
  let next = queryBuilder;

  if (query.category) next = next.eq('category_slug', query.category);
  if (query.condition) next = next.eq('modality', query.condition);
  if (typeof query.minPrice === 'number' && Number.isFinite(query.minPrice)) 
    next = next.gte('price', query.minPrice);
  if (typeof query.maxPrice === 'number' && Number.isFinite(query.maxPrice)) next = next.lte('price', query.maxPrice);
  if (typeof query.gradeLevel === 'number' && Number.isFinite(query.gradeLevel)) next = next.eq('grade_level', query.gradeLevel);
  if (query.subject) next = next.ilike('subject_normalized', `%${query.subject}%`);
  if (query.productType) next = next.eq('type', query.productType);
  if (query.location) next = next.ilike('location', `%${query.location}%`);
  if (typeof query.minRating === 'number' && Number.isFinite(query.minRating)) next = next.gte('rating', query.minRating);
  if (options.includeSearch !== false && query.search) next = next.or(buildSearchOrClause(query.search));

  return next;
}
