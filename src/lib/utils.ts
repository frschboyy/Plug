import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format price in KSh
export function formatPrice(price: number, priceMax?: number | null, isRange?: boolean | null): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  if (isRange && priceMax) {
    return `${fmt(price)} – ${fmt(priceMax)}`;
  }
  return fmt(price);
}

// Relative time (e.g. "2h ago", "3d ago")
export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60)  return 'Just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr < 24)   return `${diffHr}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  if (diffWeek < 4)  return `${diffWeek}w ago`;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

// Days until expiry
export function daysUntilExpiry(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const expiry = new Date(expiresAt);
  const now = new Date();
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// Is listing stale? (not updated in X days)
export function isStale(updatedAt: string | null, staleDays = 7): boolean {
  if (!updatedAt) return false;
  const updated = new Date(updatedAt);
  const now = new Date();
  return (now.getTime() - updated.getTime()) > staleDays * 24 * 60 * 60 * 1000;
}

// Build WhatsApp deep-link for ordering (pre-fills message with listing details)
export function buildWhatsAppOrderLink(
  whatsappNumber: string,
  listingTitle: string,
  price: string,
  listingUrl: string
): string {
  const number = formatPhone(whatsappNumber).replace(/^\+/, '');
  const message = encodeURIComponent(
    `Hi! I'm interested in your listing: *${listingTitle}* — ${price}\n\n${listingUrl}`
  );
  return `https://wa.me/${number}?text=${message}`;
}

// Build WhatsApp contact link (no pre-filled message — for "Message seller" buttons)
export function buildWhatsAppContactLink(whatsappNumber: string): string {
  const number = formatPhone(whatsappNumber).replace(/^\+/, '');
  return `https://wa.me/${number}`;
}

// Build WhatsApp share link (no recipient — opens share sheet)
export function buildWhatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// Format phone to international (Kenya default)
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0'))   return `+254${digits.slice(1)}`;
  return `+254${digits}`;
}

// Truncate text
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

// Generate unique ID for toasts / keys
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
