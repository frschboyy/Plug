'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import type { Category } from '@/lib/types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 0, name: 'All',      slug: 'all',      icon: '🏪' },
  { id: 1, name: 'Beauty',   slug: 'beauty',   icon: '💅' },
  { id: 2, name: 'Food',     slug: 'food',     icon: '🍪' },
  { id: 3, name: 'Tech',     slug: 'tech',     icon: '💻' },
  { id: 4, name: 'Services', slug: 'services', icon: '✨' },
];

interface CategoryFilterProps {
  categories?: Category[];
}

export function CategoryFilter({ categories = DEFAULT_CATEGORIES }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSlug = searchParams.get('cat') ?? 'all';

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', slug);
    }
    // Reset page on filter change
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <section aria-label="Category filter">
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3"
        role="group"
        aria-label="Filter by category"
      >
        {categories.map(cat => {
          const isActive = cat.slug === activeSlug;
          return (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              aria-pressed={isActive}
              aria-label={`Filter by ${cat.name}`}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                'transition-all duration-200 press-scale shrink-0',
                'min-h-[44px] min-w-[44px]',
                isActive
                  ? 'bg-brand text-white shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand/40',
              ].join(' ')}
            >
              <span aria-hidden="true">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
