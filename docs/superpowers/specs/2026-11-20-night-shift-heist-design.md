# Night Shift: The Decoy Heist - Design Specification

**Status**: Confirmed & Approved  
**Date**: 2026-11-20  
**Target Milestone**: Phase 7 - Night Shift & Surveillance Investigation  

---

## 1. Understanding Summary
- **Feature**: An after-hours investigation mode set across the Denon Wing galleries (Rooms 711, 710, 708, 703, and Level 0 Landing).
- **Core Loop**:
  1. Museum alarm trips at the Mona Lisa (Room 711) after hours.
  2. Player navigates the darkened museum using a flashlight.
  3. Investigation reveals the Mona Lisa alarm was a decoy—Leonardo's *La Belle Ferronnière* has been taken from Room 710, leaving an empty frame.
  4. Player accesses the CCTV console (`C`) to review timestamped camera angles across Denon rooms and reconstruct the thief's path.
  5. Player traces physical evidence and corners the suspect at the Daru Staircase / Level 0 landing before the escape countdown expires.
  6. Dispatch G-12, secure the painting, and submit the final incident log.
- **Constraints**: 60 FPS in Three.js on WebGL, reusable collision & room boundaries, offline demo + Supabase cloud synchronization.
- **Explicit Non-Goals**: No lethal combat; no procedurally generated maps outside Denon; no tourist crowds during night shift.

---

## 2. Assumptions & Non-Functional Requirements
- **Atmosphere & Lighting**: Ambient lighting lowered to `0.05` indigo. Player possesses a toggled `SpotLight` flashlight (`F`).
- **CCTV Simulation**: Pre-rendered styled surveillance canvas snapshots with timestamp simulation to prevent multi-pass WebGL performance drops.
- **Audio**: Quiet night reverberation, distant footsteps, flashlight toggle click, and CCTV static.
- **State & Data**: Backward compatible with daily patrol and priority shift modes.

---

## 3. Decision Log
| Decision | Choice | Alternatives Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Architecture** | Unified Engine Mode in `GameEngine.ts` and `store.ts` | Scripting scenario engine, isolated standalone screen | Avoids YAGNI over-engineering and keeps code DRY while sharing room meshes and collisions. |
| **CCTV Feeds** | Canvas snapshot surveillance simulation with timestamp scrubbing | Secondary real-time 3D camera render targets | Secondary render passes quadruple draw calls; snapshots ensure consistent 60 FPS across all devices. |
| **Failure State** | Graceful report filing with penalized security score | Hard game over reload | Preserves realistic museum compliance reporting and gameplay continuity. |
| **Gating** | Flexible non-linear clue discovery | Strict sequential gating | Prevents players getting trapped if they explore Room 710 before Room 711. |

---

## 4. Final Technical Architecture

### 4.1 State Model (`src/domain/types.ts`)
```ts
export type GameMode = 'patrol' | 'priority' | 'night-heist';

export interface HeistClue {
  id: string;
  room: string;
  title: string;
  description: string;
  coordinates: [number, number];
  discovered: boolean;
}

export interface HeistState {
  stage: 'alarm-tripped' | 'decoy-identified' | 'cctv-reviewed' | 'chase' | 'intercepted' | 'breached' | 'resolved';
  targetArtwork: string;
  emptyFrameDiscovered: boolean;
  cctvReviewedRooms: string[];
  clues: HeistClue[];
  suspectDistance: number;
  escapeTimerSeconds: number;
  flashlightOn: boolean;
}
```

### 4.2 Three.js Environment Updates (`src/engine/GameEngine.ts`)
- `setGameMode(mode: GameMode)`: Dynamically adjusts ambient and hemisphere light intensities.
- Player flashlight: `SpotLight` child of camera with target pointing along gaze vector.
- Visual clue entities (dangling decoy wire in 711, empty wooden frame in 710, suspect figure near Candelabrum on Level 0).

### 4.3 UI Additions (`src/ui/CCTVPanel.tsx`)
- CCTV modal toggleable via `C` key or HUD button.
- 4 feeds: CAM-711, CAM-710, CAM-708, CAM-703.
- Timeline playback scrubber showing motion blips.

---

## 5. Verification & Testing
- Unit test suite: `src/domain/heistMachine.test.ts`
- E2E Playwright test: `tests/e2e/night-heist.spec.ts`
- Manual verification on `http://localhost:5174/`
