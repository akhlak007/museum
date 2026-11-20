import { create } from 'zustand';
import { advanceIncident, calculateMissionScore, createBarrierIncident } from '../domain/incidentMachine';
import type { ArtifactStatus, Incident, PlayerMapPosition, Role } from '../domain/types';
import { persistence } from '../data/persistence';
import { ROOM_711_MARKERS, worldToMap } from '../world/mapRegistry';
import type { InspectableArtwork } from '../world/galleries';

export type Panel = 'dashboard' | 'map' | 'radio' | 'artifact' | 'camera' | 'grande-camera' | 'pause' | 'report' | null;

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
  panel: null,
  loading: false,
  error: null,
  incident: null,
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
  startGame: (priorityShift = false) => set({ screen: 'game', panel: null, priorityShift }),
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
