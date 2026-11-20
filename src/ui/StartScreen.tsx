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
        <p className="lead">Begin in the State Room and patrol the Denon Wing. Protect the art, respond to incidents, and check the route down to Level 0.</p>
        <div className="briefing-grid">
          <div><span>Assignment</span><strong>Operation Quiet Gallery</strong></div>
          <div><span>Location</span><strong>Room 711</strong></div>
          <div><span>Operator</span><strong>{email}</strong></div>
          <div><span>Persistence</span><strong>{cloudStatus === 'demo' ? 'Demo memory' : 'Supabase cloud'}</strong></div>
        </div>
        <button className="primary-button" onClick={() => { primeAudio(); startGame(); }}>Begin patrol</button>
        <button className="secondary-button" onClick={() => { primeAudio(); startGame(true); }}>Start priority shift</button>
        <p>Priority Shift sends you after moving visitors. Follow the marker, get close, and hold F to speak. Make contact within 30 seconds for full points.</p>
        <p className="controls-line">WASD or arrow keys move · Shift sprint · drag mouse rotate · E interact · M museum map · Tab dashboard · R radio · Esc pause</p>
      </div>
    </main>
  );
}
