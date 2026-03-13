'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { statuses } from '../../lib/statuses';
import AddVehicle from '../../components/AddVehicle';
import UserManagement from '../../components/UserManagement';
import AuditLog from '../../components/AuditLog';

const initialVehicles = [];

export default function ManagerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [auditEvents, setAuditEvents] = useState([]);
  const [users, setUsers] = useState([
    { id: 'u1', email: 'buddy@loeppkyauto.ca', role: 'manager' },
    { id: 'u2', email: 'chris@loeppkyauto.ca', role: 'manager' },
    { id: 'u3', email: 'loeppky22@gmail.com', role: 'manager' },
    { id: 'u4', email: 'vinceloeppky@hotmail.com', role: 'manager' },
    { id: 'u5', email: 'loeppky2001@protonmail.com', role: 'manager' },
  ]);

  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      const role = currentUser.app_metadata?.role || currentUser.user_metadata?.role || 'user';
      if (role !== 'manager') {
        router.push('/');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, [router]);

  const addAudit = (action, vehicle) => {
    setAuditEvents((prev) => [{ actor: user?.email || 'unknown', action, vin: vehicle.vin, time: new Date().toISOString() }, ...prev]);
  };

  const onAddVehicle = (vehicle) => {
    const newVehicle = { ...vehicle, id: crypto.randomUUID() };
    setVehicles((prev) => [newVehicle, ...prev]);
    addAudit('created', newVehicle);
  };

  const onDeleteVehicle = (id) => {
    const target = vehicles.find((v) => v.id === id);
    if (!target) return;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    addAudit('deleted', target);
  };

  const performance = useMemo(() => {
    const stats = {};
    auditEvents.forEach((entry) => {
      if (!stats[entry.actor]) stats[entry.actor] = 0;
      if (entry.action === 'moved' || entry.action === 'changed') stats[entry.actor] += 1;
    });
    return Object.entries(stats).map(([actor, moved]) => ({ actor, moved }));
  }, [auditEvents]);

  if (loading) {
    return <p>Loading manager panel...</p>;
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
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>VIN</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Make/Model</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>{v.vin}</td>
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

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
        <h3>Non-Manager Performance</h3>
        {performance.length === 0 ? (
          <p>No activity yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {performance.map((stat) => (
              <li key={stat.actor}>{stat.actor}: {stat.moved} actions</li>
            ))}
          </ul>
        )}
      </section>

      <AuditLog entries={auditEvents} />

      <p style={{ marginTop: '1rem' }}>
        <Link href="/">Back to Board</Link>
      </p>
    </main>
  );
}
