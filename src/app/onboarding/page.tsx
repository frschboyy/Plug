'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { upsertProfile } from '@/lib/data/profiles';
import { compressImage } from '@/lib/browser/compression';
import Image from 'next/image';
import { Camera, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = ['Who are you?', 'Your profile pic', 'Contact & location', 'Done! 🎉'];

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  bio:  z.string().max(160, 'Bio must be under 160 characters').optional(),
  whatsapp_number: z.string()
    .min(9, 'Enter a valid WhatsApp number')
    .regex(/^[0-9+\s-]+$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  hostel: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { error: showError, success } = useToast();

  const [step, setStep]         = useState(0);
  const [avatar, setAvatar]     = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bio: '', whatsapp_number: '', hostel: '' },
  });

  const name = watch('name');
  const bio  = watch('bio') ?? '';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 0.85);
      const newFile = new File([compressed], file.name, { type: 'image/jpeg' });
      setAvatar(newFile);
      setPreview(URL.createObjectURL(newFile));
    } catch {
      showError('Failed to process image — try another photo');
    }
  };

  const finish = async (values: FormValues) => {
    if (!user) return;
    setSaving(true);

    try {
      await upsertProfile(createClient(), user.id, values, avatar);
      await refreshProfile();
      success('Profile set up! Welcome to CampusMart 🎉');
      router.push('/');
    } catch (err) {
      console.error(err);
      showError('Failed to save profile — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full bg-brand transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        />
      </div>

      <div className="px-5 pt-8 pb-6 flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Step label */}
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="text-2xl font-black text-gray-900 mb-8">{STEPS[step]}</h1>

        <form onSubmit={handleSubmit(finish)} className="flex-1 flex flex-col">

          {/* STEP 0: Name + Bio */}
          {step === 0 && (
            <div className="space-y-5 flex-1">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Your name <span aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="How should buyers call you?"
                  autoFocus
                  maxLength={50}
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Short bio <span className="font-normal text-gray-300">(optional)</span>
                </label>
                <textarea
                  id="bio"
                  placeholder="e.g. Nails & lashes, Hall 3 · Fast turnaround · DM to book"
                  rows={3}
                  maxLength={160}
                  {...register('bio')}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
                  aria-describedby="bio-count"
                />
                <span id="bio-count" className="text-xs text-gray-300">{bio.length}/160</span>
              </div>
            </div>
          )}

          {/* STEP 1: Avatar */}
          {step === 1 && (
            <div className="flex flex-col items-center flex-1">
              <p className="text-sm text-gray-500 text-center mb-6">
                A photo helps buyers trust you. You can always update it later.
              </p>
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer press-scale"
                aria-label="Upload profile photo"
              >
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-brand/30 flex items-center justify-center">
                  {preview ? (
                    <Image src={preview} alt="Your avatar preview" fill className="object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-gray-200">
                      {name.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                    <Camera size={14} color="white" aria-hidden="true" />
                  </div>
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <p className="mt-4 text-sm text-gray-400">
                {preview ? '✓ Photo set — looking good!' : 'Tap to upload a photo'}
              </p>
            </div>
          )}

          {/* STEP 2: WhatsApp + Hostel */}
          {step === 2 && (
            <div className="space-y-5 flex-1">
              <div>
                <label htmlFor="whatsapp" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  WhatsApp number
                  <span className="font-normal text-gray-300 ml-1">(buyers will message you here)</span>
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0712 345 678"
                  {...register('whatsapp_number')}
                  aria-invalid={!!errors.whatsapp_number}
                  aria-describedby={errors.whatsapp_number ? 'wa-error' : 'wa-hint'}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <p id="wa-hint" className="mt-1 text-xs text-gray-400">
                  This is how buyers contact you. Leave blank if you prefer to use another method.
                </p>
                {errors.whatsapp_number && (
                  <p id="wa-error" role="alert" className="mt-1 text-xs text-red-500">
                    {errors.whatsapp_number.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="hostel" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Hostel / block <span className="font-normal text-gray-300">(optional)</span>
                </label>
                <input
                  id="hostel"
                  type="text"
                  placeholder="e.g. Hall 5, Block C"
                  maxLength={100}
                  {...register('hostel')}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Completion */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                <Check size={36} className="text-brand" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Your profile is ready. Now go post your first listing — it takes under 30 seconds.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 press-scale"
                aria-label="Go back"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand text-white font-bold press-scale tap-glow disabled:opacity-40 transition-opacity"
              >
                Continue
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold press-scale tap-glow disabled:opacity-50"
              >
                {saving ? 'Setting up…' : "Let's go! 🚀"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
