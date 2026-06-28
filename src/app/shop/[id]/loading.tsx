import { Skeleton, ListingCardSkeleton, ReviewSkeleton } from '@/components/ui/Skeleton';

export default function ShopLoading() {
  return (
    <div className="pb-nav" aria-label="Loading shop..." aria-busy="true">
      {/* Hero */}
      <div className="px-4 py-5 bg-white border-b border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full mb-1" />
        <Skeleton className="h-3 w-3/4 rounded-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>

      {/* Listings */}
      <div className="pt-4 px-4">
        <Skeleton className="h-4 w-28 rounded-full mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 pt-6">
        <Skeleton className="h-4 w-24 rounded-full mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
