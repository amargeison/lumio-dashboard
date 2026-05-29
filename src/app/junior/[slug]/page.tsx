'use client'

// Lumio Junior Football portal. lumio_junior is a first-class product
// (see product-config.ts). Demo-data-driven; live Supabase data layer
// is Workstream B.
//
// Commit 4: sidebar + Today dashboard. The 8-item Junior sidebar is now
// authored as a real catalogue (JUNIOR_SIDEBAR_ITEMS), filtered per
// role via JUNIOR_ROLE_CONFIG (Commit 3), and rendered floating /
// sticky. The Today landing view ships with the five Junior KPIs,
// an AI-summary banner slot (placeholder until Commit 6 wires the
// canned parent brief), a quick-actions row and a Getting Started
// onboarding tab. Module dispatch for the other sidebar items is
// still placeholder — those views land in subsequent commits
// (Safeguarding & Consent first per the standing instruction).
//
// Mirror of the Women's portal structure (src/app/womens/[slug]/page.tsx)
// — same SIDEBAR_ITEMS / DashboardView pattern, junior naming and
// junior-specific KPIs.

import { useState, useEffect, useMemo, useRef } from 'react'
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import RoleSwitcher from '@/components/sports-demo/RoleSwitcher'
import JuniorAvatarDropdown, { JuniorNotifications } from '@/components/junior/JuniorAvatarDropdown'
import JuniorStatTiles, { JuniorInbox, JuniorTodaySchedule, JuniorFixturesPanel, JuniorRecents, JuniorSquadSummary } from './_components/JuniorDashboardModules'
import SportsSettings from '@/components/sports/SportsSettings'
import JuniorSettingsAdditions from '@/components/junior/JuniorSettingsAdditions'
import JuniorSafeguardingHub from './_components/JuniorSafeguardingHub'
import JuniorClubTeamAdmin from './_components/JuniorClubTeamAdmin'
import JuniorCoachToolkit from './_components/JuniorCoachToolkit'
import JuniorParentApp from './_components/JuniorParentApp'
import JuniorAIMatchRecap from './_components/JuniorAIMatchRecap'
import JuniorMatchDayHero, { type JuniorWeather } from './_components/JuniorMatchDayHero'
import JuniorAIBriefingBox from './_components/JuniorAIBriefingBox'
import JuniorPerformanceSignals from './_components/JuniorPerformanceSignals'
import { JUNIOR_ACCENT, JUNIOR_ORG } from './_lib/junior-dashboard-data'
import { THEMES, DENSITY } from '@/app/cricket/[slug]/v2/_lib/theme'
import JuniorMatchVideo from './_components/JuniorMatchVideo'
import JuniorPerformance from './_components/JuniorPerformance'
import JuniorDevelopment from './_components/JuniorDevelopment'
import JuniorRevenueFunding from './_components/JuniorRevenueFunding'
import JuniorSquadManagement from './_components/JuniorSquadManagement'
import JuniorTactics from './_components/JuniorTactics'
import JuniorTraining from './_components/JuniorTraining'
import JuniorSetPieces from './_components/JuniorSetPieces'
import JuniorVideoAnalysis from './_components/JuniorVideoAnalysis'
import JuniorGpsPerformance from './_components/JuniorGpsPerformance'
import JuniorHeatmaps from './_components/JuniorHeatmaps'
import JuniorFixtures from './_components/JuniorFixtures'
import JuniorInsights from './_components/JuniorInsights'
import JuniorVolunteerRoles from './_components/JuniorVolunteerRoles'
import JuniorMatchdayOps from './_components/JuniorMatchdayOps'
import JuniorTournaments from './_components/JuniorTournaments'
import JuniorFundraising from './_components/JuniorFundraising'
import JuniorTravel from './_components/JuniorTravel'
import JuniorToursCamps from './_components/JuniorToursCamps'
import JuniorFacilities from './_components/JuniorFacilities'
import JuniorCommitteeSuite from './_components/JuniorCommitteeSuite'
import JuniorClubProfile from './_components/JuniorClubProfile'
import JuniorReferees from './_components/JuniorReferees'
import JuniorSendMessageModal from '@/components/junior/JuniorSendMessageModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JuniorClub {
  name: string
  slug: string
  tier: 'charter_standard' | 'grassroots'
  accent: string
  /** League / programme framing — descriptive, not enforced. */
  programme: string
  /** Number of age-band teams the club currently runs. */
  teamCount: number
  /** Age bands fielded, e.g. ['U7','U8','U9',...]. Length should match teamCount. */
  ageBands: string[]
  /** Coaching model — paid head coach + volunteer assistants, or fully volunteer. */
  coachingModel: 'paid_head_volunteer_assistants' | 'fully_volunteer'
  director: string
  /** Welfare Officer — required for Charter Standard, optional/aspirational for grassroots. */
  welfareOfficer: string | null
  charterStatus: 'achieved' | 'working_toward' | 'not_yet'
  founded: number
  ground: string
  area: string
  /** Demo tier — flagship clubs show the full feature set; starter shows the volunteer-run, smaller-club path. */
  demoTier: 'flagship' | 'starter'
  /** Short demo briefing string. Used in role/welcome panels during partnership demos. */
  demoNotes: string
  /** Demo child profile — present on flagship demos. Drives the Parent App and child-scoped views. */
  demoChild?: {
    name: string
    ageBand: string
    team: string
  }
}

// ─── Demo clubs ───────────────────────────────────────────────────────────────
// Two contrasting demo clubs — flagship (Oakridge, Charter Standard, paid head
// coach + volunteer assistants, full age-band coverage U7-U16) and starter
// (Sunday Rovers, grassroots, fully volunteer, working toward Charter, 3 teams).
// Together they cover the two ends of the FA Charter spectrum the product
// targets. Oakridge hosts the demo child "Jack Carter" (U11) — the canonical
// Parent App / child-scoped view subject across demos.

const DEMO_CLUBS: Record<string, JuniorClub> = {
  'oakridge-juniors': {
    name: 'Oakridge Juniors FC',
    slug: 'oakridge-juniors',
    tier: 'charter_standard',
    accent: '#16A34A',
    programme: 'FA Charter Standard development club',
    teamCount: 8,
    ageBands: ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U14', 'U16'],
    coachingModel: 'paid_head_volunteer_assistants',
    director: 'Mark Hutchings',
    welfareOfficer: 'Jenna Holroyd',
    charterStatus: 'achieved',
    founded: 1997,
    ground: 'Oakridge Community Pitches',
    area: 'Oakridge, Surrey',
    demoTier: 'flagship',
    demoNotes:
      'Flagship demo — full feature set. The U11 Lions squad hosts demo child Jack Carter; ' +
      'use this club for any Parent App, child-scoped video, GPS, or development-tracker walkthrough.',
    demoChild: {
      name: 'Jack Carter',
      ageBand: 'U11',
      team: 'U11 Lions',
    },
  },
  'sunday-rovers-juniors': {
    name: 'Sunday Rovers Juniors',
    slug: 'sunday-rovers-juniors',
    tier: 'grassroots',
    accent: '#166534',
    programme: 'Grassroots community club, working toward Charter Standard',
    teamCount: 3,
    ageBands: ['U9', 'U11', 'U13'],
    coachingModel: 'fully_volunteer',
    director: 'Pete Connolly',
    welfareOfficer: null,
    charterStatus: 'working_toward',
    founded: 2014,
    ground: "Rover's Field",
    area: 'Hartwell, Surrey',
    demoTier: 'starter',
    demoNotes:
      'Starter-tier demo — shows the volunteer-run, smaller-club path. Useful for demonstrating ' +
      "the Charter Standard journey (not yet achieved) and the lean three-team operating model.",
  },
}

