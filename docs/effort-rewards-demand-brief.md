# Effort & Rewards — demand-validation brief

A one-pager for coach conversations (Harry's brother, Pete, clubs). Goal: find out
whether this is worth building hardware/aggregator support for, before spending.

## The idea in one line

Turn a junior's training effort — logged manually now, or from a cheap wearable later —
into gamified **XP / effort levels** inside the coach platform, sitting next to the
parent-funded racket-reward system. A motivation and retention layer, not a sports-science
tool.

## Are we first? (what already exists)

Three pieces exist separately — nobody has combined them for junior programmes:

- **Elite load monitoring** (Catapult One, WHOOP, AthleteMonitoring): real GPS/HR/load,
  but expensive, sports-science focused (injury/recovery), **not gamified, not a junior
  reward loop.**
- **Junior gamification** (Net Generation, Tennis AI): badges, but **coach-awarded skill
  badges — not effort/biometric driven.**
- **RPE / perceived-effort logging**: already a known tennis concept on its own.

Mainstream tennis SaaS (Tennis Locker, Sportomic, ClubSpark, Sportlyzer, CoachNow) all do
bookings, payments, lesson notes, video, coach-rated skills — **none turn effort into a
kid-motivation reward economy.** So Lumio would be first/near-first in *that* lane. The
novelty is the framing (engagement + retention + revenue), not the raw data.

## Who actually wants it

| Segment | Demand | Why |
| --- | --- | --- |
| Local micro-coach (e.g. Pete, ~5 students) | **Low** | Manual log is plenty; keyrings matter more than data; setup overhead not worth it |
| Clubs with junior programmes (LTA pathway) | **High — sweet spot** | Churn is the enemy; XP/leaderboards keep kids training + parents paying; reward revenue |
| Mid-tier academies | **Good** | Real interest in effort/development — but may object "we'd want real data, not estimated." Position as the affordable engagement layer, **not** a Catapult rival |
| Semi-pro adults self-improving | **Low (for this)** | Already self-track (Garmin/WHOOP); want technique/match analytics, not XP badges |

## The honest positioning

The value is **engagement, retention and a reward economy for junior programmes** — not
biometric precision. That means:

- You don't need precise hardware to win — manual log + gamification already delivers the
  actual value; a wearable is just a "nicer" input.
- Lead with: keeps kids training between lessons, gives parents something to see, adds a
  reward revenue stream. Don't lead with "sports science."

## Questions to ask each coach

1. Do your juniors' parents see fitness/effort as part of development — would they value
   seeing it?
2. Would a leaderboard / XP keep kids training **between** lessons and cut drop-off?
3. Would you pay more for it — or resell a branded band to families?
4. Do you track any effort/fitness today? Would "estimated" effort be credible enough, or
   a dealbreaker?

**Read the signal:** if academy/club coaches say yes to #2 and #3 → build the wearable/
aggregator path. If it's lukewarm → manual log is already live and free; leave it there.

## Decision tree

- Strong yes from clubs/academies → trial the cheap BLE band (Coospo) + build the
  "Start HR session" Web Bluetooth flow; later add Terra for passive sync.
- Mixed / only academies → keep manual; revisit hardware when 2–3 paying sites ask.
- Mostly no → manual log stays as a light feature; don't invest further.

---

Sources: Tennis Locker, tennisacademy.app (RPE workload), Net Generation, Catapult One,
AthleteMonitoring, Sportlyzer, CoachNow, WodGuru tennis-software roundup.
