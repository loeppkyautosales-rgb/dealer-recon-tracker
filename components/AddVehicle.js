import { useState } from 'react';

export default function AddVehicle({ onAdd }) {
  const [stockNumber, setStockNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('#000000');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stockNumber.trim()) return;

    onAdd({
      stockNumber: stockNumber.toUpperCase(),
      make,
      model,
      year,
      color,
      status: 'New Arrivals',
      notes: '',
    });

    setStockNumber('');
    setMake('');
    setModel('');
    setYear('');
    setColor('#000000');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.65rem', maxWidth: '460px', marginBottom: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input
          placeholder="Stock Number (required)"
          value={stockNumber}
          required
          onChange={(e) => setStockNumber(e.target.value)}
        />
        <select value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="#000000">Black</option>
          <option value="#ffffff">White</option>
          <option value="#8b8c8d">Gray</option>
          <option value="#1f2937">Charcoal</option>
          <option value="#0b3d91">Blue</option>
          <option value="#b91c1c">Red</option>
          <option value="#065f46">Green</option>
          <option value="#92400e">Brown</option>
          <option value="#eab308">Yellow</option>
          <option value="#6d28d9">Purple</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
        <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      <button type="submit" style={{ padding: '0.6rem 1rem', border: '1px solid #0b76f6', background: '#0b76f6', color: '#fff', borderRadius: '0.35rem' }}>
        Add Vehicle
      </button>
    </form>
  );
}
