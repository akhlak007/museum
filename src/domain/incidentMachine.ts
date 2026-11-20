import type { Incident, IncidentStage } from './types';

const ORDER: IncidentStage[] = ['detected', 'verified', 'classified', 'responding', 'logged', 'resolved'];

export function createBarrierIncident(now = new Date()): Incident {
  return {
    id: `INC-${now.getTime()}`,
    title: 'Protective barrier violation',
    description: 'Proximity sensor reports a visitor inside the marked protection boundary near the Mona Lisa presentation.',
    roomId: '711',
    severity: 'medium',
    stage: 'detected',
    detectedAt: now.toISOString(),
    actions: [{ stage: 'detected', at: now.toISOString(), note: 'Fictional proximity sensor S-711-A triggered.' }],
  };
}

export function advanceIncident(incident: Incident, target: IncidentStage, note: string, now = new Date()): Incident {
  const currentIndex = ORDER.indexOf(incident.stage);
  const targetIndex = ORDER.indexOf(target);
  if (targetIndex !== currentIndex + 1) {
    throw new Error(`Invalid incident transition: ${incident.stage} -> ${target}`);
  }
  return {
    ...incident,
    stage: target,
    actions: [...incident.actions, { stage: target, at: now.toISOString(), note }],
  };
}

export function calculateMissionScore(incident: Incident | null): number {
  if (!incident || incident.stage !== 'resolved') return 0;
  const protocolScore = incident.actions.length >= 6 ? 700 : 400;
  const safetyScore = incident.actions.some((action) => /safe|calm|visitor/i.test(action.note)) ? 300 : 150;
  return protocolScore + safetyScore;
}

