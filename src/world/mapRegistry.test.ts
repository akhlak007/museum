import { describe, expect, it } from 'vitest';
import { mapHeading, ROOM_711_MARKERS, worldToMap } from './mapRegistry';
import { cameraRelativeMovement } from '../engine/movement';

describe('Room 711 coordinate mapping', () => {
  it('maps room bounds into the shared map polygon', () => {
    expect(worldToMap(-22, -14, 0)).toMatchObject({ x: 8, y: 12, floor: 1 });
    expect(worldToMap(22, 14, Math.PI)).toMatchObject({ x: 92, y: 76, floor: 1 });
    expect(worldToMap(0, 0, 0)).toMatchObject({ x: 50, y: 44, floor: 1 });
  });

  it('registers the guard and camera in room coordinates', () => {
    expect(ROOM_711_MARKERS.guard).toEqual(worldToMap(11, -7.5, 0));
    expect(ROOM_711_MARKERS.camera).toEqual(worldToMap(-19.8, -12.9, 0));
  });

  it('projects camera-relative left and right into the map arrow at spawn', () => {
    const left = cameraRelativeMovement(Math.PI, 0, -1);
    const right = cameraRelativeMovement(Math.PI, 0, 1);
    expect(left.x).toBeCloseTo(-1);
    expect(right.x).toBeCloseTo(1);
    expect(mapHeading(Math.atan2(left.x, left.z))).toBeCloseTo(-90);
    expect(mapHeading(Math.atan2(right.x, right.z))).toBeCloseTo(90);
    expect(mapHeading(Math.PI)).toBeCloseTo(0);
    expect(Math.abs(mapHeading(0))).toBeCloseTo(180);
  });

  it('keeps strafing perpendicular to the camera when it turns', () => {
    const yaw = Math.PI / 3;
    const forward = cameraRelativeMovement(yaw, 1, 0);
    const right = cameraRelativeMovement(yaw, 0, 1);
    expect(forward.dot(right)).toBeCloseTo(0);
    expect(forward.clone().cross(right).y).toBeCloseTo(-1);
  });
});
