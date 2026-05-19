'use client'

// Lumio Junior Football portal. lumio_junior is a first-class product
// (see product-config.ts). Demo-data-driven; live Supabase data layer
// is Workstream B.
//
// This file is the Commit 1B scaffold: routing, demo-gate wiring, and
// a stub JuniorPortalInner with placeholder sidebar + placeholder views.
// The full theme swap (green), dense module views, and the data layer
// land in later commits. Mirror of the Women's portal structure
// (src/app/womens/[slug]/page.tsx) per the agreed scaffold plan.

import { useState } from 'react'
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

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

// ─── Role config ──────────────────────────────────────────────────────────────
// Per-role sidebar gating, accent colour, and welcome-line copy. Adapted
// from src/app/womens/[slug]/page.tsx WOMENS_ROLE_CONFIG; same shape, junior
// sidebar item ids. The Parent / Guardian sidebar is materially narrower
// than any staff role: no `coach_toolkit`, no `staff_directory` (club
// admin), no `fundraising` (revenue), no `fa_charter_junior` (club
// compliance). What remains is child-scoped — fixtures live in the Parent
// App, plus development, video, GPS, consent, and dashboard landing.

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
      'dashboard',
      'coach_toolkit',
      'player_development',
      'video_analysis',
      'performance_gps',
      'safeguarding_consent',
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
      'dashboard',
      'parent_app',
      'coach_toolkit',
      'player_development',
      'safeguarding_consent',
      'staff_directory',
      'fa_charter_junior',
      'settings',
    ],
    hiddenTabs: [],
    message: 'Team logistics, availability and parent-comms view.',
  },
  welfare_officer: {
    label: 'Welfare Officer',
    icon: '🛡️',
    accent: '#EF4444',
    sidebar: [
      'dashboard',
      'safeguarding_consent',
      'player_development',
      'parent_app',
      'fa_charter_junior',
      'settings',
    ],
    hiddenTabs: [],
    message: 'Safeguarding, consent and welfare view.',
  },
  parent_guardian: {
    label: 'Parent / Guardian',
    icon: '👨‍👧',
    accent: '#16A34A',
    // Materially reduced surface: child-scoped only. No club-admin, no
    // coach-toolkit, no revenue. GPS/performance stays — the Parent App's
    // core promise is the child's match recap including distance and
    // heatmap (child-scoped, plain-English), not a coach-only surface.
    sidebar: [
      'dashboard',
      'parent_app',
      'player_development',
      'video_analysis',
      'performance_gps',
      'safeguarding_consent',
      'settings',
    ],
    hiddenTabs: [],
    message: "Your child's fixtures, training, development, video and consent.",
  },
}

// ─── Portal Inner ─────────────────────────────────────────────────────────────
// Stub for Commit 1B. Real sidebar, dispatch, and views land in later commits.

function JuniorPortalInner({ club, session }: { club: JuniorClub; session: SportsDemoSession }) {
  const [activeSection, setActiveSection] = useState('dashboard')

  // Sidebar catalogue — labels for the 8 Junior modules + settings + FA
  // Charter compliance. Real module dispatch lands when each module is
  // built (Safeguarding & Consent first per the standing instruction).
  const allSidebarItems = [
    { id: 'dashboard',             label: 'Dashboard',                    icon: '🏠' },
    { id: 'parent_app',            label: 'Parent App',                   icon: '👨‍👧' },
    { id: 'safeguarding_consent',  label: 'Safeguarding & Consent',       icon: '🛡️' },
    { id: 'coach_toolkit',         label: 'Coach Toolkit',                icon: '🎽' },
    { id: 'player_development',    label: 'Player Development Tracker',   icon: '📈' },
    { id: 'video_analysis',        label: 'Match Video & AI Highlights',  icon: '🎬' },
    { id: 'performance_gps',       label: 'Junior GPS & Performance',     icon: '📡' },
    { id: 'staff_directory',       label: 'Club & Team Admin',            icon: '👥' },
    { id: 'fundraising',           label: 'Club Revenue & Parent Funding', icon: '💰' },
    { id: 'fa_charter_junior',     label: 'FA Charter Standard (Junior)', icon: '✅' },
    { id: 'settings',              label: 'Settings',                     icon: '⚙️' },
  ]

  // Apply per-role sidebar gating. Fall back to 'all' if the session role
  // isn't in the config (e.g., an unrecognised demo role) — failing open
  // is the right call for a demo shell; failing closed could hide content
  // from a stakeholder mid-walkthrough.
  const roleConfig = JUNIOR_ROLE_CONFIG[session.role]
  const sidebarItems =
    !roleConfig || roleConfig.sidebar === 'all'
      ? allSidebarItems
      : allSidebarItems.filter(item => (roleConfig.sidebar as string[]).includes(item.id))

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Stub sidebar */}
      <aside className="w-64 shrink-0 border-r" style={{ borderColor: '#1F2937', backgroundColor: '#0D1117' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Lumio Junior Football</p>
          <p className="text-sm font-bold mt-1">{club.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{club.programme}</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs"
              style={{
                backgroundColor: activeSection === item.id ? 'rgba(22,163,74,0.15)' : 'transparent',
                color:           activeSection === item.id ? '#22C55E' : '#9CA3AF',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Stub main content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{club.name} — Junior Football Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            {club.tier === 'charter_standard' ? 'Charter Standard development club' : 'Grassroots community club'} ·
            {' '}{club.teamCount} teams · Founded {club.founded}
          </p>
          <p className="text-[10px] mt-2" style={{ color: '#6B7280' }}>
            Signed in as <span style={{ color: '#22C55E' }}>{session.userName || session.email}</span> ·
            Role <span style={{ color: '#22C55E' }}>{session.role}</span> ·
            {session.isDemoShell !== false ? ' Demo shell' : ' Live'}
          </p>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-2">Section: {activeSection}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Placeholder view. Lumio Junior Football is in active build. The 8 modules
            ship in dedicated commits — Safeguarding &amp; Consent first (it gates
            imagery across the portal), then Parent App, Player Development Tracker,
            Coach Toolkit, Match Video &amp; AI Highlights, Junior GPS &amp; Performance,
            Club &amp; Team Admin, Club Revenue &amp; Parent Funding.
          </p>
        </div>
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
