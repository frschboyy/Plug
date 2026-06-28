import type { ReactNode } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo, daysUntilExpiry, isStale } from '@/lib/utils';

interface FreshnessBadgeProps {
  updatedAt: string | null;
  expiresAt: string | null;
  isAvailable: boolean | null;
  compact?: boolean;
}

function StatusBadge({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {icon}
      {children}
    </span>
  );
}

export function FreshnessBadge({ updatedAt, expiresAt, isAvailable, compact = false }: FreshnessBadgeProps) {
  const daysLeft = daysUntilExpiry(expiresAt);
  const stale = isStale(updatedAt, 7);

  if (!isAvailable) {
    return (
      <StatusBadge icon={<AlertCircle size={10} aria-hidden="true" />} className="bg-gray-100 text-gray-500">
        {!compact && 'Unavailable'}
      </StatusBadge>
    );
  }

  if (daysLeft <= 3) {
    return (
      <StatusBadge icon={<Clock size={10} aria-hidden="true" />} className="bg-amber-50 text-amber-600">
        {!compact && `Expires in ${daysLeft}d`}
      </StatusBadge>
    );
  }

  if (stale) {
    return (
      <StatusBadge
        icon={<Clock size={10} aria-hidden="true" />}
        className="bg-gray-50 text-gray-400"
      >
        {compact ? timeAgo(updatedAt) : `Updated ${timeAgo(updatedAt)}`}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      icon={<CheckCircle size={10} aria-hidden="true" />}
      className="bg-green-50 text-green-600"
    >
      {compact ? timeAgo(updatedAt) : `Active · ${timeAgo(updatedAt)}`}
    </StatusBadge>
  );
}
