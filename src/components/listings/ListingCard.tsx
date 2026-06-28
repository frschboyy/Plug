'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { type Listing } from '@/lib/types';
import { formatPrice, truncate } from '@/lib/utils';
import { FreshnessBadge } from './FreshnessBadge';

interface ListingCardProps {
  listing: Listing;
  priority?: boolean;
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const coverImage = listing.listing_images?.[0]?.url;
  const seller = listing.profiles;
  const price = formatPrice(listing.price, listing.price_max, listing.price_is_range);

  return (
    <article className="card press-scale tap-glow group">
      <Link
        href={`/listings/${listing.id}`}
        aria-label={`${listing.title} — ${price}`}
        className="block"
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`Photo of ${listing.title}`}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
              {listing.categories?.icon ?? '🏪'}
            </div>
          )}

          {/* Price badge */}
          <div className="absolute bottom-2 left-2">
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 shadow-sm">
              {price}
            </span>
          </div>

          {/* Featured badge */}
          {listing.is_featured && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-brand text-white rounded-full text-[10px] font-bold uppercase tracking-wide">
                Featured
              </span>
            </div>
          )}

          {/* Unavailable overlay */}
          {!listing.is_available && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-gray-700">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
            {truncate(listing.title, 40)}
          </h3>

          {/* Seller row */}
          {seller && (
            <div className="flex items-center gap-1.5">
              {/* Avatar */}
              <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {seller.avatar_url ? (
                  <Image
                    src={seller.avatar_url}
                    alt={`${seller.name}'s avatar`}
                    width={20}
                    height={20}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-gray-500">
                    {(seller.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 truncate flex-1">
                {seller.name}
              </span>
              {seller.is_verified && (
                <ShieldCheck
                  size={12}
                  className="text-blue-500 shrink-0"
                  aria-label="Verified seller"
                />
              )}
            </div>
          )}

          {/* Freshness */}
          <FreshnessBadge
            updatedAt={listing.updated_at}
            expiresAt={listing.expires_at}
            isAvailable={listing.is_available}
            compact
          />
        </div>
      </Link>
    </article>
  );
}
