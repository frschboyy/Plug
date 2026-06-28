'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User, ShoppingBag } from 'lucide-react';
import { useOptionalAuth } from '@/components/auth/AuthContext';

const NAV_ITEMS = [
  { href: '/',        label: 'Browse',  Icon: Home },
  { href: '/search',  label: 'Search',  Icon: Search },
  { href: '/sell',    label: 'Sell',    Icon: PlusSquare, primary: true, protected: true },
  { href: '/orders',  label: 'Orders',  Icon: ShoppingBag, protected: true },
  { href: '/profile', label: 'Account', Icon: User,        protected: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const auth = useOptionalAuth();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-nav bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const { href, label, Icon } = item;
          const primary   = 'primary'   in item ? item.primary   : false;
          const isGuarded = 'protected' in item ? item.protected : false;

          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

          const navHref = isGuarded && !auth?.user
            ? `/auth?next=${href}`
            : href;

          if (primary) {
            return (
              <Link
                key={href}
                href={navHref}
                aria-label={label}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 press-scale"
              >
                <span className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center shadow-md shadow-orange-200">
                  <Icon size={20} color="white" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="text-[10px] font-semibold text-brand">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={navHref}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 press-scale"
            >
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={isActive ? 'text-brand' : 'text-gray-400'}
                  aria-hidden="true"
                />
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
