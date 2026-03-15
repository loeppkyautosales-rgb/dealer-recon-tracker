import { createClient } from '@supabase/supabase-js';

const DEFAULT_MANAGER_EMAILS = [
  'buddy@loeppkyauto.ca',
  'chris@loeppkyauto.ca',
  'loeppky22@gmail.com',
  'vinceloeppky@hotmail.com',
  'loeppky2001@protonmail.com',
];

function getManagerEmails() {
  const fromEnv = process.env.MANAGER_EMAILS || '';
  const envList = fromEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const merged = [...new Set([...DEFAULT_MANAGER_EMAILS, ...envList])];
  return merged;
}

function getBearerToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return Response.json({ error: 'Supabase admin API is not configured' }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return Response.json({ error: 'Missing access token' }, { status: 401 });
  }

  const { targetEmail, newPassword } = await request.json();

  if (!targetEmail || typeof targetEmail !== 'string') {
    return Response.json({ error: 'Target email is required' }, { status: 400 });
  }

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

  const { data: requesterData, error: requesterError } = await userClient.auth.getUser();
  if (requesterError || !requesterData?.user) {
    return Response.json({ error: 'Invalid requester session' }, { status: 401 });
  }

  const requester = requesterData.user;
  const managers = getManagerEmails();
  const isManager =
    requester.app_metadata?.role === 'manager' ||
    managers.includes((requester.email || '').toLowerCase());

  if (!isManager) {
    return Response.json({ error: 'Manager access required' }, { status: 403 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    return Response.json({ error: listError.message }, { status: 500 });
  }

  const target = (listData?.users || []).find(
    (u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase(),
  );

  if (!target) {
    return Response.json({ error: 'User not found in Supabase Auth' }, { status: 404 });
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(target.id, {
    password: newPassword,
  });

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
