import React, { useMemo } from 'react';
import { Group, Idea, ActivityItem, UpcomingQuest } from '../types';
import { GroupSelector } from '../components/GroupSelector';
import { IdeaCard } from '../components/IdeaCard';
import { WinningBanner } from '../components/WinningBanner';
import { UpcomingQuestCard } from '../components/UpcomingQuestCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { Lightbulb, Plus } from 'lucide-react';

interface DashboardViewProps {
  group?: Group;
  groups: Group[];
  ideas: Idea[];
  activity: ActivityItem[];
  upcoming: UpcomingQuest;
  onVote: (id: string) => void;
  onPlan: (idea: Idea) => void;
  onOpenDetails: (idea: Idea) => void;
  onSelectGroup: (g: Group) => void;
  onToggleAttending: () => void;
  onUpdateUpcoming: (quest: UpcomingQuest) => void;
  onToast: (msg: string) => void;
  onCreateIdea: () => void;
  onInviteGroup?: (g: Group) => void;
  onCreateGroup?: () => void;
}

export function DashboardView({
  group,
  groups,
  ideas,
  activity,
  upcoming,
  onVote,
  onPlan,
  onOpenDetails,
  onSelectGroup,
  onToggleAttending,
  onUpdateUpcoming,
  onToast,
  onCreateIdea,
  onInviteGroup,
  onCreateGroup,
}: DashboardViewProps) {
  const winningIdea = useMemo(() => {
    if (!ideas.length) return null;
    const sorted = [...ideas].sort((a, b) => b.votes - a.votes);
    return sorted[0].votes > 0 ? sorted[0] : null;
  }, [ideas]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-10 transition-colors">
        <div
          className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-coral/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -left-12 -bottom-16 w-56 h-56 rounded-full bg-lime/30 dark:bg-lime/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-2 dark:bg-navy text-xs font-bold mb-4 dark:text-cream">
            <span className="w-1.5 h-1.5 rounded-full bg-coral" />
            This weekend · Oct 18 – 20
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight dark:text-cream">
            Make this weekend <span className="text-coral">count.</span>
          </h1>
          <p className="text-base sm:text-lg text-navy/65 dark:text-cream/65 mt-4 max-w-lg leading-relaxed">
            Three days, your favorite people, one quest worth remembering. Pitch ideas, vote on
            what sounds fun, and lock the plan before Friday.
          </p>
        </div>
      </section>

      {/* Group selector */}
      <GroupSelector
        group={group}
        groups={groups}
        onSelect={onSelectGroup}
        onCreateGroup={onCreateGroup}
        onInvite={onInviteGroup}
      />

      {/* Ideas Board */}
      <section aria-label="Idea board">
        <div className="flex items-end justify-between mb-4 gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40 mb-1">
              The idea board
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight dark:text-cream">
              What should we do?
            </h2>
            <p className="text-sm text-navy/55 dark:text-cream/55 mt-1">
              Tap the heart to vote, or open an idea to discuss with friends.
            </p>
          </div>
          <button
            onClick={onCreateIdea}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-cream-2 dark:bg-navy hover:bg-cream-3 text-xs font-bold text-navy dark:text-cream transition-colors"
          >
            <Plus className="w-4 h-4 text-coral" /> Add idea
          </button>
        </div>

        {ideas.length === 0 ? (
          <div className="bg-white dark:bg-navy-card rounded-3xl border border-dashed border-navy/15 dark:border-white/15 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cream-2 dark:bg-navy grid place-items-center mx-auto mb-4">
              <Lightbulb className="w-6 h-6 text-navy/40 dark:text-cream/40" />
            </div>
            <h3 className="font-display font-bold text-lg mb-1 dark:text-cream">No ideas yet</h3>
            <p className="text-sm text-navy/55 dark:text-cream/55 mb-4">
              Be the first to suggest something for this weekend.
            </p>
            <button
              onClick={onCreateIdea}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark transition-all"
            >
              <Plus className="w-4 h-4" /> Add the first idea
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onVote={onVote}
                onPlan={onPlan}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}
      </section>

      {/* Winning banner */}
      {winningIdea && <WinningBanner idea={winningIdea} onPlan={onPlan} />}

      {/* Upcoming + activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <UpcomingQuestCard
          quest={upcoming}
          onToggleAttending={onToggleAttending}
          onUpdateQuest={onUpdateUpcoming}
          onToast={onToast}
        />
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
