import { Skeleton } from '@/components/ui/Skeleton';

export default function ListingLoading() {
  return (
    <div className="pb-nav" aria-label="Loading listing..." aria-busy="true">
      {/* Image */}
      <Skeleton className="w-full aspect-square rounded-none" />

      <div className="px-4 pt-4 space-y-3">
        {/* Price + title */}
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>

        {/* Meta badges */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-2 py-4 border-t border-gray-100">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>

        {/* Seller card */}
        <div className="p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
