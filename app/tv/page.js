'use client';

import { useEffect, useMemo, useState } from 'react';
import { statuses } from '../../lib/statuses';
import { fetchVehiclesShared, subscribeSharedChanges } from '../../lib/sharedData';
import Column from '../../components/Column';

export default function TvModePage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    let mounted = true;
    const refreshVehicles = async () => {
      const next = await fetchVehiclesShared();
      if (mounted) setVehicles(next || []);
    };

    refreshVehicles();
    const unsubscribeShared = subscribeSharedChanges(refreshVehicles);

    const intervalId = setInterval(() => {
      refreshVehicles();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      unsubscribeShared();
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
