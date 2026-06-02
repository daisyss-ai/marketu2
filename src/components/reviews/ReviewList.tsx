'use client';

import { useMemo, useState } from 'react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Button } from '@/components/ui/button';
import type { ReviewWithUser } from '@/types/reviews';

type SortOption = 'recent' | 'highest' | 'lowest';

type ReviewListProps = {
  reviews: ReviewWithUser[];
  currentUserId?: string | null;
  canWriteReview: boolean;
  loading?: boolean;
};

const pageSize = 10;

export function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
          key={index}
        />
      ))}
    </div>
  );
}

export function ReviewList({
  reviews,
  currentUserId,
  canWriteReview,
  loading = false,
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);

  const sortedReviews = useMemo(() => {
    const nextReviews = [...reviews];

    if (sortBy === 'highest') {
      nextReviews.sort(
        (left, right) => right.rating - left.rating || right.created_at.localeCompare(left.created_at)
      );
      return nextReviews;
    }

    if (sortBy === 'lowest') {
      nextReviews.sort(
        (left, right) => left.rating - right.rating || right.created_at.localeCompare(left.created_at)
      );
      return nextReviews;
    }

    nextReviews.sort((left, right) => right.created_at.localeCompare(left.created_at));
    return nextReviews;
  }, [reviews, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedReviews.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleReviews = sortedReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <ReviewListSkeleton />;
  }

  if (reviews.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Sem reviews</h3>
        <p className="mt-2 text-sm text-slate-600">
          Ainda não existem avaliações para este produto.
        </p>
        {canWriteReview ? (
          <div className="mt-5">
            <a
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              href="#write-review"
            >
              Escrever a primeira review
            </a>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Reviews de compradores</h3>
          <p className="text-sm text-slate-600">
            {reviews.length} {reviews.length === 1 ? 'review disponível' : 'reviews disponíveis'}
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <span>Ordenar por</span>
          <select
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => {
              setSortBy(event.target.value as SortOption);
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="recent">Mais recentes</option>
            <option value="highest">Melhor avaliação</option>
            <option value="lowest">Pior avaliação</option>
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <ReviewCard currentUserId={currentUserId} key={review.id} review={review} />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              Seguinte
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

