import { galleries, galleryAt, galleryLocations } from './galleries';
import type { PlayerMapPosition } from '../domain/types';

const mapScaleX = 84 / 44;
const mapScaleY = 64 / 28;

export function projectToMap(x: number, z: number) {
  return { x: 50 + x * mapScaleX, y: 44 + z * mapScaleY };
}

export function worldToMap(x: number, z: number, yaw: number): PlayerMapPosition {
  const gallery = galleryAt(x, z);
  return {
    ...projectToMap(x, z),
    yaw,
    floor: gallery?.floor ?? galleries[0].floor,
    galleryId: gallery?.id,
    worldX: x,
    worldZ: z,
  };
}

export function mapHeading(yaw: number) {
  return Math.atan2(Math.sin(yaw) * mapScaleX, -Math.cos(yaw) * mapScaleY) * 180 / Math.PI;
}

export function galleryMapBounds([left, right, top, bottom]: readonly [number, number, number, number]) {
  const start = projectToMap(left, top);
  const end = projectToMap(right, bottom);
  return { ...start, width: end.x - start.x, height: end.y - start.y };
}

export function floorMapViewBox(floor: number) {
  const rooms = galleries.filter(gallery => gallery.floor === floor);
  if (!rooms.length) return '0 0 100 100';
  const { x, y, width, height } = galleryMapBounds([
    Math.min(...rooms.map(room => room.bounds[0])),
    Math.max(...rooms.map(room => room.bounds[1])),
    Math.min(...rooms.map(room => room.bounds[2])),
    Math.max(...rooms.map(room => room.bounds[3])),
  ]);
  return `${x - 7} ${y - 7} ${width + 14} ${height + 14}`;
}

export const ROOM_711_MARKERS = {
  artifact: projectToMap(...galleryLocations['711'].artwork),
  guard: worldToMap(11, -7.5, 0),
  camera: worldToMap(...galleryLocations['711'].camera, 0),
  sensor: projectToMap(...galleryLocations['711'].sensor),
  incident: projectToMap(...galleryLocations['711'].incident),
};

export function distance2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

