import type { PlayerMapPosition } from '../domain/types';

export const ROOM_711 = {
  id: '711',
  name: 'Salle des États',
  wing: 'Denon',
  level: 1,
  bounds: { minX: -22, maxX: 22, minZ: -14, maxZ: 14 },
  mapPolygon: '8,12 92,12 92,76 70,76 70,90 30,90 30,76 8,76',
  confidence: 'recognizable approximation' as const,
};

export function worldToMap(x: number, z: number, yaw: number): PlayerMapPosition {
  const { minX, maxX, minZ, maxZ } = ROOM_711.bounds;
  return {
    x: 8 + ((x - minX) / (maxX - minX)) * 84,
    y: 12 + ((z - minZ) / (maxZ - minZ)) * 64,
    yaw,
    floor: 1,
  };
}

export const ROOM_711_MARKERS = {
  artifact: worldToMap(0, -13.6, 0),
  guard: worldToMap(11, -7.5, 0),
  camera: worldToMap(-19.8, -12.9, 0),
  sensor: worldToMap(4.1, -13.45, 0),
  incident: worldToMap(-2.8, -10.1, 0),
};

export function toLargeMap(point: Pick<PlayerMapPosition, 'x' | 'y'>) {
  return {
    x: point.x * 1.5,
    y: 12 + ((point.y - 12) / 64) * 60,
  };
}

export function distance2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

