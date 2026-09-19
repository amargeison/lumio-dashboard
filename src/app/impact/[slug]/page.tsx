'use client'

// ─── LUMIO IMPACT PORTAL — DEMO SHELL ───────────────────────────────────────
// URL: /impact/[slug] (demo slug: /impact/tenproject)
//
// The Ten Project build on the house demo pattern: SportsDemoGate (email →
// OTP) replaces the old client-side DEMO_PIN, so Impact captures leads into
// sports_demo_leads and sends the per-sport welcome email like every other
// portal. Views and demo data are unchanged — see
// src/app/tenproject/[slug]/page.tsx, which stays in place until this is
// verified and that route is retired or redirected.
// First build slice per docs Ten_Project_Portal_Scoping_v2.docx: PIN gate
// (071711, matching all sport portals), five-role switcher, four surfaces —
// HQ dashboard, School fundraising, Parent app, Coach + TENOR registers.
// All data is fictional demo data (src/data/tenproject/demo-data.ts).
// Standard portal zoom 0.9 — sidebar compensates with calc(100vh / 0.9).

import React, { use, useEffect, useState } from 'react'
import { LayoutDashboard, School, Smartphone, ClipboardList, Users, LogOut, BarChart3, MapPin, ShieldCheck, Send, Share2, Package, Settings, PoundSterling, CalendarDays, BookOpen, Pin, PinOff, TrendingUp, Landmark } from 'lucide-react'
import { TP_RED, TP_DARK, TP_BLACK, TP_PAPER } from '@/data/tenproject/demo-data'
import { SportsDemoGate } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { clearDemoSession, markDemoSignedOut } from '@/lib/demo-session/clear'
import HQView, { type HqTab } from '@/app/tenproject/[slug]/_components/HQView'
import SchoolView, { type SchoolSection } from '@/app/tenproject/[slug]/_components/SchoolView'
import ParentApp from '@/app/tenproject/[slug]/_components/ParentApp'
import { CoachView, TenorView, type CoachSection, type TenorSection } from '@/app/tenproject/[slug]/_components/RegisterViews'

// Roles offered by SportsDemoGate's wizard (it wants emoji icons). Mirrors
// ROLES below one-for-one; ROLES keeps the lucide icons the portal chrome uses.
const IMPACT_ROLES = [
  { id: 'hq',     label: 'Ten Project HQ', icon: '📊', description: 'Programme health & oversight' },
  { id: 'school', label: 'School',         icon: '🏫', description: 'Fundraising & programme'      },
  { id: 'parent', label: 'Parent',         icon: '📱', description: 'The family app'               },
  { id: 'coach',  label: 'Coach',          icon: '📋', description: 'Sessions & registers'         },
  { id: 'tenor',  label: 'TENOR',          icon: '👥', description: 'Weekend venue & QR scan-in'   },
]

// Exit demo — the house idiom (see src/app/coach/[slug]/page.tsx). Clearing the
// session alone is not enough: the gate rebuilds one from the survivors on its
// next mount, so the marker is what parks it back on the email screen.
function signOutImpact() {
  if (typeof window === 'undefined') return
  clearDemoSession('impact')
  markDemoSignedOut('impact')
  window.location.href = '/impact/tenproject'
}

type Role = 'hq' | 'school' | 'parent' | 'coach' | 'tenor'

const ROLES: { id: Role; label: string; desc: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
  { id: 'hq', label: 'Ten Project HQ', desc: 'Programme health, schools, funnel, fundraising oversight', icon: LayoutDashboard },
  { id: 'school', label: 'School', desc: 'St Clement’s — fundraising dashboard & events', icon: School },
  { id: 'parent', label: 'Parent', desc: 'The family app — booklet, sessions, messages', icon: Smartphone },
  { id: 'coach', label: 'Coach', desc: 'In-school session, one-tap register, skill taps', icon: ClipboardList },
  { id: 'tenor', label: 'TENOR', desc: 'Weekend venue, QR scan-in, live count', icon: Users },
]

