# Travel & Logistics — v1 vertical slice (Women's portal) — session handoff

**Built:** Women's portal first (the Travel & Logistics nav button already existed
there with an empty panel — we populated it). Demo URL: `localhost:3000/womens/womens-demo`
(Oakridge Women FC). DEMO-first: no real Maps / Anthropic / Resend calls on demo
interactions.

## What shipped (4 commits on `dev`)

1. `4b3b9ae2` — **Migration `106_sports_travel.sql`** + `scripts/apply-sports-travel-migration.mjs`.
2. `e08b0647` — **Shared, portal-agnostic core**: `trip-types.ts`, `trip-rates.ts`,
   `overnight-engine.ts`, `trip-data-source.ts`, + Oakridge demo seed
   `womens-trip-fixtures.ts`.
3. `dfb5cbf4` — **Travel & Logistics panel** (`TravelLogisticsView.tsx`) + wired into
   `womens/[slug]/page.tsx`.
4. `5a6a2f78` — lint cleanup.

### Schema (migration 106 — NOT YET APPLIED, see below)
- `sports_trip_suppliers` (coach / hotel / catering / minibus / other) with
  **TEMPORARY** nullable `rate_*` columns + `region` (for future benchmarking).
- `sports_trips` — carries overnight fields **from the start**: `is_overnight`,
  `nights_count`, `hotel_supplier_id` (plus coach/catering supplier links). So
  overnight trips need **no re-migration** when exercised on a live portal.
- 3 enums, all FKs indexed, per-table `updated_at` triggers.
- **RLS** (mirrors `junior_*` pattern): read = any active club member
  (`sports_member_club_ids()`); write = ops/admin role_templates
  (`owner/admin/ceo/chairman/manager/head_operations/team_manager/coach`) via
  `sports_ops_writer_club_ids()`, **fails closed on null role_template**. Both
  helpers are generic (`sports_*`) so Club/NL ports reuse them verbatim.
- Validated: parses as valid PostgreSQL (`pglast`).

### Decision engine (the core feature)
- `compareTripCosts()` **always** returns BOTH a same-day cost AND an overnight
  cost, the **difference**, and a **non-binding** recommendation + rationale. The
  human always decides — the system never forces a choice.
- Heuristic (v1): recommend overnight only when one-way drive **> 3.5h** AND the
  same-day return would land **after ~midnight** (kickoff + match duration +
  60-min depart buffer + drive home). Otherwise it shows "your call" or leans day
  trip. Thresholds are configurable constants in `trip-rates.ts`.
- Unit-checked against the 3 demo trips: Hartwell → day trip (£149 vs £1,385),
  Tyneside → overnight recommended (late 00:38 return; hotel £900 + meals £336),
  Westport → borderline "your call" (late return but sub-threshold drive).

### Panel (single-user ops / secretary persona)
Trip list with recommendation badges + mini day-vs-overnight figures, supplier
list, create-trip modal, trip detail with the **same-day-vs-overnight comparison
side by side** (both breakdowns, difference, recommendation, late-return flag),
and the draft flow. Re-themeable; all logic comes from the shared lib.

