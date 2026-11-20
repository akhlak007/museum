import { useGameStore } from '../app/store';
import { ROOM_711_MARKERS, toLargeMap } from '../world/mapRegistry';

function PanelShell({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="panel-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`panel ${wide ? 'panel-wide' : ''}`}>
        <header><div><p className="eyebrow">Louvre Security Operations</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel">×</button></header>
        {children}
      </section>
    </div>
  );
}

export function DashboardPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const incident = useGameStore((state) => state.incident);
  const artifactStatus = useGameStore((state) => state.artifactStatus);
  const guardStatus = useGameStore((state) => state.guardStatus);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const sensorStatus = useGameStore((state) => state.sensorStatus);
  const toggleResource = useGameStore((state) => state.toggleResource);
  return (
    <PanelShell title="Security Dashboard" wide onClose={() => setPanel(null)}>
      <div className="metric-grid">
        <article><span>Facility status</span><strong className={incident && incident.stage !== 'resolved' ? 'warning-text' : 'safe-text'}>{incident && incident.stage !== 'resolved' ? 'Attention required' : 'Under control'}</strong></article>
        <article><span>Active incidents</span><strong>{incident && incident.stage !== 'resolved' ? 1 : 0}</strong></article>
        <article><span>Artifact status</span><strong>{artifactStatus.replace('_', ' ')}</strong></article>
        <article><span>Guard G-12</span><strong>{guardStatus}</strong></article>
        <article><span>Camera C-711</span><strong className={cameraStatus === 'online' ? 'safe-text' : 'warning-text'}>{cameraStatus} · simulated</strong></article>
        <article><span>Sensor S-711-A</span><strong className={sensorStatus === 'online' ? 'safe-text' : 'warning-text'}>{sensorStatus} · simulated</strong></article>
      </div>
      <div className="dashboard-columns">
        <div>
          <h3>Incident activity</h3>
          {incident ? incident.actions.map((action) => <div className="timeline-row" key={`${action.stage}-${action.at}`}><b>{action.stage}</b><span>{action.note}</span></div>) : <p className="empty-state">No incidents recorded during this shift.</p>}
        </div>
        <div>
          <h3>Resource assignments</h3>
          <div className="resource-row"><span>G-12 · Gallery guard</span><b>{guardStatus}</b></div>
          <div className="resource-row"><span>C-711 · Fictional CCTV</span><div className="resource-actions"><button disabled={cameraStatus !== 'online'} onClick={() => setPanel('camera')}>View feed</button><button onClick={() => void toggleResource('C-711')}>{cameraStatus === 'online' ? 'Take offline' : 'Restore online'}</button></div></div>
          <div className="resource-row"><span>S-711-A · Proximity sensor</span><button onClick={() => void toggleResource('S-711-A')}>{sensorStatus === 'online' ? 'Take offline' : 'Restore online'}</button></div>
        </div>
      </div>
    </PanelShell>
  );
}

export function CameraFeedPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  return (
    <section className="camera-feed-overlay" aria-label="Live simulated camera feed">
      <header><div><span className="recording-dot" />LIVE · C-711</div><strong>SALLE DES ÉTATS · FICTIONAL TRAINING CAMERA</strong><button onClick={() => setPanel('dashboard')} aria-label="Close camera feed">×</button></header>
      <div className="camera-reticle"><i /><i /></div>
      <footer><span>SIMULATED RESOURCE · NOT A REAL SECURITY LOCATION</span><b>{cameraStatus.toUpperCase()}</b></footer>
    </section>
  );
}

export function FullMapPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const incident = useGameStore((state) => state.incident);
  const player = useGameStore((state) => state.player);
  const guard = useGameStore((state) => state.guardMapPosition);
  const largePlayer = toLargeMap(player);
  const largeGuard = toLargeMap(guard);
  return (
    <PanelShell title="Full Museum Security Map" wide onClose={() => setPanel(null)}>
      <div className="floor-tabs">{[-2, -1, 0, 1, 2].map((floor) => <button className={floor === 1 ? 'active' : ''} disabled={floor !== 1} key={floor}>Level {floor}</button>)}</div>
      <div className="full-map-layout">
        <aside className="map-sidebar">
          <h3>Wings</h3>
          <label><input type="checkbox" checked readOnly /> Denon Wing</label>
          <label><input type="checkbox" disabled /> Sully Wing</label>
          <label><input type="checkbox" disabled /> Richelieu Wing</label>
          <p>Only Room 711 is loaded in this vertical slice. Future areas remain tracked in the roadmap.</p>
        </aside>
        <div className="large-map">
          <svg viewBox="0 0 150 100">
            <path className="map-room" d="M12 12H138V72H102V90H48V72H12Z" />
            <text x="75" y="48" className="room-label">711 · SALLE DES ÉTATS</text>
            <rect className="map-artifact" x={toLargeMap(ROOM_711_MARKERS.artifact).x - 3} y={toLargeMap(ROOM_711_MARKERS.artifact).y - 2} width="6" height="5" />
            <circle className="map-guard" cx={largeGuard.x} cy={largeGuard.y} r="3" />
            <rect className="map-camera" x={toLargeMap(ROOM_711_MARKERS.camera).x - 3.5} y={toLargeMap(ROOM_711_MARKERS.camera).y - 2} width="7" height="4" />
            {incident && incident.stage !== 'resolved' && <g className="map-incident"><circle cx={toLargeMap(ROOM_711_MARKERS.incident).x} cy={toLargeMap(ROOM_711_MARKERS.incident).y} r="6" /><text x={toLargeMap(ROOM_711_MARKERS.incident).x} y={toLargeMap(ROOM_711_MARKERS.incident).y + 3}>!</text></g>}
            <g transform={`translate(${largePlayer.x} ${largePlayer.y}) rotate(${(player.yaw * 180) / Math.PI})`} className="map-player"><path d="M0 -5 L3.5 4 L0 2 L-3.5 4 Z" /></g>
          </svg>
          <div className="map-coordinate-note">Shared 3D/map coordinate system · fictional security placements</div>
        </div>
      </div>
    </PanelShell>
  );
}

