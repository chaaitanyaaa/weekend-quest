import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Sparkles, Check, Moon, Sun, HelpCircle } from 'lucide-react';

interface TopBarProps {
  onCreate: () => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onOpenFaq?: () => void;
}

export function TopBar({ onCreate, notifOpen, setNotifOpen, darkMode, setDarkMode, onOpenFaq }: TopBarProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'Maya added “Sunset hike at Eagle Ridge”', time: '2h', color: '#FF6A5B', unread: true },
    { id: 'n2', text: 'Leo voted for the sunset hike', time: '1h', color: '#A8CF2E', unread: true },
    { id: 'n3', text: 'Friday’s quest is confirmed — 4 going', time: '5h', color: '#7BCFB8', unread: true },
  ]);

  const hasUnread = notifications.some((n) => n.unread);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen, setNotifOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 mb-6 flex items-center justify-between gap-3 bg-cream/85 dark:bg-navy-dark/85 backdrop-blur-md border-b border-navy/5 dark:border-white/5 transition-all">
      <div>
        <p className="text-xs text-navy/55 dark:text-cream/55 font-medium hidden sm:block">
          {greeting}, Alex
        </p>
        <p className="font-display font-bold text-lg sm:text-2xl leading-tight dark:text-cream">
          Let’s plan something great.
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Help & FAQ button */}
        {onOpenFaq && (
          <button
            onClick={onOpenFaq}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center hover:bg-cream-2 dark:hover:bg-navy transition-colors shadow-soft text-navy dark:text-cream"
            aria-label="How it works & FAQ"
            title="How it works & FAQ"
          >
            <HelpCircle className="w-5 h-5 text-coral" />
          </button>
        )}
        {/* Dark mode desktop button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="hidden sm:grid w-11 h-11 rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 place-items-center hover:bg-cream-2 dark:hover:bg-navy transition-colors shadow-soft"
          aria-label="Toggle theme"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber" /> : <Moon className="w-5 h-5 text-navy" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative w-11 h-11 rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center hover:bg-cream-2 dark:hover:bg-navy transition-colors shadow-soft"
          >
            <Bell className="w-5 h-5 text-navy dark:text-cream" />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-white dark:ring-navy-card"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-navy-card rounded-2xl shadow-lifted border border-navy/10 dark:border-white/10 p-2 slide-in-right z-40">
              <div className="flex items-center justify-between px-3 py-2 border-b border-navy/5 dark:border-white/5">
                <p className="font-display font-bold text-sm dark:text-cream">Notifications</p>
                {hasUnread && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-coral font-semibold hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
              <ul className="flex flex-col py-1">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-2/70 dark:hover:bg-navy/70 transition-colors ${
                      n.unread ? 'bg-cream-2/30 dark:bg-navy/30' : ''
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: n.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug dark:text-cream/90">{n.text}</p>
                      <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">{n.time} ago</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Create CTA */}
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 sm:px-5 h-11 rounded-2xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create a quest</span>
          <span className="sm:hidden">Quest</span>
        </button>
      </div>
    </header>
  );
}
