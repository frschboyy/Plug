import { TopBar } from '@/components/layout/TopBar';
import { ButtonLink } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';

export const metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <div className="pb-nav">
      <TopBar title="Orders" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">💬</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Orders via WhatsApp</h1>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          At launch, all orders are coordinated directly via WhatsApp with sellers.
          Tap &ldquo;Order via WhatsApp&rdquo; on any listing to get started.
        </p>
        <ButtonLink href="/" size="lg">
          Browse listings
        </ButtonLink>
        <p className="mt-6 text-xs text-gray-400 flex items-center gap-1">
          <MessageCircle size={12} aria-hidden="true" />
          In-app order tracking coming soon
        </p>
      </div>
    </div>
  );
}
