import React from 'react';
import { Sun, Moon, Plus, Settings, HelpCircle } from 'lucide-react';

interface MobileHeaderProps {
  onCreate: () => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onOpenSettings: () => void;
  onOpenFaq?: () => void;
}

export function MobileHeader({
  onCreate,
  darkMode,
  setDarkMode,
  onOpenSettings,
  onOpenFaq,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-cream/90 dark:bg-navy-dark/90 backdrop-blur-md border-b border-navy/10 dark:border-white/10 transition-colors">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-coral grid place-items-center shadow-coral">
            <Sun className="w-4 h-4 text-cream" />
          </div>
          <span className="font-display font-extrabold text-lg dark:text-cream">Weekend Quest</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenFaq && (
            <button
              onClick={onOpenFaq}
              className="w-10 h-10 rounded-xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center text-coral"
              aria-label="FAQ & How it works"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center text-navy dark:text-cream"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-navy" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center text-navy dark:text-cream"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onCreate}
            className="w-10 h-10 rounded-xl bg-coral text-cream grid place-items-center shadow-coral hover:bg-coral-dark active:scale-95 transition-all"
            aria-label="Create a quest"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