// ─── Roles ────────────────────────────────────────────────────────────────────
// In-portal demo role switcher. The canonical RBAC role catalogue (with
// permissions, scope, products) lives in src/lib/sports/role-templates.ts —
// this array is the in-portal switcher's display list only. Each switcher
// id matches a real RBAC role from Commit 1A so the demo session and the
// RBAC layer stay coherent.
//
// `junior_player` is intentionally NOT a top-level switcher option — it's
// an age-gated profile mode, exposed through the Parent App when the
// child reaches the eligible age band. Switching to a child profile from
// the staff demo dropdown would imply Junior Player is a peer role, which
// it isn't.

const JUNIOR_ROLES = [
  { id: 'chairman',         label: 'Volunteer Chair',    icon: '🏛️' },
  { id: 'coach',            label: 'Lead Coach',         icon: '🎽' },
  { id: 'team_manager',     label: 'Team Manager',       icon: '📋' },
  { id: 'welfare_officer',  label: 'Welfare Officer',    icon: '🛡️' },
  { id: 'academy_lead',     label: 'Academy Lead',       icon: '🎓' },
  { id: 'parent_guardian',  label: 'Parent / Guardian',  icon: '👨‍👧' },
]

// ─── Sidebar catalogue ───────────────────────────────────────────────────────
// 10 top-level sidebar items, mirroring the Women's SIDEBAR_ITEMS shape
// ({ id, label, icon, group }) but cut down to the Junior product surface.
// Women's-only items deliberately dropped: Board Suite (no junior board
// surface), FSR Dashboard (no salary-cap regime), Cycle Tracking and
// Pregnancy & Return-to-Play (adult-women's-specific welfare), and the
// dense 10-tab Insights role view (a senior club role overlay, not a
// junior-club construct).
//
// (Earlier scope kept "Fixtures + fees" out of the sidebar and inside the
// Parent App / Match Recap — superseded in Tranche 1. Fixtures & Results
// is now a first-class FOOTBALL sidebar destination; see
// JuniorFixtures.tsx for the module + pluggable data source switcher.)

interface JuniorSidebarItem {
  id: string
  label: string
  icon: string
  group: 'OVERVIEW' | 'FOOTBALL' | 'PLAYERS' | 'CLUB' | 'OPERATIONS' | 'SETTINGS'
}

const JUNIOR_SIDEBAR_ITEMS: JuniorSidebarItem[] = [
  // OVERVIEW — landing + chair-scoped overview surfaces. Renders in the
  // OVERVIEW group's order (today → insights → committee_suite) via the
  // grouped reduce + groupOrder below. 'today' keeps its id and dispatch
  // (TodayView); its label changed to "Overview" to match the sibling
  // portals' Dashboard/Insights/Board Suite pattern. 'insights' moved
  // here from CLUB (chairman-scoped, same whitelist). 'committee_suite'
  // is new in this commit — the grassroots committee oversight view.
  { id: 'today',           label: 'Dashboard',       icon: '🏠', group: 'OVERVIEW' },
  { id: 'insights',        label: 'Insights',        icon: '📊', group: 'OVERVIEW' },
  { id: 'committee_suite', label: 'Committee Suite', icon: '📜', group: 'OVERVIEW' },

  // FOOTBALL — added in Tranche 1. Renders between OVERVIEW and PLAYERS via
  // groupOrder. Mirrors the Football section of the Women's portal but with
  // junior-appropriate modules. 'squad' stays in PLAYERS (label swap via
  // roleAwareLabel does the "Squad Management" framing for staff); the
  // existing 'match_video' (matchday highlights / parent-facing recap) and
  // 'performance' (per-player match performance) ALSO stay in PLAYERS —
  // the new 'video_analysis' and 'gps_performance' below are distinct
  // coaching/tactical and training-load tools, not duplicates.
  // performance_brief is a NEW sidebar destination that renders
  // JuniorAIMatchRecap; the existing sidebar-less 'ai_match_recap' route
  // from the Today banner / Parent App is preserved unchanged.
  { id: 'tactics',          label: 'Tactics',              icon: '🎯', group: 'FOOTBALL' },
  { id: 'training',         label: 'Training',             icon: '🏃', group: 'FOOTBALL' },
  { id: 'set_pieces',       label: 'Set Pieces',           icon: '📐', group: 'FOOTBALL' },
  { id: 'video_analysis',   label: 'Video & Analysis',     icon: '📹', group: 'FOOTBALL' },
  { id: 'gps_performance',  label: 'GPS & Performance',    icon: '📊', group: 'FOOTBALL' },
  { id: 'heatmaps',         label: 'Heatmaps',             icon: '🔥', group: 'FOOTBALL' },
  { id: 'performance_brief',label: 'AI Performance Brief', icon: '🤖', group: 'FOOTBALL' },
  { id: 'fixtures',         label: 'Fixtures & Results',   icon: '📅', group: 'FOOTBALL' },

  // PLAYERS — child- or squad-scoped depending on role.
  // 'squad' renders as "My Player" for parent_guardian (single child),
  // "Squad Management" for staff (full age-band roster + selection). The
  // label swap is handled at render time via roleAwareLabel() below.
  { id: 'squad',         label: 'My Players / Squad', icon: '👥', group: 'PLAYERS' },
  { id: 'match_video',   label: 'Match Video',        icon: '🎬', group: 'PLAYERS' },
  { id: 'performance',   label: 'Performance',        icon: '📡', group: 'PLAYERS' },
  { id: 'development',   label: 'Development',        icon: '📈', group: 'PLAYERS' },
  { id: 'coach_toolkit', label: 'Coach Toolkit',      icon: '🎽', group: 'PLAYERS' },

  // CLUB — staff-only in practice (the role whitelist gates this).
  { id: 'club_team',       label: 'Club & Team',     icon: '🏛️', group: 'CLUB' },
  // 'club_profile' is the public-facing identity page (badge, history,
  // ground, honours, committee, kit, sponsors). Visible to ALL roles —
  // general club info that every member can see — see JUNIOR_ROLE_CONFIG
  // below for the per-role whitelist additions.
  { id: 'club_profile',    label: 'Club Profile',    icon: '📇', group: 'CLUB' },
  { id: 'safeguarding',    label: 'Safeguarding',    icon: '🛡️', group: 'CLUB' },
  // Revenue & Funding — chairman-only, promoted to a first-class sidebar
  // destination in Commit 7.1 (was a tab inside Club & Team Admin). The
  // 'all' resolver for chairman now picks up 10 items including this one;
  // every other role's explicit whitelist excludes 'revenue_funding', so
  // it stays chairman-only. Treasurer role, if added, inherits via its
  // own whitelist.
  { id: 'revenue_funding', label: 'Revenue & Funding', icon: '💷', group: 'CLUB' },
  // CLUB addition — Tranche 2a. 'volunteer_roles' is the differentiator
  // — the web of volunteer jobs a real junior team actually runs on.
  // ('insights' was originally added here in Tranche 2a; moved up to
  // the OVERVIEW group in the structural-tweaks commit to match the
  // sibling-portals Dashboard / Insights / Board Suite pattern. Role
  // whitelist unchanged — still chairman-only via chairman's 'all'.)
  { id: 'volunteer_roles', label: 'Volunteer Roles',   icon: '🤝', group: 'CLUB' },

  // OPERATIONS — Tranche 2a. Per-Saturday, per-trip, per-summer
  // volunteer glue. "Whose Saturday does this save."
  { id: 'matchday_ops',    label: 'Matchday Operations', icon: '🎟️', group: 'OPERATIONS' },
  { id: 'referees',        label: 'Referees',            icon: '🟨', group: 'OPERATIONS' },
  { id: 'tournaments',     label: 'Tournaments',         icon: '🏆', group: 'OPERATIONS' },
  { id: 'fundraising',     label: 'Fundraising',         icon: '💰', group: 'OPERATIONS' },
  { id: 'travel',          label: 'Travel & Car-Share',  icon: '🚗', group: 'OPERATIONS' },
  // Tranche 2b additions.
  { id: 'tours_camps',     label: 'Tours & Camps',       icon: '🏕️', group: 'OPERATIONS' },
  { id: 'facilities',      label: 'Facilities',          icon: '🌱', group: 'OPERATIONS' },

  // SETTINGS — its own group, very bottom (mirrors Women's pattern).
  { id: 'settings',     label: 'Settings',           icon: '⚙️', group: 'SETTINGS' },
]

