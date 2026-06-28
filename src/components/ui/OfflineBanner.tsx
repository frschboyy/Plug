'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline  = () => {
      setIsOffline(false);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };

    if (!navigator.onLine) handleOffline();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (!isOffline && !showBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed top-0 left-0 right-0 z-banner flex items-center justify-center gap-2 py-2.5 px-4',
        'text-sm font-medium transition-all duration-300',
        isOffline
          ? 'bg-gray-800 text-white translate-y-0'
          : 'bg-emerald-500 text-white translate-y-0',
      ].join(' ')}
    >
      {isOffline ? (
        <>
          <WifiOff size={14} />
          <span>No internet — browsing cached content</span>
        </>
      ) : (
        <span>✓ Back online</span>
      )}
    </div>
  );
}
