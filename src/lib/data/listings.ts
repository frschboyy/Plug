import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { Listing, Profile, Review, SellerRatingSummary, ListingFormValues } from '@/lib/types';
import { STORAGE_BUCKETS, LIMITS } from '@/lib/constants';

export type Client = SupabaseClient<Database>;

// SELECT fragment used by all listing-list queries
export const LIST_SELECT =
  '*, profiles:seller_id(id, name, avatar_url, is_verified), listing_images(url, sort_order), categories:category_id(id, name, slug, icon)';

export interface BrowseOptions {
  query?: string;
  catSlug?: string;
  page?: number;
  pageSize?: number;
}

// ── Browse feed (paginated) ────────────────────────────────────────────────

export async function fetchBrowseListings(
  client: Client,
  { query = '', catSlug = 'all', page = 1, pageSize = LIMITS.pageSize }: BrowseOptions = {}
): Promise<Listing[]> {
  const offset = (page - 1) * pageSize;

  let q = client
    .from('listings')
    .select(LIST_SELECT)
    .eq('is_available', true)
    .gt('expires_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (catSlug !== 'all') {
    const { data: cat } = await client.from('categories').select('id').eq('slug', catSlug).single();
    if (cat) q = q.eq('category_id', cat.id);
  }

  if (query) q = q.textSearch('search_vector', query, { type: 'plain', config: 'english' });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

// ── Search (non-paginated, relevance-ordered) ──────────────────────────────

export async function fetchSearchListings(
  client: Client,
  { query = '', catSlug = 'all' }: Pick<BrowseOptions, 'query' | 'catSlug'> = {}
): Promise<Listing[]> {
  let q = client
    .from('listings')
    .select(LIST_SELECT)
    .eq('is_available', true)
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(LIMITS.searchResults);

  if (catSlug !== 'all') {
    const { data: cat } = await client.from('categories').select('id').eq('slug', catSlug).single();
    if (cat) q = q.eq('category_id', cat.id);
  }

  if (query) q = q.textSearch('search_vector', query, { type: 'plain', config: 'english' });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

// ── Listing detail ─────────────────────────────────────────────────────────

export async function fetchListingById(
  client: Client,
  id: string
): Promise<(Listing & { profiles: Profile }) | null> {
  const { data, error } = await client
    .from('listings')
    .select('*, profiles:seller_id(*), listing_images(id, url, sort_order), categories:category_id(id, name, slug, icon)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Listing & { profiles: Profile };
}

export async function fetchListingReviews(client: Client, listingId: string): Promise<Review[]> {
  const { data, error } = await client
    .from('reviews')
    .select('*, profiles!buyer_id(id, name, avatar_url)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(LIMITS.listingReviews);

  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
}

// ── Seller shop ────────────────────────────────────────────────────────────

export async function fetchSellerListings(client: Client, sellerId: string): Promise<Listing[]> {
  const { data, error } = await client
    .from('listings')
    .select(LIST_SELECT)
    .eq('seller_id', sellerId)
    .eq('is_available', true)
    .gt('expires_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(LIMITS.sellerListings);

  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

export async function fetchSellerReviews(client: Client, sellerId: string): Promise<Review[]> {
  const { data, error } = await client
    .from('reviews')
    .select('*, profiles!buyer_id(id, name, avatar_url)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(LIMITS.sellerReviews);

  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
}

export async function fetchSellerRating(
  client: Client,
  sellerId: string
): Promise<SellerRatingSummary | null> {
  const { data } = await client
    .from('seller_rating_summary')
    .select('*')
    .eq('seller_id', sellerId)
    .single();

  return data as SellerRatingSummary | null;
}

// ── Write operations ───────────────────────────────────────────────────────

export async function createListing(
  client: Client,
  userId: string,
  values: ListingFormValues
): Promise<{ id: string }> {
  const { data, error } = await client
    .from('listings')
    .insert({
      seller_id:      userId,
      type:           values.type,
      title:          values.title.trim(),
      price:          values.price,
      price_is_range: values.price_is_range,
      price_max:      values.price_is_range ? (values.price_max ?? null) : null,
      description:    values.description?.trim() || null,
      category_id:    values.category_id,
      is_available:   values.is_available,
      stock:          values.stock ?? null,
      delivery_info:  values.delivery_info?.trim() || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function uploadListingImages(
  client: Client,
  userId: string,
  listingId: string,
  images: File[]
): Promise<void> {
  const imageUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const path = `${userId}/${listingId}/${Date.now()}-${i}.jpg`;
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKETS.listings)
      .upload(path, file, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = client.storage.from(STORAGE_BUCKETS.listings).getPublicUrl(path);
    imageUrls.push(publicUrl);
  }

  const { error } = await client.from('listing_images').insert(
    imageUrls.map((url, sort_order) => ({ listing_id: listingId, url, sort_order }))
  );
  if (error) throw error;
}
