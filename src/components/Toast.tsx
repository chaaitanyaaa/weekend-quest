import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 slide-in-right"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-navy dark:bg-white text-cream dark:text-navy shadow-lifted">
        <div className="w-6 h-6 rounded-full bg-lime dark:bg-navy grid place-items-center shrink-0">
          <Check className="w-3.5 h-3.5 text-navy dark:text-lime" />
        </div>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
}
