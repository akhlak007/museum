insert into public.artifacts(gallery_id, title, artist, display_date, collection_url, status)
values ('711', 'Mona Lisa', 'Leonardo da Vinci', '1503–1519', 'https://collections.louvre.fr/en/ark:/53355/cl010062370', 'safe');

insert into public.security_resources(id, gallery_id, resource_type, name, status, fictional_placement, map_position)
values
  ('G-12', '711', 'guard', 'Gallery Guard G-12', 'online', true, '{"x":71,"y":26.86}'),
  ('C-711', '711', 'camera', 'Fictional CCTV C-711', 'online', true, '{"x":12.2,"y":14.51}'),
  ('S-711-A', '711', 'proximity_sensor', 'Fictional Sensor S-711-A', 'online', true, '{"x":57.83,"y":13.26}');

insert into public.mission_definitions(id, name, gallery_id, objectives, scoring_rules)
values ('quiet-gallery', 'Operation Quiet Gallery', '711', '["patrol","verify","respond","report"]', '{"protocol":700,"visitor_safety":300}');
