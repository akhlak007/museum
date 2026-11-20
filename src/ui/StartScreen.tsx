import { useGameStore } from '../app/store';
import { primeAudio } from '../engine/audio';

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const startHeistGame = useGameStore((state) => state.startHeistGame);
  const email = useGameStore((state) => state.email);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  return (
    <main className="start-screen">
      <div className="start-panel">
        <p className="eyebrow">Denon Wing · Level 1 & Level 0</p>
        <h1>Louvre Guardian</h1>
        <p className="lead">Patrol the Denon Wing, respond to incidents, and investigate after-hours security breaches across the grand galleries.</p>
        <div className="briefing-grid">
          <div><span>Assignment</span><strong>Operation Quiet Gallery</strong></div>
          <div><span>Location</span><strong>Denon Galleries · Room 711 to Level 0</strong></div>
          <div><span>Operator</span><strong>{email}</strong></div>
          <div><span>Persistence</span><strong>{cloudStatus === 'demo' ? 'Demo memory' : 'Supabase cloud'}</strong></div>
        </div>
        <div className="start-actions" style={{ display: 'grid', gap: '0.65rem' }}>
          <button className="primary-button" onClick={() => { primeAudio(); startGame(); }}>Begin standard patrol</button>
          <button className="secondary-button" onClick={() => { primeAudio(); startGame(true); }}>Start priority shift (Moving visitors)</button>
          <button
            className="primary-button heist-start-btn"
            style={{ background: 'linear-gradient(#2a4d70, #132438)', borderColor: '#6da6dc', color: '#f0f6ff' }}
            onClick={() => { primeAudio(); startHeistGame(); }}
          >
            🌙 Night Shift: The Decoy Heist (Investigation Mystery)
          </button>
        </div>
        <p style={{ marginTop: '1rem', color: '#88b7e2', fontSize: '0.82rem' }}>
          <strong>Night Shift Mode:</strong> Museum is locked down in the dark. Investigate the decoy alarm, toggle your flashlight with <strong>F</strong>, check CCTV cameras with <strong>C</strong>, collect forensic clues, and catch the thief before they escape down the Daru staircase!
        </p>
        <p className="controls-line">WASD move · Shift sprint · Mouse rotate · E interact/clue · F flashlight · C CCTV console · M map · Tab dashboard · Esc pause</p>
      </div>
    </main>
  );
}
