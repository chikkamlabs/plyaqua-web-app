import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'partner';

export interface AuthProfile {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile?: AuthProfile | null;
  error: AuthError | Error | null;
}

const isPlaceholderConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    !url ||
    url.includes('your-project.supabase.co') ||
    url.includes('placeholder') ||
    !key ||
    key.includes('your-anon-key') ||
    key.includes('placeholder')
  );
};

// Key used to store session in mock/demo fallback when Supabase is not yet connected
const LOCAL_STORAGE_SESSION_KEY = 'plyaqua_session_user';

/**
 * Signs in a user with email and password via Supabase.
 * Also queries the public.users table or user metadata to determine the role ('admin' | 'partner').
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  // If Supabase credentials are placeholder or unconfigured, provide functional fallback
  if (isPlaceholderConfig()) {
    const role: UserRole = normalizedEmail.includes('admin') ? 'admin' : 'partner';
    const mockUser: User = {
      id: role === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
      app_metadata: { role },
      user_metadata: { role, name: role === 'admin' ? 'Administrator' : 'Partner Representative' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: normalizedEmail,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: AuthProfile = {
      id: mockUser.id,
      name: role === 'admin' ? 'System Admin' : 'Authorized Partner',
      email: normalizedEmail,
      role,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ user: mockUser, role, profile: mockProfile })
      );
    }

    return {
      user: mockUser,
      session: null,
      role,
      profile: mockProfile,
      error: null,
    };
  }

  // Real Supabase Authentication
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return {
        user: null,
        session: null,
        role: null,
        profile: null,
        error: error || new Error('Authentication failed'),
      };
    }

    // Query user profile from public.users table to verify role
    let role: UserRole = 'partner';
    let profileData: AuthProfile | null = null;

    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', data.user.id)
        .single();

      if (!dbError && dbUser) {
        role = (dbUser.role as UserRole) || 'partner';
        profileData = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role,
        };
      } else {
        // Fallback to metadata if public.users is not yet synced
        const metaRole = (data.user.user_metadata?.role || data.user.app_metadata?.role) as UserRole;
        if (metaRole === 'admin' || metaRole === 'partner') {
          role = metaRole;
        } else if (normalizedEmail.includes('admin')) {
          role = 'admin';
        }
        profileData = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          email: data.user.email,
          role,
        };
      }
    } catch {
      // In case of table query issue, fallback gracefully to metadata
      const metaRole = (data.user.user_metadata?.role || data.user.app_metadata?.role) as UserRole;
      if (metaRole === 'admin' || metaRole === 'partner') {
        role = metaRole;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ user: data.user, role, profile: profileData })
      );
    }

    return {
      user: data.user,
      session: data.session,
      role,
      profile: profileData,
      error: null,
    };
  } catch (err: unknown) {
    return {
      user: null,
      session: null,
      role: null,
      profile: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred during login'),
    };
  }
}

/**
 * Sign out user from Supabase session
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }

    if (!isPlaceholderConfig()) {
      const { error } = await supabase.auth.signOut();
      return { error };
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to sign out') };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.user) return parsed.user;
      } catch {
        // ignore parse error
      }
    }
  }

  if (isPlaceholderConfig()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user's role ('admin' | 'partner' | null)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.role) return parsed.role as UserRole;
      } catch {
        // ignore
      }
    }
  }

  if (isPlaceholderConfig()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbUser?.role) {
      return dbUser.role as UserRole;
    }

    const metaRole = (user.user_metadata?.role || user.app_metadata?.role) as UserRole;
    if (metaRole === 'admin' || metaRole === 'partner') {
      return metaRole;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get current user profile details
 */
export async function getCurrentProfile(): Promise<AuthProfile | null> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.profile) return parsed.profile;
      } catch {
        // ignore
      }
    }
  }

  const role = await getCurrentUserRole();
  const user = await getCurrentUser();
  if (!user || !role) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0],
    role,
  };
}

/**
 * Subscribe to Supabase auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (isPlaceholderConfig()) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange(callback);
}
