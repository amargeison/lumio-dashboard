'use client'

import { use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SportsDemoGate } from '@/components/sports-demo'
import { CRICKET_ROLES } from '../page'
import {
  THEMES, ACCENTS, DENSITY, FONT, FONT_MONO, getGreeting,
  type ThemeKey, type AccentKey, type DensityKey, type SidebarKey,
} from './_lib/theme'
import type { Fixture } from './_lib/data'
import { Sidebar, Topbar } from './_components/Shell'
import {
  HeroToday, TodaySchedule, StatTiles, AIBrief, Inbox, Squad,
  Fixtures, Perf, Recents, Season,
} from './_components/Modules'
import { GPSHeatmapsView } from './_components/GPSHeatmapsView'
import {
  CommandPalette, AskLumio, FixtureDrawer, Toast, useToast, useKey,
} from './_components/Overlays'
import { MatchBriefPanel } from './_components/MatchBriefPanel'
import { Icon } from './_components/Icon'

// ──────────────────────────────────────────────────────────────────────
// Cricket portal redesign — Director dashboard.
//
// Greenfield route at /cricket/<slug>/v2 — runs alongside the live
// /cricket/<slug> while the redesign is in progress. When it reaches
// parity + sign-off, the live route can be swapped to point at this
// implementation in a single commit (rename folder).
// ──────────────────────────────────────────────────────────────────────

const DEFAULTS: { theme: ThemeKey; accent: AccentKey; density: DensityKey; sidebar: SidebarKey } = {
  theme:    'dark',
  accent:   'oxford',
  density:  'regular',
  sidebar:  'full',
}

type DashTab = 'gettingstarted' | 'today' | 'quickwins' | 'dailytasks' | 'insights' | 'dontmiss' | 'team'

const DASH_TABS: { id: DashTab; label: string; icon: string; badge?: number }[] = [
  { id: 'gettingstarted', label: 'Getting Started', icon: 'sparkles', badge: 3 },
  { id: 'today',          label: 'Today',           icon: 'home' },
  { id: 'quickwins',      label: 'Quick Wins',      icon: 'lightning' },
  { id: 'dailytasks',     label: 'Daily Tasks',     icon: 'check' },
  { id: 'insights',       label: 'Insights',        icon: 'bars' },
  { id: 'dontmiss',       label: "Don't Miss",      icon: 'flag' },
  { id: 'team',           label: 'Team',            icon: 'people' },
]

// Quick Actions — desaturated. Each opens a corresponding section or shows
// a toast in this prototype. AI badge is a small grey pill, not a power-up
// indicator.
type QA = { id: string; label: string; icon: string; ai?: boolean; section?: string; toast?: string }
const QUICK_ACTIONS: QA[] = [
  { id: 'team-selection', label: 'Team Selection',   icon: 'people',     ai: true, toast: 'Team Selection AI · drafting XI…' },
  { id: 'toss-advisor',   label: 'Toss Advisor',     icon: 'cloud',      ai: true, toast: 'Toss Advisor · running model…' },
  { id: 'match-prep',     label: 'Match Prep',       icon: 'crosshair',  ai: true, toast: 'Match Prep AI · building tactical brief…' },
  { id: 'innings-brief',  label: 'Innings Brief',    icon: 'sparkles',   ai: true, toast: 'Innings Brief · session in progress' },
  { id: 'send-message',   label: 'Send Message',     icon: 'mic',        toast: 'Send message · who to?' },
  { id: 'book-nets',      label: 'Book Nets',        icon: 'calendar',   toast: 'Book nets · pick a slot' },
  { id: 'log-injury',     label: 'Log Injury',       icon: 'medical',    toast: 'Injury logger opened' },
  { id: 'agent-brief',    label: 'Agent Brief',      icon: 'briefcase',  ai: true, toast: 'Agent Brief AI · drafting…' },
]

