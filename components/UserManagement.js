'use client';

import { useState } from 'react';

export default function UserManagement({ users, onRoleUpdate, onRemoveUser, onSetPassword, protectedUserEmails = [], lastUpdated }) {
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [passwordStatus, setPasswordStatus] = useState({});
  const [actionStatus, setActionStatus] = useState({});

  const handleSetPassword = async (email) => {
    if (!onSetPassword) return;
    const nextPassword = passwordDrafts[email] || '';

    if (nextPassword.length < 8) {
      setPasswordStatus((prev) => ({ ...prev, [email]: 'Password must be at least 8 characters.' }));
      return;
    }

    setPasswordStatus((prev) => ({ ...prev, [email]: 'Updating...' }));
    if (!window.confirm(`Set a new password for ${email}?`)) {
      setPasswordStatus((prev) => ({ ...prev, [email]: '' }));
      return;
    }

    const result = await onSetPassword(email, nextPassword);
    if (result?.error) {
      setPasswordStatus((prev) => ({ ...prev, [email]: result.error }));
      return;
    }

    setPasswordDrafts((prev) => ({ ...prev, [email]: '' }));
    setPasswordStatus((prev) => ({ ...prev, [email]: 'Password updated.' }));
  };

  const handleRoleToggle = async (user) => {
    if (!onRoleUpdate) return;
    const nextRole = user.role === 'manager' ? 'user' : 'manager';
    if (!window.confirm(`Change ${user.email} to ${nextRole}?`)) return;
    const result = await onRoleUpdate(user.id, nextRole);
    if (result?.error) {
      setActionStatus((prev) => ({ ...prev, [user.email]: result.error }));
      return;
    }
    setActionStatus((prev) => ({ ...prev, [user.email]: '' }));
  };

  const handleRemove = async (user) => {
    if (!onRemoveUser) return;
    if (!window.confirm(`Remove ${user.email}?`)) return;
    const result = await onRemoveUser(user.id);
    if (result?.error) {
      setActionStatus((prev) => ({ ...prev, [user.email]: result.error }));
      return;
    }
    setActionStatus((prev) => ({ ...prev, [user.email]: '' }));
  };

  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <h3>User Management</h3>
      {lastUpdated && <small style={{ color: '#6b7280' }}>Last updated: {new Date(lastUpdated).toLocaleString()}</small>}

      {(!users || users.length === 0) ? (
        <div style={{ marginTop: '1rem' }}>No users to manage.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Password</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>{user.email}</td>
                <td style={{ padding: '0.5rem' }}>{user.role}</td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        type="password"
                        placeholder="New password"
                        value={passwordDrafts[user.email] || ''}
                        onChange={(e) => setPasswordDrafts((prev) => ({ ...prev, [user.email]: e.target.value }))}
                        style={{ padding: '0.35rem', minWidth: '180px' }}
                      />
                      {onSetPassword && (
                        <button
                          type="button"
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '0.3rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}
                          onClick={() => handleSetPassword(user.email)}
                        >
                          Set
                        </button>
                      )}
                    </div>
                    {passwordStatus[user.email] && (
                      <small style={{ color: passwordStatus[user.email] === 'Password updated.' ? '#166534' : '#b91c1c' }}>
                        {passwordStatus[user.email]}
                      </small>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {onRoleUpdate && (
                    <button
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem' }}
                      onClick={() => handleRoleToggle(user)}
                    >
                      make {user.role === 'manager' ? 'user' : 'manager'}
                    </button>
                  )}
                  {onRemoveUser && !protectedUserEmails.includes((user.email || '').toLowerCase()) && (
                    <button
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #ef4444', background: '#ef4444', color: '#fff' }}
                      onClick={() => handleRemove(user)}
                    >
                      Remove
                    </button>
                  )}
                  {actionStatus[user.email] && (
                    <small style={{ color: '#b91c1c', display: 'block' }}>{actionStatus[user.email]}</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
