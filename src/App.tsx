import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ViewId,
  Group,
  Idea,
  ActivityItem,
  UpcomingQuest,
  Category,
  Comment,
  Member,
  UserSettings,
} from './types';
import {
  ALL_MEMBERS,
  GROUPS,
  INITIAL_IDEAS,
  INITIAL_ACTIVITY,
  INITIAL_UPCOMING,
  INITIAL_EXPLORE,
  DEFAULT_USER_SETTINGS,
  getStoredData,
  setStoredData,
} from './utils/storage';
import { CATEGORY_META } from './utils/categories';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { DashboardView } from './views/DashboardView';
import { GroupsView } from './views/GroupsView';
import { ExploreView } from './views/ExploreView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { CreateQuestModal } from './components/modals/CreateQuestModal';
import { PlanQuestModal } from './components/modals/PlanQuestModal';
import { IdeaDetailModal } from './components/modals/IdeaDetailModal';
import { InviteModal } from './components/modals/InviteModal';
import { Toast } from './components/Toast';
import { joinGroupByCode } from './utils/auth';

// Resolves a consistent user ID even across sessions or legacy local storage
function resolveUserId(settings: UserSettings): string {
  if (settings.id) return settings.id;
  const email = settings.email?.toLowerCase().trim();
  if (email === 'potato@gmail.com') return 'u-1791739134992';
  if (email === 'alex@weekend.quest') return 'u-alex';
  if (email === 'maya@weekend.quest') return 'u-maya';
  if (email === 'leo@weekend.quest') return 'u-leo';
  if (email === 'priya@weekend.quest') return 'u-priya';
  if (email === 'sam@weekend.quest') return 'u-sam';
  if (email === 'jordan@weekend.quest') return 'u-1791738572107';
  return 'u-alex';
}

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return getStoredData<boolean>('wq_dark_mode', false);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStoredData('wq_dark_mode', darkMode);
  }, [darkMode]);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return getStoredData<boolean>('wq_authenticated', true);
  });

  // User Settings state
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    return getStoredData<UserSettings>('wq_user_settings', DEFAULT_USER_SETTINGS);
  });

  const currentUser: Member = useMemo(() => {
    const userId = resolveUserId(userSettings);
    return {
      id: userId,
      name: userSettings.name,
      initials: userSettings.initials || 'AR',
      color: userSettings.color || '#FF6A5B',
      email: userSettings.email,
    };
  }, [userSettings]);

  const handleUpdateSettings = useCallback((newSettings: UserSettings) => {
    setUserSettings(newSettings);
    setStoredData('wq_user_settings', newSettings);
  }, []);

  // Main navigation view
  const [view, setView] = useState<ViewId>('dashboard');

  // Groups scoped specifically to current user account
  const [groups, setGroups] = useState<Group[]>(() => {
    const userId = resolveUserId(userSettings);
    return getStoredData<Group[]>(
      `wq_groups_${userId}`,
      userId === 'u-alex' ? GROUPS : []
    );
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const userId = resolveUserId(userSettings);
    const initialGroups = getStoredData<Group[]>(
      `wq_groups_${userId}`,
      userId === 'u-alex' ? GROUPS : []
    );
    return getStoredData<string>(
      `wq_active_group_id_${userId}`,
      initialGroups[0]?.id || ''
    );
  });

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) || groups[0],
    [groups, activeGroupId]
  );

  // Fetch groups scoped to current user from SQLite backend
  const fetchUserGroups = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/groups?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data: Group[] = await res.json();
        setGroups(data);
        setStoredData(`wq_groups_${userId}`, data);

        setActiveGroupId((prev) => {
          if (data.length === 0) return '';
          const stillExists = data.some((g) => g.id === prev);
          return stillExists ? prev : data[0].id;
        });
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch user groups from API, falling back to cache', err);
    }

    const cached = getStoredData<Group[]>(
      `wq_groups_${userId}`,
      userId === 'u-alex' ? GROUPS : []
    );
    setGroups(cached);
    setActiveGroupId((prev) => {
      if (cached.length === 0) return '';
      const stillExists = cached.some((g) => g.id === prev);
      return stillExists ? prev : cached[0].id;
    });
  }, []);

  // Whenever currentUser ID changes (login, switch account), re-fetch groups for that user
  useEffect(() => {
    if (isAuthenticated && currentUser.id) {
      fetchUserGroups(currentUser.id);
    }
  }, [currentUser.id, isAuthenticated, fetchUserGroups]);

  // Ideas per group
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    return activeGroupId ? getStoredData<Idea[]>(`wq_ideas_${activeGroupId}`, activeGroupId === 'g1' ? INITIAL_IDEAS : []) : [];
  });

  // Activity stream
  const [activity, setActivity] = useState<ActivityItem[]>(() => {
    return activeGroupId ? getStoredData<ActivityItem[]>(`wq_activity_${activeGroupId}`, activeGroupId === 'g1' ? INITIAL_ACTIVITY : []) : [];
  });

  // Upcoming planned quest
  const [upcoming, setUpcoming] = useState<UpcomingQuest>(() => {
    return activeGroupId ? getStoredData<UpcomingQuest>(`wq_upcoming_${activeGroupId}`, activeGroupId === 'g1' ? INITIAL_UPCOMING : {
      id: '',
      title: 'No quest planned yet',
      dayLabel: '',
      dateLine: '',
      date: '',
      time: '',
      location: '',
      address: '',
      attendees: [],
      attending: false,
      emoji: '🎯',
      checklist: [],
      expenses: [],
    }) : {
      id: '',
      title: 'No quest planned yet',
      dayLabel: '',
      dateLine: '',
      date: '',
      time: '',
      location: '',
      address: '',
      attendees: [],
      attending: false,
      emoji: '🎯',
      checklist: [],
      expenses: [],
    };
  });

  // Explore ideas
  const [exploreIdeas, setExploreIdeas] = useState<Idea[]>(() => {
    return getStoredData<Idea[]>('wq_explore', INITIAL_EXPLORE);
  });

  // UI Modals & Popovers
  const [createOpen, setCreateOpen] = useState(false);
  const [planTarget, setPlanTarget] = useState<Idea | null>(null);
  const [detailTarget, setDetailTarget] = useState<Idea | null>(null);
  const [inviteTargetGroup, setInviteTargetGroup] = useState<Group | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  // Sync state changes with localStorage scoped by user
  useEffect(() => {
    if (currentUser.id) {
      setStoredData(`wq_groups_${currentUser.id}`, groups);
    }
  }, [groups, currentUser.id]);

  useEffect(() => {
    if (currentUser.id && activeGroupId) {
      setStoredData(`wq_active_group_id_${currentUser.id}`, activeGroupId);
    }

    if (activeGroupId) {
      const defaultIdeas = activeGroupId === 'g1' ? INITIAL_IDEAS : [];
      const defaultActivity = activeGroupId === 'g1' ? INITIAL_ACTIVITY : [];
      const defaultUpcoming = activeGroupId === 'g1' ? INITIAL_UPCOMING : {
        id: '',
        title: 'No quest planned yet',
        dayLabel: '',
        dateLine: '',
        date: '',
        time: '',
        location: '',
        address: '',
        attendees: [],
        attending: false,
        emoji: '🎯',
        checklist: [],
        expenses: [],
      };
      setIdeas(getStoredData<Idea[]>(`wq_ideas_${activeGroupId}`, defaultIdeas));
      setActivity(getStoredData<ActivityItem[]>(`wq_activity_${activeGroupId}`, defaultActivity));
      setUpcoming(getStoredData<UpcomingQuest>(`wq_upcoming_${activeGroupId}`, defaultUpcoming));
    } else {
      setIdeas([]);
      setActivity([]);
      setUpcoming({
        id: '',
        title: 'No quest planned yet',
        dayLabel: '',
        dateLine: '',
        date: '',
        time: '',
        location: '',
        address: '',
        attendees: [],
        attending: false,
        emoji: '🎯',
        checklist: [],
        expenses: [],
      });
    }
  }, [activeGroupId, currentUser.id]);

  useEffect(() => {
    if (activeGroupId) {
      setStoredData(`wq_ideas_${activeGroupId}`, ideas);
    }
  }, [ideas, activeGroupId]);

  useEffect(() => {
    if (activeGroupId) {
      setStoredData(`wq_activity_${activeGroupId}`, activity);
    }
  }, [activity, activeGroupId]);

  useEffect(() => {
    if (activeGroupId) {
      setStoredData(`wq_upcoming_${activeGroupId}`, upcoming);
    }
  }, [upcoming, activeGroupId]);

  useEffect(() => {
    setStoredData('wq_explore', exploreIdeas);
  }, [exploreIdeas]);

  useEffect(() => {
    setStoredData('wq_authenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast({ msg, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // Check for invite code in URL query string (e.g., ?join=WQ-XXXX)
  useEffect(() => {
    if (!isAuthenticated || !currentUser.id) return;
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      joinGroupByCode(joinCode, currentUser.id).then((res) => {
        if (res.success) {
          fetchUserGroups(currentUser.id);
          if (res.groupId) setActiveGroupId(res.groupId);
          showToast(res.alreadyMember ? `You're already in ${res.groupName}!` : `Joined ${res.groupName}! 🎉`);
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          showToast(res.error || 'Could not join circle');
        }
      });
    }
  }, [isAuthenticated, currentUser.id, fetchUserGroups, showToast]);

  // Auth handlers
  const handleLogin = useCallback(
    (user: Member) => {
      const nextSettings: UserSettings = {
        ...userSettings,
        id: user.id,
        name: user.name,
        email: user.email || userSettings.email,
        initials: user.initials,
        color: user.color,
      };
      setUserSettings(nextSettings);
      setStoredData('wq_user_settings', nextSettings);
      setIsAuthenticated(true);
      setView('dashboard');
      showToast(`Welcome back, ${user.name}!`);
    },
    [userSettings, showToast]
  );

  const handleRegister = useCallback(
    (user: Member) => {
      const nextSettings: UserSettings = {
        ...userSettings,
        id: user.id,
        name: user.name,
        email: user.email || userSettings.email,
        initials: user.initials,
        color: user.color,
      };
      setUserSettings(nextSettings);
      setStoredData('wq_user_settings', nextSettings);
      setIsAuthenticated(true);
      setView('dashboard');
      showToast(`Welcome to Weekend Quest, ${user.name}!`);
    },
    [userSettings, showToast]
  );

  const handleGuest = useCallback(() => {
    setIsAuthenticated(true);
    setView('dashboard');
    showToast('Signed in as Guest Explorer');
  }, [showToast]);

  const handleSignOut = useCallback(() => {
    setIsAuthenticated(false);
    showToast('Signed out. See you next weekend!');
  }, [showToast]);

  // Push activity entry
  const pushActivity = useCallback(
    (userName: string, userColor: string, userInitials: string, action: string, target: string) => {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userName,
          userColor,
          userInitials,
          action,
          target,
          time: 'just now',
        },
        ...prev,
      ].slice(0, 10));
    },
    []
  );

  // Voting
  const handleVote = useCallback(
    (id: string) => {
      let voted = false;
      let title = '';
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== id) return idea;
          voted = !idea.votedByMe;
          title = idea.title;
          return {
            ...idea,
            votedByMe: voted,
            votes: idea.votes + (voted ? 1 : -1),
          };
        })
      );
      pushActivity(
        currentUser.name,
        currentUser.color,
        currentUser.initials,
        voted ? 'voted for' : 'removed vote from',
        title
      );
    },
    [currentUser, pushActivity]
  );

  // Create Quest
  const handleCreateQuest = useCallback(
    (data: {
      title: string;
      description: string;
      date: string;
      location: string;
      category: Category;
    }) => {
      const newIdea: Idea = {
        id: `idea-${Date.now()}`,
        title: data.title,
        description: data.description,
        category: data.category,
        time: formatIdeaTime(data.date),
        votes: 1,
        votedByMe: true,
        suggestedBy: currentUser.name.split(' ')[0],
        comments: [],
      };
      setIdeas((prev) => [newIdea, ...prev]);
      pushActivity(
        currentUser.name,
        currentUser.color,
        currentUser.initials,
        'added a new idea',
        data.title
      );
      setCreateOpen(false);
      showToast('Quest added to the board!');
    },
    [currentUser, pushActivity, showToast]
  );

  // Plan Quest
  const handlePlanQuest = useCallback(
    (data: {
      date: string;
      time: string;
      location: string;
      notes: string;
      invitees: string[];
    }) => {
      if (!planTarget) return;

      const updatedUpcoming: UpcomingQuest = {
        id: `up-${Date.now()}`,
        title: planTarget.title,
        dayLabel: 'Soon',
        dateLine: `${formatDate(data.date)} · ${data.time}`,
        date: data.date,
        time: data.time,
        location: data.location,
        address: data.notes || 'See notes',
        attendees: [
          currentUser.initials,
          ...(data.invitees
            .filter((id) => id !== 'me')
            .map((id) => ALL_MEMBERS.find((m) => m.id === id)?.initials)
            .filter(Boolean) as string[]),
        ],
        attending: true,
        emoji: CATEGORY_META[planTarget.category].emoji,
        notes: data.notes,
        checklist: [
          { id: 'c-1', text: 'Confirm meeting spot & parking', done: false, assignedTo: currentUser.name },
          { id: 'c-2', text: 'Share route or reservation details', done: false, assignedTo: 'Maya' },
        ],
        expenses: [],
      };

      setUpcoming(updatedUpcoming);
      pushActivity(
        currentUser.name,
        currentUser.color,
        currentUser.initials,
        'planned',
        planTarget.title
      );
      setPlanTarget(null);
      showToast('Quest confirmed — let’s do this!');
    },
    [currentUser, planTarget, pushActivity, showToast]
  );

  // Toggle RSVP
  const handleToggleAttending = useCallback(() => {
    setUpcoming((prev) => {
      const nextAttending = !prev.attending;
      showToast(nextAttending ? 'You’re in!' : 'Removed your RSVP');
      return { ...prev, attending: nextAttending };
    });
  }, [showToast]);

  // Comments
  const handleAddComment = useCallback(
    (ideaId: string, text: string) => {
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        ideaId,
        author: currentUser,
        text,
        createdAt: 'just now',
      };

      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== ideaId) return idea;
          const updatedComments = [...(idea.comments || []), newComment];
          return { ...idea, comments: updatedComments };
        })
      );

      if (detailTarget && detailTarget.id === ideaId) {
        setDetailTarget((prev) =>
          prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null
        );
      }

      pushActivity(
        currentUser.name,
        currentUser.color,
        currentUser.initials,
        'commented on',
        detailTarget?.title || 'quest'
      );
      showToast('Comment posted');
    },
    [currentUser, detailTarget, pushActivity, showToast]
  );

  // Adopt explore idea into current circle
  const handleAdoptToGroup = useCallback(
    (idea: Idea) => {
      const adopted: Idea = {
        ...idea,
        id: `adopted-${Date.now()}`,
        suggestedBy: currentUser.name.split(' ')[0],
        votes: 1,
        votedByMe: true,
      };
      setIdeas((prev) => [adopted, ...prev]);
      pushActivity(
        currentUser.name,
        currentUser.color,
        currentUser.initials,
        'brought from Explore',
        idea.title
      );
      showToast(`Added “${idea.title}” to ${activeGroup?.name || 'circle'}!`);
    },
    [activeGroup?.name, currentUser, pushActivity, showToast]
  );

  // Add group
  const handleAddGroup = useCallback(
    async (newGroup: Group) => {
      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupId(newGroup.id);

      // Persist to SQLite backend
      try {
        await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newGroup.id,
            name: newGroup.name,
            tagline: newGroup.tagline,
            emoji: newGroup.emoji,
            accent: newGroup.accent,
            userId: currentUser.id,
          }),
        });
        fetchUserGroups(currentUser.id);
      } catch (err) {
        console.warn('Failed to save group to API', err);
      }
    },
    [currentUser.id, fetchUserGroups]
  );

  // Reset to default
  const handleResetData = useCallback(() => {
    localStorage.clear();
    setUserSettings(DEFAULT_USER_SETTINGS);
    setGroups(GROUPS);
    setActiveGroupId(GROUPS[0].id);
    setIdeas(INITIAL_IDEAS);
    setActivity(INITIAL_ACTIVITY);
    setUpcoming(INITIAL_UPCOMING);
    setExploreIdeas(INITIAL_EXPLORE);
    setIsAuthenticated(true);
    showToast('Reset to default demo data');
  }, [showToast]);

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // If not authenticated, display the Login / Register View
  if (!isAuthenticated) {
    return (
      <>
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGuest={handleGuest}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onToast={showToast}
        />
        {toast && <Toast key={toast.key} message={toast.msg} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark text-navy dark:text-cream transition-colors duration-200">
      <Sidebar
        view={view}
        setView={setView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
      <MobileHeader
        onCreate={() => setCreateOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setView('settings')}
      />

      <main className="lg:ml-64 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          <TopBar
            onCreate={() => setCreateOpen(true)}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          {view === 'dashboard' && (
            <DashboardView
              group={activeGroup}
              groups={groups}
              ideas={ideas}
              activity={activity}
              upcoming={upcoming}
              onVote={handleVote}
              onPlan={setPlanTarget}
              onOpenDetails={setDetailTarget}
              onSelectGroup={(g) => {
                setActiveGroupId(g.id);
                showToast(`Switched to ${g.name}`);
              }}
              onToggleAttending={handleToggleAttending}
              onUpdateUpcoming={setUpcoming}
              onToast={showToast}
              onCreateIdea={() => setCreateOpen(true)}
              onInviteGroup={setInviteTargetGroup}
              onCreateGroup={() => setView('groups')}
            />
          )}

          {view === 'groups' && (
            <GroupsView
              groups={groups}
              activeGroup={activeGroup}
              currentUser={currentUser}
              onSelect={(g) => {
                setActiveGroupId(g.id);
                setView('dashboard');
                showToast(`Switched to ${g.name}`);
              }}
              onAddGroup={handleAddGroup}
              onInvite={setInviteTargetGroup}
              onReloadGroups={() => currentUser.id && fetchUserGroups(currentUser.id)}
              onToast={showToast}
            />
          )}

          {view === 'explore' && (
            <ExploreView
              ideas={exploreIdeas}
              onSave={(idea) => showToast(`Saved “${idea.title}”`)}
              onAdoptToGroup={handleAdoptToGroup}
            />
          )}

          {view === 'settings' && (
            <SettingsView
              settings={userSettings}
              onUpdateSettings={handleUpdateSettings}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onResetData={handleResetData}
              onToast={showToast}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </main>

      <BottomNav view={view} setView={setView} />

      {/* Modals */}
      <CreateQuestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateQuest}
        groupName={activeGroup?.name || 'Your circle'}
      />

      <PlanQuestModal
        idea={planTarget}
        onClose={() => setPlanTarget(null)}
        onSubmit={handlePlanQuest}
        groupMembers={activeGroup?.members || [currentUser]}
      />

      <IdeaDetailModal
        idea={detailTarget}
        onClose={() => setDetailTarget(null)}
        onVote={handleVote}
        onPlan={setPlanTarget}
        onAddComment={handleAddComment}
        currentUser={currentUser}
      />

      {inviteTargetGroup && (
        <InviteModal
          open={Boolean(inviteTargetGroup)}
          onClose={() => setInviteTargetGroup(null)}
          group={inviteTargetGroup}
          currentUser={currentUser}
          onInviteSuccess={(msg, invitedUser) => {
            showToast(msg);
            pushActivity(
              currentUser.name,
              currentUser.color,
              currentUser.initials,
              'invited',
              invitedUser ? `${invitedUser.name} to circle` : 'a friend'
            );
            fetchUserGroups(currentUser.id);
          }}
        />
      )}

      {toast && <Toast key={toast.key} message={toast.msg} />}
    </div>
  );
}

// Helpers
function formatIdeaTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[d.getDay()];
    return `${day} · evening`;
  } catch {
    return 'This weekend';
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default App;
