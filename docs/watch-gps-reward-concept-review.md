# Lumio Tennis — Smartwatch "Reward GPS" Concept Review

**Question asked:** Drop dedicated GPS units; use the smartwatches people already own, and reposition GPS away from competing on pro heatmaps toward a **reward / engagement system**. Can it work? If yes, how do we make it live?

**Short answer: Yes — but only if you commit to the repositioning fully and make three honest cuts.** The reward-system pivot is the right call and actually *de-risks* the product. The naïve version (watch GPS → court-coverage heatmaps) does **not** work and would get exposed in a demo. Effort / intensity / movement scoring from a standard watch workout **does** work, is partner-credible, and slots straight into your existing Racket Progression reward system.

---

## 1. The one-line verdict

| | |
|---|---|
| **Reward/XP system from watch effort data** | ✅ Viable now. Lead with this. |
| **Court-coverage "heatmaps" from watch GPS** | ❌ Not viable. Cut it from the concept. |
| **"No hardware to buy"** | ⚠️ Mostly true for adults/teens; **not** true for under-13 juniors. Scope accordingly. |
| **The LUMIO Clip (watch on lower back/hip)** | ❌ Cut for v1 — it kills heart rate and re-introduces the hardware you're trying to avoid. |

If you accept those four lines, the rest is an execution plan.

---

## 2. Why court heatmaps are dead with this approach (the honest bit)

Consumer sports-watch GPS has a **mean error of roughly 1.4–1.7 m** in independent testing. A singles court is 8.23 m wide and 23.77 m long; the service boxes are ~4 m deep. So the error is **bigger than the thing you're trying to measure**. As one reviewer put it bluntly, on court "the track will just be a massive jumble." Centimetre-level positioning on a watch (multi-band GNSS + carrier-phase) exists only in research, not in consumer devices.

Two hard consequences:

- **Indoors, GPS gives you nothing** (no satellite lock). A large share of coaching, especially juniors and winters, is indoor.
- **Outdoors, GPS gives you total distance reasonably well, but never position.** Distance covered = fine. "Where on court did they stand" = impossible.

This is exactly why **SwingVision** — the official player-tracking app of the **LTA, Tennis Australia and ITA** — uses the Apple Watch *only* for heart rate, calories and distance, and does its shot/position tracking with the **iPhone camera (computer vision)**, not the watch. The market leaders who *do* produce position/heatmap data (camera systems, UWB pods, racket sensors) are solving a different problem with different hardware. You're right not to fight them on it.

**So: never show a court position heatmap generated from watch GPS. It will be wrong, and a knowledgeable partner (ECB, AFC Wimbledon, an LTA contact) will spot it.** Rename and re-scope the GPS module to **"Effort & Rewards."**

---

## 3. What a watch *can* reliably give you

From a **standard logged tennis workout** (no custom app needed) you get, per session:

- Duration / active time
- Average & max heart rate
- Active calories ("move")
- Total distance (outdoor only)
- Heart-rate zones / time in moderate–vigorous intensity

From a **custom watch app** (more work, later phase) you additionally get live, raw:

- Accelerometer → sprint count, work-rate spikes, intensity bursts
- Gyroscope → direction changes / agility proxy
- Higher-frequency HR

Notice the mapping to your concept's "Calculated Metrics": **Distance, Effort Score (HR + movement), Session Duration are all available immediately. Sprint Count and Direction Changes need the custom app and come later.** Set that expectation now so v1 isn't over-promised.

---

## 4. The thing nobody tells you: you cannot read a watch from a website

Your portal is a web app (Next.js). **Browsers cannot read HealthKit (Apple) or Health Connect (Android).** That data only leaves the phone through a native app or an explicit user-driven export. This is the single biggest architectural fact in the whole idea, so plan the **ingestion path** deliberately. Four realistic options, cheapest first:

