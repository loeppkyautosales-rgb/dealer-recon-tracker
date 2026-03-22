import { useState } from 'react';

export default function AddVehicle({ onAdd }) {
  const [stockNumber, setStockNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('Black');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stockNumber.trim()) return;

    onAdd({
      stockNumber: stockNumber.toUpperCase(),
      make,
      model,
      year,
      color,
      status: 'New Inventory Received',
      notes: '',
    });

    setStockNumber('');
    setMake('');
    setModel('');
    setYear('');
    setColor('Black');
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
          <option value="Black">Black</option>
          <option value="White">White</option>
          <option value="Gray">Gray</option>
          <option value="Blue">Blue</option>
          <option value="Red">Red</option>
          <option value="Green">Green</option>
          <option value="Brown">Brown</option>
          <option value="Yellow">Yellow</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
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
