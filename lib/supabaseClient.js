import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase env variables are not set. Please check .env.local.');
}

function createNoopClient() {
  const noop = async () => ({ data: null, error: new Error('Supabase not configured') });
  return {
    auth: {
      signInWithPassword: noop,
      signOut: noop,
      getUser: noop,
      getSession: noop,
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopClient();
