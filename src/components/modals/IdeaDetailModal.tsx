import React, { useState } from 'react';
import { Modal } from './Modal';
import { Idea, Comment, Member } from '../../types';
import { CATEGORY_META } from '../../utils/categories';
import { Avatar } from '../Avatar';
import { Clock, Heart, Send, MessageSquare } from 'lucide-react';

interface IdeaDetailModalProps {
  idea: Idea | null;
  onClose: () => void;
  onVote: (id: string) => void;
  onPlan: (idea: Idea) => void;
  onAddComment: (ideaId: string, text: string) => void;
  currentUser: Member;
}

export function IdeaDetailModal({
  idea,
  onClose,
  onVote,
  onPlan,
  onAddComment,
  currentUser,
}: IdeaDetailModalProps) {
  const [commentText, setCommentText] = useState('');

  if (!idea) return null;
  const meta = CATEGORY_META[idea.category];
  const comments = idea.comments || [];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(idea.id, commentText.trim());
    setCommentText('');
  };

  return (
    <Modal
      open={!!idea}
      onClose={onClose}
      title={idea.title}
      subtitle={`Suggested by ${idea.suggestedBy}`}
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <button
            onClick={() => onVote(idea.id)}
            className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              idea.votedByMe
                ? 'bg-coral text-cream shadow-coral'
                : 'bg-cream-2 dark:bg-navy text-navy dark:text-cream hover:bg-cream-3'
            }`}
          >
            <Heart className={`w-4 h-4 ${idea.votedByMe ? 'fill-cream' : ''}`} />
            {idea.votes} votes
          </button>

          <button
            onClick={() => {
              onClose();
              onPlan(idea);
            }}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-navy dark:bg-white text-cream dark:text-navy font-bold text-sm shadow-lifted hover:bg-navy-2 dark:hover:bg-cream-2 active:scale-95 transition-all"
          >
            Plan this quest
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Category & Time */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-navy/50 dark:text-cream/50 font-medium">
            <Clock className="w-3.5 h-3.5" /> {idea.time}
          </span>
        </div>

        {/* Description */}
        <p className="text-base text-navy/80 dark:text-cream/80 leading-relaxed bg-cream-2/40 dark:bg-navy/30 p-4 rounded-2xl border border-navy/5 dark:border-white/5">
          {idea.description}
        </p>

        {/* Comment Thread */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-coral" />
            <h4 className="font-display font-bold text-base dark:text-cream">
              Discussion ({comments.length})
            </h4>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-navy/50 dark:text-cream/50 italic py-2">
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-white dark:bg-navy border border-navy/10 dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar member={c.author} size="xs" />
                      <span className="text-xs font-bold dark:text-cream">{c.author.name}</span>
                    </div>
                    <span className="text-[10px] text-navy/40 dark:text-cream/40">{c.createdAt}</span>
                  </div>
                  <p className="text-xs text-navy/70 dark:text-cream/70 pl-7">{c.text}</p>
                </div>
              ))
            )}
          </div>

          {/* New comment input */}
          <form onSubmit={handleSendComment} className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add your thoughts or tips..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-4 h-11 rounded-xl bg-white dark:bg-navy border border-navy/15 dark:border-white/15 text-xs font-medium text-navy dark:text-cream placeholder:text-navy/35 dark:placeholder:text-cream/35 focus:border-coral focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-xl bg-coral text-cream grid place-items-center hover:bg-coral-dark active:scale-95 transition-all shadow-coral"
              title="Post comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
