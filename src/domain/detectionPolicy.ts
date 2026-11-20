import type { Incident } from './types';

export function canDetectSecurityEvent(sensorStatus: 'online' | 'offline', incident: Incident | null) {
  return sensorStatus === 'online' && incident === null;
}
