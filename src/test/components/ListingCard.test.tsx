import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingCard } from '@/components/listings/ListingCard';
import { mockListing, mockProfile } from '@/test/mocks/supabase';
import type { Listing } from '@/lib/types';

// Cast the untyped factory to the domain type (factory uses string literals; type is a union)
const L = (overrides = {}) => mockListing(overrides) as unknown as Listing;

// next/link renders an <a> in jsdom
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.PropsWithChildren<{ href: string; [k: string]: unknown }>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// next/image renders a plain <img> in jsdom
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

// FreshnessBadge is tested separately — stub it out
vi.mock('@/components/listings/FreshnessBadge', () => ({
  FreshnessBadge: () => <span data-testid="freshness-badge" />,
}));

describe('ListingCard', () => {
  it('renders the listing title', () => {
    render(<ListingCard listing={L()} />);
    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument();
  });

  it('renders the formatted price', () => {
    render(<ListingCard listing={L({ price: 250 })} />);
    expect(screen.getByText('Ksh 250')).toBeInTheDocument();
  });

  it('links to the listing detail page', () => {
    render(<ListingCard listing={L()} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/listing-abc');
  });

  it('shows cover image when listing_images has a URL', () => {
    render(<ListingCard listing={L({ listing_images: [{ url: 'https://img.test/cookie.jpg', sort_order: 0 }] })} />);
    expect(screen.getByAltText('Photo of Chocolate Chip Cookies')).toBeInTheDocument();
  });

  it('shows category emoji fallback when there is no cover image', () => {
    render(<ListingCard listing={L({ listing_images: [] })} />);
    expect(screen.getByText('🍪')).toBeInTheDocument();
  });

  it('shows default emoji fallback when there is no image and no category', () => {
    render(<ListingCard listing={L({ listing_images: [], categories: null })} />);
    expect(screen.getByText('🏪')).toBeInTheDocument();
  });

  it('shows "Sold out" overlay when listing is unavailable', () => {
    render(<ListingCard listing={L({ is_available: false })} />);
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });

  it('does not show "Sold out" overlay when listing is available', () => {
    render(<ListingCard listing={L({ is_available: true })} />);
    expect(screen.queryByText('Sold out')).not.toBeInTheDocument();
  });

  it('shows "Featured" badge for featured listings', () => {
    render(<ListingCard listing={L({ is_featured: true })} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not show "Featured" badge for non-featured listings', () => {
    render(<ListingCard listing={L({ is_featured: false })} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('shows seller name', () => {
    render(<ListingCard listing={L()} />);
    expect(screen.getByText('Test Seller')).toBeInTheDocument();
  });

  it('shows verified badge for verified sellers', () => {
    render(<ListingCard listing={L({ profiles: mockProfile({ is_verified: true }) })} />);
    expect(screen.getByLabelText('Verified seller')).toBeInTheDocument();
  });

  it('does not show verified badge for unverified sellers', () => {
    render(<ListingCard listing={L({ profiles: mockProfile({ is_verified: false }) })} />);
    expect(screen.queryByLabelText('Verified seller')).not.toBeInTheDocument();
  });

  it('does not show seller row when profiles is null', () => {
    render(<ListingCard listing={L({ profiles: null })} />);
    expect(screen.queryByText('Test Seller')).not.toBeInTheDocument();
  });

  it('renders a FreshnessBadge', () => {
    render(<ListingCard listing={L()} />);
    expect(screen.getByTestId('freshness-badge')).toBeInTheDocument();
  });
});
