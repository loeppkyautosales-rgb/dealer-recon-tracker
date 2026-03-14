'use client';

import { useState } from 'react';

export default function UserManagement({ users, onRoleUpdate, onAddUser, onRemoveUser }) {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');

  const handleAdd = (e) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email || !onAddUser) return;
    onAddUser({ email, role: newRole });
    setNewEmail('');
    setNewRole('user');
  };

  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <h3>User Management</h3>

      <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          placeholder="user@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="user">User</option>
          <option value="manager">Manager</option>
        </select>
        <button type="submit" style={{ padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}>
          Add
        </button>
      </form>

      {(!users || users.length === 0) ? (
        <div style={{ marginTop: '1rem' }}>No users to manage.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>{user.email}</td>
                <td style={{ padding: '0.5rem' }}>{user.role}</td>
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {onRoleUpdate && (
                    <button
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem' }}
                      onClick={() => onRoleUpdate(user.id, user.role === 'manager' ? 'user' : 'manager')}
                    >
                      make {user.role === 'manager' ? 'user' : 'manager'}
                    </button>
                  )}
                  {onRemoveUser && (
                    <button
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #ef4444', background: '#ef4444', color: '#fff' }}
                      onClick={() => onRemoveUser(user.id)}
                    >
                      Remove
                    </button>
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
