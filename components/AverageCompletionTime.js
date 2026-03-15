'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchVehiclesShared, subscribeSharedChanges } from '../lib/sharedData';
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

    let mounted = true;
    const refreshVehicles = async () => {
      const next = await fetchVehiclesShared();
      if (mounted) setVehicles(next || []);
    };

    refreshVehicles();

    const unsubscribeShared = subscribeSharedChanges(refreshVehicles);
    const timer = window.setInterval(refreshVehicles, 60_000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeShared();
      window.clearInterval(timer);
    };
  }, []);

  const summary = useMemo(() => {
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const completed = vehicles.filter((v) => {
      if (v.status !== 'Recon Complete' || !v.createdAt || !v.completedAt) return false;
      const completedAtMs = toMs(v.completedAt);
      if (!completedAtMs) return false;
      return now - completedAtMs <= twoWeeksMs;
    });

    if (!completed.length) {
      return { label: 'N/A', completedCount: 0, skippedCount: 0, windowDays: 14 };
    }

    const durations = completed
      .map((v) => {
        const start = toMs(v.createdAt);
        const end = toMs(v.completedAt);
        if (!start || !end) return null;
        return Math.max(0, end - start);
      })
      .filter((d) => d !== null);

    const skippedCount = completed.length - durations.length;
    if (!durations.length) return { label: 'N/A', completedCount: 0, skippedCount, windowDays: 14 };
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return {
      label: formatWeeksDaysHours(avg),
      completedCount: durations.length,
      skippedCount,
      windowDays: 14,
    };
  }, [vehicles]);

  if (!isLoggedIn) return null;

  return (
    <div>
      <p style={{ marginBottom: '0.2rem' }}>
        Average Completion Time: {summary.label}{' '}
        <span title="Calculated from vehicles completed in the last 14 days using total elapsed time (created to completion)." style={{ cursor: 'help', borderBottom: '1px dotted #6b7280' }}>
          (i)
        </span>
      </p>
      <small style={{ color: '#6b7280' }}>
        Window: last {summary.windowDays} days. Included: {summary.completedCount} complete vehicles. Skipped: {summary.skippedCount} incomplete/missing timestamps.
      </small>
    </div>
  );
}
