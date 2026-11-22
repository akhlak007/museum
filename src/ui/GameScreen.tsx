import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../app/store';
import { GameEngine } from '../engine/GameEngine';
import { ArtifactPanel, CameraFeedPanel, DashboardPanel, FullMapPanel, IncidentPanel, PausePanel, RadioPanel, ReportPanel } from './Panels';
import { Minimap } from './Minimap';
import { playSecurityCue } from '../engine/audio';
import { canDetectSecurityEvent } from '../domain/detectionPolicy';
import { galleryById } from '../world/galleries';

export function GameScreen() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const galleryId = useGameStore(state => state.player.galleryId);
  const gallery = galleryById(galleryId);
  const explored = useGameStore(state => state.explored);
  const inspections = useGameStore(state => state.inspections);
  const panel = useGameStore((state) => state.panel);
  const incident = useGameStore((state) => state.incident);
  const priorityShift = useGameStore(state => state.priorityShift);
  const raiseGrandeAlert = useGameStore(state => state.raiseGrandeAlert);
  const nearArtwork = useGameStore((state) => state.nearArtwork);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  const error = useGameStore((state) => state.error);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const grandeCamera = useGameStore(state => state.grandeCamera);
  const grandeSensor = useGameStore(state => state.grandeSensor);
  const sensorStatus = useGameStore((state) => state.sensorStatus);
  const [graphicsUnavailable, setGraphicsUnavailable] = useState(false);
  const routeChecks = [
    { label: 'Inspect a painting in the Square Room', done: inspections.some(title => title === 'Virgin and Child Enthroned with Six Angels' || title === 'Saint Francis Receiving the Stigmata') },
    { label: 'Inspect Winged Victory at the top of the stairs', done: inspections.includes('Winged Victory of Samothrace') },
    { label: 'Check the candelabrum on Level 0', done: explored.includes('daru-lower') && inspections.includes('Roman Marble Candelabrum') },
  ];
  const passageHint = galleryId === '711' ? 'Grand Gallery · East passage'
    : galleryId === '710' ? 'Square Room · Far end of the Grand Gallery'
      : galleryId === '708' ? 'Daru Staircase · Far door'
        : galleryId === '703' ? 'Level 0 · Walk down the stairs'
          : 'Level 1 · Walk back up the stairs';

  const readyForPriorityCall = priorityShift && incident?.roomId === '711' &&
    incident.stage === 'resolved' && panel !== 'report' && panel !== 'pause' && grandeSensor === 'online';
  useEffect(() => {
    if (!readyForPriorityCall) return;
    const call = window.setTimeout(() => {
      raiseGrandeAlert();
      playSecurityCue('incident');
    }, 12_000);
    return () => window.clearTimeout(call);
  }, [readyForPriorityCall, raiseGrandeAlert]);

  useEffect(() => {
    if (!mountRef.current) return;
    const callbacks: ConstructorParameters<typeof GameEngine>[1] = {
      onPosition(position, nearArt, nearIncident) {
        useGameStore.getState().setPlayer(position, nearArt, nearIncident);
      },
      onIncident() {
        const state = useGameStore.getState();
        if (canDetectSecurityEvent(state.sensorStatus, state.incident)) {
          state.detectIncident();
          playSecurityCue('incident');
        }
      },
      onGuardArrived() {
        useGameStore.getState().guardArrived();
        playSecurityCue('arrival');
      },
      onGuardPosition(position) {
        useGameStore.getState().setGuardMapPosition(position);
      },
      onFieldPosition(position, progress, inRange) {
        useGameStore.getState().setFieldContact(position, progress, inRange);
      },
      onFieldContact() {
        useGameStore.getState().completeFieldContact();
        playSecurityCue('arrival');
      },
    };
    let engine: GameEngine;
    try {
      engine = new GameEngine(mountRef.current, callbacks);
    } catch (error) {
      if (!(error instanceof Error) || !/webgl/i.test(error.message)) throw error;
      setGraphicsUnavailable(true);
      useGameStore.getState().setPanel('map');
      return;
    }
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  useEffect(() => {
    if (incident?.stage === 'detected' && !incident.inventory) engineRef.current?.setIncidentRoom(incident.roomId);
    if (useGameStore.getState().guardStatus === 'responding') engineRef.current?.setGuardResponding();
  }, [incident?.stage, incident?.id, incident?.inventory]);

  useEffect(() => {
    engineRef.current?.setPaused(panel === 'pause');
    engineRef.current?.setViewMode(panel === 'grande-camera' ? 'grande-cctv' : panel === 'camera' ? 'cctv' : 'follow');
  }, [panel]);

  useEffect(() => {
    engineRef.current?.setFieldEncounter(priorityShift && incident?.stage === 'detected' && !incident.inventory, panel === null);
  }, [priorityShift, incident?.stage, incident?.inventory, panel]);

  useEffect(() => {
    engineRef.current?.setResourceStates(cameraStatus === 'online', sensorStatus === 'online', grandeCamera === 'online', grandeSensor === 'online');
  }, [cameraStatus, sensorStatus, grandeCamera, grandeSensor]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const state = useGameStore.getState();
      const toggle = (target: typeof state.panel) => state.setPanel(state.panel === target ? null : target);
      if (event.key.toLowerCase() === 'm') toggle('map');
      if (graphicsUnavailable) {
        if (event.key === 'Escape') state.setPanel(null);
        return;
      }
      if (event.key === 'Tab') { event.preventDefault(); toggle('dashboard'); }
      if (event.key.toLowerCase() === 'r') toggle('radio');
      if (event.key === 'Escape') toggle('pause');
      if (event.key.toLowerCase() === 'e' && state.nearArtwork) {
        if (state.panel !== 'artifact') state.logArtifactInspection();
        toggle('artifact');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [graphicsUnavailable]);

  if (graphicsUnavailable) {
    return (
      <main className="start-screen">
        <section className="start-card">
          <h1>Patrol unavailable</h1>
          <p>This browser could not start WebGL. Open the game in a browser with WebGL 2 to patrol in 3D.</p>
          <button className="primary-button" onClick={() => useGameStore.getState().setPanel('map')}>Open museum map</button>
        </section>
        {panel === 'map' && <FullMapPanel />}
      </main>
    );
  }

  return (
    <main className="game-shell">
      <div className="game-canvas" ref={mountRef} />
      <header className="hud-topbar">
        <div className="hud-brand"><span className="mini-mark">△</span><div><strong>LOUVRE GUARDIAN</strong><small>SECURITY OPERATIONS</small></div></div>
        <div className="hud-location"><span>{gallery?.wing.toUpperCase()} WING</span><strong>{galleryId === 'daru-lower' ? 'LOWER LANDING' : `ROOM ${galleryId}`} · LEVEL {gallery?.floor}</strong></div>
        <div className={`sync-state ${cloudStatus}`}><span className="status-dot" />{cloudStatus === 'connected' ? 'Cloud connected' : cloudStatus === 'demo' ? 'Demo · not saved' : 'Sync failed'}</div>
      </header>

      <section className="objectives">
        <div><span>MISSION OBJECTIVES</span><b>{priorityShift ? `${routeChecks.filter(item => item.done).length} / 3 route checks` : incident?.stage === 'resolved' ? '3 / 3' : incident ? '1 / 3' : '0 / 3'}</b></div>
        {priorityShift ? routeChecks.map(item => <p key={item.label} className={item.done ? 'done' : ''}>{item.label}</p>) : <p className={incident ? 'done' : ''}>Patrol the State Room</p>}
        <p className={incident?.stage === 'resolved' ? 'done' : ''}>{incident?.inventory ? 'Reconcile the Room 710 inventory' : 'Resolve the visitor-rule incident'}</p>
        <p className={incident?.stage === 'resolved' ? 'done' : ''}>Submit the security report</p>
      </section>

      <IncidentPanel />
      {nearArtwork && !panel && <div className="interaction-prompt"><kbd>E</kbd><span>Inspect {nearArtwork}</span></div>}
      {!panel && gallery && (!incident?.inventory || incident.stage === 'resolved') && <p className="passage-hint">{passageHint}</p>}
      <div className="control-hints"><span><kbd>Tab</kbd> Dashboard</span><span><kbd>M</kbd> Security Map</span><span><kbd>R</kbd> Radio</span></div>
      <Minimap />
      {error && <div className="error-toast">{error}</div>}

      {panel === 'dashboard' && <DashboardPanel />}
      {panel === 'map' && <FullMapPanel />}
      {panel === 'artifact' && <ArtifactPanel />}
      {(panel === 'camera' || panel === 'grande-camera') && <CameraFeedPanel />}
      {panel === 'radio' && <RadioPanel />}
      {panel === 'pause' && <PausePanel />}
      {panel === 'report' && <ReportPanel />}
    </main>
  );
}
