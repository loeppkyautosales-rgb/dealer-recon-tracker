'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, managerSetUserPassword } from '../../lib/auth';
import { STORAGE_KEYS, appendAuditEvent, loadAuditEvents, loadAuditLastPruned, loadUsers, loadVehicles, saveUsers, saveVehicles } from '../../lib/persistence';
import AddVehicle from '../../components/AddVehicle';
import UserManagement from '../../components/UserManagement';
import AuditLog from '../../components/AuditLog';

const defaultUsers = [
  { id: 'u1', email: 'buddy@loeppkyauto.ca', role: 'manager' },
  { id: 'u2', email: 'chris@loeppkyauto.ca', role: 'manager' },
  { id: 'u3', email: 'loeppky22@gmail.com', role: 'manager' },
  { id: 'u4', email: 'vinceloeppky@hotmail.com', role: 'manager' },
  { id: 'u5', email: 'loeppky2001@protonmail.com', role: 'manager' },
];

const initialVehicles = [];

function mergeUsers(defaultList, storedList) {
  const map = new Map(defaultList.map((u) => [u.email.toLowerCase(), { ...u }]));
  (storedList || []).forEach((u) => {
    const key = (u.email || '').toLowerCase();
    if (!key) return;
    map.set(key, { ...map.get(key), ...u });
  });
  return Array.from(map.values());
}

const colorHexToName = {
  '#000000': 'Black',
  '#ffffff': 'White',
  '#8b8c8d': 'Gray',
  '#0b3d91': 'Blue',
  '#b91c1c': 'Red',
  '#065f46': 'Green',
  '#92400e': 'Brown',
  '#eab308': 'Yellow',
  '#c0c0c0': 'Silver',
  '#ffd700': 'Gold',
};

function getColorLabel(color) {
  if (!color) return 'N/A';
  const lower = String(color).toLowerCase();
  if (colorHexToName[lower]) return colorHexToName[lower];
  return String(color).charAt(0).toUpperCase() + String(color).slice(1).toLowerCase();
}

