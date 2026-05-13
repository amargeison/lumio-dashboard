# Path E — Founding Member Admin Tool

**Status:** Strategy locked, ready for build (after Path B foundation)
**Date specced:** 12 May 2026
**Build estimate:** 4 weeks
**Build prerequisite:** Path B (RBAC architecture) must be live first

---

## Why this exists

When Bolton FC / Woking FC / Fulham Women / future founding members sign, Arron needs an operational tool to spin up their portal in 15 minutes — not 3 hours of manual database fiddling.

The existing `lumiosports.com/sports-admin` tool handles individual sport athletes (boxing/darts/tennis/golf) well. **This spec extends it for team sports** (football pro/club/women/grassroots).

## Strategic context

**Why sales-led Phase 1:**
- First 3 founding members get **white-glove onboarding** — much better sales story than "here's a wizard, good luck"
- Arron validates the onboarding experience end-to-end before opening to self-serve
- The pitch becomes: *"You're founding member #1 — we'll set up your portal entirely, populate fixtures, set up team logins. You walk into a fully working platform."*

**Phase 2:** Self-serve enabled (clubs 4-20) once experience is validated.

---

## E1 — Extension of existing admin tool

### Current state (at `lumiosports.com/sports-admin`)
- "Founding Members" tab listing individual sport athletes
- Per-member side drawer for config
- Status pipeline: Pending → We set up → Ready to send → Live
- Captures: Display name, nickname, brand/club name, slug, photo, logo, features, setup checkboxes

### What stays
- Admin shell, navigation, list view pattern
- Status pipeline
- Side drawer pattern
- Athletes tab for individual sports

### What we add
- **New tab: "Clubs"** alongside "Athletes" (or rename to "Founding Members" with sub-tabs)
- Clubs list view: Club name, Product (Pro/Club/Women/Grassroots), Tier, Founding admin email, Seats, Status, Created
- "+ New Club" button → opens provision wizard
- Side drawer for editing existing clubs (different fields from athletes)
- "Provision Portal" action

### Design call
Two separate top-level tabs — `Athletes` and `Clubs`. Clean conceptual separation. The "Founding Members" label might still appear as a status filter, but it's not primary navigation.

---

## E2 — Provision-a-club workflow (6-step wizard)

### Step 1 — Club basics
- **Club name:** "Bolton Wanderers FC"
- **Slug:** "bolton-wanderers" (auto-suggested, editable, uniqueness check)
- **Product:** [Lumio Pro / Lumio Club / Lumio Women / Lumio Grassroots] (selectable, allows upsell)
- **Tier** (dropdown updates based on product):
  - Pro: Premier League, Championship
  - Club: League One, League Two, National League, NL South/North, Step 4/5/6
  - Women: WSL, Championship, FA National League Div 1 N/S, FAW Premier
  - Grassroots: Sunday League, U-pathway, Open
- **League name** (free text): "EFL League One"
- **Country:** GB (default)

**Slug collision handling:** Show "Slug already in use — suggested alternatives: bolton-wanderers-fc, bolton-wfc-2026, bolton-wanderers-2". Admin picks one or types custom.

### Step 2 — Branding
- Logo upload
- Brand primary colour (hex picker, preview)
- Brand secondary colour (hex picker, preview)
- Hero image / cover (optional)
- Tagline (optional, used in welcome email)

### Step 3 — Founding admin
- **Founding admin name:** "Sharon Brittan"
- **Founding admin email:** "sharon@boltonwfc.com"
- **Founding admin role template:** [CEO / Chair / Director of Football / Other]
- **Send portal-ready email:** [Now / Schedule for date]
- **Personal message** (optional, included in welcome email)

### Step 4 — Module configuration
- **Auto-enabled modules per product** (pre-checked, can override)
- **Optional modules** (asked):
  - Academy: Yes / No
  - Community Foundation: Yes / No
  - Compliance module (auto-set by product, shown for confirmation)
  - Performance & GPS (if Grassroots, asked here)
- **Pre-load demo data:** [Yes — show example alongside real / No — empty portal]
- **Suggested team to invite** (from role templates): pre-populated list, Arron fills emails

### Step 5 — Billing
- **Plan:** [Founding Member - Free 3 months / Free 6 months / Free 12 months / Paid]
- **Seats included:** 5 (default; Pro: 20, Club: 8, Women: 12, Grassroots: 3)
- **Additional seats purchased:** 0
- **Billing notes:** Free text
- **Renewal date:** Auto-set based on plan

