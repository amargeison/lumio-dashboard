@AGENTS.md

# CLAUDE.md — Lumio Dashboard project context

This file is automatically read by Claude Code at session start.
It contains standing instructions, project conventions, and
critical workflow rules.

## Project overview

**Repo:** amargeison/lumio-dashboard
**Owner:** Arron Margeison (solo founder/CEO of Lumio Ltd)
**Stack:** Next.js, React, TypeScript, Supabase
**Live URLs:** lumiosports.com (10 sport portals) + lumiocms.com (currently behind waitlist)
**Working branch:** dev (push everything here, never to main directly)
**Production deploy:** `npm run golive` from dev branch (VPS, NOT Vercel)
**Supabase project:** nrrympsgxsadiemzqwci (eu-west-2)

## Critical workflow rules

### Git discipline
- **NEVER use `git add -A` or `git add .`** — always explicit file-by-file: `git add src/path/to/file.tsx`
- Always run `git status --short` before committing to confirm only intended files are staged
- Pre-existing working tree drift (uncommitted files from previous sessions) should be left UNTOUCHED unless explicitly asked
- Stage individually, commit, push to dev, STOP — never run `npm run golive` unless explicitly told

### Deploy workflow
- Deploy command: `npm run golive` from dev branch
- Never reference Vercel — this project deploys to VPS
- Never run `deploy.sh`
- Always wait for explicit "deploy" instruction; pushing to dev ≠ deploying to live
- **Pre-deploy build check:** before `npm run golive`, always run `npm run build` locally. Verify it completes without errors. Type-check (`npx tsc --noEmit`) is necessary but not sufficient.

### Brand rules (critical for product credibility)
- **Product-internal tech** = Lumio-prefixed (Lumio GPS, Lumio Vision, Lumio Scout, Lumio Data, Lumio Range, Lumio Trace, Lumio Line, Lumio Track, Lumio Health, Lumio Wear, Lumio Data Pro)
- **External cameos** = Meridian/Apex/Crown fictional universe (defined in `docs/brand-universe.md`)
- **Real third-party brand names FORBIDDEN** in marketing or product until partnerships signed (e.g., StatsBomb, Wyscout, TrackMan)
- **Governing body compliance refs** (FA, RFU, ECB, PSR, FSR, SCR, HIA, WPLL, Carney Review) = Pattern 2, kept as factual references
- See `docs/brand-universe.md` for the canonical fictional clubs/grounds replacement universe

### Skill/discovery rules
- Before writing any prompt that edits a file, **state which URL the change affects** and confirm the correct file from the routing map below
- Always grep before editing — never write a prompt targeting demo-workspace for changes that should hit the live portal
- If unsure of file location, grep first, change second

## File routing map (verified — critical reference)

### Football Pro (men's professional)
- Route: `/football/{slug}` → `src/app/(football)/football/[slug]/page.tsx`
- Components: `src/components/football/`
- Demo: `/football/oakridge-fc`
- Demo PIN: `071711`

### Sports portals (per-sport routing)
- Cricket → `src/app/cricket/[slug]/page.tsx`
- Rugby → `src/app/rugby/[slug]/page.tsx`
- Women's FC → `src/app/womens/[slug]/page.tsx`
- Tennis → `src/app/tennis/[slug]/page.tsx`
- Golf → `src/app/(golf)/golf/[slug]/page.tsx`
- Darts → `src/app/darts/[slug]/page.tsx`
- Boxing → `src/app/(boxing)/boxing/[slug]/page.tsx`
- Non-League → `src/app/nonleague/[slug]/page.tsx` + `nl-content.tsx`
- Demo workspace (separate, for old demo flow) → `src/app/(demo-workspace)/demo/[slug]/page.tsx`

### Generic CMS portal routing
- `/{slug}` → `src/app/[slug]/page.tsx` (live)
- `/demo/{slug}` → `src/app/(demo-workspace)/demo/[slug]/page.tsx` (demo)
- Department subpages → `src/app/(dashboard)/[dept]/page.tsx`

