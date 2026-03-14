import VehicleCard from './VehicleCard';

export default function Column({ status, vehicles, onDragOver, onDrop, onDragStart, onNext, onDelete, onUpdateNotes }) {
  return (
    <section
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
      style={{
        background: '#e5e7eb',
        borderRadius: '0.8rem',
        padding: '1rem',
        minHeight: '420px',
      }}
    >
      <h2 style={{ borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>{status}</h2>
      <div style={{ marginTop: '1rem' }}>
        {vehicles.length === 0 && <p style={{ color: '#6b7280' }}>No vehicles</p>}
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onDragStart={onDragStart}
            onAction={onNext ? onNext : null}
            onDelete={onDelete}
            onUpdateNotes={onUpdateNotes}
          />
        ))}
      </div>
    </section>
  );
}
