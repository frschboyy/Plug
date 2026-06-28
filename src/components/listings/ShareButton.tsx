'use client';

import { Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { WhatsAppIcon } from '@/components/ui/icons/WhatsAppIcon';

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({ url, title, text, className, children }: ShareButtonProps) {
  const { success, info } = useToast();

  const handleShare = async () => {
    const shareData = { url, title, text };

    // Use native share sheet if available (Android Chrome, iOS Safari)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled — not an error
        return;
      }
    }

    // Fallback: WhatsApp share link
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text ?? title}\n\n${url}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    info('Opened WhatsApp to share this listing');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      success('Link copied to clipboard!');
    } catch {
      info('Copy this link: ' + url);
    }
  };

  return (
    <div className={`flex gap-2 ${className ?? ''}`}>
      <button
        onClick={handleShare}
        aria-label={`Share ${title} to WhatsApp`}
        className="flex items-center gap-2 px-4 py-2.5 bg-whatsapp text-white rounded-full text-sm font-semibold press-scale tap-glow"
      >
        <WhatsAppIcon size={16} />
        {children ?? 'Share on WhatsApp'}
      </button>

      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 press-scale"
      >
        <Share2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
