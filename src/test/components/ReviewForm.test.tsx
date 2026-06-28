import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { ReviewForm } from '@/components/reviews/ReviewForm';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';

// ── Auth mock ────────────────────────────────────────────────────────────────
const mockAuthValue = vi.hoisted(() => ({ current: null as { user: { id: string } } | null }));

vi.mock('@/components/auth/AuthContext', () => ({
  useOptionalAuth: () => mockAuthValue.current,
}));

// ── Toast mock ───────────────────────────────────────────────────────────────
const toastSuccess = vi.fn();
const toastError   = vi.fn();

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

// ── next/link ────────────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.PropsWithChildren<{ href: string; [k: string]: unknown }>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// ── StarRating — interactive star picker ─────────────────────────────────────
vi.mock('@/components/reviews/StarRating', () => ({
  StarRating: ({ value, onChange, interactive }: { value: number; onChange?: (v: number) => void; interactive?: boolean }) =>
    interactive ? (
      <div>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" aria-label={`${n} star${n !== 1 ? 's' : ''}`} onClick={() => onChange?.(n)}>
            {n <= value ? '★' : '☆'}
          </button>
        ))}
      </div>
    ) : null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function setAuth(user: { id: string } | null) {
  mockAuthValue.current = user ? { user } : null;
}

function renderForm(props: Partial<React.ComponentProps<typeof ReviewForm>> = {}) {
  return render(
    <ReviewForm
      sellerId="seller-999"
      listingId="listing-abc"
      returnPath="/listings/listing-abc"
      {...props}
    />
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('ReviewForm', () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
    setAuth(null);
  });

  // Sign-in prompt ────────────────────────────────────────────────────────────

  it('shows the sign-in prompt when the user is not authenticated', () => {
    renderForm();
    expect(screen.getByText(/sign in to leave a review/i)).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('links the sign-in button to /auth with correct returnPath', () => {
    renderForm({ returnPath: '/listings/listing-abc' });
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link.getAttribute('href')).toBe('/auth?next=%2Flistings%2Flisting-abc');
  });

  it('defaults returnPath to / when not provided', () => {
    renderForm({ returnPath: undefined });
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link.getAttribute('href')).toBe('/auth?next=%2F');
  });

  // Form when authenticated ───────────────────────────────────────────────────

  it('shows the review form when the user is authenticated', () => {
    setAuth({ id: 'buyer-123' });
    renderForm();
    expect(screen.getByRole('form', { name: /leave a review/i })).toBeInTheDocument();
  });

  it('submit button is disabled when rating is 0', () => {
    setAuth({ id: 'buyer-123' });
    renderForm();
    expect(screen.getByRole('button', { name: /post review/i })).toBeDisabled();
  });

  it('submit button becomes enabled after selecting a star rating', async () => {
    setAuth({ id: 'buyer-123' });
    renderForm();
    await userEvent.click(screen.getByLabelText('5 stars'));
    expect(screen.getByRole('button', { name: /post review/i })).toBeEnabled();
  });

  it('shows character count for the review text', () => {
    setAuth({ id: 'buyer-123' });
    renderForm();
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('updates character count as the user types', async () => {
    setAuth({ id: 'buyer-123' });
    renderForm();
    const textarea = screen.getByPlaceholderText(/what was your experience/i);
    await userEvent.type(textarea, 'Great seller!');
    expect(screen.getByText('13/500')).toBeInTheDocument();
  });

  // Successful submission ──────────────────────────────────────────────────────

  it('calls success toast and resets form on successful submission', async () => {
    setAuth({ id: 'buyer-123' });
    renderForm();

    await userEvent.click(screen.getByLabelText('5 stars'));
    await userEvent.type(screen.getByPlaceholderText(/what was your experience/i), 'Loved it!');
    await userEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Review posted! Thank you.');
    });
  });

  it('calls the optional onSuccess callback after successful submission', async () => {
    setAuth({ id: 'buyer-123' });
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    await userEvent.click(screen.getByLabelText('4 stars'));
    await userEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  // Duplicate review error (23505) ────────────────────────────────────────────

  it('shows "already reviewed" toast on duplicate review error', async () => {
    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/reviews`, () =>
        HttpResponse.json(
          { code: '23505', message: 'duplicate key value violates unique constraint' },
          { status: 409 }
        )
      )
    );

    setAuth({ id: 'buyer-123' });
    renderForm();

    await userEvent.click(screen.getByLabelText('3 stars'));
    await userEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("You've already reviewed this listing.");
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  // Generic server error ──────────────────────────────────────────────────────

  it('shows generic failure toast on server error', async () => {
    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/reviews`, () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 })
      )
    );

    setAuth({ id: 'buyer-123' });
    renderForm();

    await userEvent.click(screen.getByLabelText('5 stars'));
    await userEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to post review — please try again.');
    });
  });
});
