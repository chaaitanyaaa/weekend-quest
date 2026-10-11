import React from 'react';
import { Member } from '../types';

export interface AvatarProps {
  member?: Partial<Member> | null;
  initials?: string;
  color?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ring?: boolean;
}

export function Avatar({
  member,
  initials: propInitials,
  color: propColor,
  name: propName,
  size = 'md',
  ring = false,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const name = member?.name || propName || 'Member';
  const color = member?.color || propColor || '#FF6A5B';
  const initials =
    member?.initials ||
    propInitials ||
    (name ? name.slice(0, 2).toUpperCase() : '?');

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full grid place-items-center font-bold text-white shrink-0 ${
        ring ? 'ring-2 ring-cream dark:ring-navy-dark' : ''
      }`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

interface AvatarStackProps {
  members?: (Member | null | undefined)[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarStack({ members = [], max = 4, size = 'sm' }: AvatarStackProps) {
  const safeMembers = (members || []).filter((m): m is Member => Boolean(m));
  const shown = safeMembers.slice(0, max);
  const extra = safeMembers.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, idx) => (
        <Avatar key={m.id || idx} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full bg-cream-3 dark:bg-navy-3 text-navy/70 dark:text-cream/70 grid place-items-center text-[10px] font-bold ring-2 ring-cream dark:ring-navy-dark">
          +{extra}
        </div>
      )}
    </div>
  );
}