const ROLE_TITLES: Record<Role, { title: string; sub: string }> = {
  hq: { title: 'HQ — Programme Health', sub: 'Everything across schools, coaches, venues and funders' },
  school: { title: 'St Clement’s Primary — School view', sub: 'Ran Ten Project 2025/26 · fundraising to bring it back for 2026/27' },
  parent: { title: 'Parent app', sub: 'Sarah Whitfield · Mia (7) & Tom (5) · Oakridge Primary' },
  coach: { title: 'Coach — Natalie Brooks', sub: 'Today’s in-school session and register' },
  tenor: { title: 'TENOR — David Okafor', sub: 'Saturday family session at Kingsmead Rec Ground' },
}

// The landing section per role keeps the role title; every other section shows
// its own name as the page headline.
const LANDING_SECTION: Record<Role, string> = { hq: 'overview', school: 'programme', coach: 'stats', tenor: 'session', parent: 'app' }

const SECTION_HEADERS: Record<string, Record<string, { title: string; sub: string }>> = {
  hq: {
    insights: { title: 'Insights', sub: 'Participation, conversion, impact and social value — funder-ready' },
    schools: { title: 'Schools', sub: 'Every partner school — profile, programme, stats and actions in one place' },
    venues: { title: 'Weekend venues', sub: 'Every weekend community venue — access, sessions, teams and attendance in one place' },
    coaches: { title: 'Coaches', sub: 'Your coaching team at a glance — accreditations, compliance and workload across the programme' },
    tenors: { title: 'TENORs', sub: 'Your volunteer parents — inductions, venue cover and the “can this session run?” view' },
    comms: { title: 'Communications', sub: 'One inbox, newsletters and automations — replacing your email tools' },
    social: { title: 'Social', sub: 'Plan, schedule, publish and measure across every channel' },
    equipment: { title: 'Equipment & Kit', sub: 'Everything across venues, school bags and welcome-pack stock — edit inline, restock in one click' },
    network: { title: 'PE & School Sport Partnership Network', sub: 'Which schools are on track to qualify for the new funding — readiness, key dates and the latest DfE guidance, in one place' },
    settings: { title: 'Settings', sub: 'Organisation, branding, integrations, comms and data' },
  },
  school: {
    insights: { title: 'Insights', sub: 'Your impact dashboard — built for governors, sponsors and your Sports Premium return' },
    fundraising: { title: 'Fundraising', sub: 'Your 2026/27 campaign — thermometer, events and donations' },
  },
  coach: {
    today: { title: 'Schools', sub: 'Your schools and today’s in-school session' },
    weekend: { title: 'Weekend sessions', sub: 'Your Saturday and Sunday family sessions' },
    resources: { title: 'Resources', sub: 'Session plans, videos and guides' },
  },
  tenor: {
    resources: { title: 'Resources', sub: 'Videos, session cards, guides and who to call' },
  },
}

function headerFor(role: Role, section: string): { title: string; sub: string } {
  if (section === LANDING_SECTION[role]) return ROLE_TITLES[role]
  return SECTION_HEADERS[role]?.[section] ?? ROLE_TITLES[role]
}