// Role-aware label override. Parent / Guardian sees "My Player" (singular,
// child-scoped) where staff see "My Players / Squad". Keeping the same
// item id keeps role gating mechanical; only the rendered string changes.
function roleAwareLabel(item: JuniorSidebarItem, role: string): string {
  // 'squad' = single child for parents ("My Player"), full staff selection
  // surface for everyone else ("Squad Management"). Keeping the same id
  // keeps role gating mechanical; only the rendered string changes.
  if (item.id === 'squad') {
    return role === 'parent_guardian' ? 'My Player' : 'Squad Management'
  }
  return item.label
}

// ─── Role config ──────────────────────────────────────────────────────────────
// Per-role sidebar gating, accent colour, and welcome-line copy. Adapted
// from src/app/womens/[slug]/page.tsx WOMENS_ROLE_CONFIG; same shape, junior
// sidebar item ids (today / squad / match_video / performance /
// development / coach_toolkit / club_team / safeguarding /
// revenue_funding / settings).
//
// revenue_funding is chairman-only — resolved automatically via the
// 'all' setting on chairman. Every other role's explicit whitelist
// below excludes it. Defensive role check inside the
// JuniorRevenueFunding module too.
//
// Parent / Guardian sidebar is materially narrower than any staff role:
// no coach_toolkit (coach-only), no club_team (club admin), no settings
// (accessible from the user menu, not the sidebar). Safeguarding IS
// included for parents but is CHILD-SCOPED — a parent's view of the
// Safeguarding module shows only their own child's photography /
// filming / data-sharing consent records, never the club-wide DBS
// register, incident log, or Welfare Officer dashboard. Role scoping
// is enforced inside the module, not by hiding the sidebar item.

interface JuniorRoleConfig {
  label: string
  icon: string
  accent: string
  /** Sidebar item id whitelist, or 'all' to show every item. */
  sidebar: 'all' | string[]
  /** Tab ids hidden within views the role can otherwise see. */
  hiddenTabs: string[]
  /** Optional banner/welcome line shown when the role is active. */
  message: string | null
}

const JUNIOR_ROLE_CONFIG: Record<string, JuniorRoleConfig> = {
  chairman: {
    label: 'Volunteer Chair',
    icon: '🏛️',
    accent: '#166534',
    sidebar: 'all',
    hiddenTabs: [],
    message: null,
  },
  coach: {
    label: 'Lead Coach',
    icon: '🎽',
    accent: '#22C55E',
    sidebar: [
      'today',
      'tactics', 'training', 'set_pieces', 'video_analysis', 'gps_performance', 'heatmaps', 'performance_brief', 'fixtures',
      'squad', 'match_video', 'performance', 'development', 'coach_toolkit',
      'club_profile', 'safeguarding',
      'matchday_ops', 'referees', 'tournaments', 'travel', 'facilities',
      'settings',
    ],
    hiddenTabs: [],
    message: 'Coaching, sessions and player-development view.',
  },
  team_manager: {
    label: 'Team Manager',
    icon: '📋',
    accent: '#0EA5E9',
    sidebar: [
      'today',
      'tactics', 'training', 'set_pieces', 'video_analysis', 'gps_performance', 'heatmaps', 'performance_brief', 'fixtures',
      'squad', 'match_video', 'performance', 'development', 'coach_toolkit',
      'club_team', 'club_profile', 'safeguarding', 'volunteer_roles',
      'matchday_ops', 'referees', 'tournaments', 'fundraising', 'travel', 'tours_camps', 'facilities',
      'settings',
    ],
    hiddenTabs: [],
    message: 'Team logistics, availability and parent-comms view.',
  },
  welfare_officer: {
    label: 'Welfare Officer',
    icon: '🛡️',
    accent: '#EF4444',
    // Fixtures added in Tranche 1 — welfare officers benefit from the
    // fixture picture (planning welfare-officer attendance at away
    // games, etc.) but do NOT need the coaching modules.
    // 'club_profile' added — general club identity surface, visible to all.
    // 'referees' added — the Protect-the-Referee layer is squarely welfare
    // territory (abuse reporting, under-18 ref duty of care).
    sidebar: ['today', 'fixtures', 'squad', 'development', 'safeguarding', 'referees', 'club_profile', 'settings'],
    hiddenTabs: [],
    message: 'Safeguarding, consent and welfare view.',
  },
  academy_lead: {
    label: 'Academy Lead',
    icon: '🎓',
    accent: '#A78BFA',
    // Development-pathway role. Whitelist is squad-and-development-focused:
    // sees Today landing, the squad, all the development-pathway surfaces
    // (development tracker is admin via the RBAC layer, coach_toolkit is
    // edit, performance + match_video read for context), safeguarding for
    // welfare context, and settings. Club & Team admin omitted — the
    // academy lead doesn't own fixtures, training schedules or comms.
    // Tranche 1 adds the FOOTBALL coaching modules and Fixtures &
    // Results — academy leads consume the development pathway across
    // age bands and need the coaching context that surrounds it.
    sidebar: [
      'today',
      'tactics', 'training', 'set_pieces', 'video_analysis', 'gps_performance', 'heatmaps', 'performance_brief', 'fixtures',
      'squad', 'match_video', 'performance', 'development', 'coach_toolkit',
      'club_profile', 'safeguarding', 'settings',
    ],
    hiddenTabs: [],
    message: 'Development pathway across age bands · termly reviews.',
  },
  parent_guardian: {
    label: 'Parent / Guardian',
    icon: '👨‍👧',
    accent: '#16A34A',
    // Materially reduced surface. Settings deliberately omitted — parent
    // account management lives in the user menu, not a top-level sidebar
    // slot. Safeguarding IS included but is CHILD-SCOPED for parents —
    // a parent's "Safeguarding" view shows only their own child's
    // photography / filming / data-sharing consent records, never the
    // DBS register, incident log, or club-wide Welfare dashboard. That
    // role-scoping is enforced inside the Safeguarding module, not by
    // hiding the sidebar item.
    // Tranche 1 adds 'fixtures' so parents can see the schedule, results
    // and league position without leaving Lumio. Coaching/tactical
    // modules remain coach-side only.
    // Tranche 2a adds 'travel' — parents both offer and need lifts, so
    // they belong in the car-share view.
    // Tranche 2b adds 'tours_camps' — parents book their child onto
    // camps and the end-of-season tour.
    // 'club_profile' is general club info — visible to every role.
    sidebar: ['today', 'fixtures', 'squad', 'match_video', 'performance', 'development', 'safeguarding', 'travel', 'tours_camps', 'club_profile'],
    hiddenTabs: [],
    message: "Your child's training, video, performance, development and consent.",
  },
}

