'use client';

import { useEffect, useMemo, useState } from 'react';
import { statuses } from '../../lib/statuses';
import { loadVehicles, STORAGE_KEYS } from '../../lib/persistence';
import Column from '../../components/Column';

export default function TvModePage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    setVehicles(loadVehicles());

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.vehicles) {
        setVehicles(loadVehicles());
      }
    };

    const intervalId = setInterval(() => {
      setVehicles(loadVehicles());
    }, 5 * 60 * 1000);

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, []);

  const grouped = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = vehicles.filter((v) => v.status === status);
      return acc;
    }, {});
  }, [vehicles]);

  return (
    <main style={{ padding: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {statuses.map((status) => (
          <Column
            key={status}
            status={status}
            vehicles={grouped[status] || []}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {}}
            onDragStart={() => {}}
            onNext={null}
            onDelete={null}
            onUpdateNotes={null}
          />
        ))}
      </div>
    </main>
  );
}
