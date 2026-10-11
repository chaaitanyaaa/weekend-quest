import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Member } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to sign up with Supabase Auth
export async function supabaseSignUp(
  name: string,
  email: string,
  password: string,
  color: string
): Promise<{
  success: boolean;
  user?: Member;
  error?: string;
  verificationRequired?: boolean;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  const initials = name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
        initials,
        avatar_color: color,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const member: Member = {
    id: data.user?.id || `u-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    initials: initials || 'U',
    color,
  };

  return { success: true, user: member };
}

// Helper to sign in with Supabase Auth
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: Member; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const userMeta = data.user.user_metadata || {};
  const name = userMeta.full_name || email.split('@')[0];
  const initials = userMeta.initials || name.substring(0, 2).toUpperCase();
  const color = userMeta.avatar_color || '#FF6A5B';

  const member: Member = {
    id: data.user.id,
    name,
    email: data.user.email || email,
    initials,
    color,
  };

  return { success: true, user: member };
}

// Helper to sign out with Supabase Auth
export async function supabaseSignOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}
