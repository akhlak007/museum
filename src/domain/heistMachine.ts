import type { HeistClue, HeistState } from './types';

export const INITIAL_CLUES: HeistClue[] = [
  {
    id: 'clue-711-decoy',
    room: '711',
    title: 'Tampered Decoy Sensor Wire',
    description: 'A miniature radio transmitter is spliced into S-711-A, triggering continuous false trips to draw security away.',
    coordinates: [4.1, -13.45],
    discovered: false,
  },
  {
    id: 'clue-710-frame',
    room: '710',
    title: 'Empty Frame of La Belle Ferronnière',
    description: 'The portrait has been sliced cleanly from its mounting bracket. Dropped velvet cloth and severed alarm cables remain.',
    coordinates: [36, 1.35],
    discovered: false,
  },
  {
    id: 'clue-708-blindspot',
    room: '708',
    title: 'Salon Carré Security Camera Blindspot',
    description: 'A spray of infrared-absorbing lacquer over CAM-708 lens obscured the thief during transit toward the stairs.',
    coordinates: [65, 7.4],
    discovered: false,
  },
  {
    id: 'clue-703-stairs',
    room: '703',
    title: 'Dropped Security Master Passcard',
    description: 'A stolen Louvre contractor badge dropped on the third step of the Daru flight, showing rapid descent.',
    coordinates: [88, 7.4],
    discovered: false,
  },
];

export function createInitialHeistState(): HeistState {
  return {
    stage: 'alarm-tripped',
    targetArtwork: 'La Belle Ferronnière',
    emptyFrameDiscovered: false,
    cctvReviewedRooms: [],
    clues: INITIAL_CLUES.map(c => ({ ...c })),
    escapeTimerSeconds: 180,
    flashlightOn: true,
    suspectEscaped: false,
    score: 0,
  };
}

export function discoverHeistClue(state: HeistState, clueId: string): HeistState {
  let stage = state.stage;
  let emptyFrameDiscovered = state.emptyFrameDiscovered;

  const clues = state.clues.map((clue) => {
    if (clue.id === clueId) {
      return { ...clue, discovered: true };
    }
    return clue;
  });

  if (clueId === 'clue-711-decoy' && stage === 'alarm-tripped') {
    stage = 'decoy-identified';
  } else if (clueId === 'clue-710-frame') {
    emptyFrameDiscovered = true;
    if (stage === 'alarm-tripped' || stage === 'decoy-identified') {
      stage = 'decoy-identified';
    }
  }

  // If both key initial clues or empty frame are found and CCTV reviewed, progress to chase
  if (emptyFrameDiscovered && state.cctvReviewedRooms.length >= 2 && stage !== 'intercepted' && stage !== 'resolved' && stage !== 'breached') {
    stage = 'chase';
  }

  return {
    ...state,
    clues,
    stage,
    emptyFrameDiscovered,
  };
}

export function reviewHeistCCTV(state: HeistState, roomId: string): HeistState {
  const rooms = state.cctvReviewedRooms.includes(roomId)
    ? state.cctvReviewedRooms
    : [...state.cctvReviewedRooms, roomId];

  let stage = state.stage;
  if (rooms.length >= 2 && (stage === 'alarm-tripped' || stage === 'decoy-identified')) {
    stage = 'cctv-reviewed';
  }
  if (rooms.length >= 2 && state.emptyFrameDiscovered && stage !== 'intercepted' && stage !== 'resolved' && stage !== 'breached') {
    stage = 'chase';
  }

  return {
    ...state,
    cctvReviewedRooms: rooms,
    stage,
  };
}

export function tickHeistTimer(state: HeistState, deltaSeconds: number): HeistState {
  if (state.stage === 'intercepted' || state.stage === 'resolved' || state.stage === 'breached') {
    return state;
  }

  const remaining = Math.max(0, state.escapeTimerSeconds - deltaSeconds);
  if (remaining === 0) {
    return {
      ...state,
      escapeTimerSeconds: 0,
      stage: 'breached',
      suspectEscaped: true,
      score: calculateHeistScore({ ...state, escapeTimerSeconds: 0, stage: 'breached', suspectEscaped: true }),
    };
  }

  return {
    ...state,
    escapeTimerSeconds: remaining,
  };
}

export function interceptSuspect(state: HeistState): HeistState {
  if (state.stage === 'breached') return state;

  return {
    ...state,
    stage: 'intercepted',
  };
}

export function resolveHeist(state: HeistState): HeistState {
  const nextStage = state.stage === 'breached' ? 'breached' : 'resolved';
  return {
    ...state,
    stage: nextStage,
    score: calculateHeistScore({ ...state, stage: nextStage }),
  };
}

export function calculateHeistScore(state: HeistState): number {
  if (state.stage === 'breached') {
    // Penalized score for breach
    const cluesFound = state.clues.filter(c => c.discovered).length;
    return Math.max(100, cluesFound * 75);
  }

  const baseSuccess = 600;
  const timeBonus = Math.min(300, Math.round(state.escapeTimerSeconds * 1.6));
  const clueBonus = state.clues.filter(c => c.discovered).length * 100;
  const cctvBonus = Math.min(100, state.cctvReviewedRooms.length * 25);

  return baseSuccess + timeBonus + clueBonus + cctvBonus;
}
