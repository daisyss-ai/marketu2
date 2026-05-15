import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewStats as ReviewStatsData } from '@/types/reviews';

type ReviewStatsProps = {
  stats: ReviewStatsData;
  size?: 'sm' | 'lg';
  className?: string;
};

const totalFormatter = new Intl.NumberFormat('pt-PT');
const averageFormatter = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function StarRow({
  average,
  starClassName,
}: {
  average: number;
  starClassName: string;
}) {
  return (
    <div aria-hidden="true" className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, average - index));

        return (
          <span className={cn('relative inline-flex', starClassName)} key={index}>
            <Star className={cn(starClassName, 'fill-transparent text-slate-300')} />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={cn(starClassName, 'fill-yellow-400 text-yellow-400')} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ReviewStats({
  stats,
  size = 'lg',
  className,
}: ReviewStatsProps) {
  const percentages = {
    5: stats.total ? (stats.distribution[5] / stats.total) * 100 : 0,
    4: stats.total ? (stats.distribution[4] / stats.total) * 100 : 0,
    3: stats.total ? (stats.distribution[3] / stats.total) * 100 : 0,
    2: stats.total ? (stats.distribution[2] / stats.total) * 100 : 0,
    1: stats.total ? (stats.distribution[1] / stats.total) * 100 : 0,
  } satisfies Record<1 | 2 | 3 | 4 | 5, number>;

  const averageLabel = averageFormatter.format(stats.average);
  const totalLabel = totalFormatter.format(stats.total);

  if (size === 'sm') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm font-bold text-slate-900">{averageLabel}</span>
        <StarRow average={stats.average} starClassName="size-3.5" />
        <span className="text-xs text-gray-500">{totalLabel}</span>
      </div>
    );
  }

  return (
    <section className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-slate-950">{averageLabel}</span>
          <StarRow average={stats.average} starClassName="size-5" />
          <span className="text-sm text-slate-500">{totalLabel}</span>
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div
              className="grid grid-cols-[28px_minmax(0,1fr)_52px] items-center gap-3"
              key={rating}
            >
              <span className="text-sm font-medium text-slate-700">{rating}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-700 ease-out"
                  style={{ width: `${percentages[rating as 1 | 2 | 3 | 4 | 5]}%` }}
                />
              </div>
              <span className="text-right text-sm text-slate-500">
                {Math.round(percentages[rating as 1 | 2 | 3 | 4 | 5])}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
