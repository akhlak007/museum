import { create } from 'zustand';
import { advanceIncident, calculateMissionScore, createBarrierIncident } from '../domain/incidentMachine';
import {
  createInitialHeistState,
  discoverHeistClue,
  interceptSuspect,
  resolveHeist,
  reviewHeistCCTV,
  tickHeistTimer,
} from '../domain/heistMachine';
import type { ArtifactStatus, GameMode, HeistState, Incident, PlayerMapPosition, Role } from '../domain/types';
import { persistence } from '../data/persistence';
import { ROOM_711_MARKERS, worldToMap } from '../world/mapRegistry';
import type { InspectableArtwork } from '../world/galleries';
import { playSecurityCue } from '../engine/audio';

export type Panel = 'dashboard' | 'map' | 'radio' | 'artifact' | 'camera' | 'grande-camera' | 'cctv' | 'heist-report' | 'pause' | 'report' | null;

interface GameState {
  screen: 'login' | 'menu' | 'game';
  role: Role | null;
  email: string;
  gameMode: GameMode;
  panel: Panel;
  loading: boolean;
  error: string | null;
  incident: Incident | null;
  heistState: HeistState | null;
  artifactStatus: ArtifactStatus;
  player: PlayerMapPosition;
  nearArtwork: InspectableArtwork | null;
  inspectedArtwork: InspectableArtwork | null;
  inspections: InspectableArtwork[];
  explored: string[];
  nearIncident: boolean;
  guardStatus: 'available' | 'responding' | 'on-scene';
  guardMapPosition: PlayerMapPosition;
  cloudStatus: 'connected' | 'demo' | 'saving' | 'error';
  cameraStatus: 'online' | 'offline';
  sensorStatus: 'online' | 'offline';
  pendingIncident: Incident | null;
  grandeCamera: 'online' | 'offline';
  grandeSensor: 'online' | 'offline';
  history: Incident[];
  priorityShift: boolean;
  fieldContact: { position: PlayerMapPosition; progress: number; inRange: boolean } | null;
  score: number;
  signIn(email: string, password: string): Promise<void>;
  startGame(priorityShift?: boolean): void;
  startHeistGame(): void;
  toggleFlashlight(): void;
  discoverClue(id: string): void;
  reviewCCTV(roomId: string): void;
  tickHeist(deltaSeconds: number): void;
  interceptSuspect(): void;
  resolveHeistGame(): Promise<void>;
  setPanel(panel: Panel): void;
  setPlayer(player: PlayerMapPosition, nearArtwork: InspectableArtwork | null, nearIncident: boolean): void;
  detectIncident(): void;
  verifyIncident(): void;
  classifyIncident(): void;
  dispatchGuard(): void;
  guardArrived(): void;
  setGuardMapPosition(position: PlayerMapPosition): void;
  logIncident(): void;
  resolveIncident(): Promise<void>;
  toggleResource(id: 'C-711' | 'S-711-A' | 'C-710' | 'S-710-A'): Promise<void>;
  logArtifactInspection(): void;
  raiseGrandeAlert(): void;
  setFieldContact(position: PlayerMapPosition, progress: number, inRange: boolean): void;
  completeFieldContact(): void;
}

