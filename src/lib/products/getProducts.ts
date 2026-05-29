import type { ProductCardItem } from '@/types';
import { createClient } from '@/lib/supabase/server';

export type GetProductsParams = {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
};

type DbCategory = { name: string | null; slug: string | null } | null;
type DbMedia = {
  url: string | null;
  position: number | null;
  media_type: string | null;
  is_preview: boolean | null;
} | null;

type DbProductRow = {
  id: string;
  seller_id: string;
        title,
        description,
        price,
        rating,
        created_at,
        categories(name,slug),
        product_media(url,position,media_type,is_preview)
      `,
      { count: 'exact' }
    )
    .eq('is_active', true);

  if (search) q = q.ilike('title', `%${search}%`);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (Number.isFinite(minRating) && minRating > 0) q = q.gte('rating', minRating);

  if (Number.isFinite(minPrice) && minPrice > 0) q = q.gte('price', minPrice);
  if (Number.isFinite(maxPrice)) q = q.lte('price', maxPrice);

  if (sort === 'price_asc') q = q.order('price', { ascending: true });
  else if (sort === 'price_desc') q = q.order('price', { ascending: false });
  else if (sort === 'rating') q = q.order('rating', { ascending: false }).order('created_at', { ascending: false });
  else q = q.order('created_at', { ascending: false });

  q = q.order('position', { referencedTable: 'product_media', ascending: true });

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await q.range(from, to);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DbProductRow[];
  const products: ProductCardItem[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    category: pickCategoryName(p.categories),
    price: Number(p.price ?? 0),
    seller: 'MarketU',
    img: pickCoverUrl(p.product_media),
    statusColor: 'bg-green-400',
    description: p.description ?? undefined,
    createdAt: p.created_at ?? undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    userId: p.seller_id,
  });

  return { products, total: count ?? products.length, page, limit };
}


