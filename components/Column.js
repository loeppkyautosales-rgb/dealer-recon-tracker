import VehicleCard from './VehicleCard';
import { getCurrentStageElapsedMs } from '../lib/time';

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
  compact = false,
}) {
  const overdueCount = vehicles.filter((v) => {
    if (!stageLimitHours) return false;
    return getCurrentStageElapsedMs(v) > stageLimitHours * 60 * 60 * 1000;
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
        padding: isQuickClean ? (compact ? '0.85rem' : '1rem') : (compact ? '0.85rem' : '0.75rem'),
        minHeight: isQuickClean ? (compact ? '320px' : '420px') : (compact ? '280px' : '380px'),
        minWidth: 0,
      }}
    >
      <h2 style={{ borderBottom: '1px solid #d1d5db', paddingBottom: '0.45rem', display: 'flex', alignItems: compact ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '0.35rem', fontSize: isQuickClean ? (compact ? '1rem' : '1.15rem') : (compact ? '1rem' : '0.92rem'), flexDirection: compact ? 'column' : 'row' }}>
        <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{status}</span>
        {overdueCount > 0 && (
          <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '999px', padding: '0.15rem 0.45rem' }}>
            {overdueCount} overdue
          </span>
        )}
      </h2>
      <div style={{ marginTop: isQuickClean ? '1rem' : '0.75rem' }}>
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
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}
