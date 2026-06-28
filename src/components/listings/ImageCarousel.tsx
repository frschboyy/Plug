'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListingImage } from '@/lib/types';

interface ImageCarouselProps {
  images: ListingImage[];
  title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
        <span className="text-6xl text-gray-300" aria-hidden="true">🏪</span>
      </div>
    );
  }

  const prev = () => setIndex(i => (i - 1 + images.length) % images.length);
  const next = () => setIndex(i => (i + 1) % images.length);

  return (
    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
      {/* Main image */}
      <Image
        src={images[index].url}
        alt={`${title} — photo ${index + 1} of ${images.length}`}
        fill
        sizes="(max-width: 640px) 100vw, 640px"
        className="object-cover"
        priority
      />

      {/* Navigation arrows — only when multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md press-scale"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md press-scale"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          {/* Dot indicators */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
            role="tablist"
            aria-label="Image navigation"
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}`}
                className={[
                  'transition-all duration-200 rounded-full',
                  i === index ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-white text-xs font-medium rounded-full">
            {index + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
