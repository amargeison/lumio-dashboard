# Path D — Travel & Logistics Flagship Feature

**Status:** Strategy locked, ready for build (after Path B foundation)
**Date specced:** 12 May 2026
**Build estimate:** 4-6 weeks
**Build prerequisite:** Path B (RBAC architecture) must be live first

---

## Why this exists

Sunday's research report identified Travel & Logistics as the single biggest unowned market gap in football operations at every tier. No dominant SaaS exists. Premier League clubs bespoke it via travel agents. Non-league clubs run on phone calls and WhatsApp. **Nobody owns this surface.**

This makes Travel & Logistics:
1. **Lumio's most defensible flagship feature** — genuine market gap, no incumbent
2. **The textbook cross-department workflow** — ops + finance + comms + coach + players all touched
3. **The proof-of-concept demo for the entire Lumio thesis** — "one trigger, six departments updated, AI does 80% of the work"
4. **The 60-second pitch for partnership conversations** (JOHAN Sports, Neil Snowball/ECB)

## Strategic context

**Existing Boxing/Tennis/Darts/Golf "Travel Researcher" is theatre:**
- Demo mode uses hardcoded fallback arrays (input ignored)
- Founder mode has Claude fabricate JSON
- No real flight/hotel APIs
- bookingUrl returns brand homepages, not bookable links

**Real APIs available for £0/month MVP:**
- Amadeus Self-Service (real flights) — Phase 2 for Lumio Pro
- Xotelo / Makcorps (free hotel pricing) — Phase 2 for Lumio Pro
- Google Maps APIs (Distance Matrix + Places + Geocoding) — Phase 1 free tier
- Anthropic Claude API (existing) — for AI drafting

**Team sport pattern differs from individual sport:**
- Clubs need: coach + team hotel block + meals
- Not: individual flights + single rooms

---

## D1 — Customer scenario (Lumio Club worked example)

**Setting:** Harfield FC, Northern Premier League West, away to Thornvale United on Saturday 14 June.

### Week -6 (fixture confirmed)
- Distance from Harfield training ground to Thornvale: 41 miles (real Google Maps API call)
- Decision needed: day trip or overnight?
- Under 90 miles + 3pm kickoff = day trip recommendation

### Week -4 (planning)
- **Ops Director** / **Club Secretary** starts the booking process
- Books team coach (25-seat, 9:30am departure)
- Books pre-match meal (12:30pm, 26 people, dietary requirements)
- Confirms changing room arrangements with home club

### Week -2 (squad coordination)
- **Head Coach** confirms squad of 18 (11 + 7 + 2 standby)
- **Kit Manager** prepares away kit, water, first aid
- **Head of Medical** confirms physio coverage
- **Head of Comms** drafts pre-match content

### Week -1 (squad availability)
- **Manager** finalises squad
- **Players** receive itinerary
- **Finance** pre-approves budget

### Match day
- Departure 10:30am, meal 12:30pm, warm-up 1:30pm, KO 3pm
- Return ~6pm

### Currently runs on:
Spreadsheets + WhatsApp + phone calls + the club secretary's institutional memory.

**~2 hours of admin work per away fixture.**

---

## D2 — Product variations across tiers

| Variation | Lumio Pro example | Lumio Club example | Lumio Grassroots example |
|---|---|---|---|
| Distance | Manchester City → Newcastle 5:30pm KO | Harfield FC → Thornvale United (41mi) | Local U16s → nearby club (15mi) |
| Travel mode | Travel night before + hotel block of 22 rooms | One coach (25 seats), one meal stop | Parents drive players, lift-share via WhatsApp |
| Team size | 22 players + 12 staff = 34 people | 18 players + 8 staff = 26 people | Players meet at venue |
| Trip cost | £15-25k | £800-1,200 | £0 (parents) |
| Lumio's role | Full booking platform | Coach + meal + occasional hotel | Parent coordination + lift-share |

**Build focus:** Lumio Club first (Harfield FC, day trips). Pro adds flights + overnight hotels later. Grassroots is a different product surface (parent coordination > booking).

---

## D3 — Locked design decisions

