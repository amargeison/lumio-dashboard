# Portal Menu Mapping (Phase 4a.5)

**Status:** Locked  
**Last updated:** 2026-05-13  
**Author:** Arron Margeison + Claude (Phase 4a.5 mapping session)  
**Related specs:** `docs/specs/path-b-rbac-architecture.md` (Phase 4a), `src/lib/sports/product-config.ts` (MODULES catalogue), `src/lib/sports/role-templates.ts` (Phase 4b)

---

## Purpose

This document is the canonical mapping between the four Lumio Sports products' portal sidebars and the 25-module catalogue defined in `product-config.ts`. It exists so that:

1. Each sidebar item in each portal resolves to a known module ID.
2. Module enablement (full / lite / optional / disabled) is traceable per product.
3. Sub-features (e.g. Discipline, Volunteer Rota, Pre-Season) have a clear parent module rather than floating in component code.
4. Phase 4b role permissions can be designed against a stable module surface.

The mapping uses the **Option C approach** (see Architectural Decisions below): current sidebar items are mapped to spec modules **without** changing either the sidebar groupings or the module catalogue. Sub-features live within their parent module.

---

## Module catalogue (25 modules — 26 after Phase 4a.6 deferred cleanup)

The full set after Phase 4a.5 corrections. See `src/lib/sports/product-config.ts` for the authoritative tier matrix.

| Module ID | Label | Pro | Club | Women | Grassroots |
|---|---|---|---|---|---|
| `overview` | Overview | full | full | full | full |
| `insights` | Insights | full | full | full | full |
| `board_executive` | Board & Executive | full | full | full | full |
| `football_operations` | Football Operations | full | full | full | full |
| `tours_camps` | Tours & Camps | full | full | full | **lite** |
| `performance_gps` | Performance & GPS | full | full | full | optional |
| `medical_welfare` | Medical & Welfare | full | full | full | disabled |
| `recruitment_scouting` | Recruitment & Scouting | full | full | full | disabled |
| `youth_academy` | Youth & Academy | full | full | full | disabled |
| `junior_section` | Junior Section | disabled | disabled | disabled | full |
| `travel_logistics` | Travel & Logistics | full | full | full | full |
| `commercial_marketing` | Commercial & Marketing | full | full | full | full |
| `ticketing_crm_fans` | Ticketing, CRM & Fans | full | full | full | disabled |
| `media_comms` | Media & Comms | full | full | full | full |
| `facilities_grounds` | Facilities & Grounds | full | full | full | full |
| `finance_hr_admin` | Finance, HR & Admin | full | full | full | full |
| `staff_directory` | Staff Directory | full | full | full | full |
| `community` | Community | full | full | full | full |
| `settings` | Settings | full | full | full | full |
| `workflows_library` | Workflows Library | full | full | full | full |
| `integrations` | Integrations | full | full | full | optional |
| `psr_modeller` | PSR Modeller | full | — | — | — |
| `ground_grading_fsr` | Ground Grading + FSR | — | full | — | — |
| `wsl_handbook` | WSL Handbook + Carney | — | — | full | — |
| `fa_charter` | FA Charter | — | — | — | full |

**Phase 4a.6 deferred cleanup will change this catalogue to 26 modules.** See "Deferred decisions" below for the full Phase 4a.6 commit scope. Summary of changes:

| Change | Detail |
|---|---|
| Remove `workflows_library` | Relocates to Settings sub-tab (admin configuration, not a department) |
| Remove `integrations` | Relocates to Settings sub-tab (admin plumbing, not a department) |
| Add `cup_manager` | Cup competitions module — all 4 products at tier `'full'` |
| Add `fundraising` | Event-based community revenue module — all 4 products at tier `'full'` |
| Split `medical_welfare` → `medical` + `player_welfare` | Clinical injury management vs welfare command center — separate operational disciplines |

Net change: 25 → 26 modules. Apply as single commit before sidebar wiring sprint (Path B Day 3+).

**Removed in Phase 4a.5:** `strategy` (now a sub-tab of `board_executive`).

---

## Architectural decisions

Decisions locked during the Phase 4a.5 mapping session.

### Option C — Map current items to spec modules, change neither

Sidebar groupings and module IDs are independently meaningful. The sidebar is a UX surface; the module catalogue is the data model. Sub-features (e.g. "Discipline" within Squad, "Pre-Season" within Tours & Camps) live within their parent module's component, not as separate modules.

### Staff Directory vs Squad

Separate concerns. `staff_directory` is people management — staff records, org chart, club info documents, player records as people. The squad-side concerns of `football_operations` are football management — selection, tactical decisions, training availability. A player exists in both: as a person (`staff_directory`) and as a footballer (`football_operations`).

