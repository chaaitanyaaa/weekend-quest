import { Member, Group, Idea, ActivityItem, UpcomingQuest, UserSettings } from '../types';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'u-alex',
  name: 'Alex Rivera',
  email: 'alex@weekend.quest',
  initials: 'AR',
  color: '#FF6A5B',
  city: 'Seattle, WA',
  accentColor: '#FF6A5B',
  reduceMotion: false,
  notifications: {
    thursdayReminder: true,
    voteMilestones: true,
    newIdeas: true,
  },
  defaultCalendar: 'google',
};

export const ME: Member = {
  id: 'u-alex',
  name: DEFAULT_USER_SETTINGS.name,
  initials: DEFAULT_USER_SETTINGS.initials,
  color: DEFAULT_USER_SETTINGS.color,
  email: DEFAULT_USER_SETTINGS.email,
};

export const ALL_MEMBERS: Member[] = [
  ME,
  { id: 'm1', name: 'Maya Chen', initials: 'MC', color: '#FF6A5B', email: 'maya@weekend.quest' },
  { id: 'm2', name: 'Leo Park', initials: 'LP', color: '#A8CF2E', email: 'leo@weekend.quest' },
  { id: 'm3', name: 'Priya Rao', initials: 'PR', color: '#7BCFB8', email: 'priya@weekend.quest' },
  { id: 'm4', name: 'Sam Okafor', initials: 'SO', color: '#FFB547', email: 'sam@weekend.quest' },
  { id: 'm5', name: 'Iris Vega', initials: 'IV', color: '#9B7BC7', email: 'iris@weekend.quest' },
];

export const GROUPS: Group[] = [
  { id: 'g1', name: 'The Saturday Crew', tagline: 'Weekend wanderers since 2021', emoji: '🌮', members: ALL_MEMBERS.slice(0, 5), accent: '#FF6A5B' },
  { id: 'g2', name: 'Brunch Club', tagline: 'Sundays are for mimosas', emoji: '🥑', members: [ALL_MEMBERS[0], ALL_MEMBERS[1], ALL_MEMBERS[3], ALL_MEMBERS[4]], accent: '#A8CF2E' },
  { id: 'g3', name: 'Adventure Squad', tagline: 'Hiking, biking, kayaking', emoji: '🏔️', members: [ALL_MEMBERS[0], ALL_MEMBERS[2], ALL_MEMBERS[3], ALL_MEMBERS[5]], accent: '#7BCFB8' },
  { id: 'g4', name: 'Downtown Friends', tagline: 'City explorers and foodies', emoji: '🌆', members: [ALL_MEMBERS[0], ALL_MEMBERS[1], ALL_MEMBERS[2]], accent: '#FFB547' },
];

export const INITIAL_IDEAS: Idea[] = [
  { 
    id: 'i1', 
    title: 'Try the new ramen spot', 
    description: 'That place on 4th everyone’s been posting about. Limited seats, so we’d need to book ahead.', 
    category: 'food', 
    time: 'Fri · 7pm', 
    votes: 4, 
    votedByMe: false, 
    suggestedBy: 'Maya',
    comments: [
      { id: 'c1', ideaId: 'i1', author: ALL_MEMBERS[1], text: 'Their spicy miso looks incredible!', createdAt: 'Yesterday' },
      { id: 'c2', ideaId: 'i1', author: ALL_MEMBERS[2], text: 'Can reserve table for 6 on Resy.', createdAt: 'Today' }
    ]
  },
  { 
    id: 'i2', 
    title: 'Sunset hike at Eagle Ridge', 
    description: '2.4-mile loop with a panoramic view at the top. Bring a flashlight for the way down.', 
    category: 'outdoor', 
    time: 'Sat · 5pm', 
    votes: 6, 
    votedByMe: true, 
    suggestedBy: 'Leo',
    comments: [
      { id: 'c3', ideaId: 'i2', author: ALL_MEMBERS[2], text: 'Golden hour is around 6:15pm. Perfect timing.', createdAt: '3h ago' }
    ]
  },
  { 
    id: 'i3', 
    title: 'Board game night', 
    description: 'Catan, Codenames, and the new cozy game Maya picked up. Snacks mandatory, rivalry encouraged.', 
    category: 'games', 
    time: 'Sat · 8pm', 
    votes: 3, 
    votedByMe: false, 
    suggestedBy: 'Priya',
    comments: []
  },
  { 
    id: 'i4', 
    title: 'Outdoor movie in the park', 
    description: 'They’re screening Studio Ghibli under the stars. Bring blankets and a picnic.', 
    category: 'culture', 
    time: 'Sun · 8pm', 
    votes: 2, 
    votedByMe: false, 
    suggestedBy: 'Sam',
    comments: []
  },
  { 
    id: 'i5', 
    title: 'Kayak the river', 
    description: 'Two-hour guided paddle through the marshlands. Supposedly lots of herons this time of year.', 
    category: 'adventure', 
    time: 'Sat · 10am', 
    votes: 2, 
    votedByMe: false, 
    suggestedBy: 'Iris',
    comments: []
  },
  { 
    id: 'i6', 
    title: 'Sunday brunch crawl', 
    description: 'Hit three cafés in one morning. Shareable plates only, no judgment on pastry count.', 
    category: 'food', 
    time: 'Sun · 11am', 
    votes: 3, 
    votedByMe: false, 
    suggestedBy: 'Sam',
    comments: []
  },
];

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: 'a1', userName: 'Maya Chen', userColor: '#FF6A5B', userInitials: 'MC', action: 'added a new idea', target: 'Sunset hike at Eagle Ridge', time: '2h ago' },
  { id: 'a2', userName: 'Leo Park', userColor: '#A8CF2E', userInitials: 'LP', action: 'voted for', target: 'Sunset hike at Eagle Ridge', time: '1h ago' },
  { id: 'a3', userName: 'Priya Rao', userColor: '#7BCFB8', userInitials: 'PR', action: 'joined', target: 'Board game night', time: '3h ago' },
  { id: 'a4', userName: 'Sam Okafor', userColor: '#FFB547', userInitials: 'SO', action: 'commented on', target: 'Kayak the river', time: 'Yesterday' },
  { id: 'a5', userName: 'Iris Vega', userColor: '#9B7BC7', userInitials: 'IV', action: 'created the group', target: 'The Saturday Crew', time: '2 days ago' },
];

