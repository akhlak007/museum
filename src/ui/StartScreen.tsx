import { useGameStore } from '../app/store';
import { primeAudio } from '../engine/audio';

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const email = useGameStore((state) => state.email);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  return (
    <main className="start-screen">
      <div className="start-panel">
        <p className="eyebrow">Denon Wing · Level 1</p>
        <h1>Louvre Guardian</h1>
        <p className="lead">Begin a security patrol in Salle des États and protect the Mona Lisa presentation while coordinating fictional resources and visitor safety.</p>
        <div className="briefing-grid">
          <div><span>Assignment</span><strong>Operation Quiet Gallery</strong></div>
          <div><span>Location</span><strong>Room 711</strong></div>
          <div><span>Operator</span><strong>{email}</strong></div>
          <div><span>Persistence</span><strong>{cloudStatus === 'demo' ? 'Demo memory' : 'Supabase cloud'}</strong></div>
        </div>
        <button className="primary-button" onClick={() => { primeAudio(); startGame(); }}>Begin patrol</button>
        <p className="controls-line">WASD move · Shift sprint · drag mouse rotate · E interact · M map · Tab dashboard · R radio · Esc pause</p>
      </div>
    </main>
  );
}