// ─── Shared dashboard primitives ─────────────────────────────────────────────
// SectionHeader mirrors the Women's portal pattern. KPI tiles now live in
// JuniorStatTiles (./_components/JuniorDashboardModules).

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
    </div>
  )
}

// ─── Today view (dashboard landing) ──────────────────────────────────────────
// Mirrors Women's DashboardView pattern: SectionHeader + KPI grid +
// content cards. Junior KPIs from spec:
//   - registered players
//   - sessions delivered this month
//   - parent communications sent
//   - safeguarding standing (consents current / DBS current)
//   - FA Charter Standard status
//
// Plus the morning-banner / AI-summary slot at the top — placeholder
// copy now, the canned parent brief wires in Commit 6. Plus a
// role-aware quick-actions row (inline, not the shared
// RoleAwareQuickActionsBar — that component only supports
// football|cricket|womens and CLAUDE.md forbids modifying shared
// files in this commit; can be migrated once a junior
// role-quick-actions data file is created). Plus a Getting Started
// onboarding tab.

interface JuniorKPIs {
  registeredPlayers: number
  sessionsThisMonth: number
  parentCommsSent: number
  consentsCurrent: number
  consentsTotal: number
  dbsCurrent: number
  dbsTotal: number
  charterStatus: 'achieved' | 'working_toward' | 'not_yet'
}

// Demo KPIs per club. Placeholder figures, plausible for the
// flagship vs starter contrast. Real values come from the live
// data layer (Workstream B).
const DEMO_KPIS: Record<string, JuniorKPIs> = {
  'oakridge-juniors': {
    registeredPlayers: 128,
    sessionsThisMonth: 46,
    parentCommsSent: 312,
    consentsCurrent: 124,
    consentsTotal: 128,
    dbsCurrent: 18,
    dbsTotal: 18,
    charterStatus: 'achieved',
  },
  'sunday-rovers-juniors': {
    registeredPlayers: 42,
    sessionsThisMonth: 11,
    parentCommsSent: 64,
    consentsCurrent: 38,
    consentsTotal: 42,
    dbsCurrent: 5,
    dbsTotal: 7,
    charterStatus: 'working_toward',
  },
}

function consentBadgeColor(current: number, total: number): 'green' | 'amber' | 'red' {
  if (total === 0) return 'red'
  const pct = current / total
  if (pct >= 0.98) return 'green'
  if (pct >= 0.85) return 'amber'
  return 'red'
}

function charterLabel(status: JuniorKPIs['charterStatus']): { label: string; color: 'green' | 'amber' | 'red' } {
  switch (status) {
    case 'achieved':       return { label: 'Charter Standard', color: 'green' }
    case 'working_toward': return { label: 'Working toward',   color: 'amber' }
    case 'not_yet':        return { label: 'Not yet entered',  color: 'red'   }
  }
}

interface QuickAction {
  id: string
  label: string
  icon: string
  /** Sidebar id to navigate to on click. */
  target: string
}

