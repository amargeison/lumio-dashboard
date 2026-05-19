# Follow-ups

Tracker for known work that has been deferred from a sprint, with enough
context that the work can be picked up cleanly later. Each entry should
include why it was deferred, the concrete tasks, and any risks the
follow-up needs to navigate.

## Rugby role model restructure (deferred from Sprint 2.5)

The rugby portal currently uses individual-stakeholder roles
(player, agent, coach, physio, sponsor) but the product target is
clubs, not individuals. This mismatches football pro's club-aimed
role model and prevents role-aware Quick Actions from working
meaningfully.

Sprint 3 task:
- Restructure RUGBY_ROLES to club-aimed model: Director of Rugby,
  Head Coach, Captain, Performance Director, Analyst, Medical,
  Operations, Commercial (8 roles, mirroring football pro pattern)
- Update RUGBY_ROLE_CONFIG with new whitelists
- Migrate any UI gated on old roles (player/agent/sponsor views)
  — review what to keep, what to relocate
- Add role-aware Quick Actions per the Sprint 2.5 spec that was
  deferred (action sets already drafted in Sprint 2.5 prompt)
- Browser-test new role switcher across all 8 roles

Risk: this is a structural change. Identify all files gated on
current 5 roles before starting (grep `RUGBY_ROLES`). The migration
may surface views that don't fit the new model — those need
product decisions on relocation.

## Ghost badges — deferred portal expansion

Ghost badges shipped for football + cricket. Pending crest assets
for women's FC, non-league, grassroots, and rugby before they can
be added to those portals.

