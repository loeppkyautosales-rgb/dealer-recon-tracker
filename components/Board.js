'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { statuses } from '../lib/statuses';
import { loadUsers, saveVehicles, STORAGE_KEYS } from '../lib/persistence';
import {
  appendAuditEventShared,
  createVehicleShared,
  deleteVehicleShared,
  fetchStageSlaHoursShared,
  fetchVehiclesShared,
  getSyncHealthSnapshot,
  subscribeSharedChanges,
  updateVehicleShared,
} from '../lib/sharedData';
import Column from './Column';
import AddVehicle from './AddVehicle';
import SearchBar from './SearchBar';
import { getCurrentUser, signOut } from '../lib/auth';

const initialVehicles = [];
const defaultUsers = [
  { id: 'u1', email: 'buddy@loeppkyauto.ca', role: 'manager' },
  { id: 'u2', email: 'chris@loeppkyauto.ca', role: 'manager' },
  { id: 'u3', email: 'loeppky22@gmail.com', role: 'manager' },
  { id: 'u4', email: 'vinceloeppky@hotmail.com', role: 'manager' },
  { id: 'u5', email: 'loeppky2001@protonmail.com', role: 'manager' },
];
const defaultStageSlaHours = Object.fromEntries(statuses.map((s) => [s, 72]));

function mergeUsers(defaultList, storedList) {
  const map = new Map(defaultList.map((u) => [u.email.toLowerCase(), { ...u }]));
  (storedList || []).forEach((u) => {
    const key = (u.email || '').toLowerCase();
    if (!key) return;
    map.set(key, { ...map.get(key), ...u });
  });
  return Array.from(map.values());
}

