import { describe, expect, it } from 'vitest';
import { ROOM_711_MARKERS, toLargeMap, worldToMap } from './mapRegistry';

describe('Room 711 coordinate mapping', () => {
  it('maps room bounds into the shared map polygon', () => {
    expect(worldToMap(-22, -14, 0)).toMatchObject({ x: 8, y: 12, floor: 1 });
    expect(worldToMap(22, 14, Math.PI)).toMatchObject({ x: 92, y: 76, floor: 1 });
    expect(worldToMap(0, 0, 0)).toMatchObject({ x: 50, y: 44, floor: 1 });
  });

  it('uses the same normalized coordinates for HUD and full-map markers', () => {
    expect(toLargeMap(worldToMap(-22, -14, 0))).toEqual({ x: 12, y: 12 });
    expect(toLargeMap(worldToMap(22, 14, 0))).toEqual({ x: 138, y: 72 });
    expect(ROOM_711_MARKERS.guard).toEqual(worldToMap(11, -7.5, 0));
    expect(ROOM_711_MARKERS.camera).toEqual(worldToMap(-19.8, -12.9, 0));
  });
});
