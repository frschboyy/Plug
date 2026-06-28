export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campusmart.co.ke';

export const STORAGE_BUCKETS = {
  listings: 'listing-images',
  avatars:  'avatars',
} as const;

export const LIMITS = {
  pageSize:      20,
  searchResults: 40,
  listingReviews:20,
  sellerListings:20,
  sellerReviews: 10,
} as const;

export const PROTECTED_PATHS = ['/sell', '/profile', '/onboarding'] as const;
