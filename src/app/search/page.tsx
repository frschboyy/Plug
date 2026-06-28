export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { SearchBar } from '@/components/listings/SearchBar';
import { CategoryFilter } from '@/components/listings/CategoryFilter';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, CategoryFilterSkeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/server';
import { fetchSearchListings } from '@/lib/data/listings';

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const params = await searchParams;
  const query   = params.q?.trim() ?? '';
  const catSlug = params.cat ?? 'all';

  if (!query && catSlug === 'all') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
        <p className="text-sm text-gray-500">Search for beauty, food, tech, or services from your campus</p>
      </div>
    );
  }

  const supabase = await createClient();

  const listings = await fetchSearchListings(supabase, { query, catSlug });

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">😕</div>
        <p className="text-base font-semibold text-gray-900 mb-1">No results found</p>
        <p className="text-sm text-gray-500">
          Try different keywords, or check back — new listings are added daily.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="px-4 py-2 text-xs text-gray-400">
        {listings.length} result{listings.length !== 1 ? 's' : ''}
        {query ? ` for "${query}"` : ''}
      </p>
      <ol className="grid grid-cols-2 gap-3 px-4 pb-4 list-none">
        {listings.map((listing, i) => (
          <li key={listing.id}>
            <ListingCard listing={listing} priority={i < 2} />
          </li>
        ))}
      </ol>
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  return (
    <div className="pb-nav">
      <TopBar title="Search" />

      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      <Suspense fallback={<CategoryFilterSkeleton />}>
        <CategoryFilter />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-3 px-4 pt-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      }>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