### Tactical formations are not Lumio's fight (for Pro)

Tactical formation tools (4-2-3-1 boards, opposition analysis, set-piece libraries) sit in the Wyscout / ProZone / Hudl space. Lumio Pro does not compete here. May revisit for non-league / Grassroots later, where the incumbent tools are absent or too expensive.

### Strategy is a sub-tab of Board & Executive

"Strategy (in Board)" in the original spec matrix is structural, not a placement hint. Strategy is rendered inside the `board_executive` component as a tab — not as a separate sidebar item. Removed from `MODULE_IDS`.

### Settings is always the last item

In every product sidebar, Settings is the final item. Grassroots sidebar was corrected in Phase 4a.5 (kit-lockup and referee absorbed into Ground and Admin groups so Club info — and within it, Settings — renders at the bottom).

### Tours & Camps vs Travel & Logistics

Distinct modules:
- **Travel & Logistics** — weekly away-day operations, 20–30 trips per season, coach hire / hotels / itineraries.
- **Tours & Camps** — pre-season and mid-season blocks, 2–4 per year, plus commercial activation (sponsor events, fan engagement, friendlies). Grassroots gets a stripped-down `lite` variant (pre-season planner only, no commercial activation).

### Youth Academy vs Junior Section

Different modules, mutually exclusive per product:
- **Youth & Academy** — elite pathway. Scholarships, contracts, dual registration, academy structure feeding the first team. Enabled for Pro / Club / Women.
- **Junior Section** — community youth operation. Parent-coaches, mini-soccer formats, DBS rotas, school-night training. Enabled for Grassroots only.

This overrides the Phase 4a spec matrix annotation that showed `youth_academy ✓` for Grassroots. The data shape is genuinely different (elite tracks contracts; community tracks volunteer rotas) and warrants separate modules rather than conditional rendering.

### Compliance access for senior club roles (Option A)

CEO and Chairman roles in `role-templates.ts` are granted permissions on all four compliance modules (`psr_modeller`, `ground_grading_fsr`, `wsl_handbook`, `fa_charter`). The role data describes intent ("this person engages with compliance"); the `MODULES.tiers` matrix describes reality ("only the flagship compliance is visible per product"). Callers combine both checks: `canAccess(role, mod) && isModuleEnabled(product, mod)`.

This avoids per-product role variants and keeps the helper signatures simple.

### Two-layer role model

- **Platform roles** (`owner`, `admin`): RBAC across Lumio. Billing, invites, portal config.
- **Club roles** (`ceo`, `chairman`, `manager`, etc.): org-chart roles within the club.

A real person typically has one of each. Founders are commonly `owner` (platform) + `ceo` (club). See `role-templates.ts` architectural comment block for full detail.

### Club's smaller operational footprint

Lumio Club (~8 default seats, ~£3k/yr) does not have dedicated Head of Performance / Head of Medical / Director of Football / Analyst roles. Those responsibilities are absorbed by the Manager. Club ships with a 6-role subset; Pro and Women ship with the full 10. Founding Club members can request the full set unlocked at provisioning time.

### Volunteer Rota is part of Football Operations

For Grassroots, volunteer matchday duties (linesman, water bottles, kit, post-match) sit alongside fixture and training data — same operational rhythm. Not a separate module.

### Safeguarding is part of FA Charter compliance (Grassroots) / Ground Grading + FSR (Club)

Safeguarding sidebar items map to the product's flagship compliance module, not to `medical_welfare`. The compliance regime defines the safeguarding requirements; the module owns the workflow.

### Unified module/department landing page pattern

Modules in Lumio Sports = Departments in Lumio Business. Both follow the same landing page template:

```
[Module Name]                          [Module description]
─────────────────────────────────────────────────────────────
Overview | Sub-tab 1 | Sub-tab 2 | Sub-tab 3 | ...
─────────────────────────────────────────────────────────────
[KPI Card 1] [KPI Card 2] [KPI Card 3] [KPI Card 4]

QUICK ACTIONS
[Action 1] [Action 2] [Action 3] [Action 4] [Action 5] ...

[Module-specific content — boards, tables, workflows, etc.]
```

This unifies the navigation experience across Business and Sports — founders working across both products encounter the same UX language. Module landing pages always have KPI cards at the top and a Quick Actions grid; omit Quick Actions only when no useful actions exist (rare).

Existing examples in the Pro portal:
- Club Operations (Operations hub) — already follows the pattern
- Board Suite — already follows the pattern
- Insights — already follows the pattern

Pattern will be applied consistently when wiring portal sidebars to the MODULES catalogue (Path B Day 3+).

