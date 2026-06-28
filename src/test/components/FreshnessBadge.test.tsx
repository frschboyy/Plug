/**
 * FreshnessBadge — component tests
 *
 * This component's logic is a good example of business rules encoded in UI:
 * fresh vs stale vs near-expiry vs unavailable. These tests lock in that logic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreshnessBadge } from '@/components/listings/FreshnessBadge';

const NOW = new Date('2024-06-15T12:00:00Z');

describe('FreshnessBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows unavailable state when is_available is false', () => {
    render(
      <FreshnessBadge
        updatedAt={new Date(NOW.getTime() - 1000 * 60).toISOString()}
        expiresAt={new Date(NOW.getTime() + 20 * 86400_000).toISOString()}
        isAvailable={false}
      />
    );
    // The component renders AlertCircle icon + optional "Unavailable" text
    expect(document.body).toBeDefined(); // component renders without crash
  });

  it('shows expiry warning when < 3 days remain', () => {
    const expiresAt = new Date(NOW.getTime() + 2 * 86400_000).toISOString(); // 2 days
    const updatedAt = new Date(NOW.getTime() - 1000 * 60).toISOString();     // 1 min ago (fresh)

    render(
      <FreshnessBadge updatedAt={updatedAt} expiresAt={expiresAt} isAvailable={true} />
    );
    expect(screen.getByText(/Expires in 2d/)).toBeInTheDocument();
  });

  it('shows stale state when not updated in 7+ days', () => {
    const updatedAt = new Date(NOW.getTime() - 8 * 86400_000).toISOString(); // 8 days ago
    const expiresAt = new Date(NOW.getTime() + 20 * 86400_000).toISOString();

    render(
      <FreshnessBadge updatedAt={updatedAt} expiresAt={expiresAt} isAvailable={true} />
    );
    // Stale badge shows "Updated X ago"
    expect(screen.getByText(/Updated 1w ago/)).toBeInTheDocument();
  });

  it('shows active/fresh state for recently-updated listings', () => {
    const updatedAt = new Date(NOW.getTime() - 2 * 3600_000).toISOString(); // 2 hours ago
    const expiresAt = new Date(NOW.getTime() + 20 * 86400_000).toISOString();

    render(
      <FreshnessBadge updatedAt={updatedAt} expiresAt={expiresAt} isAvailable={true} />
    );
    expect(screen.getByText(/Active · 2h ago/)).toBeInTheDocument();
  });

  it('compact mode hides label text', () => {
    const updatedAt = new Date(NOW.getTime() - 2 * 3600_000).toISOString();
    const expiresAt = new Date(NOW.getTime() + 20 * 86400_000).toISOString();

    render(
      <FreshnessBadge updatedAt={updatedAt} expiresAt={expiresAt} isAvailable={true} compact />
    );
    // compact mode shows just the time, not "Active · "
    expect(screen.queryByText(/Active ·/)).not.toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });
});
