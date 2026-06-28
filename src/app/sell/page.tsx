'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TopBar } from '@/components/layout/TopBar';
import { ImageUpload } from '@/components/sell/ImageUpload';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/auth/AuthContext';
import { createListing, uploadListingImages } from '@/lib/data/listings';
import { markAsSeller } from '@/lib/data/profiles';
import { fetchCategories } from '@/lib/data/categories';
import type { Category, ListingType } from '@/lib/types';

const schema = z.object({
  type:           z.enum(['product', 'service']),
  title:          z.string().min(3, 'Title must be at least 3 characters').max(80, 'Title is too long'),
  price:          z.coerce.number().positive('Price must be a positive number'),
  price_is_range: z.boolean(),
  price_max:      z.coerce.number().optional(),
  description:    z.string().max(1000, 'Description is too long').optional(),
  category_id:    z.coerce.number().positive('Choose a category'),
  is_available:   z.boolean(),
  stock:          z.coerce.number().int().positive().optional(),
  delivery_info:  z.string().max(200).optional(),
}).refine(
  data => !data.price_is_range || (data.price_max != null && data.price_max > data.price),
  { message: 'Max price must be greater than the minimum price', path: ['price_max'] }
);

type FormValues = z.infer<typeof schema>;

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [images, setImages]           = useState<File[]>([]);
  const [imageError, setImageError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories]   = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories(createClient()).then(setCategories).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type:           'product',
      is_available:   true,
      price_is_range: false,
      category_id:    0,
    },
  });

  const isRange  = watch('price_is_range');
  const listType = watch('type');
  const catId    = watch('category_id');

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    if (images.length === 0) {
      setImageError('Add at least one photo');
      return;
    }
    setImageError('');
    setSubmitting(true);

    const supabase = createClient();
    try {
      const listing = await createListing(supabase, user.id, values);
      await uploadListingImages(supabase, user.id, listing.id, images);
      await markAsSeller(supabase, user.id);

      success('Listing posted! 🎉');
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      console.error(err);
      showError('Failed to post listing — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-nav">
      <TopBar title="New listing" backHref="/" backLabel="Cancel" />

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-6" noValidate>

        {/* ── STEP 1: Photo ── */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            1. Photo
          </legend>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxImages={5}
            error={imageError}
          />
        </fieldset>

        {/* ── STEP 2: Price ── */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            2. Price
          </legend>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="price" className="sr-only">Price in KSh</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">KSh</span>
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  min="0"
                  step="1"
                  {...register('price')}
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? 'price-error' : undefined}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              {errors.price && (
                <p id="price-error" role="alert" className="mt-1 text-xs text-red-500">
                  {errors.price.message}
                </p>
              )}
            </div>

            {isRange && (
              <div className="flex-1">
                <label htmlFor="price_max" className="sr-only">Max price in KSh</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">–</span>
                  <input
                    id="price_max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Max"
                    min="0"
                    step="1"
                    {...register('price_max')}
                    aria-invalid={!!errors.price_max}
                    aria-describedby={errors.price_max ? 'price_max-error' : undefined}
                    className="w-full h-12 pl-8 pr-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                {errors.price_max && (
                  <p id="price_max-error" role="alert" className="mt-1 text-xs text-red-500">
                    {errors.price_max.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Price range toggle */}
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('price_is_range')}
              className="w-4 h-4 rounded accent-brand"
            />
            <span className="text-xs text-gray-500">Price range (e.g. for custom work)</span>
          </label>
        </fieldset>

        {/* ── STEP 3: Title & Category ── */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            3. What are you selling?
          </legend>

          {/* Type toggle */}
          <div className="flex gap-2 mb-3" role="group" aria-label="Listing type">
            {(['product', 'service'] as ListingType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                aria-pressed={listType === t}
                className={[
                  'flex-1 py-2 rounded-full text-sm font-semibold border transition-all press-scale',
                  listType === t
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200',
                ].join(' ')}
              >
                {t === 'product' ? '📦 Product' : '✨ Service'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-3">
            <label
              htmlFor="title"
              className="block text-xs font-semibold text-gray-500 mb-1"
            >
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder={listType === 'service' ? 'e.g. Nail Art & Designs' : 'e.g. Homemade Chocolate Chip Cookies'}
              maxLength={80}
              autoComplete="off"
              {...register('title')}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : 'title-count'}
              className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <div className="flex items-center justify-between mt-1">
              <span
                id="title-count"
                className="text-xs text-gray-300"
                aria-label={`${watch('title')?.length ?? 0} of 80 characters`}
              >
                {watch('title')?.length ?? 0}/80
              </span>
              {errors.title && (
                <p id="title-error" role="alert" className="text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <fieldset>
              <legend className="block text-xs font-semibold text-gray-500 mb-2">
                Category <span aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2" role="group">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={[
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer press-scale transition-all',
                      catId === cat.id
                        ? 'border-brand bg-orange-50 text-brand'
                        : 'border-gray-200 text-gray-700',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      value={cat.id}
                      {...register('category_id')}
                      className="sr-only"
                      aria-label={cat.name}
                    />
                    <span aria-hidden="true">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </label>
                ))}
              </div>
              {errors.category_id && (
                <p role="alert" className="mt-1 text-xs text-red-500">
                  {errors.category_id.message}
                </p>
              )}
            </fieldset>
          </div>
        </fieldset>

        {/* ── Advanced options (progressive disclosure) ── */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            className="flex items-center gap-2 text-sm text-brand font-semibold press-scale"
          >
            <span>{showAdvanced ? '▾' : '▸'}</span>
            {showAdvanced ? 'Hide details' : 'Add description & delivery info'}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-gray-500 mb-1">
                  Description <span className="font-normal text-gray-300">(optional)</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Tell buyers more: materials, sizes, how to order, etc."
                  rows={4}
                  maxLength={1000}
                  {...register('description')}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                  aria-describedby="description-count"
                />
                <span id="description-count" className="text-xs text-gray-300">
                  {watch('description')?.length ?? 0}/1000
                </span>
              </div>

              {/* Delivery / location */}
              <div>
                <label htmlFor="delivery_info" className="block text-xs font-semibold text-gray-500 mb-1">
                  Location / delivery info
                </label>
                <input
                  id="delivery_info"
                  type="text"
                  placeholder="e.g. Hall 5 Room 204, or collect from hostel"
                  maxLength={200}
                  {...register('delivery_info')}
                  className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              {/* Stock (products only) */}
              {listType === 'product' && (
                <div>
                  <label htmlFor="stock" className="block text-xs font-semibold text-gray-500 mb-1">
                    Stock quantity
                  </label>
                  <input
                    id="stock"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 10 (leave blank if unlimited)"
                    min="1"
                    step="1"
                    {...register('stock')}
                    className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-base disabled:opacity-50 press-scale tap-glow shadow-lg shadow-orange-200 transition-opacity"
        >
          {submitting ? 'Posting…' : 'Post listing 🚀'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By posting you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a>.
          Keep listings honest and campus-appropriate.
        </p>
      </form>
    </div>
  );
}
