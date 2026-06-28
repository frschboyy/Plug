import { http, HttpResponse } from 'msw';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';

// Factories for common DB rows
export const mockProfile = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test Seller',
  avatar_url: null,
  bio: null,
  whatsapp_number: '+254712345678',
  hostel: 'Hall 5',
  is_seller: true,
  is_verified: false,
  is_premium: false,
  created_at: '2024-01-01T00:00:00Z',
  last_active: '2024-01-15T00:00:00Z',
  ...overrides,
});

export const mockListing = (overrides = {}) => ({
  id: 'listing-abc',
  seller_id: 'user-123',
  type: 'product',
  title: 'Chocolate Chip Cookies',
  price: 150,
  price_is_range: false,
  price_max: null,
  description: 'Freshly baked daily',
  category_id: 3,
  is_available: true,
  stock: 10,
  delivery_info: 'Hall 5, Room 204',
  is_featured: false,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  expires_at: new Date(Date.now() + 20 * 86400_000).toISOString(),
  listing_images: [],
  categories: { id: 3, name: 'Food', slug: 'food', icon: '🍪' },
  profiles: mockProfile(),
  ...overrides,
});

export const mockReview = (overrides = {}) => ({
  id: 'review-xyz',
  listing_id: 'listing-abc',
  seller_id: 'user-123',
  buyer_id: 'buyer-456',
  rating: 5,
  text: 'Amazing cookies!',
  created_at: '2024-01-16T00:00:00Z',
  profiles: { id: 'buyer-456', name: 'Test Buyer', avatar_url: null },
  ...overrides,
});

// Reusable MSW handlers for Supabase REST API
export const handlers = [
  // GET /listings — returns array; Accept: vnd.pgrst.object returns single item
  http.get(`${SUPABASE_URL}/rest/v1/listings`, ({ request }) => {
    const accept = request.headers.get('Accept') ?? '';
    if (accept.includes('vnd.pgrst.object')) {
      return HttpResponse.json(mockListing());
    }
    return HttpResponse.json([mockListing()]);
  }),

  // GET /profiles — returns array; Accept: vnd.pgrst.object returns single item
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, ({ request }) => {
    const accept = request.headers.get('Accept') ?? '';
    if (accept.includes('vnd.pgrst.object')) {
      return HttpResponse.json(mockProfile());
    }
    return HttpResponse.json([mockProfile()]);
  }),

  // GET /reviews
  http.get(`${SUPABASE_URL}/rest/v1/reviews`, () =>
    HttpResponse.json([mockReview()])
  ),

  // POST /reviews — insert a new review
  http.post(`${SUPABASE_URL}/rest/v1/reviews`, () =>
    HttpResponse.json({}, { status: 201 })
  ),

  // GET /seller_rating_summary
  http.get(`${SUPABASE_URL}/rest/v1/seller_rating_summary`, ({ request }) => {
    const accept = request.headers.get('Accept') ?? '';
    if (accept.includes('vnd.pgrst.object')) {
      return HttpResponse.json({ seller_id: 'user-123', review_count: 3, avg_rating: 4.7 });
    }
    return HttpResponse.json([{ seller_id: 'user-123', review_count: 3, avg_rating: 4.7 }]);
  }),

  // GET /categories
  http.get(`${SUPABASE_URL}/rest/v1/categories`, () =>
    HttpResponse.json([
      { id: 1, name: 'All',      slug: 'all',      icon: '🏪' },
      { id: 2, name: 'Beauty',   slug: 'beauty',   icon: '💅' },
      { id: 3, name: 'Food',     slug: 'food',     icon: '🍪' },
      { id: 4, name: 'Tech',     slug: 'tech',     icon: '💻' },
      { id: 5, name: 'Services', slug: 'services', icon: '✨' },
    ])
  ),
];
