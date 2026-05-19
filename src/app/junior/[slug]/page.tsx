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
  /** Number of age-band teams (U7-U16) the club currently runs. */
  teamCount: number
  /** Coaching model — paid head coach + volunteer assistants, or fully volunteer. */
  coachingModel: 'paid_head_volunteer_assistants' | 'fully_volunteer'
  director: string
  welfareOfficer: string | null
  charterStatus: 'achieved' | 'working_toward' | 'not_yet'
  founded: number
}

// ─── Demo clubs ───────────────────────────────────────────────────────────────
// Placeholder records for Commit 1B — full demo data lands in a later commit
// alongside the parent app, safeguarding, and player-development surfaces.

const DEMO_CLUBS: Record<string, JuniorClub> = {
  'oakridge-juniors': {
    name: 'Oakridge Juniors FC',
    slug: 'oakridge-juniors',
    tier: 'charter_standard',
    accent: '#16A34A',
    programme: 'FA Charter Standard development club',
    teamCount: 8,
    coachingModel: 'paid_head_volunteer_assistants',
    director: 'Mark Hutchings',
    welfareOfficer: 'Jenna Holroyd',
    charterStatus: 'achieved',
    founded: 1997,
  },
  'sunday-rovers-juniors': {
    name: 'Sunday Rovers Juniors',
    slug: 'sunday-rovers-juniors',
    tier: 'grassroots',
    accent: '#16A34A',
    programme: 'Grassroots community club, working toward Charter Standard',
    teamCount: 3,
    coachingModel: 'fully_volunteer',
    director: 'Pete Connolly',
    welfareOfficer: null,
    charterStatus: 'working_toward',
    founded: 2014,
  },
}

// ─── Roles ────────────────────────────────────────────────────────────────────
// Stub list for the role-switcher UI. The canonical RBAC role catalogue
// (with permissions, scope, products) lives in src/lib/sports/role-templates.ts —
// this array is the in-portal switcher's display list only.

const JUNIOR_ROLES = [
  { id: 'chairman',         label: 'Club Secretary / Chair', icon: '🏛️' },
  { id: 'welfare_officer',  label: 'Welfare Officer',         icon: '🛡️' },
  { id: 'team_manager',     label: 'Team Manager',            icon: '📋' },
  { id: 'coach',            label: 'Coach',                   icon: '🎽' },
  { id: 'volunteer',        label: 'Volunteer',               icon: '🤝' },
  { id: 'parent_guardian',  label: 'Parent / Guardian',       icon: '👨‍👧' },
  { id: 'junior_player',    label: 'Junior Player',           icon: '⚽' },
]

// ─── Portal Inner ─────────────────────────────────────────────────────────────
// Stub for Commit 1B. Real sidebar, dispatch, and views land in later commits.

function JuniorPortalInner({ club, session }: { club: JuniorClub; session: SportsDemoSession }) {
  const [activeSection, setActiveSection] = useState('dashboard')

  // Stub sidebar — placeholder labels for the 8 Junior modules. Real module
  // wiring lands when each module is built (Safeguarding & Consent first per
  // the standing instruction).
  const sidebarItems = [
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
