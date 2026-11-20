create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'security_agent');
create type public.artifact_status as enum ('safe', 'warning', 'under_threat', 'damaged', 'missing', 'recovered');
create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
create type public.incident_stage as enum ('detected', 'verified', 'classified', 'responding', 'logged', 'resolved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Security Agent',
  role public.app_role not null default 'security_agent'
);

create table public.museum_wings (
  id text primary key,
  name text not null unique
);

create table public.museum_levels (
  id smallint primary key check (id between -2 and 2),
  name text not null unique
);

create table public.galleries (
  id text primary key,
  wing_id text not null references public.museum_wings(id),
  level_id smallint not null references public.museum_levels(id),
  name text not null,
  map_polygon jsonb not null default '[]'::jsonb,
  world_transform jsonb not null default '{}'::jsonb,
  reference_confidence text not null check (reference_confidence in ('official', 'verified', 'approximation')),
  unique (wing_id, level_id, name)
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  gallery_id text not null references public.galleries(id),
  title text not null,
  artist text,
  display_date text,
  collection_url text,
  status public.artifact_status not null default 'safe',
  unique (gallery_id, title)
);

create table public.security_resources (
  id text primary key,
  gallery_id text references public.galleries(id),
  resource_type text not null check (resource_type in ('guard', 'camera', 'proximity_sensor', 'laser_sensor', 'alarm', 'door', 'console')),
  name text not null,
  status text not null check (status in ('online', 'assigned', 'responding', 'offline')),
  fictional_placement boolean not null default true,
  map_position jsonb not null default '{}'::jsonb
);

create table public.resource_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null references public.security_resources(id),
  gallery_id text references public.galleries(id),
  artifact_id uuid references public.artifacts(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  released_at timestamptz,
  check (gallery_id is not null or artifact_id is not null)
);

create table public.museum_rules (
  id text primary key,
  title text not null,
  description text not null,
  response_policy jsonb not null,
  active boolean not null default true
);

create table public.security_incidents (
  id text primary key,
  gallery_id text not null references public.galleries(id),
  artifact_id uuid references public.artifacts(id),
  reported_by uuid references public.profiles(id),
  title text not null,
  description text not null,
  severity public.incident_severity not null,
  stage public.incident_stage not null default 'detected',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  outcome text,
  simulation_disclaimer boolean not null default true,
  check ((stage = 'resolved' and resolved_at is not null) or stage <> 'resolved')
);