function CricketV2Inner() {
  const [active, setActive]           = useState('dashboard')
  const [dashTab, setDashTab]         = useState<DashTab>('today')
  const [cmdOpen, setCmdOpen]         = useState(false)
  const [askOpen, setAskOpen]         = useState(false)
  const [briefOpen, setBriefOpen]     = useState(false)
  const [openFixture, setOpenFixture] = useState<Fixture | null>(null)
  const [toast, showToast]            = useToast()

  const T       = THEMES[DEFAULTS.theme]
  const accent  = ACCENTS[DEFAULTS.accent]
  const density = DENSITY[DEFAULTS.density]
  const greeting = getGreeting('matchday')

  useEffect(() => {
    document.body.style.background = T.bg
    return () => { document.body.style.background = '' }
  }, [T.bg])

  // Global ⌘K toggles the command palette. esc handlers live inside each
  // overlay so they only fire when that overlay is open.
  useKey('cmdk', () => setCmdOpen(o => !o))

  return (
    <>
      {/* Animations + tabular-nums utility — scoped to the v2 surface so
          they don't leak into the live cricket portal still on /cricket/<slug>. */}
      <style jsx global>{`
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes cricketV2PulseDim   { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
        @keyframes cricketV2FadeUp     { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideLeft  { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideUp    { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translate(-50%, 0) } }
      `}</style>

      <div style={{ width: '100vw', height: '100vh', background: T.bg, color: T.text, fontFamily: FONT, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          T={T} accent={accent} dark={DEFAULTS.theme === 'dark'}
          style={DEFAULTS.sidebar}
          active={active} onNav={setActive}
          onSearch={() => setCmdOpen(true)}
        />
        <main style={{ flex: 1, padding: `${density.gap + 4}px ${density.gap + 8}px`, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <Topbar T={T} accent={accent} onCmdK={() => setCmdOpen(true)} onAsk={() => setAskOpen(true)} />

          {active === 'gps-heatmaps' ? (
            <GPSHeatmapsView T={T} accent={accent} density={density} />
          ) : (
            <>
              <DashboardTabs T={T} accent={accent} value={dashTab} onChange={setDashTab} />
              <QuickActionsRow T={T} accent={accent} actions={QUICK_ACTIONS} onPick={(qa) => {
                if (qa.section) setActive(qa.section)
                if (qa.toast) showToast(qa.toast)
              }} />

              {dashTab === 'today' ? (
                <DashboardGrid
                  T={T} accent={accent} density={density} greeting={greeting}
                  onConfirm={() => showToast('Starting XI confirmed · squad notified')}
                  onAsk={() => setAskOpen(true)}
                  onMatchBrief={() => setBriefOpen(true)}
                  onPickFixture={setOpenFixture}
                />
              ) : (
                <TabPlaceholder T={T} accent={accent} density={density} tab={dashTab as Exclude<DashTab, 'today'>} />
              )}
            </>
          )}

          {/* Footer hints */}
          <div style={{ padding: '8px 0 14px', display: 'flex', gap: 14, fontSize: 10.5, color: T.text3, justifyContent: 'center' }}>
            <span>⌘K command palette</span>
            <span>·</span>
            <span>esc close overlays</span>
            <span>·</span>
            <span>↑↓ navigate</span>
          </div>
        </main>

        <CommandPalette T={T} accent={accent} open={cmdOpen} onClose={() => setCmdOpen(false)} onAskLumio={() => { setCmdOpen(false); setAskOpen(true) }} />
        <AskLumio       T={T} accent={accent} open={askOpen} onClose={() => setAskOpen(false)} />
        <FixtureDrawer  T={T} accent={accent} fixture={openFixture} onClose={() => setOpenFixture(null)} />
        <MatchBriefPanel T={T} accent={accent} open={briefOpen} onClose={() => setBriefOpen(false)} />
        <Toast          T={T} accent={accent} msg={toast} />
      </div>
    </>
  )
}

// ─── Tab bar ────────────────────────────────────────────────────────────

function DashboardTabs({
  T, accent, value, onChange,
}: {
  T: typeof THEMES['dark']; accent: typeof ACCENTS['oxford']
  value: DashTab; onChange: (v: DashTab) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      borderBottom: `1px solid ${T.border}`, overflowX: 'auto',
    }}>
      {DASH_TABS.map(t => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              appearance: 'none', border: 0, background: 'transparent',
              padding: '10px 14px',
              fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
              color: active ? T.text : T.text3,
              borderBottom: `2px solid ${active ? accent.hex : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              transition: 'color .12s, border-color .12s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text2 }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.text3 }}
          >
            <Icon name={t.icon} size={12} stroke={1.6} />
            {t.label}
            {t.badge !== undefined && (
              <span className="tnum" style={{
                fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                padding: '1px 6px', borderRadius: 9,
                background: T.hover, color: T.text3,
                border: `1px solid ${T.border}`,
              }}>{t.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Quick actions row ─────────────────────────────────────────────────
// Desaturated styling — quiet by default, accent-bordered on hover.

function QuickActionsRow({
  T, accent, actions, onPick,
}: {
  T: typeof THEMES['dark']; accent: typeof ACCENTS['oxford']
  actions: QA[]; onPick: (qa: QA) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto',
      padding: '4px 0',
    }}>
      {actions.map(a => (
        <QABtn key={a.id} T={T} accent={accent} qa={a} onClick={() => onPick(a)} />
      ))}
    </div>
  )
}

function QABtn({
  T, accent, qa, onClick,
}: {
  T: typeof THEMES['dark']; accent: typeof ACCENTS['oxford']
  qa: QA; onClick: () => void
}) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        appearance: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        background: '#1A1D23',
        border: `1px solid ${h ? accent.border : '#2D3139'}`,
        color: h ? T.text : T.text2,
        padding: '7px 12px', borderRadius: 6,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: FONT, fontSize: 11.5, fontWeight: 500,
        transition: 'border-color .12s, color .12s',
      }}
    >
      <Icon name={qa.icon} size={12} stroke={1.6} style={{ color: h ? accent.hex : T.text3 }} />
      {qa.label}
      {qa.ai && (
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
          padding: '1px 5px', borderRadius: 3,
          background: T.hover, color: T.text3, letterSpacing: '0.04em',
        }}>AI</span>
      )}
    </button>
  )
}

// ─── Dashboard grid (Today tab) ─────────────────────────────────────────

function DashboardGrid({
  T, accent, density, greeting, onConfirm, onAsk, onMatchBrief, onPickFixture,
}: {
  T: typeof THEMES['dark']; accent: typeof ACCENTS['oxford']; density: typeof DENSITY['regular']
  greeting: string
  onConfirm: () => void; onAsk: () => void; onMatchBrief: () => void
  onPickFixture: (f: Fixture) => void
}) {
  return (
    <>
      {/* Row 1 — Hero + Today schedule (right column starts here) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        <HeroToday
          T={T} accent={accent} density={density} greeting={greeting}
          onConfirm={onConfirm}
          onAsk={onAsk}
          onMatchBrief={onMatchBrief}
        />
        <TodaySchedule T={T} accent={accent} density={density} />
      </div>

      {/* Row 2 — Stat tiles */}
      <StatTiles T={T} accent={accent} density={density} />

      {/* Row 3 — Main + Right rail
          Right rail (4 cols) holds: Squad → AI Morning Summary → Performance Intelligence
          Main (8 cols) holds: AIBrief is moved to right rail; we keep Inbox + Fixtures + Recents on the left. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 8fr) minmax(0, 4fr)', gap: density.gap, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap, minWidth: 0 }}>
          <Inbox T={T} accent={accent} density={density} />
          <Fixtures T={T} accent={accent} density={density} onPick={onPickFixture} />
          <Recents T={T} accent={accent} density={density} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap, minWidth: 0 }}>
          <Squad T={T} accent={accent} density={density} />
          <AIBrief T={T} accent={accent} density={density} onAsk={onAsk} />
          <Perf T={T} accent={accent} density={density} />
          <Season T={T} accent={accent} density={density} />
        </div>
      </div>
    </>
  )
}

// ─── Tab placeholder for non-Today tabs ────────────────────────────────
// Lightweight content for each tab — the full tab content is being ported
// across separately. These are real demo content, not blanks.

function TabPlaceholder({
  T, accent, density, tab,
}: {
  T: typeof THEMES['dark']; accent: typeof ACCENTS['oxford']
  density: typeof DENSITY['regular']; tab: Exclude<DashTab, 'today'>
}) {
  const content = TAB_CONTENT[tab]
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: density.radius, padding: density.pad + 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: '-0.005em' }}>
          {content.title}
        </h2>
        <span style={{ fontSize: 11, color: T.text3 }}>{content.subtitle}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px',
            background: T.panel2, borderRadius: 8,
            border: `1px solid ${T.border}`,
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              color: accent.hex, minWidth: 22, marginTop: 2,
            }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>{item.body}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const TAB_CONTENT: Record<Exclude<DashTab, 'today'>, { title: string; subtitle: string; items: { title: string; body: string }[] }> = {
  gettingstarted: {
    title: 'Getting Started',
    subtitle: 'Set up the demo · 3 left',
    items: [
      { title: 'Connect your GPS provider',     body: 'Johan Sports — link your fleet to start streaming session data, or upload a CSV from any provider to backfill the dashboard.' },
      { title: 'Upload your fixture list',      body: 'Pull the season fixtures from the County Cricket feed — one click.' },
      { title: 'Invite your coaching staff',    body: 'Add coach, physio, analyst, manager — each gets the right slice of the dashboard.' },
    ],
  },
  quickwins: {
    title: 'Quick Wins',
    subtitle: 'Easy moves with high impact this week',
    items: [
      { title: 'Renew Patel before the offer expires', body: 'Two-year extension drafted, sits in Agent inbox. Sign-off needed by Wed.' },
      { title: 'Schedule the bowling-load review',     body: 'Dawson is at 1.62 ACWR — flag for medical and adjust nets plan.' },
      { title: 'Confirm the U17 transport',            body: 'Glamorgan away — second driver still needed for Saturday 06:00.' },
      { title: 'Reply to the Telegraph preview',        body: '200 words on Loxwood + Patel form. Deadline 16:00 Friday.' },
    ],
  },
  dailytasks: {
    title: 'Daily Tasks',
    subtitle: 'Today · Sat 26 Apr',
    items: [
      { title: 'Confirm starting XI by 09:30',         body: 'Hartley fitness call needs to be in before squad announcement.' },
      { title: 'Brief captain on Loxwood middle order', body: '5 mins pre-toss — middle order avg 24.3, target 4-5-6.' },
      { title: 'Sponsor matchday post (Crownmark)',     body: 'Bat-photo obligation — generate via Sponsor Post AI before lunch.' },
      { title: 'Press scrum 17:30',                     body: 'Fairweather + Caldwell on the Q-list — review talking points 17:00.' },
    ],
  },
  insights: {
    title: 'Insights',
    subtitle: 'Patterns worth your attention',
    items: [
      { title: 'Death over economy 9.2',                body: 'Above league average 8.1 — pencil in a yorker drill block this week.' },
      { title: 'Top order avg 42.1 last 5',             body: 'Patel + Webb leading, season high. Lock the order before the Hundred window.' },
      { title: 'Catches +24% across U16s',              body: 'Six-week trend after the new fielding curriculum — worth presenting at the next academy review.' },
      { title: 'Crowd numbers +18% YoY',                body: 'Membership renewal flagging two long-term lapses though — chase before the gate.' },
    ],
  },
  dontmiss: {
    title: "Don't Miss",
    subtitle: 'Items that will surface again if ignored',
    items: [
      { title: 'Hartley fitness call · by 09:30',     body: 'Final 12th-man decision goes to printer at 09:35.' },
      { title: 'Patel contract draft · by Wed',       body: 'Agent waiting on response to two-year terms.' },
      { title: 'Board pack · Tue 7pm',                body: 'Quarterly review — performance summary expected from you.' },
      { title: 'Visa renewal · Mason · 30-day window', body: 'Hundred-eligible overseas player — Home Office paperwork live.' },
    ],
  },
  team: {
    title: 'Team',
    subtitle: 'Who is doing what today',
    items: [
      { title: 'Caldwell · Head of Selection',         body: 'In with selectors — XI announcement after Hartley fitness call.' },
      { title: 'Mehta · Bowling Coach',                body: 'Yorker drill plan posted, running the Friday session 09:00–09:45.' },
      { title: 'Whitlock · Director (you)',            body: 'Toss 10:30 · press 17:30 · board prep evening.' },
      { title: 'Patel · 1st XI Captain',               body: 'Pre-match routine, leading toss with the umpires at 10:25.' },
    ],
  },
}

export default function CricketPortalV2Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="cricket"
      defaultClubName="Oakridge CC"
      defaultSlug={slug}
      accentColor="#3A6CA8"
      accentColorLight="#5A8CC8"
      sportEmoji="🏏"
      sportLabel="Lumio Cricket"
      roles={CRICKET_ROLES}
    >
      {() => <CricketV2Inner />}
    </SportsDemoGate>
  )
}
