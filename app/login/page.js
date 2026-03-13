import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="container">
      <h1>Login</h1>
      <p>Demo login placeholder for Supabase auth.</p>
      <form style={{ display: 'grid', gap: '0.75rem', maxWidth: '400px' }}>
        <label>
          Email
          <input name="email" type="email" required style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label>
          Password
          <input name="password" type="password" required style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <button type="submit" style={{ padding: '0.6rem 1rem', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white' }}>
          Sign in
        </button>
      </form>
      <p>
        Back to <Link href="/">Dashboard</Link>
      </p>
    </main>
  );
}