| Decision | Locked |
|---|---|
| Q1 — Focus product for Phase 1: Lumio Club (Harfield FC worked example) | ✅ |
| Q2 — Recommend + draft + handoff (NOT Lumio-as-travel-agent) | ✅ |
| Q3 — Real APIs from day one (Google Maps free tier) | ✅ |
| Q4 — Phased rollout: ops-only first, multi-department layered later | ✅ |
| Q5 — Coach suppliers: club's preferred list first, curated directory Phase 2 | ✅ |
| Q6 — Meal venues: hybrid Google Maps + preferred list | ✅ |
| Q7 — AI tone: presets + per-piece override | ✅ |
| Q8 — Preferences: passive memory + "Always use X" toggle after 3 successful bookings | ✅ |

**Spec sentence:**
> Travel & Logistics v1 = Single-user (ops director / club secretary) Lumio Club tool that, given a fixture, plans the entire away-trip using real APIs and AI, then drafts the booking emails / POs / itineraries for the human to send.

---

## D4 — Workflow design

### Entry points (3)

1. **From Fixtures view** — "Travel plan needed" badge on upcoming away fixtures
2. **From Travel & Logistics dept** — list of all upcoming away fixtures with status
3. **From AI prompt / daily brief** — "Lumio noticed your trip has no plan yet. Start planning?"

Entry point 3 is the Lumio-thesis showcase — proactive nudges, not waiting for action.

### 5-step trip planning workflow

#### Step 1 — Trip type & basics
**Auto-detected from fixture data:**
- Opposition, venue, date, kickoff
- Distance from training ground (Google Maps Distance Matrix)
- Travel time estimate

**AI recommends:**
> "Day trip recommended — under 90 miles, 3pm kickoff. Suggested departure 10:30am. Pre-match meal at 12:30pm. Return ~6pm. Total ~7.5hrs."

Sarah confirms or adjusts. One click → next.

#### Step 2 — Squad & dietary
**Pre-populated:**
- Default squad size: 18 (configurable per club)
- Default staff: 8
- Total: 26 people
- Dietary requirements pulled from player records automatically

**Sarah can override:** change squad size, add/remove staff, flag specific players.

#### Step 3 — Coach booking
**AI recommends 3 coach companies** based on:
- Distance from Harfield FC
- Capacity needed (~30 seats buffer)
- Past supplier preferences
- Live quotes if API supports (Phase 2)

```
Recommended coaches:
★ Coachman Travel — Used 4× this season    £680  [Preferred]
  National Express Coach Hire                £820
  Southern Coach Services                    £710 (awaiting confirmation)
```

Sarah picks one. AI drafts booking email:
> *"Hi James — please confirm 30-seat coach for our away fixture at Thornvale United, Saturday 14 June..."*

Sarah reviews, edits if needed, clicks "Send" → sent via Resend.

#### Step 4 — Pre-match meal
**AI recommends meal venues** via Google Maps Places + club's preferred list.

Same pattern: Sarah picks, AI drafts, Sarah sends.

#### Step 5 — Comms & itinerary
**AI auto-drafts in parallel:**

**A) Player itinerary** (email + WhatsApp template):
```
Saturday 14 June — Thornvale United (A)
10:30am: Meet at training ground (full tracksuit + boots)
10:30am: Coach departs
12:00pm: Arrive at Thornvale
12:30pm: Pre-match meal at Premier Lounge
1:45pm: Warm-up
3:00pm: Kickoff
~5:30pm: Return coach
~6:30pm: Back at training ground

Dress code: Club polo + tracksuit. No phones at meal.
Any issues, call Sarah on 07XXX...
```

**B) Pre-match social content** (matchday graphic + caption):
> Generated matchday graphic with opposition crest. Caption: *"It's matchday! 🟢 Today we travel to @ThornvaleUtd. KO 3pm. UTW! 💪 #HarfieldFC"*

**C) Internal team brief:**
> All logistics in one document for management.

### The wow moment

Sarah goes from **"unstarted trip"** to **"fully drafted with emails ready to send"** in **5 minutes**.

Currently this takes ~2 hours. **120 minutes → 5 minutes.**

### Status & follow-up

After Sarah sends bookings, workflow tracks:
- Coach booked ✓ / pending ⏳ / failed ✗ / alternatives suggested
- Meal booked ✓
- Player itinerary sent — X/18 acknowledged
- Social content scheduled
- Total cost rollup