### Step 6 — Review & Provision
- Summary of all the above
- "Provision portal" button
- On click:
  - Creates `sports_clubs` row
  - Creates `sports_memberships` row for founding admin (status: pending)
  - Generates `sports_invite_tokens` row (30-day expiry for founding admin)
  - Sends "portal ready" email via Resend
  - Internal notification to Arron (success / failure)
  - Updates admin tool dashboard

### Locked design decisions

| Decision | Locked |
|---|---|
| E2-Q1 — Product selectable in admin tool (override for upsell flexibility) | ✅ |
| E2-Q2 — Pre-load demo data approach: hybrid (empty squad + pre-loaded modules) | ✅ |
| E2-Q3 — Suggested team workflow: flexible (Arron's choice per club) | ✅ |
| E2-Q4 — Slug collision handling: suggest alternatives, admin picks | ✅ |

---

## E3 — Pre-load club data

This is what makes the founding admin's first portal visit land — they shouldn't see an empty box, they should see a working version of *their club*.

### Always auto-loaded
- Module navigation per product (sidebar configured)
- Role templates available for invitation
- Default settings (timezone GB, language EN)
- Compliance module mounted per product (PSR/FSR/etc.)
- AI tone preset per product

### Optional — Arron fills in
- Club logo + colours (from Step 2)
- Founding admin profile (from Step 3)
- **Fixtures** (Phase 1: manual paste/CSV; Phase 2: API)
- **Squad** (Phase 1: manual paste/CSV; Phase 2: API)
- **Preferred suppliers** (Phase 1: manual; Phase 2: import)

### Sports data API strategy

**Phase 1 (founding member onboarding):**
- **Fixtures + results + tables** for Lumio Pro / Lumio Club via Football-Data.org or API-Football (free tier sufficient for 1-3 clubs)
- **Auto-sync nightly** rather than live to stay within free tier
- **Squad data** = manual import via CSV or paste (clubs already have this in spreadsheets)
- **Player records** = manual for Phase 1

**Phase 2 build (after first 3 founding members):**
- `/admin/football-data-sync` route pulls fixtures/standings nightly
- Cache in `football_fixtures` and `football_standings` tables
- Founding admin can override/edit if API data is wrong
- Wyscout-style APIs for clubs who ask

**Phase 3 (paid clubs):**
- Paid API tier when usage exceeds free limits
- Wyscout/Opta integration for clubs who pay for those

### Data tier reality

The higher the tier, the more data is publicly available. The lower the tier, the more Lumio's "we let you input your own data" model is the right pattern.

| Product | API coverage | Club manual entry |
|---|---|---|
| Lumio Pro | ~80% | ~20% |
| Lumio Club (L1-L2-National) | ~60% | ~40% |
| Lumio Club (NL South/North/Step 4-6) | ~30% | ~70% |
| Lumio Women (WSL/Championship) | ~50% | ~50% |
| Lumio Women (lower) | ~10% | ~90% |
| Lumio Grassroots | 0% | 100% |

**This fits Lumio's thesis perfectly** — clubs that have least data infrastructure are exactly the ones Lumio serves best.

### Pre-load preferred suppliers

Phase 1: Arron asks the founding admin during their first call:
> *"Who's your usual coach company? Where do you eat pre-match? Any preferred hotel?"*

Arron enters into admin tool. Appears as "preferred suppliers" in Travel & Logistics module from day one. **Demo lands harder because it's their data, not generic.**

---

## E4 — Founding admin handoff email

**The single most important email in the Lumio Sports product surface.**

### Existing template (current `lumiosports.com` welcome email)

Already production-quality — founder-direct tone, brand-consistent, FSR/PSR-specific copy, "Try the Football demo first" CTA, "Our team will be in touch within 24 hours", "Reply to this email — a real person reads every one".

**Keep this template.** Path E extends it to support per-product variants.

### Per-product variations needed

| Element | Variation |
|---|---|
| Subject line | "Welcome to Lumio Pro / Lumio Club / Lumio Women / Lumio Grassroots, [Name]" |
| Headline | "Welcome to [Product Name], [Name]." |
| Feature list | Per-product specific features (PSR Modeller for Pro, Ground Grading for Club, etc.) |
| Demo CTA | Links to right product demo (Oakridge FC for Pro, Harfield FC for Club, etc.) |

This is a 30-min Claude Code job when building.

### Locked decisions

| Decision | Locked |
|---|---|
| E4-Q1 — Founder-direct tone (existing email is template) | ✅ |
| E4-Q2 — 30-day expiry for founding admin invites (vs 7-day for teammates) | ✅ |
| E4-Q3 — Loom walkthrough video: Phase 2 (60-sec "What Lumio can do for your club") | ✅ |

### Magic link expiry rationale

- **Founding admin:** 30 days. VIP recipients might not click immediately. Personal email + reply-to-Arron means manual regeneration always possible if expired.
- **Teammate invites:** 7 days. Industry standard. Resend invalidates old token.

---

## E5 — Build sequence

### Critical path dependency

```
Path B (RBAC migrations + sports_clubs/memberships/tokens)
    ↓
    └→ Path E (admin tool + provision wizard)
            ↓
            └→ First founding member provisioned
                    ↓
                    └→ Path D (Travel & Logistics) — ready for them to use
```

**Path B must ship first.** Path E and Path D can be built in parallel after that, though.

### Week 1 — Schema + admin tool extension
- Extend admin tool with Clubs tab (no functionality yet, just listing)
- Wire to `sports_clubs` table from Path B
- Side drawer for editing existing clubs

### Week 2 — Provision wizard
- 6-step wizard component
- Validation, slug uniqueness check
- "Provision portal" action that creates club + membership + invite token

### Week 3 — Email handoff + invite token consumption
- Per-product email templates (Resend integration)
- `/accept-invite?token=...` route handles founding admin signup
- Lands in pre-configured portal

### Week 4 — Pre-load functions + polish
- Manual fixtures CSV import
- Suppliers manual entry
- Demo data toggle
- Status tracking (Pending → Configuring → Ready to send → Live)

**Total: ~4 weeks** of focused build, dependent on Path B being live first.

---

## Established demo clubs reference

When provisioning new clubs, **never use real founding member names in demos**. Use established demo clubs:

| Product | Demo club | League | URL |
|---|---|---|---|
| Lumio Pro | Oakridge FC vs Hartwell Town | (Currently shows L1 — needs tier check) | `/football/oakridge-fc` |
| Lumio Club | Harfield FC vs Thornvale United | Northern Premier League West / National League South | `/nonleague/harfield-fc` |
| Lumio Women | Oakridge Women FC vs Hartwell Women | WSL Championship | `/womens/womens-demo` |
| Lumio Grassroots | Sunday Rovers FC vs Red Lion FC | Westshire Sunday League Div 2 | `/grassroots/sunday-rovers-fc` |

**Founding members get their own real portal when they sign.** Bolton/Woking/Fulham etc. never appear in marketing demos.

### One thing to flag

Oakridge FC currently shows "LEAGUE ONE · MD-39" but Lumio Pro is supposed to be Premier League / Championship. **L1 is Lumio Club tier under the 4-product split.** Worth checking whether:
- (a) Oakridge FC should be re-positioned as Lumio Pro (Premier League / Championship — needs demo data update), OR
- (b) Oakridge FC is the Lumio Club upper tier (L1/L2) worked example, and Harfield FC is the non-league worked example

For Path E purposes, demo clubs work fine. Worth resolving in a separate housekeeping pass.

---

## Founding member outreach (separate from build)

Three founding member tracks, correctly time-blocked behind product progress:

| Founding member | Status | Blocker |
|---|---|---|
| **Bolton FC** | JOHAN Sports partner has them | Arron to join their visit or get warm intro |
| **Woking FC** (Todd Johnson) | Cold, local | LinkedIn profile update + portal demo-ready |
| **Fulham Women** | Warm via Arron's network | Women's portal updated first |

Outreach happens after the Phase 1 build is far enough along to demo confidently.

---

## Definition of done

Path E admin tool extension is production-ready when:
- ✅ Arron can provision a new club end-to-end in <15 minutes
- ✅ Per-product email templates send correctly
- ✅ Founding admin lands in a pre-configured portal with right modules + branding
- ✅ Founding admin can immediately invite their team via in-portal flow (Path B feature)
- ✅ Status pipeline reflects real state across all founding members
- ✅ Fixtures + standings auto-sync nightly via free-tier APIs
- ✅ Manual squad CSV import works
- ✅ Demo clubs (Oakridge / Harfield / Sunday Rovers / Oakridge Women) untouched

---

*End of Path E spec. See `path-b-rbac-architecture.md` for the foundational platform and `path-d-travel-logistics.md` for the flagship feature.*
