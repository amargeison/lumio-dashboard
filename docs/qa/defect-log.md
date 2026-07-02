# Lumio Tennis Coach — Defect Log (white-box audit)

Date: 2026-07-02. Method: white-box code audit (6 parallel module auditors) + live network trace.
Legend: **Blocker** ships-stopping · **Major** wrong behaviour/data · **Minor** edge/robustness · **Cosmetic** polish.
Browser click-through pending (blocked by the extension's network-idle wait on the live PWA — see note at end).

## ✅ Already fixed this session
- **[Major] Dashboard stat counts 503'd (Staff, Lessons-this-week).** `useCoachStats` used `count:'exact',head:true` HEAD requests that returned 503 under the dashboard's ~18-parallel-query load. Rewritten to derive counts from the shared cache (plain GETs). *Fixed in `coach-db.ts`; type-checked.*

---

## 🔴 Blockers

1. **Multi-academy membership is non-deterministic (security).** `src/lib/coach/membership.ts:45,49` resolves membership with `.maybeSingle()`, but `coach_members` allows the same email/user in **multiple academies** (parent with kids at 2 clubs; coach who is also a parent). With >1 row, PostgREST errors/returns null → user is locked out **or bound to the wrong academy** (wrong-tenant data). Fix: deterministic selection (academy from the portal URL/slug) instead of `maybeSingle()`.

2. **Stripe payments never reach the coach's payment status.** Checkout + webhook write **`coach_charges`** (`api/coach/pay/checkout`, `pay/webhook`), but the tiles, the table "Paid" column, and the dashboard "Payments due" all read **`coach_payments`** (`LivePayments.tsx:87-88,182`, `LiveCoachDashboard.tsx:77`). A player pays → money lands → coach still sees the pack **unpaid forever**. Also the PayModal sends no `package_id`, so even manual reconcile can't match the charge. Fix: reconcile `coach_charges → coach_payments` in the webhook (link by package_id/player), and handle the `?paid=1` return with a refresh.

3. **AI highlight clips orphaned for player-less recordings.** `api/coach/media/process/route.ts:71,77` falls back to `player_name:'Recorded session'` when no player is chosen; clips inherit that name, and the portal fetches highlights by `ilike('player_name', name)` → they can **never** match a real player → invisible to students even after Publish. Fix: tie clips to `player_id`; portal query by id.

4. **Equipment auto-seed guard is per-browser, not per-account.** `LiveEquipment.tsx` + `settings-store.ts` store `equipmentSeeded` under a single global localStorage key. On a shared browser, a second coach who signs in sees an **empty** Equipment page (seed skipped). Fix: per-coach seed flag (Supabase), not localStorage.

## 🟠 Security / privacy (high)

5. **Portal player data scoped by NAME, not id.** `api/portal/player/route.ts:27-40` fetches sessions/bookings/media/messages/highlights with `ilike('player_name', name)` / `ilike('recipients', name)`. Two academies (or one academy) with **two same-named children** → a parent sees the **other child's** data. `ilike` also treats `%`/`_` in names as wildcards. `skills` and `watch` already scope by `player_id` — do the same everywhere. (`coach_player`/`message` routes share the weakness.)

6. **Children's photos in a PUBLIC bucket at a guessable path.** `api/portal/avatar` + `api/coach/avatar` write to the public `avatars` bucket at `{academyId}/{playerId}.jpg` — permanently public, no signed URL (session media correctly uses signed URLs). Safeguarding/GDPR concern for minors. Fix: private bucket + signed URLs.

7. **`portal/watch/log` XP update missing `coach_id` guard.** `route.ts:76` updates `coach_players.xp_total` with `.eq('id', scopePlayerId)` only (no `.eq('coach_id', academyId)`). Not currently exploitable (player pre-verified) but diverges from the defense-in-depth pattern used everywhere else. Add the guard.

## 🟠 Major (wrong behaviour / data)

8. **`awardThreshold` setting ignored in live modules.** Every live "racket ready/mastered" calc hardcodes `score >= 4` (`coach-db.ts`, `LiveRoster/LiveDevelopment/LiveRacketProgression`), but Settings exposes `awardThreshold` (default **3**) and the **demo + student app honour it**. A coach who sets "award at Consistent" still needs level 4 in the live portal → progress %, certificates, "ready" tile all inconsistent with what the parent sees. (Plus terminology drift: Settings labels 3="Consistent"/4="Mastered" while modules say 4="Consistent".)

9. **Three divergent effort-scoring formulas.** `ingest score()`, `scoreManualSession()`, and demo `scoreGpsSession()` all claim "the same shape" but use different curves/ranges (movement 10–35 vs 15–75 m/min). The same session scores differently by entry path; demo leaderboard data isn't comparable to live. Fix: one shared scorer.

10. **Session Planner links booking→plan by name+date, not booking id.** `LiveSessionPlanner.tsx:96` — two same-day sessions for one player collapse to one plan; building one marks the other "planned"; Print pulls from a different source than the Today tab. Fix: store/link `booking_id`.

11. **Inbound replies don't thread for multi-recipient sends.** `send/route.ts` logs one row with `recipients` = joined list; inbound stores a single name; `LiveMessages` groups by exact string → any broadcast/multi-send forks replies into a new conversation. `thread_key` exists but is never written outbound/read. Fix: per-recipient rows + thread_key.

12. **Reply/Forward bindings wrong (Messages).** Reply to a broadcast keeps only the first name and needs an exact roster match (dead Reply for parent/venue/inbound-only convos). "Forward" opens with empty recipient and prepends "Re your message:" — behaves like reply-with-quote, not forward.

13. **Publish gate bypassable + blank-shot publish (Highlights).** `LiveVideoAudio.tsx:170-176` — the shot `<select> onChange` calls `confirmShot(...,shot_confirmed:true)`, so *correcting* a label instantly publishes to students (no review step). The empty `—` option publishes a clip with `shot_type:null` and a broken title. Fix: staging vs an explicit publish; guard empty value.

14. **Highlights only for single-file video uploads.** `process/route.ts` sets `clipSource` only when `!multi && isVideo`; the multi-part "record in sections" flow (which the UI promotes) gets a summary but **no highlights**, silently. Duration clamp also frequently absent (webm duration null → `Infinity`).

15. **UTC vs local date boundary (off-by-one).** `lessonsThisWeek`/`newPlayers` (`coach-db.ts`), dashboard `weekAgo`, and `LiveCourtPlanner.todayISO()` use UTC `toISOString().slice(0,10)` while the rest uses local `toLocaleDateString('en-CA')`. Evening BST → counts and "today" can be a day off. Fix: one local-day helper.

16. **"Discard" in the recording modal doesn't discard.** `MediaCaptureModal`/`LiveLessons` — the server writes the `coach_sessions` row during processing; both Save and Discard just reload, so "Discard" leaves the summary in place. Fix: Discard deletes the server row (or don't persist until Save).

