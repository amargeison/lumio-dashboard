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

## Module catalogue (25 modules)

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

*Mapped during session, ~95% confidence.*

Two outstanding items flagged for future sprints:

- **Settings missing from Club sidebar.** Add Settings as the final item, matching the rule that applies to every portal. To be picked up in a future Club portal pass.
- **`ground_grading_fsr` not surfaced as a top-level sidebar item.** Currently lives within the compliance flow. Decision: surface as a top-level item under a compliance group in the next Club portal sprint, matching how `psr_modeller` is surfaced in Pro.

Compliance flagship is `ground_grading_fsr` (Ground Grading + Financial Sustainability Regs).

### Lumio Women — Oakridge Women FC

*Mapped during session, 100% confidence after clarifications.*

Two items required clarification during the session, both resolved:

- **Standalone Identity Tracker** (COMMERCIAL group) → maps to `wsl_handbook` (Carney Review compliance). Tracks demerger readiness: separate legal entity, brand assets, banking, commercial deals. Revenue attributed directly to the women's team increases the permitted salary cap under FSR — direct Carney Review driver. Confirmed valuable and kept.
- **Medical Records** (OPERATIONS group) → maps to `player_welfare` as a sub-feature. Distinct data from welfare touchpoints (clinical/admin records vs welfare check-ins). Confirmed kept.

Compliance flagship is `wsl_handbook` (WSL Handbook + Carney Review).

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

---

## Sidebar action items completed in Phase 4a.5

- **Grassroots sidebar — Settings to bottom.** Achieved by absorbing `kit-lockup` into Ground group and `referee` into Admin group in `grassroots-dashboard-data.ts`. No render-logic changes. Result: 9 sidebar groups with no orphan tail; Settings is the visual last item.

---

*End of mapping spec.*
