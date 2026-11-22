create or replace function public.submit_mission_report(p_incident jsonb, p_score integer)
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
  if v_user is null or coalesce(public.current_role() in ('admin', 'security_agent'), false) = false then
    raise exception 'Not authorized to submit a security report';
  end if;
  if p_incident->>'stage' is distinct from 'resolved' or p_score is null or p_score < 0 then
    raise exception 'Only resolved incidents with a valid score may be submitted';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_incident_id));
  select id into v_report_id from public.security_reports
  where incident_id = v_incident_id and author_id = v_user limit 1;
  if found then return v_report_id; end if;
  if exists (select 1 from public.security_incidents where id = v_incident_id and reported_by <> v_user) then
    raise exception 'Incident belongs to another operator';
  end if;
  insert into public.security_incidents(id, gallery_id, reported_by, title, description, severity, stage, detected_at, resolved_at, outcome)
  values (
    v_incident_id, p_incident->>'roomId', v_user, p_incident->>'title', p_incident->>'description',
    (p_incident->>'severity')::public.incident_severity, 'resolved', (p_incident->>'detectedAt')::timestamptz,
    now(), coalesce(p_incident -> 'actions' -> -1 ->> 'note', 'Incident resolved.')
  )
  on conflict (id) do update set
    stage = excluded.stage, resolved_at = excluded.resolved_at, outcome = excluded.outcome
  where public.security_incidents.reported_by = v_user;

  for v_action in select value from jsonb_array_elements(p_incident->'actions') loop
    insert into public.incident_actions(incident_id, actor_id, stage, note, created_at)
    values (v_incident_id, v_user, (v_action->>'stage')::public.incident_stage, v_action->>'note', (v_action->>'at')::timestamptz)
    on conflict (incident_id, stage, created_at) do nothing;
  end loop;

  v_session_id := coalesce((p_incident->>'shiftId')::uuid, gen_random_uuid());
  insert into public.game_sessions(id, user_id, mission_id)
  values (v_session_id, v_user, 'quiet-gallery') on conflict (id) do nothing;
  if not exists (select 1 from public.game_sessions where id = v_session_id and user_id = v_user) then
    raise exception 'Shift belongs to another operator';
  end if;
  insert into public.security_reports(session_id, incident_id, author_id, score, summary)
  values (v_session_id, v_incident_id, v_user, p_score, jsonb_build_object('protocol_steps', jsonb_array_length(p_incident->'actions'), 'visitor_safe', true, 'artifact_safe', true, 'inventory', p_incident->'inventory'))
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
