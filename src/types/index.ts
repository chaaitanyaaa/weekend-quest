export type Category = 'food' | 'outdoor' | 'games' | 'culture' | 'adventure';
export type ViewId = 'dashboard' | 'groups' | 'explore' | 'settings';

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  members: Member[];
  accent: string;
  createdBy?: string;
  joinCode?: string;
}

export interface Comment {
  id: string;
  ideaId: string;
  author: Member;
  text: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: Category;
  time: string;
  votes: number;
  votedByMe: boolean;
  suggestedBy: string;
  commentsCount?: number;
  comments?: Comment[];
  savedByMe?: boolean;
}

export interface ActivityItem {
  id: string;
  userName: string;
  userColor: string;
  userInitials: string;
  action: string;
  target: string;
  time: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assignedTo?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // member id
  splitBetween: string[]; // member ids
}

export interface UpcomingQuest {
  id: string;
  title: string;
  dayLabel: string;
  dateLine: string;
  date: string;
  time: string;
  location: string;
  address: string;
  attendees: string[]; // initials or IDs
  attending: boolean;
  emoji: string;
  notes?: string;
  checklist: ChecklistItem[];
  expenses: ExpenseItem[];
}

export interface UserSettings {
  id?: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  city: string;
  accentColor: string;
  reduceMotion: boolean;
  notifications: {
    thursdayReminder: boolean;
    voteMilestones: boolean;
    newIdeas: boolean;
  };
  defaultCalendar: 'google' | 'ics';
}
