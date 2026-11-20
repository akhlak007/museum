export type Role = 'admin' | 'security_agent';
export type ArtifactStatus = 'safe' | 'warning' | 'under_threat' | 'damaged' | 'missing' | 'recovered';
export type IncidentStage = 'detected' | 'verified' | 'classified' | 'responding' | 'logged' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  roomId: string;
  severity: 'low' | 'medium' | 'high';
  stage: IncidentStage;
  detectedAt: string;
  actions: Array<{ stage: IncidentStage; at: string; note: string }>;
}

export interface PlayerMapPosition {
  x: number;
  y: number;
  galleryId?: string;
  yaw: number;
  floor: number;
}

export interface SecurityResource {
  id: string;
  type: 'guard' | 'camera' | 'proximity_sensor';
  name: string;
  status: 'online' | 'assigned' | 'responding' | 'offline';
  roomId: string;
}