### `medical` and `player_welfare` are separate modules (Phase 4a.6)

Different operational shapes warrant separate modules:

- **`medical`** = clinical injury management. Staffed by physios, doctors, sports scientists. Episodic (treat injury, manage rehab, return to play). Data shape: injury records, treatment plans, RTP timelines.
- **`player_welfare`** = welfare command center. Staffed by welfare officers, mental health practitioners. Ongoing (continuous monitoring, prevention, support). Data shape: ACL risk scores, cycle tracking, mental health check-ins, foreign player integration progress.

The two modules overlap (ACL Risk is welfare data that affects medical decisions; Medical Records cross-reference Maternity status) but they are not the same operational concern. Splitting them lets each product render the right balance:

- Pro renders both with welfare nested under MEDICAL group (welfare-as-feature)
- Women renders both with WELFARE as its own group (welfare-as-discipline, per Carney Review)
- Club renders both at lower scale (one physio, simpler welfare)
- Grassroots renders only `player_welfare` (no clinical infrastructure)

Previously `medical_welfare` was a single module — Phase 4a.6 splits it to reflect this operational reality. Also fixes a Grassroots inconsistency where welfare items were mapped to `player_welfare` but the module was disabled for Grassroots.

---

## Per-product mapping

### Lumio Pro — Oakridge FC

*Mapped during session, 100% confidence.*

Pro's sidebar contains 9 groups plus cross-cutting top items. The portal uses the unified module/department pattern: clicking a top-level sidebar item opens a module landing page with sub-tabs across the top, KPI cards, and Quick Actions grid. This pattern is shared with Lumio Business.

| Sidebar group | Item | Spec module | Notes |
|---|---|---|---|
| OVERVIEW | Dashboard *(rename → "Overview")* | `overview` | Portal home — KPIs across club, alerts, today's schedule |
| | Insights | `insights` | Includes **Point Predictor** sub-tab — league table predictor + form predictor + projected finishing position. New build. |
| BOARD | Board Suite *(rename → "Board & Executive")* | `board_executive` | Existing sub-tabs: Overview, Strategy, Profile, Finance, Squad & Performance, Governance, Facilities. **Strategy is a sub-tab here, not a module** (per 4a.5 decision) |
| COMMUNITY | Community | `community` | Foundation, programmes, schools outreach |
| FIRST TEAM | Squad Manager | `football_operations` | Sub-tab of `football_operations` landing page |
| | Training Schedule | `football_operations` | Sub-tab |
| | ~~Staff~~ | *removed* | Duplicate of `staff_directory` — confirmed removed in Phase 4a.5 mapping |
| MEDICAL | Medical Hub | `medical_welfare` | Module landing page |
| | Concussion Tracker | `medical_welfare` | Sub-tab |
| | Mental Performance | `medical_welfare` | Sub-tab |
| | Player Welfare Hub | `medical_welfare` | Sub-tab |
| GPS & LOAD | GPS Tracking | `performance_gps` | Module landing page |
| | Heatmaps | `performance_gps` | Sub-tab |
| | GPS Hardware | `performance_gps` | Sub-tab |
| OPERATIONS | Club Operations | *cross-cutting hub* | Operations Director's daily dashboard. Hub page with sub-tabs: Overview, Foreign Player Integration, Travel & Logistics, Matchday Operations, Compliance & Insurance, Player Satisfaction. **Does not map to a single module** — it's a multi-module operational view. Treat as the landing page of the OPERATIONS sidebar group itself. |
| | Matchday Operations | `football_operations` | Sub-tab of `football_operations`. Also surfaced inside Club Operations hub for convenience |
| | Travel & Logistics | `travel_logistics` | Module landing page. Also surfaced inside Club Operations hub |
| | Kit Manager | `facilities_grounds` | Sub-tab of `facilities_grounds` |
| FACILITIES | Stadium & Facilities | `facilities_grounds` | Module landing page |
| | Pitch & Grounds | `facilities_grounds` | Sub-tab |
| | Training Ground | `facilities_grounds` | Sub-tab |
| RECRUITMENT | Recruitment Hub | `recruitment_scouting` | Module landing page |
| | Academy | `youth_academy` | Module landing page — own module, sidebar-grouped under RECRUITMENT for UX |
| | Tours & Camps | `tours_camps` | Module landing page — own module, sidebar-grouped under RECRUITMENT for UX |
| COMMERCIAL | Commercial | `commercial_marketing` | Module landing page |
| | Media & PR | `media_comms` | Module landing page — own module, sidebar-grouped under COMMERCIAL for UX |
| | Social Media | `media_comms` | Sub-tab of `media_comms` |
| COMPLIANCE | Finance | `finance_hr_admin` | Module landing page — own module, sidebar-grouped under COMPLIANCE for UX (because financial reporting drives PSR compliance) |
| | PSR / SCR Modeller | `psr_modeller` | Flagship compliance module — Pro |
| INTEGRATIONS | *(various)* | `integrations` | Third-party data connections |
| ~~DISCOVER~~ | ~~Discover~~ | *removed* | Removed during 4a.5 mapping. League info / comps will be served by integrations or per-module sub-features. Point Predictor moves to `insights`. |
| *(bottom)* | Settings | `settings` | Includes Workflows Library sub-tab (per deferred decision) |

