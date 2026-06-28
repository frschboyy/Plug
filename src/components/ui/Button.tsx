import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'brand' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function buttonVariants({
  variant = 'brand',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-full press-scale transition-opacity disabled:opacity-50',
    variant === 'brand'   && 'bg-brand text-white tap-glow',
    variant === 'outline' && 'border border-gray-200 text-gray-700',
    variant === 'ghost'   && 'text-gray-600',
    size === 'sm' && 'px-3 py-1.5 text-xs',
    size === 'md' && 'px-5 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3 text-sm',
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'brand', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant = 'brand', size = 'md', className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
