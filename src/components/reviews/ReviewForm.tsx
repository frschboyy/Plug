'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StarRating } from './StarRating';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useOptionalAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const schema = z.object({
  rating: z.number().min(1, 'Please choose a star rating').max(5),
  text: z.string().max(500, 'Review must be under 500 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface ReviewFormProps {
  sellerId: string;
  listingId?: string;
  returnPath?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ sellerId, listingId, returnPath, onSuccess }: ReviewFormProps) {
  const auth = useOptionalAuth();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, text: '' },
  });

  const rating = watch('rating');
  const text   = watch('text') ?? '';

  const onSubmit = async (values: FormValues) => {
    if (!auth?.user) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('reviews').insert({
        seller_id:  sellerId,
        listing_id: listingId ?? null,
        buyer_id:   auth.user.id,
        rating:     values.rating,
        text:       values.text?.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          showError("You've already reviewed this listing.");
        } else {
          throw error;
        }
        return;
      }

      success('Review posted! Thank you.');
      reset();
      onSuccess?.();
    } catch (err) {
      showError('Failed to post review — please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!auth?.user) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-gray-500 mb-3">Sign in to leave a review</p>
        <Link
          href={`/auth?next=${encodeURIComponent(returnPath ?? '/')}`}
          className="px-4 py-2 bg-brand text-white rounded-full text-sm font-semibold press-scale tap-glow"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Leave a review">
      {/* Star rating */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Your rating <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <StarRating
          value={rating}
          interactive
          onChange={v => setValue('rating', v, { shouldValidate: true })}
          label="Rating (required)"
        />
        {errors.rating && (
          <p
            id="rating-error"
            role="alert"
            className="mt-1 text-xs text-red-500"
          >
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Text */}
      <div>
        <label
          htmlFor="review-text"
          className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2"
        >
          Your review <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="review-text"
          {...register('text')}
          placeholder="What was your experience with this seller?"
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          aria-describedby={errors.text ? 'review-text-error' : 'review-text-count'}
        />
        <div className="flex items-center justify-between mt-1">
          <span id="review-text-count" className="text-xs text-gray-400">
            {text.length}/500
          </span>
          {errors.text && (
            <p id="review-text-error" role="alert" className="text-xs text-red-500">
              {errors.text.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting || rating === 0}
        aria-busy={submitting}
        className="w-full disabled:cursor-not-allowed"
      >
        {submitting ? 'Posting…' : 'Post review'}
      </Button>
    </form>
  );
}
