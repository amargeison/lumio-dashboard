# Effort & Rewards v1.5 — device sync via an aggregator (Terra vs Vital)

Status: 2026-06-30. Decision doc. Companion: `docs/effort-rewards-go-live.md`.

## Why an aggregator (not direct integrations)

As of mid-2026 the direct routes are blocked or in flux:

- **Garmin** — the Garmin Connect Developer Program is **on hold for new sign-ups**.
  You can't get direct access right now.
- **Fitbit** — the legacy Fitbit Web API is being **shut down in Sept 2026** and folded
  into Google's Health API; under-13s need linked parent+child Google accounts (Fitbit
  Ace) with heavy restrictions.
- **Apple Health** — no cloud/web API at all (on-device only); needs a Shortcut or a
  native app.

An aggregator gives you **one integration** that covers Garmin, Fitbit, Apple, Strava,
Samsung, Oura, WHOOP, Polar, etc., normalises the data to one schema, handles the OAuth
and the partner approvals (incl. Garmin, which they already hold), and pushes new
sessions to you via webhook. For a solo founder this is far less work and risk than
building and maintaining three OAuth flows against moving targets.

## The two options

| | **Terra** (tryterra.co) | **Vital** (tryvital.io) |
| --- | --- | --- |
| Coverage | 500+ providers; Garmin, Fitbit, Apple, Strava, Samsung, Oura, WHOOP, Google Fit | Broad wearable coverage; strong Apple/Android Health SDKs; lab-test focus too |
| Best at | Pure fitness/activity breadth, sport sessions, simple "connect a device" widget | Health/clinical + wearables; polished SDKs; good if you later add health metrics |
| Model | Hosted connect widget + webhooks; normalised activity payloads | Hosted connect + SDK + webhooks; normalised payloads |
| Compliance | HIPAA, SOC 2 | HIPAA, SOC 2 |
| Indicative cost | ~£/$399/mo annual tier (≈100k credits); smaller starter tier | Usage-based tiers; free/dev tier to prototype |

> Verify current pricing/tiers and per-connected-user limits with each vendor at
> contract time — both change. Both are HIPAA/SOC2 and webhook-based, so the
> integration shape below is the same either way.

## Recommendation

**Terra**, for this use case. It's the more activity/fitness-native of the two (we only
need finished tennis/sport sessions: duration, HR, distance, calories), has the widest
device coverage including the Garmin partnership, and the connect-widget → webhook flow
maps cleanly onto what we already have. Vital is the better pick only if Lumio later
moves into health/clinical metrics; we don't need that for XP.

Either way: prototype on the **free/dev tier** with your own Garmin/Fitbit first. Only
commit to a paid tier once enough families are actively connecting to justify it.

## How it slots into what's already built (small)

Our backend already has everything except the connect flow:

- Scoring + XP + anti-gaming: `src/app/api/coach/watch/ingest/route.ts`
- Storage: `coach_watch_sessions`, `coach_players.xp_total`
- Dashboards: `LiveEffortRewards` (coach) + `StudentPortal` (player)

Add one webhook route, `POST /api/integrations/terra` (or `/vital`):

1. **Connect:** in the student app, a "Connect a device" button opens the aggregator's
   hosted widget (or a generated auth URL). Map the returned `user_id` to our
   `coach_players.id` (store an `aggregator_user_id` column).
2. **Webhook:** on each new `activity`/`workout`, verify the signature, find the player
   by `aggregator_user_id`, map the normalised payload → our fields (`duration_min`,
   `avg_hr`, `max_hr`, `active_kcal`, `distance_m`), then reuse the **existing** scoring
   + insert + XP-bump logic (extract it from the watch-ingest route into a shared
   `scoreAndStoreWatchSession()` so both the Shortcut and the aggregator call it).
3. **Consent:** keep gating on `consent_wearable` (this path *does* process biometric HR
   data, unlike the manual log).

No change to the dashboards — they already render `coach_watch_sessions`.

## Effort estimate

| Task | Effort |
| --- | --- |
| Pick vendor, create account, prototype connect with your own device | 0.5 day |
| `aggregator_user_id` column + connect button in student app | 0.5 day |
| Webhook route + signature verify + payload mapping | 0.5–1 day |
| Refactor scoring into shared helper (used by Shortcut + aggregator) | 0.5 day |
| QA across two real devices (e.g. a Garmin + a Fitbit) | 0.5 day |

~2–3 days once a vendor is chosen and there's budget. The manual-log path (already
built) covers everyone in the meantime, so there's no rush — turn this on when active
families make the monthly fee worth it.

## Kids / safeguarding notes

- Many juniors won't have an OAuth-capable account in their **own** name (Fitbit Ace is
  under-13 via a parent; Garmin/Strava are 13+). Often it's a **parent's** device/account
  being connected — make the consent copy explicit about whose data it is.
- `consent_wearable` stays the gate for any biometric (HR) sync. Manual logging needs no
  such consent (self-reported, no biometrics).
- Effort only — no location/court tracking — stays true and stated in copy.
