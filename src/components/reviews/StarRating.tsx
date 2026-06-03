'use client';

import { memo, useId, useState, type KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  value: number;
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7',
};

function StarRatingComponent({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const groupId = useId();
  const displayValue = hoveredValue ?? value;

  const commitValue = (nextValue: number) => {
    if (!readOnly && onChange) {
      onChange(nextValue as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      commitValue(Math.min(5, Math.max(1, value + 1)));
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      commitValue(Math.max(1, value - 1));
    }

    if (event.key === 'Home') {
      event.preventDefault();
      commitValue(1);
    }

    if (event.key === 'End') {
      event.preventDefault();
      commitValue(5);
    }
  };

  return (
    <div
      aria-label={readOnly ? `Avaliação de ${value} em 5 estrelas` : 'Selecionar avaliação'}
      aria-readonly={readOnly || undefined}
      className="inline-flex items-center gap-1"
      onKeyDown={handleKeyDown}
      role="radiogroup"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= displayValue;

        return (
          <button
            key={starValue}
            aria-checked={value === starValue}
            aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
            className={cn(
              'rounded-full p-0.5 transition-transform duration-150',
              !readOnly && 'cursor-pointer hover:scale-110 focus-visible:outline-none',
              readOnly && 'cursor-default'
            )}
            disabled={readOnly}
            id={`${groupId}-${starValue}`}
            onBlur={() => setHoveredValue(null)}
            onClick={() => commitValue(starValue)}
            onMouseEnter={() => !readOnly && setHoveredValue(starValue)}
            onMouseLeave={() => !readOnly && setHoveredValue(null)}
            role="radio"
            tabIndex={
              readOnly ? -1 : value === starValue || (value === 0 && starValue === 1) ? 0 : -1
            }
            type="button"
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export const StarRating = memo(StarRatingComponent);