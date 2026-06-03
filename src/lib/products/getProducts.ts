import { createClient } from '@/lib/supabase/server';
import type { ProductCardItem } from '@/types';

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
  title: string;
  description: string | null;
  price: number | string | null;
  rating: number | null;
  total_reviews: number | null;
  is_approved?: boolean | null;
  created_at: string | null;
  categories: DbCategory | DbCategory[];
  product_media: DbMedia[] | null;
};

function pickCategoryName(cat: DbCategory | DbCategory[]): string {
  if (!cat) return 'Geral';
  const single = Array.isArray(cat) ? cat[0] : cat;
  return single?.name ?? 'Geral';
}

function pickCoverUrl(media: DbMedia[] | null): string | undefined {
  if (!media || media.length === 0) return undefined;
  const sorted = [...media]
    .filter(Boolean)
    .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0));
  const preview = sorted.find((m) => m?.is_preview) ?? sorted[0];
  return preview?.url ?? undefined;
}

export async function getProducts({
  page = 1,
  limit = 12,
  sort = 'newest',
  search = '',
  categorySlug = '',
  minPrice = 0,
  maxPrice = Infinity,
  minRating = 0,
}: GetProductsParams = {}) {
  const supabase = await createClient();

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  let q = supabase
    .from('products')
    .select(
      `
        id,
        seller_id,
        title,
        description,
        price,
        rating,
        total_reviews,
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
    rating: typeof p.rating === 'number' ? p.rating : null,
    total_reviews: typeof p.total_reviews === 'number' ? p.total_reviews : 0,
    userId: p.seller_id,
  }));

  return { products, total: count ?? products.length, page, limit };
}


