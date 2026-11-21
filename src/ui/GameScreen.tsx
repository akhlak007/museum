import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../app/store';
import { GameEngine } from '../engine/GameEngine';
import {
  ArtifactPanel,
  CameraFeedPanel,
  DashboardPanel,
  FullMapPanel,
  HeistReportPanel,
  IncidentPanel,
  Level2ReportPanel,
  PausePanel,
  RadioPanel,
  ReportPanel,
} from './Panels';
import { CCTVPanel } from './CCTVPanel';
import { Minimap } from './Minimap';
import { playSecurityCue } from '../engine/audio';
import { canDetectSecurityEvent } from '../domain/detectionPolicy';
import { galleryById } from '../world/galleries';

export function GameScreen() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const gameMode = useGameStore((state) => state.gameMode);
  const heistState = useGameStore((state) => state.heistState);
  const toggleFlashlight = useGameStore((state) => state.toggleFlashlight);
  const discoverClue = useGameStore((state) => state.discoverClue);
  const interceptSuspect = useGameStore((state) => state.interceptSuspect);
  const resolveHeistGame = useGameStore((state) => state.resolveHeistGame);
  const tickHeist = useGameStore((state) => state.tickHeist);

  const player = useGameStore((state) => state.player);
  const galleryId = player.galleryId;
  const gallery = galleryById(galleryId);
  const explored = useGameStore((state) => state.explored);
  const inspections = useGameStore((state) => state.inspections);
  const panel = useGameStore((state) => state.panel);
  const incident = useGameStore((state) => state.incident);
  const priorityShift = useGameStore((state) => state.priorityShift);
  const raiseGrandeAlert = useGameStore((state) => state.raiseGrandeAlert);
  const nearArtwork = useGameStore((state) => state.nearArtwork);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  const error = useGameStore((state) => state.error);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const grandeCamera = useGameStore((state) => state.grandeCamera);
  const grandeSensor = useGameStore((state) => state.grandeSensor);
  const sensorStatus = useGameStore((state) => state.sensorStatus);
  const [graphicsUnavailable, setGraphicsUnavailable] = useState(false);

  const [nearClueId, setNearClueId] = useState<string | null>(null);
  const [nearSuspect, setNearSuspect] = useState(false);

  const check1Done = inspections.some((title) => title === 'Virgin and Child Enthroned with Six Angels' || title === 'Saint Francis Receiving the Stigmata');
  const check2Done = inspections.includes('Winged Victory of Samothrace');
  const check3Done = explored.includes('daru-lower') && inspections.includes('Roman Marble Candelabrum');
  const allRouteChecksDone = check1Done && check2Done && check3Done;
  const visitorResolved = incident?.stage === 'resolved';

  const routeChecks = [
    { label: 'Inspect a painting in the Square Room (708)', done: check1Done },
    { label: 'Inspect Winged Victory at Daru Staircase (703)', done: check2Done },
    { label: 'Check the candelabrum on Level 0 Landing', done: check3Done },
  ];

  // Active step & target beacon calculation for Level 2 & Night Shift
  let activeTargetPos: [number, number, number] | null = null;
  let activeStepTitle = '';
  let activeStepDetail = '';

  if (gameMode === 'priority') {
    if (!visitorResolved) {
      if (incident?.stage === 'detected') {
        activeStepTitle = 'Pursue Moving Visitor in Room 711';
        activeStepDetail = 'Sprint close (under 2.5m) and hold [F] to make contact.';
        activeTargetPos = [-2.8, 0, -10.1];
      } else if (incident?.stage === 'responding') {
        activeStepTitle = 'Visitor Stopped — Guard G-12 En Route';
        activeStepDetail = 'Wait for Guard G-12 to arrive, then click Log Safe Response in panel.';
        activeTargetPos = [-2.8, 0, -10.1];
      } else {
        activeStepTitle = 'Submit Visitor Incident Report';
        activeStepDetail = 'Click Resolve & Submit Report in the incident card.';
        activeTargetPos = [-2.8, 0, -10.1];
      }
    } else if (!check1Done) {
      activeStepTitle = 'Checkpoint 1: Square Room (Salon Carré · 708)';
      activeStepDetail = 'Walk east through Grand Gallery. Approach & press [E] on Cimabue or Giotto.';
      activeTargetPos = [69, 0, -1];
    } else if (!check2Done) {
      activeStepTitle = 'Checkpoint 2: Daru Staircase (703)';
      activeStepDetail = 'Walk through the far door. Approach & press [E] on Winged Victory.';
      activeTargetPos = [86.5, 0, 5.15];
    } else if (!check3Done) {
      activeStepTitle = 'Checkpoint 3: Level 0 Lower Landing';
      activeStepDetail = 'Descend the grand marble stairs. Press [E] on the Roman Marble Candelabrum.';
      activeTargetPos = [107.8, -4.2, 5];
    } else {
      activeStepTitle = 'Level 2 Complete — Denon Route Certified';
      activeStepDetail = 'All route checks verified and visitor incident safely resolved.';
    }
  } else if (gameMode === 'night-heist' && heistState) {
    const clue1 = heistState.clues.find((c) => c.id === 'clue-711-decoy');
    const clue2 = heistState.clues.find((c) => c.id === 'clue-710-frame');
    if (clue1 && !clue1.discovered) {
      activeStepTitle = 'Investigate Decoy Wire in Room 711';
      activeStepDetail = 'Follow the cyan beacon near the baseboard and press [E] to examine wire.';
      activeTargetPos = [4.1, 0, -13.45];
    } else if (clue2 && !clue2.discovered) {
      activeStepTitle = 'Check Missing Portrait in Room 710';
      activeStepDetail = 'Head through the east door to Grand Gallery. Follow amber beacon to empty frame.';
      activeTargetPos = [36, 0, 1.35];
    } else if (heistState.cctvReviewedRooms.length < 2) {
      activeStepTitle = 'Review CCTV Surveillance Feeds';
      activeStepDetail = 'Press [C] to open the CCTV console and review camera feeds across rooms.';
    } else if (heistState.stage !== 'intercepted' && heistState.stage !== 'resolved') {
      activeStepTitle = 'Intercept Thief at Level 0 Landing';
      activeStepDetail = 'Rush down Daru stairs to Level 0. Corner suspect behind Candelabrum and press [E]!';
      activeTargetPos = [104, -4.2, 8];
    } else {
      activeStepTitle = 'Heist Foiled — File Investigation Report';
      activeStepDetail = 'Click File Heist Report to submit your investigation log.';
    }
  }

  const distanceToTarget = activeTargetPos && player.worldX !== undefined && player.worldZ !== undefined
    ? Math.round(Math.hypot(player.worldX - activeTargetPos[0], player.worldZ - activeTargetPos[2]))
    : null;

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

  // Night heist escape timer countdown
  useEffect(() => {
    if (gameMode !== 'night-heist' || !heistState || heistState.stage === 'resolved' || heistState.stage === 'breached') return;
    const timer = window.setInterval(() => {
      tickHeist(1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameMode, heistState?.stage, tickHeist]);

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
      onHeistProximity(clueId, isNearSuspect) {
        setNearClueId(clueId);
        setNearSuspect(isNearSuspect);
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
    engineRef.current?.setNightMode(gameMode === 'night-heist');
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'night-heist' && heistState) {
      engineRef.current?.setFlashlight(heistState.flashlightOn);
    }
  }, [gameMode, heistState?.flashlightOn]);

  useEffect(() => {
    engineRef.current?.setWaypointBeacon(activeTargetPos);
  }, [activeTargetPos?.[0], activeTargetPos?.[1], activeTargetPos?.[2]]);

  useEffect(() => {
    if (gameMode === 'night-heist' && heistState) {
      const discovered = heistState.clues.filter((c) => c.discovered).map((c) => c.id);
      if (heistState.stage === 'intercepted' || heistState.stage === 'resolved') {
        discovered.push('suspect');
      }
      engineRef.current?.setClueBeacons(discovered);
    }
  }, [gameMode, heistState?.clues, heistState?.stage]);

  useEffect(() => {
    if (incident?.stage === 'detected') engineRef.current?.setIncidentRoom(incident.roomId);
    if (useGameStore.getState().guardStatus === 'responding') engineRef.current?.setGuardResponding();
  }, [incident?.stage, incident?.id]);

  useEffect(() => {
    engineRef.current?.setPaused(panel === 'pause');
    engineRef.current?.setViewMode(panel === 'grande-camera' ? 'grande-cctv' : panel === 'camera' ? 'cctv' : 'follow');
  }, [panel]);

  useEffect(() => {
    engineRef.current?.setFieldEncounter(priorityShift && incident?.stage === 'detected', panel === null);
  }, [priorityShift, incident?.stage, panel]);

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
      if (event.key.toLowerCase() === 'c') toggle('cctv');
      if (event.key.toLowerCase() === 'f') {
        if (state.gameMode === 'night-heist') state.toggleFlashlight();
      }
      if (event.key === 'Escape') toggle('pause');
      if (event.key.toLowerCase() === 'e') {
        if (state.gameMode === 'night-heist') {
          if (nearClueId) {
            state.discoverClue(nearClueId);
            return;
          }
          if (nearSuspect && state.heistState && state.heistState.stage !== 'intercepted' && state.heistState.stage !== 'resolved') {
            state.interceptSuspect();
            return;
          }
          if (state.heistState && (state.heistState.stage === 'intercepted' || state.heistState.stage === 'breached')) {
            void state.resolveHeistGame();
            return;
          }
        }
        if (state.nearArtwork) {
          if (state.panel !== 'artifact') state.logArtifactInspection();
          toggle('artifact');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [graphicsUnavailable, nearClueId, nearSuspect]);

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

  const activeClue = heistState?.clues.find((c) => c.id === nearClueId);
  const minutes = heistState ? Math.floor(heistState.escapeTimerSeconds / 60) : 0;
  const seconds = heistState ? (heistState.escapeTimerSeconds % 60).toString().padStart(2, '0') : '00';

  return (
    <main className={`game-shell ${gameMode === 'night-heist' ? 'night-heist-active' : ''}`}>
      <div className="game-canvas" ref={mountRef} />
      <header className="hud-topbar">
        <div className="hud-brand">
          <span className="mini-mark">{gameMode === 'night-heist' ? '🌙' : '△'}</span>
          <div>
            <strong>LOUVRE GUARDIAN</strong>
            <small>
              {gameMode === 'night-heist' ? 'AFTER-HOURS INVESTIGATION' : gameMode === 'priority' ? 'LEVEL 2 · PRIORITY ROUTE PATROL' : 'LEVEL 1 · GUARD PATROL'}
            </small>
          </div>
        </div>
        <div className="hud-location">
          <span>{gallery?.wing.toUpperCase()} WING</span>
          <strong>{galleryId === 'daru-lower' ? 'LOWER LANDING' : `ROOM ${galleryId}`} · LEVEL {gallery?.floor}</strong>
        </div>
        <div className={`sync-state ${cloudStatus}`}>
          <span className="status-dot" />
          {cloudStatus === 'connected' ? 'Cloud connected' : cloudStatus === 'demo' ? 'Demo · not saved' : 'Sync failed'}
        </div>
      </header>

      {/* Active Waypoint HUD Banner */}
      {activeStepTitle && !panel && (
        <div className="active-waypoint-hud">
          <span className="waypoint-pin">📍</span>
          <div className="waypoint-info">
            <div className="waypoint-header">
              <strong>{activeStepTitle}</strong>
              {distanceToTarget !== null && <span className="waypoint-dist">{distanceToTarget}m away</span>}
            </div>
            <small>{activeStepDetail}</small>
          </div>
        </div>
      )}

      {gameMode === 'night-heist' && heistState ? (
        <section className="objectives heist-objectives">
          <div className="heist-timer-bar">
            <span>PERIMETER BREACH TIMER</span>
            <strong className={heistState.escapeTimerSeconds < 45 ? 'warning-text' : 'safe-text'}>
              {minutes}:{seconds}
            </strong>
          </div>
          <p className="heist-stage-tag">
            STATUS: <b>{heistState.stage.toUpperCase().replace('-', ' ')}</b>
          </p>
          <p className={heistState.clues.find((c) => c.id === 'clue-711-decoy')?.discovered ? 'done' : ''}>
            Investigate decoy alarm in Room 711
          </p>
          <p className={heistState.emptyFrameDiscovered ? 'done' : ''}>
            Check missing masterpiece in Room 710
          </p>
          <p className={heistState.cctvReviewedRooms.length >= 2 ? 'done' : ''}>
            Review CCTV surveillance ({heistState.cctvReviewedRooms.length}/4)
          </p>
          <p className={heistState.stage === 'intercepted' || heistState.stage === 'resolved' ? 'done' : ''}>
            Intercept thief at Daru landing (Level 0)
          </p>
          {(heistState.stage === 'intercepted' || heistState.stage === 'breached') && (
            <button className="primary-button heist-submit-btn" onClick={() => void resolveHeistGame()}>
              File Heist Report
            </button>
          )}
        </section>
      ) : (
        <section className="objectives">
          <div>
            <span>MISSION OBJECTIVES</span>
            <b>{priorityShift ? `${routeChecks.filter((item) => item.done).length} / 3 route checks` : incident?.stage === 'resolved' ? '3 / 3' : incident ? '1 / 3' : '0 / 3'}</b>
          </div>
          {priorityShift ? (
            <>
              {routeChecks.map((item) => (
                <p key={item.label} className={item.done ? 'done' : ''}>{item.label}</p>
              ))}
              <p className={incident?.stage === 'resolved' ? 'done' : ''}>Resolve moving visitor breach</p>
              {allRouteChecksDone && visitorResolved && (
                <button
                  className="primary-button"
                  style={{ marginTop: '0.65rem', width: '100%', background: 'linear-gradient(#34a853, #1e7e34)', borderColor: '#5cd67d' }}
                  onClick={() => useGameStore.getState().setPanel('level2-report')}
                >
                  🎉 View Level 2 Certificate
                </button>
              )}
            </>
          ) : (
            <>
              <p className={incident ? 'done' : ''}>Patrol the State Room</p>
              <p className={incident?.stage === 'resolved' ? 'done' : ''}>Resolve the visitor-rule incident</p>
              <p className={incident?.stage === 'resolved' ? 'done' : ''}>Submit the security report</p>
            </>
          )}
        </section>
      )}

      {gameMode !== 'night-heist' && <IncidentPanel />}

      {/* Clue and Suspect interaction prompts */}
      {gameMode === 'night-heist' && !panel && (
        <>
          {activeClue && !activeClue.discovered && (
            <div className="interaction-prompt clue-prompt">
              <kbd>E</kbd>
              <span>Investigate Clue: <strong>{activeClue.title}</strong></span>
            </div>
          )}
          {nearSuspect && heistState && heistState.stage !== 'intercepted' && heistState.stage !== 'resolved' && (
            <div className="interaction-prompt suspect-prompt">
              <kbd>E</kbd>
              <span><strong>CORNER SUSPECT & SECURE PAINTING</strong></span>
            </div>
          )}
        </>
      )}

      {nearArtwork && !panel && !nearClueId && <div className="interaction-prompt"><kbd>E</kbd><span>Inspect {nearArtwork}</span></div>}
      {!panel && gallery && <p className="passage-hint">{passageHint}</p>}

      <div className="control-hints">
        {gameMode === 'night-heist' && (
          <>
            <span onClick={() => toggleFlashlight()} style={{ cursor: 'pointer' }}>
              <kbd>F</kbd> Flashlight: {heistState?.flashlightOn ? 'ON' : 'OFF'}
            </span>
            <span onClick={() => useGameStore.getState().setPanel('cctv')} style={{ cursor: 'pointer' }}>
              <kbd>C</kbd> CCTV Console
            </span>
          </>
        )}
        <span><kbd>Tab</kbd> Dashboard</span>
        <span><kbd>M</kbd> Security Map</span>
        <span><kbd>R</kbd> Radio</span>
      </div>

      <Minimap />
      {error && <div className="error-toast">{error}</div>}

      {panel === 'dashboard' && <DashboardPanel />}
      {panel === 'map' && <FullMapPanel />}
      {panel === 'artifact' && <ArtifactPanel />}
      {(panel === 'camera' || panel === 'grande-camera') && <CameraFeedPanel />}
      {panel === 'cctv' && <CCTVPanel />}
      {panel === 'radio' && <RadioPanel />}
      {panel === 'pause' && <PausePanel />}
      {panel === 'report' && <ReportPanel />}
      {panel === 'heist-report' && <HeistReportPanel />}
      {panel === 'level2-report' && <Level2ReportPanel />}
    </main>
  );
}
