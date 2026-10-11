import React, { useState } from 'react';
import { UpcomingQuest, Member, ChecklistItem, ExpenseItem } from '../types';
import { AvatarStack } from './Avatar';
import { ALL_MEMBERS, ME } from '../utils/storage';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { fetchLocationWeather, WeatherForecast } from '../utils/weather';
import { sendThursdayReminder } from '../utils/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Plus,
  DollarSign,
  CheckSquare,
  Share2,
  CalendarDays,
  FileDown,
  Trash2,
  Sparkles,
  Bell,
  CloudSun,
} from 'lucide-react';

interface UpcomingQuestCardProps {
  quest: UpcomingQuest;
  onToggleAttending: () => void;
  onUpdateQuest: (updated: UpcomingQuest) => void;
  onToast: (msg: string) => void;
}

export function UpcomingQuestCard({
  quest,
  onToggleAttending,
  onUpdateQuest,
  onToast,
}: UpcomingQuestCardProps) {
  const [tab, setTab] = useState<'details' | 'checklist' | 'expenses'>('details');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [reminding, setReminding] = useState(false);

  React.useEffect(() => {
    if (quest?.location) {
      fetchLocationWeather(quest.location).then((res) => {
        if (res) setWeather(res);
      });
    }
  }, [quest?.location]);

  const handleSendReminder = async () => {
    if (!quest.id || reminding) return;
    setReminding(true);
    try {
      const res = await sendThursdayReminder(quest.id);
      if (res.success) {
        onToast(`⏰ Lock-in reminder sent to ${res.count || 'all'} circle members!`);
      } else {
        onToast(res.error || 'Failed to send reminder');
      }
    } catch {
      onToast('Could not send reminder');
    } finally {
      setReminding(false);
    }
  };

  const attendees = quest.attendees.map((initials) => {
    const m = ALL_MEMBERS.find((x) => x.initials === initials);
    return m || ME;
  });

  // Checklist actions
  const handleToggleChecklist = (id: string) => {
    const nextChecklist = quest.checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    onUpdateQuest({ ...quest, checklist: nextChecklist });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
      assignedTo: 'You',
    };
    onUpdateQuest({ ...quest, checklist: [...quest.checklist, newItem] });
    setNewChecklistText('');
    onToast('Item added to packing checklist');
  };

  // Expenses calculations
  const totalExpense = quest.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const attendeesCount = Math.max(1, quest.attendees.length);
  const costPerPerson = (totalExpense / attendeesCount).toFixed(2);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpenseAmount);
    if (!newExpenseTitle.trim() || isNaN(amount) || amount <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: newExpenseTitle.trim(),
      amount: amount,
      paidBy: 'me',
      splitBetween: quest.attendees,
    };

    onUpdateQuest({ ...quest, expenses: [...quest.expenses, newExpense] });
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    onToast(`Expense of $${amount.toFixed(2)} added`);
  };

  const handleRemoveExpense = (id: string) => {
    onUpdateQuest({
      ...quest,
      expenses: quest.expenses.filter((x) => x.id !== id),
    });
  };

  if (!quest || !quest.id) {
    return (
      <section
        aria-label="Upcoming quest"
        className="bg-white dark:bg-navy-card rounded-2xl border border-dashed border-navy/15 dark:border-white/15 p-6 sm:p-8 text-center transition-colors shadow-soft"
      >
        <div className="w-12 h-12 rounded-2xl bg-cream-2 dark:bg-navy text-2xl grid place-items-center mx-auto mb-3">
          🎯
        </div>
        <h3 className="font-display font-bold text-lg dark:text-cream">No quest locked in yet</h3>
        <p className="text-sm text-navy/55 dark:text-cream/55 max-w-sm mx-auto mt-1">
          Vote on ideas on the board, then lock in this circle's weekend quest!
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Upcoming quest"
      className="bg-white dark:bg-navy-card rounded-2xl border border-navy/10 dark:border-white/10 shadow-soft overflow-hidden transition-colors"
    >
      <div className="p-5 sm:p-6">
        {/* Header line */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-coral">
            <Calendar className="w-3.5 h-3.5" /> Upcoming quest
          </span>

          <div className="flex items-center gap-2">
            {/* Calendar Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cream-2 dark:bg-navy text-xs font-semibold text-navy/70 dark:text-cream/70 hover:bg-cream-3 transition-colors"
                title="Add to your calendar"
              >
                <CalendarDays className="w-3.5 h-3.5 text-coral" />
                <span>Export</span>
              </button>

              {showCalendarMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-card rounded-xl shadow-lifted border border-navy/10 dark:border-white/10 p-1.5 z-30 slide-in-right">
                  <a
                    href={createGoogleCalendarUrl(quest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowCalendarMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-navy dark:text-cream hover:bg-cream-2 dark:hover:bg-navy transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-coral" /> Google Calendar
                  </a>
                  <button
                    onClick={() => {
                      downloadIcsFile(quest);
                      setShowCalendarMenu(false);
                      onToast('Downloaded .ics calendar file');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-navy dark:text-cream hover:bg-cream-2 dark:hover:bg-navy transition-colors text-left"
                  >
                    <FileDown className="w-3.5 h-3.5 text-teal" /> Download .ics file
                  </button>
                </div>
              )}
            </div>

            <span className="text-xs text-navy/50 dark:text-cream/50 font-medium">
              {quest.attendees.length} going
            </span>
          </div>
        </div>

        {/* Title & Emoji */}
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 w-16 h-16 rounded-2xl bg-coral/10 border border-coral/20 grid place-items-center text-3xl"
            aria-hidden="true"
          >
            {quest.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-extrabold text-xl sm:text-2xl leading-tight dark:text-cream">
              {quest.title}
            </h3>
            <p className="text-sm text-navy/55 dark:text-cream/55 mt-1">{quest.dateLine}</p>
          </div>
        </div>

        {/* Tab selection: Details / Checklist / Expenses */}
        <div className="flex items-center gap-1.5 mt-5 p-1 bg-cream-2 dark:bg-navy rounded-2xl">
          <button
            onClick={() => setTab('details')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'details'
                ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setTab('checklist')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === 'checklist'
                ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Checklist ({quest.checklist.filter((c) => c.done).length}/{quest.checklist.length})
          </button>
          <button
            onClick={() => setTab('expenses')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === 'expenses'
                ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Split (${totalExpense.toFixed(0)})
          </button>
        </div>

        {/* Tab 1: Details */}
        {tab === 'details' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm dark:text-cream/80">
              <Clock className="w-4 h-4 text-navy/50 dark:text-cream/50 shrink-0" />
              <span>{quest.time}</span>
            </div>
            <div className="flex items-start gap-3 text-sm dark:text-cream/80">
              <MapPin className="w-4 h-4 text-navy/50 dark:text-cream/50 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{quest.location}</p>
                <p className="text-navy/50 dark:text-cream/50 text-xs">{quest.address}</p>
              </div>
            </div>
            {quest.notes && (
              <p className="text-xs text-navy/60 dark:text-cream/60 bg-cream-2/50 dark:bg-navy/40 p-3 rounded-xl border border-navy/5 dark:border-white/5">
                {quest.notes}
              </p>
            )}

            {weather && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-coral/10 border border-blue-500/20 text-xs shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label="weather">{weather.icon}</span>
                  <div>
                    <p className="font-bold text-navy dark:text-cream">
                      Weekend Forecast: {weather.condition} in {weather.city}
                    </p>
                    <p className="text-navy/55 dark:text-cream/55 text-[11px] mt-0.5">
                      High {weather.tempMax}°C / Low {weather.tempMin}°C • {weather.rainChance}% rain chance
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-display font-black text-navy dark:text-cream">
                    {weather.temp}°C
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Checklist */}
        {tab === 'checklist' && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {quest.checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-2/60 dark:hover:bg-navy/40 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklist(item.id)}
                    className="w-4 h-4 accent-coral rounded"
                  />
                  <span
                    className={`text-sm flex-1 ${
                      item.done
                        ? 'line-through text-navy/40 dark:text-cream/40'
                        : 'text-navy dark:text-cream'
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.assignedTo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-2 dark:bg-navy text-navy/70 dark:text-cream/70">
                      {item.assignedTo}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add packing or prep item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3 h-9 text-xs rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:outline-none dark:text-cream"
              />
              <button
                type="submit"
                className="px-3 h-9 rounded-xl bg-navy dark:bg-white text-cream dark:text-navy text-xs font-bold"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Expenses */}
        {tab === 'expenses' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-lime/20 dark:bg-lime-950/30 border border-lime/30">
              <div>
                <p className="text-xs text-navy/60 dark:text-cream/60">Total Bill</p>
                <p className="font-display font-extrabold text-lg text-navy dark:text-cream">
                  ${totalExpense.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-navy/60 dark:text-cream/60">Per Person ({attendeesCount})</p>
                <p className="font-display font-extrabold text-lg text-coral">
                  ${costPerPerson}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {quest.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-cream-2/40 dark:bg-navy/30 text-xs"
                >
                  <span className="font-medium dark:text-cream">{exp.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy dark:text-cream">
                      ${exp.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="text-navy/40 hover:text-coral transition-colors"
                      title="Remove expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddExpense} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Item name (e.g. Snacks)"
                value={newExpenseTitle}
                onChange={(e) => setNewExpenseTitle(e.target.value)}
                className="flex-1 px-3 h-9 text-xs rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:outline-none dark:text-cream"
              />
              <input
                type="number"
                step="0.01"
                placeholder="$"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="w-16 px-2 h-9 text-xs rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:outline-none dark:text-cream"
              />
              <button
                type="submit"
                className="px-3 h-9 rounded-xl bg-navy dark:bg-white text-cream dark:text-navy text-xs font-bold"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* Bottom RSVP & Attendee Stack & Reminder */}
        <div className="mt-5 pt-5 border-t border-navy/5 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40 mb-1.5">
              Going
            </p>
            <AvatarStack members={attendees} max={5} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendReminder}
              disabled={reminding}
              title="Send Thursday Lock reminder email to circle"
              className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-2xl font-bold text-xs bg-cream-2 dark:bg-navy border border-navy/10 dark:border-white/10 text-navy/70 dark:text-cream/70 hover:border-coral hover:text-coral transition-all disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5 text-coral" />
              {reminding ? 'Sending...' : 'Thursday Lock Reminder'}
            </button>

            <button
              onClick={onToggleAttending}
              aria-pressed={quest.attending}
              className={`inline-flex items-center gap-2 px-5 h-11 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                quest.attending
                  ? 'bg-navy dark:bg-white text-cream dark:text-navy'
                  : 'bg-coral text-cream shadow-coral hover:bg-coral-dark'
              }`}
            >
              {quest.attending ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {quest.attending ? 'Going' : 'I’m in'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
