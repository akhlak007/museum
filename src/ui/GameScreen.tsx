import { useEffect, useRef } from 'react';
import { useGameStore } from '../app/store';
import { GameEngine } from '../engine/GameEngine';
import { ArtifactPanel, CameraFeedPanel, DashboardPanel, FullMapPanel, IncidentPanel, PausePanel, RadioPanel, ReportPanel } from './Panels';
import { Minimap } from './Minimap';
import { playSecurityCue } from '../engine/audio';
import { canDetectSecurityEvent } from '../domain/detectionPolicy';

export function GameScreen() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const panel = useGameStore((state) => state.panel);
  const incident = useGameStore((state) => state.incident);
  const nearArtwork = useGameStore((state) => state.nearArtwork);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  const error = useGameStore((state) => state.error);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const sensorStatus = useGameStore((state) => state.sensorStatus);

  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new GameEngine(mountRef.current, {
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
    });
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  useEffect(() => {
    if (useGameStore.getState().guardStatus === 'responding') engineRef.current?.setGuardResponding();
  }, [incident?.stage]);

  useEffect(() => {
    engineRef.current?.setPaused(panel === 'pause');
    engineRef.current?.setViewMode(panel === 'camera' ? 'cctv' : 'follow');
  }, [panel]);

  useEffect(() => {
    engineRef.current?.setResourceStates(cameraStatus === 'online', sensorStatus === 'online');
  }, [cameraStatus, sensorStatus]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const state = useGameStore.getState();
      const toggle = (target: typeof state.panel) => state.setPanel(state.panel === target ? null : target);
      if (event.key.toLowerCase() === 'm') toggle('map');
      if (event.key === 'Tab') { event.preventDefault(); toggle('dashboard'); }
      if (event.key.toLowerCase() === 'r') toggle('radio');
      if (event.key === 'Escape') toggle('pause');
      if (event.key.toLowerCase() === 'e' && state.nearArtwork) {
        state.logArtifactInspection();
        toggle('artifact');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <main className="game-shell">
      <div className="game-canvas" ref={mountRef} />
      <header className="hud-topbar">
        <div className="hud-brand"><span className="mini-mark">△</span><div><strong>LOUVRE GUARDIAN</strong><small>SECURITY OPERATIONS</small></div></div>
        <div className="hud-location"><span>DENON WING</span><strong>ROOM 711 · LEVEL 1</strong></div>
        <div className={`sync-state ${cloudStatus}`}><span className="status-dot" />{cloudStatus === 'connected' ? 'Cloud connected' : cloudStatus === 'demo' ? 'Demo · not saved' : 'Sync failed'}</div>
      </header>

      <section className="objectives">
        <div><span>MISSION OBJECTIVES</span><b>{incident?.stage === 'resolved' ? '3 / 3' : incident ? '1 / 3' : '0 / 3'}</b></div>
        <p className={incident ? 'done' : ''}>Patrol Salle des États</p>
        <p className={incident?.stage === 'resolved' ? 'done' : ''}>Resolve the visitor-rule incident</p>
        <p className={incident?.stage === 'resolved' ? 'done' : ''}>Submit the security report</p>
      </section>

      <IncidentPanel />
      {nearArtwork && !panel && <div className="interaction-prompt"><kbd>E</kbd><span>Inspect Mona Lisa</span></div>}
      <div className="control-hints"><span><kbd>Tab</kbd> Dashboard</span><span><kbd>M</kbd> Security Map</span><span><kbd>R</kbd> Radio</span></div>
      <Minimap />
      {error && <div className="error-toast">{error}</div>}

      {panel === 'dashboard' && <DashboardPanel />}
      {panel === 'map' && <FullMapPanel />}
      {panel === 'artifact' && <ArtifactPanel />}
      {panel === 'camera' && <CameraFeedPanel />}
      {panel === 'radio' && <RadioPanel />}
      {panel === 'pause' && <PausePanel />}
      {panel === 'report' && <ReportPanel />}
    </main>
  );
}
