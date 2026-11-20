import { describe, expect, it } from 'vitest';
import { advanceIncident, calculateMissionScore, createBarrierIncident } from './incidentMachine';

describe('incident protocol', () => {
  it('enforces the required sequence', () => {
    const detected = createBarrierIncident(new Date('2026-11-20T00:00:00Z'));
    expect(() => advanceIncident(detected, 'classified', 'skipped verification')).toThrow(/Invalid incident transition/);

    const verified = advanceIncident(detected, 'verified', 'visitor safe');
    const classified = advanceIncident(verified, 'classified', 'minor violation');
    const responding = advanceIncident(classified, 'responding', 'guard calmly assists visitor');
    const logged = advanceIncident(responding, 'logged', 'timeline recorded');
    const resolved = advanceIncident(logged, 'resolved', 'visitor safe; artwork secure');
    expect(resolved.actions.map((item) => item.stage)).toEqual(['detected', 'verified', 'classified', 'responding', 'logged', 'resolved']);
    expect(calculateMissionScore(resolved)).toBe(1000);
  });
});
