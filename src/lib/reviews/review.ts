import { createClient } from '@/lib/supabase/server';
import type {
  Review,
  ReviewWithUser,
  ReviewStats,
  ReviewRating,
  CreateReviewInput,
  UpdateReviewInput,
  DeliveredOrderOption,
} from '@/types/reviews';

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getReviewsByProduct(productId: string): Promise<ReviewWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('id, reviewer_id, product_id, order_id, rating, comment, quality_rating, communication_rating, delivery_rating, created_at, updated_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const reviews = data ?? [];
  if (reviews.length === 0) return [];

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, student_id, full_name, email, avatar_url')
    .in('id', reviewerIds);

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return reviews.map((review) => ({
    ...review,
    reviewer: profileMap.get(review.reviewer_id) ?? {
      id: review.reviewer_id,
      student_id: null,
      full_name: 'Utilizador',
      email: null,
      avatar_url: null,
    },
  })) as ReviewWithUser[];
}

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) throw new Error(error.message);

  const reviews = data ?? [];
  const total = reviews.length;

  if (total === 0) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution: Record<ReviewRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const review of reviews) {
    const r = review.rating as ReviewRating;
    distribution[r] = (distribution[r] ?? 0) + 1;
    sum += r;
  }

  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
    distribution,
  };
}

export async function getUserDeliveredOrders(
  userId: string,
  productId: string
): Promise<DeliveredOrderOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_items')
    .select(`
      id,
      product_id,
      product_title,
      product_type,
      order:orders!inner (
        id,
        buyer_id,
        status
      )
    `)
    .eq('product_id', productId)
    .eq('orders.buyer_id', userId)
    .eq('orders.status', 'delivered');

  if (error) throw new Error(error.message);

  return (data ?? []).map((item: any) => ({
    id: item.order.id as string,
    product_title: item.product_title as string,
    product_type: item.product_type as DeliveredOrderOption['product_type'],
  }));
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) throw new Error('Não autenticado.');

  const { data: canReview, error: canReviewError } = await supabase
    .rpc('can_review_order_product', {
      p_reviewer_id: auth.user.id,
      p_order_id: input.order_id,
      p_product_id: input.product_id,
    });

  if (canReviewError) throw new Error(canReviewError.message);
 if (!canReview) throw new Error('Só pode avaliar produtos de pedidos entregues.');

// Verificar janela de 14 dias
const { data: order } = await supabase
  .from('orders')
  .select('updated_at')
  .eq('id', input.order_id)
  .eq('status', 'delivered')
  .maybeSingle();

if (order) {
  const deliveredAt = new Date(order.updated_at);
  const now = new Date();
  const diffDays = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 14) {
    throw new Error('O prazo para avaliar este pedido já expirou (14 dias após entrega).');
  }
}
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', auth.user.id)
    .eq('product_id', input.product_id)
    .eq('order_id', input.order_id)
    .maybeSingle();

  if (existing) throw new Error('Já existe uma review para este pedido.');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: auth.user.id,
      product_id: input.product_id,
      order_id: input.order_id,
      rating: input.rating,
      comment: input.comment ?? null,
      quality_rating: input.quality_rating ?? null,
      communication_rating: input.communication_rating ?? null,
      delivery_rating: input.delivery_rating ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Review;
}

export async function updateReview(reviewId: string, input: UpdateReviewInput): Promise<Review> {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) throw new Error('Não autenticado.');

  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('id, reviewer_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error('Review não encontrada.');
  if (existing.reviewer_id !== auth.user.id) throw new Error('Sem permissão para editar esta review.');

  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.comment !== undefined && { comment: input.comment }),
      ...(input.quality_rating !== undefined && { quality_rating: input.quality_rating }),
      ...(input.communication_rating !== undefined && { communication_rating: input.communication_rating }),
      ...(input.delivery_rating !== undefined && { delivery_rating: input.delivery_rating }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Review;
}

export async function deleteReview(_reviewId: string): Promise<void> {
  throw new Error('As avaliações não podem ser apagadas. Pode apenas editar o seu comentário.');
}