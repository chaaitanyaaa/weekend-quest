import React, { useState } from 'react';
import { Idea } from '../types';
import { Flame, MessageCircle, Send, Trophy, Sparkles } from 'lucide-react';

interface CircleDuelPollProps {
  ideas: Idea[];
  onVote: (id: string) => void;
  onOpenDetails: (idea: Idea) => void;
  onToast: (msg: string) => void;
}

export function CircleDuelPoll({ ideas, onVote, onOpenDetails, onToast }: CircleDuelPollProps) {
  // Sort top 2 ideas by votes
  const sorted = [...ideas].sort((a, b) => b.votes - a.votes);
  const topA = sorted[0];
  const topB = sorted[1];

  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 'm1', author: 'Lukas', text: 'Sunset hike looks super sick!', time: '20m ago' },
    { id: 'm2', author: 'Maya', text: 'I am totally down for ramen too.', time: '12m ago' },
    { id: 'm3', author: 'Leo', text: 'Flashlights packed for Eagle Ridge.', time: 'Just now' },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        author: 'You',
        text: chatMessage.trim(),
        time: 'Just now',
      },
    ]);
    setChatMessage('');
    onToast('Message sent to circle!');
  };

  const totalDuelVotes = (topA?.votes || 0) + (topB?.votes || 0);
  const percentA = totalDuelVotes > 0 ? Math.round(((topA?.votes || 0) / totalDuelVotes) * 100) : 50;
  const percentB = 100 - percentA;

  return (
    <div className="bg-white dark:bg-[#131622] rounded-2xl border border-navy/10 dark:border-white/[0.08] p-5 shadow-soft flex flex-col gap-6">
      {/* Duel Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-coral">
            <Flame className="w-4 h-4 fill-coral" />
            <span>Head-to-Head Duel</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/60 dark:text-cream/60">
            Thursday Lock
          </span>
        </div>

        <p className="text-xs text-navy/60 dark:text-cream/60 mb-3 font-medium">
          Top 2 quests competing for this weekend's locked slot:
        </p>

        {topA && topB ? (
          <div className="space-y-3">
            {/* Duel Progress Bar */}
            <div className="h-2 rounded-full overflow-hidden flex bg-navy/10 dark:bg-white/10">
              <div
                className="bg-coral transition-all duration-500 ease-out"
                style={{ width: `${percentA}%` }}
              />
              <div
                className="bg-lime-dark transition-all duration-500 ease-out"
                style={{ width: `${percentB}%` }}
              />
            </div>

            {/* Candidate A */}
            <div
              onClick={() => onVote(topA.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                topA.votedByMe
                  ? 'border-coral bg-coral/10'
                  : 'border-navy/10 dark:border-white/10 hover:border-coral/50 bg-cream-2/30 dark:bg-navy/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-xs sm:text-sm text-navy dark:text-cream truncate">
                  {topA.title}
                </p>
                <p className="text-[11px] text-navy/50 dark:text-cream/50 mt-0.5">
                  {topA.votes} {topA.votes === 1 ? 'vote' : 'votes'} · {percentA}%
                </p>
              </div>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  topA.votedByMe ? 'bg-coral text-white' : 'bg-cream-2 dark:bg-navy text-coral'
                }`}
              >
                {topA.votedByMe ? 'Voted' : 'Vote'}
              </button>
            </div>

            {/* Candidate B */}
            <div
              onClick={() => onVote(topB.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                topB.votedByMe
                  ? 'border-lime-dark bg-lime/15'
                  : 'border-navy/10 dark:border-white/10 hover:border-lime-dark/50 bg-cream-2/30 dark:bg-navy/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-xs sm:text-sm text-navy dark:text-cream truncate">
                  {topB.title}
                </p>
                <p className="text-[11px] text-navy/50 dark:text-cream/50 mt-0.5">
                  {topB.votes} {topB.votes === 1 ? 'vote' : 'votes'} · {percentB}%
                </p>
              </div>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  topB.votedByMe ? 'bg-lime-dark text-white' : 'bg-cream-2 dark:bg-navy text-lime-dark'
                }`}
              >
                {topB.votedByMe ? 'Voted' : 'Vote'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-navy/15 dark:border-white/15 text-center text-xs text-navy/50 dark:text-cream/50">
            Pitch at least 2 ideas to start the head-to-head vote duel!
          </div>
        )}
      </div>

      {/* Circle Chat Rail */}
      <div className="pt-4 border-t border-navy/10 dark:border-white/10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-navy/70 dark:text-cream/70 mb-3">
            <MessageCircle className="w-4 h-4 text-teal" />
            <span>Circle Banter</span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-cream-2/40 dark:bg-navy/40 border border-navy/5 dark:border-white/5"
              >
                <div className="flex items-center justify-between font-bold mb-0.5">
                  <span className="text-navy dark:text-cream">{m.author}</span>
                  <span className="text-[10px] text-navy/40 dark:text-cream/40 font-normal">
                    {m.time}
                  </span>
                </div>
                <p className="text-navy/70 dark:text-cream/70 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat input */}
        <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Say something to crew..."
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-cream-2/50 dark:bg-navy/50 border border-navy/10 dark:border-white/10 text-navy dark:text-cream focus:outline-none focus:border-coral"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-coral text-white hover:bg-coral-dark transition-colors shrink-0"
            title="Send chat message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
