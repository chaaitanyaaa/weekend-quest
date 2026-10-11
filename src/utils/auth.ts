import { Member } from '../types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  passwordHash: string;
  createdAt: string;
}

const STORAGE_USERS_KEY = 'wq_users_registry';

// Browser Web Crypto SHA-256 helper for offline fallback
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_ACCOUNTS: StoredUser[] = [
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex@weekend.quest',
    initials: 'AR',
    color: '#FF6A5B',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
    createdAt: '2026-01-01',
  },
  {
    id: 'user-maya',
    name: 'Maya Chen',
    email: 'maya@weekend.quest',
    initials: 'MC',
    color: '#A8CF2E',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
    createdAt: '2026-01-01',
  },
  {
    id: 'user-leo',
    name: 'Leo Park',
    email: 'leo@weekend.quest',
    initials: 'LP',
    color: '#7BCFB8',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
    createdAt: '2026-01-01',
  },
];

export function getUsersRegistry(): StoredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveUsersRegistry(users: StoredUser[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users registry', e);
  }
}

// Authenticate via local SQLite backend API (with offline fallback)
export async function authenticateUser(
  email: string,
  plainPassword: string
): Promise<{ success: boolean; user?: Member; error?: string }> {
  // 1. Try SQLite Backend Server
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: plainPassword }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return { success: true, user: data.user };
    }
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('[Auth] Backend API offline or unreachable, falling back to local registry', err);
  }

  // 2. Fallback to Local Client Registry
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsersRegistry();

  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return {
      success: false,
      error: `No account found with email "${email}". Please verify or create an account.`,
    };
  }

  const inputHash = await hashPassword(plainPassword);
  if (inputHash !== found.passwordHash) {
    return {
      success: false,
      error: 'Incorrect password. (Demo password is "password123")',
    };
  }

  const member: Member = {
    id: found.id,
    name: found.name,
    email: found.email,
    initials: found.initials,
    color: found.color,
  };

  return { success: true, user: member };
}

// Register via local SQLite backend API (with offline fallback)
export async function registerNewUser(
  name: string,
  email: string,
  plainPassword: string,
  color: string
): Promise<{
  success: boolean;
  user?: Member;
  verificationRequired?: boolean;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
  error?: string;
}> {
  // 1. Try SQLite Backend Server
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: plainPassword, color }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.verificationRequired) {
        return {
          success: true,
          verificationRequired: true,
          devCode: data.devCode,
          emailPreviewUrl: data.emailPreviewUrl,
          realSent: data.realSent,
        };
      }
      if (data.user) {
        return { success: true, user: data.user };
      }
    }
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('[Auth] Backend API offline, saving to local registry', err);
  }

  // 2. Fallback to Local Client Registry
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsersRegistry();

  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      success: false,
      error: `An account with "${email}" already exists. Please sign in instead.`,
    };
  }

  const initials = name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const passwordHash = await hashPassword(plainPassword);

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    initials: initials || 'U',
    color,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsersRegistry(users);

  const member: Member = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    initials: newUser.initials,
    color: newUser.color,
  };

  return { success: true, user: member };
}

export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsersRegistry();

  const foundIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (foundIndex === -1) {
    return {
      success: false,
      error: `No account registered with email "${email}".`,
    };
  }

  const passwordHash = await hashPassword(newPassword);
  users[foundIndex].passwordHash = passwordHash;
  saveUsersRegistry(users);

  return { success: true };
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; user?: Member; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Verification failed. Please try again.' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server. Please try again.' };
  }
}

export async function resendVerificationCode(
  email: string
): Promise<{
  success: boolean;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        devCode: data.devCode,
        emailPreviewUrl: data.emailPreviewUrl,
        realSent: data.realSent,
      };
    }
    return { success: false, error: data.error || 'Failed to resend code' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server. Please try again.' };
  }
}

export async function requestPasswordReset(
  email: string
): Promise<{
  success: boolean;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        devCode: data.devCode,
        emailPreviewUrl: data.emailPreviewUrl,
        realSent: data.realSent,
      };
    }
    return { success: false, error: data.error || 'Failed to send reset code' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server. Please try again.' };
  }
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Failed to reset password' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server. Please try again.' };
  }
}

export async function joinGroupByCode(
  code: string,
  userId: string
): Promise<{
  success: boolean;
  groupId?: string;
  groupName?: string;
  alreadyMember?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/groups/join-by-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        groupId: data.groupId,
        groupName: data.groupName,
        alreadyMember: data.alreadyMember,
      };
    }
    return { success: false, error: data.error || 'Failed to join circle' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server.' };
  }
}

export async function sendThursdayReminder(
  eventId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(`/api/events/${eventId}/send-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, count: data.count };
    }
    return { success: false, error: data.error || 'Failed to send reminders' };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to server.' };
  }
}

