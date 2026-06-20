# Lumio Watch — Apple Shortcut spec (Phase 0)

Goal: with **no app and no App Store review**, let a player's Apple Watch send a
finished tennis session's **effort summary** to Lumio, which scores it into XP.
This is the pilot/demo ingestion path described in
`docs/watch-gps-reward-concept-review.md`. Productised iOS/Android apps come later.

This pairs with:
- Migration `supabase/migrations/121_coach_watch_sessions.sql`
- API route `src/app/api/coach/watch/ingest/route.ts`

---

## 1. How it works (one paragraph)

Each player has a secret `watch_token` (created automatically with their roster
record). The player installs a small Apple **Shortcut** once and pastes in their
token. On their iPhone, a **personal automation** triggers when a workout ends;
the Shortcut reads that workout's duration, heart rate, active energy and
distance from Apple Health and **POSTs a small JSON payload** to the Lumio ingest
endpoint. Lumio validates the token, checks wearable consent, scores the session
and awards XP. The coach sees it on their dashboard.

> Reality check: iOS may require the phone to be unlocked and may prompt the
> player to confirm the automation. That's fine for a motivated pilot user.
> It is Apple-only for now (Android/Wear OS uses Health Connect in Phase 2).

---

## 2. The JSON contract

`POST https://lumiosports.com/api/coach/watch/ingest`
`Content-Type: application/json`

```json
{
  "token": "<player watch_token>",
  "source": "apple_watch",
  "started_at": "2026-06-20T17:30:00Z",
  "duration_min": 52,
  "avg_hr": 138,
  "max_hr": 171,
  "active_kcal": 410,
  "distance_m": 1240
}
```

All metric fields are optional except `token` and a `duration_min` of at least
**10**. Missing heart rate or distance → the session is still accepted and
flagged `estimated: true` (effort falls back to calories; movement falls back to
calorie burn). Sessions under 10 minutes are rejected (anti-gaming).

**Response:**

```json
{
  "ok": true,
  "player": "Mia",
  "scores": { "effort": 74, "movement": 61, "consistency": 87 },
  "xp_awarded": 72,
  "xp_total": 1840,
  "estimated": false
}
```

**Setup check (optional):** `GET /api/coach/watch/ingest?token=<token>` →
`{ "valid": true, "player": "Mia", "consent": true }`. Use this to confirm a
token before going live.

---

## 3. Build the Shortcut (one-time, per player)

In the **Shortcuts** app → **Automation** tab → **+** → **Create Personal Automation**:

1. **Trigger:** choose **Workout** → **When … Workout Completed** (optionally
   restrict to workout type *Tennis*). Set **Run Immediately** (turn off "Ask
   Before Running" so it fires automatically where iOS allows).
2. **Add Action → Health → Find Workouts**
   - Sort by **End Date**, **Latest first**, **Limit 1** (the session that just
     ended). Optionally filter **Workout Type is Tennis**.
3. **Get details of the workout** (repeat *Get Details of Health Sample* / use
   the workout's variables) to pull:
   - **Duration** → minutes → `duration_min`
   - **Average Heart Rate** → `avg_hr` *(add a Find Health Samples: Heart Rate
     within the workout's date range; take Average and Maximum)*
   - **Active Energy** (kcal) → `active_kcal`
   - **Distance** (metres) → `distance_m`
   - **Start Date** (ISO 8601) → `started_at`
4. **Text** action — build the JSON body using the variables above and the
   player's token (paste the token in once; store it in a **Text** action at the
   top of the shortcut).
5. **Get Contents of URL**
   - URL: `https://lumiosports.com/api/coach/watch/ingest`
   - Method: **POST**
   - Request Body: **JSON** (or **File**, passing the Text from step 4)
   - Header: `Content-Type: application/json`
6. **Show Notification** with `xp_awarded` from the response so the player gets
   instant feedback ("Nice session, Mia — +72 XP!").

> Tip for the demo: also save it as a **manual** shortcut (no automation) so you
> can tap "Send my last session" on stage and show the XP land live.

---

## 4. Token distribution (coach side)

- Every player row already has a `watch_token` (migration 121 backfills and
  defaults it).
- **Phase 0 (now):** read a player's token straight from Supabase and hand it to
  the player/parent with the one-page setup guide. Keep tokens private — they let
  anyone post sessions for that player.
- **Phase 1 (portal):** add a "Connect a watch" panel in the player detail that
  shows a **QR code / copy-link** containing the token and a "Reset token" button
  (so a lost token can be revoked). Wire "Reset token" to overwrite `watch_token`.

---

## 5. Consent gate (must be set first)

Ingest returns **403** unless `coach_players.consent_wearable = true` for that
player. Capture this in the **Consent** tab you just built (add a "Wearable /
heart-rate data" toggle alongside data/photo/medical). No consent → no tracking —
this is the GDPR story, not an afterthought.

---

## 6. Honest limitations to state in the setup guide

- **Effort, estimated and gamified** — not clinical or positional data.
- **No court map / heatmap** — the watch can't place a player on court.
- **Distance is outdoor-only**; indoor sessions score on heart rate + calories
  and are marked *estimated*.
- **iPhone + Apple Watch only** in Phase 0; the phone may need to be unlocked.

---

## 7. What's next (so the pilot has a path)

- **Phase 1:** thin iOS companion app that reads completed HealthKit tennis
  workouts automatically (no manual shortcut), plus the coach-side "Connect a
  watch" panel, leaderboard and "void session" control; map `xp_total` into the
  Racket Progression skill bars.
- **Phase 2:** Android via Health Connect; optional Garmin Health API pull.
- **Phase 3:** live custom watch app for raw accelerometer/gyro → real sprint
  count and direction-change scores.
