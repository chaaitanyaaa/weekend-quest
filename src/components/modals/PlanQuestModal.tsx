import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Idea, Member } from '../../types';
import { CATEGORY_META } from '../../utils/categories';
import { Avatar } from '../Avatar';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanQuestModalProps {
  idea: Idea | null;
  onClose: () => void;
  onSubmit: (d: {
    date: string;
    time: string;
    location: string;
    notes: string;
    invitees: string[];
  }) => void;
  groupMembers: Member[];
}

export function PlanQuestModal({
  idea,
  onClose,
  onSubmit,
  groupMembers,
}: PlanQuestModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [invitees, setInvitees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (idea) {
      setDate('');
      setTime('');
      setLocation('');
      setNotes('');
      setInvitees(groupMembers.map((m) => m.id));
      setErrors({});
    }
  }, [idea, groupMembers]);

  if (!idea) return null;
  const meta = CATEGORY_META[idea.category];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!date) e.date = 'Pick a date';
    if (!time) e.time = 'Pick a time';
    if (!location.trim()) e.location = 'Where are you meeting?';
    if (invitees.length === 0) e.invitees = 'Invite at least one friend';
    setErrors(e);
    if (Object.keys(e).length) return;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSubmit({
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
      invitees,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];
  const toggleInvitee = (id: string) => {
    setInvitees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const inputClass = (error?: string) =>
    `w-full px-4 h-12 rounded-xl bg-white dark:bg-navy border ${
      error ? 'border-coral' : 'border-navy/15 dark:border-white/15'
    } text-sm font-medium placeholder:text-navy/35 dark:placeholder:text-cream/35 text-navy dark:text-cream focus:border-coral focus:outline-none transition-colors`;

  return (
    <Modal
      open={!!idea}
      onClose={onClose}
      title="Plan this quest"
      subtitle="Lock in the details and invite the crew"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-navy/55 dark:text-cream/55 hidden sm:inline">
            {invitees.length} invited
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 h-11 rounded-xl text-sm font-bold text-navy/70 dark:text-cream/70 hover:bg-navy/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-navy dark:bg-white text-cream dark:text-navy font-bold text-sm shadow-lifted hover:bg-navy-2 dark:hover:bg-cream-2 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> Confirm quest
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-5 p-4 rounded-2xl bg-cream-2 dark:bg-navy border border-navy/5 dark:border-white/5 flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl grid place-items-center text-xl shrink-0"
          style={{ backgroundColor: meta.dot + '22' }}
        >
          <span aria-hidden="true">{meta.emoji}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-base leading-tight dark:text-cream">
            {idea.title}
          </p>
          <p className="text-xs text-navy/55 dark:text-cream/55 mt-0.5 line-clamp-2">
            {idea.description}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 dark:text-cream">Date</label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass(errors.date)}
            />
            {errors.date && (
              <p className="text-xs text-coral-dark font-semibold mt-1.5">
                {errors.date}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 dark:text-cream">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass(errors.time)}
            />
            {errors.time && (
              <p className="text-xs text-coral-dark font-semibold mt-1.5">
                {errors.time}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 dark:text-cream">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Eagle Ridge trailhead"
            className={inputClass(errors.location)}
          />
          {errors.location && (
            <p className="text-xs text-coral-dark font-semibold mt-1.5">
              {errors.location}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 dark:text-cream">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Meet at the parking lot at 4:45pm. Bring water and a flashlight."
            rows={3}
            className={`${inputClass()} h-auto py-3 resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 dark:text-cream">
            Invite the crew
          </label>
          <div className="flex flex-wrap gap-2">
            {groupMembers.map((m) => {
              const active = invitees.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleInvitee(m.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 pl-1.5 pr-3 h-10 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? 'bg-navy dark:bg-white text-cream dark:text-navy'
                      : 'bg-white dark:bg-navy text-navy/70 dark:text-cream/70 border border-navy/10 dark:border-white/10 hover:bg-cream-2'
                  }`}
                >
                  <Avatar member={m} size="xs" />
                  {m.id === 'me' ? 'You' : m.name.split(' ')[0]}
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
