import { supabase, isSupabaseConfigured } from './supabaseClient';
import { clearLocalSession, loadLocalAuthUsers, loadLocalSession, saveLocalSession } from './persistence';

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export async function signIn(email, password) {
  const identifier = String(email || '').trim();
  const normalized = normalizeIdentifier(identifier);

  let supabaseError = null;
  if (isSupabaseConfigured) {
    const result = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (!result.error) {
      clearLocalSession();
      return result;
    }
    supabaseError = result.error;
  }

  const localUsers = loadLocalAuthUsers();
  const localMatch = localUsers.find((u) => {
    const usernameMatch = normalizeIdentifier(u.username) === normalized;
    const emailMatch = normalizeIdentifier(u.email) === normalized;
    return (usernameMatch || emailMatch) && u.password === password;
  });

  if (localMatch) {
    const role = localMatch.role || 'user';
    const localUser = {
      id: localMatch.userId || `local-${normalized}`,
      email: localMatch.email || localMatch.username,
      role,
      app_metadata: { role },
      user_metadata: { provider: 'local' },
      isLocal: true,
    };

    saveLocalSession(localUser);
    return { data: { user: localUser }, error: null };
  }

  if (supabaseError) {
    return { error: supabaseError };
  }

  return { error: new Error('Invalid username/email or password') };
}

export async function signOut() {
  clearLocalSession();
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      clearLocalSession();
      return data.user;
    }
  }

  return loadLocalSession();
}

export async function changeOwnPassword({ currentPassword, newPassword }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured') };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { error: new Error('You must be signed in to change password') };
  }

  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return { error: new Error(payload?.error || 'Unable to change password') };
  }

  return { data: payload, error: null };
}

export async function managerSetUserPassword({ targetEmail, newPassword }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured') };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { error: new Error('You must be signed in to perform this action') };
  }

  const response = await fetch('/api/auth/manager-set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetEmail, newPassword }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return { error: new Error(payload?.error || 'Unable to set user password') };
  }

  return { data: payload, error: null };
}
