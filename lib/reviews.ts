import { createClient } from '@/lib/supabase/server';
import type {
  CreateReviewInput,
  DeliveredOrderOption,
  Review,
  ReviewStats,
  ReviewWithUser,
  UpdateReviewInput,
} from '@/types/reviews';

type ReviewRow = {
  id: string;
  reviewer_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  student_id: string | null;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
};

type OrderItemWithOrderRow = {
  order_id: string;
  product_title: string;
  product_type: DeliveredOrderOption['product_type'];
  orders:
    | {
        id: string;
      }[]
    | null;
};

const reviewSelect =
  'id,reviewer_id,product_id,order_id,rating,comment,created_at,updated_at';

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string' && message.trim()) {
      return new Error(message);
    }
  }

  return new Error(fallback);
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    reviewer_id: row.reviewer_id,
    product_id: row.product_id,
    order_id: row.order_id,
    rating: row.rating as Review['rating'],
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function emptyDistribution(): ReviewStats['distribution'] {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw normalizeError(error, 'Unable to resolve authenticated user.');
  }

  if (!user) {
    throw new Error('You must be signed in to manage reviews.');
  }

  return { supabase, userId: user.id };
}

async function syncProductReviewStats(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) {
    throw error;
  }

  const ratings = (data ?? []) as Array<{ rating: number }>;
  const totalReviews = ratings.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            ratings.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          ).toFixed(2)
        )
      : 0;

  const { error: updateError } = await supabase
    .from('products')
    .update({
      rating: averageRating,
      total_reviews: totalReviews,
    })
    .eq('id', productId);

  if (updateError) {
    throw updateError;
  }
}

export async function getReviewsByProduct(productId: string): Promise<ReviewWithUser[]> {
  try {
    const supabase = await createClient();
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(reviewSelect)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const reviewRows = (reviews ?? []) as ReviewRow[];
    if (reviewRows.length === 0) {
      return [];
    }

    const reviewerIds = Array.from(new Set(reviewRows.map((review) => review.reviewer_id)));
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,student_id,full_name,email,avatar_url')
      .in('id', reviewerIds);

    if (profileError) {
      throw profileError;
    }

    const profileMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    return reviewRows.map((row) => {
      const profile = profileMap.get(row.reviewer_id);

      return {
        ...toReview(row),
        reviewer: {
          id: profile?.id ?? row.reviewer_id,
          student_id: profile?.student_id ?? null,
          full_name: profile?.full_name || 'Anonymous user',
          email: profile?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      };
    });
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to load product reviews.');
  }
}

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (error) {
      throw error;
    }

    const distribution = emptyDistribution();
    const ratings = (data ?? []) as Array<{ rating: number }>;

    let sum = 0;
    for (const entry of ratings) {
      const rating = entry.rating as keyof typeof distribution;
      distribution[rating] += 1;
      sum += entry.rating;
    }

    const total = ratings.length;

    return {
      average: total > 0 ? Number((sum / total).toFixed(1)) : 0,
      total,
      distribution,
    };
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to load review statistics.');
  }
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select(reviewSelect)
      .eq('reviewer_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? toReview(data as ReviewRow) : null;
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to load the user review for this product.');
  }
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  try {
    const { supabase, userId } = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: userId,
        product_id: input.product_id,
        order_id: input.order_id,
        rating: input.rating,
        comment: input.comment,
      })
      .select(reviewSelect)
      .single();

    if (error) {
      throw error;
    }

    await syncProductReviewStats(input.product_id);

    return toReview(data as ReviewRow);
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to create review.');
  }
}

export async function updateReview(id: string, input: UpdateReviewInput): Promise<Review> {
  try {
    const { supabase } = await getAuthenticatedUserId();
    const payload: { rating?: number; comment?: string | null } = {};

    if (typeof input.rating === 'number') {
      payload.rating = input.rating;
    }

    if ('comment' in input) {
      payload.comment = input.comment ?? null;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', id)
      .select(reviewSelect)
      .single();

    if (error) {
      throw error;
    }

    await syncProductReviewStats((data as ReviewRow).product_id);

    return toReview(data as ReviewRow);
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to update review.');
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    const { supabase } = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .select('product_id')
      .single();

    if (error) {
      throw error;
    }

    await syncProductReviewStats((data as { product_id: string }).product_id);
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to delete review.');
  }
}

export async function getUserDeliveredOrders(
  userId: string,
  productId: string
): Promise<DeliveredOrderOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('order_items')
      .select('order_id,product_title,product_type,orders!inner(id)')
      .eq('product_id', productId)
      .eq('orders.buyer_id', userId)
      .eq('orders.status', 'delivered');

    if (error) {
      throw error;
    }

    const deliveredOrders = ((data ?? []) as OrderItemWithOrderRow[])
      .map((row) => ({
        id: row.orders?.[0]?.id ?? row.order_id,
        product_title: row.product_title,
        product_type: row.product_type,
      }))
      .filter((row) => Boolean(row.id));

    return Array.from(
      new Map(deliveredOrders.map((order) => [order.id, order])).values()
    );
  } catch (error: unknown) {
    throw normalizeError(error, 'Unable to load delivered orders for this product.');
  }
}
