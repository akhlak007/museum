# Louvre Guardian

Louvre Guardian is a browser-based 3D museum security management game. The first vertical slice combines free-roam patrol in a recognizable reconstruction of Salle des États with artifact inspection, live maps, guard/resource management, incident response, logging, and performance reporting.

## Run locally

```bash
npm install
npm run dev
```

Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app runs in visibly labeled, non-persistent demo mode. Copy `.env.example` to `.env` and add only the Supabase project URL and public anon key to use cloud authentication. Never place a service-role key in browser configuration.

## Quality checks

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

See `docs/PROJECT_MASTER_PLAN.md`, `docs/IMPLEMENTATION_ROADMAP.md`, and `docs/MASTER_REQUIREMENTS.md` for the complete vision and tracked scope.

