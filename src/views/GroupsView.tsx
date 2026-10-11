import React, { useState } from 'react';
import { Group, Member } from '../types';
import { AvatarStack } from '../components/Avatar';
import { Plus, ArrowRight, UserPlus, Shield, KeyRound, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { Modal } from '../components/modals/Modal';
import { joinGroupByCode } from '../utils/auth';
import confetti from 'canvas-confetti';

interface GroupsViewProps {
  groups: Group[];
  activeGroup?: Group;
  currentUser: Member;
  onSelect: (g: Group) => void;
  onAddGroup: (newGroup: Group) => void;
  onInvite?: (g: Group) => void;
  onReloadGroups?: () => void;
  onToast: (msg: string) => void;
}

export function GroupsView({
  groups,
  activeGroup,
  currentUser,
  onSelect,
  onAddGroup,
  onInvite,
  onReloadGroups,
  onToast,
}: GroupsViewProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [emoji, setEmoji] = useState('🌟');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onToast(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyInviteLink = (code: string) => {
    const link = `${window.location.origin}${window.location.pathname}?join=${code}`;
    navigator.clipboard.writeText(link);
    onToast(`Copied invite link: ${link}`);
  };

  const handleJoinByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim()) return;

    setJoinLoading(true);
    try {
      const res = await joinGroupByCode(joinCodeInput.trim(), currentUser.id);
      if (res.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        onToast(res.alreadyMember ? `You're already in ${res.groupName}!` : `Joined ${res.groupName}! 🎉`);
        setJoinModalOpen(false);
        setJoinCodeInput('');
        onReloadGroups?.();
      } else {
        setJoinError(res.error || 'Invalid join code. Please check spelling.');
      }
    } catch (err: any) {
      setJoinError('Failed to join circle. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || 'Weekend circle',
      emoji: emoji || '🌟',
      members: [currentUser],
      accent: '#FF6A5B',
      createdBy: currentUser.id,
    };

    onAddGroup(newGroup);
    onSelect(newGroup);
    setCreateModalOpen(false);
    setName('');
    setTagline('');
    onToast(`Circle “${newGroup.name}” created!`);
  };

  const EMOJI_OPTIONS = ['🌟', '⛺', '🏄‍♂️', '☕', '🍻', '🎮', '🎨', '🍕', '🚗', '🚀'];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 transition-colors">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight dark:text-cream">
              Your groups
            </h1>
            <p className="text-navy/60 dark:text-cream/60 mt-2 max-w-md">
              Events and ideas are kept strictly separate for your account unless you invite friends to join.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-cream-2 dark:bg-navy border border-navy/15 dark:border-white/15 text-navy dark:text-cream font-bold text-sm hover:border-coral hover:text-coral transition-all"
            >
              <KeyRound className="w-4 h-4 text-coral" /> Join with Code
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark transition-all"
            >
              <Plus className="w-4 h-4" /> Start a new group
            </button>
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-navy-card rounded-2xl border border-dashed border-coral/30 p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-coral/10 text-coral text-3xl grid place-items-center mx-auto mb-4">
            🌟
          </div>
          <h2 className="font-display font-extrabold text-2xl dark:text-cream mb-2">No circles yet</h2>
          <p className="text-navy/60 dark:text-cream/60 max-w-md mx-auto mb-6 text-sm">
            You don't belong to any circles yet. Start a new circle with friends, or ask someone to send an invite to{' '}
            <strong className="text-coral">{currentUser.email || currentUser.name}</strong>.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark transition-all"
          >
            <Plus className="w-4 h-4" /> Create your first circle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const active = activeGroup?.id === g.id;
            return (
              <article
                key={g.id}
                className={`bg-white dark:bg-navy-card rounded-2xl border p-5 sm:p-6 shadow-soft transition-all ${
                  active
                    ? 'border-coral/40 ring-2 ring-coral/20'
                    : 'border-navy/5 dark:border-white/5 hover:shadow-lifted'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl grid place-items-center text-2xl shrink-0"
                    style={{ backgroundColor: g.accent + '22' }}
                  >
                    <span aria-hidden="true">{g.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg leading-tight dark:text-cream">
                        {g.name}
                      </h3>
                      {active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral text-cream">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-navy/55 dark:text-cream/55 mt-0.5">{g.tagline}</p>
                    {g.joinCode && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-mono font-bold bg-navy/5 dark:bg-white/5 text-navy/70 dark:text-cream/70 px-2 py-0.5 rounded-lg border border-navy/10 dark:border-white/10 flex items-center gap-1.5">
                          Code: {g.joinCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(g.joinCode!);
                          }}
                          title="Copy join code"
                          className="p-1 rounded-md text-navy/40 dark:text-cream/40 hover:text-coral transition-colors"
                        >
                          {copiedCode === g.joinCode ? <Check className="w-3.5 h-3.5 text-lime-dark" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyInviteLink(g.joinCode!);
                          }}
                          title="Copy direct invite link"
                          className="p-1 rounded-md text-navy/40 dark:text-cream/40 hover:text-coral transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-navy/5 dark:border-white/5">
                  <AvatarStack members={g.members} max={4} size="sm" />
                  <div className="flex items-center gap-2">
                    {onInvite && (
                      <button
                        onClick={() => onInvite(g)}
                        title="Invite friends to this group"
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-coral bg-coral/10 hover:bg-coral hover:text-white transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Invite
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(g)}
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-bold text-navy dark:text-cream hover:bg-cream-2 dark:hover:bg-navy transition-colors"
                    >
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-cream-2/50 dark:bg-navy/30 border-2 border-dashed border-navy/15 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[160px] hover:border-coral/40 hover:bg-cream-2 dark:hover:bg-navy/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-navy-card grid place-items-center mb-3 group-hover:scale-110 transition-transform shadow-soft">
              <Plus className="w-5 h-5 text-coral" />
            </div>
            <p className="font-display font-bold text-base dark:text-cream">Start a new group</p>
            <p className="text-xs text-navy/55 dark:text-cream/55 mt-1">Gather your people</p>
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Start a new circle"
        subtitle="Bring together your weekend crew"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 dark:text-cream">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Hiking Enthusiasts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 h-12 rounded-xl bg-white dark:bg-navy border border-navy/15 dark:border-white/15 text-sm dark:text-cream placeholder:text-navy/35 focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 dark:text-cream">Tagline</label>
            <input
              type="text"
              placeholder="e.g. Exploring trails and summits"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 h-12 rounded-xl bg-white dark:bg-navy border border-navy/15 dark:border-white/15 text-sm dark:text-cream placeholder:text-navy/35 focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 dark:text-cream">Group Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-10 h-10 rounded-xl text-xl grid place-items-center transition-all ${
                    emoji === em
                      ? 'bg-navy dark:bg-white text-cream scale-110 shadow-sm'
                      : 'bg-cream-2 dark:bg-navy text-navy hover:scale-105'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 h-11 rounded-xl text-sm font-bold text-navy/70 dark:text-cream/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark"
            >
              Create Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Group with Code Modal */}
      <Modal
        open={joinModalOpen}
        onClose={() => {
          setJoinModalOpen(false);
          setJoinError('');
        }}
        title="Join a Circle with Code"
        subtitle="Enter the invite code shared by your friend"
      >
        <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-cream-2 dark:bg-navy border border-navy/10 dark:border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral grid place-items-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <p className="text-xs text-navy/70 dark:text-cream/70 leading-relaxed">
              Circles are private servers for friend squads. Ask a group member for their <strong>Invite Code</strong> or copy link.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-cream/60 mb-2">
              Circle Join Code
            </label>
            <input
              type="text"
              placeholder="e.g. WQ-CREW1"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              required
              autoFocus
              className="w-full px-4 h-13 rounded-2xl bg-white dark:bg-navy border border-navy/15 dark:border-white/15 text-lg font-mono font-bold uppercase tracking-widest text-center dark:text-cream placeholder:text-navy/35 focus:border-coral focus:outline-none"
            />
            {joinError && (
              <p className="text-xs text-red-500 font-bold mt-2 text-center">{joinError}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setJoinModalOpen(false);
                setJoinError('');
              }}
              className="px-4 h-11 rounded-xl text-sm font-bold text-navy/70 dark:text-cream/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joinLoading || !joinCodeInput.trim()}
              className="px-6 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark disabled:opacity-50 flex items-center gap-2"
            >
              {joinLoading ? 'Joining...' : 'Join Circle'}
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
