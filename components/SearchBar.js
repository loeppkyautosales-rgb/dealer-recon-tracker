export default function SearchBar({ value, onChange }) {
  return (
    <div style={{ marginBottom: '1rem', maxWidth: '460px' }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search VIN / Make / Model"
        style={{ width: '100%', padding: '0.6rem', borderRadius: '0.35rem', border: '1px solid #d1d5db' }}
      />
    </div>
  );
}
