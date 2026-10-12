import React from 'react';
import { Idea } from '../types';
import { CATEGORY_META } from '../utils/categories';
import { Clock, Heart, MessageSquare, MapPin } from 'lucide-react';

interface TicketCardProps {
  idea: Idea;
  onVote: (id: string) => void;
  onPlan: (idea: Idea) => void;
  onOpenDetails: (idea: Idea) => void;
}

function getVenue(idea: Idea): string {
  const t = idea.title.toLowerCase();
  const d = idea.description.toLowerCase();
  if (t.includes('ramen') || d.includes('ramen')) return 'The Electric Slice · 4th St';
  if (t.includes('hike') || t.includes('ridge')) return 'Eagle Ridge Trailhead';
  if (t.includes('game') || d.includes('catan')) return "Maya's Living Room";
  if (t.includes('movie') || t.includes('park')) return 'Central Park Meadow';
  if (t.includes('kayak') || t.includes('river')) return 'Marshland Boathouse';
  if (t.includes('brunch') || d.includes('café')) return 'The Daily Grind & Bakery';
  if (idea.category === 'food') return 'Local Spot · Downtown';
  if (idea.category === 'outdoor') return 'State Park Trail';
  if (idea.category === 'culture') return 'Arts District · Main Hall';
  if (idea.category === 'adventure') return 'Adventure Outpost';
  return 'Circle Meetup Point';
}

export function TicketCard({ idea, onVote, onPlan, onOpenDetails }: TicketCardProps) {
  const meta = CATEGORY_META[idea.category];
  const commentsCount = idea.comments?.length || 0;
  const venue = getVenue(idea);
  const passCode = `WQ-${idea.id.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase() || '77'}`;

  return (
    <article className="group relative flex flex-col rounded-2xl bg-[#FFFDF7] dark:bg-[#FAF4E6] text-[#16213E] dark:text-[#111827] border border-navy/10 dark:border-[#DFD3B9] shadow-soft dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] hover:shadow-lifted hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      {/* Top / Main Pass Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row: category + time badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.bg} ${meta.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/5 text-[11px] font-bold text-[#111827]/75 tracking-wide uppercase">
              <Clock className="w-3 h-3 text-coral" />
              {idea.time}
            </span>
          </div>

          {/* Title - Bold Uppercase Grotesque */}
          <h3
            onClick={() => onOpenDetails(idea)}
            className="font-display font-extrabold text-xl leading-tight mb-2 text-[#111827] cursor-pointer hover:text-coral transition-colors tracking-tight uppercase"
          >
            {idea.title}
          </h3>

          {/* Description */}
          <p
            onClick={() => onOpenDetails(idea)}
            className="text-xs sm:text-sm text-[#111827]/70 leading-relaxed mb-4 cursor-pointer line-clamp-2"
          >
            {idea.description}
          </p>
        </div>

        {/* Venue chip & Pitcher */}
        <div className="space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 text-xs text-[#111827]/80 font-semibold max-w-full">
            <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
            <span className="truncate">{venue}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#111827]/60">
            <span>
              by <strong className="text-[#111827]/90">{idea.suggestedBy}</strong>
            </span>

            <button
              onClick={() => onOpenDetails(idea)}
              title="Discussion & comments"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-[#111827]/70 hover:bg-black/5 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{commentsCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Perforation seam with physical punch notches */}
      <div className="relative border-t-2 border-dashed border-navy/15 dark:border-[#D5C7AA] my-0">
        {/* Left notch: punches out canvas behind */}
        <div className="absolute -left-2.5 -top-2 w-4 h-4 rounded-full bg-cream dark:bg-[#090B10] border border-navy/10 dark:border-black/30" />
        {/* Right notch: punches out canvas behind */}
        <div className="absolute -right-2.5 -top-2 w-4 h-4 rounded-full bg-cream dark:bg-[#090B10] border border-navy/10 dark:border-black/30" />
      </div>

      {/* Bottom Ticket Stub */}
      <div className="px-5 py-3.5 bg-cream-2/40 dark:bg-[#F2E7CD] flex items-center justify-between gap-3">
        {/* Pass code watermark */}
        <div className="font-mono text-[10px] font-bold tracking-widest text-[#111827]/40 uppercase">
          {passCode}
        </div>

        <div className="flex items-center gap-2">
          {/* Plan Button */}
          <button
            onClick={() => onPlan(idea)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#111827]/70 hover:bg-black/5 transition-colors"
          >
            Plan
          </button>

          {/* Heart Vote Pill */}
          <button
            onClick={() => onVote(idea.id)}
            aria-pressed={idea.votedByMe}
            aria-label={idea.votedByMe ? `Remove vote from ${idea.title}` : `Vote for ${idea.title}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 ${
              idea.votedByMe
                ? 'bg-coral text-white shadow-coral'
                : 'bg-white text-[#111827] hover:bg-coral hover:text-white border border-[#111827]/15'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                idea.votedByMe ? 'fill-white text-white pop' : 'text-coral'
              }`}
            />
            <span>{idea.votes} {idea.votes === 1 ? 'Vote' : 'Votes'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
