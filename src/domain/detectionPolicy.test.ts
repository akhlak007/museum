import { describe, expect, it } from 'vitest';
import { createBarrierIncident } from './incidentMachine';
import { canDetectSecurityEvent } from './detectionPolicy';

describe('sensor detection policy', () => {
  it('suppresses new alerts while offline and detects them after restoration', () => {
    expect(canDetectSecurityEvent('offline', null)).toBe(false);
    expect(canDetectSecurityEvent('online', null)).toBe(true);
    expect(canDetectSecurityEvent('online', createBarrierIncident())).toBe(false);
  });
});