export function ArtifactPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const artifactStatus = useGameStore((state) => state.artifactStatus);
  const inspectionLogged = useGameStore((state) => state.inspectionLogged);
  return (
    <PanelShell title="Artifact Inspection" onClose={() => setPanel(null)}>
      <div className="artifact-layout">
        <img src="/artwork/mona-lisa.jpg" alt="Mona Lisa by Leonardo da Vinci" />
        <div><h3>Mona Lisa <small>(La Joconde)</small></h3><dl><dt>Artist</dt><dd>Leonardo da Vinci</dd><dt>Date</dt><dd>1503–1519</dd><dt>Location</dt><dd>Room 711 · Denon · Level 1</dd><dt>Status</dt><dd className={artifactStatus === 'safe' ? 'safe-text' : 'warning-text'}>{artifactStatus.replace('_', ' ')}</dd></dl><p>Leonardo’s portrait is displayed in a temperature- and humidity-controlled protective case. Its subtle transitions are associated with his sfumato technique.</p><a href="https://collections.louvre.fr/en/ark:/53355/cl010062370" target="_blank" rel="noreferrer">Official Louvre collection record</a></div>
      </div>
      <div className="inspection-footer"><span>Assigned simulated resources: C-711 · S-711-A · Guard G-12</span><strong>{inspectionLogged ? 'Inspection logged locally for this shift' : 'Inspection not logged'}</strong></div>
    </PanelShell>
  );
}

export function RadioPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const guardStatus = useGameStore((state) => state.guardStatus);
  return <PanelShell title="Security Radio" onClose={() => setPanel(null)}><div className="radio-wave">▂ ▅ ▃ ▇ ▄ ▆ ▂ ▅ ▃</div><h3>All units</h3><p>Guard G-12 is <strong>{guardStatus}</strong>. Mission radio is simulated and restricted to the active training scenario.</p><button className="secondary-button" onClick={() => setPanel(null)}>Acknowledge</button></PanelShell>;
}

export function PausePanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  return <PanelShell title="Paused" onClose={() => setPanel(null)}><div className="pause-actions"><button className="primary-button" onClick={() => setPanel(null)}>Resume</button><button className="secondary-button" onClick={() => setPanel('map')}>Open security map</button><p>Movement and incident simulation are paused. Display and audio settings will expand in the next milestone.</p></div></PanelShell>;
}

export function ReportPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const score = useGameStore((state) => state.score);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  return <PanelShell title="Mission Report — Operation Quiet Gallery" onClose={() => setPanel(null)}><div className="report-grade"><span>GRADE</span><strong>{score >= 900 ? 'A' : score >= 700 ? 'B' : 'C'}</strong><b>{score.toLocaleString()} points</b></div><div className="report-row"><span>Protocol completed</span><b>6 / 6</b></div><div className="report-row"><span>Visitor safety</span><b>Protected</b></div><div className="report-row"><span>Artifact secured</span><b>Safe</b></div><div className="report-row"><span>Persistence</span><b>{cloudStatus === 'connected' ? 'Saved to Supabase' : cloudStatus === 'saving' ? 'Saving…' : cloudStatus === 'error' ? 'Save failed' : 'Demo memory only'}</b></div><button className="primary-button" onClick={() => setPanel(null)}>Continue patrol</button></PanelShell>;
}

export function IncidentPanel() {
  const incident = useGameStore((state) => state.incident);
  const nearIncident = useGameStore((state) => state.nearIncident);
  const verify = useGameStore((state) => state.verifyIncident);
  const classify = useGameStore((state) => state.classifyIncident);
  const dispatch = useGameStore((state) => state.dispatchGuard);
  const log = useGameStore((state) => state.logIncident);
  const resolve = useGameStore((state) => state.resolveIncident);
  const guardStatus = useGameStore((state) => state.guardStatus);
  if (!incident || incident.stage === 'resolved') return null;
  return (
    <aside className="incident-card">
      <div className="incident-title"><span>SECURITY INCIDENT</span><b>{incident.stage.toUpperCase()}</b></div>
      <p>{incident.description}</p>
      {incident.stage === 'detected' && <button disabled={!nearIncident} onClick={verify}>{nearIncident ? 'Verify on scene' : 'Approach the red marker to verify'}</button>}
      {incident.stage === 'verified' && <button onClick={classify}>Classify visitor violation</button>}
      {incident.stage === 'classified' && <button onClick={dispatch}>Dispatch Guard G-12</button>}
      {incident.stage === 'responding' && <button disabled={guardStatus !== 'on-scene'} onClick={log}>{guardStatus === 'on-scene' ? 'Log safe response' : 'Guard G-12 en route…'}</button>}
      {incident.stage === 'logged' && <button onClick={resolve}>Resolve and submit report</button>}
    </aside>
  );
}
