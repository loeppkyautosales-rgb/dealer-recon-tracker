'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, managerSetUserPassword } from '../../lib/auth';
import { statuses } from '../../lib/statuses';
import { STORAGE_KEYS, appendAuditEvent, loadAuditEvents, loadAuditLastPruned, loadStageSlaHours, loadUsers, loadVehicles, saveStageSlaHours, saveUsers, saveVehicles } from '../../lib/persistence';
import { formatWeeksDaysHours, toMs } from '../../lib/time';
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

function escapeCsvValue(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManagerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLastPruned, setAuditLastPruned] = useState(null);
  const [stageSlaHours, setStageSlaHours] = useState(defaultStageSlaHours);
  const [users, setUsers] = useState(defaultUsers);
  const [lastUpdated, setLastUpdated] = useState({
    vehicles: null,
    audit: null,
    users: null,
  });

  const router = useRouter();

  useEffect(() => {
    const storedUsers = loadUsers([]);
    const mergedUsers = mergeUsers(defaultUsers, storedUsers);
    setUsers(mergedUsers);

    const storedVehicles = loadVehicles();
    if (storedVehicles.length) setVehicles(storedVehicles);
    setLastUpdated((prev) => ({ ...prev, vehicles: new Date().toISOString() }));

    const storedAudit = loadAuditEvents();
    if (storedAudit.length) setAuditEvents(storedAudit);
    setAuditLastPruned(loadAuditLastPruned());

    const storedSla = loadStageSlaHours(defaultStageSlaHours);
    setStageSlaHours({ ...defaultStageSlaHours, ...storedSla });

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.users) {
        const updatedStored = loadUsers([]);
        const updatedMerged = mergeUsers(defaultUsers, updatedStored);
        setUsers(updatedMerged);
        setLastUpdated((prev) => ({ ...prev, users: new Date().toISOString() }));
      }
      if (event.key === STORAGE_KEYS.vehicles) {
        setVehicles(loadVehicles());
        setLastUpdated((prev) => ({ ...prev, vehicles: new Date().toISOString() }));
      }
      if (event.key === STORAGE_KEYS.auditEvents) {
        setAuditEvents(loadAuditEvents());
        setAuditLastPruned(loadAuditLastPruned());
        setLastUpdated((prev) => ({ ...prev, audit: new Date().toISOString() }));
      }
      if (event.key === STORAGE_KEYS.stageSlaHours) {
        setStageSlaHours({ ...defaultStageSlaHours, ...loadStageSlaHours(defaultStageSlaHours) });
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
    setLastUpdated((prev) => ({ ...prev, audit: new Date().toISOString() }));
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
    setLastUpdated((prev) => ({ ...prev, vehicles: new Date().toISOString() }));
  };

  const onUpdateUserRole = (id, newRole) => {
    const target = users.find((u) => u.id === id);
    if (!target) return { error: 'User not found' };
    const isProtected = defaultUsers.some((u) => u.email.toLowerCase() === (target.email || '').toLowerCase());
    if (isProtected && newRole !== 'manager') {
      return { error: 'Core manager accounts cannot be downgraded.' };
    }

    const wouldBeManagers = users.filter((u) => {
      if (u.id === id) return newRole === 'manager';
      return u.role === 'manager';
    }).length;

    if (wouldBeManagers < 1) {
      return { error: 'At least one manager account must remain.' };
    }

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, role: newRole } : u));
      saveUsers(next);
      return next;
    });
    setLastUpdated((prev) => ({ ...prev, users: new Date().toISOString() }));
    return { ok: true };
  };

  const onRemoveUser = (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return { error: 'User not found' };
    const isProtected = defaultUsers.some((u) => u.email.toLowerCase() === (target.email || '').toLowerCase());
    if (isProtected) {
      return { error: 'Core manager accounts cannot be removed.' };
    }

    const managerCountAfter = users.filter((u) => u.id !== id && u.role === 'manager').length;
    if (target.role === 'manager' && managerCountAfter < 1) {
      return { error: 'At least one manager account must remain.' };
    }

    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveUsers(next);
      return next;
    });
    setLastUpdated((prev) => ({ ...prev, users: new Date().toISOString() }));
    return { ok: true };
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

  const onSaveSlaHours = (status, value) => {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    setStageSlaHours((prev) => {
      const next = { ...prev, [status]: safe };
      saveStageSlaHours(next);
      return next;
    });
  };

  const exportLiveVehiclesCsv = () => {
    const rows = [
      ['StockNumber', 'Color', 'Year', 'Make', 'Model', 'Status', 'CreatedAt', 'StageEnteredAt', 'CompletedAt'],
      ...vehicles.map((v) => [
        v.stockNumber,
        getColorLabel(v.color),
        v.year,
        v.make,
        v.model,
        v.status,
        v.createdAt || '',
        v.stageEnteredAt || '',
        v.completedAt || '',
      ]),
    ];
    downloadCsv('live-vehicle-list.csv', rows);
  };

  const exportAuditCsv = () => {
    const rows = [
      ['Time', 'Actor', 'Action', 'StockNumber', 'Year', 'Make', 'Model', 'Status'],
      ...auditEvents.map((e) => [e.time, e.actor, e.action, e.stockNumber, e.year, e.make, e.model, e.status]),
    ];
    downloadCsv('audit-log.csv', rows);
  };

  const printWeeklySummary = () => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const weekEvents = auditEvents.filter((e) => {
      const t = toMs(e.time);
      return t && now - t <= oneWeekMs;
    });

    const completed = vehicles.filter((v) => v.status === 'Recon Complete' && v.createdAt && v.completedAt);
    const durations = completed.map((v) => Math.max(0, (toMs(v.completedAt) || 0) - (toMs(v.createdAt) || 0))).filter((d) => d > 0);
    const avgCompletion = durations.length ? formatWeeksDaysHours(durations.reduce((a, b) => a + b, 0) / durations.length) : 'N/A';

    const movedByUser = weekEvents.reduce((acc, e) => {
      if (!String(e.action || '').startsWith('moved')) return acc;
      acc[e.actor] = (acc[e.actor] || 0) + 1;
      return acc;
    }, {});

    const stageCounts = statuses.map((s) => ({ status: s, count: vehicles.filter((v) => v.status === s).length }));

    const printWindow = window.open('', '_blank', 'width=1000,height=760');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Weekly Summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111827; }
            h1, h2 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          </style>
        </head>
        <body>
          <h1>Weekly Summary</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="grid">
            <div>
              <h2>Key Metrics</h2>
              <p>Total Vehicles: ${vehicles.length}</p>
              <p>Completed Vehicles: ${completed.length}</p>
              <p>Average Completion Time: ${avgCompletion}</p>
              <p>Weekly Audit Events: ${weekEvents.length}</p>
            </div>
            <div>
              <h2>Stage Distribution</h2>
              <table>
                <thead><tr><th>Stage</th><th>Count</th></tr></thead>
                <tbody>
                  ${stageCounts.map((s) => `<tr><td>${s.status}</td><td>${s.count}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <h2>User Move Activity (Last 7 days)</h2>
          <table>
            <thead><tr><th>User</th><th>Moves</th></tr></thead>
            <tbody>
              ${Object.entries(movedByUser).map(([actor, count]) => `<tr><td>${actor}</td><td>${count}</td></tr>`).join('') || '<tr><td colspan="2">No move activity this week</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const printAuditLog = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Audit Log</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111827; }
            h3 { margin-top: 0; }
            p { color: #6b7280; font-size: 0.85rem; margin: 4px 0 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 0.85rem; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h3>Audit Log</h3>
          <p>Printed: ${new Date().toLocaleString()} &mdash; ${auditEvents.length} events</p>
          <table>
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Vehicle</th></tr>
            </thead>
            <tbody>
              ${auditEvents.map((entry) => {
                const vehicleLabel = entry.stockNumber
                  ? `${entry.stockNumber} (${entry.year || 'n/a'})`
                  : entry.vin || 'unknown vehicle';
                return `<tr>
                  <td>${new Date(entry.time).toLocaleString()}</td>
                  <td>${entry.actor || ''}</td>
                  <td>${entry.action || ''}</td>
                  <td>${vehicleLabel}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const printSection = (sectionId, title) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111827; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            h3 { margin-top: 0; }
            button { display: none; }
          </style>
        </head>
        <body>
          ${section.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return <p>Loading manager panel...</p>;
  }

  if (!isManager) {
    return (
      <main className="container">
        <h1>Manager Portal</h1>
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
      <h1>Manager Portal</h1>
      <p>Manage vehicles, user roles, and track team performance.</p>

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #d1d5db' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Stage SLA Targets (Hours)</h3>
          <button
            type="button"
            onClick={printWeeklySummary}
            style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #111827', background: '#fff', color: '#111827' }}
          >
            Print Weekly Summary
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          {statuses.map((status) => (
            <label key={status} style={{ display: 'grid', gap: '0.3rem' }}>
              <span>{status}</span>
              <input
                type="number"
                min="1"
                value={stageSlaHours[status] || 72}
                onChange={(e) => onSaveSlaHours(status, e.target.value)}
                style={{ padding: '0.45rem' }}
              />
            </label>
          ))}
        </div>
      </section>

      <section id="live-vehicle-list" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Live Vehicle List</h3>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={exportLiveVehiclesCsv}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => printSection('live-vehicle-list', 'Live Vehicle List')}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #111827', background: '#fff', color: '#111827' }}
            >
              Print
            </button>
          </div>
        </div>
        {lastUpdated.vehicles && (
          <small style={{ color: '#6b7280' }}>Last updated: {new Date(lastUpdated.vehicles).toLocaleString()}</small>
        )}
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
                  <button
                    style={{ padding: '0.3rem 0.5rem', border: '1px solid #ef4444', background: '#ef4444', color: '#fff' }}
                    onClick={() => {
                      if (window.confirm('Delete this vehicle? This cannot be undone.')) {
                        onDeleteVehicle(v.id);
                      }
                    }}
                  >
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
        lastUpdated={lastUpdated.users}
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

      <AuditLog
        entries={auditEvents}
        lastPruned={auditLastPruned}
        lastUpdated={lastUpdated.audit}
        onExport={exportAuditCsv}
        sectionId="audit-log-section"
        onPrint={printAuditLog}
      />

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
