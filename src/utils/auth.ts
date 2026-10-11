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

interface PendingLocalVerification {
  email: string;
  code: string;
  user: StoredUser;
  expiresAt: number;
}
const PENDING_LOCAL_KEY = 'wq_pending_local_verifications';

function getPendingLocalList(): PendingLocalVerification[] {
  try {
    const raw = localStorage.getItem(PENDING_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingLocalVerification(pending: PendingLocalVerification) {
  const list = getPendingLocalList().filter((p) => p.email.toLowerCase() !== pending.email.toLowerCase());
  list.push(pending);
  try {
    localStorage.setItem(PENDING_LOCAL_KEY, JSON.stringify(list));
  } catch {}
}

function verifyPendingLocalCode(email: string, code: string): StoredUser | null {
  const cleanEmail = email.trim().toLowerCase();
  const list = getPendingLocalList();
  const match = list.find((p) => p.email.toLowerCase() === cleanEmail && p.code === code.trim());
  if (!match) return null;
  if (Date.now() > match.expiresAt) return null;
  // Remove verified entry
  const updated = list.filter((p) => p.email.toLowerCase() !== cleanEmail);
  try {
    localStorage.setItem(PENDING_LOCAL_KEY, JSON.stringify(updated));
  } catch {}
  return match.user;
}

const PENDING_LOGIN_OTP_KEY = 'wq_pending_login_otps';
interface PendingLoginOtp {
  email: string;
  code: string;
  expiresAt: number;
}

function savePendingLoginOtp(email: string, code: string) {
  try {
    const list: PendingLoginOtp[] = JSON.parse(localStorage.getItem(PENDING_LOGIN_OTP_KEY) || '[]');
    const filtered = list.filter((p) => p.email.toLowerCase() !== email.toLowerCase());
    filtered.push({ email: email.toLowerCase(), code, expiresAt: Date.now() + 10 * 60 * 1000 });
    localStorage.setItem(PENDING_LOGIN_OTP_KEY, JSON.stringify(filtered));
  } catch {}
}

function checkPendingLoginOtp(email: string, code: string): boolean {
  try {
    const list: PendingLoginOtp[] = JSON.parse(localStorage.getItem(PENDING_LOGIN_OTP_KEY) || '[]');
    const match = list.find((p) => p.email.toLowerCase() === email.toLowerCase() && p.code === code.trim());
    if (!match) return false;
    if (Date.now() > match.expiresAt) return false;
    return true;
  } catch {
    return false;
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

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  savePendingLocalVerification({
    email: cleanEmail,
    code,
    user: newUser,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return {
    success: true,
    verificationRequired: true,
    devCode: code,
    realSent: false,
  };
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
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.warn('[Auth] Verify code API offline or unreachable, checking local pending code', err);
  }

  // Fallback: Check local pending verification
  const localUser = verifyPendingLocalCode(email, code);
  if (localUser) {
    const users = getUsersRegistry();
    users.push(localUser);
    saveUsersRegistry(users);
    return {
      success: true,
      user: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        initials: localUser.initials,
        color: localUser.color,
      },
    };
  }

  return { success: false, error: 'Incorrect or expired verification code. Please try again.' };
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
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.warn('[Auth] Resend code API offline, creating local replacement', err);
  }

  // Local fallback: generate new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const list = getPendingLocalList();
  const found = list.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
  if (found) {
    found.code = newCode;
    found.expiresAt = Date.now() + 10 * 60 * 1000;
    savePendingLocalVerification(found);
  }
  return {
    success: true,
    devCode: newCode,
    realSent: false,
  };
}

export async function sendLoginOtp(email: string): Promise<{
  success: boolean;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/send-login-otp', {
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
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('[Auth] Send login OTP API offline, using local code', err);
  }

  // Fallback: local OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  savePendingLoginOtp(email, code);
  return {
    success: true,
    devCode: code,
    realSent: false,
  };
}

export async function verifyLoginOtp(
  email: string,
  code: string
): Promise<{ success: boolean; user?: Member; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return { success: true, user: data.user };
    }
    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('[Auth] Verify login OTP API offline, checking local code', err);
  }

  // Fallback: check local login OTP
  const valid = checkPendingLoginOtp(email, code);
  if (valid) {
    const users = getUsersRegistry();
    let found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      const defaultName = email.split('@')[0].replace(/[._]/g, ' ');
      found = {
        id: `user-${Date.now()}`,
        name: defaultName,
        email: email.trim().toLowerCase(),
        initials: defaultName.slice(0, 2).toUpperCase() || 'U',
        color: '#FF6A5B',
        passwordHash: '',
        createdAt: new Date().toISOString(),
      };
      users.push(found);
      saveUsersRegistry(users);
    }
    return {
      success: true,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        initials: found.initials,
        color: found.color,
      },
    };
  }

  return { success: false, error: 'Incorrect or expired verification code.' };
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