**To build for Pro**

These modules don't currently exist in the Pro portal and need building:

- `ticketing_crm_fans` — Pro flagship for fan/season ticket/CRM revenue. Module landing page with KPIs (season ticket holders, matchday attendance, revenue), Quick Actions (sell ticket, add fan record, run renewal campaign), and sub-tabs for ticketing / CRM / fan engagement
- `staff_directory` — unified people directory covering all humans connected to the club:
  - **Staff side**: CEO, manager, coaches, physios, commercial team, ground staff, volunteers (full org-chart view, contracts, DBS, emergency contacts)
  - **Player side (admin records)**: contracts, agents, emergency contacts, NI numbers, addresses, family info, DBS — *distinct from Squad Manager which handles players as footballers (selection, training availability, suspensions, form)*
  - Org chart view as a sub-tab

**Renames**

| Current name | New name | Reason |
|---|---|---|
| Dashboard | Overview | Match canonical `MODULES.label` ("overview" module) and Lumio Business sidebar |
| Board Suite | Board & Executive | Match canonical `MODULES.label` ("board_executive" module) |

Compliance flagship: `psr_modeller` (Profitability & Sustainability Rules)

### Lumio Club — Harfield FC NPL West

*Mapped during session, 100% confidence.*

Club's sidebar is a leaner version of Pro's, reflecting the non-league operational reality: smaller staff, fewer specialist roles (the Manager absorbs Director of Football, Head of Performance, Head of Medical, and Analyst responsibilities — see `role-templates.ts`), and a heavier emphasis on volunteer-driven and revenue-generating activities (fundraising, sponsorship, ground hire, cup runs). Compliance is anchored by `ground_grading_fsr`.

Club introduces two modules unique to lower-tier football operations: `cup_manager` (cup competitions are major revenue + identity moments at non-league) and `fundraising` (event-based community revenue, distinct from `commercial_marketing` sponsorship/B2B work). Both modules apply to all 4 products but Club's portal demonstrates the use case most clearly.

Club uses the same unified module/department landing page pattern as Pro and Lumio Business (KPI cards + Quick Actions + sub-tabs).

