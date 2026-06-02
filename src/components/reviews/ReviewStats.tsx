'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { ReviewStats as ReviewStatsType } from '@/types/reviews';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  size?: 'sm' | 'lg';
  className?: string;
}

export function ReviewStats({ stats, size = 'lg', className }: ReviewStatsProps) {
  if (size === 'sm') {
    if (stats.total === 0) return null;
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <Star className="size-3.5 fill-amber-400 text-amber-400" />
        <span className="text-xs font-medium text-slate-700">{stats.average.toFixed(1)}</span>
        <span className="text-xs text-slate-400">({stats.total})</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center justify-center gap-1 sm:min-w-30">
          <span className="text-5xl font-bold text-slate-900">{stats.average.toFixed(1)}</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'size-4',
                  star <= Math.round(stats.average)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-slate-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-slate-500">
            {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.distribution[star] ?? 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-4 text-right text-xs text-slate-500">{star}</span>
                <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}