## 🟡 Minor (selection)
- Dashboard: "Needs attention" matches players by name not id (blank/duplicate names); untimed bookings sort above timed; stat tiles can lag mutations from other modules (cache never invalidated cross-module); a failed load looks identical to "empty" (no error state).
- Roster: `parent_email` fallback references a non-existent column; avg-HR can `NaN`; GPS effort tiles show HR with no wearable-consent gate.
- Camps: no edit-camp form (scalars uneditable after create); saved "collected" total drifts from live tally.
- Court/Equip: kit "Add item" no dedup; resources "Drill Library" vs "Drill" tab confusion; sync banner names only first provider; clearing a booking's time orphans its calendar event (no delete).
- Payments: `?paid=1` return unhandled; "used" can exceed pack; togglePaid is manual-only (consequence of #2).
- Effort: coach-log defaults to first *unsorted* player not the selected one; `voided` null handling differs coach vs portal; XP total non-atomic read-modify-write.
- Messages: channel "Live/Setup" tag from localStorage can contradict server deliverability; partial send shown as full success.
- Settings/nav: two overlapping hidden-nav lists (`ALWAYS_VISIBLE` vs `COACH_HIDDEN_NAV`); StudentPortal avatar not reloaded after change.

## ✅ Verified working (high-confidence, no defect)
Player/staff add-edit-delete + photo + consent + invite routes; skill scoring upsert; award/certificate flow; attendance auto-mark on AI summary; transcribe→summary→coach_sessions; wearable-consent gate on watch ingest; **student highlight publish gate** (`shot_confirmed=true` — unconfirmed clips withheld); role gating on every `/api/portal/*` route; sub-coach scoping; head-coach profile now seeds from the real account (not demo); all 15 settings cards→modals; collapsible sections; theme/feature-flag/menu-visibility; StudentPortal buttons; Stripe connect/webhook signature; package CRUD; calendar two-way sync fires on create/update/cancel; booking add/edit/delete → grid + dashboard; camp create→packs→finance; map/directions links.

## Note on the browser click-through
Automated visual testing is blocked: the Chrome extension's screenshot/read tools wait for "network idle," which neither the live portal nor the demo ever reports (a persistent PWA/service-worker connection — not a tight-timer bug). Recommend a **you-drive / I-observe** pass for the visual/UX layer to complement this code audit.
