import VehicleCard from './VehicleCard';

export default function Column({
  status,
  vehicles,
  onDragOver,
  onDrop,
  onDragStart,
  onNext,
  onDelete,
  onUpdateNotes,
  stageLimitHours = 72,
  variant = 'default',
  emptyLabel = 'No vehicles',
  actionLabel = 'Next Stage',
}) {
  const overdueCount = vehicles.filter((v) => {
    if (!v.stageEnteredAt || !stageLimitHours) return false;
    const ms = new Date(v.stageEnteredAt).getTime();
    if (!Number.isFinite(ms)) return false;
    return Date.now() - ms > stageLimitHours * 60 * 60 * 1000;
  }).length;

  const isQuickClean = variant === 'quick-clean';

  return (
    <section
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
      style={{
        background: isQuickClean ? '#eaf4ef' : '#e5e7eb',
        border: isQuickClean ? '1px solid #b6d7c2' : '1px solid transparent',
        borderRadius: '0.8rem',
        padding: '1rem',
        minHeight: '420px',
      }}
    >
      <h2 style={{ borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{status}</span>
        {overdueCount > 0 && (
          <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '999px', padding: '0.15rem 0.45rem' }}>
            {overdueCount} overdue
          </span>
        )}
      </h2>
      <div style={{ marginTop: '1rem' }}>
        {vehicles.length === 0 && <p style={{ color: '#6b7280' }}>{emptyLabel}</p>}
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onDragStart={onDragStart}
            onAction={onNext || null}
            actionLabel={actionLabel}
            onDelete={onDelete}
            onUpdateNotes={onUpdateNotes}
            stageLimitHours={stageLimitHours}
          />
        ))}
      </div>
    </section>
  );
}
