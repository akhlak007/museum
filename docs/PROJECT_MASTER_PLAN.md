# Louvre Guardian - Project Master Plan

## Vision

Create an immersive Louvre-inspired 3D Museum Security Management System in which patrol, artifact knowledge, resource coordination, threat detection, incident response, investigation, reporting, and progression form one continuous experience.

## Five details that make it a game

1. Responsive third-person movement, camera behavior, contextual interaction, and readable spatial navigation.
2. Incidents that change the world and require correct, timed decisions rather than decorative alerts.
3. A synchronized security picture across the physical gallery, HUD, minimap, full map, resources, logs, and reports.
4. Recognizable, source-grounded gallery identities with strong lighting, material, artwork, and sound direction.
5. NPC behavior, mission consequences, scoring, and progression that reward visitor safety and artifact protection.

## Playable museum

Begin with Salle des États, Room 711, Denon Wing, Level 1. Expand through connected Denon rooms before adding Sully and Richelieu. Represent public levels -2, -1, 0, 1, and 2 using the same coordinate and navigation system. Architectural facts must be sourced; uncertain reconstructions are labeled approximate.

## Core systems

- Supabase authentication and Admin/Security Agent authorization.
- Third-person movement, camera, collisions, interactions, and NPC navigation.
- Artifact inspection and monitoring states.
- Guards, cameras, sensors, alarms, doors, access controls, consoles, and assignments.
- Live minimap and interactive multi-floor security map.
- Rule-based DETECT -> VERIFY -> CLASSIFY -> RESPOND -> LOG -> RESOLVE workflow.
- Missions, scores, reports, progress, and persistent significant events.
- Fictional visitor violations, environmental events, investigations, missing-artifact verification, and safe suspect interception.

## Content principles

- Use official Louvre sources for public architecture, room organization, and artwork data.
- Record image, model, texture, audio, and reference provenance.
- Keep all simulated security layouts and procedures explicitly fictional.
- Never block emergency exits or prioritize property over life safety.
- Do not create a separate tour mode.

## Performance strategy

Use modular meshes and shared materials, instancing, texture atlases where appropriate, frustum culling, section streaming, capped NPC update rates, lightweight UI, and event-based persistence. The initial target is a stable experience on a typical student laptop.

