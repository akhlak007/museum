import { describe, expect, it } from 'vitest';
import {
  calculateHeistScore,
  createInitialHeistState,
  discoverHeistClue,
  interceptSuspect,
  resolveHeist,
  reviewHeistCCTV,
  tickHeistTimer,
} from './heistMachine';

describe('heistMachine state transitions', () => {
  it('initializes with alarm-tripped stage and 180s timer', () => {
    const initial = createInitialHeistState();
    expect(initial.stage).toBe('alarm-tripped');
    expect(initial.escapeTimerSeconds).toBe(180);
    expect(initial.emptyFrameDiscovered).toBe(false);
    expect(initial.clues).toHaveLength(4);
  });

  it('progresses to decoy-identified when discovering the spliced decoy wire', () => {
    let state = createInitialHeistState();
    state = discoverHeistClue(state, 'clue-711-decoy');
    expect(state.stage).toBe('decoy-identified');
    expect(state.clues.find(c => c.id === 'clue-711-decoy')?.discovered).toBe(true);
  });

  it('marks empty frame discovered when discovering clue-710-frame', () => {
    let state = createInitialHeistState();
    state = discoverHeistClue(state, 'clue-710-frame');
    expect(state.emptyFrameDiscovered).toBe(true);
  });

  it('progresses to chase when empty frame is found and CCTV reviewed', () => {
    let state = createInitialHeistState();
    state = discoverHeistClue(state, 'clue-710-frame');
    state = reviewHeistCCTV(state, '711');
    state = reviewHeistCCTV(state, '710');
    expect(state.stage).toBe('chase');
  });

  it('handles timer expiration as breached with penalized score', () => {
    let state = createInitialHeistState();
    state = tickHeistTimer(state, 185);
    expect(state.stage).toBe('breached');
    expect(state.suspectEscaped).toBe(true);
    expect(state.escapeTimerSeconds).toBe(0);
    expect(state.score).toBeGreaterThan(0);
  });

  it('intercepts suspect and resolves with high score upon completion', () => {
    let state = createInitialHeistState();
    state = discoverHeistClue(state, 'clue-711-decoy');
    state = discoverHeistClue(state, 'clue-710-frame');
    state = reviewHeistCCTV(state, '711');
    state = reviewHeistCCTV(state, '710');
    state = tickHeistTimer(state, 30); // 150s remaining
    state = interceptSuspect(state);
    expect(state.stage).toBe('intercepted');

    state = resolveHeist(state);
    expect(state.stage).toBe('resolved');
    expect(state.score).toBeGreaterThanOrEqual(1000);
  });
});