function ImpactPortalInner({ session }: { session: SportsDemoSession }) {
  // Role starts unset so the Ten Project role picker still fronts the portal,
  // exactly as it did behind the PIN.
  const [role, setRole] = useState<Role | null>(null)
  const [lockedRole, setLockedRole] = useState<Role | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // Sidebar-driven sections per role (tennis-portal pattern)
  const [hqSection, setHqSection] = useState<HqTab>('overview')
  const [schoolSection, setSchoolSection] = useState<SchoolSection>('programme')
  const [coachSection, setCoachSection] = useState<CoachSection>('stats')
  const [tenorSection, setTenorSection] = useState<TenorSection>('session')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 760px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Theme — paper is the default; Settings → Appearance → "Dark mode" opts in.
  const [dark, setDark] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setDark(localStorage.getItem('tp_dark') === '1')
    sync()
    window.addEventListener('tp-theme', sync)
    return () => window.removeEventListener('tp-theme', sync)
  }, [])

  // Sidebar pin — floating rail that expands on hover when unpinned.
  const [pinned, setPinned] = useState(true)
  const [railHover, setRailHover] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') setPinned(localStorage.getItem('tp_sidebar_pin') !== '0')
  }, [])
  function togglePin() {
    setPinned(p => {
      localStorage.setItem('tp_sidebar_pin', p ? '0' : '1')
      return !p
    })
  }

  // Content-area inversion keeps every component untouched; images re-invert
  // so logos, crests and photos stay true-colour. Sidebar/top bar already dark.
  // Main bg is #EEEEEB when dark — its inverse is exactly Ten Project #111114.
  const darkStyle = dark ? (
    <style>{`
      .tp-theme-dark { filter: invert(1) hue-rotate(180deg); }
      .tp-theme-dark img { filter: invert(1) hue-rotate(180deg); }
    `}</style>
  ) : null
  const contentClass = dark ? 'tp-theme-dark' : undefined
  const mainBg = dark ? '#EEEEEB' : TP_PAPER

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Deep-link support: /impact/tenproject?role=parent lands straight on that
    // role after the gate AND locks the session to it — a parent following the
    // website CTA never sees HQ/School/Coach/TENOR (mirrors real role-based
    // access). The unrestricted demo stays at /impact/tenproject with no param.
    const wanted = new URLSearchParams(window.location.search).get('role')
    if (wanted && ROLES.some(r => r.id === wanted)) {
      setRole(wanted as Role)
      setLockedRole(wanted as Role)
    }
  }, [])

  const navRoles = lockedRole ? ROLES.filter(r => r.id === lockedRole) : ROLES

  // ── Role picker ──
  if (!role) {
    return (
      <div className={contentClass} style={{ minHeight: '100vh', background: mainBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {darkStyle}
        <div style={{ maxWidth: 680, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tenproject_logo.png" alt="Ten Project" style={{ width: 190, height: 'auto', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, letterSpacing: 2 }}>PORTAL</div>
            <div style={{ color: '#6B6560', fontSize: 13.5, marginTop: 6 }}>
              One platform · five roles. Pick a view to explore.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {ROLES.map(r => {
              const Icon = r.icon
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{ background: '#fff', border: '1px solid #E7E2DC', borderRadius: 14, padding: 18, cursor: 'pointer', textAlign: 'left', transition: 'transform .1s' }}
                >
                  <Icon size={22} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 14.5, fontWeight: 900, color: TP_DARK, marginTop: 8 }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>{r.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Portal shell ──
  const meta = ROLE_TITLES[role]

  // Mobile: slim top bar instead of the sidebar; parent app renders full-bleed.
  if (isMobile) {
    return (
      <div style={{ minHeight: '100dvh', background: TP_PAPER, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 52, background: TP_BLACK, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ height: 24, width: 'auto' }} />
          {!lockedRole ? (
            <div style={{ flex: 1, display: 'flex', gap: 6, overflowX: 'auto' }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  style={{ background: role === r.id ? TP_RED : '#22222A', color: role === r.id ? '#fff' : '#C9C4BE', border: 'none', borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, color: '#C9C4BE', fontSize: 12, fontWeight: 700 }}>{ROLES.find(r => r.id === lockedRole)?.label}</div>
          )}
          <button
            onClick={signOutImpact}
            aria-label="Exit demo"
            style={{ background: 'none', color: '#8A847E', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
        {darkStyle}
        {role === 'parent' ? (
          <div className={contentClass}><ParentApp fullScreen /></div>
        ) : (
          <main className={`tp-resp ${contentClass ?? ''}`} style={{ flex: 1, minWidth: 0, padding: '14px 12px 30px', background: mainBg }}>
            {/* Mobile responsiveness: flatten fixed two-column grids, make the
                7-day calendar a swipeable strip, let wide tables scroll.
                Scoped to .tp-resp so desktop keeps its exact layout. */}
            <style>{`
              .tp-resp [style*="1.4fr"], .tp-resp [style*="1.3fr"], .tp-resp [style*="1.2fr"],
              .tp-resp [style*="grid-template-columns: 1fr 1fr"], .tp-resp [style*="grid-template-columns:1fr 1fr"] {
                grid-template-columns: 1fr !important;
              }
              .tp-resp [style*="repeat(7"] {
                display: flex !important;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: 6px;
              }
              .tp-resp [style*="repeat(7"] > div { min-width: 132px; flex-shrink: 0; }
              .tp-resp table { display: block; overflow-x: auto; }
            `}</style>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: TP_DARK }}>{meta.title}</div>
              <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{meta.sub}</div>
            </div>
            {role === 'hq' && <HQView />}
            {role === 'school' && <SchoolView />}
            {role === 'coach' && <CoachView />}
            {role === 'tenor' && <TenorView />}
          </main>
        )}
      </div>
    )
  }

  // Grouped, icon-led sidebar nav per role (tennis-coach style)
  type NavIcon = React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  const NAV_GROUPS: { group: string; items: { id: string; label: string; icon: NavIcon }[] }[] =
    role === 'hq' ? [
      { group: 'PROGRAMME', items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'insights', label: 'Insights', icon: BarChart3 },
      ] },
      { group: 'NETWORK', items: [
        { id: 'schools', label: 'Schools', icon: School },
        { id: 'venues', label: 'Venues', icon: MapPin },
      ] },
      { group: 'TEAM', items: [
        { id: 'coaches', label: 'Coaches', icon: ShieldCheck },
        { id: 'tenors', label: 'TENORs', icon: Users },
      ] },
      { group: 'ENGAGE', items: [
        { id: 'comms', label: 'Communications', icon: Send },
        { id: 'social', label: 'Social', icon: Share2 },
      ] },
      { group: 'OPERATIONS', items: [
        { id: 'equipment', label: 'Equipment & Kit', icon: Package },
        { id: 'network', label: 'Sport Network', icon: Landmark },
        { id: 'settings', label: 'Settings', icon: Settings },
      ] },
    ]
    : role === 'school' ? [
      { group: 'YOUR SCHOOL', items: [
        { id: 'programme', label: 'Our programme', icon: BarChart3 },
        { id: 'insights', label: 'Insights', icon: TrendingUp },
        { id: 'fundraising', label: 'Fundraising', icon: PoundSterling },
      ] },
    ]
    : role === 'coach' ? [
      { group: 'COACHING', items: [
        { id: 'stats', label: 'My stats', icon: BarChart3 },
        { id: 'today', label: 'Schools', icon: School },
        { id: 'weekend', label: 'Weekend sessions', icon: CalendarDays },
        { id: 'resources', label: 'Resources', icon: BookOpen },
      ] },
    ]
    : role === 'tenor' ? [
      { group: 'VOLUNTEERING', items: [
        { id: 'session', label: 'Today’s session', icon: ClipboardList },
        { id: 'resources', label: 'Resources', icon: BookOpen },
      ] },
    ]
    : [
      { group: 'FAMILY', items: [{ id: 'app', label: 'The family app', icon: Smartphone }] },
    ]
  const activeSection =
    role === 'hq' ? hqSection : role === 'school' ? schoolSection : role === 'coach' ? coachSection : role === 'tenor' ? tenorSection : 'app'
  function setSection(id: string) {
    if (role === 'hq') setHqSection(id as HqTab)
    else if (role === 'school') setSchoolSection(id as SchoolSection)
    else if (role === 'coach') setCoachSection(id as CoachSection)
    else if (role === 'tenor') setTenorSection(id as TenorSection)
  }
  const expanded = pinned || railHover
  const sidebarWidth = expanded ? 232 : 64

  return (
    <div style={{ zoom: 0.9, minHeight: 'calc(100vh / 0.9)', background: TP_PAPER, display: 'flex' }}>
      {/* Sidebar — Ten Project black, floating rail with pin, grouped icon menu */}
      {!pinned && <div style={{ width: 64, flexShrink: 0 }} />}
      <aside
        onMouseEnter={() => setRailHover(true)}
        onMouseLeave={() => setRailHover(false)}
        style={{
          width: sidebarWidth, transition: 'width .16s ease', background: TP_BLACK,
          display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 0, overflow: 'hidden',
          ...(pinned
            ? { position: 'sticky' as const, top: 0, height: 'calc(100vh / 0.9)' }
            : { position: 'fixed' as const, left: 0, top: 0, height: 'calc(100vh / 0.9)', zIndex: 50, boxShadow: expanded ? '10px 0 34px #00000066' : 'none' }),
        }}
      >
        <div style={{ padding: expanded ? '18px 16px 12px' : '18px 0 12px', display: 'flex', alignItems: 'flex-start', justifyContent: expanded ? 'space-between' : 'center', gap: 8 }}>
          {expanded ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ width: 108, height: 'auto', display: 'block' }} />
              <div style={{ fontSize: 9.5, color: '#8A847E', marginTop: 6, letterSpacing: 1 }}>PORTAL · DEMO</div>
              {session.userName && (
                <div style={{ fontSize: 10, color: '#C9C4BE', marginTop: 4, maxWidth: 108, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.userName}</div>
              )}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/tenproject-favicon-64.png" alt="TP" style={{ width: 30, height: 30, borderRadius: 7 }} />
          )}
          {expanded && (
            <button onClick={togglePin} title={pinned ? 'Unpin — sidebar floats and expands on hover' : 'Pin sidebar open'}
              style={{ background: pinned ? '#22222A' : TP_RED, color: pinned ? '#8A847E' : '#fff', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', display: 'inline-flex' }}>
              {pinned ? <Pin size={13} /> : <PinOff size={13} />}
            </button>
          )}
        </div>
        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: expanded ? '2px 10px' : '2px 8px' }}>
          {NAV_GROUPS.map(g => (
            <div key={g.group} style={{ marginBottom: 8 }}>
              {expanded && (
                <div style={{ fontSize: 9, fontWeight: 800, color: '#6B6560', letterSpacing: 1.4, padding: '6px 12px 4px' }}>{g.group}</div>
              )}
              {g.items.map(s => {
                const Icon = s.icon
                const active = activeSection === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    title={s.label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', gap: 10, width: '100%', background: active ? TP_RED : 'none', color: active ? '#fff' : '#C9C4BE', border: 'none', borderRadius: 9, padding: expanded ? '8px 12px' : '9px 0', fontSize: 12.5, fontWeight: active ? 800 : 600, cursor: 'pointer', marginBottom: 2, textAlign: 'left', whiteSpace: 'nowrap' }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    {expanded && s.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        {/* Switch view */}
        {expanded && !lockedRole && (
          <div style={{ padding: '10px 10px 4px', borderTop: '1px solid #33333B' }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#6B6560', letterSpacing: 1.2, padding: '2px 12px 6px' }}>SWITCH VIEW</div>
            {navRoles.map(r => {
              const Icon = r.icon
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', background: active ? '#22222A' : 'none', color: active ? '#fff' : '#8A847E', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: active ? 800 : 600, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}
                >
                  <Icon size={14} style={{ color: active ? TP_RED : undefined }} /> {r.label} {active && <span style={{ marginLeft: 'auto', color: TP_RED }}>✓</span>}
                </button>
              )
            })}
          </div>
        )}
        {expanded && (
        <div style={{ padding: 12 }}>
          <button
            onClick={signOutImpact}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', color: '#8A847E', border: '1px solid #33333B', borderRadius: 9, padding: '9px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <LogOut size={14} /> Exit demo
          </button>
        </div>
        )}
      </aside>

      {/* Main */}
      {darkStyle}
      <main className={contentClass} style={{ flex: 1, minWidth: 0, padding: '22px 26px 40px', background: mainBg }}>
        {(() => { const hm = role === 'parent' ? meta : headerFor(role, activeSection); return (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 21, fontWeight: 900, color: TP_DARK }}>{hm.title}</div>
          <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 3 }}>{hm.sub}</div>
        </div>
        ) })()}
        {role === 'hq' && <HQView section={hqSection} onSectionChange={setHqSection} />}
        {role === 'school' && <SchoolView section={schoolSection} />}
        {role === 'parent' && <ParentApp />}
        {role === 'coach' && <CoachView section={coachSection} />}
        {role === 'tenor' && <TenorView section={tenorSection} />}
      </main>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
// SportsDemoGate fronts the portal exactly as it does for the other sports
// (see src/app/nonleague/[slug]/page.tsx): email → OTP → the portal below.
export default function ImpactPortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="impact"
      defaultClubName="Ten Project"
      defaultSlug={slug}
      accentColor="#D7262C"
      accentColorLight="#F87171"
      sportEmoji="🏫"
      sportLabel="Lumio Impact"
      roles={IMPACT_ROLES}
      // Straight from OTP into the portal. The wizard's profile step renders a
      // six-attribute FIFA-style player card (SPORT_STATS), which is the wrong
      // artefact for a programme platform — and with no 'impact' entry it would
      // fall back to football's. The portal has its own role picker anyway.
      skipWizard
    >
      {(session) => <ImpactPortalInner session={session} />}
    </SportsDemoGate>
  )
}
