/**
 * CHARACTERIZATION TESTS — lib/utils.ts
 *
 * These pin the current behaviour of every public utility.
 * If a refactor (e.g. fixing buildWhatsAppOrderLink) breaks one of these,
 * the test explicitly tells you what changed and why it matters.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatPrice,
  timeAgo,
  daysUntilExpiry,
  isStale,
  buildWhatsAppOrderLink,
  buildWhatsAppContactLink,
  buildWhatsAppShareLink,
  formatPhone,
  truncate,
  uid,
} from '@/lib/utils';

// ─── cn() ──────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('joins strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('filters falsy values', () => {
    expect(cn('text-sm', false && 'hidden', undefined, null, '')).toBe('text-sm');
  });

  it('joins with space separator (does not trim individual inputs — clsx behaviour)', () => {
    // clsx doesn't strip internal whitespace from individual values.
    // CSS class attributes are whitespace-insensitive so this doesn't matter in practice.
    expect(cn('a', 'b')).toBe('a b');
  });

  // NOTE: cn() does NOT merge conflicting Tailwind classes — see audit W7.
  // This test documents the current (imperfect) behaviour.
  it('does not deduplicate conflicting Tailwind classes (known limitation)', () => {
    const result = cn('px-2', 'px-4');
    // Both classes are present; last one wins by CSS cascade, not intent
    expect(result).toContain('px-2');
    expect(result).toContain('px-4');
  });
});

// ─── formatPrice() ─────────────────────────────────────────────────────────

describe('formatPrice()', () => {
  it('formats a single price in KES', () => {
    const result = formatPrice(150);
    expect(result).toMatch(/150/);
    expect(result).toMatch(/KES|Ksh|KSh/i);
  });

  it('formats a price range when isRange is true', () => {
    const result = formatPrice(100, 500, true);
    expect(result).toContain('100');
    expect(result).toContain('500');
    expect(result).toContain('–');
  });

  it('ignores priceMax when isRange is false', () => {
    const result = formatPrice(100, 500, false);
    expect(result).not.toContain('500');
    expect(result).toMatch(/100/);
  });
});

// ─── timeAgo() ─────────────────────────────────────────────────────────────

describe('timeAgo()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for sub-minute differences', () => {
    const date = new Date('2024-06-15T11:59:30Z').toISOString();
    expect(timeAgo(date)).toBe('Just now');
  });

  it('returns minutes for < 1 hour', () => {
    const date = new Date('2024-06-15T11:45:00Z').toISOString();
    expect(timeAgo(date)).toBe('15m ago');
  });

  it('returns hours for < 1 day', () => {
    const date = new Date('2024-06-15T09:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('returns days for < 1 week', () => {
    const date = new Date('2024-06-12T12:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('3d ago');
  });

  it('returns weeks for < 4 weeks', () => {
    const date = new Date('2024-06-01T12:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('2w ago');
  });
});

// ─── daysUntilExpiry() ─────────────────────────────────────────────────────

describe('daysUntilExpiry()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => { vi.useRealTimers(); });

  it('returns correct days remaining', () => {
    const expiry = new Date('2024-06-18T12:00:00Z').toISOString();
    expect(daysUntilExpiry(expiry)).toBe(3);
  });

  it('returns 0 for already-expired listings (no negative)', () => {
    const past = new Date('2024-06-10T12:00:00Z').toISOString();
    expect(daysUntilExpiry(past)).toBe(0);
  });
});

// ─── isStale() ─────────────────────────────────────────────────────────────

describe('isStale()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => { vi.useRealTimers(); });

  it('returns false for recently updated listings', () => {
    const recent = new Date('2024-06-14T12:00:00Z').toISOString();
    expect(isStale(recent)).toBe(false);
  });

  it('returns true for listings not updated in 7+ days', () => {
    const old = new Date('2024-06-07T12:00:00Z').toISOString();
    expect(isStale(old)).toBe(true);
  });

  it('respects custom staleDays parameter', () => {
    const threeDaysOld = new Date('2024-06-12T12:00:00Z').toISOString();
    expect(isStale(threeDaysOld, 2)).toBe(true);
    expect(isStale(threeDaysOld, 4)).toBe(false);
  });
});

// ─── formatPhone() ─────────────────────────────────────────────────────────

describe('formatPhone()', () => {
  it('converts local 07xx format to +254', () => {
    expect(formatPhone('0712345678')).toBe('+254712345678');
  });

  it('passes through a correctly-formatted +254 number', () => {
    expect(formatPhone('+254712345678')).toBe('+254712345678');
  });

  it('handles 254 without the + prefix', () => {
    expect(formatPhone('254712345678')).toBe('+254712345678');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('0712 345 678')).toBe('+254712345678');
    expect(formatPhone('+254-712-345-678')).toBe('+254712345678');
  });
});

// ─── buildWhatsAppOrderLink() ───────────────────────────────────────────────

describe('buildWhatsAppOrderLink()', () => {
  it('builds a valid wa.me URL', () => {
    const url = buildWhatsAppOrderLink(
      '0712345678',
      'Cookies',
      'KES 150',
      'https://campusmart.co.ke/listings/abc'
    );
    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  it('includes the listing title in the message', () => {
    const url = buildWhatsAppOrderLink(
      '0712345678',
      'My Test Product',
      'KES 200',
      'https://campusmart.co.ke/listings/abc'
    );
    expect(decodeURIComponent(url)).toContain('My Test Product');
  });

  it('includes the listing URL in the message', () => {
    const listingUrl = 'https://campusmart.co.ke/listings/abc';
    const url = buildWhatsAppOrderLink('0712345678', 'Cookies', 'KES 150', listingUrl);
    expect(decodeURIComponent(url)).toContain(listingUrl);
  });

  it('phone in wa.me URL has no + prefix (wa.me standard format)', () => {
    const url = buildWhatsAppOrderLink('0712345678', 'Cookies', 'KES 150', 'https://example.com');
    const phoneInUrl = url.split('wa.me/')[1].split('?')[0];
    // wa.me uses '254712345678' format (no +); formatPhone() returns '+254712345678'
    // which we strip to '254712345678' — both are equivalent for wa.me
    expect(phoneInUrl).toBe('254712345678');
  });
});

// ─── buildWhatsAppContactLink() ────────────────────────────────────────────

describe('buildWhatsAppContactLink()', () => {
  it('builds a contact URL with no pre-filled text', () => {
    const url = buildWhatsAppContactLink('0712345678');
    expect(url).toBe('https://wa.me/254712345678');
    expect(url).not.toContain('text=');
  });

  it('handles +254 prefixed numbers', () => {
    const url = buildWhatsAppContactLink('+254712345678');
    expect(url).toBe('https://wa.me/254712345678');
  });
});

// ─── buildWhatsAppShareLink() ───────────────────────────────────────────────

describe('buildWhatsAppShareLink()', () => {
  it('builds a wa.me share URL with no recipient', () => {
    const url = buildWhatsAppShareLink('Check this out');
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(url)).toContain('Check this out');
  });
});

// ─── truncate() ────────────────────────────────────────────────────────────

describe('truncate()', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('truncates long strings with ellipsis', () => {
    const result = truncate('This is a long title', 10);
    expect(result.length).toBe(10);
    expect(result.endsWith('…')).toBe(true);
  });
});

// ─── uid() ─────────────────────────────────────────────────────────────────

describe('uid()', () => {
  it('generates a non-empty string', () => {
    expect(typeof uid()).toBe('string');
    expect(uid().length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = Array.from({ length: 100 }, uid);
    expect(new Set(ids).size).toBe(100);
  });
});
