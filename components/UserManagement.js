'use client';

export default function UserManagement({ users, onRoleUpdate }) {
  if (!users || users.length === 0) {
    return <div style={{ marginTop: '1rem' }}>No users to manage.</div>;
  }

  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <h3>User Management</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.5rem' }}>{user.email}</td>
              <td style={{ padding: '0.5rem' }}>{user.role}</td>
              <td style={{ padding: '0.5rem' }}>
                <button
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem' }}
                  onClick={() => onRoleUpdate(user.id, user.role === 'manager' ? 'user' : 'manager')}
                >
                  make {user.role === 'manager' ? 'user' : 'manager'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
