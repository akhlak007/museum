import { Vector3 } from 'three';

export function cameraRelativeMovement(yaw: number, forward: number, sideways: number) {
  const x = Math.sin(yaw);
  const z = Math.cos(yaw);
  return new Vector3(x * forward - z * sideways, 0, z * forward + x * sideways);
}