Required assets:
- `public/badges/oakridge_women_fc_crest.svg` (women's FC)
  Note: women's currently reuses `oakridge_fc_crest.svg` at
  `src/app/womens/[slug]/page.tsx:5350` — should have its own
  distinct crest before a ghost badge is added.
- `public/badges/oakridge_nonleague_crest.svg` (non-league)
- `public/badges/oakridge_grassroots_crest.svg` (grassroots)
- `public/badges/oakridge_rfc_crest.svg` (rugby)

When all 4 assets exist:
- Apply the same ghost badge spec (opacity 0.05, rotation 15deg,
  right-anchored with partial bleed) per the football/cricket
  pattern in `FootballDashboardModules.tsx` HeroToday and
  `cricket/[slug]/v2/_components/Modules.tsx` HeroToday.
- Each portal's hero file gets the same defensive comment.

## Banner enhancements — pending other portals

Quote feature + larger right-column (date 21, weather 14,
countdown 34, caption 10) shipped for football + cricket.
Pending port to women's, non-league, grassroots, rugby — and
tennis, golf, darts, boxing if those banners adopt the same
layout.

## Demo users — pre-loaded named profiles per role

Currently the role selector dropdown shows generic "User"
placeholders when onboarding fields are empty. Sister sport
portals (Tennis/Boxing/Golf/Darts) have pre-loaded named demo
users (Big Al, Marcus Cole, James Harrington, Jake Morrison)
which make the dashboard feel "lived-in" during demos.

Pending work:
- Audit demo flow — identify which roles are actually clicked
  during JOHAN, Snowball/ECB, AFC Wimbledon, and other
  partnership demos
- Pre-load named demo users for those critical roles only
  (likely 2-3 per portal × 6 team portals = ~15 demo users
  total)
- Generate professional headshot photos (AI-generated faces
  from thispersondoesnotexist or generated.photos to avoid
  licensing issues)
- Write plausible role context (e.g., "Marcus Webb · Head
  Coach · 7 years at Oakridge")
- Wire into role selector / sidebar avatar
- Keep "blank if user skips onboarding" path working for real
  signups

Priority: do this before next round of partnership demos.
Bigger demo-realism upgrade than most people would assume.

## PlayerWelfareHub brand audit — pending

`src/components/football/PlayerWelfareHub.tsx` (committed in the build-fix
commit that resolved the production build failure) currently uses real
insurer / utility / professional service brand names in its demo data:

- Howden Sports, Aviva, AIG, Zurich, Vitality, Bupa (insurers)
- EE, AA, Barclays (utilities/banking)
- ESOL Pathway, Surrey College (education)
- Riverside Practice, Stowe & Hart LLP (services)
- Sportshelm, Pinkertons (other)

Per CLAUDE.md brand rules, real third-party brand names should be
swapped for fictional Meridian/Apex/Vanta/Northbridge universe
equivalents before shipping in product context.

When picked up:
- Audit each name; classify Pattern 1 (replace) vs Pattern 2 (keep
  factual reference)
- Most fit Pattern 1 — these are demo placeholders, not factual
  references to public information
- Add new fictional brand names to `docs/brand-universe.md`
  (welfare/insurance space wasn't covered in Sprint 2.5 brand
  universe — needs an extension)
- Replace in `PlayerWelfareHub.tsx`
- One Pattern 2 reference is fine: "Karen Carney Review compliance"
  — that's a factual public document reference

Priority: should be done before the next significant football demo
to JOHAN, Snowball, or other partnership prospects.

## Junior portal — WOMENS_* → JUNIOR_* identifier rename

The junior portal was scaffolded by copying the women's data + modules
files verbatim (per the 1B plan), so the inherited identifier names
(`WOMENS_ORG`, `WOMENS_FIXTURES`, `WOMENS_INBOX`, `WOMENS_ACCENT`,
`WOMENS_SQUAD`, etc.) still appear in:

- `src/app/junior/[slug]/_lib/junior-dashboard-data.ts`
- `src/app/junior/[slug]/_components/JuniorDashboardModules.tsx`

These will get renamed to `JUNIOR_*` alongside the real junior data
rewrite (Workstream B — live Supabase data layer). Pure rename is
mechanical, but the data rewrite is the natural moment because the
*contents* of those exports change too (junior squad data, junior
fixtures, junior inbox, etc., not women's first-team data).

Dead `'pink'` string tokens to clean up at the same time
(inherited from women's data, harmless because they fall through
to `accent.hex` which is now green, but cosmetically out of place):

- `WfStatTone` union — drop the `'pink'` literal
  (`junior-dashboard-data.ts:19`)
- `WfInboxChannel.tone` union — drop the `'pink'` literal
  (`junior-dashboard-data.ts:34`)
- Player Welfare channel record — change `tone: 'pink'` to a
  green-family token (likely `'green'` or `'accent'`)
  (`junior-dashboard-data.ts:48`)

Risk: the rename touches a lot of lines but is mechanical. Best
done as a dedicated rename commit so it doesn't bury substantive
data changes in the diff.

## Junior portal — reconcile Coach Toolkit player cards with Player Development Tracker

The Coach Toolkit FIFA-style player cards (Commit 5, in
`src/app/junior/[slug]/_components/JuniorCoachToolkit.tsx`) use a
4-attribute rating scheme:

- **TEC** — Technical
- **PHY** — Physical
- **DEC** — Decision
- **TEM** — Teamplay

The Player Development Tracker (planned for Commit 7) is specced
to use a different 4-attribute framework, aligned to FA Youth
Development Phase categories:

- **Technical**
- **Physical**
- **Social**
- **Psychological**

These two schemes overlap (Technical, Physical) but diverge on
the other two (Decision/Teamplay vs Social/Psychological). They
cannot both be the "junior junior-player attribute model" — that
would mean a coach rating a child differently in two surfaces of
the same portal.

Commit 7 task: pick one canonical scheme and unify both surfaces
on it. Two defensible options:

1. Adopt the FA-aligned framework (Tech / Phys / Social / Psych)
   as canonical, and update the Coach Toolkit player tiles to
   match. Slightly less FIFA-card-like but pedagogically correct
   and lines up with grant / Charter Standard evidence frames.
2. Keep TEC/PHY/DEC/TEM as the FIFA-style display layer, but
   make the Development Tracker the authoring surface; the four
   tracker attributes feed the four card stats (DEC ← Psych,
   TEM ← Social, etc., with documented mapping). Cleaner
   product UX but requires a published mapping doc.

Recommendation when picked up: option 1 — the FA framework is
the right canonical surface, and Coach Toolkit cards should
reflect what's tracked, not invent a parallel scheme. Either
way, Commit 7 must reconcile deliberately rather than introduce
a third scheme or quietly let two diverge.

## Football quotes location

`FOOTBALL_QUOTES` is now duplicated across THREE locations:
- `src/app/(football)/football/[slug]/page.tsx` (line 94) —
  consumed by `PersonalBanner`
- `src/app/demo/football/[slug]/page.tsx` (line 44)
- `src/app/(football)/football/[slug]/_components/FootballDashboardModules.tsx`
  — added with the banner-quote feature; consumed by `HeroToday`

Should eventually be migrated to `src/lib/sports-quotes.ts`
alongside cricket, tennis, boxing, golf, darts. Defer until
next quote-related work to avoid bundling refactor in feature
commits.
