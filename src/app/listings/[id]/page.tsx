export const dynamic = 'force-dynamic';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ShieldCheck, MapPin, Package, Star, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchListingById, fetchListingReviews, fetchSellerRating } from '@/lib/data/listings';

const getListingData = cache(async (id: string) => {
  const supabase = await createClient();
  return fetchListingById(supabase, id);
});
import { TopBar } from '@/components/layout/TopBar';
import { ImageCarousel } from '@/components/listings/ImageCarousel';
import { FreshnessBadge } from '@/components/listings/FreshnessBadge';
import { WhatsAppButton } from '@/components/listings/WhatsAppButton';
import { ShareButton } from '@/components/listings/ShareButton';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import type { Review } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/utils';
import { APP_URL } from '@/lib/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingData(id);
  if (!listing) return {};
  return {
    title: listing.title,
    description: listing.description ?? `View ${listing.title} on CampusMart`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingData(id);
  if (!listing) notFound();

  if (!listing.profiles) notFound();
  const seller = listing.profiles;

  const supabase = await createClient();
  const [reviews, rating] = await Promise.all([
    fetchListingReviews(supabase, id),
    fetchSellerRating(supabase, seller.id),
  ]);

  const listingUrl = `${APP_URL}/listings/${listing.id}`;

  const sortedImages = [...(listing.listing_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const price = formatPrice(listing.price, listing.price_max, listing.price_is_range);

  return (
    <div className="pb-nav">
      <TopBar backHref="/" backLabel="Back" />

      {/* Image carousel */}
      <ImageCarousel images={sortedImages} title={listing.title} />

      {/* Price + title */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1">
            {listing.title}
          </h1>
          <span className="text-xl font-black text-brand shrink-0">{price}</span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            {listing.categories?.icon} {listing.categories?.name}
          </span>
          {listing.type === 'service' && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
              Service
            </span>
          )}
          <FreshnessBadge
            updatedAt={listing.updated_at}
            expiresAt={listing.expires_at}
            isAvailable={listing.is_available}
          />
        </div>

        {/* Stock & delivery */}
        {listing.stock != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Package size={12} aria-hidden="true" />
            <span>{listing.stock} in stock</span>
          </div>
        )}
        {listing.delivery_info && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <MapPin size={12} aria-hidden="true" />
            <span>{listing.delivery_info}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>
      )}

      {/* Seller card */}
      <div className="mx-4 my-4 p-4 rounded-2xl border border-gray-100 bg-white">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Seller</h2>
        <Link href={`/shop/${seller.id}`} className="flex items-center gap-3 press-scale group">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={`${seller.name}'s avatar`}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-500">
                {(seller.name ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                {seller.name}
              </span>
              {seller.is_verified && (
                <ShieldCheck size={14} className="text-blue-500 shrink-0" aria-label="Verified seller" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 stroke-amber-400" aria-hidden="true" />
                  <span className="text-xs font-medium text-gray-700">{rating.avg_rating}</span>
                  <span className="text-xs text-gray-400">({rating.review_count} reviews)</span>
                </div>
              )}
              {seller.hostel && (
                <span className="text-xs text-gray-400">{seller.hostel}</span>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" aria-hidden="true" />
        </Link>

        {seller.bio && (
          <p className="mt-3 text-sm text-gray-500 border-t border-gray-50 pt-3">
            {seller.bio}
          </p>
        )}
      </div>

      {/* Primary CTA */}
      <div className="px-4 mb-4 space-y-3">
        <WhatsAppButton listing={listing} seller={seller} listingUrl={listingUrl} />

        {/* Share */}
        <div className="flex items-center gap-2">
          <ShareButton
            url={listingUrl}
            title={listing.title}
            text={`Check out this listing on CampusMart: ${listing.title} — ${price}`}
          >
            Share to WhatsApp
          </ShareButton>
        </div>
      </div>

      {/* Reviews */}
      <section className="px-4 pb-4" aria-label="Reviews">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Reviews
            {rating?.review_count != null && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({rating.review_count})
              </span>
            )}
          </h2>
          {rating?.avg_rating != null && (
            <div className="flex items-center gap-1.5">
              <StarRating value={rating.avg_rating} size={14} />
              <span className="text-sm font-bold text-gray-900">{rating.avg_rating}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="py-6 text-center">
            <div className="text-3xl mb-2" aria-hidden="true">⭐</div>
            <p className="text-sm text-gray-500">No reviews yet — be the first!</p>
          </div>
        ) : (
          <div>
            {reviews.map((review: Review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Leave a review */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave a review</h3>
          <ReviewForm sellerId={seller.id} listingId={listing.id} returnPath={`/listings/${listing.id}`} />
        </div>
      </section>

      {/* Last updated */}
      <p className="px-4 pb-6 text-xs text-gray-400 text-center">
        Listed {timeAgo(listing.created_at)}
        {listing.updated_at && listing.updated_at !== listing.created_at && ` · Updated ${timeAgo(listing.updated_at)}`}
      </p>
    </div>
  );
}
