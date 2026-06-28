'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { type Toast, type ToastType } from '@/lib/types';
import { uid } from '@/lib/utils';

// ============================================================
// Context
// ============================================================
interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ============================================================
// Individual Toast item
// ============================================================
const ICONS: Record<ToastType, React.ComponentType<{ size: number; className?: string }>> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration ?? 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.duration, onDismiss]);

  const Icon = ICONS[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95',
        STYLES[toast.type],
      ].join(' ')}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`} />
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity press-scale"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// Provider + portal
// ============================================================
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = uid();
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  const ctx: ToastContextValue = {
    toast:   addToast,
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error', 4000),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted && createPortal(
        <div
          aria-label="Notifications"
          className="fixed bottom-[5.5rem] left-0 right-0 z-[60] flex flex-col gap-2 px-4 pointer-events-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
