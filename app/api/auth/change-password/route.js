import { createClient } from '@supabase/supabase-js';

function getBearerToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return Response.json({ error: 'Missing access token' }, { status: 401 });
  }

  const { newPassword, currentPassword } = await request.json();
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return Response.json({ error: 'Invalid user session' }, { status: 401 });
  }

  if (currentPassword) {
    const { error: verifyError } = await userClient.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
  }

  const { error: updateError } = await userClient.auth.updateUser({ password: newPassword });
  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