| Sidebar group | Item | Spec module | Notes |
|---|---|---|---|
| OVERVIEW | Overview | `overview` | Portal home — already correctly labelled (no rename needed) |
| | Morning Roundup *(rename → "Today's Briefing")* | *portal furniture* | Daily briefing — cross-portal rename for time-of-day neutrality |
| | Insights | `insights` | **New build for Club.** Same module as Pro/Women but tailored for non-league owners (Point Predictor for league position is a flagship feature). |
| BOARD | Board & Executive | `board_executive` | **New group for Club.** Sub-tabs: Overview, Strategy, **Club Vision** *(absorbed from top-level)*, Profile, Finance, **Committee** *(absorbed from CLUB group)*, Governance, Facilities |
| COMMUNITY | Community | `community` | **New module for Club.** Community programmes, schools outreach. *Distinct from Fundraising — Community is non-revenue community work* |
| FOOTBALL | Squad | `football_operations` | Sub-tab of `football_operations` landing page |
| | Fixtures & Cups | `football_operations` | Sub-tab — league fixtures and cup fixture scheduling |
| | Cup Manager | `cup_manager` | **Own module** *(new in Phase 4a.6)*. FA Cup, county cups, NPL Cup runs. Prize money modelling, TV income forecasting, ticketing surge management, replay scheduling. Major revenue + identity driver at non-league level. |
| | Transfers & Recruitment | `recruitment_scouting` | Module landing page. Non-league recruitment (free transfers, trials, releases) |
| | Academy | `youth_academy` | **New build for Club.** Most non-league clubs run youth academies (U18/U16/U14 feeding first team). Module is already tier `'full'` in catalogue — just needs surfacing in Club sidebar. |
| GPS & LOAD | GPS & Performance | `performance_gps` | Module landing page |
| | Heatmaps | `performance_gps` | Sub-tab |
| MEDICAL | Medical | `medical` | Module landing page. Simpler than Pro's Medical Hub (typically one physio at non-league level). *Phase 4a.6 split: was `medical_welfare`* |
| OPERATIONS | Player Registration | `football_operations` | County FA registration system — sub-tab |
| | Discipline Log | `football_operations` | Cards, suspensions, FA discipline tracking — sub-tab |
| | Match Fee Tracker | `finance_hr_admin` | Pay-to-play / match-by-match player payments at non-league level — sub-tab |
| | Kit & Equipment | `facilities_grounds` | Sub-tab |
| | Finance | `finance_hr_admin` | Module landing page |
| | Safeguarding | `ground_grading_fsr` | Compliance-anchored |
| | Matchday | `football_operations` | Sub-tab |
| TOURS & CAMPS *(rename of Pre-Season)* | Tours & Camps | `tours_camps` | **Rename and re-scope.** Currently surfaced only as "Pre-Season" at top-level. Promote to its own sidebar item with sub-tabs: **Pre-Season** *(existing — Pre-Season Camp Mode)*, Mid-Season Camps, Summer Tours. Non-league clubs do tours (warm-weather camps, friendly tours abroad). |
| FACILITIES | Ground & Facilities | `facilities_grounds` | Module landing page |
| | Ground Hire | `facilities_grounds` | Non-league clubs rent ground out (weddings, training, junior football) — sub-tab. Real revenue line. |
| CLUB | Sponsorship | `commercial_marketing` | Module landing page — B2B sponsorship contracts |
| | Fundraising | `fundraising` | **Own module** *(new in Phase 4a.6)*. Event-based community revenue: 100 club, race nights, golf days, auctions, sponsor-a-ball, JustGiving campaigns. Distinct from `commercial_marketing` (B2B contracts) and `community` (non-revenue programmes). |
| | Insurance | `ground_grading_fsr` | Public liability + players' insurance — Ground Grading compliance requirement |
| | Comms | `media_comms` | Module landing page |
| | Media & Content | `media_comms` | Sub-tab |
| | ~~Committee~~ | *moved to BOARD group* | Absorbed into `board_executive` Committee sub-tab |
| COMPLIANCE *(new group)* | Ground Grading + FSR | `ground_grading_fsr` | **New top-level surfacing.** Flagship compliance module for Club — currently nested, needs to be promoted under a new COMPLIANCE sidebar group. |
| *(bottom)* | Settings | `settings` | **New build for Club** — currently missing entirely. Includes Workflows Library + Integrations sub-tabs (per Phase 4a.6). Final item in sidebar. |

**To build for Club**

These items don't currently exist in the Club portal and need building:

- **Insights module** (`insights`) — landing page with Point Predictor (league table + form predictor), Squad analytics, Financial analytics. High-leverage feature for non-league owners.
- **Board & Executive group** (`board_executive`) — promote Club Vision into a Board sub-tab; add Strategy / Profile / Governance / Facilities sub-tabs matching Pro's Board Suite structure
- **Community module** (`community`) — new sidebar item + landing page. Community programmes, schools outreach (non-revenue community work).
- **Cup Manager module** (`cup_manager`) — new module *(Phase 4a.6 addition)*. Landing page with prize money modelling, TV income forecasting, cup fixture tracking, opposition history.
- **Fundraising module** (`fundraising`) — new module *(Phase 4a.6 addition)*. Landing page with event calendar, donation tracking, supporter club management, 100 club, fundraising target tracking.
- **Academy module** (`youth_academy`) — already in catalogue at tier `'full'` for Club, but needs portal surfacing. Landing page covering U18/U16/U14 squads, parent comms, coach scheduling.
- **Tours & Camps repositioning** — rename "Pre-Season" sidebar item to "Tours & Camps", add Mid-Season Camps and Summer Tours sub-tabs alongside existing Pre-Season Camp Mode.
- **COMPLIANCE sidebar group** — new group containing `ground_grading_fsr` as a top-level item
- **Settings module** (`settings`) — currently missing entirely. Build as final sidebar item, with Workflows Library + Integrations sub-tabs.
- **`ticketing_crm_fans` module** — season ticket / fan revenue tracking for non-league
- **`staff_directory` module** — unified people directory (staff + player admin records)

**Removed from Club sidebar**

- **Getting Started** — first-time user onboarding will be handled by a tabbed popup (existing pattern from Lumio Business / Schools), not a permanent sidebar item.
- **INTEGRATIONS** — integrations move to Settings sub-tab (Phase 4a.6, applies to all portals).

**Role correction needed**

Current Club portal RoleSwitcher shows: Manager, Asst Manager, Club Secretary, Treasurer, Sponsor. This is grassroots-style and incorrect for the semi-pro Club tier.

