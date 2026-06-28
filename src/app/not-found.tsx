import { Home } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center pb-nav">
      <div className="text-6xl mb-4" aria-hidden="true">🏪</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-xs">
        This page doesn&apos;t exist. It may have moved, expired, or never existed.
      </p>
      <ButtonLink href="/" size="lg">
        <Home size={16} aria-hidden="true" />
        Back to browse
      </ButtonLink>
    </div>
  );
}
