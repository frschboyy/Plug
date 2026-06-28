import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhatsAppButton } from '@/components/listings/WhatsAppButton';
import { mockListing, mockProfile } from '@/test/mocks/supabase';
import type { Listing, Profile } from '@/lib/types';

vi.mock('@/components/ui/icons/WhatsAppIcon', () => ({
  WhatsAppIcon: () => <svg data-testid="whatsapp-icon" />,
}));

const listing = mockListing() as unknown as Listing;
const seller  = mockProfile() as unknown as Profile;

describe('WhatsAppButton', () => {
  it('shows "Contact method not available" when seller has no WhatsApp number', () => {
    const noPhone = mockProfile({ whatsapp_number: null }) as unknown as Profile;
    render(<WhatsAppButton listing={listing} seller={noPhone} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByText(/contact method not available/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a link when seller has a WhatsApp number', () => {
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('builds a wa.me URL with the seller phone number', () => {
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/254712345678/);
  });

  it('includes the listing title in the pre-filled message', () => {
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    const href = screen.getByRole('link').getAttribute('href') ?? '';
    const text = decodeURIComponent(href.split('?text=')[1] ?? '');
    expect(text).toContain('Chocolate Chip Cookies');
  });

  it('includes the listing URL in the pre-filled message', () => {
    const listingUrl = 'https://campusmart.co.ke/listings/listing-abc';
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl={listingUrl} />);
    const href = screen.getByRole('link').getAttribute('href') ?? '';
    const text = decodeURIComponent(href.split('?text=')[1] ?? '');
    expect(text).toContain(listingUrl);
  });

  it('labels the button "Order via WhatsApp" for products', () => {
    const productListing = mockListing({ type: 'product' }) as unknown as Listing;
    render(<WhatsAppButton listing={productListing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByText('Order via WhatsApp')).toBeInTheDocument();
  });

  it('labels the button "Book via WhatsApp" for services', () => {
    const serviceListing = mockListing({ type: 'service' }) as unknown as Listing;
    render(<WhatsAppButton listing={serviceListing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByText('Book via WhatsApp')).toBeInTheDocument();
  });

  it('opens the link in a new tab', () => {
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('renders the WhatsApp icon', () => {
    render(<WhatsAppButton listing={listing} seller={seller} listingUrl="https://campusmart.co.ke/listings/listing-abc" />);
    expect(screen.getByTestId('whatsapp-icon')).toBeInTheDocument();
  });
});
