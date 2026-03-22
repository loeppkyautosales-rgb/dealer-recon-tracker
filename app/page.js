import Board from '../components/Board';
import AverageCompletionTime from '../components/AverageCompletionTime';

export default function HomePage() {
  return (
    <main className="container" style={{ maxWidth: '100%', padding: '1.25rem 1.5rem' }}>
      <h1>Recon Board</h1>
      <AverageCompletionTime />
      <Board />
    </main>
  );
}
