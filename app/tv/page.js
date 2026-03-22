'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeStatus, QUICK_CLEAN_STATUS, statuses } from '../../lib/statuses';
import { fetchVehiclesShared, subscribeSharedChanges } from '../../lib/sharedData';

function useAutoScroll(ref, axis = 'y', speed = 0.6) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let direction = 1;
    const step = () => {
      const node = ref.current;
      if (!node) return;

      if (axis === 'y') {
        const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
        if (maxScroll <= 0) return;
        if (node.scrollTop >= maxScroll) direction = -1;
        if (node.scrollTop <= 0) direction = 1;
        node.scrollTop += speed * direction;
      } else {
        const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
        if (maxScroll <= 0) return;
        if (node.scrollLeft >= maxScroll) direction = -1;
        if (node.scrollLeft <= 0) direction = 1;
        node.scrollLeft += speed * direction;
      }
    };

    const intervalId = window.setInterval(step, 45);
    return () => window.clearInterval(intervalId);
  }, [axis, ref, speed]);
}

function CompactCard({ vehicle, minimal = false }) {
  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderLeft: `4px solid ${vehicle.color || '#ffffff'}`,
        borderRadius: '0.55rem',
        padding: minimal ? '0.5rem' : '0.65rem',
        minWidth: minimal ? '170px' : 'unset',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem' }}>
        <strong style={{ fontSize: minimal ? '0.82rem' : '0.9rem' }}>{vehicle.stockNumber || 'N/A'}</strong>
        <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{vehicle.year || 'N/A'}</span>
      </div>
      <div style={{ fontSize: minimal ? '0.75rem' : '0.8rem', color: '#374151', marginTop: '0.2rem' }}>
        {(vehicle.make || '').trim()} {(vehicle.model || '').trim()}
      </div>
    </article>
  );
}

function TvReconColumn({ status, vehicles }) {
  const scrollerRef = useRef(null);
  useAutoScroll(scrollerRef, 'y', 0.55);

  return (
    <section
      style={{
        background: '#e5e7eb',
        border: '1px solid #d1d5db',
        borderRadius: '0.8rem',
        padding: '0.65rem',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        minHeight: 0,
      }}
    >
      <h2 style={{ margin: 0, fontSize: '0.95rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.35rem' }}>
        {status} ({vehicles.length})
      </h2>
      <div
        ref={scrollerRef}
        style={{
          marginTop: '0.45rem',
          overflowY: 'auto',
          paddingRight: '0.2rem',
          display: 'grid',
          alignContent: 'start',
          gap: '0.45rem',
          minHeight: 0,
        }}
      >
        {vehicles.length === 0 && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>No vehicles</p>}
        {vehicles.map((vehicle) => (
          <CompactCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </section>
  );
}

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
    const normalizedVehicles = (vehicles || []).map((vehicle) => ({
      ...vehicle,
      status: normalizeStatus(vehicle.status),
    }));

    return statuses.reduce((acc, status) => {
      acc[status] = normalizedVehicles.filter((v) => v.status === status);
      return acc;
    }, {});
  }, [vehicles]);

  const quickCleanVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => normalizeStatus(vehicle.status) === QUICK_CLEAN_STATUS);
  }, [vehicles]);

  const quickCleanRef = useRef(null);
  useAutoScroll(quickCleanRef, 'x', 0.75);

  return (
    <main style={{ height: '100vh', padding: '0.8rem', background: '#f3f5f7', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: '0.8rem',
          height: '100%',
        }}
      >
        <section style={{ minHeight: 0, display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {statuses.map((status) => (
            <TvReconColumn key={status} status={status} vehicles={grouped[status] || []} />
          ))}
        </section>

        <section
          style={{
            minHeight: 0,
            borderRadius: '0.85rem',
            border: '1px solid #b6d7c2',
            background: '#eaf4ef',
            padding: '0.7rem',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', borderBottom: '1px solid #b6d7c2', paddingBottom: '0.4rem' }}>
            {QUICK_CLEAN_STATUS} ({quickCleanVehicles.length})
          </h2>
          <div
            ref={quickCleanRef}
            style={{
              marginTop: '0.5rem',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'inline-flex', gap: '0.55rem', paddingBottom: '0.25rem' }}>
              {quickCleanVehicles.length === 0 && (
                <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>No quick clean requests</p>
              )}
              {quickCleanVehicles.map((vehicle) => (
                <CompactCard key={vehicle.id} vehicle={vehicle} minimal />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
