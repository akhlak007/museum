# Louvre Guardian

Louvre Guardian is a browser-based 3D museum security management game. The first vertical slice combines free-roam patrol in a recognizable reconstruction of Salle des États with artifact inspection, live maps, guard/resource management, incident response, logging, and performance reporting.

## Run locally

```bash
npm install
npm run dev
```

Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app runs in visibly labeled, non-persistent demo mode. Copy `.env.example` to `.env` and add only the Supabase project URL and public anon key to use cloud authentication. Never place a service-role key in browser configuration.

## Room 710 inventory case

Resolve the Room 711 and Room 710 visitor calls in one shift, then press **Tab** and select **Open Room 710 inventory case**. Use **M** to locate the display for *La Belle Ferronnière*, inspect it with **E**, and review the movement register. Classify the discrepancy from the evidence, reconcile the register, and submit the report. Both possible causes are fictional. The Louvre's public guide places the portrait in [Room 710, Denon Level 1](https://www.louvre.fr/en/explore/visitor-trails/the-louvre-s-masterpieces/treasures-of-the-italian-renaissance).

For an existing hosted database, apply `supabase/migrations/202611200003_inventory_reports.sql` after the Denon migration to store the investigation outcome and evidence summary in cloud reports.

## Quality checks

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

See `docs/PROJECT_MASTER_PLAN.md`, `docs/IMPLEMENTATION_ROADMAP.md`, and `docs/MASTER_REQUIREMENTS.md` for the complete vision and tracked scope.

