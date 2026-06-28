'use client';

import Link from 'next/link';
import { Bell, ChevronLeft } from 'lucide-react';
import { useOptionalAuth } from '@/components/auth/AuthContext';

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, showLogo = false, backHref, backLabel, actions }: TopBarProps) {
  const auth = useOptionalAuth();

  return (
    <header
      className="sticky top-0 z-nav bg-white/95 backdrop-blur-sm border-b border-gray-100"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto gap-3">
        {/* Left: Logo or back */}
        <div className="flex-1 flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel ?? 'Go back'}
              className="flex items-center gap-1.5 text-gray-600 press-scale"
            >
              <ChevronLeft size={20} aria-hidden="true" />
              {backLabel && <span className="text-sm font-medium">{backLabel}</span>}
            </Link>
          ) : showLogo ? (
            <Link href="/" aria-label="CampusMart home" className="flex items-center gap-2 press-scale">
              <span className="text-xl font-black text-brand tracking-tight leading-none">campus</span>
              <span className="text-xl font-black text-gray-900 tracking-tight leading-none">mart</span>
            </Link>
          ) : title ? (
            <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
          ) : null}
        </div>

        {/* Right: actions or default icons */}
        <div className="flex items-center gap-1">
          {actions ?? (
            <>
              {auth?.user && (
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 press-scale"
                >
                  <Bell size={20} className="text-gray-600" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
