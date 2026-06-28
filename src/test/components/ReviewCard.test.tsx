/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { mockReview } from '@/test/mocks/supabase';
import type { Review } from '@/lib/types';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/components/reviews/StarRating', () => ({
  StarRating: ({ value }: { value: number }) => <span data-testid="star-rating">{value}</span>,
}));

describe('ReviewCard', () => {
  it('renders the reviewer name', () => {
    render(<ReviewCard review={mockReview() as unknown as Review} />);
    expect(screen.getByText('Test Buyer')).toBeInTheDocument();
  });

  it('renders the review text', () => {
    render(<ReviewCard review={mockReview() as unknown as Review} />);
    expect(screen.getByText('Amazing cookies!')).toBeInTheDocument();
  });

  it('renders a StarRating with the correct value', () => {
    render(<ReviewCard review={mockReview({ rating: 4 }) as unknown as Review} />);
    expect(screen.getByTestId('star-rating')).toHaveTextContent('4');
  });

  it('shows "Anonymous" when profiles is null', () => {
    const review = mockReview({ profiles: null }) as unknown as Review;
    render(<ReviewCard review={review} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('shows the buyer avatar initital when no avatar_url', () => {
    render(<ReviewCard review={mockReview() as unknown as Review} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('shows the buyer avatar image when avatar_url is set', () => {
    const review = mockReview({
      profiles: { id: 'buyer-456', name: 'Test Buyer', avatar_url: 'https://img.test/avatar.jpg' },
    }) as unknown as Review;
    render(<ReviewCard review={review} />);
    expect(screen.getByAltText("Test Buyer's avatar")).toBeInTheDocument();
  });

  it('does not render review text when text is null', () => {
    const review = mockReview({ text: null }) as unknown as Review;
    render(<ReviewCard review={review} />);
    expect(screen.queryByText('Amazing cookies!')).not.toBeInTheDocument();
  });
});
