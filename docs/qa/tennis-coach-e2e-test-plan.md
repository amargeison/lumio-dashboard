# Lumio Tennis Coach — End-to-End Test Plan & Coverage Matrix

Prepared by: QA. Goal: exercise **every** button, module, stat, and multi-user flow
so nothing ships broken. This doc is both the plan and the execution checklist.

## 1. Environments & method
- **Primary:** live coach portal on production (real `Live*` components + Supabase), using a dedicated **test coach account**.
- **Secondary:** the email-gated **demo** (sample data, `*View` components).
- **Method:** white-box code audit (this doc + source trace) **and** live click-through via the Claude-in-Chrome extension.

## 2. Test accounts required
- Test **coach** (head) login + portal URL.
- Test **coach** (non-head) — to verify role scoping (or switch roles in-portal).
- Test **student/parent** login for `/portal` (create + invite from the coach side).
- Demo URL + gate email.

## 3. Safety rules (agreed)
- Payments: **Stripe TEST mode only** — never a real charge.
- Messaging: send **only between test accounts** — never real parents/coaches.
- Data: OK to create/delete **test-account** records (RLS-isolated from real coaches).
- No `golive`; no edits to real customer data.

## 4. Bug report format
`[SEV] Area — what I did → expected vs actual → repro steps`. SEV = Blocker / Major / Minor / Cosmetic.

---

## 5. Coverage matrix — COACH PORTAL (live path)

Legend: **B** = buttons/actions, **D** = data/stat bindings to verify, **E** = edge/empty/error states.

### 5.1 Auth & onboarding
- B: `/portal`/coach sign-in via email OTP; wrong code; resend; persistent session on reload.
- B: Onboarding wizard — each step saves; skip/back; completes → dashboard.
- D: After onboarding, **head-coach profile in Settings shows the real name/email/phone** (not demo Vincent Jones). ✅ just fixed — verify live.
- E: Unauthenticated access to a coach URL redirects/blocks.

### 5.2 Dashboard
- B: Banner — **Add booking** (opens booking modal), **Take a payment** (opens payment flow), **Send message** (opens 4-step wizard), **Lesson Summaries**, **Open calendar**.
- D: Stat tiles — Sessions today, Next session, Players, Payments due, This week — each matches the underlying tables. Change data → tile updates.
- D: "Needs attention" rows deep-link to the right player/module.
- D: Live AI briefing renders; weather loads (or degrades gracefully).
- D: Inbox preview mirrors Messages; reply/dismiss syncs both ways.
- E: Empty academy (no players/bookings) → onboarding/empty states, not crashes.

### 5.3 Roster / Players
- B: Add player (form + photo upload), edit, delete; invite parent.
- B: Player detail — tabs (Development, Contact, Lessons, Attendance, Consent); consent toggles incl. **wearable/heart-rate**.
- D: Player photo shows everywhere (roster card, detail, dashboard, effort, messages, camps, lessons).
- D: Player count on dashboard updates when adding/removing.
- E: Player with no data (no stage, no goal, 0 lessons) renders cleanly.

### 5.4 Staff / Coaches
- B: Add staff (+ photo), edit, delete; invite coach; assign players; DBS fields.
- D: Staff count/utilisation on dashboard + staff cards.
- D: Assigned-player list shows photos.

### 5.5 Session Planner
- B: New session; prefill focus from last summary; add-to-plan (no duplicates); inline plan detail in Today.
- D: Planner reflects bookings from the calendar.

### 5.6 Lesson Summaries
- B: New summary (manual); **AI review** generates; edit; share.
- B: **Record/upload audio & video** → transcribe → AI summary written to a session row; attendance auto-marked.
- D: Summary appears in player's Lessons; goal auto-set from first summary.
- E: Recording with no speech → clear error; huge file handling.

