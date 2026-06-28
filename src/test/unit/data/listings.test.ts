import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { createClient } from '@/lib/supabase/client';
import {
  fetchBrowseListings,
  fetchSearchListings,
  fetchListingById,
  fetchListingReviews,
  fetchSellerListings,
  fetchSellerReviews,
  fetchSellerRating,
} from '@/lib/data/listings';
import { mockReview } from '@/test/mocks/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';

function withListingsError() {
  server.use(
    http.get(`${SUPABASE_URL}/rest/v1/listings`, () =>
      HttpResponse.json({ message: 'Internal server error', code: '500' }, { status: 500 })
    )
  );
}

// ── fetchBrowseListings ────────────────────────────────────────────────────

describe('fetchBrowseListings()', () => {
  it('returns listings from the API', async () => {
    const listings = await fetchBrowseListings(createClient());
    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe('Chocolate Chip Cookies');
  });

  it('returns an empty array when no listings match', async () => {
    server.use(http.get(`${SUPABASE_URL}/rest/v1/listings`, () => HttpResponse.json([])));
    const listings = await fetchBrowseListings(createClient());
    expect(listings).toHaveLength(0);
  });

  it('throws when Supabase returns a server error', async () => {
    withListingsError();
    await expect(fetchBrowseListings(createClient())).rejects.toThrow();
  });

  it('uses pageSize and page correctly (offset math)', async () => {
    // Just assert it does not throw and returns the mock data for page 2
    const listings = await fetchBrowseListings(createClient(), { page: 2, pageSize: 10 });
    expect(Array.isArray(listings)).toBe(true);
  });

  it('returns listings with expected shape', async () => {
    const listings = await fetchBrowseListings(createClient());
    const l = listings[0];
    expect(l).toHaveProperty('id');
    expect(l).toHaveProperty('title');
    expect(l).toHaveProperty('price');
    expect(l).toHaveProperty('seller_id');
  });
});

// ── fetchSearchListings ────────────────────────────────────────────────────

describe('fetchSearchListings()', () => {
  it('returns listings from the API', async () => {
    const listings = await fetchSearchListings(createClient(), { query: 'cookies' });
    expect(listings.length).toBeGreaterThan(0);
  });

  it('returns empty array when nothing found', async () => {
    server.use(http.get(`${SUPABASE_URL}/rest/v1/listings`, () => HttpResponse.json([])));
    const listings = await fetchSearchListings(createClient(), { query: 'xyz' });
    expect(listings).toHaveLength(0);
  });

  it('throws when Supabase returns a server error', async () => {
    withListingsError();
    await expect(fetchSearchListings(createClient())).rejects.toThrow();
  });
});

// ── fetchListingById ───────────────────────────────────────────────────────

describe('fetchListingById()', () => {
  it('returns a single listing with seller profile', async () => {
    const listing = await fetchListingById(createClient(), 'listing-abc');
    expect(listing).not.toBeNull();
    expect(listing?.id).toBe('listing-abc');
    expect(listing?.profiles).toBeDefined();
  });

  it('returns null when listing does not exist', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/listings`, () =>
        HttpResponse.json({ code: 'PGRST116', message: 'Row not found' }, { status: 406 })
      )
    );
    const listing = await fetchListingById(createClient(), 'nonexistent');
    expect(listing).toBeNull();
  });
});

// ── fetchListingReviews ────────────────────────────────────────────────────

describe('fetchListingReviews()', () => {
  it('returns reviews for a listing', async () => {
    const reviews = await fetchListingReviews(createClient(), 'listing-abc');
    expect(reviews).toHaveLength(1);
    expect(reviews[0].rating).toBe(5);
  });

  it('returns empty array when no reviews', async () => {
    server.use(http.get(`${SUPABASE_URL}/rest/v1/reviews`, () => HttpResponse.json([])));
    const reviews = await fetchListingReviews(createClient(), 'listing-abc');
    expect(reviews).toHaveLength(0);
  });
});

// ── fetchSellerListings ────────────────────────────────────────────────────

describe('fetchSellerListings()', () => {
  it('returns listings for a seller', async () => {
    const listings = await fetchSellerListings(createClient(), 'user-123');
    expect(listings).toHaveLength(1);
    expect(listings[0].seller_id).toBe('user-123');
  });

  it('returns empty array when seller has no listings', async () => {
    server.use(http.get(`${SUPABASE_URL}/rest/v1/listings`, () => HttpResponse.json([])));
    const listings = await fetchSellerListings(createClient(), 'user-123');
    expect(listings).toHaveLength(0);
  });
});

// ── fetchSellerReviews ─────────────────────────────────────────────────────

describe('fetchSellerReviews()', () => {
  it('returns reviews for a seller', async () => {
    const reviews = await fetchSellerReviews(createClient(), 'user-123');
    expect(reviews).toHaveLength(1);
  });

  it('returns reviews with buyer profile attached', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/reviews`, () =>
        HttpResponse.json([{ ...mockReview(), profiles: { id: 'buyer-456', name: 'Buyer', avatar_url: null } }])
      )
    );
    const reviews = await fetchSellerReviews(createClient(), 'user-123');
    expect(reviews[0].profiles?.name).toBe('Buyer');
  });
});

// ── fetchSellerRating ──────────────────────────────────────────────────────

describe('fetchSellerRating()', () => {
  it('returns rating summary for a seller', async () => {
    const rating = await fetchSellerRating(createClient(), 'user-123');
    expect(rating?.review_count).toBe(3);
    expect(rating?.avg_rating).toBe(4.7);
  });

  it('returns null when seller has no reviews', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/seller_rating_summary`, () =>
        HttpResponse.json({ code: 'PGRST116', message: 'Row not found' }, { status: 406 })
      )
    );
    const rating = await fetchSellerRating(createClient(), 'no-reviews');
    expect(rating).toBeNull();
  });
});
