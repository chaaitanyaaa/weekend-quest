import React, { useState, useEffect } from 'react';
import { Group, Member } from '../../types';
import { Modal } from './Modal';
import { Mail, UserPlus, Check, Sparkles, Shield, Copy, Link as LinkIcon } from 'lucide-react';
import { Avatar } from '../Avatar';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  currentUser: Member;
  onInviteSuccess: (msg: string, invitedUser?: Member) => void;
}

export function InviteModal({
  open,
  onClose,
  group,
  currentUser,
  onInviteSuccess,
}: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Member[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const groupMembers = group?.members || [];
  const joinCode = group?.joinCode;

  // Fetch registered users to provide quick-invite suggestions
  useEffect(() => {
    if (!open || !group) return;
    setError(null);
    setEmail('');
    setCopiedCode(false);
    setCopiedLink(false);

    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then((users: Member[]) => {
        // Filter out users who are already in the group
        const existingIds = new Set(groupMembers.map((m) => m?.id).filter(Boolean));
        const existingEmails = new Set(
          groupMembers.map((m) => m?.email?.toLowerCase()).filter(Boolean)
        );
        const filtered = (users || []).filter(
          (u) => u && !existingIds.has(u.id) && !existingEmails.has(u.email?.toLowerCase())
        );
        setAvailableUsers(filtered);
      })
      .catch((err) => {
        console.warn('Failed to fetch user list for suggestions', err);
      });
  }, [open, group]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/?join=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = async (targetEmail?: string) => {
    const inviteEmail = (targetEmail || email).trim().toLowerCase();
    if (!inviteEmail) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${group.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          invitedBy: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to send invite');
        setLoading(false);
        return;
      }

      setEmail('');
      setLoading(false);
      onClose();
      onInviteSuccess(data.message || `Invitation sent to ${inviteEmail}`, data.user);
    } catch (err: any) {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  };

  const groupName = group?.name || 'Circle';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invite to ${groupName}`}
      subtitle="Keep quests private to your circle. Only invited members can see this board."
    >
      <div className="space-y-6">
        {/* Email Invite Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-cream/60 mb-1.5">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
              <input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendInvite();
                  }
                }}
                className="w-full pl-10 pr-4 h-11 rounded-xl bg-white dark:bg-navy border border-navy/15 dark:border-white/15 text-sm dark:text-cream placeholder:text-navy/35 dark:placeholder:text-cream/35 focus:border-coral focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={loading || !email.trim()}
              onClick={() => handleSendInvite()}
              className="px-4 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-soft hover:bg-coral-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Inviting...' : 'Invite'}
            </button>
          </div>
          {error && <p className="text-xs text-rose-500 font-semibold mt-1.5">{error}</p>}
        </div>

        {/* Join Code & Instant Link Share */}
        {joinCode && (
          <div className="p-3.5 rounded-2xl bg-cream-2/70 dark:bg-navy/40 border border-navy/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-navy/50 dark:text-cream/50">
                Circle Join Code
              </p>
              <p className="font-mono font-bold text-lg tracking-widest text-coral mt-0.5">
                {joinCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(joinCode)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-navy border border-navy/10 dark:border-white/10 text-xs font-bold text-navy/80 dark:text-cream/80 hover:bg-cream-2 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-lime-dark" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
              <button
                type="button"
                onClick={() => handleCopyInviteLink(joinCode)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-navy border border-navy/10 dark:border-white/10 text-xs font-bold text-navy/80 dark:text-cream/80 hover:bg-cream-2 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-lime-dark" /> : <LinkIcon className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Invite from Registered Accounts (if any available) */}
        {availableUsers.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-cream/60 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-coral" /> Quick Invite Other Accounts
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {availableUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-cream-2/60 dark:bg-navy/40 border border-navy/5 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar member={u} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate dark:text-cream">{u.name}</p>
                      <p className="text-xs text-navy/50 dark:text-cream/50 truncate">{u.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendInvite(u.email)}
                    disabled={loading}
                    className="px-3 h-8 rounded-lg bg-white dark:bg-navy text-xs font-bold text-coral border border-coral/30 hover:bg-coral hover:text-white transition-colors shrink-0"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members List */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-cream/60 mb-2">
            Current Members ({groupMembers.length})
          </p>
          <div className="divide-y divide-navy/5 dark:divide-white/5 rounded-2xl bg-cream-2/30 dark:bg-navy/20 border border-navy/5 dark:border-white/5 max-h-48 overflow-y-auto">
            {groupMembers.map((m, idx) => {
              if (!m) return null;
              const isCurrentUser = m.id === currentUser?.id || (m.email && m.email === currentUser?.email);
              return (
                <div key={m.id || m.email || idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar member={m} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate dark:text-cream">
                          {m.name} {isCurrentUser && <span className="text-xs text-coral font-medium">(You)</span>}
                        </p>
                      </div>
                      {m.email && (
                        <p className="text-xs text-navy/50 dark:text-cream/50 truncate">{m.email}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/60 dark:text-cream/60 shrink-0">
                    Active
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy badge */}
        <div className="p-3.5 rounded-2xl bg-lime/20 dark:bg-lime-950/20 border border-lime/30 text-xs text-navy/80 dark:text-cream/80 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-lime-dark shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Circle Privacy Enabled:</span> This circle and its weekend
            events are kept separate from all other accounts. Only users invited here can view or vote
            on quests.
          </div>
        </div>
      </div>
    </Modal>
  );
}
