import Image from 'next/image';
import { type Review } from '@/lib/types';
import { StarRating } from './StarRating';
import { timeAgo } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const buyer = review.profiles;

  return (
    <article className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
        {buyer?.avatar_url ? (
          <Image
            src={buyer.avatar_url}
            alt={`${buyer.name}'s avatar`}
            width={36}
            height={36}
            className="object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-gray-500">
            {buyer?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="text-sm font-semibold text-gray-900">
              {buyer?.name ?? 'Anonymous'}
            </span>
            <StarRating value={review.rating} size={12} />
          </div>
          <time
            dateTime={review.created_at ?? undefined}
            className="text-xs text-gray-400 shrink-0"
          >
            {timeAgo(review.created_at)}
          </time>
        </div>
        {review.text && (
          <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
        )}
      </div>
    </article>
  );
}
