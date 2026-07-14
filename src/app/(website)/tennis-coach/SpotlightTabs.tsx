'use client'

// Interactive tab island for the marketing page's module spotlights. The rest of
// the page is a server component (static HTML); only this + RevenueCalculator ship
// as client JS. The `mockup` nodes are server-rendered and passed in as props.
import { useState } from 'react'

const PURPLE = '#1F6FCC', PURPLE_LIGHT = '#3A8EE0', TEXT = '#F9FAFB', MUTED = '#9CA3AF', BORDER = '#1E293B'

export type Spot = { tab: string; eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode }

export default function SpotlightTabs({ spots }: { spots: Spot[] }) {
  const [active, setActive] = useState(0)
  const s = spots[active]
  return (
    <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>A closer look</div>
        <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 32, lineHeight: 1.1 }}>See the modules in action.</h2>
        {/* Tab bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 48 }}>
          {spots.map((sp, i) => (
            <button key={sp.tab} onClick={() => setActive(i)} style={{
              appearance: 'none', cursor: 'pointer', padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              background: i === active ? PURPLE : 'transparent', color: i === active ? '#fff' : MUTED,
              border: `1px solid ${i === active ? PURPLE : BORDER}`, transition: 'all .15s',
            }}>{sp.tab}</button>
          ))}
        </div>
        {/* Active panel */}
        <div className="spotlight-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{s.eyebrow}</div>
            <h3 style={{ fontSize: 36, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{s.title}</h3>
            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{s.body}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.bullets.map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                  <span style={{ color: PURPLE_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>{s.mockup}</div>
        </div>
      </div>
      <style>{`@media (max-width: 860px){ .spotlight-panel{ grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </section>
  )
}
