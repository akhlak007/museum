# Louvre Guardian Vertical Slice - Design Specification

## Purpose

Build one continuous browser experience in which third-person museum patrol and security management operate on the same world state. The first playable milestone covers Salle des États (Room 711, Denon Wing, Level 1) without removing later Louvre-wide requirements.

## Product boundary

The security-management system is primary. Exploration exists to let the player inspect artifacts, verify incidents, deploy resources, and execute safe response protocols. There is no separate virtual-tour mode, no violent combat, no claim that fictional resource placements represent real Louvre security arrangements, and no local production database.

## Architecture

The TypeScript/Vite application has four layers:

1. A direct Three.js engine owns rendering, input, camera, collisions, animation, NPC updates, and local world coordinates.
2. Framework-independent domain services own missions, typed security events, incident workflow, policies, scoring, and reports.
3. React owns authentication, HUD, maps, dashboard, panels, menus, and accessibility.
4. Repository interfaces connect to Supabase in production or a visibly labeled in-memory development adapter.

The world registry converts gallery-local 3D positions into shared museum-map coordinates. Both minimap and full map consume this registry. New galleries can be streamed behind portals without changing mission or persistence interfaces.

## Vertical-slice experience

The player signs in as a Security Agent, starts a shift, patrols Room 711, inspects the Mona Lisa, and responds to a fictional visitor crossing a protective barrier. The response follows DETECT -> VERIFY -> CLASSIFY -> RESPOND -> LOG -> RESOLVE. The mission report measures response time, correct protocol, visitor safety, and artifact protection.

## Data and security

Supabase Auth identities map to profiles and role assignments. PostgreSQL stores public museum structure, artifacts, fictional security resources, incidents, actions, missions, sessions, progress, scores, reports, sources, and asset provenance. RLS permits role-appropriate access and prevents client-side privilege escalation. Continuous movement remains local; only significant events and checkpoints persist.

## Visual direction

Room 711 uses a midnight-blue wall treatment, parquet-inspired floor, high coffered ceiling, pale stone door surrounds, controlled gallery lighting, the Mona Lisa in a central protective presentation, and The Wedding Feast at Cana opposite. Geometry and materials are reusable assets, not flattened concept sheets. Unverified proportions are identified as approximations.

## Reliability and testing

Invalid incident transitions are rejected. Cloud failures remain visible and are never presented as successful synchronization. Unit tests cover protocol, roles, scoring, and coordinates. Browser tests cover login, patrol, inspection, maps, dashboard, incident resolution, and reporting. A stage is marked Tested only after its relevant checks pass.

## Acceptance criteria

- A playable third-person agent moves through a recognizable Room 711 reconstruction.
- The player can inspect a real artwork and see its factual and simulated security information.
- Minimap, full map, HUD, dashboard, resource state, and mission state remain synchronized.
- One guard and one fictional sensor participate in a functional incident workflow.
- Role-aware authentication supports Supabase and honest development demo mode.
- The completed incident produces a functional security report.
- No visible button is knowingly decorative.
- Master requirements and asset provenance remain tracked.