// Role-aware quick actions. Originally 5–6 per role to match the women's bar
// length convention. Tranche 3 adds a 'send_message' action to every role;
// target 'send_message' is the special string intercepted by handleNavigate
// in JuniorPortalInner to open JuniorSendMessageModal rather than a sidebar
// section. academy_lead is also added here as an explicit entry so it no
// longer falls back to chairman.
//
// Targets must be sidebar item ids the role can see, OR the modal-special
// 'send_message'. Clicking a hidden sidebar target is a no-op on a role's
// surface, which is fine for demo.
const QUICK_ACTIONS_BY_ROLE: Record<string, QuickAction[]> = {
  chairman: [
    { id: 'view_charter',       label: 'FA Charter status',     icon: '✅', target: 'club_team' },
    { id: 'view_safeguarding',  label: 'Safeguarding standing', icon: '🛡️', target: 'safeguarding' },
    { id: 'view_squad',         label: 'Squad overview',        icon: '👥', target: 'squad' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Match video',           icon: '🎬', target: 'match_video' },
    { id: 'open_settings',      label: 'Club settings',         icon: '⚙️', target: 'settings' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
  ],
  coach: [
    { id: 'view_squad',         label: 'Today\'s squad',        icon: '👥', target: 'squad' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Last match video',      icon: '🎬', target: 'match_video' },
    { id: 'view_performance',   label: 'GPS & performance',     icon: '📡', target: 'performance' },
    { id: 'view_safeguarding',  label: 'Consent status',        icon: '🛡️', target: 'safeguarding' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
  ],
  team_manager: [
    { id: 'view_squad',         label: 'Squad & availability',  icon: '👥', target: 'squad' },
    { id: 'view_club_team',     label: 'Club & team admin',     icon: '🏛️', target: 'club_team' },
    { id: 'view_safeguarding',  label: 'Safeguarding standing', icon: '🛡️', target: 'safeguarding' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Match video',           icon: '🎬', target: 'match_video' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
  ],
  welfare_officer: [
    { id: 'view_safeguarding',  label: 'Open safeguarding',     icon: '🛡️', target: 'safeguarding' },
    { id: 'view_development',   label: 'Welfare flags',         icon: '📈', target: 'development' },
    { id: 'view_squad',         label: 'Players directory',     icon: '👥', target: 'squad' },
    { id: 'view_today',         label: 'Today briefing',        icon: '🏠', target: 'today' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
    // welfare_officer originally had 5 explicit; Tranche 3 adds send_message.
  ],
  academy_lead: [
    // Tranche 3 — explicit entry so academy_lead no longer falls back to
    // chairman. Targets are sidebar ids the role can see (today, squad,
    // development, coach_toolkit, performance_brief, match_video).
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_squad',         label: 'Squad overview',        icon: '👥', target: 'squad' },
    { id: 'view_coach_toolkit', label: 'Coach Toolkit',         icon: '🎽', target: 'coach_toolkit' },
    { id: 'view_brief',         label: 'AI Performance Brief',  icon: '🤖', target: 'performance_brief' },
    { id: 'view_video',         label: 'Match video',           icon: '🎬', target: 'match_video' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
  ],
  parent_guardian: [
    { id: 'view_my_player',     label: 'My player',             icon: '👨‍👧', target: 'squad' },
    { id: 'view_video',         label: "Jack's last match",     icon: '🎬', target: 'match_video' },
    { id: 'view_performance',   label: "Jack's performance",    icon: '📡', target: 'performance' },
    { id: 'view_development',   label: 'Development update',    icon: '📈', target: 'development' },
    { id: 'view_today',         label: 'Today briefing',        icon: '🏠', target: 'today' },
    { id: 'send_message',       label: 'Send message',          icon: '📨', target: 'send_message' },
    // Parent role: Tranche 3 adds send_message. No settings — settings
    // lives in the user menu for parents.
  ],
}

// Getting Started checklist — onboarding hints for first-time users.
// Items vary slightly by role; for now a single shared list keyed to
// what the demo flow exercises. Wire role-aware variants later.
const GETTING_STARTED_ITEMS: { id: string; label: string; done: boolean; help: string }[] = [
  { id: 'gs_profile',      label: 'Complete your profile',            done: true,  help: 'Add a photo and contact details so other club members can recognise you.' },
  { id: 'gs_consent',      label: 'Review safeguarding consents',     done: true,  help: 'Photography, travel and medical consents must be current for every player.' },
  { id: 'gs_link_child',   label: 'Link to your child (parents)',     done: false, help: 'Parents: link your account to your child\'s profile to unlock the Parent App view.' },
  { id: 'gs_first_session',label: 'Log your first training session',  done: false, help: 'Coaches: logging sessions feeds the development tracker and FA Charter evidence pack.' },
  { id: 'gs_invite_team',  label: 'Invite the rest of your team',     done: false, help: 'Invite assistant coaches, team managers and parents from Club & Team → Invitations.' },
]

// 8-point compass conversion for open-meteo winddirection (degrees → label).
// Inline helper used by the TodayView weather fetch; small enough not to
// warrant its own file. Matches the simple wind direction style used in the
// hero's "9 mph SW" demo line.
function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8]
}

function TodayView({
  club, session, onNavigate,
}: { club: JuniorClub; session: SportsDemoSession; onNavigate: (id: string) => void }) {
  const [tab, setTab] = useState<'overview' | 'getting_started'>('overview')
  const kpis = DEMO_KPIS[club.slug] ?? DEMO_KPIS['oakridge-juniors']
  const charter = charterLabel(kpis.charterStatus)
  const consentColor = consentBadgeColor(kpis.consentsCurrent, kpis.consentsTotal)
  const dbsColor = consentBadgeColor(kpis.dbsCurrent, kpis.dbsTotal)
  const actions = QUICK_ACTIONS_BY_ROLE[session.role] ?? QUICK_ACTIONS_BY_ROLE['chairman']
  const greeting = session.userName ? `Good morning, ${session.userName.split(' ')[0]}.` : 'Good morning.'

  // open-meteo current_weather — key-less, Surrey coords from JUNIOR_ORG.
  // Mirrors the Women's portal pattern (page.tsx line 5334) but actually
  // wires the result through to the hero (Women's leaves it as dead state).
  // `null` while in-flight or after error — the hero renders placeholder
  // dashes in that state so the banner doesn't collapse.
  const [weather, setWeather] = useState<JuniorWeather | null>(null)
  useEffect(() => {
    const { latitude, longitude } = JUNIOR_ORG.weatherCoords
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
      .then(r => r.json())
      .then(d => {
        const cw = d?.current_weather
        if (!cw) return
        const code = cw.weathercode as number
        const condition = code <= 3 ? 'Clear' : code <= 48 ? 'Cloudy' : code <= 67 ? 'Rain' : code <= 77 ? 'Snow' : 'Storm'
        setWeather({
          tempC:    Math.round(cw.temperature),
          condition,
          windMph:  Math.round((cw.windspeed as number) * 0.621371),
          windDir:  degreesToCompass(cw.winddirection as number),
        })
      })
      .catch(() => { /* leave weather null — hero renders placeholder */ })
  }, [])

  return (
    <div>
      {/* Match-day hero — replaces the old morning banner + section header.
          Parent role no longer sees JuniorAIMatchRecapPreview here; recap
          remains reachable via the Parent App ("My Player") MatchRecapCard.
          Buttons wire to existing sidebar destinations: performance_brief
          (AI brief) and matchday_ops. Ask Lumio reuses performance_brief
          since there's no separate Ask modal in the Junior portal yet. */}
      <JuniorMatchDayHero
        T={THEMES.dark}
        density={DENSITY.regular}
        greeting={greeting}
        weather={weather}
        squadCount={14}
        onTodaysBriefing={() => onNavigate('performance_brief')}
        onMatchdayOps={() => onNavigate('matchday_ops')}
        onAsk={() => onNavigate('performance_brief')}
      />

      {/* KPI grid — 5 Junior stat tiles per the dashboard port spec.
          Inbox / Approvals / Sessions / Charter Standard / Safeguarding.
          Driven by JUNIOR_TOP_STATS in junior-dashboard-data.ts. */}
      <JuniorStatTiles />

      {/* Quick actions row — role-aware, junior-specific. Inline (not the
          shared RoleAwareQuickActionsBar — that component only supports
          football|cricket|womens; can migrate once a junior
          role-quick-actions data file exists). */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Quick actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate(a.target)}
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(22,101,52,0.10)',
                border: '1px solid rgba(22,163,74,0.40)',
                color: '#D1D5DB',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(22,163,74,0.22)'; e.currentTarget.style.color = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(22,101,52,0.10)'; e.currentTarget.style.color = '#D1D5DB' }}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs — Overview / Getting Started. Mirrors the Women's tab
          pattern (border-bottom accent on the active tab). */}
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {[
          { id: 'overview',         label: 'Overview',        icon: '📊' },
          { id: 'getting_started',  label: 'Getting Started', icon: '🚀' },
        ].map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as 'overview' | 'getting_started')}
              className="px-4 py-2.5 text-xs font-semibold transition-all relative"
              style={{
                color: active ? '#22C55E' : '#6B7280',
                borderBottom: active ? '2px solid #22C55E' : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
        {/* AI Briefing Box — port of Women's AIBrief, relocated from the
            old top-of-page banner to the top of the Overview tab. Reads
            the same JUNIOR_AI_BRIEF data (Squad / Training / Safeguarding
            / Welfare / Compliance / Comms) but in the Women's-style row
            layout with time-of-day label switch and dismissible items.
            onAsk reuses the performance_brief route — no separate Ask
            modal in the Junior portal yet. */}
        <JuniorAIBriefingBox
          T={THEMES.dark}
          accent={JUNIOR_ACCENT}
          density={DENSITY.regular}
          onAsk={() => onNavigate('performance_brief')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">This week</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>U11 Lions — training (Tue 18:00)</span>
                <span className="text-[10px] text-gray-500">Coach: M. Hutchings</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>U9 Tigers vs Harfield Juniors (Sat 09:30, H)</span>
                <span className="text-[10px] text-gray-500">Ref booked</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>Welfare check-in (Wed 19:00)</span>
                <span className="text-[10px] text-gray-500">All teams</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Parent comms — match-day reminders</span>
                <span className="text-[10px] text-gray-500">Auto-send Fri 17:00</span>
              </li>
            </ul>
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Outstanding items</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>{kpis.consentsTotal - kpis.consentsCurrent} consent renewals outstanding</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${consentColor === 'green' ? 'bg-green-600/20 text-green-400' : consentColor === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>
                  {consentColor === 'green' ? 'On track' : consentColor === 'amber' ? 'Chase due' : 'Action needed'}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>DBS renewals — {kpis.dbsCurrent}/{kpis.dbsTotal} current</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${dbsColor === 'green' ? 'bg-green-600/20 text-green-400' : dbsColor === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>
                  {dbsColor === 'green' ? 'OK' : dbsColor === 'amber' ? 'Review' : 'Urgent'}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span>FA Charter — {charter.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${charter.color === 'green' ? 'bg-green-600/20 text-green-400' : charter.color === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>
                  {charter.color === 'green' ? 'Achieved' : charter.color === 'amber' ? 'In progress' : 'Not entered'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Welfare flags</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">No open flags</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dashboard modules ported from Women's pattern — Inbox + Today's
            schedule, Upcoming fixtures, Recent results + Squad availability.
            All driven by JUNIOR_* demo data in junior-dashboard-data.ts. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <JuniorInbox />
          <JuniorTodaySchedule />
        </div>
        <JuniorFixturesPanel />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <JuniorRecents />
          <JuniorSquadSummary />
        </div>

        {/* Performance Signals — port of Women's WfPerf, full-width strip
            at the bottom of the Overview tab. Reads JUNIOR_PERF_INTEL
            (six youth-football KPIs). */}
        <JuniorPerformanceSignals
          T={THEMES.dark}
          accent={JUNIOR_ACCENT}
          density={DENSITY.regular}
        />
        </div>
      )}

      {tab === 'getting_started' && (
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">Getting Started</h3>
          <p className="text-xs text-gray-400 mb-4">
            A short checklist to get you running. Items marked done are based on the
            demo profile; in a live club these update from real activity.
          </p>
          <ul className="space-y-3">
            {GETTING_STARTED_ITEMS.map(item => (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: item.done ? 'rgba(34,197,94,0.18)' : 'rgba(75,85,99,0.30)',
                    color: item.done ? '#22C55E' : '#9CA3AF',
                    border: item.done ? '1px solid rgba(34,197,94,0.45)' : '1px solid rgba(75,85,99,0.45)',
                  }}
                >
                  {item.done ? '✓' : ''}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${item.done ? 'text-gray-300' : 'text-white'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.help}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Settings view ───────────────────────────────────────────────────────────
// Shared SportsSettings chrome (same as Tennis / Cricket / Darts / Golf /
// Boxing / Women's) plus junior-specific augmentations via extraSections.
// JUNIOR_ROLE_CONFIG is passed verbatim so the Roles & Permissions read-only
// table renders the live config rather than a stale duplicate.

function SettingsView({
  club, session, onNavigate,
}: { club: JuniorClub; session: SportsDemoSession; onNavigate: (id: string) => void }) {
  const juniorStaffRoles = [
    'Volunteer Chair', 'Lead Coach', 'Team Manager', 'Welfare Officer',
    'Assistant Coach', 'Treasurer', 'Fixtures Secretary',
  ]
  return (
    <SportsSettings
      sport="junior"
      slug={club.slug}
      sportLabel="Lumio Junior Football"
      entity="club"
      accentColour="#16A34A"
      accentLight="#22C55E"
      session={{
        userName: session?.userName,
        photoDataUrl: session?.photoDataUrl,
        email: session?.email,
        nickname: session?.nickname,
        clubName: session?.clubName || club.name,
        logoDataUrl: session?.logoDataUrl,
        isDemoShell: session?.isDemoShell,
      }}
      storagePrefix="lumio_junior_"
      profile={{
        name: 'Volunteer Chair',
        tour: 'Competition tier',
        tourValue: club.tier === 'charter_standard' ? 'Charter Standard development' : 'Grassroots',
        ranking: 'Team count',
        rankingValue: `${club.teamCount} teams · ${club.ageBands.join(', ')}`,
        coach: 'Lead Coach',
        coachValue: club.director,
        agent: 'Welfare Officer',
        agentValue: club.welfareOfficer ?? 'Not yet appointed',
        homeVenue: 'Home ground',
        homeVenueValue: club.ground,
        playerIdLabel: 'FA Affiliation ID (demo)',
        staffInviteRoles: juniorStaffRoles,
      }}
      configFields={[
        { id: 'faAffiliationId', label: 'FA Affiliation ID (demo)',         description: 'Issued by the local County FA for affiliated junior clubs', kind: 'text',   placeholder: 'e.g. FA-OJC-2025', defaultValue: 'FA-OJC-2025' },
        { id: 'wgsRef',          label: 'Whole Game System reference (demo)', description: 'FA Whole Game System club reference',                       kind: 'text',   placeholder: 'e.g. WGS-OJC-901', defaultValue: 'WGS-OJC-901' },
        { id: 'charterTier',     label: 'FA Charter Standard tier',         description: 'Charter Standard tier — drives evidence-pack content',         kind: 'select', options: ['Charter Standard (Junior)','Working toward','Not entered'], defaultValue: club.charterStatus === 'achieved' ? 'Charter Standard (Junior)' : club.charterStatus === 'working_toward' ? 'Working toward' : 'Not entered' },
        { id: 'coachingModel',   label: 'Coaching model',                   description: 'Paid head coach + volunteer assistants, or fully volunteer',  kind: 'select', options: ['Paid head + volunteer assistants','Fully volunteer'], defaultValue: club.coachingModel === 'paid_head_volunteer_assistants' ? 'Paid head + volunteer assistants' : 'Fully volunteer' },
        { id: 'homeGround',      label: 'Home ground',                      description: 'Primary training and matchday venue',                          kind: 'text',   placeholder: 'e.g. Oakridge Community Pitches', defaultValue: club.ground },
        { id: 'founded',         label: 'Founded',                          description: 'Year of formation',                                            kind: 'number', defaultValue: String(club.founded) },
        { id: 'gpsProvider',     label: 'GPS hardware provider',            description: 'Junior GPS tracking — opt-in by age band',                     kind: 'select', options: ['None','Lumio Health (junior-tuned)','CSV Upload (manual)'], defaultValue: 'Lumio Health (junior-tuned)' },
        { id: 'accentColor',     label: 'Accent colour',                    description: 'Drives in-portal accent',                                      kind: 'color',  defaultValue: club.accent },
      ]}
      integrationGroups={[
        {
          // Brand-safety: third-party integrations listed as planned, NEVER as
          // active partnerships. Lumio has no live wiring to the FA's Whole
          // Game System, FA Charter Standard accreditation portal, DBS Online,
          // or the FA Safeguarding course platform — those integrations are
          // roadmap items. Same framing as the JOHAN "coming" pattern.
          title: 'FA & REGISTRATION',
          items: [
            { name: 'Whole Game System',     desc: 'Squad registrations + matchday reporting — integration coming' },
            { name: 'FA Charter Standard',   desc: 'Charter accreditation evidence pack — integration coming' },
            { name: 'County FA portal',      desc: 'League fixtures + discipline records — integration coming' },
          ],
        },
        {
          title: 'SAFEGUARDING',
          items: [
            { name: 'DBS Online',             desc: 'Enhanced DBS with barred-list check renewals — integration coming' },
            { name: 'FA Safeguarding course', desc: 'Mandatory refresher tracking — integration coming' },
          ],
        },
        {
          title: 'COMMUNICATION',
          items: [
            { name: 'WhatsApp Business', desc: 'Team-by-team broadcast (GDPR-bounded)' },
            { name: 'Email',             desc: 'Parent comms — consent-gated' },
            { name: 'Push notifications',desc: 'Match-day reminders + welfare alerts' },
          ],
        },
      ]}
      voiceOptions={[
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',     desc: 'Warm, confident British female — match recap narration' },
        { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Calm British female — measured parent-brief delivery' },
        { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',    desc: 'Professional British male — alternative voice option' },
      ]}
      notificationPreferences={[
        'Safeguarding standing changes',
        'DBS renewals due',
        'Consent expiries / chase reminders',
        'FA Charter evidence due',
        'Fixture changes / referee bookings',
        'Parent comms delivery summary',
        'Welfare incident new entries',
      ]}
      teamInvite={{
        enabled: true,
        staffCount: 8,
        pendingInvites: 1,
        roleOptions: juniorStaffRoles,
      }}
      navItems={JUNIOR_SIDEBAR_ITEMS.map(item => ({ key: item.id, label: item.label, emoji: item.icon }))}
      featureItems={[
        { key: 'morning-briefing', label: 'AI summary banner',  emoji: '🤖', description: 'AI summary at top of Today' },
        { key: 'quick-actions',    label: 'Quick Actions bar',  emoji: '⚡', description: 'Role-aware shortcuts on Today' },
        { key: 'getting-started',  label: 'Getting Started tab',emoji: '🚀', description: 'Onboarding checklist on Today' },
        { key: 'restricted-flag',  label: 'Restricted imagery exclusion', emoji: '🔒', description: 'Auto-exclude restricted children from imagery surfaces' },
      ]}
      showWorldClock
      showAppearance
      showDeveloperTools
      devApiRouteOptions={['/api/ai/junior']}
      extraSections={
        <JuniorSettingsAdditions
          onNavigate={onNavigate}
          roleConfig={JUNIOR_ROLE_CONFIG}
          consentCoverage="4 of 5"
        />
      }
    />
  )
}

// ─── Portal Inner ─────────────────────────────────────────────────────────────

function JuniorPortalInner({ club, session }: { club: JuniorClub; session: SportsDemoSession }) {
  const [activeSection, setActiveSection] = useState('today')

  // Sidebar collapse / hover-expand — mirrors the Women's portal pattern.
  // Pinned state persists across sessions in localStorage; hovered state is
  // ephemeral with a 400ms leave timer to prevent flicker on quick mouse-outs.
  const [pinned, setPinned] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_junior_sidebar_pinned') === 'true')
  const [hovered, setHovered] = useState(false)
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovered
  const togglePin = () => setPinned(p => { const next = !p; try { localStorage.setItem('lumio_junior_sidebar_pinned', String(next)) } catch { /* SSR */ }; return next })
  const handleSidebarEnter = () => { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null } setHovered(true) }
  const handleSidebarLeave = () => { sidebarLeaveTimer.current = setTimeout(() => setHovered(false), 400) }

  // Role-switcher state layer. The active role is held in React state so the
  // RoleSwitcher control in the sidebar can drive sidebar filtering, role-
  // aware labels and role-gated dispatch without mutating the immutable
  // SportsDemoSession prop. effectiveSession is a spread-override that
  // substitutes the live activeRole onto session.role; non-role fields
  // (userName, email, isDemoShell, photoDataUrl, sport, etc.) flow through
  // unchanged. Pass effectiveSession at every site where role drives
  // behaviour — see the role-switcher report for the audited 7-site list.
  const [activeRole, setActiveRole] = useState(session.role)
  const effectiveSession = useMemo(
    () => ({ ...session, role: activeRole }),
    [session, activeRole],
  )

  // Tranche 3 — Send Message composer is a modal, not a sidebar destination.
  // The quick-action with target === 'send_message' is intercepted by
  // handleNavigate below and opens the modal instead of calling
  // setActiveSection. Real comms delivery (push / WhatsApp / email) is the
  // future comms backend workstream's job, not this composer's.
  const [sendMessageOpen, setSendMessageOpen] = useState(false)

  // Wrapper around setActiveSection that intercepts the modal-special
  // target. Passed wherever onNavigate is consumed (TodayView quick
  // actions today; SettingsView for consistency — its onNavigate doesn't
  // produce 'send_message', so the interception is a no-op there).
  const handleNavigate = (id: string) => {
    if (id === 'send_message') {
      setSendMessageOpen(true)
      return
    }
    setActiveSection(id)
  }

  // Apply per-role sidebar gating. Fall back to 'all' if the role isn't
  // in the config (e.g., an unrecognised demo role) — failing open is the
  // right call for a demo shell; failing closed could hide content from a
  // stakeholder mid-walkthrough. Reads effectiveSession.role so the
  // RoleSwitcher re-filters the sidebar live.
  const roleConfig = JUNIOR_ROLE_CONFIG[effectiveSession.role]
  const sidebarItems =
    !roleConfig || roleConfig.sidebar === 'all'
      ? JUNIOR_SIDEBAR_ITEMS
      : JUNIOR_SIDEBAR_ITEMS.filter(item => (roleConfig.sidebar as string[]).includes(item.id))

  // Build grouped sidebar — nav-group headers mirror the Women's
  // sidebar pattern. Preserves catalogue order within each group.
  const grouped = sidebarItems.reduce<Record<string, JuniorSidebarItem[]>>((acc, it) => {
    if (!acc[it.group]) acc[it.group] = []
    acc[it.group].push(it)
    return acc
  }, {})
  const groupOrder: JuniorSidebarItem['group'][] = ['OVERVIEW', 'PLAYERS', 'FOOTBALL', 'CLUB', 'OPERATIONS', 'SETTINGS']

  return (
    // Standard portal zoom: 0.9 (per CLAUDE.md). Sidebar height compensates
    // with calc(100vh / 0.9) so the sticky column fills the visible viewport.
    <div className="flex" style={{ backgroundColor: '#07080F', color: '#F9FAFB', zoom: 0.9, minHeight: 'calc(100vh / 0.9)' }}>
      {/* Floating / sticky sidebar — full-height, scrolls internally when
          the catalogue is longer than the viewport. */}
      <aside
        className="shrink-0 border-r flex flex-col sticky top-0 overflow-hidden"
        style={{
          borderColor: '#1F2937',
          backgroundColor: '#0D1117',
          width: expanded ? 220 : 72,
          height: 'calc(100vh / 0.9)',
          transition: 'width 250ms ease',
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <div className="shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937', padding: expanded ? '16px' : '16px 0', justifyContent: expanded ? 'flex-start' : 'center' }}>
          {session.logoDataUrl
            ? <img src={session.logoDataUrl} className="w-7 h-7 rounded object-cover flex-shrink-0" alt="" />
            : <img src="/badges/oakridge_fc_crest.svg" className="w-7 h-7 rounded object-contain flex-shrink-0" alt="Oakridge Juniors crest" />}
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider truncate" style={{ color: '#9CA3AF' }}>Lumio Junior Football</p>
                <p className="text-sm font-bold mt-1 truncate">{club.name}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#6B7280' }}>{club.programme}</p>
              </div>
              <button
                onClick={togglePin}
                className="shrink-0 p-1 rounded"
                style={{ color: pinned ? '#16A34A' : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 150ms ease, color 150ms ease' }}
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
              </button>
            </>
          )}
        </div>
        <nav className="p-2 space-y-3 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {groupOrder.map(g => {
            const items = grouped[g]
            if (!items || items.length === 0) return null
            return (
              <div key={g}>
                {expanded && <p className="px-3 pb-1 text-[10px] uppercase tracking-wider" style={{ color: '#4B5563' }}>{g}</p>}
                <div className="space-y-0.5">
                  {items.map(item => {
                    const active = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { setActiveSection(item.id); if (!pinned) setHovered(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs"
                        style={{
                          backgroundColor: active ? 'rgba(22,163,74,0.15)' : 'transparent',
                          color:           active ? '#22C55E' : '#9CA3AF',
                          justifyContent:  expanded ? 'flex-start' : 'center',
                        }}
                        title={expanded ? undefined : roleAwareLabel(item, effectiveSession.role)}
                      >
                        <span>{item.icon}</span>
                        {expanded && <span>{roleAwareLabel(item, effectiveSession.role)}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
        {/* Interactive role switcher (replaces the static role-indicator pill).
            The shared RoleSwitcher persists the switched role to
            localStorage[lumio_sports_demo_junior] — same behaviour as every
            other sports portal. The "Demo shell / Live" indicator line
            preserves the signal the old static pill carried. Switching the
            role re-routes to 'today' so the user always lands on a section
            their new role can see. */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <RoleSwitcher
            session={effectiveSession}
            roles={JUNIOR_ROLES}
            accentColor="#16A34A"
            onRoleChange={(newRole) => { setActiveRole(newRole); setActiveSection('today') }}
            sidebarCollapsed={!expanded}
          />
          {expanded && (
            <p className="px-2 pt-2 text-[10px]" style={{ color: '#6B7280' }}>
              {effectiveSession.isDemoShell !== false ? 'Demo shell' : 'Live'}
            </p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Demo workspace banner — paddingRight reserves space for the
            fixed top-right avatar + notification controls below. */}
        <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16A34A', color: '#ffffff', paddingRight: 110 }}>
          <span>This is a demo · sample data</span>
          <a href="/sports-signup" className="hover:underline font-semibold" style={{ color: '#ffffff' }}>Apply for your free founding access → lumiosports.com/sports-signup</a>
        </div>

        {/* Top-right header controls — bell + avatar.
            Demo-safe avatar (no /api/workspace/* calls). Mirrors Pro
            portal placement (fixed, top:6, right:16, hidden on mobile). */}
        <div className="fixed hidden md:flex items-center gap-2" style={{ top: 6, right: 16, zIndex: 60 }}>
          <JuniorNotifications />
          <JuniorAvatarDropdown
            initials={(effectiveSession.clubName || 'OJ').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            onSettings={() => setActiveSection('settings')}
          />
        </div>

        <main className="flex-1 p-6 overflow-x-hidden">
        {activeSection === 'today' && (
          <TodayView club={club} session={effectiveSession} onNavigate={handleNavigate} />
        )}
        {activeSection === 'safeguarding' && (
          <JuniorSafeguardingHub session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'club_team' && <JuniorClubTeamAdmin session={session} />}
        {activeSection === 'club_profile' && (
          <JuniorClubProfile session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'revenue_funding' && <JuniorRevenueFunding session={session} />}
        {activeSection === 'coach_toolkit' && <JuniorCoachToolkit session={session} />}
        {activeSection === 'settings' && (
          <SettingsView club={club} session={session} onNavigate={handleNavigate} />
        )}

        {/* Parent App — rendered for parent_guardian when the sidebar 'squad'
            item is active (renders as "My Player" for parents). For staff,
            the 'squad' item still falls through to the placeholder below
            until the staff Squad view is built. */}
        {activeSection === 'squad' && effectiveSession.role === 'parent_guardian' && (
          <JuniorParentApp
            session={session}
            demoChild={club.demoChild}
            onOpenFullRecap={() => setActiveSection('ai_match_recap')}
          />
        )}

        {/* AI Match Recap — a sidebar-less route opened from the Today AI
            banner and from the Parent App MatchRecapCard "Open full recap"
            button. Renders for parent_guardian (Match Recap mode) and staff
            (Half-Time / Full-Time / Training / parent-view modes). */}
        {activeSection === 'ai_match_recap' && (
          <JuniorAIMatchRecap session={session} />
        )}

        {/* Player-side modules. */}
        {activeSection === 'match_video' && (
          <JuniorMatchVideo session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'performance' && (
          <JuniorPerformance session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'development' && (
          <JuniorDevelopment session={session} demoChild={club.demoChild} />
        )}

        {/* Staff Squad management — full module as of Tranche 1. The
            parent_guardian dispatch of 'squad' to JuniorParentApp above
            is unchanged. */}
        {activeSection === 'squad' && effectiveSession.role !== 'parent_guardian' && (
          <JuniorSquadManagement session={session} demoChild={club.demoChild} />
        )}

        {/* FOOTBALL group modules added in Tranche 1. */}
        {activeSection === 'tactics' && (
          <JuniorTactics session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'training' && (
          <JuniorTraining session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'set_pieces' && (
          <JuniorSetPieces session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'video_analysis' && (
          <JuniorVideoAnalysis session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'gps_performance' && (
          <JuniorGpsPerformance session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'heatmaps' && (
          <JuniorHeatmaps session={session} demoChild={club.demoChild} />
        )}
        {/* AI Performance Brief sidebar destination — renders the existing
            JuniorAIMatchRecap component. The sidebar-less 'ai_match_recap'
            route (opened from the Today banner and Parent App MatchRecapCard)
            stays as-is above this block — both paths render the same view. */}
        {activeSection === 'performance_brief' && (
          <JuniorAIMatchRecap session={session} />
        )}
        {activeSection === 'fixtures' && (
          <JuniorFixtures session={session} demoChild={club.demoChild} />
        )}

        {/* CLUB + OPERATIONS modules added in Tranche 2a. */}
        {activeSection === 'insights' && (
          <JuniorInsights session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'committee_suite' && (
          <JuniorCommitteeSuite session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'volunteer_roles' && (
          <JuniorVolunteerRoles session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'matchday_ops' && (
          <JuniorMatchdayOps session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'referees' && (
          <JuniorReferees session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'tournaments' && (
          <JuniorTournaments session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'fundraising' && (
          <JuniorFundraising session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'travel' && (
          <JuniorTravel session={session} demoChild={club.demoChild} />
        )}

        {/* OPERATIONS modules added in Tranche 2b. */}
        {activeSection === 'tours_camps' && (
          <JuniorToursCamps session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'facilities' && (
          <JuniorFacilities session={session} demoChild={club.demoChild} />
        )}
      </main>
      </div>

      {/* Tranche 3 — Send Message composer (modal). Mounted at the portal
          root so it sits above the sticky sidebar and the main content.
          Opens via the role-aware quick action with target === 'send_message';
          handleNavigate intercepts that special target above. */}
      {sendMessageOpen && (
        <JuniorSendMessageModal onClose={() => setSendMessageOpen(false)} />
      )}
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function JuniorFootballPortal({ params }: { params: { slug: string } }) {
  const club = DEMO_CLUBS[params.slug] ?? DEMO_CLUBS['oakridge-juniors']

  return (
    <SportsDemoGate
      sport="junior"
      defaultClubName={club.name}
      defaultSlug={params.slug}
      accentColor="#16A34A"
      accentColorLight="#22C55E"
      sportEmoji="⚽"
      sportLabel="Lumio Junior Football"
      roles={JUNIOR_ROLES}
    >
      {(session) => <JuniorPortalInner club={club} session={session} />}
    </SportsDemoGate>
  )
}
