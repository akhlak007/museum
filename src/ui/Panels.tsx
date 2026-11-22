import { useEffect, useState } from 'react';
import { PRIORITY_VERIFICATION_SECONDS, useGameStore } from '../app/store';
import { ferronniereImage, findAddedExhibit, saintJohnImage } from '../world/galleries';
import { MuseumMap } from './MuseumMap';

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
  const grandeCamera = useGameStore(state => state.grandeCamera);
  const grandeSensor = useGameStore(state => state.grandeSensor);
  const history = useGameStore(state => state.history);
  const openInventoryCase = useGameStore(state => state.openInventoryCase);
  const inventoryAvailable = incident?.stage === 'resolved' && history.some(record => record.roomId === '710') && !history.some(record => record.inventory);
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
          <h3>Incident activity</h3>{history.map(record => <p key={record.id}>Room {record.roomId} · {record.title} · resolved</p>)}
          {inventoryAvailable && <button className="secondary-button" onClick={openInventoryCase}>Open Room 710 inventory case</button>}
          {incident ? incident.actions.map((action) => <div className="timeline-row" key={`${action.stage}-${action.at}`}><b>{action.stage}</b><span>{action.note}</span></div>) : <p className="empty-state">No incidents recorded during this shift.</p>}
        </div>
        <div>
          <h3>Resource assignments</h3>
          <div className="resource-row"><span>710 · Camera C-710 · {grandeCamera}</span><button disabled={grandeCamera !== 'online'} onClick={() => setPanel('grande-camera')}>View 710 feed</button><button onClick={() => void toggleResource('C-710')}>Toggle camera</button></div>
          <div className="resource-row"><span>710 · Sensor S-710-A · {grandeSensor}</span><button onClick={() => void toggleResource('S-710-A')}>Toggle sensor</button></div>
          <button className="secondary-button dashboard-map-button" onClick={() => setPanel('map')}>Open museum map</button>
          <div className="resource-row"><span>G-12 · Gallery guard</span><b>{guardStatus}</b></div>
          <div className="resource-row"><span>C-711 · Fictional CCTV</span><div className="resource-actions"><button disabled={cameraStatus !== 'online'} onClick={() => setPanel('camera')}>View feed</button><button onClick={() => void toggleResource('C-711')}>{cameraStatus === 'online' ? 'Take offline' : 'Restore online'}</button></div></div>
          <div className="resource-row"><span>S-711-A · Proximity sensor</span><button onClick={() => void toggleResource('S-711-A')}>{sensorStatus === 'online' ? 'Take offline' : 'Restore online'}</button></div>
        </div>
      </div>
    </PanelShell>
  );
}

export function CameraFeedPanel() {
  const grande = useGameStore(state => state.panel === 'grande-camera');
  const grandeStatus = useGameStore(state => state.grandeCamera);
  const setPanel = useGameStore((state) => state.setPanel);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  return (
    <section className="camera-feed-overlay" aria-label="Live simulated camera feed">
      <header><div><span className="recording-dot" />LIVE · {grande ? 'C-710' : 'C-711'}</div><strong>{grande ? 'GRANDE GALERIE' : 'SALLE DES ÉTATS'} · FICTIONAL TRAINING CAMERA</strong><button onClick={() => setPanel('dashboard')} aria-label="Close camera feed">×</button></header>
      <div className="camera-reticle"><i /><i /></div>
      <footer><span>SIMULATED RESOURCE · NOT A REAL SECURITY LOCATION</span><b>{(grande ? grandeStatus : cameraStatus).toUpperCase()}</b></footer>
    </section>
  );
}

export function FullMapPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  return (
    <PanelShell title="Full Museum Security Map" wide onClose={() => setPanel(null)}>
      <MuseumMap />
    </PanelShell>
  );
}

