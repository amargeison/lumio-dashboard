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

import { useState } from 'react'
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import SportsSettings from '@/components/sports/SportsSettings'
import JuniorSettingsAdditions from '@/components/junior/JuniorSettingsAdditions'
import JuniorSafeguardingHub from './_components/JuniorSafeguardingHub'
import JuniorClubTeamAdmin from './_components/JuniorClubTeamAdmin'
import JuniorCoachToolkit from './_components/JuniorCoachToolkit'
import JuniorParentApp from './_components/JuniorParentApp'
import JuniorAIMatchRecap, { JuniorAIMatchRecapPreview } from './_components/JuniorAIMatchRecap'

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
  { id: 'parent_guardian',  label: 'Parent / Guardian',  icon: '👨‍👧' },
]

// ─── Sidebar catalogue ───────────────────────────────────────────────────────
// 9 top-level sidebar items, mirroring the Women's SIDEBAR_ITEMS shape
// ({ id, label, icon, group }) but cut down to the Junior product surface.
// Women's-only items deliberately dropped: Board Suite (no junior board
// surface), FSR Dashboard (no salary-cap regime), Cycle Tracking and
// Pregnancy & Return-to-Play (adult-women's-specific welfare), and the
// dense 10-tab Insights role view (a senior club role overlay, not a
// junior-club construct).
//
// "Fixtures + fees" deliberately is NOT a sidebar item — it's content
// inside the Parent App / Match Recap view (built in Commit 6), not a
// navigation destination.

interface JuniorSidebarItem {
  id: string
  label: string
  icon: string
  group: 'OVERVIEW' | 'PLAYERS' | 'CLUB' | 'SETTINGS'
}

const JUNIOR_SIDEBAR_ITEMS: JuniorSidebarItem[] = [
  // OVERVIEW
  { id: 'today',        label: 'Today',              icon: '🏠', group: 'OVERVIEW' },

  // PLAYERS — child- or squad-scoped depending on role.
  // 'squad' renders as "My Player" for parent_guardian (single child),
  // "My Players / Squad" for staff (full age-band roster). The label
  // swap is handled at render time via roleAwareLabel() below.
  { id: 'squad',         label: 'My Players / Squad', icon: '👥', group: 'PLAYERS' },
  { id: 'match_video',   label: 'Match Video',        icon: '🎬', group: 'PLAYERS' },
  { id: 'performance',   label: 'Performance',        icon: '📡', group: 'PLAYERS' },
  { id: 'development',   label: 'Development',        icon: '📈', group: 'PLAYERS' },
  { id: 'coach_toolkit', label: 'Coach Toolkit',      icon: '🎽', group: 'PLAYERS' },

  // CLUB — staff-only in practice (the role whitelist gates this).
  { id: 'club_team',    label: 'Club & Team',        icon: '🏛️', group: 'CLUB' },
  { id: 'safeguarding', label: 'Safeguarding',       icon: '🛡️', group: 'CLUB' },

  // SETTINGS — its own group, very bottom (mirrors Women's pattern).
  { id: 'settings',     label: 'Settings',           icon: '⚙️', group: 'SETTINGS' },
]

// Role-aware label override. Parent / Guardian sees "My Player" (singular,
// child-scoped) where staff see "My Players / Squad". Keeping the same
// item id keeps role gating mechanical; only the rendered string changes.
function roleAwareLabel(item: JuniorSidebarItem, role: string): string {
  if (item.id === 'squad' && role === 'parent_guardian') return 'My Player'
  return item.label
}

// ─── Role config ──────────────────────────────────────────────────────────────
// Per-role sidebar gating, accent colour, and welcome-line copy. Adapted
// from src/app/womens/[slug]/page.tsx WOMENS_ROLE_CONFIG; same shape, junior
// sidebar item ids (today / squad / match_video / performance /
// development / coach_toolkit / club_team / safeguarding / settings).
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
    sidebar: ['today', 'squad', 'match_video', 'performance', 'development', 'coach_toolkit', 'safeguarding', 'settings'],
    hiddenTabs: [],
    message: 'Coaching, sessions and player-development view.',
  },
  team_manager: {
    label: 'Team Manager',
    icon: '📋',
    accent: '#0EA5E9',
    sidebar: ['today', 'squad', 'match_video', 'performance', 'development', 'coach_toolkit', 'club_team', 'safeguarding', 'settings'],
    hiddenTabs: [],
    message: 'Team logistics, availability and parent-comms view.',
  },
  welfare_officer: {
    label: 'Welfare Officer',
    icon: '🛡️',
    accent: '#EF4444',
    sidebar: ['today', 'squad', 'development', 'safeguarding', 'settings'],
    hiddenTabs: [],
    message: 'Safeguarding, consent and welfare view.',
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
    sidebar: ['today', 'squad', 'match_video', 'performance', 'development', 'safeguarding'],
    hiddenTabs: [],
    message: "Your child's training, video, performance, development and consent.",
  },
}

