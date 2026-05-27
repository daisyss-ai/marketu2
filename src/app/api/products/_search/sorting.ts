import type { Product } from '../../../../types';
import type { ProductSearchQuery } from './types';
import { calculateRelevanceScore } from './ranking';

function createdAtValue(product: Product) {
  return product.createdAt ? new Date(product.createdAt).getTime() : 0;
}

export function sortProducts(products: Product[], query: ProductSearchQuery) {
  return [...products].sort((left, right) => {
    if (query.sort === 'price_asc') return Number(left.price) - Number(right.price);
    if (query.sort === 'price_desc') return Number(right.price) - Number(left.price);
    if (query.sort === 'rating') return (right.rating || 0) - (left.rating || 0);
    if (query.sort === 'relevance' && query.search) {
      return calculateRelevanceScore(right, query.search) - calculateRelevanceScore(left, query.search);
    }

    return createdAtValue(right) - createdAtValue(left);
  });
}

export function applyDatabaseSorting(queryBuilder: any, query: ProductSearchQuery): any {
  if (query.sort === 'price_asc') return queryBuilder.order('price', { ascending: true });
  if (query.sort === 'price_desc') return queryBuilder.order('price', { ascending: false });
  if (query.sort === 'rating') return queryBuilder.order('rating', { ascending: false, nullsFirst: false });
  return queryBuilder.order('created_at', { ascending: false });
}
