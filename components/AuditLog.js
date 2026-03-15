'use client';

export default function AuditLog({ entries, lastPruned, onPrint, onExport, lastUpdated, sectionId = 'audit-log' }) {
  if (!entries || entries.length === 0) {
    return <div style={{ marginTop: '1.5rem' }}>No audit events yet.</div>;
  }

  return (
    <section id={sectionId} style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Audit Log</h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff' }}
            >
              Export CSV
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', border: '1px solid #111827', background: '#fff', color: '#111827' }}
            >
              Print
            </button>
          )}
        </div>
      </div>
      <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
        Records older than 60 days are automatically pruned.
        {lastPruned && (
          <span> Last cleaned: {new Date(lastPruned).toLocaleString()}.</span>
        )}
        {lastUpdated && (
          <span> Last updated: {new Date(lastUpdated).toLocaleString()}.</span>
        )}
      </p>
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
