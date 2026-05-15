'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createReview, deleteReview, updateReview } from '@/lib/reviews';
import type { Review } from '@/types/reviews';

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

const ratingSchema = z.coerce.number().int().min(1).max(5);

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: ratingSchema,
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const updateReviewSchema = z.object({
  review_id: z.string().uuid(),
  rating: ratingSchema,
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

function normalizeActionError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'An unexpected error occurred.';
}

function revalidateReviewPath(pathnameValue: FormDataEntryValue | null) {
  if (typeof pathnameValue !== 'string') {
    return;
  }

  const pathname = pathnameValue.trim();
  if (pathname) {
    revalidatePath(pathname);
  }
}

export async function createReviewAction(
  formData: FormData
): Promise<ActionResult<Review>> {
  try {
    const parsed = reviewSchema.parse({
      product_id: formData.get('product_id'),
      order_id: formData.get('order_id'),
      rating: formData.get('rating'),
      comment: formData.get('comment') ?? undefined,
    });

    const review = await createReview({
      product_id: parsed.product_id,
      order_id: parsed.order_id,
      rating: parsed.rating as Review['rating'],
      comment: parsed.comment ?? null,
    });

    revalidateReviewPath(formData.get('pathname'));

    return { data: review, error: null };
  } catch (error: unknown) {
    return { data: null, error: normalizeActionError(error) };
  }
}

export async function updateReviewAction(
  formData: FormData
): Promise<ActionResult<Review>> {
  try {
    const parsed = updateReviewSchema.parse({
      review_id: formData.get('review_id'),
      rating: formData.get('rating'),
      comment: formData.get('comment') ?? undefined,
    });

    const review = await updateReview(parsed.review_id, {
      rating: parsed.rating as Review['rating'],
      comment: parsed.comment ?? null,
    });

    revalidateReviewPath(formData.get('pathname'));

    return { data: review, error: null };
  } catch (error: unknown) {
    return { data: null, error: normalizeActionError(error) };
  }
}

export async function deleteReviewAction(
  reviewId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    z.string().uuid().parse(reviewId);
    await deleteReview(reviewId);

    return {
      data: { id: reviewId },
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: normalizeActionError(error) };
  }
}