### 5.7 Video & Audio + AI Highlights
- B: Record (video/audio), upload, play, download, delete.
- B: **AI Shot Highlights** — after a narrated video upload, per-shot clips appear **tagged**; shot-type **select correct**; **Publish ✓** gate.
- D: Clips appear in the Video grid tagged; only **Published** clips reach the student app.
- D: (If Modal on) visual detection runs; audio cross-check corrects low-confidence labels.
- E: Silent video → no clips (narration V1); confirm graceful.

### 5.8 Player Development / Racket Progression / Effort & Rewards
- B: Edit skills/mastery; award racket at threshold; Effort & Rewards **Log a session** (coach-side) + student app manual log.
- D: XP totals + leaderboard update; effort scores render; racket distribution on dashboard.
- D: "Ready for next racket" logic when all skills consistent.

### 5.9 Booking Calendar / Court & Venue Planner
- B: Add/edit/cancel booking; venue map/directions; courts.
- D: Calendar two-way sync copy correct (no "coming soon"); bookings feed Planner + dashboard "today".

### 5.10 Training Camps
- B: Create camp; itinerary; attendees; targets; **camp packs** (print); AI draft.
- D: Per-player camp log; finances.

### 5.11 Resource Centre / Equipment & Kit
- B: Drill library search/filter; add resource; equipment inventory add/edit; kit link.
- D: Auto-seeded demo kit/packages where applicable.

### 5.12 Messages (v2 two-way)
- B: **4-step Send wizard** (Who → How → Message → Preview → Sent) on portal + demo; channels (in-app/email/SMS/WhatsApp); AI draft; Urgent.
- B: Inbox — reply, forward, react, delete; 2-min inbound poll.
- D: Sent items thread; inbound (SMS/email via Resend) threads in; CC-coach toggle.
- E: No channel configured → clear "set up" state.

### 5.13 Payments & Packs (Stripe TEST)
- B: Connect Stripe; **Take a payment** (checkout / QR); packages; mark paid; PAYG.
- D: Cost + Paid columns sync to tiles; dashboard "Payments due" matches; sessions tick off from summaries.
- E: Not connected → setup prompt; test-card decline path.

### 5.14 Settings (revamped)
- B: Card grid opens each modal (Head coach profile, Connected accounts, Academy, Booking, Availability, Pricing, Racket criteria, Effort & Rewards, GDPR, Staff, etc.).
- B: **Collapsible sections** (Contact & calendar, Venues, Coaching/rewards/modules, Privacy & compliance, Import) open/close.
- D: Head coach profile = real account; appearance/theme applies live; feature-flag tiers gate modules; menu visibility hides/show nav.
- D: GDPR export/erase; DPA accepted.

### 5.15 Roles & permissions
- B: Role switch Head ↔ Coach ↔ Student.
- D: Coach role hides head-only nav (staff/camps/venues/equipment/payments per `COACH_HIDDEN_NAV`); scoped stats/players.

---

## 6. STUDENT / PARENT PORTAL (`/portal`)
- B: Sign-in OTP; change photo; message coach; **Log a session** (manual); play **shot highlights**; open session report.
- D: Progress header, racket journey, working skills, effort/XP + level, last session report, highlights (only Published), videos, messages.
- D: Scoped to exactly one player/one academy — never another child/academy.

## 7. Cross-cutting
- **Stat integrity:** every dashboard/tile number traced to its query; mutate source → number updates.
- **Data propagation:** add player/staff/booking/payment → reflected in all dependent views.
- **Empty / loading / error** states on every module.
- **Performance:** lazy-loaded modules load on demand; table cache makes re-nav instant; no full-bundle stall.
- **Mobile shell:** drawer nav, stacked content, key actions reachable.
- **Demo ↔ live parity:** demo mirrors portal (incl. new collapsible Settings).

## 8. Security (must-pass)
- Cross-tenant isolation: coach A can never read/write coach B's players, media, messages, payments (re-run `scripts/portal-security-test.mjs` + manual probes).
- Scoped portal routes reject wrong-role / wrong-player access.
- Signed-URL media expires; no public bucket exposure.

## 9. Execution log
| # | Area | Test | Result | Sev | Notes |
|---|------|------|--------|-----|-------|
| _to be filled during execution_ | | | | | |
