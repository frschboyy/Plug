// ============================================================
// CampusMart — Shared TypeScript types
// ============================================================

export type CategorySlug = 'all' | 'beauty' | 'food' | 'tech' | 'services';

export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
  icon: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  whatsapp_number: string | null;
  hostel: string | null;
  is_seller: boolean | null;
  is_verified: boolean | null;
  is_premium: boolean | null;
  created_at: string | null;
  last_active: string | null;
}

export type ListingType = 'product' | 'service';

export interface Listing {
  id: string;
  seller_id: string;
  type: ListingType;
  title: string;
  price: number;
  price_is_range: boolean | null;
  price_max: number | null;
  description: string | null;
  category_id: number | null;
  is_available: boolean | null;
  stock: number | null;
  delivery_info: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  // Joined — shape depends on the SELECT clause used in each query
  profiles?: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_verified: boolean | null;
    // Present when selecting profiles:seller_id(*)
    bio?: string | null;
    whatsapp_number?: string | null;
    hostel?: string | null;
    is_seller?: boolean | null;
    is_premium?: boolean | null;
    created_at?: string | null;
    last_active?: string | null;
  } | null;
  listing_images?: ListingImage[];
  categories?: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export interface ListingImage {
  id?: string;                 // not always included in join selects
  listing_id?: string;         // not included in join selects
  url: string;
  sort_order: number | null;   // nullable per DB schema
  created_at?: string | null;  // not included in join selects
}

export interface Review {
  id: string;
  listing_id: string | null;
  seller_id: string;
  buyer_id: string;
  rating: number;
  text: string | null;
  created_at: string | null;
  // Joined — only the 3 fields selected in review queries
  profiles?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface SellerRatingSummary {
  seller_id: string;
  review_count: number | null;
  avg_rating: number | null;
}

export interface Report {
  id: string;
  target_type: 'listing' | 'profile' | 'review';
  target_id: string;
  reporter_id: string;
  reason: string;
  resolved: boolean;
  created_at: string;
}

export interface SavedListing {
  user_id: string;
  listing_id: string;
  created_at: string;
}

// ============================================================
// Form types
// ============================================================

export interface ListingFormValues {
  type: ListingType;
  title: string;
  price: number;
  price_is_range: boolean;
  price_max?: number;
  description?: string;
  category_id: number;
  is_available: boolean;
  stock?: number;
  delivery_info?: string;
}

export interface ProfileFormValues {
  name: string;
  bio?: string;
  whatsapp_number?: string;
  hostel?: string;
}

export interface ReviewFormValues {
  rating: number;
  text?: string;
}

// ============================================================
// UI types
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