Per Phase 4b spec, Club should use the 6-role subset from `role-templates.ts`: `ceo`, `chairman`, `manager`, `commercial`, `head_operations`, `head_community`. More powerful roles for semi-pro clubs.

Update RoleSwitcher to read from `getAvailableRoles('lumio_club')`.

**Renames**

| Current name | New name | Reason |
|---|---|---|
| Morning Roundup | Today's Briefing | Cross-portal rename — time-of-day neutral |
| Pre-Season *(sidebar item)* | Tours & Camps | Surface the full `tours_camps` module; Pre-Season becomes a sub-tab |
| ~~Committee~~ *(sidebar item)* | Move to Board & Executive sub-tab | Absorbed into `board_executive` per Pro pattern |

No "Dashboard → Overview" rename needed (Club already labels correctly).

Compliance flagship: `ground_grading_fsr` (Ground Grading + Financial Sustainability Regs)

### Lumio Women — Oakridge Women FC

*Mapped during session, 100% confidence.*

Women's portal is the most architecturally mature of the four — already implementing the unified module/department landing page pattern (KPI cards + sub-tabs), with deeply-considered welfare features specific to women's football (ACL Risk, Cycle Tracking, Maternity, Mental Health) and a fully-built compliance group anchored by WSL Handbook + Carney Review.

Women's portal already has built (ahead of Pro/Club): Insights, Staff Directory, Tours & Camps, dedicated Welfare group, dedicated Compliance group, Standalone Identity Tracker (Carney Review).

| Sidebar group | Item | Spec module | Notes |
|---|---|---|---|
| OVERVIEW | Dashboard *(rename → "Overview")* | `overview` | Portal home — KPIs, alerts, today's schedule |
| | Morning Briefing *(rename → "Today's Briefing")* | *portal furniture* | Cross-portal rename — works regardless of time of day |
| | Insights | `insights` | Includes **Point Predictor** sub-tab (Phase 4a.6 addition) |
| COMPLIANCE | FSR Dashboard | `wsl_handbook` | Module landing page — Carney Review FSR compliance overview |
| | Salary Compliance | `wsl_handbook` | Sub-tab — squad salary cap monitoring |
| | Revenue Attribution | `wsl_handbook` | Sub-tab — Carney Review demerger readiness, standalone revenue % (was "Standalone Tracker" — confirmed mapped per earlier session) |
| | Game Standards | `wsl_handbook` | Sub-tab — WSL Handbook minimum standards compliance |
| WELFARE | Player Welfare Hub *(merge with Player Welfare)* | `player_welfare` | Module landing page — comprehensive welfare command center. **Merge:** "Player Welfare" + "Player Welfare Hub" consolidated into single item per session decision |
| | ACL Risk Monitor | `player_welfare` | Sub-tab — women's-specific ACL injury prevention tracking |
| | Cycle Tracking | `player_welfare` | Sub-tab — menstrual cycle impact on training/performance |
| | Maternity Tracker | `player_welfare` | Sub-tab — pregnancy, maternity leave, return-to-play protocols |
| | Mental Health | `player_welfare` | Sub-tab — mental health support, welfare check-ins |
| | Medical Records *(moved from OPERATIONS)* | `medical` | **Sub-tab of new `medical` module.** Clinical injury management, role-gated to Club Doctor + Welfare Lead. Cross-references ACL Risk + Maternity from `player_welfare` at top of page. |
| FOOTBALL | Squad Management | `football_operations` | Sub-tab |
| | Dual Registration | `recruitment_scouting` | Sub-tab — FA Women's dual registration agreements (lower-tier women players registered to 2 clubs simultaneously). Existing page kept as-is — mapping only |
| | Transfers | `recruitment_scouting` | Module landing page |
| | Academy | `youth_academy` | Module landing page |
| GPS & LOAD | GPS & Load | `performance_gps` | Module landing page |
| | Heatmaps | `performance_gps` | Sub-tab |
| BOARD *(new group — pulled from COMMERCIAL)* | Board Suite *(rename → "Board & Executive")* | `board_executive` | Module landing page with Pro-pattern sub-tabs: Overview, Strategy, **Club Vision** *(absorbed from COMMERCIAL)*, Profile, Finance, Governance, Facilities |
| COMMERCIAL *(restructured — revenue only)* | Sponsorship Pipeline | `commercial_marketing` | Module landing page — B2B sponsorship contracts |
| | Financial Planning | `finance_hr_admin` | Module landing page |
| | Fan Hub | `ticketing_crm_fans` | Module landing page — already built, ahead of Pro and Club |
| MEDIA *(new group — pulled from COMMERCIAL)* | Media & Content | `media_comms` | Module landing page with existing sub-tabs: Social, Sponsors, Press, Interviews |
| | Social Media *(consolidate as sub-tab of `media_comms`)* | `media_comms` | **Move:** Analytics dashboard becomes a sub-tab within Media & Content per session decision — not its own sidebar item |
| OPERATIONS | Club Operations | *cross-cutting hub* | Operations Director's daily dashboard. Multi-module operational view. Same pattern as Pro's Club Operations |
| | Matchday Operations | `football_operations` | Sub-tab |
| | Travel & Logistics | `travel_logistics` | Module landing page |
| | Kit Manager | `facilities_grounds` | Sub-tab |
| | Staff Directory | `staff_directory` | **Already built in Women's portal** — ahead of Pro and Club. Unified people directory (staff + player admin records) |
| | Tours & Camps | `tours_camps` | Module landing page — already built |
| FACILITIES | Stadium & Facilities | `facilities_grounds` | Module landing page |
| | Pitch & Grounds | `facilities_grounds` | Sub-tab |
| | Training Ground | `facilities_grounds` | Sub-tab |
| *(bottom)* | Settings | `settings` | **Move from mid-sidebar to bottom.** Currently sits under OPERATIONS group — needs relocating to final sidebar position. Includes Workflows Library + Integrations sub-tabs (Phase 4a.6) |