export function ArtifactPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const artwork = useGameStore(state => state.inspectedArtwork);
  const exhibit = findAddedExhibit(artwork);
  const saintJohn = artwork === 'Saint John the Baptist';
  const ferronniere = artwork === 'La Belle Ferronnière';
  const grande = saintJohn || ferronniere;
  const wedding = artwork === 'The Wedding Feast at Cana';
  const artifactStatus = useGameStore(state => state.incident?.roomId === (grande ? '710' : '711') && !wedding &&
    Boolean(state.incident.inventory) === ferronniere ? state.artifactStatus : 'safe');
  return (
    <PanelShell title="Artifact Inspection" onClose={() => setPanel(null)}>
      <div className="artifact-layout">
        {exhibit ? <>
          {exhibit.image && <img src={exhibit.image} alt={artwork ?? ''} />}
          <div>
            <h3>{artwork}</h3>
            <dl><dt>Artist</dt><dd>{exhibit.artist}</dd><dt>Location</dt><dd>{exhibit.room}</dd></dl>
            <p>{exhibit.detail}</p>
            <a href={exhibit.source} target="_blank" rel="noreferrer">Official Louvre collection record</a>
          </div>
        </> : ferronniere ? <>
          <img src={ferronniereImage} alt="La Belle Ferronnière by Leonardo da Vinci" />
          <div>
            <h3>La Belle Ferronnière</h3>
            <dl><dt>Artist</dt><dd>Leonardo da Vinci</dd><dt>Location</dt><dd>Room 710 · Denon · Level 1</dd><dt>Status</dt><dd className="safe-text">Safe</dd></dl>
            <p>Leonardo’s sitter is unidentified. The familiar title arose when a nineteenth-century print confused the portrait with another work.</p>
            <a href="https://collections.louvre.fr/en/ark:/53355/cl010062372" target="_blank" rel="noreferrer">Official Louvre collection record</a>
          </div>
        </> : saintJohn ? <>
          <img src={saintJohnImage} alt="Saint John the Baptist by Leonardo da Vinci" />
          <div>
            <h3>Saint John the Baptist</h3>
            <dl>
              <dt>Artist</dt><dd>Leonardo da Vinci</dd>
              <dt>Date</dt><dd>c. 1508–1519</dd>
              <dt>Location</dt><dd>Room 710 · Denon · Level 1</dd>
              <dt>Status</dt><dd className={artifactStatus === 'safe' ? 'safe-text' : 'warning-text'}>{artifactStatus.replaceAll('_', ' ')}</dd>
            </dl>
            <p>Oil on walnut panel. The Louvre records the painting as unfinished at Leonardo’s death in 1519.</p>
            <a href="https://collections.louvre.fr/en/ark:/53355/cl010062374" target="_blank" rel="noreferrer">Official Louvre collection record</a>
          </div>
        </> : wedding ? <>
          <img src="/artwork/wedding-at-cana.jpg" alt="The Wedding Feast at Cana by Veronese" />
          <div>
            <h3>The Wedding Feast at Cana</h3>
            <dl>
              <dt>Artist</dt><dd>Paolo Caliari, known as Veronese</dd>
              <dt>Location</dt><dd>Room 711 · Denon · Level 1</dd>
              <dt>Status</dt><dd className="safe-text">Safe</dd>
            </dl>
            <p>Veronese painted this monumental banquet for the refectory of San Giorgio Maggiore in Venice. It hangs opposite the Mona Lisa.</p>
            <a href="https://www.louvre.fr/en/explore/the-palace/from-the-mona-lisa-to-the-wedding-feast-at-cana" target="_blank" rel="noreferrer">Louvre gallery guide</a>
          </div>
        </> : <><img src="/artwork/mona-lisa.jpg" alt="Mona Lisa by Leonardo da Vinci" />
        <div><h3>Mona Lisa <small>(La Joconde)</small></h3><dl><dt>Artist</dt><dd>Leonardo da Vinci</dd><dt>Date</dt><dd>1503–1519</dd><dt>Location</dt><dd>Room 711 · Denon · Level 1</dd><dt>Status</dt><dd className={artifactStatus === 'safe' ? 'safe-text' : 'warning-text'}>{artifactStatus.replace('_', ' ')}</dd></dl><p>Leonardo’s portrait is displayed in a temperature- and humidity-controlled protective case. Its subtle transitions are associated with his sfumato technique.</p><a href="https://collections.louvre.fr/en/ark:/53355/cl010062370" target="_blank" rel="noreferrer">Official Louvre collection record</a></div></>}
      </div>
      <div className="inspection-footer">{!exhibit && <span>Assigned simulated resources: {grande ? 'C-710 · S-710-A' : 'C-711 · S-711-A'} · Guard G-12</span>}<strong>Inspection logged for this shift</strong></div>
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
  const inventoryOutcome = useGameStore(state => state.incident?.inventory ? state.incident.actions.at(-1)?.note : undefined);
  const setPanel = useGameStore((state) => state.setPanel);
  const score = useGameStore((state) => state.score);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  return <PanelShell title={inventoryOutcome ? 'Mission Report — Inventory Discrepancy' : 'Mission Report — Operation Quiet Gallery'} onClose={() => setPanel(null)}><div className="report-grade"><span>GRADE</span><strong>{score >= 900 ? 'A' : score >= 700 ? 'B' : 'C'}</strong><b>{score.toLocaleString()} points</b></div><div className="report-row"><span>Protocol completed</span><b>6 / 6</b></div>{inventoryOutcome ? <p>{inventoryOutcome}</p> : <div className="report-row"><span>Visitor safety</span><b>Protected</b></div>}<div className="report-row"><span>Artifact secured</span><b>Safe</b></div><div className="report-row"><span>Persistence</span><b>{cloudStatus === 'connected' ? 'Saved to Supabase' : cloudStatus === 'saving' ? 'Saving…' : cloudStatus === 'error' ? 'Save failed' : 'Demo memory only'}</b></div><button className="primary-button" onClick={() => setPanel(null)}>Continue patrol</button></PanelShell>;
}