create table public.incident_actions (
  id bigint generated always as identity primary key,
  incident_id text not null references public.security_incidents(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  stage public.incident_stage not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.npc_definitions (
  id text primary key,
  npc_type text not null check (npc_type in ('guard', 'visitor', 'suspect', 'staff')),
  name text not null,
  behavior jsonb not null default '{}'::jsonb
);

create table public.mission_definitions (
  id text primary key,
  name text not null,
  gallery_id text references public.galleries(id),
  objectives jsonb not null,
  scoring_rules jsonb not null,
  active boolean not null default true
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  mission_id text references public.mission_definitions(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.player_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_checkpoint jsonb not null default '{}'::jsonb,
  total_score integer not null default 0 check (total_score >= 0),
  updated_at timestamptz not null default now()
);

create table public.security_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions(id),
  incident_id text references public.security_incidents(id),
  author_id uuid not null references public.profiles(id),
  score integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index incident_gallery_time_idx on public.security_incidents(gallery_id, detected_at desc);
create index incident_action_timeline_idx on public.incident_actions(incident_id, created_at);
create unique index incident_action_idempotency_idx on public.incident_actions(incident_id, stage, created_at);
create index resource_gallery_idx on public.security_resources(gallery_id, resource_type);

alter table public.profiles enable row level security;
alter table public.museum_wings enable row level security;
alter table public.museum_levels enable row level security;
alter table public.galleries enable row level security;
alter table public.artifacts enable row level security;
alter table public.security_resources enable row level security;
alter table public.resource_assignments enable row level security;
alter table public.museum_rules enable row level security;
alter table public.security_incidents enable row level security;
alter table public.incident_actions enable row level security;
alter table public.npc_definitions enable row level security;
alter table public.mission_definitions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.player_progress enable row level security;
alter table public.security_reports enable row level security;

create function public.current_role() returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.current_role() = 'admin');
create policy "read museum wings" on public.museum_wings for select to authenticated using (true);
create policy "read museum levels" on public.museum_levels for select to authenticated using (true);
create policy "read galleries" on public.galleries for select to authenticated using (true);
create policy "read artifacts" on public.artifacts for select to authenticated using (true);
create policy "agents update artifact state" on public.artifacts for update to authenticated using (public.current_role() in ('admin', 'security_agent'));
create policy "read resources" on public.security_resources for select to authenticated using (true);
create policy "agents update resources" on public.security_resources for update to authenticated using (public.current_role() in ('admin', 'security_agent')) with check (public.current_role() in ('admin', 'security_agent'));
create policy "agents manage own assignments" on public.resource_assignments for all to authenticated using (assigned_by = auth.uid() or public.current_role() = 'admin') with check (assigned_by = auth.uid() or public.current_role() = 'admin');
create policy "read museum rules" on public.museum_rules for select to authenticated using (true);
create policy "agents read incidents" on public.security_incidents for select to authenticated using (public.current_role() in ('admin', 'security_agent'));
create policy "agents create incidents" on public.security_incidents for insert to authenticated with check (public.current_role() in ('admin', 'security_agent') and reported_by = auth.uid());
create policy "reporters update own incidents" on public.security_incidents for update to authenticated using (reported_by = auth.uid() or public.current_role() = 'admin') with check (reported_by = auth.uid() or public.current_role() = 'admin');
create policy "agents read actions" on public.incident_actions for select to authenticated using (public.current_role() in ('admin', 'security_agent'));
create policy "agents append own actions" on public.incident_actions for insert to authenticated with check (public.current_role() in ('admin', 'security_agent') and actor_id = auth.uid());
create policy "admins delete actions" on public.incident_actions for delete to authenticated using (public.current_role() = 'admin');
create policy "read npc definitions" on public.npc_definitions for select to authenticated using (true);
create policy "read missions" on public.mission_definitions for select to authenticated using (true);
create policy "users manage own sessions" on public.game_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own progress" on public.player_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own reports" on public.security_reports for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create function public.submit_mission_report(p_incident jsonb, p_score integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_incident_id text := p_incident->>'id';
  v_session_id uuid;
  v_report_id uuid;
  v_action jsonb;
begin
  if v_user is null or public.current_role() not in ('admin', 'security_agent') then
    raise exception 'Not authorized to submit a security report';
  end if;
  if p_incident->>'stage' <> 'resolved' or p_score < 0 then
    raise exception 'Only resolved incidents with a valid score may be submitted';
  end if;

  insert into public.security_incidents(id, gallery_id, reported_by, title, description, severity, stage, detected_at, resolved_at, outcome)
  values (
    v_incident_id, p_incident->>'roomId', v_user, p_incident->>'title', p_incident->>'description',
    (p_incident->>'severity')::public.incident_severity, 'resolved', (p_incident->>'detectedAt')::timestamptz,
    now(), 'Visitor safely returned to the public area; artifact secured.'
  )
  on conflict (id) do update set
    stage = excluded.stage, resolved_at = excluded.resolved_at, outcome = excluded.outcome
  where public.security_incidents.reported_by = v_user;

  for v_action in select value from jsonb_array_elements(p_incident->'actions') loop
    insert into public.incident_actions(incident_id, actor_id, stage, note, created_at)
    values (v_incident_id, v_user, (v_action->>'stage')::public.incident_stage, v_action->>'note', (v_action->>'at')::timestamptz)
    on conflict (incident_id, stage, created_at) do nothing;
  end loop;

  insert into public.game_sessions(user_id, mission_id, ended_at)
  values (v_user, 'quiet-gallery', now()) returning id into v_session_id;
  insert into public.security_reports(session_id, incident_id, author_id, score, summary)
  values (v_session_id, v_incident_id, v_user, p_score, jsonb_build_object('protocol_steps', jsonb_array_length(p_incident->'actions'), 'visitor_safe', true, 'artifact_safe', true))
  returning id into v_report_id;
  insert into public.player_progress(user_id, last_checkpoint, total_score)
  values (v_user, jsonb_build_object('gallery', p_incident->>'roomId', 'mission', 'quiet-gallery'), p_score)
  on conflict (user_id) do update set
    last_checkpoint = excluded.last_checkpoint,
    total_score = public.player_progress.total_score + excluded.total_score,
    updated_at = now();
  return v_report_id;
end;
$$;

revoke all on function public.submit_mission_report(jsonb, integer) from public, anon;
grant execute on function public.submit_mission_report(jsonb, integer) to authenticated;

insert into public.museum_wings(id, name) values ('denon', 'Denon Wing'), ('sully', 'Sully Wing'), ('richelieu', 'Richelieu Wing');
insert into public.museum_levels(id, name) values (-2, 'Level -2'), (-1, 'Level -1'), (0, 'Ground level'), (1, 'Level 1'), (2, 'Level 2');
insert into public.galleries(id, wing_id, level_id, name, map_polygon, world_transform, reference_confidence)
values ('711', 'denon', 1, 'Salle des États', '[[12,12],[138,12],[138,72],[102,90],[48,90],[12,72]]', '{"origin":[0,0,0],"rotation":0}', 'verified');
insert into public.museum_rules(id, title, description, response_policy) values
  ('barrier', 'Protective barrier crossing', 'Calmly verify the situation and guide the visitor back to the public area.', '{"severity":"medium","guard_assistance":true}'),
  ('fire', 'Fire emergency', 'Prioritize evacuation and life safety. Emergency exits remain usable.', '{"severity":"critical","life_safety_first":true,"never_lock_emergency_exits":true}');
