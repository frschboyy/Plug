-- ============================================================
-- CampusMart — Supabase Schema
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id   serial primary key,
  name text not null,
  slug text unique not null,
  icon text -- emoji or icon name
);

insert into public.categories (name, slug, icon) values
  ('All',      'all',      '🏪'),
  ('Beauty',   'beauty',   '💅'),
  ('Food',     'food',     '🍪'),
  ('Tech',     'tech',     '💻'),
  ('Services', 'services', '✨');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id               uuid references auth.users on delete cascade primary key,
  name             text not null default '',
  avatar_url       text,
  bio              text,
  whatsapp_number  text,
  hostel           text,
  is_seller        boolean default false,
  is_verified      boolean default false,
  is_premium       boolean default false,
  created_at       timestamptz default now(),
  last_active      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id             uuid default gen_random_uuid() primary key,
  seller_id      uuid references public.profiles(id) on delete cascade not null,
  type           text not null check (type in ('product', 'service')),
  title          text not null,
  price          numeric not null,
  price_is_range boolean default false,
  price_max      numeric,
  description    text,
  category_id    int references public.categories(id),
  is_available   boolean default true,
  stock          int,
  delivery_info  text,
  is_featured    boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  expires_at     timestamptz default (now() + interval '30 days'),
  -- full-text search vector
  search_vector  tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored
);

-- Index for full-text search
create index listings_search_idx on public.listings using gin(search_vector);

-- Index for common filters
create index listings_seller_idx on public.listings(seller_id);
create index listings_category_idx on public.listings(category_id);
create index listings_available_idx on public.listings(is_available, expires_at);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- LISTING IMAGES
-- ============================================================
create table public.listing_images (
  id         uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  url        text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index listing_images_listing_idx on public.listing_images(listing_id, sort_order);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id         uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  seller_id  uuid references public.profiles(id) on delete cascade not null,
  buyer_id   uuid references public.profiles(id) on delete cascade not null,
  rating     int not null check (rating >= 1 and rating <= 5),
  text       text,
  created_at timestamptz default now(),
  unique (listing_id, buyer_id)
);

create index reviews_seller_idx on public.reviews(seller_id);
create index reviews_listing_idx on public.reviews(listing_id);

-- View for seller rating aggregates
-- security_invoker = on ensures the view respects the querying user's RLS policies
-- (prevents the SECURITY DEFINER bypass that Supabase's linter flags)
create or replace view public.seller_rating_summary
  with (security_invoker = on)
as
  select
    seller_id,
    count(*)::int as review_count,
    round(avg(rating)::numeric, 1) as avg_rating
  from public.reviews
  group by seller_id;

-- ============================================================
-- REPORTS (moderation)
-- ============================================================
create table public.reports (
  id          uuid default gen_random_uuid() primary key,
  target_type text not null check (target_type in ('listing', 'profile', 'review')),
  target_id   uuid not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- SAVED LISTINGS (bookmarks)
-- ============================================================
create table public.saved_listings (
  user_id    uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_images  enable row level security;
alter table public.reviews         enable row level security;
alter table public.reports         enable row level security;
alter table public.saved_listings  enable row level security;

-- Profiles: anyone can read; only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Listings: anyone can read active; only owner can insert/update/delete
create policy "Active listings are viewable by everyone"
  on public.listings for select using (is_available = true or seller_id = auth.uid());

create policy "Sellers can insert own listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Sellers can delete own listings"
  on public.listings for delete using (auth.uid() = seller_id);

-- Listing images: anyone can read; only listing owner can modify
create policy "Listing images are viewable by everyone"
  on public.listing_images for select using (true);

create policy "Sellers can manage own listing images"
  on public.listing_images for all using (
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

-- Reviews: anyone can read; buyers can insert; no update
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Buyers can insert reviews"
  on public.reviews for insert with check (auth.uid() = buyer_id);

-- Reports: only authenticated users can insert
create policy "Authenticated users can report"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- Saved listings: only owner can see/manage
create policy "Users can manage own saved listings"
  on public.saved_listings for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run separately or via Dashboard)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policy: public read, authenticated write
-- create policy "Public listing images" on storage.objects for select using (bucket_id = 'listing-images');
-- create policy "Auth users upload listing images" on storage.objects for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Search listings by text + optional category
create or replace function public.search_listings(
  search_query text,
  category_slug text default null,
  page_size int default 20,
  page_offset int default 0
)
returns setof public.listings language sql stable as $$
  select l.*
  from public.listings l
  join public.categories c on c.id = l.category_id
  where
    l.is_available = true
    and l.expires_at > now()
    and (category_slug is null or category_slug = 'all' or c.slug = category_slug)
    and (
      search_query is null or search_query = ''
      or l.search_vector @@ plainto_tsquery('english', search_query)
    )
  order by
    case when search_query is null or search_query = '' then 0
         else -ts_rank(l.search_vector, plainto_tsquery('english', search_query))
    end,
    l.is_featured desc,
    l.updated_at desc
  limit page_size
  offset page_offset;
$$;
