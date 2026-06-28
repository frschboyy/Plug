export const dynamic = 'force-dynamic';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ShieldCheck, MapPin, Star, MessageCircle, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchSellerListings, fetchSellerReviews, fetchSellerRating } from '@/lib/data/listings';
import { fetchProfileById } from '@/lib/data/profiles';

const getProfileData = cache(async (id: string) => {
  const supabase = await createClient();
  return fetchProfileById(supabase, id);
});
import { TopBar } from '@/components/layout/TopBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ShareButton } from '@/components/listings/ShareButton';
import { StarRating } from '@/components/reviews/StarRating';
import { timeAgo, buildWhatsAppContactLink } from '@/lib/utils';
import { APP_URL } from '@/lib/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileData(id);
  if (!profile) return {};
  return {
    title: `${profile.name}'s Shop`,
    description: profile.bio ?? `Browse ${profile.name}'s listings on CampusMart`,
  };
}

export default async function ShopPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [seller, listings, reviews, rating] = await Promise.all([
    getProfileData(id),
    fetchSellerListings(supabase, id),
    fetchSellerReviews(supabase, id),
    fetchSellerRating(supabase, id),
  ]);

  if (!seller) notFound();

  const shopUrl      = `${APP_URL}/shop/${seller.id}`;
  const whatsappHref = seller.whatsapp_number
    ? buildWhatsAppContactLink(seller.whatsapp_number)
    : null;

  return (
    <div className="pb-nav">
      <TopBar backHref="/" backLabel="Back" />

      {/* Shop hero */}
      <div className="px-4 py-5 bg-white border-b border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={`${seller.name}'s avatar`}
                width={80}
                height={80}
                className="object-cover"
                priority
              />
            ) : (
              <span className="text-3xl font-black text-gray-300">
                {(seller.name ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-gray-900 truncate">{seller.name}</h1>
              {seller.is_verified && (
                <ShieldCheck
                  size={18}
                  className="text-blue-500 shrink-0"
                  aria-label="Verified seller"
                />
              )}
              {seller.is_premium && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0">
                  Pro
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
              {rating && (rating.review_count ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 stroke-amber-400" aria-hidden="true" />
                  <span className="font-bold text-gray-900">{rating.avg_rating}</span>
                  <span className="text-gray-400">({rating.review_count})</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-500">
                <Package size={13} aria-hidden="true" />
                <span>{listings.length} listing{listings.length !== 1 ? 's' : ''}</span>
              </div>
              {seller.hostel && (
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin size={13} aria-hidden="true" />
                  <span>{seller.hostel}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              {seller.created_at && `Joined ${timeAgo(seller.created_at)}`}
            </p>
          </div>
        </div>

        {/* Bio */}
        {seller.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{seller.bio}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${seller.name} on WhatsApp`}
              className="flex items-center gap-2 px-4 py-2.5 bg-whatsapp text-white rounded-full text-sm font-semibold press-scale tap-glow flex-1 justify-center"
            >
              <MessageCircle size={15} aria-hidden="true" />
              Message
            </a>
          )}
          <ShareButton
            url={shopUrl}
            title={`${seller.name}'s shop on CampusMart`}
            text={`Check out ${seller.name}'s shop: ${shopUrl}`}
            className="flex-1"
          >
            Share shop
          </ShareButton>
        </div>
      </div>

      {/* Listings */}
      <section className="pt-4 pb-4" aria-label={`${seller.name}'s listings`}>
        <h2 className="px-4 text-sm font-bold text-gray-900 mb-3">
          Active listings
          <span className="ml-2 text-gray-400 font-normal">({listings.length})</span>
        </h2>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📭</div>
            <p className="text-sm text-gray-500">No active listings right now.</p>
            <p className="text-xs text-gray-400 mt-1">Check back later!</p>
          </div>
        ) : (
          <ol className="grid grid-cols-2 gap-3 px-4 list-none">
            {listings.map((listing, i) => (
              <li key={listing.id}>
                <ListingCard listing={listing} priority={i < 4} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="px-4 pt-2 pb-6 border-t border-gray-100" aria-label="Reviews">
          <div className="flex items-center justify-between mb-4 mt-4">
            <h2 className="text-sm font-bold text-gray-900">
              Reviews
              <span className="ml-2 text-gray-400 font-normal">({rating?.review_count ?? 0})</span>
            </h2>
            {rating?.avg_rating != null && (
              <div className="flex items-center gap-1.5">
                <StarRating value={rating.avg_rating} size={13} />
                <span className="text-sm font-bold text-gray-900">{rating.avg_rating}</span>
              </div>
            )}
          </div>

          <div>
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
