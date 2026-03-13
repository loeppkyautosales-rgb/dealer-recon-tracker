import Board from '../components/Board';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Recon Board</h1>
      <p>Drag and drop vehicles through recon stages.</p>
      <Board />
    </main>
  );
}
