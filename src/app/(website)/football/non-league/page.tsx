'use client'

import Link from 'next/link'
import { CrossDiscoveryStrip } from '../components/CrossDiscoveryStrip'

const TEAL = '#14B8A6'
const NAVY = '#1B3A6B'
const GOLD = '#F1C40F'
const BG = '#07080F'
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const PILLS = ['National League', 'Steps 1–6', 'Volunteer-friendly', 'FA-compliant', 'Works offline']

const FEATURES = [
  { icon: '📅', title: 'Fixtures, Results & FA Return', desc: 'Pull your league fixtures, log results in one tap on matchday, and auto-generate the FA / league return email. No spreadsheets. No chasing the secretary.' },
  { icon: '👥', title: 'Squad & Registration', desc: 'Player registration, contract terms, suspensions, and loan in/out tracking. Export your registered squad sheet to the league secretary in one click.' },
  { icon: '💰', title: 'Matchday Finance', desc: 'Gate receipts, bar takings, merchandise, sponsor commitments. Simple P&L that works for volunteer treasurers — no accounting degree required.' },
  { icon: '⚽', title: 'Training Load (Light)', desc: 'Manual RPE or GPS CSV upload. Acute / chronic load flags without needing a £500/year vest subscription. Works with a phone and a Google Sheet.' },
  { icon: '📣', title: 'Comms & Socials', desc: 'Team announcements to WhatsApp, an email roll-out for season-ticket holders, and pre-match social posts drafted in seconds by the AI.' },
  { icon: '🏟️', title: 'Volunteers & Roster', desc: 'Matchday volunteer roster — bar staff, turnstile, programmes, stewards. One click pings the group chat when gaps appear. No more 6-text chases on a Saturday morning.' },
]

export default function FootballNonLeaguePage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${TEAL}33, transparent 50%), radial-gradient(circle at 80% 60%, ${NAVY}55, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO FOOTBALL · NON-LEAGUE
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 980, marginLeft: 'auto', marginRight: 'auto' }}>
            Your club&rsquo;s whole season — on one login.
          </h1>
          <p style={{ fontSize: 19, color: MUTED, lineHeight: 1.6, maxWidth: 820, margin: '0 auto 40px' }}>
            Built for National League, Steps 1&ndash;6, and everything in between. Squad registration, matchday finance, volunteer roster, fixtures &amp; results, FA returns, and AI-drafted social posts. Volunteer-run clubs run Lumio; it fits the way you already work.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/nonleague/harfield-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
              Try the demo →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(20,184,166,0.18)', border: `1px solid ${TEAL}55`, color: GOLD, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built around how a volunteer-run club actually works.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            The six things every non-league club chases every week. All in one place, all tappable from a phone, all designed for the people who show up early and stay late.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Your secretary will thank you.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Try the Harfield FC live demo — a fictional Vanarama South club with a full season loaded.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/nonleague/harfield-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
              Try the demo →
            </Link>
          </div>
        </div>
      </section>

      <CrossDiscoveryStrip tier="non-league" />
    </div>
  )
}