// ─── Shared dashboard primitives ─────────────────────────────────────────────
// StatCard + SectionHeader mirror the Women's portal pattern (gradient
// tile, gray-on-dark border). Colour palette is junior green-leaning,
// with amber/red/blue retained for status communication.

function StatCard({
  label, value, sub, color = 'green',
}: { label: string; value: string | number; sub?: string; color?: 'green' | 'deep-green' | 'amber' | 'blue' | 'red' | 'gray' }) {
  const colorMap: Record<string, string> = {
    'green':      'from-green-600/20 to-green-900/10 border-green-600/30',
    'deep-green': 'from-emerald-700/25 to-emerald-900/10 border-emerald-700/30',
    'amber':      'from-amber-600/20 to-amber-900/10 border-amber-600/30',
    'blue':       'from-blue-600/20 to-blue-900/10 border-blue-600/30',
    'red':        'from-red-600/20 to-red-900/10 border-red-600/30',
    'gray':       'from-gray-700/30 to-gray-900/10 border-gray-700/30',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.green} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

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

// Role-aware quick actions. Six per role to match the women's bar
// length convention. Targets must be sidebar item ids the role can
// see (the filtered sidebar) — clicking a hidden target is a no-op
// on a role's surface, which is fine for demo.
const QUICK_ACTIONS_BY_ROLE: Record<string, QuickAction[]> = {
  chairman: [
    { id: 'view_charter',       label: 'FA Charter status',     icon: '✅', target: 'club_team' },
    { id: 'view_safeguarding',  label: 'Safeguarding standing', icon: '🛡️', target: 'safeguarding' },
    { id: 'view_squad',         label: 'Squad overview',        icon: '👥', target: 'squad' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Match video',           icon: '🎬', target: 'match_video' },
    { id: 'open_settings',      label: 'Club settings',         icon: '⚙️', target: 'settings' },
  ],
  coach: [
    { id: 'view_squad',         label: 'Today\'s squad',        icon: '👥', target: 'squad' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Last match video',      icon: '🎬', target: 'match_video' },
    { id: 'view_performance',   label: 'GPS & performance',     icon: '📡', target: 'performance' },
    { id: 'view_safeguarding',  label: 'Consent status',        icon: '🛡️', target: 'safeguarding' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
  ],
  team_manager: [
    { id: 'view_squad',         label: 'Squad & availability',  icon: '👥', target: 'squad' },
    { id: 'view_club_team',     label: 'Club & team admin',     icon: '🏛️', target: 'club_team' },
    { id: 'view_safeguarding',  label: 'Safeguarding standing', icon: '🛡️', target: 'safeguarding' },
    { id: 'view_development',   label: 'Development tracker',   icon: '📈', target: 'development' },
    { id: 'view_video',         label: 'Match video',           icon: '🎬', target: 'match_video' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
  ],
  welfare_officer: [
    { id: 'view_safeguarding',  label: 'Open safeguarding',     icon: '🛡️', target: 'safeguarding' },
    { id: 'view_development',   label: 'Welfare flags',         icon: '📈', target: 'development' },
    { id: 'view_squad',         label: 'Players directory',     icon: '👥', target: 'squad' },
    { id: 'view_today',         label: 'Today briefing',        icon: '🏠', target: 'today' },
    { id: 'open_settings',      label: 'Settings',              icon: '⚙️', target: 'settings' },
    // welfare_officer has 5 explicit; one slot left blank intentionally
    // (the role's surface is lean — padding with irrelevant actions would
    // dilute focus).
  ],
  parent_guardian: [
    { id: 'view_my_player',     label: 'My player',             icon: '👨‍👧', target: 'squad' },
    { id: 'view_video',         label: "Jack's last match",     icon: '🎬', target: 'match_video' },
    { id: 'view_performance',   label: "Jack's performance",    icon: '📡', target: 'performance' },
    { id: 'view_development',   label: 'Development update',    icon: '📈', target: 'development' },
    { id: 'view_today',         label: 'Today briefing',        icon: '🏠', target: 'today' },
    // Parent role: 5 actions, no padding. No settings here — settings
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

function TodayView({
  club, session, onNavigate,
}: { club: JuniorClub; session: SportsDemoSession; onNavigate: (id: string) => void }) {
  const [tab, setTab] = useState<'overview' | 'getting_started'>('overview')
  const isParent = session.role === 'parent_guardian'
  const kpis = DEMO_KPIS[club.slug] ?? DEMO_KPIS['oakridge-juniors']
  const charter = charterLabel(kpis.charterStatus)
  const consentColor = consentBadgeColor(kpis.consentsCurrent, kpis.consentsTotal)
  const dbsColor = consentBadgeColor(kpis.dbsCurrent, kpis.dbsTotal)
  // Combined safeguarding-standing tile: take the lower of the two badges.
  const safeguardingColor: 'green' | 'amber' | 'red' =
    consentColor === 'red' || dbsColor === 'red' ? 'red'
    : consentColor === 'amber' || dbsColor === 'amber' ? 'amber'
    : 'green'
  const actions = QUICK_ACTIONS_BY_ROLE[session.role] ?? QUICK_ACTIONS_BY_ROLE['chairman']
  const greeting = session.userName ? `Good morning, ${session.userName.split(' ')[0]}.` : 'Good morning.'

  return (
    <div>
      {/* Morning banner / AI-summary slot. For parent_guardian: renders the
          canned AI Match Recap preview (flagship demo brief — Jack Carter,
          Oakridge U11 Lions). "Open full recap" navigates to the full brief
          at activeSection 'ai_match_recap'. For staff: a club-level summary
          (placeholder copy still — staff-facing AI brief modes live inside
          the JuniorAIMatchRecap component, accessed via Coach Toolkit or
          the AI brief route, not the Today banner). */}
      <div
        className="rounded-xl p-5 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(22,101,52,0.20) 0%, rgba(22,163,74,0.08) 60%, transparent 100%)',
          border: '1px solid rgba(22,163,74,0.30)',
        }}
      >
        {isParent ? (
          <JuniorAIMatchRecapPreview
            onOpen={() => onNavigate('ai_match_recap')}
            childName={club.demoChild?.name}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">AI summary · today</p>
              <h3 className="text-base font-bold text-white">{greeting}</h3>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                {club.name} — {kpis.sessionsThisMonth} sessions delivered this month across {club.teamCount} teams. {kpis.consentsTotal - kpis.consentsCurrent} consent items outstanding. {charter.label}.
              </p>
              <p className="text-[10px] text-gray-500 mt-2 italic">
                Coach-facing AI briefs (Half-Time / Full-Time / Training) live in the AI Match Recap module —
                accessible from Coach Toolkit or via the AI brief view.
              </p>
            </div>
            <div className="shrink-0 text-3xl" aria-hidden>🤖</div>
          </div>
        )}
      </div>

      <SectionHeader
        title={`${club.name} — Today`}
        subtitle={`${club.programme} · ${club.area}`}
        icon="🏠"
      />

      {/* KPI grid — 5 Junior KPIs from the spec. */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Registered players"
          value={kpis.registeredPlayers}
          sub={`Across ${club.teamCount} teams`}
          color="green"
        />
        <StatCard
          label="Sessions this month"
          value={kpis.sessionsThisMonth}
          sub="Training + matches"
          color="deep-green"
        />
        <StatCard
          label="Parent communications"
          value={kpis.parentCommsSent}
          sub="Sent this month"
          color="blue"
        />
        <StatCard
          label="Safeguarding standing"
          value={`${kpis.consentsCurrent}/${kpis.consentsTotal}`}
          sub={`Consents current · DBS ${kpis.dbsCurrent}/${kpis.dbsTotal}`}
          color={safeguardingColor}
        />
        <StatCard
          label="FA Charter Standard"
          value={charter.label}
          sub={club.charterStatus === 'achieved' ? 'Re-accreditation on track' : 'Evidence pack in progress'}
          color={charter.color}
        />
      </div>

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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(22,101,52,0.10)',
                border: '1px solid rgba(22,163,74,0.30)',
                color: '#D1D5DB',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(22,163,74,0.18)'; e.currentTarget.style.color = '#F9FAFB' }}
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
          title: 'FA & REGISTRATION',
          items: [
            { name: 'Whole Game System',     desc: 'Squad registrations + matchday reporting', connected: true },
            { name: 'FA Charter Standard',   desc: 'Charter accreditation evidence pack',      connected: true },
            { name: 'County FA portal',      desc: 'League fixtures + discipline records' },
          ],
        },
        {
          title: 'SAFEGUARDING',
          items: [
            { name: 'DBS Online',            desc: 'Enhanced DBS with barred-list check renewals', connected: true },
            { name: 'FA Safeguarding course', desc: 'Mandatory refresher tracking',                connected: true },
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

  // Apply per-role sidebar gating. Fall back to 'all' if the session role
  // isn't in the config (e.g., an unrecognised demo role) — failing open
  // is the right call for a demo shell; failing closed could hide content
  // from a stakeholder mid-walkthrough.
  const roleConfig = JUNIOR_ROLE_CONFIG[session.role]
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
  const groupOrder: JuniorSidebarItem['group'][] = ['OVERVIEW', 'PLAYERS', 'CLUB', 'SETTINGS']

  return (
    // Standard portal zoom: 0.9 (per CLAUDE.md). Sidebar height compensates
    // with calc(100vh / 0.9) so the sticky column fills the visible viewport.
    <div className="flex" style={{ backgroundColor: '#07080F', color: '#F9FAFB', zoom: 0.9, minHeight: 'calc(100vh / 0.9)' }}>
      {/* Floating / sticky sidebar — full-height, scrolls internally when
          the catalogue is longer than the viewport. */}
      <aside
        className="w-64 shrink-0 border-r flex flex-col sticky top-0"
        style={{
          borderColor: '#1F2937',
          backgroundColor: '#0D1117',
          height: 'calc(100vh / 0.9)',
        }}
      >
        <div className="p-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Lumio Junior Football</p>
          <p className="text-sm font-bold mt-1">{club.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{club.programme}</p>
        </div>
        <nav className="p-2 space-y-3 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {groupOrder.map(g => {
            const items = grouped[g]
            if (!items || items.length === 0) return null
            return (
              <div key={g}>
                <p className="px-3 pb-1 text-[10px] uppercase tracking-wider" style={{ color: '#4B5563' }}>{g}</p>
                <div className="space-y-0.5">
                  {items.map(item => {
                    const active = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs"
                        style={{
                          backgroundColor: active ? 'rgba(22,163,74,0.15)' : 'transparent',
                          color:           active ? '#22C55E' : '#9CA3AF',
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{roleAwareLabel(item, session.role)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="p-3 text-[10px] shrink-0" style={{ borderTop: '1px solid #1F2937', color: '#6B7280' }}>
          Signed in as <span style={{ color: '#22C55E' }}>{session.userName || session.email}</span><br />
          Role <span style={{ color: '#22C55E' }}>{roleConfig?.label ?? session.role}</span>{session.isDemoShell !== false ? ' · Demo shell' : ' · Live'}
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-x-hidden">
        {activeSection === 'today' && (
          <TodayView club={club} session={session} onNavigate={setActiveSection} />
        )}
        {activeSection === 'safeguarding' && (
          <JuniorSafeguardingHub session={session} demoChild={club.demoChild} />
        )}
        {activeSection === 'club_team' && <JuniorClubTeamAdmin session={session} />}
        {activeSection === 'coach_toolkit' && <JuniorCoachToolkit session={session} />}
        {activeSection === 'settings' && (
          <SettingsView club={club} session={session} onNavigate={setActiveSection} />
        )}

        {/* Parent App — rendered for parent_guardian when the sidebar 'squad'
            item is active (renders as "My Player" for parents). For staff,
            the 'squad' item still falls through to the placeholder below
            until the staff Squad view is built. */}
        {activeSection === 'squad' && session.role === 'parent_guardian' && (
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

        {/* Module views still to build — placeholder for the remaining sidebar
            ids until they get their own commits. */}
        {((activeSection === 'squad' && session.role !== 'parent_guardian') ||
          activeSection === 'match_video' ||
          activeSection === 'performance' ||
          activeSection === 'development') && (
          <div>
            <SectionHeader
              title={
                roleAwareLabel(
                  JUNIOR_SIDEBAR_ITEMS.find(i => i.id === activeSection) ?? JUNIOR_SIDEBAR_ITEMS[0],
                  session.role,
                )
              }
              subtitle="Module view — full content lands in a later commit."
              icon={JUNIOR_SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon ?? '📄'}
            />
            <div className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-2 text-white">Section: {activeSection}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Placeholder view. The remaining player-side modules (staff Squad
                management, Match Video, Performance, Development) ship in
                subsequent commits.
              </p>
            </div>
          </div>
        )}
      </main>
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
