import type { Product } from '../../../../types';
import { getAppliedFilters } from './fulltext';
import { buildPagination } from './pagination';
import type { ProductRow, ProductSearchMeta, ProductSearchQuery } from './types';

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.price,
    seller: row.seller,
    img: row.img,
    description: row.description ?? undefined,
    condition: row.condition ?? undefined,
    location: row.location ?? undefined,
    subject: row.subject ?? undefined,
    gradeLevel: row.grade_level ?? undefined,
    productType: row.product_type ?? undefined,
    rating: row.rating ?? undefined,
    total_reviews: row.total_reviews ?? row.reviews ?? 0,
    reviewCount: row.total_reviews ?? row.reviews ?? undefined,
    reviews: row.reviews ?? undefined,
    createdAt: row.created_at ?? undefined,
    userId: row.user_id ?? undefined,
  };
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
