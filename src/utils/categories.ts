import { Category } from '../types';

export const CATEGORY_META: Record<
  Category,
  { label: string; bg: string; text: string; dot: string; emoji: string }
> = {
  food: { label: 'Food', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber', emoji: '🍜' },
  outdoor: { label: 'Outdoor', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-teal', emoji: '🥾' },
  games: { label: 'Games', bg: 'bg-violet-100 dark:bg-violet-950/60', text: 'text-violet-800 dark:text-violet-300', dot: 'bg-plum', emoji: '🎲' },
  culture: { label: 'Culture', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500', emoji: '🎬' },
  adventure: { label: 'Adventure', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-coral', emoji: '🧭' },
};
