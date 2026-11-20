import { create } from 'zustand';
import { advanceIncident, calculateMissionScore, createBarrierIncident } from '../domain/incidentMachine';
import type { ArtifactStatus, Incident, PlayerMapPosition, Role } from '../domain/types';
import { persistence } from '../data/persistence';
import { ROOM_711_MARKERS } from '../world/mapRegistry';

export type Panel = 'dashboard' | 'map' | 'radio' | 'artifact' | 'camera' | 'pause' | 'report' | null;

interface GameState {
  screen: 'login' | 'menu' | 'game';
  role: Role | null;
  email: string;
  panel: Panel;
  loading: boolean;
  error: string | null;
  incident: Incident | null;
  artifactStatus: ArtifactStatus;
  player: PlayerMapPosition;
  nearArtwork: boolean;
  nearIncident: boolean;
  guardStatus: 'available' | 'responding' | 'on-scene';
  guardMapPosition: PlayerMapPosition;
  cloudStatus: 'connected' | 'demo' | 'saving' | 'error';
  cameraStatus: 'online' | 'offline';
  sensorStatus: 'online' | 'offline';
  inspectionLogged: boolean;
  score: number;
  signIn(email: string, password: string): Promise<void>;
  startGame(): void;
  setPanel(panel: Panel): void;
  setPlayer(player: PlayerMapPosition, nearArtwork: boolean, nearIncident: boolean): void;
  detectIncident(): void;
  verifyIncident(): void;
  classifyIncident(): void;
  dispatchGuard(): void;
  guardArrived(): void;
  setGuardMapPosition(position: PlayerMapPosition): void;
  logIncident(): void;
  resolveIncident(): Promise<void>;
  toggleResource(id: 'C-711' | 'S-711-A'): Promise<void>;
  logArtifactInspection(): void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  role: null,
  email: '',
  panel: null,
  loading: false,
  error: null,
  incident: null,
  artifactStatus: 'safe',
  player: { x: 50, y: 60, yaw: 0, floor: 1 },
  nearArtwork: false,
  nearIncident: false,
  guardStatus: 'available',
  guardMapPosition: ROOM_711_MARKERS.guard,
  cloudStatus: persistence.mode === 'supabase' ? 'connected' : 'demo',
  score: 0,
  cameraStatus: 'online',
  sensorStatus: 'online',
  inspectionLogged: false,

  async signIn(email, password) {
    set({ loading: true, error: null });
    try {
      const session = await persistence.signIn(email, password);
      set({ screen: 'menu', role: session.role, email: session.email, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unable to sign in' });
    }
  },
  startGame: () => set({ screen: 'game', panel: null }),
  setPanel: (panel) => set({ panel }),
  setPlayer: (player, nearArtwork, nearIncident) => set({ player, nearArtwork, nearIncident }),
  detectIncident: () => {
    if (get().incident) return;
    set({ incident: createBarrierIncident(), artifactStatus: 'warning' });
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
    const score = calculateMissionScore(resolved);
    set({ incident: resolved, artifactStatus: 'safe', guardStatus: 'available', score, cloudStatus: persistence.mode === 'supabase' ? 'saving' : 'demo' });
    try {
      await persistence.saveMissionReport(resolved, score);
      set({ cloudStatus: persistence.mode === 'supabase' ? 'connected' : 'demo', panel: 'report' });
    } catch (error) {
      set({ cloudStatus: 'error', panel: 'report', error: `Report not synchronized: ${error instanceof Error ? error.message : 'unknown error'}` });
    }
  },
  async toggleResource(id) {
    const key = id === 'C-711' ? 'cameraStatus' : 'sensorStatus';
    const previous = get()[key];
    const next = previous === 'online' ? 'offline' : 'online';
    set({ [key]: next } as Pick<GameState, typeof key>);
    try {
      await persistence.updateResourceStatus(id, next);
    } catch (error) {
      set({ [key]: previous, error: `Resource update failed: ${error instanceof Error ? error.message : 'unknown error'}` } as Pick<GameState, typeof key | 'error'>);
    }
  },
  logArtifactInspection: () => set({ inspectionLogged: true }),
}));
