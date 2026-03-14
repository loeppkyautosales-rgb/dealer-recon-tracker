'use client';

export default function AuditLog({ entries }) {
  if (!entries || entries.length === 0) {
    return <div style={{ marginTop: '1.5rem' }}>No audit events yet.</div>;
  }

  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <h3>Audit Log</h3>
      <ul style={{ maxHeight: '260px', overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
        {entries.map((entry, idx) => {
          const vehicleLabel = entry.stockNumber
            ? `${entry.stockNumber} (${entry.year || 'n/a'})`
            : entry.vin || 'unknown vehicle';
          return (
            <li key={`${entry.time}-${idx}`} style={{ borderTop: '1px solid #e5e7eb', padding: '0.5rem 0' }}>
              <strong>{entry.actor}</strong> {entry.action} <em>{vehicleLabel}</em> at {new Date(entry.time).toLocaleTimeString()}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
