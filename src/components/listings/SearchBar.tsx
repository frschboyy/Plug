'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(searchParams.get('q') ?? '');

  const handleSearch = (value: string) => {
    setLocalValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    params.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clear = () => {
    setLocalValue('');
    handleSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <label htmlFor="listing-search" className="sr-only">Search listings</label>
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="listing-search"
          ref={inputRef}
          type="search"
          placeholder="Search beauty, food, tech…"
          value={localValue}
          onChange={e => handleSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-2xl bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand/40 focus:bg-white transition-all"
          autoComplete="off"
          spellCheck={false}
        />
        {localValue && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-300/70 press-scale"
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
