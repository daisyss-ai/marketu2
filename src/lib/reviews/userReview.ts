import { createClient } from '@/lib/supabase/server';
import type {
  UserReview,
  UserReviewWithProfile,
  CreateUserReviewInput,
} from '@/types/reviews';

export async function getUserReviewsByReviewed(reviewedId: string): Promise<UserReviewWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_reviews')
    .select('id, reviewer_id, reviewed_id, order_id, rating, comment, created_at, updated_at')
    .eq('reviewed_id', reviewedId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const reviews = data ?? [];
  if (reviews.length === 0) return [];

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', reviewerIds);

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return reviews.map((review) => ({
    ...review,
    reviewer: profileMap.get(review.reviewer_id) ?? {
      id: review.reviewer_id,
      full_name: 'Utilizador',
      avatar_url: null,
    },
  })) as UserReviewWithProfile[];
}

export async function getExistingUserReview(
  reviewerId: string,
  orderId: string
): Promise<UserReview | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('reviewer_id', reviewerId)
    .eq('order_id', orderId)
    .maybeSingle();

  return data as UserReview | null;
}

export async function createUserReview(input: CreateUserReviewInput): Promise<UserReview> {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) throw new Error('Não autenticado.');

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, seller_id, buyer_id, status')
    .eq('id', input.order_id)
    .eq('seller_id', auth.user.id)
    .eq('buyer_id', input.reviewed_id)
    .eq('status', 'delivered')
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error('Só pode avaliar compradores de pedidos entregues.');

  const { data: existing } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('reviewer_id', auth.user.id)
    .eq('order_id', input.order_id)
    .maybeSingle();

  if (existing) throw new Error('Já avaliou este comprador para este pedido.');

  const { data, error } = await supabase
    .from('user_reviews')
    .insert({
      reviewer_id: auth.user.id,
      reviewed_id: input.reviewed_id,
      order_id: input.order_id,
      rating: input.rating,
      comment: input.comment ?? null,
       badges: input.badges ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserReview;
}