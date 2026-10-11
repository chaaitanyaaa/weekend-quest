import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Category } from '../../types';
import { CATEGORY_META } from '../../utils/categories';
import { Sparkles } from 'lucide-react';

interface CreateQuestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: {
    title: string;
    description: string;
    date: string;
    location: string;
    category: Category;
  }) => void;
  groupName: string;
}

export function CreateQuestModal({ open, onClose, onSubmit, groupName }: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setCategory('food');
      setErrors({});
    }
  }, [open]);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Give your quest a name';
    else if (title.trim().length < 4) e.title = 'Make it a bit more descriptive';
    if (!description.trim()) e.description = 'Add a short description';
    if (!date) e.date = 'Pick a date';
    if (!location.trim()) e.location = 'Where are you meeting?';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      date,
      location: location.trim(),
      category,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];
  const inputClass = (error?: string) =>
    `w-full px-4 h-12 rounded-xl bg-white dark:bg-navy border ${
      error ? 'border-coral' : 'border-navy/15 dark:border-white/15'
    } text-sm font-medium placeholder:text-navy/35 dark:placeholder:text-cream/35 text-navy dark:text-cream focus:border-coral focus:outline-none transition-colors`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a quest"
      subtitle={`Adding to ${groupName}`}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 h-11 rounded-xl text-sm font-bold text-navy/70 dark:text-cream/70 hover:bg-navy/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Create quest
          </button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-bold mb-1.5 dark:text-cream">
            Quest title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Saturday morning bagel run"
            className={inputClass(errors.title)}
          />
          {errors.title && (
            <p className="text-xs text-coral-dark font-semibold mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-coral-dark" />
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-bold mb-1.5 dark:text-cream">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell your friends what to expect..."
            rows={3}
            className={`${inputClass(errors.description)} h-auto py-3 resize-none`}
          />
          {errors.description && (
            <p className="text-xs text-coral-dark font-semibold mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-coral-dark" />
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-bold mb-1.5 dark:text-cream">
              Date
            </label>
            <input
              id="date"
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
            <label htmlFor="location" className="block text-sm font-bold mb-1.5 dark:text-cream">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Park"
              className={inputClass(errors.location)}
            />
            {errors.location && (
              <p className="text-xs text-coral-dark font-semibold mt-1.5">
                {errors.location}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 dark:text-cream">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
              const m = CATEGORY_META[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-navy dark:bg-white text-cream dark:text-navy'
                      : 'bg-white dark:bg-navy text-navy/70 dark:text-cream/70 border border-navy/10 dark:border-white/10 hover:bg-cream-2'
                  }`}
                >
                  <span aria-hidden="true">{m.emoji}</span> {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
