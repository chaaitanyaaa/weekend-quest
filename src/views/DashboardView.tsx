import React, { useMemo, useState } from 'react';
import { Group, Idea, ActivityItem, UpcomingQuest } from '../types';
import { GroupSelector } from '../components/GroupSelector';
import { IdeaCard } from '../components/IdeaCard';
import { TicketCard } from '../components/TicketCard';
import { CircleDuelPoll } from '../components/CircleDuelPoll';
import { WinningBanner } from '../components/WinningBanner';
import { UpcomingQuestCard } from '../components/UpcomingQuestCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { Lightbulb, Plus, Ticket, LayoutGrid, Calendar, Sparkles } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [boardLayout, setBoardLayout] = useState<'timeline' | 'grid'>('timeline');

  const winningIdea = useMemo(() => {
    if (!ideas.length) return null;
    const sorted = [...ideas].sort((a, b) => b.votes - a.votes);
    return sorted[0].votes > 0 ? sorted[0] : null;
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.category.toLowerCase().includes(q) ||
        (idea.suggestedBy && idea.suggestedBy.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'all' ||
        idea.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [ideas, searchQuery, selectedCategory]);

  // Group into Friday, Saturday, and Sunday for the Tactile Timeline
  const fridayIdeas = useMemo(
    () => filteredIdeas.filter((i) => (i.time || '').toLowerCase().includes('fri')),
    [filteredIdeas]
  );
  const sundayIdeas = useMemo(
    () => filteredIdeas.filter((i) => (i.time || '').toLowerCase().includes('sun')),
    [filteredIdeas]
  );
  const saturdayIdeas = useMemo(
    () =>
      filteredIdeas.filter(
        (i) =>
          !fridayIdeas.some((f) => f.id === i.id) && !sundayIdeas.some((s) => s.id === i.id)
      ),
    [filteredIdeas, fridayIdeas, sundayIdeas]
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#131622] border border-navy/10 dark:border-white/[0.08] shadow-soft p-6 sm:p-8 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-2 dark:bg-[#1A1F2E] text-xs font-bold text-navy dark:text-cream">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                This weekend · Oct 18 – 20
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Thursday 6:00 PM Lock
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-[1.08] tracking-tight text-navy dark:text-[#F8FAFC]">
              Make this weekend <span className="text-coral">count.</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/65 dark:text-[#94A3B8] mt-2 max-w-lg leading-relaxed">
              Three days, your favorite circle, one quest worth remembering. Pitch ticket passes, vote on the board, and lock the top quest before Friday.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onCreateIdea}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-white hover:bg-coral-dark text-xs sm:text-sm font-bold shadow-coral transition-all"
            >
              <Plus className="w-4 h-4" /> Pitch Pass
            </button>
          </div>
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
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight dark:text-cream">
              Weekend Quest Board
            </h2>
            <p className="text-sm text-navy/55 dark:text-cream/55 mt-1">
              Tap the heart on any ticket pass to vote, or chat with friends on the rail.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Board Layout Switcher */}
            <div className="flex items-center gap-1 p-1 bg-cream-2 dark:bg-navy rounded-xl border border-navy/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setBoardLayout('timeline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  boardLayout === 'timeline'
                    ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                    : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
                }`}
                title="Tactile 3-Day Timeline View"
              >
                <Ticket className="w-3.5 h-3.5 text-coral" />
                <span>Ticket Board</span>
              </button>
              <button
                type="button"
                onClick={() => setBoardLayout('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  boardLayout === 'grid'
                    ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                    : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
                }`}
                title="Standard Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-teal" />
                <span>Grid</span>
              </button>
            </div>

            <button
              onClick={onCreateIdea}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-coral text-white hover:bg-coral-dark text-xs font-bold shadow-coral transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Pitch Idea
            </button>
          </div>
        </div>

        {/* Instant Search & Filter Bar */}
        {ideas.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quest passes by title, venue, category, or friend..."
                  className="w-full pl-4 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 dark:text-cream focus:outline-none focus:ring-2 focus:ring-coral/40 shadow-soft"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-cream-2 dark:hover:bg-navy text-navy/40 dark:text-cream/40"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'food', label: '🍕 Food' },
                  { id: 'outdoor', label: '🌲 Outdoor' },
                  { id: 'games', label: '🎲 Games' },
                  { id: 'culture', label: '🎨 Culture' },
                  { id: 'adventure', label: '⚡ Adventure' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-navy dark:bg-white text-cream dark:text-navy shadow-sm'
                        : 'bg-white dark:bg-navy-card text-navy/70 dark:text-cream/70 hover:bg-cream-2 dark:hover:bg-navy border border-navy/5 dark:border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {(searchQuery || selectedCategory !== 'all') && (
              <div className="flex items-center justify-between text-xs text-navy/55 dark:text-cream/55 px-1">
                <span>
                  Showing {filteredIdeas.length} of {ideas.length} passes
                  {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-coral hover:underline font-semibold"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        )}

        {ideas.length === 0 ? (
          <div className="bg-white dark:bg-navy-card rounded-2xl border border-dashed border-navy/15 dark:border-white/15 p-12 text-center shadow-soft">
            <div className="w-14 h-14 rounded-2xl bg-cream-2 dark:bg-navy grid place-items-center mx-auto mb-4">
              <Lightbulb className="w-6 h-6 text-navy/40 dark:text-cream/40" />
            </div>
            <h3 className="font-display font-bold text-lg mb-1 dark:text-cream">No quest passes yet</h3>
            <p className="text-sm text-navy/55 dark:text-cream/55 mb-4 max-w-sm mx-auto">
              Be the first to pitch a ticket pass for this weekend's circle.
            </p>
            <button
              onClick={onCreateIdea}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark transition-all"
            >
              <Plus className="w-4 h-4" /> Pitch the first quest
            </button>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="bg-white dark:bg-navy-card rounded-2xl border border-dashed border-navy/15 dark:border-white/15 p-8 text-center">
            <h3 className="font-display font-bold text-base mb-1 dark:text-cream">No matching quests found</h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-3">
              No ideas matched your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-cream-2 dark:bg-navy hover:bg-coral hover:text-white text-xs font-bold transition-all"
            >
              Clear search & filters
            </button>
          </div>
        ) : boardLayout === 'timeline' ? (
          /* Tactile Ticket Timeline Layout + Sidecar */
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* 3-Day Columns */}
            <div className="lg:col-span-8 space-y-7">
              {/* Friday Column */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-navy/10 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-coral ring-4 ring-coral/20" />
                    <h3 className="font-display font-extrabold text-base sm:text-lg dark:text-cream uppercase tracking-wide">
                      Friday Night · Oct 18
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/60 dark:text-cream/60">
                    {fridayIdeas.length} {fridayIdeas.length === 1 ? 'pass' : 'passes'}
                  </span>
                </div>

                {fridayIdeas.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {fridayIdeas.map((idea) => (
                      <TicketCard
                        key={idea.id}
                        idea={idea}
                        onVote={onVote}
                        onPlan={onPlan}
                        onOpenDetails={onOpenDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={onCreateIdea}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-navy/15 dark:border-white/15 bg-white/40 dark:bg-navy-card/40 hover:border-coral/40 hover:bg-cream-2/60 dark:hover:bg-navy text-xs font-bold text-navy/60 dark:text-cream/60 flex items-center justify-center gap-2 transition-all group"
                  >
                    <Plus className="w-4 h-4 text-coral group-hover:scale-110 transition-transform" />
                    <span>Pitch a Friday night kickoff quest</span>
                  </button>
                )}
              </section>

              {/* Saturday Column */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-navy/10 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-dark ring-4 ring-lime-dark/20" />
                    <h3 className="font-display font-extrabold text-base sm:text-lg dark:text-cream uppercase tracking-wide">
                      Saturday · Oct 19
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/60 dark:text-cream/60">
                    {saturdayIdeas.length} {saturdayIdeas.length === 1 ? 'pass' : 'passes'}
                  </span>
                </div>

                {saturdayIdeas.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {saturdayIdeas.map((idea) => (
                      <TicketCard
                        key={idea.id}
                        idea={idea}
                        onVote={onVote}
                        onPlan={onPlan}
                        onOpenDetails={onOpenDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={onCreateIdea}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-navy/15 dark:border-white/15 bg-white/40 dark:bg-navy-card/40 hover:border-lime-dark/40 hover:bg-cream-2/60 dark:hover:bg-navy text-xs font-bold text-navy/60 dark:text-cream/60 flex items-center justify-center gap-2 transition-all group"
                  >
                    <Plus className="w-4 h-4 text-lime-dark group-hover:scale-110 transition-transform" />
                    <span>Pitch a Saturday adventure quest</span>
                  </button>
                )}
              </section>

              {/* Sunday Column */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-navy/10 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal ring-4 ring-teal/20" />
                    <h3 className="font-display font-extrabold text-base sm:text-lg dark:text-cream uppercase tracking-wide">
                      Sunday Chill · Oct 20
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/60 dark:text-cream/60">
                    {sundayIdeas.length} {sundayIdeas.length === 1 ? 'pass' : 'passes'}
                  </span>
                </div>

                {sundayIdeas.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {sundayIdeas.map((idea) => (
                      <TicketCard
                        key={idea.id}
                        idea={idea}
                        onVote={onVote}
                        onPlan={onPlan}
                        onOpenDetails={onOpenDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={onCreateIdea}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-navy/15 dark:border-white/15 bg-white/40 dark:bg-navy-card/40 hover:border-teal/40 hover:bg-cream-2/60 dark:hover:bg-navy text-xs font-bold text-navy/60 dark:text-cream/60 flex items-center justify-center gap-2 transition-all group"
                  >
                    <Plus className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
                    <span>Pitch a Sunday recovery or brunch quest</span>
                  </button>
                )}
              </section>
            </div>

            {/* Right: Duel & Banter Sidecar */}
            <div className="lg:col-span-4 sticky top-24">
              <CircleDuelPoll
                ideas={ideas}
                onVote={onVote}
                onOpenDetails={onOpenDetails}
                onToast={onToast}
              />
            </div>
          </div>
        ) : (
          /* Grid View with Ticket Cards */
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredIdeas.map((idea) => (
              <TicketCard
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
