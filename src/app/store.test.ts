import { beforeEach, describe, expect, it } from 'vitest';
import { advanceIncident, createBarrierIncident, createInventoryIncident } from '../domain/incidentMachine';
import { useGameStore } from './store';

function respondingIncident() {
  let incident = createBarrierIncident(new Date('2026-11-20T00:00:00Z'));
  incident = advanceIncident(incident, 'verified', 'verified', new Date('2026-11-20T00:00:01Z'));
  incident = advanceIncident(incident, 'classified', 'classified', new Date('2026-11-20T00:00:02Z'));
  return advanceIncident(incident, 'responding', 'guard dispatched', new Date('2026-11-20T00:00:03Z'));
}

describe('security response invariants', () => {
  beforeEach(() => {
    useGameStore.setState({ incident: respondingIncident(), guardStatus: 'responding' });
  });

  it('does not log a response before the dispatched guard arrives', () => {
    useGameStore.getState().logIncident();
    expect(useGameStore.getState().incident?.stage).toBe('responding');

    useGameStore.getState().guardArrived();
    useGameStore.getState().logIncident();
    expect(useGameStore.getState().incident?.stage).toBe('logged');
  });
});

describe('inventory case protocol', () => {
  it.each(['clerical', 'conservation'] as const)('requires evidence and records the %s outcome', async cause => {
    useGameStore.setState({
      incident: createInventoryIncident(cause), guardStatus: 'available',
      nearArtwork: 'La Belle Ferronnière', history: [],
    });
    const store = useGameStore.getState();
    store.reviewInventoryRegister();
    store.classifyInventory(cause);
    expect(useGameStore.getState().incident?.stage).toBe('detected');

    store.logArtifactInspection();
    store.reviewInventoryRegister();
    store.classifyInventory(cause === 'clerical' ? 'conservation' : 'clerical');
    expect(useGameStore.getState().incident?.stage).toBe('verified');
    store.classifyInventory(cause);
    store.respondToInventory();
    store.logIncident();
    await store.resolveIncident();
    await store.resolveIncident();

    const state = useGameStore.getState();
    expect(state.history).toHaveLength(1);
    expect(state.incident?.stage).toBe('resolved');
    expect(state.guardStatus).toBe('available');
    expect(state.score).toBe(850);
  });
});
