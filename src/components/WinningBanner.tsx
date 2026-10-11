import React from 'react';
import { Idea } from '../types';
import { CATEGORY_META } from '../utils/categories';
import { Trophy, Clock, Heart, Users, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinningBannerProps {
  idea: Idea | null;
  onPlan: (idea: Idea) => void;
}

export function WinningBanner({ idea, onPlan }: WinningBannerProps) {
  if (!idea) return null;
  const meta = CATEGORY_META[idea.category];

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FF6A5B', '#C6E84C', '#7BCFB8', '#FFB547'],
    });
    onPlan(idea);
  };

  return (
    <section
      aria-label="Top voted quest"
      className="relative overflow-hidden rounded-2xl bg-lime dark:bg-lime-950/60 border border-lime-dark/30 p-6 sm:p-8 shadow-lime transition-all"
    >
      <div
        className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-lime-dark/20 dark:bg-lime/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute right-6 top-6 hidden sm:block floaty" aria-hidden="true">
        <span className="text-5xl">{meta.emoji}</span>
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy dark:bg-lime text-cream dark:text-navy text-xs font-bold mb-4 shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
          Top voted this week
        </div>

        <h3 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mb-2 max-w-xl text-navy dark:text-cream">
          {idea.title}
        </h3>
        <p className="text-navy/70 dark:text-cream/80 text-base max-w-lg mb-5">
          {idea.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-navy dark:text-cream/90">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="w-4 h-4" /> {idea.time}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Heart className="w-4 h-4 fill-coral text-coral" /> {idea.votes} votes
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Users className="w-4 h-4" /> by {idea.suggestedBy}
          </span>
        </div>

        <button
          onClick={handleCelebrate}
          className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl bg-navy dark:bg-cream text-cream dark:text-navy font-bold text-sm shadow-lifted hover:bg-navy-2 dark:hover:bg-cream-2 active:scale-95 transition-all"
        >
          <span>Plan this quest</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
