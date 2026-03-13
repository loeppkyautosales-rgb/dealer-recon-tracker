'use client';

import { useMemo, useState } from 'react';
import { statuses } from '../lib/statuses';
import Column from './Column';
import AddVehicle from './AddVehicle';
import SearchBar from './SearchBar';

const initialVehicles = [
  { id: '1', vin: '1HGBH41JXMN109186', make: 'Honda', model: 'Civic', year: '2015', status: 'Queued' },
  { id: '2', vin: '2FTRX18W1XCA01234', make: 'Ford', model: 'F-150', year: '2018', status: 'In Progress' },
  { id: '3', vin: '5NPE24AF0FH101234', make: 'Hyundai', model: 'Sonata', year: '2017', status: 'Complete' },
];

export default function Board() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((v) =>
      [v.vin, v.make, v.model, v.year, v.status].join(' ').toLowerCase().includes(term),
    );
  }, [searchText, vehicles]);

  const handleAdd = (newVehicle) => {
    setVehicles((prev) => [{ ...newVehicle, id: crypto.randomUUID() }, ...prev]);
  };

  const handleDragStart = (event, vehicleId) => {
    event.dataTransfer.setData('text/plain', vehicleId);
  };

  const handleDrop = (event, targetStatus) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status: targetStatus } : v)));
  };

  const handleNext = (id) => {
    setVehicles((prev) => prev.map((v) => {
      const index = statuses.indexOf(v.status);
      if (v.id !== id || index === -1 || index === statuses.length - 1) return v;
      return { ...v, status: statuses[index + 1] };
    }));
  };

  return (
    <section style={{ marginTop: '1rem' }}>
      <AddVehicle onAdd={handleAdd} />
      <SearchBar value={searchText} onChange={setSearchText} />
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {statuses.map((status) => {
          const boardVehicles = filtered.filter((v) => v.status === status);
          return (
            <Column
              key={status}
              status={status}
              vehicles={boardVehicles}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onNext={handleNext}
            />
          );
        })}
      </div>
    </section>
  );
}