export const PRIORITY_VERIFICATION_SECONDS = 30;

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  role: null,
  email: '',
  gameMode: 'patrol',
  panel: null,
  loading: false,
  error: null,
  incident: null,
  heistState: null,
  artifactStatus: 'safe',
  player: worldToMap(0, 4, Math.PI),
  nearArtwork: null,
  inspectedArtwork: null,
  inspections: [],
  explored: ['711'],
  nearIncident: false,
  guardStatus: 'available',
  guardMapPosition: ROOM_711_MARKERS.guard,
  cloudStatus: persistence.mode === 'supabase' ? 'connected' : 'demo',
  score: 0,
  cameraStatus: 'online',
  sensorStatus: 'online',
  pendingIncident: null, grandeCamera: 'online', grandeSensor: 'online',
  history: [],
  priorityShift: false,
  fieldContact: null,

  async signIn(email, password) {
    set({ loading: true, error: null });
    try {
      const session = await persistence.signIn(email, password);
      set({ screen: 'menu', role: session.role, email: session.email, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unable to sign in' });
    }
  },
  startGame: (priorityShift = false) => set({
    screen: 'game',
    gameMode: priorityShift ? 'priority' : 'patrol',
    panel: null,
    priorityShift,
    heistState: null,
  }),
  startHeistGame: () => {
    const heistState = createInitialHeistState();
    set({
      screen: 'game',
      gameMode: 'night-heist',
      panel: null,
      priorityShift: false,
      heistState,
      artifactStatus: 'under_threat',
      incident: {
        id: `HEIST-${Date.now()}`,
        title: 'After-Hours Intrusion & Decoy Alarm',
        description: 'Perimeter alarm tripped at Salle des États (Room 711) after hours. Security investigation initiated.',
        roomId: '711',
        severity: 'high',
        stage: 'detected',
        detectedAt: new Date().toISOString(),
        actions: [{ stage: 'detected', at: new Date().toISOString(), note: 'S-711-A trip registered by central monitoring.' }],
      },
    });
  },
  toggleFlashlight: () => {
    const { heistState } = get();
    if (!heistState) return;
    playSecurityCue('flashlight');
    set({ heistState: { ...heistState, flashlightOn: !heistState.flashlightOn } });
  },
  discoverClue: (clueId: string) => {
    const { heistState } = get();
    if (!heistState) return;
    const next = discoverHeistClue(heistState, clueId);
    playSecurityCue('clue');
    set({
      heistState: next,
      artifactStatus: next.emptyFrameDiscovered ? 'missing' : 'under_threat',
    });
  },
  reviewCCTV: (roomId: string) => {
    const { heistState } = get();
    if (!heistState) return;
    playSecurityCue('cctv');
    const next = reviewHeistCCTV(heistState, roomId);
    set({ heistState: next });
  },
  tickHeist: (deltaSeconds: number) => {
    const { heistState } = get();
    if (!heistState || heistState.stage === 'resolved' || heistState.stage === 'breached') return;
    const next = tickHeistTimer(heistState, deltaSeconds);
    set({ heistState: next });
    if (next.stage === 'breached') {
      playSecurityCue('incident');
    }
  },
  interceptSuspect: () => {
    const { heistState } = get();
    if (!heistState) return;
    playSecurityCue('arrival');
    const next = interceptSuspect(heistState);
    set({
      heistState: next,
      guardStatus: 'on-scene',
      artifactStatus: 'recovered',
    });
  },
  async resolveHeistGame() {
    const { heistState } = get();
    if (!heistState) return;
    const next = resolveHeist(heistState);
    set({
      heistState: next,
      score: next.score,
      panel: 'heist-report',
      cloudStatus: persistence.mode === 'supabase' ? 'saving' : 'demo',
    });
    try {
      const summaryIncident: Incident = {
        id: `HEIST-REP-${Date.now()}`,
        title: next.stage === 'breached' ? 'Perimeter Breach: Art Theft Unresolved' : 'Heist Foiled: Masterpiece Recovered',
        description: `After-hours decoy heist in Denon. Target: La Belle Ferronnière. Clues: ${next.clues.filter(c => c.discovered).length}/4. Status: ${next.stage}.`,
        roomId: '710',
        severity: 'high',
        stage: 'resolved',
        detectedAt: new Date(Date.now() - 180000).toISOString(),
        actions: next.clues.filter(c => c.discovered).map((c, i) => ({
          stage: 'verified',
          at: new Date(Date.now() - (180 - i * 30) * 1000).toISOString(),
          note: `Forensic clue located: ${c.title}`,
        })),
      };
      await persistence.saveMissionReport(summaryIncident, next.score);
      set({ cloudStatus: persistence.mode === 'supabase' ? 'connected' : 'demo' });
    } catch {
      set({ cloudStatus: 'error' });
    }
  },
  setPanel: (panel) => {
    const current = get();
    if (current.panel === 'report' && panel === null && current.pendingIncident) {
      set({panel, incident: current.pendingIncident, pendingIncident: null, artifactStatus: 'warning'});
    } else set({panel});
  },
  setPlayer: (player, nearArtwork, nearIncident) => set(state => ({
    player, nearArtwork, nearIncident,
    explored: player.galleryId && !state.explored.includes(player.galleryId)
      ? [...state.explored, player.galleryId] : state.explored,
  })),
  setFieldContact: (position, progress, inRange) => set({ fieldContact: { position, progress, inRange } }),
  completeFieldContact: () => {
    const { priorityShift, incident, fieldContact } = get();
    if (!priorityShift || incident?.stage !== 'detected' || !fieldContact || fieldContact.progress < 1) return;
    const verified = advanceIncident(incident, 'verified', 'Agent made contact with the moving visitor on scene.');
    const classified = advanceIncident(verified, 'classified', 'Visitor stopped and confirmed they had crossed the marked boundary.');
    set({
      incident: advanceIncident(classified, 'responding', 'Guard G-12 dispatched to escort the visitor back to the public area.'),
      guardStatus: 'responding',
    });
  },
  detectIncident: () => {
    if (get().incident) return;
    set({ incident: createBarrierIncident(), artifactStatus: 'warning', fieldContact: null });
  },
  verifyIncident: () => {
    const incident = get().incident;
    if (!incident || !get().nearIncident) return;
    set({ incident: advanceIncident(incident, 'verified', 'Agent verified a visitor inside the protective boundary; visitor appears calm and safe.') });
  },
  classifyIncident: () => {
    const incident = get().incident;
    if (!incident) return;
    set({ incident: advanceIncident(incident, 'classified', 'Classified as a medium-severity visitor-rule violation; no artwork contact observed.') });
  },
  dispatchGuard: () => {
    const incident = get().incident;
    if (!incident) return;
    set({
      incident: advanceIncident(incident, 'responding', 'Guard G-12 dispatched to calmly guide the visitor behind the barrier.'),
      guardStatus: 'responding',
    });
  },
  guardArrived: () => set({ guardStatus: 'on-scene' }),
  setGuardMapPosition: (guardMapPosition) => set({ guardMapPosition }),
  logIncident: () => {
    const incident = get().incident;
    if (!incident || get().guardStatus !== 'on-scene') return;
    set({ incident: advanceIncident(incident, 'logged', 'Action timeline and fictional sensor event recorded for the shift report.'), guardStatus: 'on-scene' });
  },
  async resolveIncident() {
    const incident = get().incident;
    if (!incident) return;
    const resolved = advanceIncident(incident, 'resolved', 'Visitor safely returned to the public area; artwork checked and secure.');
    const score = calculateMissionScore(resolved, get().priorityShift ? PRIORITY_VERIFICATION_SECONDS : undefined);
    set({ history: [...get().history,resolved], incident: resolved, artifactStatus: 'safe', guardStatus: 'available', score, cloudStatus: persistence.mode === 'supabase' ? 'saving' : 'demo' });
    try {
      await persistence.saveMissionReport(resolved, score);
      set({ cloudStatus: persistence.mode === 'supabase' ? 'connected' : 'demo', panel: 'report' });
    } catch (error) {
      set({ cloudStatus: 'error', panel: 'report', error: `Report not synchronized: ${error instanceof Error ? error.message : 'unknown error'}` });
    }
  },
  async toggleResource(id) {
    const key = ({'C-710':'grandeCamera','S-710-A':'grandeSensor','C-711':'cameraStatus','S-711-A':'sensorStatus'} as const)[id];
    const previous = get()[key];
    const next = previous === 'online' ? 'offline' : 'online';
    set({ [key]: next } as Pick<GameState, typeof key>);
    try {
      await persistence.updateResourceStatus(id, next);
    } catch (error) {
      set({ [key]: previous, error: `Resource update failed: ${error instanceof Error ? error.message : 'unknown error'}` } as Pick<GameState, typeof key | 'error'>);
    }
  },
  logArtifactInspection: () => {
    const { nearArtwork, priorityShift } = get();
    if (!nearArtwork) return;
    set(state => ({
      inspectedArtwork: nearArtwork,
      inspections: state.inspections.includes(nearArtwork) ? state.inspections : [...state.inspections, nearArtwork],
    }));
    if (!priorityShift && nearArtwork === 'Saint John the Baptist') get().raiseGrandeAlert();
  },
  raiseGrandeAlert: () => {
    const state = get();
    if (state.grandeSensor !== 'online' ||
        (state.incident && state.incident.stage !== 'resolved' && !(state.incident.roomId === '711' && state.incident.stage === 'detected')) ||
        state.history.some(record => record.roomId === '710')) return;
    const incident = createBarrierIncident();
    incident.roomId = '710';
    incident.title = 'Grande Galerie perimeter alert';
    incident.description = 'A visitor crossed the marked display boundary at Saint John the Baptist. Verify on scene.';
    incident.actions[0].note = 'Grande Galerie perimeter reported a training alert.';
    set({ pendingIncident: state.incident?.stage === 'detected' ? state.incident : null, incident, artifactStatus: 'warning', guardStatus: 'available', fieldContact: null });
  },
}));
