'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordSettings from '../../components/PasswordSettings';
import { getCurrentUser } from '../../lib/auth';

export default function PasswordPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    init();
  }, [router]);

  if (loading) {
    return <p style={{ padding: '2rem' }}>Loading password settings...</p>;
  }

  return (
    <main className="container">
      <h1>Password Settings</h1>
      <p>Signed in as {user?.email}</p>
      <PasswordSettings />
      <p style={{ marginTop: '1rem' }}>
        <Link href="/">Back to Board</Link>
      </p>
    </main>
  );
}
