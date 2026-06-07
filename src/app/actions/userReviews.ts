'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createUserReview } from '@/lib/reviews/userReview';
import type { UserReview } from '@/types/reviews';

type ActionResult<T> = { data: T | null; error: string | null };

const schema = z.object({
  reviewed_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  badges: z.string().optional().transform((v) => {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
  }),
  comment: z.string().trim().max(1000).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
});

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Ocorreu um erro inesperado.';
}

export async function createUserReviewAction(formData: FormData): Promise<ActionResult<UserReview>> {
  try {
    const parsed = schema.parse({
      reviewed_id: formData.get('reviewed_id'),
      order_id: formData.get('order_id'),
      rating: formData.get('rating'),
      comment: formData.get('comment') ?? undefined,
    });

    const review = await createUserReview({
      reviewed_id: parsed.reviewed_id,
      order_id: parsed.order_id,
      rating: parsed.rating as UserReview['rating'],
      comment: parsed.comment ?? null,
        badges: parsed.badges ?? [],
    });

    const pathname = formData.get('pathname');
    if (typeof pathname === 'string' && pathname.trim()) {
      revalidatePath(pathname.trim());
    }

    return { data: review, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}