### Draft flow (recommend → draft → handoff), wired end-to-end in demo
"Draft coach enquiry" → **canned** pre-written draft → editable subject/body →
**simulated** send ("Enquiry would be sent to Pennine Coachways — demo, no email
sent"). Hotel / meal-stop / itinerary / social drafts are canned too. Lumio never
books directly.

## What's STUBBED / flagged

- **Placeholder rates** — `trip-rates.ts` holds clearly-labelled `TEMPORARY`
  constants (coach £2.40/mi, hotel £75/room/night, meal £14/head, etc.). The
  comparison renders entirely off these today. Swap in one place later, or
  override per-supplier via `sports_trip_suppliers.rate_*` (already in schema).
- **Real-API path** — `trip-data-source.ts` has a full `mode: 'demo' | 'live'`
  switch. `demo` (canned/in-memory/simulated) is the ONLY path exercised today.
  `live` is **scaffolded but not wired**: Supabase reads/writes are implemented;
  Maps drive-time lookup, Anthropic draft generation, and Resend send are marked
  `TODO(live)`. A signed client's live portal flips `isDemoShell === false` →
  `mode='live'` with no UI rework.
- **Rate benchmarking** (pooled cross-club rates by region + squad size) —
  "coming soon" placeholder card only; needs multiple clubs on platform first.
- **Migration 106 NOT applied to Supabase.** `.env.local` has only
  `SUPABASE_SERVICE_ROLE_KEY` (can't run DDL via PostgREST) — no `DATABASE_URL`
  or `SUPABASE_ACCESS_TOKEN`. **Apply by pasting `106_sports_travel.sql` into the
  SQL editor** (`https://supabase.com/dashboard/project/nrrympsgxsadiemzqwci/sql/new`),
  or add a credential and run `node scripts/apply-sports-travel-migration.mjs`.
  The demo panel runs fully WITHOUT the table existing (demo data is in-app), so
  the slice is demonstrable now.

## Recon findings that changed assumptions
- The spec's `squad-data-source.ts` demo/live file **does not exist**. The Women's
  portal is entirely static demo data gated by slug (`demo-slugs.ts`); there was
  no demo/live *adapter* anywhere. `trip-data-source.ts` is the first one and
  follows that convention + adds the mode flag the spec wanted.
- Panel mechanism = client `useState('dashboard')` → `setActiveSection` →
  `renderSection()` switch in a **6,137-line** `womens/[slug]/page.tsx`. The
  `travel-logistics` case shared a generic "Coming soon" placeholder with
  `matchday-ops/pitch-grounds/training-ground`; we split it out. Nav button reused
  (not added).
- `/womens/womens-demo` resolves to `DEMO_CLUBS['oakridge-women']` via fallback —
  Oakridge Women FC was already the demo club.
- One demo fixture (Tyneside) was retimed to a 17:30 evening kickoff so its 4.3h
  drive produces a genuine post-midnight return — otherwise a 15:00 KO gets the
  squad home by 22:08 and the engine (correctly) would NOT recommend overnight.

## Next steps
1. **Apply migration 106** (SQL editor) — confirm `sports_trips` +
   `sports_trip_suppliers` exist.
2. **Wire the live path**: Maps drive-time lookup on create, Anthropic draft
   generation (`/api/ai/womens`), Resend send — all marked `TODO(live)` in
   `trip-data-source.ts`. Add `clubId` resolution for the live `/womens/app` route.
3. **Port to Club/Woking, then Non-League** via copy-and-retheme: copy
   `TravelLogisticsView.tsx` + a portal fixtures file into the new portal, swap
   accent + demo data, render in that portal's section switch. The shared lib
   (`src/lib/sports/travel/*`) and RLS helpers are reused untouched.
4. Remaining draft types and rate-benchmarking remain future work.

## Local test note
Verified: migration parses (pglast), engine math unit-checked, all new files
typecheck clean, ESLint clean. Not run: `npm run dev` / `next build` (didn't fit
the session). To eyeball it: `npm run dev` → open `/womens/womens-demo` → sidebar
**Travel & Logistics**. Do NOT `npm run golive` until reviewed.

> Housekeeping: `tsconfig.travelcheck.json` (repo root, untracked) is a temporary
> scoped typecheck config from this session — safe to delete.

---

# v2 redesign — AI agent as the flagship (follow-up session)

Reframed per founder feedback: the flagship is the **AI doing the booking
legwork**, not the cost table. Commits `3fd5f50e`, `1694580c` on `dev`.

## What changed
- **Travel Researcher (`TravelResearcher.tsx`)** — the hero. A 4-step AI agent
  (Configure → Research → Results → Book) adapted from the Boxing/Tennis
  "Travel Researcher" pattern for a football away day: **coach + hotel + meals**
  (NO flights — Pro Phase 2). Modes: Full away day / Coach only / Hotel only /
  Meals only — so you can do the whole trip in one or just book a coach. It
  researches, **scores** options (Lumio score + cheapest/best badges), drafts a
  booking enquiry, and hands off (simulated send). Canned in demo; live AI
  scaffolded (`TODO(live)` → `/api/ai/womens`).
- **AI supplier discovery** — results aren't limited to saved suppliers. Options
  with `savedSupplierId: null` are flagged "✨ Found for you" with a **Save
  supplier** chip, and a callout explains it. This is the answer to "a new club
  in a new division has no hotels/caterers saved" — the agent finds them.
- **Overview reframed** — leads with the **"Plan away trip"** hero + one-click
  **Book Team Coach / Book Hotel / Order Pre-Match Meals** cards, plus the
  **"what's booked" status board** (Coach/Hotel/Meals/Status per away fixture)
  and season stats. Status board + book buttons were ported from the old Club
  Operations travel tab.
- **Cost compare demoted** — the same-day-vs-overnight comparison moved into a
  **Cost compare** sub-tab (`TripCostCompare.tsx`). Still fully functional
  (engine, both costs, recommendation, per-trip draft→send); just no longer the
  headline. Module sub-tabs: Overview / Cost compare / Suppliers.
- **Club Operations travel tab retired** — `PlayerWelfareHub` gained a
  backward-compatible `hideTravelTab` prop. Women's Club Operations now passes
  it (defaultTab → matchday, subtitle drops "Travel logistics"). **Men's
  football is unaffected** (prop defaults false; the tab still shows there).

## Still stubbed / next (updated)
- Researcher **live path** (`mode='live'`): real coach/hotel/catering research +
  scoring via `/api/ai/womens`, a real search/Maps source for discovery, and
  Resend send. Demo canned path is the only one wired.
- **"Save supplier"** in the researcher is UI-only in demo — on live it should
  `INSERT` into `sports_trip_suppliers`.
- Migration 106 still needs applying (SQL editor) — unchanged from above.
- **Club/Woking + Non-League port**: copy `TravelLogisticsView.tsx`,
  `TravelResearcher.tsx`, `TripCostCompare.tsx` + a portal fixtures file into the
  new portal; swap accent + demo data; render in that portal's section switch.
  Shared lib (`src/lib/sports/travel/*`) reused untouched. For men's football,
  decide whether to give Travel & Logistics its own menu item too (then pass
  `hideTravelTab` to its Club Operations as well).

> Environment note: the editor tooling intermittently truncated large files on
> in-place edits this session (`page.tsx`, `PlayerWelfareHub.tsx`) — each was
> caught via syntactic typecheck and rebuilt cleanly before commit. All files
> verify NUL-clean, typecheck and lint clean.
