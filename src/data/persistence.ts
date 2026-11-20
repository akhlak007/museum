import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Incident, Role } from '../domain/types';

export type PersistenceMode = 'supabase' | 'demo';

export interface PersistenceGateway {
  mode: PersistenceMode;
  signIn(email: string, password: string): Promise<{ email: string; role: Role }>;
  saveMissionReport(incident: Incident, score: number): Promise<void>;
  updateResourceStatus(id: string, status: 'online' | 'offline'): Promise<void>;
}

class DemoPersistence implements PersistenceGateway {
  mode = 'demo' as const;
  private incidents: Incident[] = [];
  private reports: Array<{ incidentId: string; score: number }> = [];

  async signIn(email: string): Promise<{ email: string; role: Role }> {
    return { email: email || 'agent.demo@louvre-guardian.local', role: 'security_agent' };
  }

  async saveMissionReport(incident: Incident, score: number): Promise<void> {
    this.incidents.push(structuredClone(incident));
    this.reports.push({ incidentId: incident.id, score });
  }

  async updateResourceStatus(): Promise<void> {}
}

class SupabasePersistence implements PersistenceGateway {
  mode = 'supabase' as const;
  private userId: string | null = null;
  constructor(private readonly client: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<{ email: string; role: Role }> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message ?? 'Authentication failed');
    this.userId = data.user.id;
    const { data: profile, error: profileError } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw new Error(profileError.message);
    return { email: data.user.email ?? email, role: profile.role as Role };
  }

  async saveMissionReport(incident: Incident, score: number): Promise<void> {
    if (!this.userId) throw new Error('No authenticated operator session');
    const { error } = await this.client.rpc('submit_mission_report', {
      p_incident: incident,
      p_score: score,
    });
    if (error) throw new Error(error.message);
  }

  async updateResourceStatus(id: string, status: 'online' | 'offline'): Promise<void> {
    if (!this.userId) throw new Error('No authenticated operator session');
    const { error } = await this.client.from('security_resources').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const persistence: PersistenceGateway = url && anonKey
  ? new SupabasePersistence(createClient(url, anonKey))
  : new DemoPersistence();

