export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { CategoryFilter } from '@/components/listings/CategoryFilter';
import { SearchBar } from '@/components/listings/SearchBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, Skeleton, CategoryFilterSkeleton } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { fetchBrowseListings } from '@/lib/data/listings';
import Link from 'next/link';
import { PlusSquare, ArrowRight } from 'lucide-react';

// ============================================================
// Data-fetching component
// ============================================================
async function ListingsGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const query      = params.q ?? '';
  const catSlug    = params.cat ?? 'all';
  const page     = parseInt(params.page ?? '1', 10);
  const pageSize = 20;

  const listings = await fetchBrowseListings(supabase, { query, catSlug, page, pageSize });

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          {query ? '🔍' : catSlug !== 'all' ? '📭' : '🛍️'}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {query
            ? `No results for "${query}"`
            : catSlug !== 'all'
              ? 'Nothing here yet'
              : 'Be the first to list!'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          {query
            ? 'Try different keywords, or browse by category.'
            : 'Post your first listing — it takes under 30 seconds.'}
        </p>
        {!query && (
          <ButtonLink href="/sell">
            <PlusSquare size={16} aria-hidden="true" />
            Post a listing
          </ButtonLink>
        )}
      </div>
    );
  }

  const nextPageParams = new URLSearchParams({
    ...(query    ? { q: query }        : {}),
    ...(catSlug !== 'all' ? { cat: catSlug } : {}),
    page: String(page + 1),
  });

  return (
    <>
      <ol
        className="grid grid-cols-2 gap-3 px-4 pb-4 list-none"
        aria-label={`Listings${query ? ` matching "${query}"` : ''}${catSlug !== 'all' ? ` in ${catSlug}` : ''}`}
      >
        {listings.map((listing, i) => (
          <li key={listing.id}>
            <ListingCard listing={listing} priority={i < 4} />
          </li>
        ))}
      </ol>

      {listings.length === pageSize && (
        <div className="px-4 pb-4">
          <Link
            href={`?${nextPageParams}`}
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:border-brand/40 hover:text-brand transition-colors press-scale"
            scroll={false}
          >
            Load more
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-4" aria-label="Loading listings..." aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================
// Page
// ============================================================
export default function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  return (
    <div className="pb-nav">
      <TopBar showLogo />

      {/* Search */}
      <Suspense fallback={<div className="px-4 pb-2"><Skeleton className="h-11 w-full rounded-2xl" /></div>}>
        <SearchBar />
      </Suspense>

      {/* Category filter */}
      <Suspense fallback={<CategoryFilterSkeleton />}>
        <CategoryFilter />
      </Suspense>

      {/* Seller prompt */}
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">🛍️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-700">Selling something?</p>
          <p className="text-xs text-orange-600/80">List it in 30 seconds — reach your whole hostel.</p>
        </div>
        <ButtonLink href="/sell" size="sm" className="shrink-0" aria-label="Post a listing">
          List it
        </ButtonLink>
      </div>

      {/* Listings */}
      <Suspense key={JSON.stringify(searchParams)} fallback={<GridSkeleton />}>
        <ListingsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
