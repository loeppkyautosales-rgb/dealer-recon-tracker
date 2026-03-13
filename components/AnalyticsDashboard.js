'use client';

export default function AnalyticsDashboard({ vehicles }) {
  const total = vehicles.length;
  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const byMake = vehicles.reduce((acc, v) => {
    acc[v.make] = (acc[v.make] || 0) + 1;
    return acc;
  }, {});

  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', background: '#fff' }}>
      <h3>Recon Analytics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
        <div style={{ padding: '0.6rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 .35rem' }}>Total vehicles</p>
          <strong>{total}</strong>
        </div>
        <div style={{ padding: '0.6rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 .35rem' }}>Queued</p>
          <strong>{statusCounts['Queued'] || 0}</strong>
        </div>
        <div style={{ padding: '0.6rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 .35rem' }}>In Progress</p>
          <strong>{statusCounts['In Progress'] || 0}</strong>
        </div>
        <div style={{ padding: '0.6rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 .35rem' }}>Complete</p>
          <strong>{statusCounts['Complete'] || 0}</strong>
        </div>
      </div>
      <h4 style={{ marginTop: '1rem' }}>Top Makes</h4>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {Object.entries(byMake)
          .sort((a, b) => b[1] - a[1])
          .map(([make, count]) => (
            <li key={make} style={{ marginBottom: '0.3rem' }}>
              {make}: {count}
            </li>
          ))}
      </ul>
    </section>
  );
}
