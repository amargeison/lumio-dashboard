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

---

## Per-product mapping

### Lumio Pro — Oakridge FC

*Mapped during session, ~95% confidence.*

Pro's sidebar resolves cleanly to spec modules with one structural decision:

- The original sidebar had a duplicate "Staff" entry under FIRST TEAM group plus a Staff Directory entry under CLUB. Resolution: keep `staff_directory` as a single top-level module; the FIRST TEAM "Staff" was a navigation duplicate and is removed.

All other items map 1:1 to the module catalogue. Compliance flagship is `psr_modeller` (PSR — Profitability & Sustainability Rules).

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

---

## Sidebar action items completed in Phase 4a.5

- **Grassroots sidebar — Settings to bottom.** Achieved by absorbing `kit-lockup` into Ground group and `referee` into Admin group in `grassroots-dashboard-data.ts`. No render-logic changes. Result: 9 sidebar groups with no orphan tail; Settings is the visual last item.

---

*End of mapping spec.*
