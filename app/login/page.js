'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Unable to login.');
      return;
    }

    router.push('/');
  };

  return (
    <main className="container">
      <h1>Login</h1>
      <p>Please enter your email address and password below to access the Loeppky Auto Recon Board.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: '400px' }}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.6rem 1rem', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p>
        Back to <Link href="/">Dashboard</Link>
      </p>
    </main>
  );
}

