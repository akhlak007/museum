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
        <p className="eyebrow">Denon Wing · Security Operations</p>
        <h1>Louvre Guardian</h1>
        <p className="lead">Select your patrol assignment level below. Protect masterpieces, intercept moving violators, and investigate after-hours security breaches.</p>
        <div className="briefing-grid">
          <div><span>Operator</span><strong>{email}</strong></div>
          <div><span>Sector</span><strong>Denon Wing · Rooms 711 to 703 &amp; Level 0</strong></div>
          <div><span>Persistence</span><strong>{cloudStatus === 'demo' ? 'Demo memory' : 'Supabase cloud'}</strong></div>
          <div><span>Protocol</span><strong>Standard Compliance · Non-lethal</strong></div>
        </div>

        <div className="levels-menu" style={{ display: 'grid', gap: '0.85rem' }}>
          <div className="level-card" style={{ background: '#0a1724', border: '1px solid #36506a', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, color: '#e8c874', fontSize: '1.05rem' }}>Level 1 — Room 711 Guard Patrol</h3>
              <button className="primary-button" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem' }} onClick={() => { primeAudio(); startGame(false); }}>
                Play Level 1
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#c4d4e2', lineHeight: 1.45 }}>
              Standard stationary compliance in Salle des États. Approach the perimeter violation at the Mona Lisa, verify on scene, dispatch Guard G-12, and file the safety log.
            </p>
          </div>

          <div className="level-card" style={{ background: '#0d1f30', border: '1px solid #4a759c', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, color: '#fcd34d', fontSize: '1.05rem' }}>Level 2 — Full Denon Route &amp; Moving Pursuit</h3>
              <button className="secondary-button" style={{ borderColor: '#e1bd62', color: '#fff', background: '#254462', padding: '0.5rem 1rem', fontSize: '0.78rem' }} onClick={() => { primeAudio(); startGame(true); }}>
                Play Level 2
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#c4d4e2', lineHeight: 1.45 }}>
              Active moving-visitor pursuit across Denon. Chase the visitor in Room 711 and hold <strong>F</strong> to make contact, then execute all 3 mandatory route inspections: Square Room (708), Winged Victory (703), down to Level 0 landing.
            </p>
          </div>

          <div className="level-card" style={{ background: '#081422', border: '1px solid #2b4f74', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, color: '#93c5fd', fontSize: '1.05rem' }}>Special — Night Shift: The Decoy Heist</h3>
              <button
                className="primary-button"
                style={{ background: 'linear-gradient(#2a4d70, #132438)', borderColor: '#6da6dc', color: '#f0f6ff', padding: '0.5rem 1rem', fontSize: '0.78rem' }}
                onClick={() => { primeAudio(); startHeistGame(); }}
              >
                Play Night Shift
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#c4d4e2', lineHeight: 1.45 }}>
              After-hours stealth &amp; CCTV mystery. Use your flashlight (<kbd>F</kbd>), review camera tapes (<kbd>C</kbd>), find 4 forensic clues, and catch the thief before they escape down the Daru staircase!
            </p>
          </div>
        </div>

        <p className="controls-line" style={{ marginTop: '1rem' }}>
          WASD move · Shift sprint · Mouse rotate · E interact/inspect · F verbal contact / flashlight · C CCTV matrix · M museum map · Tab dashboard · Esc pause
        </p>
      </div>
    </main>
  );
}
