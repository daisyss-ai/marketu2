import type { Product } from '../../../../types';
import type { ProductPagination, ProductSearchQuery } from './types';

export function buildPagination(query: ProductSearchQuery, total: number): ProductPagination {
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.max(1, query.page);
  const offset = (page - 1) * query.limit;
  const to = offset + query.limit;

  return {
    page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    offset,
    to,
  };
}

export function paginateProducts(products: Product[], pagination: ProductPagination) {
  return products.slice(pagination.offset, pagination.to);
}