| Option | What it is | Effort | Data depth | Good for |
|---|---|---|---|---|
| **A. Apple Shortcuts → webhook** | A Lumio "shortcut" the student installs. iOS fires a **"Workout Completed"** automation, reads the workout summary, and POSTs it to a Lumio API endpoint. No app, no App Store. | **Days** | Summary (HR, calories, distance, duration) | **Pilots + the partnership demo** |
| **B. Manual Health/GPX export upload** | Player exports a workout file; portal AI parses it into a session. | Hours | Summary, sometimes route | A single proof-of-concept |
| **C. Thin native companion app** | iOS/Android app that reads *completed* HealthKit/Health Connect workouts, scores them, and syncs to Supabase under the player's login. | **Weeks–months** | Summary, robust + automatic | **The productised v1** |
| **D. Live custom watchOS / Wear OS app** | A real watch app running during the session, capturing raw accelerometer/gyro. | **Months** | Full (incl. sprint/direction) | Phase 3, only if the extra metrics earn it |
| **E. Garmin Health API (optional)** | Server-to-server pull from Garmin's cloud (approval required) for academies on Garmin. | Weeks | Summary | A specific Garmin-heavy partner |

**Recommended sequence: A now → C as v1 → D later.** Do **not** start with a custom watchOS app; it's the most expensive option and you don't need raw accelerometer data to launch a reward loop.

Caveats to bank now: Option A requires the phone unlocked and a tap to confirm (fine for a motivated student, not silent). Apple and Android are **separate builds** at the app stage — **start Apple-only** (highest share in your demographic, cleanest Shortcuts path, SwingVision precedent) and add Android once it's proven.

---

## 5. Turning watch data into XP (the scoring model)

Keep it honest, age-fair and hard to game:

- **Effort Score** — % of session in moderate/vigorous HR zones, blended with active-calories-per-minute. If the watch has no usable HR (e.g. a borrowed device), fall back to calories + movement only and label it "estimated."
- **Movement Score** — distance + (phase 3) sprints and direction-changes per minute.
- **Consistency Score** — session duration + attendance streaks (you already track attendance).
- **XP** = weighted blend, **normalised per age band and level**, so a 9-year-old red-ball player isn't ranked against an adult on absolute numbers.
- **XP feeds your existing Racket Progression** — it tops up skill bars / contributes to racket-stage unlocks you've already built (`coach_player_skills`, the racket reward system).
- **Anti-gaming:** cap XP per session, require a minimum duration, sanity-check HR/distance ranges, and give the coach a one-click "void session." The coach being in the loop is itself a selling point.

The strategic point: you're not selling *accuracy*, you're selling *motivation*. "Estimated effort, gamified" is a perfectly honest promise and a category nobody at grassroots owns.

---

## 6. How it slots into what you've already built

You don't need much new surface area:

- **Rename the GPS & Heatmaps module → "Effort & Rewards."** Strip the court-position heatmaps; keep the effort/intensity/distance/HR cards and the AI brief.
- **New table** `coach_watch_sessions` (player_id, source, started_at, duration_min, avg_hr, max_hr, active_kcal, distance_m, effort_score, movement_score, xp_awarded, raw_json, consent_ok). Mirror the RLS pattern of your other `coach_*` tables.
- **New ingestion route** `/api/coach/watch/ingest` (service-role, signed per-player token) that accepts the Shortcut/app payload, computes scores, writes the row, and increments XP.
- **Map XP → Racket Progression** via the existing skills/award helpers.
- **Consent gate** — extend the consent system you just built with a **"wearable / biometric data"** consent type. Heart rate from a minor is biometric data; no consent → no tracking. This actually *showcases* your new GDPR/DBS work rather than fighting it.

---

## 7. The bits the concept doc gets wrong (push-back)

1. **Drop the LUMIO Clip for v1.** Mounting the watch on the lower back/hip gives better centre-of-mass movement data — but **optical heart rate only works against the wrist**, so a hip-mounted watch *loses HR*, which is the single best effort signal you have. It also re-introduces a manufactured hardware accessory and "consistent orientation / durable for school use" QA — the exact cost and friction you're trying to delete by going watch-based. **Keep it on the wrist.** Revisit a clip only if Phase 3 movement analytics ever justify it.
2. **"Most people have a smartwatch" — not the juniors.** True for adults and many teens; **not** for under-13s, which is much of the schools/grassroots cohort behind your ECB / AFC Wimbledon / schools angle. Scope v1 to adults, teens and academy players whose parents will lend a phone/watch, and offer a **phone-in-pocket fallback** (cruder, calories/steps only) for kids without a watch.
3. **"Court Coverage Score" can't come from watch GPS.** Either remove it, or redefine it as a *movement-volume* score (distance + work rate), not a *position* score. Don't imply a court map.

