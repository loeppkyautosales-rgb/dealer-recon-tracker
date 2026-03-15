'use client';

import { useState } from 'react';
import { changeOwnPassword } from '../lib/auth';

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    const { error: changeError } = await changeOwnPassword({
      currentPassword,
      newPassword,
    });
    setLoading(false);

    if (changeError) {
      setError(changeError.message || 'Unable to update password.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password updated successfully.');
  };

  return (
    <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
      <h3>Change My Password</h3>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: '420px' }}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      {error && <p style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{error}</p>}
      {message && <p style={{ color: '#166534', marginTop: '0.5rem' }}>{message}</p>}
    </section>
  );
}
