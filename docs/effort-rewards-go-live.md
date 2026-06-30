# Effort & Rewards — go-live plan

Status: 2026-06-30. Owner: Arron.
Companion docs: `docs/specs/lumio-watch-shortcut-spec.md` (the Shortcut build),
`docs/watch-gps-reward-concept-review.md` (concept).

## The headline

This is **much closer to live than "not built"**. The backend, scoring, security,
consent gate, dashboards and the connect-a-watch panel are all shipped. A valid
session POSTed to the ingest endpoint **already** becomes XP and shows on the
portal today. The remaining work is the **player-side capture artifact** (the Apple
Shortcut) and real-device QA — not the platform.

## Already live — no work needed

| Piece | Where | State |
| --- | --- | --- |
| Schema: `coach_watch_sessions`, `coach_players.watch_token / consent_wearable / xp_total`, auto-token + unique index | `supabase/migrations/121_coach_watch_sessions.sql` | ✅ |
| Ingest API: token auth → consent gate (403) → scoring → insert → XP bump; GET token-check | `src/app/api/coach/watch/ingest/route.ts` | ✅ |
| Scoring + anti-gaming (≥10-min floor, 120-XP cap, estimated fallback) | ingest + `_lib/effort-rewards.ts` | ✅ |
| Live dashboard (leaderboard, XP/level, latest + history, void) | `_components/LiveEffortRewards.tsx` | ✅ |
| Connect-a-watch panel (per-player QR + link + token + reset button) | `_components/WatchConnectPanel.tsx` | ✅ |
| Public setup page | `src/app/tennis/watch/page.tsx` | ⚠️ manual steps |
| Wearable consent toggle (per player) | `_components/LiveRoster.tsx` | ✅ |
| Apple Shortcut build spec | `docs/specs/lumio-watch-shortcut-spec.md` | ✅ written |

> Note: the existing Shortcut spec lists a "Phase 1 Connect-a-watch panel" as future —
> that's now **built**. The spec text is just slightly behind the code.

## Remaining work to go live (ordered)

| # | Task | Owner | Effort | Notes |
| --- | --- | --- | --- | --- |
| 1 | **Build the "Lumio Tennis XP" Shortcut** + iCloud share link, manual-trigger first | Arron (Shortcuts app) | 1–2 hrs | Follow `lumio-watch-shortcut-spec.md` §3. Critical path. |
| 2 | **Real-device QA** via the manual shortcut after a Tennis workout | Arron | 30 min | Row + XP should appear in Effort & Rewards. |
| 3 | **Swap setup page** to "Install shortcut + paste token" (collapse manual steps into Advanced) | Code | ~1 hr | `src/app/tennis/watch/page.tsx`. Small FE change. |
| 4 | **Token-reset route** `POST /api/coach/watch/token` (coach-auth) | Code | ~30 min | Panel's "Reset token" button already calls an `onReset` — needs the route + wiring. |
| 5 | Switch trigger to **Run-Immediately automation**; re-QA hands-free | Arron | 30 min | Fully automatic once verified. |
| 6 | (Optional, Phase 2) Android/Garmin via Health Connect + a manual "log session" fallback | Code | later | Same endpoint/payload, no backend change. |

Critical path is **#1** (the artifact). Everything else is small.

## Prove it works right now (no watch needed)

```bash
curl -X POST https://<your-domain>/api/coach/watch/ingest \
  -H 'Content-Type: application/json' \
  -d '{"token":"<a real player watch_token>","duration_min":45,"avg_hr":150,"active_kcal":420,"distance_m":3200}'
```

Expect `{ ok:true, xp_awarded, xp_total }`, then the session + XP show in the player's
Effort & Rewards. (Get a real token from the player's Connect-a-watch panel.) This is
the fastest way to confirm the live path before touching the watch.

## QA matrix

- Consent OFF → ingest returns **403**; ON → accepts. (Toggle in roster.)
- `duration_min: 5` → **422** (too short).
- No `avg_hr` → accepted, `estimated:true`, still scores.
- Manual shortcut after a real Tennis workout → row appears.
- Automation (Run Immediately) → hands-free XP after a workout.
- Reset token (once #4 lands) → old link 404s, new one works.

## Decisions for you

1. **Token onboarding for the pilot:** simplest is one shared iCloud template shortcut
   (endpoint baked in, **no** token) + the player pastes **their own** token once from
   the setup page. Never bake a shared token into the public template. OK to proceed
   this way?
2. **Scope for go-live:** ship #1–#3 for the pilot and treat #4 (reset route) + #5
   (automation) as fast-follows, or do all five before first family test?

Tell me the answers and I'll build #3 and #4 (the code tasks) and tighten the setup
page to match your Shortcut.
