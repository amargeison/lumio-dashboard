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
