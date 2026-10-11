import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Avatar } from '../components/Avatar';
import {
  User,
  Palette,
  Bell,
  Calendar,
  Database,
  Check,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Server,
  ExternalLink,
} from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabase';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onResetData: () => void;
  onToast: (msg: string) => void;
  onSignOut: () => void;
}

const COLOR_SWATCHES = [
  '#FF6A5B', // Coral
  '#A8CF2E', // Lime
  '#7BCFB8', // Teal
  '#FFB547', // Amber
  '#9B7BC7', // Plum
  '#16213E', // Navy
  '#3B82F6', // Blue
  '#EC4899', // Pink
];

export function SettingsView({
  settings,
  onUpdateSettings,
  darkMode,
  setDarkMode,
  onResetData,
  onToast,
  onSignOut,
}: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'data'>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (newValues: Partial<UserSettings>) => {
    const updated = { ...localSettings, ...newValues };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    onToast('Settings saved successfully');
  };

  const handleExportData = () => {
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wq_')) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekend-quest-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported backup file');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        Object.entries(parsed).forEach(([k, v]) => {
          localStorage.setItem(k, JSON.stringify(v));
        });
        onToast('Data imported! Reloading...');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        onToast('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 transition-colors">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight dark:text-cream">
          Settings
        </h1>
        <p className="text-navy/60 dark:text-cream/60 mt-2 max-w-md">
          Customize your profile, app appearance, notifications, and weekend planning defaults.
        </p>

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-6 -mx-1 px-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'data', label: 'Data & Backup', icon: Database },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 h-11 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-navy dark:bg-white text-cream dark:text-navy shadow-soft'
                    : 'bg-cream-2 dark:bg-navy text-navy/70 dark:text-cream/70 hover:bg-cream-3'
                }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <section className="bg-white dark:bg-navy-card rounded-2xl border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 space-y-6 transition-colors">
          <div className="flex items-center gap-4 pb-6 border-b border-navy/10 dark:border-white/10">
            <Avatar
              member={{
                id: 'me',
                name: localSettings.name,
                initials: localSettings.initials || 'Y',
                color: localSettings.color,
              }}
              size="lg"
            />
            <div>
              <h3 className="font-display font-bold text-lg dark:text-cream">
                {localSettings.name}
              </h3>
              <p className="text-xs text-navy/50 dark:text-cream/50">{localSettings.email}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold mb-1.5 dark:text-cream">Display Name</label>
              <input
                type="text"
                value={localSettings.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const inits = val
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  setLocalSettings({ ...localSettings, name: val, initials: inits || 'Y' });
                }}
                className="w-full px-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 dark:text-cream">Email Address</label>
              <input
                type="email"
                value={localSettings.email}
                onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })}
                className="w-full px-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 dark:text-cream">Home City</label>
              <input
                type="text"
                placeholder="e.g. Seattle, WA"
                value={localSettings.city}
                onChange={(e) => setLocalSettings({ ...localSettings, city: e.target.value })}
                className="w-full px-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 dark:text-cream">Avatar Color</label>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, color: swatch })}
                    className="w-8 h-8 rounded-full grid place-items-center transition-transform hover:scale-110 relative shadow-sm"
                    style={{ backgroundColor: swatch }}
                  >
                    {localSettings.color === swatch && (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-navy/10 dark:border-white/10">
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-xs font-bold text-coral hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Sign Out of Account
            </button>

            <button
              onClick={() => handleSave(localSettings)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </section>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <section className="bg-white dark:bg-navy-card rounded-2xl border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 space-y-6 transition-colors">
          <div>
            <h3 className="font-display font-bold text-lg dark:text-cream mb-1">Theme Mode</h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              Choose how Weekend Quest looks to your eyes.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                onClick={() => setDarkMode(false)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                  !darkMode
                    ? 'border-coral bg-cream-2/50 text-navy shadow-sm'
                    : 'border-navy/10 dark:border-white/10 hover:border-navy/30 text-navy/60 dark:text-cream/60'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white grid place-items-center shadow-soft">
                  <Sun className="w-5 h-5 text-amber" />
                </div>
                <span className="text-sm font-bold">Light Theme</span>
              </button>

              <button
                onClick={() => setDarkMode(true)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                  darkMode
                    ? 'border-coral bg-navy text-cream shadow-sm'
                    : 'border-navy/10 dark:border-white/10 hover:border-navy/30 text-navy/60 dark:text-cream/60'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-navy-card grid place-items-center shadow-soft">
                  <Moon className="w-5 h-5 text-plum" />
                </div>
                <span className="text-sm font-bold">Dark Theme</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-navy/10 dark:border-white/10">
            <h3 className="font-display font-bold text-lg dark:text-cream mb-1">Calendar Provider</h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              Default destination when exporting confirmed quests.
            </p>
            <div className="flex gap-3">
              {[
                { id: 'google', label: 'Google Calendar' },
                { id: 'ics', label: 'Apple Calendar / .ICS file' },
              ].map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => handleSave({ defaultCalendar: cal.id as any })}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    localSettings.defaultCalendar === cal.id
                      ? 'bg-navy dark:bg-white text-cream dark:text-navy border-transparent'
                      : 'border-navy/15 dark:border-white/15 text-navy/70 dark:text-cream/70 hover:bg-cream-2'
                  }`}
                >
                  {cal.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <section className="bg-white dark:bg-navy-card rounded-2xl border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 space-y-5 transition-colors">
          <div>
            <h3 className="font-display font-bold text-lg dark:text-cream mb-1">
              Weekend Notifications
            </h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              Get nudged at the right time so plans actually happen.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'thursdayReminder',
                title: 'Thursday 6:00 PM Lock-in reminder',
                desc: 'Prompt to vote and finalize top ideas before the weekend kicks off.',
              },
              {
                id: 'voteMilestones',
                title: 'Vote milestone celebration',
                desc: 'Notify when an idea you pitched hits 5 or more heart votes.',
              },
              {
                id: 'newIdeas',
                title: 'New ideas pitched by crew',
                desc: 'Alert whenever a friend adds a new quest proposal to the board.',
              },
            ].map((item) => {
              const currentVal = (localSettings.notifications as any)[item.id];
              return (
                <label
                  key={item.id}
                  className="flex items-start justify-between p-4 rounded-2xl bg-cream-2/40 dark:bg-navy/40 hover:bg-cream-2/70 dark:hover:bg-navy/70 cursor-pointer transition-colors"
                >
                  <div className="pr-4">
                    <p className="font-bold text-sm dark:text-cream">{item.title}</p>
                    <p className="text-xs text-navy/55 dark:text-cream/55 mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentVal}
                    onChange={(e) => {
                      const nextNotifs = {
                        ...localSettings.notifications,
                        [item.id]: e.target.checked,
                      };
                      handleSave({ notifications: nextNotifs });
                    }}
                    className="w-5 h-5 accent-coral mt-0.5 rounded cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 4: Data & Backup */}
      {activeTab === 'data' && (
        <section className="bg-white dark:bg-navy-card rounded-2xl border border-navy/5 dark:border-white/5 shadow-soft p-6 sm:p-8 space-y-6 transition-colors">
          <div>
            <h3 className="font-display font-bold text-lg dark:text-cream mb-1">Data Backup & Sync</h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              Export your plans, ideas, and groups as a portable JSON file.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-cream-2 dark:bg-navy text-navy dark:text-cream text-xs font-bold hover:bg-cream-3 transition-colors"
              >
                <Download className="w-4 h-4 text-coral" /> Export Data Backup (.json)
              </button>

              <label className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-cream-2 dark:bg-navy text-navy dark:text-cream text-xs font-bold hover:bg-cream-3 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-teal" /> Import Backup (.json)
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>

          {/* Supabase Cloud Sync & Multi-User Database */}
          <div className="pt-6 border-t border-navy/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-lg dark:text-cream flex items-center gap-2">
                <Server className="w-5 h-5 text-teal" /> Cloud Database (Supabase PostgreSQL)
              </h3>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  isSupabaseConfigured
                    ? 'bg-teal/20 text-teal dark:bg-teal-900/40 dark:text-teal-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                {isSupabaseConfigured ? 'Connected & Active' : 'Local Verification Mode'}
              </span>
            </div>

            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              {isSupabaseConfigured
                ? 'Your app is directly synchronized with your live Supabase cloud database. Registered users and quests sync in real time.'
                : 'Currently using encrypted local persistence. Connect your free Supabase project to support multiple real users across multiple phones and laptops.'}
            </p>

            {!isSupabaseConfigured && (
              <div className="p-4 rounded-2xl bg-cream-2/50 dark:bg-navy/40 border border-navy/10 dark:border-white/10 space-y-3">
                <p className="text-xs font-bold text-navy dark:text-cream">
                  🚀 How to link your Supabase database in 3 minutes:
                </p>
                <ol className="text-xs text-navy/70 dark:text-cream/70 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Create a free project at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-coral font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    In your Supabase project, open the <strong>SQL Editor</strong> and run the schema file:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-white dark:bg-navy-card font-mono text-coral font-semibold">
                      supabase_schema.sql
                    </code>{' '}
                    (already generated in your project root).
                  </li>
                  <li>
                    Copy your <strong>Project URL</strong> & <strong>anon public API key</strong> from{' '}
                    <em>Project Settings &gt; API</em> into your{' '}
                    <code className="px-1.5 py-0.5 rounded bg-white dark:bg-navy-card font-mono text-teal font-semibold">
                      .env.local
                    </code>{' '}
                    file.
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-navy/10 dark:border-white/10">
            <h3 className="font-display font-bold text-lg text-coral dark:text-coral mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-xs text-navy/55 dark:text-cream/55 mb-4">
              Reset everything back to the initial sample groups and quests.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset to Demo Data
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Are you sure? This will clear custom quests and reset to default data.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 h-8 rounded-lg text-xs font-bold bg-white text-navy/70"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowResetConfirm(false);
                      onResetData();
                    }}
                    className="px-3 h-8 rounded-lg text-xs font-bold bg-coral text-cream shadow-coral"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
