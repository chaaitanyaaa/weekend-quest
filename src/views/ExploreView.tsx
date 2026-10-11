import React, { useState } from 'react';
import { Idea, Category } from '../types';
import { CATEGORY_META } from '../utils/categories';
import { Search, Clock, Heart, Bookmark, Plus, Check } from 'lucide-react';

interface ExploreViewProps {
  ideas: Idea[];
  onSave: (idea: Idea) => void;
  onAdoptToGroup: (idea: Idea) => void;
}

export function ExploreView({ ideas, onSave, onAdoptToGroup }: ExploreViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = ideas.filter((i) => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (
      query &&
      !`${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleSave = (idea: Idea) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(idea.id)) {
        next.delete(idea.id);
      } else {
        next.add(idea.id);
        onSave(idea);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 transition-colors">
        <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40 mb-1">
          Discover
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight dark:text-cream">
          Explore quests
        </h1>
        <p className="text-navy/60 dark:text-cream/60 mt-2 max-w-md">
          Trending ideas from the wider Weekend Quest community. Save anything or bring it
          straight to your crew.
        </p>

        {/* Search & Categories */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or keyword..."
              aria-label="Search ideas"
              className="w-full pl-10 pr-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white dark:focus:bg-navy-card focus:outline-none text-sm font-medium text-navy dark:text-cream placeholder:text-navy/40 dark:placeholder:text-cream/40 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`px-3.5 h-12 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-navy dark:bg-white text-cream dark:text-navy'
                  : 'bg-white dark:bg-navy border border-navy/10 dark:border-white/10 text-navy/70 dark:text-cream/70 hover:bg-cream-2'
              }`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
              const m = CATEGORY_META[c];
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  aria-pressed={filter === c}
                  className={`inline-flex items-center gap-1.5 px-3.5 h-12 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    filter === c
                      ? 'bg-navy dark:bg-white text-cream dark:text-navy'
                      : 'bg-white dark:bg-navy border border-navy/10 dark:border-white/10 text-navy/70 dark:text-cream/70 hover:bg-cream-2'
                  }`}
                >
                  <span aria-hidden="true">{m.emoji}</span> {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-navy-card rounded-3xl border border-dashed border-navy/15 dark:border-white/15 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cream-2 dark:bg-navy grid place-items-center mx-auto mb-4">
            <Search className="w-6 h-6 text-navy/40 dark:text-cream/40" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1 dark:text-cream">No quests match</h3>
          <p className="text-sm text-navy/55 dark:text-cream/55 mb-4">
            Try a different category or search term.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-cream-2 dark:bg-navy text-navy dark:text-cream font-bold text-sm hover:bg-cream-3 transition-all"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => {
            const meta = CATEGORY_META[idea.category];
            const isSaved = saved.has(idea.id);
            return (
              <article
                key={idea.id}
                className="bg-white dark:bg-navy-card rounded-3xl p-5 border border-navy/5 dark:border-white/5 shadow-soft hover:shadow-lifted hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
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

                <h3 className="font-display font-bold text-lg leading-tight mb-1.5 dark:text-cream">
                  {idea.title}
                </h3>
                <p className="text-sm text-navy/60 dark:text-cream/60 leading-relaxed mb-4 flex-1">
                  {idea.description}
                </p>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-navy/5 dark:border-white/5">
                  <span className="inline-flex items-center gap-1 text-xs text-navy/60 dark:text-cream/60 font-semibold">
                    <Heart className="w-3.5 h-3.5" /> {idea.votes} fans
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAdoptToGroup(idea)}
                      title="Bring to your circle's board"
                      className="inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-bold bg-cream-2 dark:bg-navy text-navy dark:text-cream hover:bg-cream-3 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-coral" /> Adopt
                    </button>

                    <button
                      onClick={() => toggleSave(idea)}
                      aria-pressed={isSaved}
                      className={`inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isSaved
                          ? 'bg-lime text-navy'
                          : 'bg-cream-2 dark:bg-navy text-navy dark:text-cream hover:bg-cream-3'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-navy' : ''}`} />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
