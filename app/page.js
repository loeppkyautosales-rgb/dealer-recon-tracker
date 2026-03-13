import Board from '../components/Board';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Dealer Recon Board</h1>
      <p>Drag and drop vehicles through recon stages.</p>
      <Board />
    </main>
  );
}