If anything fails, **AI surfaces alternatives** immediately.

### Out of scope for v1

- Multi-day trips with overnight hotels (Pro Phase 2)
- Flights (Pro Phase 2)
- Multi-department workflow (phased later — Path B prerequisite)
- Live booking integrations (handoff via email only)
- Player-facing app (itinerary via email/WhatsApp, not in-app)
- Cost reconciliation (manual for now)
- Sponsorship integration ("this trip brought to you by...") (Phase 2)
- Carbon footprint reporting (Phase 3)
- Driver/supplier ratings (Phase 2)

---

## D5 — Technical architecture

### APIs needed

| API | Purpose | Cost | Notes |
|---|---|---|---|
| Google Maps Distance Matrix | Distance + travel time | Free up to 100k/month | Likely already have key |
| Google Maps Places (Nearby Search) | Meal venues near match venue | Free up to 100k/month | Same key |
| Google Maps Geocoding | Resolve venue addresses | Free up to 40k/month | Same key |
| Anthropic Claude API | AI drafting | Existing | `/api/ai/nonleague` extends |
| Resend | Sending drafted emails | Existing | Send via club's email integration |
| **(Phase 2)** Amadeus Self-Service | Flights for Pro tier | Free tier covers MVP | Deferred |
| **(Phase 2)** Xotelo / Makcorps | Hotel pricing | Free | Deferred |

**Total API cost for v1: £0/month.**

### Data model additions

```sql
-- New table: trips
CREATE TABLE sports_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  fixture_id UUID,
  trip_type TEXT NOT NULL,
  opponent_name TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_lat NUMERIC,
  venue_lng NUMERIC,

  match_date DATE NOT NULL,
  match_kickoff TIME,
  departure_time TIME,
  return_time TIME,

  squad_size INT DEFAULT 18,
  staff_size INT DEFAULT 8,
  dietary_summary JSONB,

  coach_supplier_id UUID REFERENCES sports_trip_suppliers(id),
  coach_cost_pence INT,
  coach_status TEXT DEFAULT 'pending',
  coach_email_draft TEXT,
  coach_sent_at TIMESTAMPTZ,
  coach_confirmed_at TIMESTAMPTZ,

  meal_venue_name TEXT,
  meal_venue_address TEXT,
  meal_cost_pence INT,
  meal_status TEXT DEFAULT 'pending',
  meal_email_draft TEXT,
  meal_sent_at TIMESTAMPTZ,
  meal_confirmed_at TIMESTAMPTZ,

  itinerary_draft TEXT,
  matchday_post_draft TEXT,
  matchday_graphic_url TEXT,
  internal_brief_draft TEXT,

  status TEXT DEFAULT 'planning',
  total_cost_pence INT,
  notes TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sports_trip_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  supplier_type TEXT NOT NULL,        -- 'coach' | 'meal_venue' | 'hotel'
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  average_rating NUMERIC,
  notes TEXT,

  auto_use_for_distance_under_miles INT,
  auto_use_for_capacity_over INT,
  is_preferred BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_club_date ON sports_trips(club_id, match_date);
CREATE INDEX idx_trips_status ON sports_trips(status) WHERE status != 'completed';
CREATE INDEX idx_suppliers_club_type ON sports_trip_suppliers(club_id, supplier_type);
```

**Design notes:**
- All costs in **pence** (integer) — avoids floating point issues
- Status per booking — coach can be 'sent' while meal is still 'pending'
- `fixture_id` nullable — clubs without fixture sync can create trips standalone

### The "Always use X" mechanic (Q8)

After 3rd successful trip with same supplier:
```sql
UPDATE sports_trip_suppliers
SET is_preferred = true,
    auto_use_for_distance_under_miles = 100
WHERE id = '<supplier_id>';
```

Then new trips:
- Distance < 100mi + supplier has capacity → AI **pre-fills** that supplier + pre-drafts email
- Sarah just reviews and sends
- Outside the rule → AI recommends alternatives

**This is Lumio's "remembers and learns" feature — more valuable the more you use it.**

---

## Demo readiness

### The 60-second demo for partnership pitches

**Setup:** Lumio Club portal as Sarah at Harfield FC. Thornvale away fixture visible.

**Demo flow:**

