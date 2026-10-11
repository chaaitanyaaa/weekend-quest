import React, { useState, useEffect, useRef } from 'react';
import { Group } from '../types';
import { AvatarStack } from './Avatar';
import { ChevronDown, Check, Plus, UserPlus } from 'lucide-react';

interface GroupSelectorProps {
  group?: Group;
  groups: Group[];
  onSelect: (g: Group) => void;
  onCreateGroup?: () => void;
  onInvite?: (g: Group) => void;
}

export function GroupSelector({
  group,
  groups,
  onSelect,
  onCreateGroup,
  onInvite,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!group) {
    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-navy-card rounded-3xl border border-dashed border-coral/30 shadow-soft text-center">
        <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral grid place-items-center mx-auto mb-3 text-2xl">
          🌟
        </div>
        <h3 className="font-display font-bold text-lg dark:text-cream">No circles joined yet</h3>
        <p className="text-sm text-navy/60 dark:text-cream/60 max-w-sm mx-auto mt-1 mb-4">
          Each account only sees their own circles. Start your first group or ask friends to invite you to theirs!
        </p>
        {onCreateGroup && (
          <button
            onClick={onCreateGroup}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark transition-all"
          >
            <Plus className="w-4 h-4" /> Start your first group
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white dark:bg-navy-card rounded-3xl border border-navy/10 dark:border-white/10 shadow-soft hover:shadow-lifted transition-all text-left">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0"
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl grid place-items-center text-3xl shrink-0"
            style={{ backgroundColor: group.accent + '22' }}
          >
            <span aria-hidden="true">{group.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-tight truncate dark:text-cream">
                {group.name}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-lime/40 dark:bg-lime-900/40 text-navy dark:text-lime">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-dark" /> Active
              </span>
            </div>
            <p className="text-sm text-navy/55 dark:text-cream/55 mt-0.5 truncate">
              {group.tagline} · {group.members.length} members
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center">
            <AvatarStack members={group.members} max={4} size="sm" />
          </div>

          {onInvite && (
            <button
              onClick={() => onInvite(group)}
              title="Invite friends to this circle"
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-coral/10 hover:bg-coral text-coral hover:text-white font-bold text-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          <button
            onClick={() => setOpen(!open)}
            aria-label="Switch circle"
            className={`w-10 h-10 rounded-xl bg-cream-2 dark:bg-navy grid place-items-center transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown className="w-5 h-5 text-navy dark:text-cream" />
          </button>
        </div>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 mt-2 bg-white dark:bg-navy-card rounded-2xl shadow-lifted border border-navy/10 dark:border-white/10 p-2 z-20 slide-in-right"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40">
              Your Circles ({groups.length})
            </p>
            {onInvite && (
              <button
                onClick={() => {
                  setOpen(false);
                  onInvite(group);
                }}
                className="text-xs font-bold text-coral hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite to {group.name}
              </button>
            )}
          </div>

          {groups.map((g) => {
            const active = g.id === group.id;
            return (
              <button
                key={g.id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSelect(g);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
                  active ? 'bg-cream-2 dark:bg-navy' : 'hover:bg-cream-2/60 dark:hover:bg-white/5'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center text-xl shrink-0"
                  style={{ backgroundColor: g.accent + '22' }}
                >
                  <span aria-hidden="true">{g.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate dark:text-cream">{g.name}</p>
                  <p className="text-xs text-navy/50 dark:text-cream/50 truncate">
                    {g.members.length} members
                  </p>
                </div>
                {active && <Check className="w-4 h-4 text-coral" />}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-navy/5 dark:border-white/5 flex gap-1 flex-col sm:flex-row">
            {onCreateGroup && (
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateGroup();
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl hover:bg-cream-2/60 dark:hover:bg-white/5 text-xs font-bold text-coral"
              >
                <Plus className="w-3.5 h-3.5" /> Start a new group
              </button>
            )}
            {onInvite && (
              <button
                onClick={() => {
                  setOpen(false);
                  onInvite(group);
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl hover:bg-cream-2/60 dark:hover:bg-white/5 text-xs font-bold text-navy/70 dark:text-cream/70"
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite friends
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