export const INITIAL_UPCOMING: UpcomingQuest = {
  id: 'u1', 
  title: 'Pizza & movie marathon', 
  dayLabel: 'Fri', 
  dateLine: 'Oct 18 · 7:30 PM',
  date: '2026-10-18',
  time: '7:30 PM', 
  location: "Leo’s apartment", 
  address: '412 Maple Street, Apt 3B',
  attendees: ['MC', 'LP', 'PR', 'SO'], 
  attending: true, 
  emoji: '🍕',
  notes: 'BYO favorite drink. We are watching Spider-Verse 1 & 2 back to back!',
  checklist: [
    { id: 'chk-1', text: 'Order sourdough pizzas from Crust & Co', done: true, assignedTo: 'Leo Park' },
    { id: 'chk-2', text: 'Bring portable projector & HDMI cable', done: true, assignedTo: 'Maya Chen' },
    { id: 'chk-3', text: 'Pick up ice cream & soda floats', done: false, assignedTo: 'You' },
    { id: 'chk-4', text: 'Extra beanbags or floor cushions', done: false, assignedTo: 'Priya Rao' },
  ],
  expenses: [
    { id: 'exp-1', title: 'Pizza party pack (3 large)', amount: 64.50, paidBy: 'm2', splitBetween: ['me', 'm1', 'm2', 'm3', 'm4'] },
    { id: 'exp-2', title: 'Popcorn & snacks', amount: 18.20, paidBy: 'm1', splitBetween: ['me', 'm1', 'm2', 'm3', 'm4'] },
  ]
};

export const INITIAL_EXPLORE: Idea[] = [
  { id: 'e1', title: 'Pottery painting workshop', description: 'Two hours of guided ceramic painting at Kiln & Co. All materials included.', category: 'culture', time: 'Sat · 2pm', votes: 12, votedByMe: false, suggestedBy: 'Wider community' },
  { id: 'e2', title: 'Cold plunge + sauna circuit', description: 'Recovery ritual at Bathhouse Nordica. Book the 90-minute slot.', category: 'adventure', time: 'Sun · 9am', votes: 8, votedByMe: false, suggestedBy: 'Wider community' },
  { id: 'e3', title: 'Underground vinyl market', description: 'Crate-dig through 40+ sellers in a warehouse. Cash recommended.', category: 'culture', time: 'Sat · 11am', votes: 15, votedByMe: false, suggestedBy: 'Wider community' },
  { id: 'e4', title: 'Coastal bike loop', description: '14-mile paved loop with two beach stops. Bring snacks and a lock.', category: 'outdoor', time: 'Sun · 8am', votes: 9, votedByMe: false, suggestedBy: 'Wider community' },
  { id: 'e5', title: 'Dumpling crawl in Chinatown', description: 'Five stops, one stomach. Vegetarian options at every spot.', category: 'food', time: 'Sat · 6pm', votes: 22, votedByMe: false, suggestedBy: 'Wider community' },
  { id: 'e6', title: 'Improv comedy showcase', description: 'Indie teams doing short-form sets. $10 at the door, cash only.', category: 'culture', time: 'Fri · 9pm', votes: 7, votedByMe: false, suggestedBy: 'Wider community' },
];

export function getStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
    return fallback;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage:`, e);
  }
}
