'use client'

// ─── Coach portal — EMPTY / ONBOARDING state ─────────────────────────────────
// Rendered when the portal is for a brand-new academy (any slug that isn't a
// known demo slug). Mirrors the Women's FC empty portal: a warm welcome hero
// with a "Connect your data" prompt, then a "Set up your academy" grid whose
// cards deep-link into each section to add the first records. No sample data.

import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Each setup card deep-links to the nav id that owns that data.
const SETUP_CARDS: { id: string; icon: string; title: string; desc: string }[] = [
  { id: 'roster',      icon: 'people',    title: 'Players',            desc: 'Import or add the players you coach' },
  { id: 'staff',       icon: 'people',    title: 'Coaches & staff',    desc: 'Build your coaching team directory' },
  { id: 'calendar',    icon: 'calendar',  title: 'Booking calendar',   desc: 'Add your courts, hours and bookings' },
  { id: 'belts',       icon: 'trophy',    title: 'Racket Progression', desc: 'Set up the reward pathway per player' },
  { id: 'gpsheatmaps', icon: 'crosshair', title: 'GPS & video',        desc: 'Connect Lumio GPS Tracker & Vision' },
  { id: 'lessons',     icon: 'note',      title: 'Lesson summaries',   desc: 'Log sessions and AI reviews' },
  { id: 'camps',       icon: 'flag',      title: 'Training camps',     desc: 'Plan day camps and tours' },
  { id: 'payments',    icon: 'pound',     title: 'Payments',           desc: 'Packages, invoices and renewals' },
]

export function EmptyCoachDashboard({ T, accent, density, clubName, onNavigate }: Common & { clubName: string; onNavigate: (id: string) => void }) {
  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Welcome hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${accent.dim}, ${T.panel})`, border: `1px solid ${accent.border}`, borderRadius: Math.max(density.radius, 16), padding: density.pad + 8 }}>
        <div style={{ position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 680 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Welcome to Lumio</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{clubName}</h1>
          <p style={{ margin: '10px 0 18px', fontSize: 14, color: T.text2, lineHeight: 1.6 }}>
            Your portal is ready and empty. Connect your data — or let our onboarding set it up for you — and every section below fills with your academy&apos;s live information.
          </p>
          <button onClick={() => onNavigate('roster')}
            style={{ appearance: 'none', border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 11, background: accent.hex, color: T.btnText, fontSize: 14, fontWeight: 700, fontFamily: FONT }}>
            <Icon name="grid" size={15} stroke={1.9} /> Connect your data
          </button>
        </div>
      </div>

      {/* Set up your academy */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '4px 0 12px' }}>Set up your academy</div>
        <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: density.gap }}>
          {SETUP_CARDS.map(c => (
            <button key={c.id} onClick={() => onNavigate(c.id)}
              style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent.border; e.currentTarget.style.background = accent.dim }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.panel }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.title}</span>
                <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, flexShrink: 0 }}>
                  <Icon name="plus" size={14} stroke={2} style={{ color: accent.hex }} />
                </span>
              </div>
              <span style={{ fontSize: 12, color: T.text3, lineHeight: 1.45 }}>{c.desc}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent.hex, marginTop: 2 }}>Add data →</span>
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