---

## 8. Action plan

### Phase 0 — Pilot & demo (target: ~2 weeks, no app, no store)
- [ ] Re-scope the module to **Effort & Rewards**; remove watch-GPS heatmaps from UI and marketing.
- [ ] Define the scoring model (above) and XP → racket mapping on paper, signed off by you.
- [ ] Build `coach_watch_sessions` table + migration, and the `/api/coach/watch/ingest` endpoint.
- [ ] Build a **Lumio Apple Shortcut** ("Workout Completed" → read summary → POST to ingest) and a one-page install guide for players.
- [ ] Add the **wearable/biometric consent** type to the consent flow.
- [ ] Run a real pilot with your two test coaches + a handful of willing adult players. Watch the XP loop fire end-to-end. **This is the demo.**

### Phase 1 — Productised v1 (target: ~6–10 weeks)
- [ ] Build the **thin iOS companion app**: sign in as a Lumio player, read completed HealthKit tennis workouts, score them, sync to Supabase automatically. (Apple-only.)
- [ ] Coach-side leaderboard, per-player effort trend, "void session," and XP review.
- [ ] Anti-gaming caps + sanity checks.
- [ ] Tighten the age-band normalisation so junior vs adult rankings are fair.

### Phase 2 — Reach (target: post-v1)
- [ ] **Android companion app** via Health Connect / Wear OS Health Services.
- [ ] Optional **Garmin Health API** pull for any Garmin-heavy academy partner.

### Phase 3 — Depth (only if metrics justify it)
- [ ] **Live custom watch app** (watchOS first) for raw accelerometer/gyro → real **sprint count and direction-change** scores. Re-evaluate the clip here, not before.

---

## 9. Why this is strategically smart (the commercial case)

- You **stop competing** with TrackMan / camera systems / UWB pods on accuracy — a fight a solo founder can't win — and **start owning** "effort & engagement gamification for grassroots and junior tennis," which nobody at that level owns.
- **Zero hardware** kills your biggest cost, support burden and sales objection.
- It compounds your existing assets: Racket Progression, attendance, the coach dashboard, and the consent/compliance layer you just shipped.
- It's a clean, honest story for partnership meetings: *"We don't pretend a £300 watch is a TrackMan. We turn the watch a player already owns into a motivation engine that keeps kids training and gives coaches an effort signal."*

---

## 10. The one risk to never forget

The entire idea is credible **only** while you are honest that this is *estimated effort, gamified* — not precision sports science. The moment a screen implies court-position accuracy the watch can't deliver, the credibility you're building with the LTA/ECB-type contacts evaporates. Keep the language and the visuals on the right side of that line and this is a genuinely strong, ownable product.

---

### References
- Apple HealthKit — reading workout, heart-rate and route data (third-party apps): https://developer.apple.com/documentation/healthkit/reading-route-data ; https://developer.apple.com/health-fitness/
- Android Health Connect / Wear OS Health Services — reading exercise sessions: https://developer.android.com/health-and-fitness/health-connect/read-data ; https://developer.android.com/health-and-fitness/health-services
- Consumer sports-watch GPS accuracy (~1.4–1.7 m; "useless" on court): https://www.sciencedirect.com/science/article/pii/S0263224124003117 ; https://www.digitaltrends.com/wearables/smartwatch-gps-is-iffy-but-the-recipe-for-ultra-precise-positioning-is-ready/
- SwingVision (Apple Watch HR/calories/distance; official app of LTA, Tennis Australia, ITA): https://apps.apple.com/us/app/swingvision-tennis-pickleball/id989461317 ; https://www.imore.com/apps/level-up-your-serve-with-ai-powered-tennis-coaching-iphone-app-swingvision
- Apple Shortcuts "Workout Completed" automation → read Health data → POST to webhook: https://blog.maximeheckel.com/posts/build-personal-health-api-shortcuts-serverless/
