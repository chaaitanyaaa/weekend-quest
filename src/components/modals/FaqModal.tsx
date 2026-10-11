import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, X, Sparkles, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface FaqModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  emoji: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'f1',
    emoji: '⏰',
    question: 'How does the Thursday 8:00 PM lock-in work?',
    answer: 'Weekend Quest puts an end to endless group chat debates. Throughout the week, everyone pitches ideas and votes. On Thursday at 8:00 PM, the highest-voted quest is locked in as the official plan for the weekend, giving everyone Friday to finalize details!',
  },
  {
    id: 'f2',
    emoji: '🎟️',
    question: 'How do friends join my circle using Join Codes?',
    answer: 'Every circle has a unique 6-character Join Code (or shareable link). Click “Invite” in the circle bar or Groups tab, copy the code, and text it to your group. When they paste it in, they are instantly added to your circle.',
  },
  {
    id: 'f3',
    emoji: '🏆',
    question: 'What happens if two ideas tie for first place?',
    answer: 'If two ideas have equal votes when voting closes, the idea pitched first receives priority, or the circle admin can tap “Lock In Plan” on either idea to choose it as the confirmed quest.',
  },
  {
    id: 'f4',
    emoji: '🍕',
    question: 'How does the shared checklist and expense splitting work?',
    answer: 'Once a quest is confirmed, group members can assign themselves checklist items (e.g. “Bring projector”, “Pick up snacks”). When someone pays for group items, they can log the expense and the app automatically divides the cost per person.',
  },
  {
    id: 'f5',
    emoji: '🔐',
    question: 'Is my account and email information secure?',
    answer: 'Yes! Weekend Quest uses cryptographic SHA-256 password hashing, DNS-level email verification, single-use 6-digit OTP codes with brute-force rate-limiting, and parameterised SQL databases to protect user privacy.',
  },
];

export function FaqModal({ open, onClose, onToast }: FaqModalProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['f1']));
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!open) return null;

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    onToast('Thanks for your feedback! It was sent to the team.');
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="faq-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral/10 dark:bg-coral/20 grid place-items-center text-coral">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="faq-title" className="font-display font-extrabold text-xl dark:text-cream">
                How It Works & FAQ
              </h2>
              <p className="text-xs text-navy/55 dark:text-cream/55">
                Everything you need to know about planning weekend quests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-cream-2 dark:hover:bg-navy grid place-items-center text-navy/60 dark:text-cream/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable FAQ Accordion */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {FAQS.map((faq) => {
            const isOpen = openIds.has(faq.id);
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-navy/10 dark:border-white/10 overflow-hidden bg-cream/40 dark:bg-navy/40 transition-colors"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left font-bold text-sm text-navy dark:text-cream hover:bg-cream-2/60 dark:hover:bg-navy/70 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{faq.emoji}</span>
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-coral shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-navy/40 dark:text-cream/40 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-navy/70 dark:text-cream/70 leading-relaxed border-t border-navy/5 dark:border-white/5 bg-white/50 dark:bg-navy-card/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Feedback Form Section */}
          <div className="mt-6 pt-5 border-t border-navy/10 dark:border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-coral" />
              <h3 className="font-display font-bold text-sm dark:text-cream">
                Have a question or suggestion?
              </h3>
            </div>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-3">
              Drop your thoughts below — we review user feedback constantly!
            </p>

            {feedbackSent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-lime/20 dark:bg-lime/10 text-xs font-bold text-navy dark:text-cream">
                <CheckCircle2 className="w-4 h-4 text-lime" />
                Message received! Thank you for helping improve Weekend Quest.
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="flex gap-2">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you'd like to see next..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-cream-2 dark:bg-navy border border-navy/10 dark:border-white/10 dark:text-cream focus:outline-none focus:ring-2 focus:ring-coral/40"
                />
                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-coral text-cream font-bold text-xs hover:bg-coral-dark disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-coral shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-navy/5 dark:border-white/5 bg-cream-2/40 dark:bg-navy/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy dark:bg-cream text-cream dark:text-navy font-bold text-xs hover:opacity-90 transition-opacity"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
