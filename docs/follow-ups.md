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

## Junior founding-member empty-portal landing (`/junior/app`)

A real junior founding member who signs in via the welcome email&rsquo;s
"Sign in to your portal" CTA lands on `/junior/app`. The route
exists at `src/app/junior/app/page.tsx` and renders the
`SportsComingSoon` placeholder &mdash; not a live portal, not the
founder&rsquo;s own data. Every sport ships the same coming-soon
placeholder today (`src/app/{boxing,cricket,darts,golf,tennis,rugby,
womens,nonleague,grassroots,(football)/football,junior}/app/page.tsx`),
so this is not junior-specific.

The fix belongs to the founding-member onboarding wizard &mdash;
the separate future workstream that:
- Writes a real `sports_clubs` row for the founder&rsquo;s club
- Creates a `sports_memberships` row binding the founder to that club
- Replaces the per-sport `SportsComingSoon` with a real `/<sport>/app`
  page that reads the founder&rsquo;s own club, not the demo data
- For junior specifically, the wizard also seeds the empty
  `junior_*` tables (teams, age bands, welfare officer placeholder,
  initial consent rows, etc.) for the new club so the safeguarding
  surfaces don&rsquo;t render empty on first sign-in

Smaller adjacent item discovered while logging this: the junior
coming-soon page passes `demoHref="/junior/junior-demo"`
(`src/app/junior/app/page.tsx:12`), but `junior-demo` is not a key
in `DEMO_CLUBS` in `src/app/junior/[slug]/page.tsx`, so the demo
button falls back to Oakridge Juniors via `DEMO_CLUBS[params.slug]
?? DEMO_CLUBS['oakridge-juniors']`. Functional but the URL is ugly;
change `demoHref` to `/junior/oakridge-juniors` whenever the
onboarding wizard touches this file.

Risk: shipping junior founder sign-ups before the wizard exists
means a paying chairman&rsquo;s first authenticated experience is a
"coming soon" placeholder, which contradicts the
"your portal is ready to build" framing in the founder welcome
email. Either fix this when wiring up the onboarding wizard, or
hold junior founder sign-ups behind a waitlist until the wizard
ships.

## WhatsApp template-nudge → in-app confirmation flow (comms backend workstream)

Belongs to the future comms BACKEND workstream &mdash; NOT the
Tranche 3 Junior portal Send Message UI, which is canned and
UI-only by design. This entry is the place to capture the
designed-but-not-built delivery pattern that the comms workstream
needs to implement.

The pattern: send parents a short WhatsApp NUDGE that drives them
to open the Lumio app and answer there. WhatsApp is the delivery
layer, not the conversation surface. The actual interaction
(availability Y/N, "are you driving?" Y/N, lift requests, kit
confirmations, camp sign-ups) happens IN-APP &mdash; big simple
buttons in Lumio &mdash; where there are no templates, no
per-message cost, and full UI control. The portal modules to
surface these confirmations already exist: Volunteer Roles rota
(this weekend&rsquo;s rota tab), Matchday Operations (kit /
equipment / ops checklists), Travel &amp; Car-Share (driver +
passenger matching).

WhatsApp delivery side:
- Official WhatsApp Business Platform via a provider such as
  Twilio (server-side REST API). No client-side WhatsApp logic.
- Business-initiated WhatsApp messages MUST use a pre-approved
  Meta message template &mdash; so the nudge is a fixed approved
  template (e.g. "{team} has an update &mdash; open Lumio to
  confirm availability for Saturday"). Free-form business-initiated
  WhatsApp messaging out of the blue is not permitted; only
  template messages cross the platform from us → parent.
- Templates need registering with Meta in advance; expect a
  template catalogue alongside the comms backend (nudges for
  availability, lift, camp sign-up, payment reminder, welfare
  follow-up, etc.).

Constraints to design around:
- Per-conversation cost &mdash; WhatsApp Business messages are
  paid, unlike an in-app push. Treat WhatsApp as a paid catch-all,
  not the default channel.
- Opt-in is mandatory &mdash; every parent must consent to
  WhatsApp contact before any message. For a children&rsquo;s
  product this should slot into the existing Safeguarding &amp;
  Consent hub (`src/app/junior/[slug]/_components/JuniorSafeguardingHub.tsx`)
  as a new consent type alongside photography / filming / data-
  sharing, with the same chase / expiry treatment.
- Restricted-child rule from the safeguarding boundary still
  applies &mdash; WhatsApp template content must not name or
  identify restricted children. Audit at template-design time.

Recommended layering:
- Native push notification for parents who HAVE the Lumio app
  installed &mdash; same nudge content, zero per-message cost.
  Push is the default channel.
- WhatsApp template-nudge as the paid catch-all for parents who
  have not installed the app yet (or have notifications off).
  WhatsApp&rsquo;s value is reach, not being the cheapest channel.
- Email as a third-tier fallback for parents who have opted out
  of both push and WhatsApp.

Status: designed/specified here, not built. Depends on the comms
backend workstream &mdash; provider integration (Twilio or
equivalent), opt-in handling stored on the parent record,
Meta template registration, server-side delivery pipeline,
and the in-app push infrastructure. The Junior portal UI
surfaces (Tranche 3 Send Message composer, Volunteer Roles rota,
Matchday Ops, Travel) are the receiving side of this pattern and
already in place canned; they wire to a real backend in the
comms workstream.
