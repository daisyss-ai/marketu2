import type { Product } from '../../../../types';
import { getAppliedFilters } from './fulltext';
import { buildPagination } from './pagination';
import type { ProductRow, ProductSearchMeta, ProductSearchQuery } from './types';

export function mapProductRow(row: ProductRow): Product {
  const productType =
    row.product_type === 'servico'
      ? 'service'
      : row.product_type === 'material'
        ? 'physical'
        : (row.product_type ?? 'physical');

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.price ?? 0,
    description: row.description ?? '',
    condition: row.condition ?? 'used',
    location: row.location ?? '',
    productType,
    gradeLevel: row.grade_level ?? undefined,
    subject: row.subject ?? undefined,
    image: row.img ?? '',
    imageUrl: row.img ?? undefined,
    seller: row.seller,
    sellerId: row.user_id ?? '',
    rating: row.rating ?? 0,
    reviewCount: row.total_reviews ?? row.reviews ?? 0,
    views: 0,
    sales: 0,
    createdAt: row.created_at ?? '',
    updatedAt: row.created_at ?? '',
    userId: row.user_id ?? '',
  } as unknown as Product;
}

export function buildSearchMeta(query: ProductSearchQuery, total: number): ProductSearchMeta {
  return {
    pagination: buildPagination(query, total),
    sort: query.sort,
    search: query.search,
    appliedFilters: getAppliedFilters({
      category: query.category,
      condition: query.condition,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search,
      gradeLevel: query.gradeLevel,
      subject: query.subject,
      productType: query.productType,
      location: query.location,
      minRating: query.minRating,
    }),
  };
}
