'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X, Plus } from 'lucide-react';
import { compressImage } from '@/lib/browser/compression';

interface ImageUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  error?: string;
}

export function ImageUpload({ value, onChange, maxImages = 5, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  // Sync previews when controlled value is cleared externally (e.g. after form submit)
  useEffect(() => {
    if (value.length > 0) return;
    setPreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
  }, [value.length]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setCompressing(true);
    try {
      const remaining = maxImages - value.length;
      const toProcess = Array.from(files).slice(0, remaining);

      const compressed = await Promise.all(
        toProcess.map(file => compressImage(file, 1200, 0.82))
      );

      const newFiles = compressed.map(
        (blob, i) => new File([blob], toProcess[i].name, { type: 'image/jpeg' })
      );

      const newPreviews = newFiles.map(f => URL.createObjectURL(f));

      onChange([...value, ...newFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    } catch {
      // Fail silently — let form-level validation catch missing images
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles    = value.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Existing images */}
        {previews.map((src, i) => (
          <div
            key={src}
            className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-100"
          >
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center press-scale"
            >
              <X size={12} color="white" aria-hidden="true" />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
            aria-label="Add photo"
            aria-busy={compressing}
            className={[
              'shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed',
              'flex flex-col items-center justify-center gap-1',
              'transition-colors press-scale',
              previews.length === 0
                ? 'border-brand/50 bg-orange-50 text-brand'
                : 'border-gray-200 text-gray-400',
              compressing ? 'opacity-50 cursor-wait' : '',
            ].join(' ')}
          >
            {previews.length === 0 ? (
              <>
                <Camera size={22} aria-hidden="true" />
                <span className="text-xs font-semibold">Add photo</span>
              </>
            ) : (
              <Plus size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => handleFiles(e.target.files)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-400">
        {compressing
          ? 'Compressing images…'
          : `${value.length}/${maxImages} photo${maxImages !== 1 ? 's' : ''} · Images are compressed automatically`}
      </p>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
