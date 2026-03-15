import Board from '../components/Board';
import AverageCompletionTime from '../components/AverageCompletionTime';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Recon Board</h1>
      <AverageCompletionTime />
      <Board />
    </main>
  );
}
