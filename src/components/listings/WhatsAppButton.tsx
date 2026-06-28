'use client';

import { buildWhatsAppOrderLink, formatPrice } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/ui/icons/WhatsAppIcon';
import type { Listing, Profile } from '@/lib/types';

interface WhatsAppButtonProps {
  listing: Listing;
  seller: Profile;
  listingUrl: string;
}

export function WhatsAppButton({ listing, seller, listingUrl }: WhatsAppButtonProps) {
  if (!seller.whatsapp_number) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        Contact method not available for this seller.
      </p>
    );
  }

  const price = formatPrice(listing.price, listing.price_max, listing.price_is_range);
  const href = buildWhatsAppOrderLink(
    seller.whatsapp_number,
    listing.title,
    price,
    listingUrl
  );

  const label = listing.type === 'service' ? 'Book via WhatsApp' : 'Order via WhatsApp';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — message ${seller.name} about ${listing.title}`}
      className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-whatsapp hover:bg-whatsapp-hover text-white rounded-2xl font-bold text-base transition-colors press-scale tap-glow shadow-lg shadow-green-200"
    >
      <WhatsAppIcon size={20} />
      {label}
    </a>
  );
}
