import { useState } from 'react';

export default function VehicleCard({ vehicle, onDragStart, onAction, onDelete, onUpdateNotes }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(vehicle.notes || '');

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(vehicle.id, notes);
    }
  };
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, vehicle.id)}
      style={{
        background: 'white',
        padding: '0.8rem',
        borderRadius: '0.6rem',
        boxShadow: '0 1px 3px rgba(15,23,42,.1)',
        marginBottom: '0.75rem',
        borderLeft: `4px solid ${vehicle.color || '#ffffff'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{vehicle.stockNumber || 'Unknown Stock #'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{vehicle.year || 'N/A'}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      <p style={{ margin: '0.25rem 0', color: '#374151' }}>
        {vehicle.make} {vehicle.model}
      </p>
      <small style={{ color: '#6b7280' }}>Status: {vehicle.status}</small>
      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            style={{ width: '100%', minHeight: '60px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.3rem', resize: 'vertical' }}
          />
          <button
            onClick={handleSaveNotes}
            style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white', borderRadius: '0.3rem', cursor: 'pointer' }}
          >
            Save Notes
          </button>
        </div>
      )}
      <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.3rem' }}>
        {onAction && (
          <button
            onClick={() => onAction(vehicle.id)}
            style={{ width: '100%', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white', padding: '0.4rem', borderRadius: '0.3rem' }}
          >
            Next Stage
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(vehicle.id)}
            style={{ width: '100%', border: '1px solid #ef4444', background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '0.3rem' }}
          >
            Delete (Manager)
          </button>
        )}
      </div>
    </article>
  );
}
