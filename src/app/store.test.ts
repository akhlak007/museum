import { beforeEach, describe, expect, it } from 'vitest';
import { advanceIncident, createBarrierIncident } from '../domain/incidentMachine';
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
