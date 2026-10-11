import React from 'react';
import { Idea } from '../types';
import { CATEGORY_META } from '../utils/categories';
import { Clock, Heart, MessageSquare } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onVote: (id: string) => void;
  onPlan: (idea: Idea) => void;
  onOpenDetails: (idea: Idea) => void;
}

export function IdeaCard({ idea, onVote, onPlan, onOpenDetails }: IdeaCardProps) {
  const meta = CATEGORY_META[idea.category];
  const commentsCount = idea.comments?.length || 0;

  return (
    <article className="group bg-white dark:bg-navy-card rounded-3xl p-5 border border-navy/5 dark:border-white/5 shadow-soft hover:shadow-lifted hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.bg} ${meta.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-navy/50 dark:text-cream/50 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {idea.time}
        </span>
      </div>

      <h3
        onClick={() => onOpenDetails(idea)}
        className="font-display font-bold text-lg leading-tight mb-1.5 dark:text-cream cursor-pointer hover:text-coral transition-colors"
      >
        {idea.title}
      </h3>

      <p
        onClick={() => onOpenDetails(idea)}
        className="text-sm text-navy/60 dark:text-cream/60 leading-relaxed mb-4 flex-1 cursor-pointer line-clamp-3"
      >
        {idea.description}
      </p>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-navy/5 dark:border-white/5">
        <span className="text-xs text-navy/50 dark:text-cream/50">
          by <span className="font-semibold text-navy/80 dark:text-cream/80">{idea.suggestedBy}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Discussion comment trigger */}
          <button
            onClick={() => onOpenDetails(idea)}
            title="Discussion & comments"
            className="inline-flex items-center gap-1 px-2.5 h-9 rounded-xl text-xs font-semibold text-navy/60 dark:text-cream/60 hover:bg-cream-2 dark:hover:bg-navy transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentsCount}</span>
          </button>

          {/* Plan quest button */}
          <button
            onClick={() => onPlan(idea)}
            className="px-3 h-9 rounded-xl text-xs font-bold text-navy/70 dark:text-cream/70 hover:bg-cream-2 dark:hover:bg-navy transition-colors"
          >
            Plan
          </button>

          {/* Heart Vote button */}
          <button
            onClick={() => onVote(idea.id)}
            aria-pressed={idea.votedByMe}
            aria-label={idea.votedByMe ? `Remove vote from ${idea.title}` : `Vote for ${idea.title}`}
            className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              idea.votedByMe
                ? 'bg-coral text-cream shadow-coral'
                : 'bg-cream-2 dark:bg-navy text-navy dark:text-cream hover:bg-cream-3 dark:hover:bg-navy-2'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                idea.votedByMe ? 'fill-cream text-cream pop' : ''
              }`}
            />
            {idea.votes}
          </button>
        </div>
      </div>
    </article>
  );
}
