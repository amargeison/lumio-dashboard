'use client'

// ─── Coach portal — EMPTY / ONBOARDING state ─────────────────────────────────
// Rendered when a head coach's academy has nothing in it yet. Three things, in
// the order a new coach needs them:
//
//   1. the welcome, with the two ways in — the guided setup, or their own files;
//   2. the Getting started checklist (the same one the full dashboard shows,
//      read from their data) beside the bulk import, so "add your players" and
//      "drop in the spreadsheet you already have" sit next to each other;
//   3. a card for every module this academy actually has switched on.
//
// It used to be a grid of eight cards, one of which offered to "Connect Lumio
// GPS Tracker" — hardware we do not sell — and none of which let a coach bring
// in the records they already keep.

import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { GettingStarted, type StartStep } from './GettingStarted'
import { CoachImport } from './CoachImport'
import { getSettings } from '../_lib/settings-store'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Each setup card deep-links to the nav id that owns that data. Cards for a
// module the academy has switched off (or cannot see) are left out.
const SETUP_CARDS: { id: string; title: string; desc: string }[] = [
  { id: 'roster',      title: 'Players',            desc: 'Import or add the players you coach' },
  { id: 'staff',       title: 'Coaches & staff',    desc: 'Invite your coaches and build the team directory' },
  { id: 'venues',      title: 'Courts & venues',    desc: 'Your home court, courts and opening hours' },
  { id: 'calendar',    title: 'Booking calendar',   desc: 'Put lessons and groups in the diary' },
  { id: 'planner',     title: 'Session Planner',    desc: 'AI plans and run-sheets from each booking' },
  { id: 'lessons',     title: 'Lesson summaries',   desc: 'Record a lesson — the AI writes it up' },
  { id: 'belts',       title: 'Racket Progression', desc: 'Nine levels, a certificate at every one' },
  { id: 'gpsheatmaps', title: 'Effort & Rewards',   desc: 'Effort, XP and a squad leaderboard' },
  { id: 'videoaudio',  title: 'Video & audio',      desc: 'Clips and highlights for each player' },
  { id: 'camps',       title: 'Training camps',     desc: 'Day camps and tours, drafted by AI' },
  { id: 'messages',    title: 'Messages',           desc: 'Reach players and parents in their app' },
  { id: 'payments',    title: 'Payments & packs',   desc: 'Packages, invoices and who has paid' },
  { id: 'equipment',   title: 'Equipment & kit',    desc: 'Balls, rackets and what needs ordering' },
  { id: 'resources',   title: 'Resource Centre',    desc: 'Your own drills, links and files' },
  { id: 'settings',    title: 'Your branding',      desc: 'Logo, colours and your own sign-in page' },
]

export function EmptyCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard, steps, canNavigate, onImported }: Common & {
  clubName: string
  onNavigate: (id: string) => void
  onStartWizard?: () => void
  /** The Getting started checklist, worked out by the dashboard from the coach's data. */
  steps?: StartStep[]
  /** Whether a module is available to this academy (switched on, and allowed for this role). */
  canNavigate?: (id: string) => boolean
  /** Called after a bulk import saves records, so the dashboard can reload. */
  onImported?: () => void
}) {
  const connect = () => (onStartWizard ? onStartWizard() : onNavigate('roster'))
  const toImport = () => document.getElementById('lumio-empty-import')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const cards = SETUP_CARDS.filter(c => !canNavigate || canNavigate(c.id))
  const showSteps = !!steps?.length && getSettings().gettingStarted !== false
  const btn = (primary: boolean) => ({
    appearance: 'none' as const, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 11,
    fontSize: 14, fontWeight: 700, fontFamily: FONT,
    ...(primary ? { border: 0, background: accent.hex, color: T.btnText } : { border: `1px solid ${accent.border}`, background: T.panel, color: accent.hex }),
  })

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Welcome hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${accent.dim}, ${T.panel})`, border: `1px solid ${accent.border}`, borderRadius: Math.max(density.radius, 16), padding: density.pad + 8 }}>
        <div style={{ position: 'relative', maxWidth: 720 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Welcome to Lumio</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{clubName}</h1>
          <p style={{ margin: '10px 0 18px', fontSize: 14, color: T.text2, lineHeight: 1.6 }}>
            Your portal is ready. Work through the checklist below, or drop in the spreadsheets you already keep — players, coaches, camps, payments — and every page fills in with your academy&apos;s own information.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={connect} style={btn(true)}>
              <Icon name="grid" size={15} stroke={1.9} /> Set up your academy
            </button>
            <button onClick={toImport} style={btn(false)}>
              <Icon name="note" size={15} stroke={1.9} /> Import your data
            </button>
          </div>
        </div>
      </div>

      {/* Checklist beside the bulk import */}
      <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: showSteps ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: density.gap, alignItems: 'start' }}>
        {showSteps && <GettingStarted T={T} accent={accent} steps={steps!} onNavigate={onNavigate} />}
        <div id="lumio-empty-import" style={{ scrollMarginTop: 16 }}>
          <CoachImport T={T} accent={accent} onImported={onImported} />
        </div>
      </div>

      {/* A card for every module this academy has */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '4px 0 12px' }}>Set up your academy</div>
        <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: density.gap }}>
          {cards.map(c => (
            <button key={c.id} onClick={() => onNavigate(c.id)}
              style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color .15s, background .15s', fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent.border; e.currentTarget.style.background = accent.dim }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.panel }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.title}</span>
                <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, flexShrink: 0 }}>
                  <Icon name="plus" size={14} stroke={2} style={{ color: accent.hex }} />
                </span>
              </div>
              <span style={{ fontSize: 12, color: T.text3, lineHeight: 1.45 }}>{c.desc}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent.hex, marginTop: 2 }}>{c.id === 'settings' ? 'Set it up →' : 'Add data →'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Generic empty state for non-dashboard sections in a fresh portal.
export function EmptyModule({ T, accent, density, title, onNavigate }: Common & { title: string; onNavigate: (id: string) => void }) {
  return (
    <div style={{ fontFamily: FONT, display: 'grid', placeItems: 'center', minHeight: '60vh', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420, background: T.panel, border: `1px dashed ${T.border}`, borderRadius: Math.max(density.radius, 16), padding: '36px 28px' }}>
        <span style={{ width: 48, height: 48, margin: '0 auto', borderRadius: 12, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}` }}>
          <Icon name="grid" size={22} stroke={1.6} style={{ color: accent.hex }} />
        </span>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 14 }}>{title} is ready and empty</div>
        <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, marginTop: 6 }}>
          Connect your data or add your first records and this section fills with your academy&apos;s live information.
        </p>
        <button onClick={() => onNavigate('dashboard')}
          style={{ appearance: 'none', border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, fontFamily: FONT, marginTop: 16 }}>
          <Icon name="home" size={14} stroke={1.9} /> Back to setup
        </button>
      </div>
    </div>
  )
}
