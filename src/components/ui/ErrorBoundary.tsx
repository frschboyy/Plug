'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorDisplay({
  message,
  error,
  onAction,
  className,
}: {
  message: string;
  error?: Error | null;
  onAction: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center px-6 text-center', className)}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{message}</p>
      {error && (
        <p className="text-xs text-gray-400 font-mono mb-4 px-4 py-2 bg-gray-50 rounded-lg max-w-xs break-all">
          {error.message}
        </p>
      )}
      <Button onClick={onAction}>
        <RefreshCcw size={15} />
        Try again
      </Button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorDisplay
          className="min-h-[50vh]"
          message="An unexpected error occurred. Your data is safe — tap below to try again."
          error={this.state.error}
          onAction={this.handleReload}
        />
      );
    }
    return this.props.children;
  }
}

// Segment-level error page (Next.js App Router pattern)
export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      className="min-h-[70vh]"
      message={error.message || 'An unexpected error occurred. Please try again.'}
      onAction={reset}
    />
  );
}
