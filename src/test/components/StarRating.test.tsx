import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '@/components/reviews/StarRating';

describe('StarRating (read-only)', () => {
  it('renders the correct accessible label', () => {
    render(<StarRating value={4} />);
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
  });

  it('renders all 5 stars by default', () => {
    const { container } = render(<StarRating value={3} />);
    // Each Star is an svg; there should be 5
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
  });

  it('respects custom max', () => {
    const { container } = render(<StarRating value={3} max={3} />);
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });
});

describe('StarRating (interactive)', () => {
  it('calls onChange when a star is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} interactive onChange={onChange} label="Rating" />);

    // Stars are radio buttons — click the 3rd
    const thirdStar = screen.getByLabelText('3 stars');
    await user.click(thirdStar);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marks the active star as aria-checked', () => {
    render(<StarRating value={2} interactive onChange={vi.fn()} label="Rating" />);

    const second = screen.getByLabelText('2 stars');
    expect(second).toHaveAttribute('aria-checked', 'true');

    const third = screen.getByLabelText('3 stars');
    expect(third).toHaveAttribute('aria-checked', 'false');
  });

  it('renders as radiogroup with correct label', () => {
    render(<StarRating value={3} interactive onChange={vi.fn()} label="Rate this seller" />);
    expect(screen.getByRole('radiogroup', { name: 'Rate this seller' })).toBeInTheDocument();
  });
});
