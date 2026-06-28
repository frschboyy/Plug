import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

export function Skeleton({ className, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      aria-label={ariaLabel ?? 'Loading...'}
      aria-busy="true"
      className={cn('skeleton', className)}
    />
  );
}

// Listing card skeleton — matches the shape of a real ListingCard
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-label="Loading listing..." aria-busy="true">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Profile header skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-label="Loading profile..." aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-2/3 rounded-full" />
    </div>
  );
}

// Category filter skeleton — 5 pill placeholders
export function CategoryFilterSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden px-4 py-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-20 rounded-full shrink-0" />
      ))}
    </div>
  );
}

// Review skeleton
export function ReviewSkeleton() {
  return (
    <div className="flex gap-3 py-3" aria-label="Loading review..." aria-busy="true">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>
    </div>
  );
}
