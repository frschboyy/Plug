'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { formatPhone } from '@/lib/utils';
import { TopBar } from '@/components/layout/TopBar';
import { Phone, Mail, ArrowRight, Loader } from 'lucide-react';

// ============================================================
// OTP Phone form
// ============================================================
const phoneSchema = z.object({
  phone: z.string()
    .min(9, 'Enter a valid phone number')
    .regex(/^[0-9+\s-]+$/, 'Phone number contains invalid characters'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Digits only'),
});

type PhoneValues = z.infer<typeof phoneSchema>;
type OTPValues   = z.infer<typeof otpSchema>;

function PhoneAuth({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep]       = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const { error: showError, success } = useToast();
  const supabase = createClient();

  const phoneForm = useForm<PhoneValues>({ resolver: zodResolver(phoneSchema) });
  const otpForm   = useForm<OTPValues>({ resolver: zodResolver(otpSchema) });

  const sendOTP = async ({ phone: raw }: PhoneValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatPhone(raw),
        options: { shouldCreateUser: true },
      });

      if (error) throw error;

      setPhone(formatPhone(raw));
      setStep('otp');
      success('Code sent! Check your SMS.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send code';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async ({ otp }: OTPValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code — try again';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={otpForm.handleSubmit(verifyOTP)} className="space-y-4" aria-label="Verify code">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2" aria-hidden="true">📱</div>
          <h2 className="text-base font-bold text-gray-900">Enter the code</h2>
          <p className="text-sm text-gray-500 mt-1">
            We sent a 6-digit code to <span className="font-semibold">{phone}</span>
          </p>
        </div>

        <div>
          <label htmlFor="otp" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            {...otpForm.register('otp')}
            autoFocus
            aria-invalid={!!otpForm.formState.errors.otp}
            aria-describedby={otpForm.formState.errors.otp ? 'otp-error' : undefined}
            className="w-full h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {otpForm.formState.errors.otp && (
            <p id="otp-error" role="alert" className="mt-1 text-xs text-red-500 text-center">
              {otpForm.formState.errors.otp.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-3.5 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 press-scale tap-glow disabled:opacity-50"
        >
          {loading ? <Loader size={18} className="animate-spin" aria-hidden="true" /> : null}
          {loading ? 'Verifying…' : 'Confirm code'}
        </button>

        <button
          type="button"
          onClick={() => setStep('phone')}
          className="w-full text-sm text-gray-500 py-2 press-scale"
        >
          ← Back / resend code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(sendOTP)} className="space-y-4" aria-label="Sign in with phone">
      <div>
        <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 mb-1.5">
          Phone number
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            {...phoneForm.register('phone')}
            autoFocus
            aria-invalid={!!phoneForm.formState.errors.phone}
            aria-describedby={phoneForm.formState.errors.phone ? 'phone-error' : 'phone-hint'}
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <p id="phone-hint" className="mt-1 text-xs text-gray-400">
          Kenyan number — we&apos;ll send a free SMS code
        </p>
        {phoneForm.formState.errors.phone && (
          <p id="phone-error" role="alert" className="mt-1 text-xs text-red-500">
            {phoneForm.formState.errors.phone.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full py-3.5 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 press-scale tap-glow disabled:opacity-50"
      >
        {loading ? <Loader size={18} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
        {loading ? 'Sending code…' : 'Get SMS code'}
      </button>
    </form>
  );
}

// ============================================================
// Google OAuth
// ============================================================
function GoogleAuth() {
  const [loading, setLoading] = useState(false);
  const { error: showError }  = useToast();
  const supabase = createClient();

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      showError(msg);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      aria-busy={loading}
      className="w-full py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 flex items-center justify-center gap-2.5 press-scale hover:border-gray-300 disabled:opacity-50"
    >
      {loading ? (
        <Loader size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? 'Signing in…' : 'Continue with Google'}
    </button>
  );
}

// ============================================================
// Page
// ============================================================
function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';
  const [method, setMethod] = useState<'phone' | 'google'>('phone');

  const handleSuccess = () => {
    router.push(nextPath);
  };

  return (
    <div className="pb-nav">
      <TopBar title="Sign in" backHref="/" backLabel="Back" />

      <div className="px-5 pt-8 pb-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3" aria-hidden="true">🏪</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            campus<span className="text-brand">mart</span>
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to sell, review, and save listings.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Browsing? No account needed.
          </p>
        </div>

        {/* Method toggle */}
        <div className="flex rounded-2xl border border-gray-200 p-1 mb-6" role="group" aria-label="Sign in method">
          <button
            type="button"
            onClick={() => setMethod('phone')}
            aria-pressed={method === 'phone'}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-semibold transition-all press-scale flex items-center justify-center gap-1.5',
              method === 'phone' ? 'bg-brand text-white shadow-sm' : 'text-gray-500',
            ].join(' ')}
          >
            <Phone size={14} aria-hidden="true" />
            Phone
          </button>
          <button
            type="button"
            onClick={() => setMethod('google')}
            aria-pressed={method === 'google'}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-semibold transition-all press-scale flex items-center justify-center gap-1.5',
              method === 'google' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500',
            ].join(' ')}
          >
            <Mail size={14} aria-hidden="true" />
            Google
          </button>
        </div>

        {method === 'phone' ? (
          <PhoneAuth onSuccess={handleSuccess} />
        ) : (
          <GoogleAuth />
        )}

        {/* Trust signal */}
        <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your number is only used for sign-in. We never share it with sellers.
            By signing in you agree to our{' '}
            <a href="/terms" className="underline">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader size={24} className="animate-spin text-brand" aria-label="Loading..." />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  );
}
