import React from 'react';
import { ActivityItem } from '../types';
import { Sparkles } from 'lucide-react';

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section
      aria-label="Recent activity"
      className="bg-white dark:bg-navy-card rounded-3xl border border-navy/10 dark:border-white/10 shadow-soft p-5 sm:p-6 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg dark:text-cream">Activity</h3>
        <span className="text-xs font-semibold text-coral">Live updates</span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cream-2 dark:bg-navy grid place-items-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-navy/40 dark:text-cream/40" />
          </div>
          <p className="text-sm text-navy/55 dark:text-cream/55">No activity yet. Make a move!</p>
        </div>
      ) : (
        <ol className="relative">
          {items.map((item, idx) => (
            <li key={item.id} className="flex gap-3 pb-4 last:pb-0 relative">
              {idx < items.length - 1 && (
                <span
                  className="absolute left-[15px] top-9 bottom-0 w-px bg-navy/10 dark:bg-white/10"
                  aria-hidden="true"
                />
              )}
              <div
                className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0 ring-2 ring-white dark:ring-navy-card"
                style={{ backgroundColor: item.userColor }}
              >
                {item.userInitials}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm leading-snug dark:text-cream/90">
                  <span className="font-bold text-navy dark:text-cream">{item.userName}</span>{' '}
                  <span className="text-navy/60 dark:text-cream/60">{item.action}</span>{' '}
                  <span className="font-semibold text-navy/85 dark:text-cream/85">{item.target}</span>
                </p>
                <p className="text-xs text-navy/45 dark:text-cream/45 mt-0.5">{item.time}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
