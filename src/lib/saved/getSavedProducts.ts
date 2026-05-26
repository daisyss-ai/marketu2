import { createClient } from '@/lib/supabase/server';

type SavedProductMediaRow = {
  id: string;
  product_id: string;
  url: string;
  is_preview: boolean | null;
} | null;

type SavedProductRow = {
  id: string;
  seller_id: string;
  title: string;
  price: number | null;
  type: 'digital_material' | 'service' | 'physical_product' | null;
  rating: number | null;
  total_reviews: number | null;
  product_media: SavedProductMediaRow[] | SavedProductMediaRow | null;
};

type SellerProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type SavedProductEntryRow = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products: SavedProductRow | SavedProductRow[] | null;
};

export interface SavedProduct {
  savedProductId: string;
  productId: string;
  title: string;
  price: number;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  imageUrl: string | null;
  type: 'digital_material' | 'service' | 'physical_product';
  rating: number | null;
  totalReviews: number;
  savedAt: string;
}

function pickProductRow(value: SavedProductRow | SavedProductRow[] | null): SavedProductRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function pickPreviewUrl(media: SavedProductRow['product_media']): string | null {
  const mediaList = Array.isArray(media) ? media.filter(Boolean) : [];
  const preview = mediaList.find((item) => item?.is_preview && item?.url) ?? mediaList[0];
  return preview?.url ?? null;
}

async function getSellerProfilesMap(sellerIds: string[]): Promise<Map<string, SellerProfileRow>> {
  if (sellerIds.length === 0) {
    return new Map<string, SellerProfileRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', sellerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as SellerProfileRow[]).map((profile) => [profile.id, profile]));
}

export async function getSavedProducts(userId: string): Promise<SavedProduct[]> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_products')
    .select(
      `
        id,
        user_id,
        product_id,
        created_at,
        products(
          id,
          seller_id,
          title,
          price,
          type,
          rating,
          total_reviews,
          product_media(
            id,
            product_id,
            url,
            is_preview
          )
        )
      `
    )
    .eq('user_id', normalizedUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SavedProductEntryRow[];
  const productRows = rows.map((row) => pickProductRow(row.products)).filter(Boolean) as SavedProductRow[];
  const sellerIds = [...new Set(productRows.map((product) => product.seller_id).filter(Boolean))];
  const sellerProfiles = await getSellerProfilesMap(sellerIds);

  return rows.flatMap((row) => {
    const product = pickProductRow(row.products);
    if (!product || !product.type) {
      return [];
    }

    const sellerProfile = sellerProfiles.get(product.seller_id);

    return [
      {
        savedProductId: row.id,
        productId: product.id,
        title: product.title,
        price: Number(product.price ?? 0),
        sellerId: product.seller_id,
        sellerName: sellerProfile?.full_name?.trim() || 'Vendedor MarketU',
        sellerAvatarUrl: sellerProfile?.avatar_url ?? null,
        imageUrl: pickPreviewUrl(product.product_media),
        type: product.type,
        rating: typeof product.rating === 'number' ? product.rating : null,
        totalReviews: product.total_reviews ?? 0,
        savedAt: row.created_at,
      },
    ];
  });
}

export async function isProductSaved(userId: string, productId: string): Promise<boolean> {
  const normalizedUserId = userId.trim();
  const normalizedProductId = productId.trim();

  if (!normalizedUserId || !normalizedProductId) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_products')
    .select('id')
    .eq('user_id', normalizedUserId)
    .eq('product_id', normalizedProductId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getSavedCount(userId: string): Promise<number> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from('saved_products')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', normalizedUserId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