function VerificationClock({ detectedAt }: { detectedAt: string }) {
  const deadline = Date.parse(detectedAt) + PRIORITY_VERIFICATION_SECONDS * 1000;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.ceil((deadline - now) / 1000);
  return <p role="timer" className={seconds <= 10 ? 'warning-text' : undefined}>
    {seconds > 0 ? `Time to verify for full score · ${seconds}s` : 'Verification overdue · score penalty applies'}
  </p>;
}

export function IncidentPanel() {
  const incident = useGameStore((state) => state.incident);
  const nearIncident = useGameStore((state) => state.nearIncident);
  const verify = useGameStore((state) => state.verifyIncident);
  const classify = useGameStore((state) => state.classifyIncident);
  const dispatch = useGameStore((state) => state.dispatchGuard);
  const log = useGameStore((state) => state.logIncident);
  const resolve = useGameStore((state) => state.resolveIncident);
  const reviewRegister = useGameStore(state => state.reviewInventoryRegister);
  const classifyInventory = useGameStore(state => state.classifyInventory);
  const respondToInventory = useGameStore(state => state.respondToInventory);
  const guardStatus = useGameStore((state) => state.guardStatus);
  const priorityShift = useGameStore(state => state.priorityShift);
  const field = useGameStore(state => state.fieldContact);
  if (!incident || incident.stage === 'resolved') return null;
  if (incident.inventory) {
    const evidence = incident.actions.find(action => action.stage === 'verified')?.note;
    return (
      <aside className="incident-card">
        <div className="incident-title"><span>{incident.title}</span><b>{incident.stage.toUpperCase()}</b></div>
        <p>{evidence ?? incident.description}</p>
        {incident.stage === 'detected' && <button disabled={!incident.inventory.displayChecked} onClick={reviewRegister}>Review movement register</button>}
        {incident.stage === 'verified' && <>
          {incident.inventory.errors > 0 && <p role="status">That classification conflicts with the evidence. Review the register and try again.</p>}
          <button onClick={() => classifyInventory('clerical')}>Duplicate register entry</button>
          <button onClick={() => classifyInventory('conservation')}>Unrecorded conservation return</button>
        </>}
        {incident.stage === 'classified' && <button onClick={respondToInventory}>Reconcile inventory register</button>}
        {incident.stage === 'responding' && <button onClick={log}>Log evidence and response</button>}
        {incident.stage === 'logged' && <button onClick={resolve}>Resolve and submit report</button>}
      </aside>
    );
  }
  return (
    <aside className="incident-card">
      <div className="incident-title"><span>SECURITY INCIDENT</span><b>{incident.stage.toUpperCase()}</b></div>
      <p>{incident.description}</p>
      {priorityShift && incident.stage === 'detected' && <VerificationClock key={incident.id} detectedAt={incident.detectedAt} />}
      {incident.stage === 'detected' && (priorityShift ? <>
        <p>{field?.inRange ? 'Hold F to speak to the visitor' : 'Follow the moving red marker and approach the visitor'}</p>
        <progress aria-label="Visitor contact" value={field?.progress ?? 0} max={1} />
      </> : <button disabled={!nearIncident} onClick={verify}>{nearIncident ? 'Verify on scene' : 'Approach the red marker to verify'}</button>)}
      {incident.stage === 'verified' && <button onClick={classify}>Classify visitor violation</button>}
      {incident.stage === 'classified' && <button onClick={dispatch}>Dispatch Guard G-12</button>}
      {incident.stage === 'responding' && <button disabled={guardStatus !== 'on-scene'} onClick={log}>{guardStatus === 'on-scene' ? 'Log safe response' : 'Guard G-12 en route…'}</button>}
      {incident.stage === 'logged' && <button onClick={resolve}>Resolve and submit report</button>}
    </aside>
  );
}
