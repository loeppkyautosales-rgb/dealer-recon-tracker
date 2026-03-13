import { useState } from 'react';

export default function AddVehicle({ onAdd }) {
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vin.trim()) return;
    onAdd({ vin: vin.toUpperCase(), make, model, year, status: 'Queued' });
    setVin('');
    setMake('');
    setModel('');
    setYear('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.65rem', maxWidth: '460px', marginBottom: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="VIN" value={vin} required onChange={(e) => setVin(e.target.value)} />
        <input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
        <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
      </div>
      <button type="submit" style={{ padding: '0.6rem 1rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff', borderRadius: '0.35rem' }}>
        Add Vehicle
      </button>
    </form>
  );
}
