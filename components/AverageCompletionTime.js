'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadVehicles } from '../lib/persistence';
import { formatWeeksDaysHours, toMs } from '../lib/time';
import { supabase } from '../lib/supabaseClient';

export default function AverageCompletionTime() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data?.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    setVehicles(loadVehicles());

    const handleStorage = (event) => {
      if (event.key === 'dealer-recon:vehicles') {
        setVehicles(loadVehicles());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const summary = useMemo(() => {
    const completed = vehicles.filter((v) => v.status === 'Recon Complete' && v.createdAt && v.completedAt);
    if (!completed.length) {
      return { label: 'N/A', completedCount: 0, skippedCount: vehicles.length };
    }

    const durations = completed
      .map((v) => {
        const start = toMs(v.createdAt);
        const end = toMs(v.completedAt);
        if (!start || !end) return null;
        return Math.max(0, end - start);
      })
      .filter((d) => d !== null);

    const skippedCount = vehicles.filter((v) => v.status === 'Recon Complete').length - durations.length;
    if (!durations.length) return { label: 'N/A', completedCount: 0, skippedCount };
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return {
      label: formatWeeksDaysHours(avg),
      completedCount: durations.length,
      skippedCount,
    };
  }, [vehicles]);

  if (!isLoggedIn) return null;

  return (
    <div>
      <p style={{ marginBottom: '0.2rem' }}>
        Average Completion Time: {summary.label}{' '}
        <span title="Calculated from vehicles that reached Recon Complete and have both created and completion timestamps." style={{ cursor: 'help', borderBottom: '1px dotted #6b7280' }}>
          (i)
        </span>
      </p>
      <small style={{ color: '#6b7280' }}>
        Included: {summary.completedCount} complete vehicles. Skipped: {summary.skippedCount} incomplete/missing timestamps.
      </small>
    </div>
  );
}