1. **0:00-0:10** — *"Sarah needs to plan the trip. Currently 2 hours of phone calls and emails."*
   - Click "Travel & Logistics" → "Plan trip" on the fixture

2. **0:10-0:25** — *"Watch Lumio do the legwork."*
   - Distance: 41 miles (real Google Maps API)
   - AI recommends day trip
   - Squad + dietary auto-loaded

3. **0:25-0:45** — *"And here's where the magic happens."*
   - Coach options recommended
   - Sarah picks Coachman → AI drafts booking email
   - **Watch the email type itself out** — visual wow factor

4. **0:45-0:55** — *"Meal venue, itinerary, social posts — all drafted."*
   - Quick scroll through pre-drafted content

5. **0:55-1:00** — *"Five minutes' work, two hours saved. Sarah just clicks send. And every trip after this, Lumio learns her preferences."*

**No mock-ups. No fake spinners. It actually works.**

### Pre-demo setup needed (per founding member)

- One worked example trip pre-configured
- Coachman Travel pre-loaded as preferred supplier
- Training ground location set in club settings
- 2-3 past trips logged (for "Lumio remembers" angle)

**This is part of founding member onboarding** — 10 minutes of setup per club makes every demo + workflow faster.

---

## Build sequence

**Week 1 — Foundation**
- Schema migrations (sports_trips, sports_trip_suppliers)
- Google Maps API integration
- Basic UI shell at `/{slug}/travel-logistics`

**Week 2 — Trip creation flow**
- Create-trip wizard (Steps 1-2)
- Fixture-to-trip linking
- AI recommendations for day vs overnight

**Week 3 — Coach booking**
- Suppliers CRUD
- Coach recommendation engine
- AI booking email draft
- Send via Resend

**Week 4 — Meal venue + Comms**
- Google Maps Places integration
- Meal booking flow
- Player itinerary AI draft
- Matchday post + graphic AI draft

**Week 5 — Status tracking + Learning**
- Status dashboard per trip
- Confirmation/failure handling
- "Always use X" preference rules
- Past trips view

**Week 6 — Polish + Demo prep**
- Empty states + onboarding
- Error handling for API failures
- Founding member demo data preparation
- QA pass

**Total: 4-6 weeks of focused work.** Compressible to 4 if focused, expandable to 8 if other priorities compete.

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google Maps quota exceeded | Low | Cache distance calcs; only recalc on venue change |
| AI draft quality inconsistent | Medium | Pre-prompt with club tone + examples; manual edit always available |
| Coach company doesn't respond | High | Status surfaces "waiting >24hrs" → suggest alternatives |
| Venue closed/no availability | Medium | Multiple options recommended; clear failure UX |
| Sarah doesn't trust AI drafts | Possible | Every draft editable before send; nothing auto-sends |
| Founding member uses once then forgets | Possible | Daily brief surfaces "upcoming away trip with no plan" |

---

## Definition of done

Travel & Logistics v1 is production-ready when:
- ✅ Ops director can plan a day-trip away fixture end-to-end in under 10 minutes
- ✅ All emails/posts drafted by AI, reviewable before send
- ✅ Real coach companies recommended from preferred list + Google Maps
- ✅ Real meal venues recommended from Google Maps + preferred list
- ✅ Player itinerary auto-generated and sendable
- ✅ Matchday social post drafted with auto-generated graphic
- ✅ "Always use X" preference saves time on subsequent trips
- ✅ Trip cost rollup visible
- ✅ Status dashboard shows all upcoming trips
- ✅ Works with real data for first founding member
- ✅ Demo-ready for JOHAN Sports + Neil Snowball pitches

---

## Reference: research findings

From Sunday's 25-page research report (`docs/specs/lumio-sports-research-report.docx`):

> *"Travel & Logistics is the single biggest unowned gap across all three tiers. No dominant SaaS exists. Premier League uses bespoke arrangements with travel agents. EFL clubs use long-term contracts with coach companies and Marriott Bonvoy / Premier Inn corporate accounts. Non-league clubs use volunteer-driven manual booking. This is Lumio's flagship opportunity."*

This is the source of Lumio's defensible market position. Don't compete with Kitman Labs on performance analytics. **Own Travel & Logistics.**

---

*End of Path D spec. See `path-b-rbac-architecture.md` for the foundational platform that makes this possible.*
