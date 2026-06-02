'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createReview, deleteReview, updateReview } from '@/lib/reviews/review';
import type { Review } from '@/types/reviews';

type ActionResult<T> = { data: T | null; error: string | null };

const ratingSchema = z.coerce.number().int().min(1).max(5);
const optionalRatingSchema = z.coerce.number().int().min(1).max(5).nullable().optional();

const createReviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: ratingSchema,
  quality_rating: optionalRatingSchema,
  communication_rating: optionalRatingSchema,
  delivery_rating: optionalRatingSchema,
  comment: z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined)),
});

const updateReviewSchema = z.object({
  review_id: z.string().uuid(),
  rating: ratingSchema,
  quality_rating: optionalRatingSchema,
  communication_rating: optionalRatingSchema,
  delivery_rating: optionalRatingSchema,
  comment: z.string().trim().max(1000).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
});

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Ocorreu um erro inesperado.';
}

function revalidateIfPathname(pathnameValue: FormDataEntryValue | null) {
  if (typeof pathnameValue === 'string' && pathnameValue.trim()) {
    revalidatePath(pathnameValue.trim());
  }
}

export async function createReviewAction(formData: FormData): Promise<ActionResult<Review>> {
  try {
    const parsed = createReviewSchema.parse({
      product_id: formData.get('product_id'),
      order_id: formData.get('order_id'),
      rating: formData.get('rating'),
      quality_rating: formData.get('quality_rating') ?? undefined,
      communication_rating: formData.get('communication_rating') ?? undefined,
      delivery_rating: formData.get('delivery_rating') ?? undefined,
      comment: formData.get('comment') ?? undefined,
    });

    const review = await createReview({
      product_id: parsed.product_id,
      order_id: parsed.order_id,
      rating: parsed.rating as Review['rating'],
      comment: parsed.comment ?? null,
      quality_rating: (parsed.quality_rating ?? null) as Review['quality_rating'],
      communication_rating: (parsed.communication_rating ?? null) as Review['communication_rating'],
      delivery_rating: (parsed.delivery_rating ?? null) as Review['delivery_rating'],
    });

    revalidateIfPathname(formData.get('pathname'));
    return { data: review, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function updateReviewAction(formData: FormData): Promise<ActionResult<Review>> {
  try {
    const parsed = updateReviewSchema.parse({
      review_id: formData.get('review_id'),
      rating: formData.get('rating'),
      quality_rating: formData.get('quality_rating') ?? undefined,
      communication_rating: formData.get('communication_rating') ?? undefined,
      delivery_rating: formData.get('delivery_rating') ?? undefined,
      comment: formData.get('comment') ?? undefined,
    });

    const review = await updateReview(parsed.review_id, {
      rating: parsed.rating as Review['rating'],
      comment: parsed.comment ?? null,
      quality_rating: (parsed.quality_rating ?? null) as Review['quality_rating'],
      communication_rating: (parsed.communication_rating ?? null) as Review['communication_rating'],
      delivery_rating: (parsed.delivery_rating ?? null) as Review['delivery_rating'],
    });

    revalidateIfPathname(formData.get('pathname'));
    return { data: review, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult<{ id: string }>> {
  try {
    z.string().uuid().parse(reviewId);
    await deleteReview(reviewId);
    return { data: { id: reviewId }, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}