export default function ManagerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLastPruned, setAuditLastPruned] = useState(null);
  const [users, setUsers] = useState(defaultUsers);

  const router = useRouter();

  useEffect(() => {
    const storedUsers = loadUsers([]);
    const mergedUsers = mergeUsers(defaultUsers, storedUsers);
    setUsers(mergedUsers);

    const storedVehicles = loadVehicles();
    if (storedVehicles.length) setVehicles(storedVehicles);

    const storedAudit = loadAuditEvents();
    if (storedAudit.length) setAuditEvents(storedAudit);
    setAuditLastPruned(loadAuditLastPruned());

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.users) {
        const updatedStored = loadUsers([]);
        const updatedMerged = mergeUsers(defaultUsers, updatedStored);
        setUsers(updatedMerged);
      }
      if (event.key === STORAGE_KEYS.vehicles) {
        setVehicles(loadVehicles());
      }
      if (event.key === STORAGE_KEYS.auditEvents) {
        setAuditEvents(loadAuditEvents());
        setAuditLastPruned(loadAuditLastPruned());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const roleFromAuth =
        currentUser.app_metadata?.role ||
        currentUser.user_metadata?.role ||
        currentUser.role ||
        'user';
      const localUser = users.find(
        (u) => u.email === currentUser.email || u.id === currentUser.id,
      );
      const role = localUser?.role || roleFromAuth;

      setDebugInfo({
        email: currentUser.email,
        roleFromAuth,
        localUser: localUser ? { email: localUser.email, role: localUser.role } : null,
        finalRole: role,
      });

      setIsManager(role === 'manager');
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, [router, users]);

  const addAudit = (action, vehicle) => {
    const entry = {
      actor: user?.email || 'unknown',
      action,
      stockNumber: vehicle.stockNumber,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      status: vehicle.status,
      time: new Date().toISOString(),
    };

    setAuditEvents((prev) => [entry, ...prev]);
    appendAuditEvent(entry);
  };

  const onAddVehicle = (vehicle) => {
    const newVehicle = { ...vehicle, id: crypto.randomUUID() };
    setVehicles((prev) => {
      const next = [newVehicle, ...prev];
      saveVehicles(next);
      return next;
    });
    addAudit('created', newVehicle);
  };

  const onDeleteVehicle = (id) => {
    const target = vehicles.find((v) => v.id === id);
    if (!target) return;
    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveVehicles(next);
      return next;
    });
    addAudit('deleted', target);
  };

  const onUpdateUserRole = (id, newRole) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, role: newRole } : u));
      saveUsers(next);
      return next;
    });
  };

  const onRemoveUser = (id) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveUsers(next);
      return next;
    });
  };

  const onSetUserPassword = async (email, newPassword) => {
    const { error } = await managerSetUserPassword({
      targetEmail: email,
      newPassword,
    });

    if (error) {
      return { error: error.message || 'Unable to set password' };
    }

    return { ok: true };
  };

  const performance = useMemo(() => {
    const stats = {};
    auditEvents.forEach((entry) => {
      if (!stats[entry.actor]) stats[entry.actor] = 0;
      // Count any move / status transition actions as "activity"
      if (typeof entry.action === 'string' && entry.action.startsWith('moved')) {
        stats[entry.actor] += 1;
      }
    });
    return Object.entries(stats).map(([actor, moved]) => ({ actor, moved }));
  }, [auditEvents]);

  if (loading) {
    return <p>Loading manager panel...</p>;
  }

  if (!isManager) {
    return (
      <main className="container">
        <h1>Manager Admin</h1>
        <p>You do not have permission to access the manager panel.</p>
        <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
          <h3>Debug Info</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><strong>Email:</strong> {debugInfo.email || 'N/A'}</li>
            <li><strong>Role from Auth:</strong> {debugInfo.roleFromAuth || 'N/A'}</li>
            <li><strong>Local User Match:</strong> {debugInfo.localUser ? `${debugInfo.localUser.email} (${debugInfo.localUser.role})` : 'None'}</li>
            <li><strong>Final Role:</strong> {debugInfo.finalRole || 'N/A'}</li>
          </ul>
        </section>
        <p>
          <Link href="/">Back to Board</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Manager Admin</h1>
      <p>Manage vehicles, user roles, and track team performance.</p>

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
        <h3>Add Vehicle</h3>
        <AddVehicle onAdd={onAddVehicle} />
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h3>Live Vehicle List</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Stock #</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Color</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Year</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Make/Model</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>{v.stockNumber || 'N/A'}</td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: v.color || '#ffffff', border: '1px solid #d1d5db', borderRadius: '2px' }}></div>
                    {getColorLabel(v.color)}
                  </div>
                </td>
                <td style={{ padding: '0.5rem' }}>{v.year || 'N/A'}</td>
                <td style={{ padding: '0.5rem' }}>{v.make} {v.model}</td>
                <td style={{ padding: '0.5rem' }}>{v.status}</td>
                <td style={{ padding: '0.5rem' }}>
                  <button style={{ padding: '0.3rem 0.5rem', border: '1px solid #ef4444', background: '#ef4444', color: '#fff' }} onClick={() => onDeleteVehicle(v.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <UserManagement
        users={users}
        onRoleUpdate={onUpdateUserRole}
        onRemoveUser={onRemoveUser}
        onSetPassword={onSetUserPassword}
        protectedUserEmails={defaultUsers.map((u) => u.email.toLowerCase())}
      />

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
        <h3>Activity Analytics</h3>
        {performance.length === 0 ? (
          <p>No activity yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {performance.map((stat) => (
              <li key={stat.actor}>{stat.actor}: {stat.moved} moves</li>
            ))}
          </ul>
        )}
      </section>

      <AuditLog entries={auditEvents} lastPruned={auditLastPruned} />

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
        <h3>Debug Info</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><strong>Email:</strong> {debugInfo.email || 'N/A'}</li>
          <li><strong>Role from Auth:</strong> {debugInfo.roleFromAuth || 'N/A'}</li>
          <li><strong>Local User Match:</strong> {debugInfo.localUser ? `${debugInfo.localUser.email} (${debugInfo.localUser.role})` : 'None'}</li>
          <li><strong>Final Role:</strong> {debugInfo.finalRole || 'N/A'}</li>
        </ul>
      </section>

      <p style={{ marginTop: '1rem' }}>
        <Link href="/">Back to Board</Link>
      </p>
    </main>
  );
}
