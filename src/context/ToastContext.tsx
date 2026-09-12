import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Bell, MessageSquare, Heart, X, Sparkles } from 'lucide-react';
import { toastSound } from '../services/toastSound';

export type ToastType = 'notification' | 'success' | 'message' | 'pop' | 'error';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  avatar?: string;
  actionLabel?: string;
  onAction?: () => void;
  playSound?: boolean;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

interface ToastState extends ToastOptions {
  id: string;
  createdAt: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id = opts.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const type = opts.type || 'notification';
      const playSound = opts.playSound !== false;

      // Trigger crisp synthesized toast chime
      if (playSound) {
        toastSound.play(type);
      }

      const newToast: ToastState = {
        ...opts,
        id,
        type,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

      // Auto dismiss
      const duration = opts.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <aside
        aria-label="Notification Toasts"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            role="status"
            className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 transition-all transform translate-y-0 animate-in fade-in slide-in-from-top-3 duration-300"
          >
            {/* Icon or Avatar */}
            {toast.avatar ? (
              <img
                src={toast.avatar}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-cyan-400/40 shrink-0"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : toast.type === 'error'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : toast.type === 'message'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : toast.type === 'pop'
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'message' && <MessageSquare className="w-4 h-4" />}
                {toast.type === 'pop' && <Heart className="w-4 h-4 fill-current" />}
                {toast.type === 'notification' && <Bell className="w-4 h-4" />}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5 mb-0.5">
                  <span>{toast.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </h4>
              )}
              <p className="text-xs text-slate-300 leading-snug break-words">
                {toast.message}
              </p>

              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                  className="mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                >
                  {toast.actionLabel} →
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}