**To build for Women**

Women's portal is the most complete — fewer build items than Pro/Club:

- **Insights — Point Predictor sub-tab** — same Phase 4a.6 build as Pro/Club
- **BOARD group restructure** — pull Board Suite + Club Vision out of COMMERCIAL into dedicated BOARD group
- **MEDIA group restructure** — pull Media & Content + Social Media out of COMMERCIAL into dedicated MEDIA group; consolidate Social Media as sub-tab of Media & Content
- **WELFARE group additions** — surface Medical Records under WELFARE group as sub-tab of `medical` module (currently mid-sidebar under OPERATIONS)
- **`medical` module** — new module from `medical_welfare` split (Phase 4a.6). Existing "Medical Records" page becomes its first sub-tab. Future Medical Hub / Concussion Tracker can be added if needed
- **`cup_manager` module** — new module (Phase 4a.6). Continental Cup, FA WSL Cup, FA Cup operational management
- **`fundraising` module** — new module (Phase 4a.6). Foundation events, community fundraising
- **Settings relocation** — move to bottom of sidebar (currently mid-sidebar under OPERATIONS)
- **Player Welfare consolidation** — merge "Player Welfare" + "Player Welfare Hub" into single item

**Removed from Women's sidebar**

- **Player Welfare** (the older item) — merged into "Player Welfare Hub"
- **INTEGRATIONS** — relocate to Settings sub-tab (Phase 4a.6, applies to all portals)

**Renames**

| Current name | New name | Reason |
|---|---|---|
| Dashboard | Overview | Match canonical `MODULES.label` ("overview" module) and unified pattern |
| Morning Briefing | Today's Briefing | Time-of-day neutral — works regardless of when user logs in. **Applies to all 4 portals** |
| Board Suite | Board & Executive | Match canonical `MODULES.label` ("board_executive" module) |

Compliance flagship: `wsl_handbook` (WSL Handbook + Carney Review)

### Lumio Grassroots — Sunday Rovers FC

*Mapped during session, 100% confidence.*

| Sidebar group | Item | Spec module |
|---|---|---|
| OVERVIEW | Dashboard, Morning Roundup | *(portal furniture, not a module)* |
| MATCH DAY | Fixtures | `football_operations` |
| | FA Sunday Cup | `fa_charter` |
| SQUAD | Squad List, Availability, Development Notes | `football_operations` |
| | Discipline (cards / suspensions) | `football_operations` |
| | Discipline (conduct) | `player_welfare` *(welfare-side, distinct from cards)* |
| | DBS Tracker | `fa_charter` |
| | Player Profiles | `staff_directory` |
| MONEY | Subs Tracker, Kit Fund | `finance_hr_admin` |
| | League Registration | `fa_charter` |
| SOCIAL | WhatsApp & Comms, Match Photos | `media_comms` |
| GROUND | Kit & Equipment, Pitch Booking | `facilities_grounds` |
| | Kit Lock-Up *(absorbed from Club Ops in 4a.5)* | `facilities_grounds` |
| | Referee Bookings | `football_operations` |
| ADMIN | Safeguarding | `fa_charter` |
| | Volunteers | `football_operations` |
| | Travel & Logistics | `travel_logistics` |
| | Documents | `staff_directory` |
| | Referees *(absorbed from Operations in 4a.5)* | `football_operations` |
| JUNIORS | Junior Section | `junior_section` |
| CLUB INFO | Welfare | `player_welfare` |
| | Club Profile, Club History | `staff_directory` |
| | Pre-Season | `tours_camps` *(lite tier — pre-season planner only)* |
| | Settings *(now last item after 4a.5 sidebar fix)* | `settings` |

