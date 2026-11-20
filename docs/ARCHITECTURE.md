# Technical Architecture

## State flow

Input and NPC simulation produce typed domain commands. Domain services validate commands, transition state, and emit events. React and Three.js subscribe to projections of those events. Persistence repositories store significant events and snapshots without coupling game logic to Supabase.

## Boundaries

- `engine`: frame-loop and rendering concerns only.
- `world`: gallery registry, coordinates, navigation, geometry, and interactions.
- `domain`: protocol, mission, scoring, artifact/resource state, and reports.
- `data`: repositories and Supabase/in-memory adapters.
- `ui`: screens and commands; no direct database mutation.

## Map coordinate contract

Every gallery declares a local bounds rectangle, global origin, rotation, level, wing, room polygon, portals, and navigation graph. The map service converts local `(x,z)` positions to global normalized coordinates. The minimap follows the player; the full map renders the same data at a wider scale.

## Persistence contract

Repositories return explicit success or failure results. The application displays connectivity and pending/failed writes. Production mode requires Supabase configuration. Demo mode resets on reload and is always labeled.

