import { useEffect, useState } from 'react';
import { formatDaysHours, getCurrentStageElapsedMs, toMs } from '../lib/time';

export default function VehicleCard({
  vehicle,
  onDragStart,
  onAction,
  onDelete,
  onUpdateNotes,
  stageLimitHours = 72,
  actionLabel = 'Next Stage',
  compact = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(vehicle.notes || '');
  const [saveTimer, setSaveTimer] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNotes(vehicle.notes || '');
  }, [vehicle.notes]);

  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [saveTimer]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const scheduleSave = (value) => {
    setNotes(value);
    if (!onUpdateNotes) return;
    if (saveTimer) clearTimeout(saveTimer);
    setSaveTimer(
      setTimeout(() => {
        onUpdateNotes(vehicle.id, value);
      }, 500),
    );
  };

  const createdAtMs = toMs(vehicle.createdAt) || now;
  const totalElapsedMs = Math.max(0, now - createdAtMs);
  const stageElapsedMs = getCurrentStageElapsedMs(vehicle, now);
  const totalElapsedLabel = formatDaysHours(totalElapsedMs);
  const stageElapsedLabel = formatDaysHours(stageElapsedMs);
  const isStageOverdue = stageLimitHours > 0 && stageElapsedMs > stageLimitHours * 60 * 60 * 1000;

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, vehicle.id)}
      style={{
        background: 'white',
        padding: compact ? '0.8rem' : '0.65rem',
        borderRadius: '0.6rem',
        boxShadow: '0 1px 3px rgba(15,23,42,.1)',
        marginBottom: '0.6rem',
        borderLeft: `4px solid ${vehicle.color || '#ffffff'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: compact ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', alignItems: compact ? 'flex-start' : 'center', gap: '0.4rem', flexDirection: compact ? 'column' : 'row' }}>
          <h3 style={{ margin: 0, fontSize: compact ? '1rem' : '0.92rem', overflowWrap: 'anywhere' }}>{vehicle.stockNumber || 'Unknown Stock #'}</h3>
          {isStageOverdue && (
            <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '999px', padding: '0.1rem 0.45rem' }}>
              Warning
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: compact ? '0.85rem' : '0.8rem', color: '#6b7280' }}>{vehicle.year || 'N/A'}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      <p style={{ margin: '0.25rem 0', color: '#374151', fontSize: compact ? '0.95rem' : '0.9rem', overflowWrap: 'anywhere' }}>
        {vehicle.make} {vehicle.model}
      </p>
      <small style={{ color: '#6b7280', display: 'block', fontSize: compact ? '0.82rem' : '0.75rem' }}>Total Elapsed: {totalElapsedLabel}</small>
      <small style={{ color: '#6b7280', display: 'block', marginTop: '0.15rem', fontSize: compact ? '0.82rem' : '0.75rem' }}>Time In Stage: {stageElapsedLabel}</small>
      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
          <textarea
            value={notes}
            onChange={(e) => scheduleSave(e.target.value)}
            placeholder="Add notes..."
            style={{ width: '100%', minHeight: '60px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.3rem', resize: 'vertical' }}
          />
        </div>
      )}
      <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.3rem' }}>
        {onAction && (
          <button
            onClick={() => onAction(vehicle.id)}
            style={{ width: '100%', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white', padding: compact ? '0.5rem' : '0.35rem', borderRadius: '0.3rem', fontSize: compact ? '0.9rem' : '0.82rem' }}
          >
            {actionLabel}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm('Delete this vehicle? This cannot be undone.')) {
                onDelete(vehicle.id);
              }
            }}
            style={{ width: '100%', border: '1px solid #ef4444', background: '#ef4444', color: 'white', padding: compact ? '0.5rem' : '0.4rem', borderRadius: '0.3rem', fontSize: compact ? '0.9rem' : '0.82rem' }}
          >
            Delete (Manager)
          </button>
        )}
      </div>
    </article>
  );
}