Discipline appears under two modules deliberately — the cards/suspensions side is football management (`football_operations`); the conduct/behaviour side is welfare (`player_welfare`). Component-level routing should distinguish.

Compliance flagship is `fa_charter` (FA Charter Standard).

---

## Deferred decisions

Decisions parked for future sprints. Not blocking Phase 4a.5 / 4b completion.

- **Tactical formations module.** Out of scope for Pro/Club/Women (incumbent tools own the space). Revisit for non-league or Grassroots later, where the market is unserved.
- **`junior_section` for Club.** Currently disabled for Club. If Harfield-equivalent clubs run a meaningful community youth operation alongside their NPL first team, enabling `junior_section` for Club is a one-line tier-matrix change.
- **`ground_grading_fsr` top-level surfacing in Club sidebar.** Currently nested. Surface as a top-level compliance item in the next Club portal sprint.
- **Settings position in Club sidebar.** Currently missing entirely. Add as final item in the next Club portal sprint.
- **`getModuleTier(product, moduleId)` helper.** Not yet added to `product-config.ts`. Add when the first component needs to render lite-vs-full conditionally (likely `tours_camps` Grassroots component).
- **RoleSwitcher consolidation.** `src/components/sports-demo/RoleSwitcher.tsx` currently has its own role list. Wire it to read from `getAvailableRoles(product)` in `role-templates.ts` when next touched.
- **`workflows_library` relocation to `settings` sub-tab.** Currently a standalone module at `'full'` tier across all 4 products. Architectural decision: workflows library is admin-configuration, not a department. Should be moved under Settings as a sub-tab. Migration: remove `workflows_library` from `MODULE_IDS` in `product-config.ts`, update module count from 25 → 24, update mapping spec accordingly. Apply as a clean Phase 4a.6 commit before wiring portal sidebars to MODULES (Path B Day 3+).
- **`ticketing_crm_fans` module build for Pro.** Module is defined in the catalogue but not built in the Pro portal yet. Build as part of Pro portal implementation sprint.
- **`staff_directory` module build for Pro.** Unified people directory (staff + player admin records). Module is defined in the catalogue but not built in the Pro portal yet. Build as part of Pro portal implementation sprint.
- **Phase 4a.6 — Module catalogue cleanup.** Single commit applying 5 changes: relocate `workflows_library` and `integrations` to Settings sub-tabs (remove from `MODULE_IDS`); add `cup_manager` and `fundraising` as own modules (tier `'full'` for all 4 products); split `medical_welfare` into `medical` (clinical) and `player_welfare` (welfare command center). Net change: 25 → 26 modules. Apply before sidebar wiring sprint (Path B Day 3+). Updates `product-config.ts`, `portal-menu-mapping.md`, and labels file.
- **"Today's Briefing" rename — all 4 portals.** Cross-portal rename of "Morning Briefing" (Women) / "Morning Roundup" (Pro/Club/Grassroots) → "Today's Briefing". Time-of-day neutral label. Apply as part of portal sidebar wiring sprint.
- **Club portal — missing modules to build.** Insights, Board & Executive group, Community, Cup Manager, Fundraising, Academy, Tours & Camps repositioning, COMPLIANCE group, Settings, `ticketing_crm_fans`, `staff_directory`. Most-impacted portal — significant build sprint when wiring portals.
- **Club RoleSwitcher correction.** Current Club portal shows incorrect role set (grassroots pattern: Manager, Asst Manager, Club Secretary, Treasurer, Sponsor). Update to match Phase 4b spec by reading from `getAvailableRoles('lumio_club')` — 6-role subset of Pro/Women.
- **Women's portal restructure** — BOARD and MEDIA groups pulled from COMMERCIAL; Settings moved to bottom; Social Media consolidated as sub-tab of Media & Content; Player Welfare items merged. Apply as part of Women portal implementation sprint.
- **`cup_manager` and `fundraising` module builds — all products.** Modules defined in Phase 4a.6 but not surfaced in any portal yet. Build as part of each product's implementation sprint.

---

## Sidebar action items completed in Phase 4a.5

- **Grassroots sidebar — Settings to bottom.** Achieved by absorbing `kit-lockup` into Ground group and `referee` into Admin group in `grassroots-dashboard-data.ts`. No render-logic changes. Result: 9 sidebar groups with no orphan tail; Settings is the visual last item.

---

*End of mapping spec.*
