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

export function createInventoryIncident(cause: NonNullable<Incident['inventory']>['cause'], now = new Date()): Incident {
  return {
    ...createBarrierIncident(now),
    id: `INV-${crypto.randomUUID()}`,
    title: 'Inventory discrepancy',
    description: 'The shift register flagged La Belle Ferronnière in Room 710. Inspect the display and review the movement register before choosing a response.',
    roomId: '710',
    severity: 'low',
    inventory: { cause, displayChecked: false, registerChecked: false, errors: 0 },
    actions: [{ stage: 'detected', at: now.toISOString(), note: 'Scheduled inventory reconciliation flagged a discrepancy.' }],
  };
}

export function calculateMissionScore(incident: Incident | null, verificationTarget?: number): number {
  if (!incident || incident.stage !== 'resolved') return 0;
  if (incident.inventory) return Math.max(400, 1000 - 150 * incident.inventory.errors);
  const protocolScore = incident.actions.length >= 6 ? 700 : 400;
  const safetyScore = incident.actions.some(action => action.stage === 'logged') ? 300 : 150;
  const verifiedAt = incident.actions.find(action => action.stage === 'verified')?.at;
  const verificationSeconds = verifiedAt ? (Date.parse(verifiedAt) - Date.parse(incident.detectedAt)) / 1000 : 0;
  const latePenalty = verificationTarget === undefined ? 0 : Math.min(350, Math.max(0, Math.ceil(verificationSeconds - verificationTarget)) * 10);
  return protocolScore + safetyScore - latePenalty;
}