### Shared components
- `src/components/portals/RoleAwareQuickActionsBar.tsx` — used by football, cricket, women's
- Quick action data per portal: `src/data/{sport}/role-quick-actions.ts`

### Documentation
- `docs/brand-universe.md` — Pattern 1/Pattern 2 doctrine + fictional brand universe
- `docs/follow-ups.md` — deferred work items (e.g., rugby role model restructure)
- `docs/demo-notes-carney.md` — demo briefing for women's Game Standards module

## Sport portal architecture

### Standard portal patterns
- All portals use `isDemoShell` to gate demo vs real data
- Demo players: Jake "Shooter" Morrison (Darts), Marcus Cole "The Machine" (Boxing), James Harrington (Golf), Big Al (Tennis), Oakridge FC squad (Football)
- AI routes server-side: `/api/ai/{sport}/route.ts`
- ElevenLabs Sarah voice (`EXAVITQu4vr4xnSDxMaL`) is the default voice across portals
- Standard zoom: `zoom: 0.9` — sidebar height must compensate with `calc(100vh / 0.9)`
- Demo PIN: `071711` across all sports

### Page taxonomy
- Page roots use `zoom: 0.9` for density
- Sidebars are sticky, full-height, with `minHeight: 0` on flex children for nav scrolling

## Common pitfalls (learned the hard way)

1. **Type-check is not enough — always `npm run build` before deploy.** `npx tsc --noEmit` catches type errors but does NOT catch:
   - Module not found (missing files imported via @/ aliases)
   - Missing exports (importing named exports that don't exist or were renamed)
   - Bundler-time errors (Turbopack/webpack resolution issues)

   Production build (`npm run build`) catches these. Type-check alone has caused at least one production deploy failure where the VPS build broke after type-check passed locally. **Run `npm run build` locally before any `npm run golive`.** If `npm run build` fails locally, `npm run golive` will fail on the VPS too — but you'll find out faster locally without touching production.

2. **Never assume the role model is the same across portals.** Football Pro = club departments (CEO/Chairman/Manager/etc.). Rugby = individual stakeholders (player/agent/coach/physio/sponsor) — known wrong, deferred restructure in `docs/follow-ups.md`. Always grep `{SPORT}_ROLES` before assuming.

3. **Never assume action target IDs exist.** When defining role-aware quick actions, verify each `targetDept` matches an actual `SIDEBAR_ITEMS` id in that portal — they differ between sports.

4. **Demo-workspace vs live portal confusion.** `/demo/lumio-dev` and `/lumio-dev` route to different files. Always confirm which URL the user wants before editing.

5. **Banner sizing.** Football banner has been "fixed to match cricket" 6+ times. The canonical reference is the cricket hero block. Any future banner changes need defensive comments referencing cricket as the source of truth — see `src/app/(football)/football/[slug]/_components/FootballDashboardModules.tsx`.

6. **Brand audit drift.** When making changes that touch real-world entity references, always classify Pattern 1 (replace) vs Pattern 2 (keep factual). When in doubt, check `docs/brand-universe.md`.

## Tone and approach when working with Arron

- He prefers Claude Code prompts written for him, not manual VS Code/CMD steps
- He values direct pushback over agreeable execution — flag risks and concerns proactively
- Strategic context matters: features serve specific partnership meetings (JOHAN Sports, Neil Snowball at ECB, AFC Wimbledon contacts)
- Solo founder building toward partnership signing milestones, not VC scale
- Time-poor — concise diagnoses + specific fixes preferred over long explorations

## When in doubt

- Check `docs/follow-ups.md` for deferred work
- Check `docs/brand-universe.md` for naming conventions
- Run `git log --oneline -20` to see recent commit context
- Ask before doing destructive operations (rm, force push, schema migrations)
