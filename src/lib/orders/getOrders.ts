import { createClient } from '@/lib/supabase/server';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderProductType = 'digital_material' | 'service' | 'physical_product';
export type OrderMode = 'buyer' | 'seller';

interface ProductMediaRow {
  url: string | null;
  is_preview: boolean | null;
  position: number | null;
}

interface ProductRow {
  product_media: ProductMediaRow[] | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface OrderItemRow {
  id: string;
  product_id: string;
  product_title: string;
  product_type: OrderProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: ProductRow | ProductRow[] | null;
}

interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  pickup_location: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItemRow[] | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productType: OrderProductType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

export interface OrderParty {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}
export interface BuyerReputation {
  avgRating: number;
  total: number;
  topBadges: string[];
}
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: OrderParty | null;
  seller: OrderParty | null;
  status: OrderStatus;
  pickupLocation: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  hasReviewedBuyer: boolean;
  hasReviewedProduct: boolean;
  buyerReputation: BuyerReputation | null;
}

type RoleField = 'buyer_id' | 'seller_id';

function pickPreviewUrl(value: ProductRow | ProductRow[] | null): string | null {
  if (!value) return null;
  const product = Array.isArray(value) ? value[0] : value;
  const media = Array.isArray(product?.product_media) ? product.product_media.filter(Boolean) : [];
  const preview = media.find((item) => item?.is_preview) ?? media[0];
  return preview?.url ?? null;
}

function mapOrders(
  rows: OrderRow[],
  buyerMap: Map<string, ProfileRow>,
  sellerMap: Map<string, ProfileRow>
): Order[] {
  return rows.map((row) => ({
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    buyer: buyerMap.has(row.buyer_id)
      ? {
          id: row.buyer_id,
          fullName: buyerMap.get(row.buyer_id)?.full_name ?? null,
          avatarUrl: buyerMap.get(row.buyer_id)?.avatar_url ?? null,
        }
      : null,
    seller: sellerMap.has(row.seller_id)
      ? {
          id: row.seller_id,
          fullName: sellerMap.get(row.seller_id)?.full_name ?? null,
          avatarUrl: sellerMap.get(row.seller_id)?.avatar_url ?? null,
        }
      : null,
    status: row.status,
    pickupLocation: row.pickup_location,
    notes: row.notes,
    createdAt: row.created_at,
    hasReviewedBuyer: false,
    hasReviewedProduct: false,
    buyerReputation: null,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productTitle: item.product_title,
      productType: item.product_type,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      imageUrl: pickPreviewUrl(item.products),
    })),
  }));
}

async function getProfilesMap(ids: string[]): Promise<Map<string, ProfileRow>> {
  if (ids.length === 0) return new Map<string, ProfileRow>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);

  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
}

async function getOrdersByRole(userId: string, field: RoleField): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
        id,
        buyer_id,
        seller_id,
        status,
        pickup_location,
        notes,
        created_at,
        order_items(
          id,
          product_id,
          product_title,
          product_type,
          quantity,
          unit_price,
          total_price,
          products!order_items_product_id_fkey(
            product_media(
              url,
              is_preview,
              position
            )
          )
        )
      `
    )
    .eq(field, userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as OrderRow[];
  const buyerIds = [...new Set(rows.map((row) => row.buyer_id).filter(Boolean))];
  const sellerIds = [...new Set(rows.map((row) => row.seller_id).filter(Boolean))];

  const [buyerMap, sellerMap] = await Promise.all([
    getProfilesMap(buyerIds),
    getProfilesMap(sellerIds),
  ]);

  const orders = mapOrders(rows, buyerMap, sellerMap);
  const orderIds = orders.map((o) => o.id);

  if (orderIds.length === 0) return orders;

  if (field === 'seller_id') {
    const { data: userReviews } = await supabase
      .from('user_reviews')
      .select('order_id')
      .in('order_id', orderIds);

    const reviewedOrderIds = new Set((userReviews ?? []).map((r) => r.order_id));

    return orders.map((o) => ({
      ...o,
      hasReviewedBuyer: reviewedOrderIds.has(o.id),
    }));
  }

  if (field === 'buyer_id') {
    const { data: productReviews } = await supabase
      .from('reviews')
      .select('order_id, product_id')
      .eq('reviewer_id', userId)
      .in('order_id', orderIds);

    const reviewedKeys = new Set(
      (productReviews ?? []).map((r) => `${r.order_id}:${r.product_id}`)
    );

    return orders.map((o) => ({
      ...o,
      hasReviewedProduct: o.items.some((i) =>
        reviewedKeys.has(`${o.id}:${i.productId}`)
      ),
    }));
  }

  return orders;
}

export async function getBuyerOrders(userId: string): Promise<Order[]> {
  try {
    return await getOrdersByRole(userId, 'buyer_id');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro inesperado ao carregar compras.';
    throw new Error(`Falha ao buscar compras: ${message}`);
  }
}

export async function getSellerOrders(userId: string): Promise<Order[]> {
  try {
    return await getOrdersByRole(userId, 'seller_id');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro inesperado ao carregar vendas.';
    throw new Error(`Falha ao buscar vendas: ${message}`);
  }
}
