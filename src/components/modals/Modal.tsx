import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, subtitle, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input, textarea, button, select');
      el?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-navy/50 dark:bg-black/60 backdrop-blur-sm modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className="relative bg-cream dark:bg-navy-card w-full max-w-md sm:max-w-lg rounded-2xl shadow-lifted modal-content max-h-[90dvh] flex flex-col border border-navy/10 dark:border-white/10 my-auto"
      >
        <header className="flex items-start justify-between p-5 sm:p-6 border-b border-navy/10 dark:border-white/10">
          <div>
            <h2 className="font-display font-extrabold text-2xl leading-tight dark:text-cream">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-navy/55 dark:text-cream/55 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-1 rounded-xl hover:bg-navy/5 dark:hover:bg-white/5 transition-colors text-navy dark:text-cream"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <footer className="p-5 sm:p-6 border-t border-navy/10 dark:border-white/10 bg-white/40 dark:bg-navy/40">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