export default function Board() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [users, setUsers] = useState(defaultUsers);
  const [stageSlaHours, setStageSlaHours] = useState(defaultStageSlaHours);
  const [syncHealth, setSyncHealth] = useState(getSyncHealthSnapshot());

  useEffect(() => {
    let mounted = true;

    const refreshSyncBadge = () => {
      if (!mounted) return;
      setSyncHealth(getSyncHealthSnapshot());
    };

    const refreshShared = async () => {
      const [nextVehicles, nextSla] = await Promise.all([
        fetchVehiclesShared(),
        fetchStageSlaHoursShared(defaultStageSlaHours),
      ]);

      if (!mounted) return;
      setVehicles(nextVehicles || []);
      setStageSlaHours({ ...defaultStageSlaHours, ...(nextSla || {}) });
      refreshSyncBadge();
    };

    refreshShared();

    const storedUsers = loadUsers([]);
    setUsers(mergeUsers(defaultUsers, storedUsers));

    const unsubscribeShared = subscribeSharedChanges(refreshShared);
    const handleUsersStorage = (event) => {
      if (event.key === STORAGE_KEYS.users) {
        setUsers(mergeUsers(defaultUsers, loadUsers([])));
      }
    };

    window.addEventListener('storage', handleUsersStorage);
    return () => {
      mounted = false;
      unsubscribeShared();
      window.removeEventListener('storage', handleUsersStorage);
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch (err) {
        console.error('Auth check failed', err);
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((v) =>
      [v.stockNumber, v.make, v.model, v.year, v.status].join(' ').toLowerCase().includes(term),
    );
  }, [searchText, vehicles]);

  const isManager = useMemo(() => {
    if (!user) return false;
    const localUser = users.find((u) => u.email === user.email || u.id === user.id);
    const roleFromAuth = user.app_metadata?.role || user.user_metadata?.role || user.role || 'user';
    const resolvedRole = localUser?.role || roleFromAuth;
    return resolvedRole === 'manager';
  }, [user, users]);

  const handleAdd = async (newVehicle) => {
    const nowIso = new Date().toISOString();
    const newItem = {
      ...newVehicle,
      id: crypto.randomUUID(),
      createdAt: nowIso,
      stageEnteredAt: nowIso,
    };
    setVehicles((prev) => {
      const next = [newItem, ...prev];
      saveVehicles(next);
      return next;
    });

    const entry = {
      actor: user?.email || 'unknown',
      action: 'created',
      stockNumber: newItem.stockNumber,
      year: newItem.year,
      make: newItem.make,
      model: newItem.model,
      status: newItem.status,
      time: new Date().toISOString(),
    };

    await createVehicleShared(newItem);
    await appendAuditEventShared(entry);
    setSyncHealth(getSyncHealthSnapshot());
  };

  const handleDragStart = (event, vehicleId) => {
    event.dataTransfer.setData('text/plain', vehicleId);
  };

  const handleDrop = async (event, targetStatus) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    const movedVehicle = vehicles.find((v) => v.id === id);
    if (!movedVehicle) return;
    if (movedVehicle.status === targetStatus) return;

    const nowIso = new Date().toISOString();
    const from = movedVehicle.status;
    const updates = {
      status: targetStatus,
      stageEnteredAt: nowIso,
      completedAt: targetStatus === 'Recon Complete' ? (movedVehicle.completedAt || nowIso) : movedVehicle.completedAt,
    };

    setVehicles((prev) => {
      const next = prev.map((v) => {
        if (v.id !== id) return v;
        return {
          ...v,
          ...updates,
        };
      });
      saveVehicles(next);
      return next;
    });

    await updateVehicleShared(id, updates);
    await appendAuditEventShared({
      actor: user?.email || 'unknown',
      action: `moved from ${from} to ${targetStatus}`,
      stockNumber: movedVehicle.stockNumber,
      year: movedVehicle.year,
      make: movedVehicle.make,
      model: movedVehicle.model,
      status: targetStatus,
      time: new Date().toISOString(),
    });
    setSyncHealth(getSyncHealthSnapshot());
  };

  const handleNext = async (id) => {
    const current = vehicles.find((v) => v.id === id);
    if (!current) return;
    const index = statuses.indexOf(current.status);
    if (index === -1 || index === statuses.length - 1) return;

    const nowIso = new Date().toISOString();
    const nextStatus = statuses[index + 1];
    const updates = {
      status: nextStatus,
      stageEnteredAt: nowIso,
      completedAt: nextStatus === 'Recon Complete' ? (current.completedAt || nowIso) : current.completedAt,
    };

    setVehicles((prev) => {
      const next = prev.map((v) => {
        if (v.id !== id) return v;
        return { ...v, ...updates };
      });
      saveVehicles(next);
      return next;
    });

    await updateVehicleShared(id, updates);
    await appendAuditEventShared({
      actor: user?.email || 'unknown',
      action: `moved from ${current.status} to ${nextStatus}`,
      stockNumber: current.stockNumber,
      year: current.year,
      make: current.make,
      model: current.model,
      status: nextStatus,
      time: new Date().toISOString(),
    });
    setSyncHealth(getSyncHealthSnapshot());
  };

  const handleUpdateNotes = async (id, newNotes) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, notes: newNotes } : v));
      saveVehicles(next);
      return next;
    });

    await updateVehicleShared(id, { notes: newNotes });
    setSyncHealth(getSyncHealthSnapshot());
  };

  const handleDelete = async (id) => {
    if (!isManager) return;

    const deleted = vehicles.find((v) => v.id === id);
    if (!deleted) return;

    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveVehicles(next);
      return next;
    });

    await deleteVehicleShared(id);
    await appendAuditEventShared({
      actor: user?.email || 'unknown',
      action: 'deleted',
      stockNumber: deleted.stockNumber,
      year: deleted.year,
      make: deleted.make,
      model: deleted.model,
      status: deleted.status,
      time: new Date().toISOString(),
    });
    setSyncHealth(getSyncHealthSnapshot());
  };

  const onSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (loadingUser) {
    return <p>Checking login status...</p>;
  }

  if (!user) {
    return (
      <section style={{ marginTop: '1rem', border: '1px solid #d1d5db', borderRadius: '0.8rem', padding: '1rem', background: '#fff' }}>
        <h2>Authentication required</h2>
        <p>You must log in to view and edit the Recon Board.</p>
        <a href="/login" style={{ color: '#0b76f6', textDecoration: 'none', fontWeight: 600 }}>
          Go to Login
        </a>
      </section>
    );
  }

  return (
    <section style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem', color: '#111827' }}>
            Logged in as {user.email} ({isManager ? 'Manager' : 'User'})
          </span>
          <span
            title={syncHealth.detail || ''}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              borderRadius: '999px',
              border: syncHealth.mode === 'cloud' ? '1px solid #16a34a' : '1px solid #b45309',
              background: syncHealth.mode === 'cloud' ? '#dcfce7' : '#fef3c7',
              color: syncHealth.mode === 'cloud' ? '#166534' : '#92400e',
              padding: '0.2rem 0.55rem',
            }}
          >
            {syncHealth.mode === 'cloud' ? 'Connected to Cloud' : 'Local Fallback'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/password" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #9ca3af', background: '#f3f4f6', color: '#111827' }}>
              Password Settings
            </button>
          </Link>
          <Link href="/tv" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #9ca3af', background: '#f3f4f6', color: '#111827' }}>
              TV Mode
            </button>
          </Link>
          {isManager && (
            <Link href="/manager" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}>
                Manager Panel
              </button>
            </Link>
          )}
          <button
            onClick={onSignOut}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #9ca3af', background: '#f3f4f6' }}
          >
            Logout
          </button>
        </div>
      </div>

      {isManager && <AddVehicle onAdd={handleAdd} />}
      <SearchBar value={searchText} onChange={setSearchText} />

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {statuses.map((status) => {
          const boardVehicles = filtered.filter((v) => v.status === status);
          return (
            <Column
              key={status}
              status={status}
              vehicles={boardVehicles}
              stageLimitHours={stageSlaHours[status] || 72}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onNext={handleNext}
              onDelete={isManager ? handleDelete : null}
              onUpdateNotes={handleUpdateNotes}
            />
          );
        })}
      </div>
    </section>
  );
}
