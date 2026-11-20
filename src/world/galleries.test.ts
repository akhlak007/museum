import { expect, it, vi } from 'vitest';
import { floorHeightAt, galleryAt, passageWaypoints, walkable } from './galleries';
import { worldToMap } from './mapRegistry';
import { useGameStore } from '../app/store';
import { persistence } from '../data/persistence';

it('permits crossing in both directions only inside the doorway', () => {
  for (const x of [21,21.5,22,22.5,23]) expect(walkable(x,7.4)).toBe(true);
  expect(walkable(22,2)).toBe(false);
  expect(galleryAt(23,7.4)?.id).toBe('710');
  expect(worldToMap(45,3,Math.PI)).toMatchObject({galleryId:'710',floor:1,yaw:Math.PI});
});

it('routes guards through walkable points on both sides of the passage', () => {
  const outward = passageWaypoints('711', '710');
  expect(outward.map(([x, z]) => galleryAt(x, z)?.id)).toEqual(['711', '710']);
  expect(outward.every(([x, z]) => walkable(x, z))).toBe(true);
  expect(passageWaypoints('710', '711')).toEqual([...outward].reverse());
  expect(passageWaypoints('710', '710')).toEqual([]);
});

it('connects the Square Room and Daru stairs to the lower floor without a scene transition', () => {
  for (const x of [61.9, 62.1, 83.9, 84.1, 99.9, 100.1]) {
    expect(walkable(x, 7.4)).toBe(true);
  }
  expect(walkable(84, 3.5)).toBe(false);
  expect(worldToMap(74, 7.4, 0)).toMatchObject({ galleryId: '708', floor: 1 });
  expect(worldToMap(94, 7.4, 0)).toMatchObject({ galleryId: '703', floor: 1 });
  expect(worldToMap(103, 7.4, 0)).toMatchObject({ galleryId: 'daru-lower', floor: 0 });
  expect(floorHeightAt(88)).toBeCloseTo(0);
  expect(floorHeightAt(94)).toBeCloseTo(-2.1);
  expect(floorHeightAt(103)).toBeCloseTo(-4.2);
});

it('preserves the earlier alert, logs the gallery report and restores the earlier assignment', async () => {
  const store = useGameStore;
  store.setState(store.getInitialState());
  store.getState().detectIncident();
  const original = store.getState().incident;
  store.getState().setPlayer(worldToMap(45,3,0),'Saint John the Baptist',true);
  await store.getState().toggleResource('S-710-A');
  store.getState().logArtifactInspection();
  expect(store.getState().incident).toEqual(original);
  await store.getState().toggleResource('S-710-A');
  store.getState().logArtifactInspection();
  expect(store.getState().incident?.roomId).toBe('710');
  store.getState().verifyIncident();
  store.getState().classifyIncident();
  store.getState().dispatchGuard();
  expect(store.getState().guardStatus).toBe('responding');
  store.getState().guardArrived();
  store.getState().logIncident();
  const saveReport = vi.spyOn(persistence, 'saveMissionReport');
  try {
    await store.getState().resolveIncident();
    expect(saveReport).toHaveBeenCalledOnce();
    expect(saveReport).toHaveBeenCalledWith(expect.objectContaining({
      roomId: '710', stage: 'resolved', actions: expect.arrayContaining([
        expect.objectContaining({ stage: 'responding', note: expect.stringContaining('G-12') }),
      ]),
    }), expect.any(Number));
  } finally {
    saveReport.mockRestore();
  }
  expect(store.getState().history[0]).toMatchObject({roomId:'710',stage:'resolved'});
  store.getState().setPanel(null);
  expect(store.getState().incident).toEqual(original);
});

it('keeps priority alerts independent from artwork inspection', () => {
  const store = useGameStore;
  store.setState(store.getInitialState());
  try {
    store.getState().startGame(true);
    store.getState().setPlayer(worldToMap(45, 3, 0), 'Saint John the Baptist', true);
    store.getState().logArtifactInspection();
    expect(store.getState().inspectedArtwork).toBe('Saint John the Baptist');
    expect(store.getState().incident).toBeNull();

    store.getState().setPlayer(worldToMap(0, 4, 0), null, false);
    store.getState().raiseGrandeAlert();
    expect(store.getState().incident).toMatchObject({ roomId: '710', stage: 'detected' });
  } finally {
    store.setState(store.getInitialState());
  }
});
