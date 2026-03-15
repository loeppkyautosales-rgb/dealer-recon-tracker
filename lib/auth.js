import { supabase, isSupabaseConfigured } from './supabaseClient';

export async function signIn(email, password) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured') };
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured') };
  }
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data?.user || null;
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
