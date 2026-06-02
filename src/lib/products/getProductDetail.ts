import { createClient } from '@/lib/supabase/server';

type ProductMediaRow = {
  url: string | null;
  position: number | null;
  is_preview: boolean | null;
  media_type: string | null;
} | null;

type ProductRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number | null;
  type: 'digital_material' | 'service' | 'physical_product' | null;
  rating: number | null;
  total_reviews: number | null;
  created_at: string | null;
  product_media: ProductMediaRow[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
} | null;

export interface ProductDetail {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  type: 'digital_material' | 'service' | 'physical_product';
  rating: number | null;
  totalReviews: number;
  createdAt: string | null;
  sellerName: string;
  sellerAvatarUrl: string | null;
  previewImage: string | null;
  images: string[];
}

function normalizeImages(media: ProductMediaRow[] | null): { previewImage: string | null; images: string[] } {
  const validMedia = Array.isArray(media)
    ? media
        .filter((item): item is NonNullable<ProductMediaRow> => Boolean(item?.url))
        .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
    : [];

  const imageUrls = validMedia
    .filter((item) => item.media_type === 'image' || item.media_type === null)
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));

  const previewImage =
    validMedia.find((item) => item.is_preview && item.url)?.url ??
    imageUrls[0] ??
    null;

  return {
    previewImage,
    images: imageUrls,
  };
}

export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(
      `
        id,
        seller_id,
        title,
        description,
        price,
        type,
        rating,
        total_reviews,
        created_at,
        product_media(url, position, is_preview, media_type)
      `
    )
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  const typedProduct = product as ProductRow | null;

  if (!typedProduct || !typedProduct.type) {
    return null;
  }

  const { data: sellerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', typedProduct.seller_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { previewImage, images } = normalizeImages(typedProduct.product_media);
  const typedSellerProfile = sellerProfile as ProfileRow;

  return {
    id: typedProduct.id,
    sellerId: typedProduct.seller_id,
    title: typedProduct.title,
    description: typedProduct.description?.trim() || 'Sem descricao disponivel.',
    price: Number(typedProduct.price ?? 0),
    type: typedProduct.type,
    rating: typeof typedProduct.rating === 'number' ? typedProduct.rating : null,
    totalReviews: typedProduct.total_reviews ?? 0,
    createdAt: typedProduct.created_at,
    sellerName: typedSellerProfile?.full_name?.trim() || 'Vendedor MarketU',
    sellerAvatarUrl: typedSellerProfile?.avatar_url ?? null,
    previewImage,
    images,
  };
}
