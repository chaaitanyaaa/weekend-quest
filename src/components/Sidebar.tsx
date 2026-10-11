import React from 'react';
import { ViewId, Member } from '../types';
import { Avatar } from './Avatar';
import { Sun, Moon, Home, Users, Compass, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  currentUser: Member;
  onSignOut: () => void;
}

export function Sidebar({
  view,
  setView,
  darkMode,
  setDarkMode,
  currentUser,
  onSignOut,
}: SidebarProps) {
  const items: { id: ViewId; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'groups', label: 'My groups', icon: Users },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-cream dark:bg-navy-card border-r border-navy/10 dark:border-white/10 px-5 py-7 z-30 transition-colors">
      {/* Brand */}
      <div
        onClick={() => setView('dashboard')}
        className="flex items-center gap-3 mb-10 px-2 cursor-pointer group"
      >
        <div className="w-11 h-11 rounded-2xl bg-coral grid place-items-center shadow-coral group-hover:scale-105 transition-transform">
          <Sun className="w-5 h-5 text-cream" />
        </div>
        <div className="leading-none">
          <p className="font-display font-extrabold text-[19px] dark:text-cream">Weekend</p>
          <p className="font-display font-extrabold text-[19px] text-coral -mt-0.5">Quest</p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Main" className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40 px-3 mb-1">
          Menu
        </p>
        {items.map((item) => {
          const active = view === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[15px] font-semibold transition-all ${
                active
                  ? 'bg-navy dark:bg-white text-cream dark:text-navy shadow-soft'
                  : 'text-navy/70 dark:text-cream/70 hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy dark:hover:text-cream'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 transition-transform ${active ? '' : 'group-hover:scale-110'}`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Tip */}
      <div className="mt-8 px-2">
        <div className="rounded-2xl bg-lime/40 dark:bg-lime-900/30 border border-lime-dark/30 p-4">
          <p className="font-display font-bold text-sm mb-1 text-navy dark:text-lime">Weekend tip</p>
          <p className="text-xs text-navy/75 dark:text-cream/75 leading-relaxed">
            Lock plans by Thursday night — Saturday mornings are for adventures, not group chats.
          </p>
        </div>
      </div>

      {/* Theme quick switch */}
      <div className="mt-4 px-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/70 dark:bg-navy/50 border border-navy/10 dark:border-white/10 hover:bg-white dark:hover:bg-navy transition-colors text-xs font-bold text-navy/80 dark:text-cream/80"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-plum" /> : <Sun className="w-4 h-4 text-amber" />}
            {darkMode ? 'Dark theme' : 'Light theme'}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy/10 dark:bg-white/10">
            {darkMode ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>

      {/* User profile footer - opens settings or signs out */}
      <div className="mt-auto pt-4 border-t border-navy/10 dark:border-white/10 flex items-center gap-2">
        <button
          onClick={() => setView('settings')}
          className={`flex-1 flex items-center gap-2.5 p-2 rounded-2xl transition-colors text-left ${
            view === 'settings'
              ? 'bg-navy/10 dark:bg-white/10 ring-1 ring-coral/30'
              : 'hover:bg-navy/5 dark:hover:bg-white/5'
          }`}
          title="Open Profile Settings"
        >
          <Avatar member={currentUser} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate dark:text-cream">{currentUser.name}</p>
            <p className="text-[11px] text-navy/50 dark:text-cream/50 truncate">
              {currentUser.email || 'Settings'}
            </p>
          </div>
        </button>

        <button
          onClick={onSignOut}
          title="Sign Out"
          className="w-9 h-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-navy/40 hover:text-coral transition-colors grid place-items-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
