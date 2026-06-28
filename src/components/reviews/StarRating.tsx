'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
}

export function StarRating({
  value,
  max = 5,
  size = 14,
  interactive = false,
  onChange,
  label,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (interactive) {
    return (
      <div
        role="radiogroup"
        aria-label={label ?? 'Rating'}
        className="flex gap-1"
      >
        {stars.map(star => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            onClick={() => onChange?.(star)}
            className="press-scale focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
          >
            <Star
              size={size + 4}
              className={star <= value ? 'fill-amber-400 stroke-amber-400' : 'stroke-gray-300'}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <span
      className="flex gap-0.5 items-center"
      aria-label={`${value} out of ${max} stars`}
    >
      {stars.map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(value)
            ? 'fill-amber-400 stroke-amber-400'
            : 'stroke-gray-200'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
