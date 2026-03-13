export default function VehicleCard({ vehicle, onDragStart, onAction }) {
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
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{vehicle.vin || 'Unknown VIN'}</h3>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{vehicle.year || 'N/A'}</span>
      </div>
      <p style={{ margin: '0.25rem 0', color: '#374151' }}>
        {vehicle.make} {vehicle.model}
      </p>
      <small style={{ color: '#6b7280' }}>Status: {vehicle.status}</small>
      {onAction && (
        <button
          onClick={() => onAction(vehicle.id)}
          style={{ marginTop: '0.5rem', width: '100%', border: '1px solid #0b76f6', background: '#0b76f6', color: 'white', padding: '0.4rem', borderRadius: '0.3rem' }}
        >
          Next Stage
        </button>
      )}
    </article>
  );
}
