'use client';

import Image from 'next/image';
import { memo, useState } from 'react';
import { Pencil, UserCircle2 } from 'lucide-react';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import type { ReviewWithUser } from '@/types/reviews';

interface ReviewCardProps {
  review: ReviewWithUser;
  currentUserId?: string | null;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat('pt-PT', { numeric: 'auto' });
  const divisions = [
    { amount: 60, unit: 'minute' as const },
    { amount: 24, unit: 'hour' as const },
    { amount: 7, unit: 'day' as const },
    { amount: 4.34524, unit: 'week' as const },
    { amount: 12, unit: 'month' as const },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' as const },
  ];
  let duration = diffInMinutes;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) return formatter.format(duration, division.unit);
    duration = Math.round(duration / division.amount);
  }
  return date.toLocaleDateString('pt-PT');
}

function ReviewCardComponent({ review, currentUserId }: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isAuthor = currentUserId === review.reviewer_id;

  return (
    <article className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {review.reviewer.avatar_url ? (
            <Image
              alt={`${review.reviewer.full_name} avatar`}
              className="size-12 rounded-full object-cover ring-1 ring-slate-200"
              height={48}
              src={review.reviewer.avatar_url}
              unoptimized
              width={48}
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
              <UserCircle2 className="size-7" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{review.reviewer.full_name}</h4>
              <span className="text-xs text-slate-500">{formatRelativeDate(review.created_at)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <StarRating readOnly value={review.rating} />
              <span className="text-sm text-slate-600">{review.rating}.0</span>
            </div>
            {(review.quality_rating || review.communication_rating || review.delivery_rating) ? (
              <div className="mt-2 flex flex-wrap gap-3">
                {review.quality_rating ? (
                  <span className="text-xs text-slate-500">
                    Qualidade <span className="font-medium text-slate-700">{review.quality_rating}/5</span>
                  </span>
                ) : null}
                {review.communication_rating ? (
                  <span className="text-xs text-slate-500">
                    Comunicação <span className="font-medium text-slate-700">{review.communication_rating}/5</span>
                  </span>
                ) : null}
                {review.delivery_rating ? (
                  <span className="text-xs text-slate-500">
                    Rapidez <span className="font-medium text-slate-700">{review.delivery_rating}/5</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {isAuthor ? (
          <div className="flex items-center gap-2">
            <Button aria-label="Editar" onClick={() => setIsEditing((v) => !v)} size="icon-sm" type="button" variant="ghost">
              <Pencil className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {review.comment ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>
      ) : (
        <p className="mt-4 text-sm italic text-slate-400">Sem comentário escrito.</p>
      )}

      {isAuthor && isEditing ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <ReviewForm
            eligibleOrders={[]}
            initialReview={review}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
            productId={review.product_id}
          />
        </div>
      ) : null}
    </article>
  );
}

export const ReviewCard = memo(ReviewCardComponent);