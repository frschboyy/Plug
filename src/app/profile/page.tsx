'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, LogOut, Settings, PlusSquare, Star, ExternalLink, MapPin } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { fetchSellerListings, fetchSellerRating } from '@/lib/data/listings';
import { TopBar } from '@/components/layout/TopBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton, ListingCardSkeleton } from '@/components/ui/Skeleton';
import type { Listing, SellerRatingSummary } from '@/lib/types';

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [myListings, setMyListings]   = useState<Listing[]>([]);
  const [rating, setRating]           = useState<SellerRatingSummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [signingOut, setSigningOut]   = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth?next=/profile');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    Promise.all([
      fetchSellerListings(supabase, user.id),
      fetchSellerRating(supabase, user.id),
    ]).then(([listings, rating]) => {
      setMyListings(listings);
      setRating(rating);
    }).finally(() => setLoadingData(false));
  }, [user]);

  const handleSignOut = async () => {
    const confirmed = window.confirm('Sign out of CampusMart?');
    if (!confirmed) return;

    setSigningOut(true);
    try {
      await signOut();
      success('Signed out successfully.');
      router.push('/');
    } catch {
      showError('Failed to sign out — please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-nav" aria-label="Loading profile..." aria-busy="true">
        <div className="px-4 py-6 space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const shopUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://campusmart.co.ke'}/shop/${user.id}`;

  return (
    <div className="pb-nav">
      <TopBar title="My account" />

      {/* Profile header */}
      <div className="px-4 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.name}'s avatar`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-gray-300">
                {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-black text-gray-900 truncate">{profile.name || 'Set up your name'}</h1>
              {profile.is_verified && (
                <ShieldCheck size={16} className="text-blue-500 shrink-0" aria-label="Verified" />
              )}
            </div>

            {rating && (rating.review_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-0.5">
                <Star size={13} className="fill-amber-400 stroke-amber-400" aria-hidden="true" />
                <span className="font-semibold text-gray-900">{rating.avg_rating}</span>
                <span>({rating.review_count} review{rating.review_count !== 1 ? 's' : ''})</span>
              </div>
            )}

            {profile.hostel && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} aria-hidden="true" />
                <span>{profile.hostel}</span>
              </div>
            )}
          </div>
        </div>

        {!profile.name && (
          <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700 font-medium">Complete your profile to start selling</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 flex-1 justify-center py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 press-scale"
          >
            <Settings size={14} aria-hidden="true" />
            Edit profile
          </Link>
          {profile.is_seller && (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 flex-1 justify-center py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 press-scale"
              aria-label="View your public shop"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View shop
            </a>
          )}
        </div>
      </div>

      {/* My listings */}
      <section className="pt-4" aria-label="My listings">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            My listings
            {!loadingData && (
              <span className="ml-2 text-gray-400 font-normal">({myListings.length})</span>
            )}
          </h2>
          <ButtonLink href="/sell" size="sm">
            <PlusSquare size={12} aria-hidden="true" />
            New
          </ButtonLink>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-2 gap-3 px-4" aria-busy="true" aria-label="Loading listings...">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📦</div>
            <p className="text-sm text-gray-500 mb-4">No listings yet</p>
            <ButtonLink href="/sell">
              <PlusSquare size={15} aria-hidden="true" />
              Post your first listing
            </ButtonLink>
          </div>
        ) : (
          <ol className="grid grid-cols-2 gap-3 px-4 list-none">
            {myListings.map(listing => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Sign out */}
      <div className="px-4 py-6">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
          className="flex items-center gap-2 w-full py-3 rounded-2xl border border-red-100 text-red-500 text-sm font-semibold justify-center press-scale disabled:opacity-50"
        >
          <LogOut size={15} aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>

        <div className="mt-4 text-center">
          <a href="/privacy" className="text-xs text-gray-400 underline mr-3">Privacy</a>
          <a href="/terms" className="text-xs text-gray-400 underline">Terms</a>
        </div>
      </div>
    </div>
  );
}
