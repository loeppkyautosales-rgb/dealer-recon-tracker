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
