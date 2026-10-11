import React from 'react';
import { ViewId } from '../types';
import { Home, Users, Compass, Settings } from 'lucide-react';

interface BottomNavProps {
  view: ViewId;
  setView: (v: ViewId) => void;
}

export function BottomNav({ view, setView }: BottomNavProps) {
  const items: { id: ViewId; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-cream/95 dark:bg-navy-dark/95 backdrop-blur-md border-t border-navy/10 dark:border-white/10"
    >
      <div className="flex items-stretch justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = view === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? 'text-coral' : 'text-navy/55 dark:text-cream/55'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
