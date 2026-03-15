'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { statuses } from '../lib/statuses';
import { appendAuditEvent, loadVehicles, saveVehicles, STORAGE_KEYS } from '../lib/persistence';
import Column from './Column';
import AddVehicle from './AddVehicle';
import SearchBar from './SearchBar';
import { getCurrentUser, signOut } from '../lib/auth';

const initialVehicles = [];

export default function Board() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [users, setUsers] = useState([
    { id: 'u1', email: 'buddy@loeppkyauto.ca', role: 'manager' },
    { id: 'u2', email: 'chris@loeppkyauto.ca', role: 'manager' },
    { id: 'u3', email: 'loeppky22@gmail.com', role: 'manager' },
    { id: 'u4', email: 'vinceloeppky@hotmail.com', role: 'manager' },
    { id: 'u5', email: 'loeppky2001@protonmail.com', role: 'manager' },
  ]);

  useEffect(() => {
    const stored = loadVehicles();
    if (stored && stored.length) {
      setVehicles(stored);
    }

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.vehicles) {
        setVehicles(loadVehicles());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
    const role = user.app_metadata?.role || user.user_metadata?.role || user.role || 'user';
    if (role === 'manager') return true;

    const localUser = users.find((u) => u.email === user.email || u.id === user.id);
    return localUser?.role === 'manager';
  }, [user, users]);

  const handleAdd = (newVehicle) => {
    const newItem = { ...newVehicle, id: crypto.randomUUID() };
    setVehicles((prev) => {
      const next = [newItem, ...prev];
      saveVehicles(next);
      return next;
    });

    appendAuditEvent({
      actor: user?.email || 'unknown',
      action: 'created',
      stockNumber: newItem.stockNumber,
      year: newItem.year,
      make: newItem.make,
      model: newItem.model,
      status: newItem.status,
      time: new Date().toISOString(),
    });
  };

  const handleDragStart = (event, vehicleId) => {
    event.dataTransfer.setData('text/plain', vehicleId);
  };

  const handleDrop = (event, targetStatus) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');

    setVehicles((prev) => {
      const next = prev.map((v) => {
        if (v.id !== id) return v;
        const from = v.status;
        appendAuditEvent({
          actor: user?.email || 'unknown',
          action: `moved from ${from} to ${targetStatus}`,
          stockNumber: v.stockNumber,
          year: v.year,
          make: v.make,
          model: v.model,
          status: targetStatus,
          time: new Date().toISOString(),
        });
        return { ...v, status: targetStatus };
      });
      saveVehicles(next);
      return next;
    });
  };

  const handleNext = (id) => {
    setVehicles((prev) => {
      const next = prev.map((v) => {
        const index = statuses.indexOf(v.status);
        if (v.id !== id || index === -1 || index === statuses.length - 1) return v;

        const nextStatus = statuses[index + 1];
        appendAuditEvent({
          actor: user?.email || 'unknown',
          action: `moved from ${v.status} to ${nextStatus}`,
          stockNumber: v.stockNumber,
          year: v.year,
          make: v.make,
          model: v.model,
          status: nextStatus,
          time: new Date().toISOString(),
        });

        return { ...v, status: nextStatus };
      });
      saveVehicles(next);
      return next;
    });
  };

  const handleUpdateNotes = (id, newNotes) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, notes: newNotes } : v));
      saveVehicles(next);
      return next;
    });
  };

  const handleDelete = (id) => {
    if (!isManager) return;

    const deleted = vehicles.find((v) => v.id === id);

    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveVehicles(next);
      return next;
    });

    if (deleted) {
      appendAuditEvent({
        actor: user?.email || 'unknown',
        action: 'deleted',
        stockNumber: deleted.stockNumber,
        year: deleted.year,
        make: deleted.make,
        model: deleted.model,
        status: deleted.status,
        time: new Date().toISOString(),
      });
    }
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
        <span style={{ fontSize: '0.95rem', color: '#111827' }}>
          Logged in as {user.email} ({isManager ? 'Manager' : 'User'})
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/password" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.35rem', border: '1px solid #9ca3af', background: '#f3f4f6', color: '#111827' }}>
              Password Settings
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
