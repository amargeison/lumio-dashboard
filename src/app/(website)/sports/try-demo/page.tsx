'use client'
import Link from 'next/link'

const SPORTS = [
  { id: 'tennis', label: 'Tennis', emoji: '🎾', href: '/tennis/tennis-demo', accent: '#a855f7', desc: 'ATP/WTA rankings, match prep, AI briefing, GPS heatmaps' },
  { id: 'darts', label: 'Darts', emoji: '🎯', href: '/darts/darts-demo', accent: '#22c55e', desc: 'PDC rankings, practice tracker, match prep, opponent intel' },
  { id: 'golf', label: 'Golf', emoji: '⛳', href: '/golf/golf-demo', accent: '#16a34a', desc: 'OWGR ranking, strokes gained, course fit, caddie hub' },
  { id: 'boxing', label: 'Boxing', emoji: '🥊', href: '/boxing/boxing-demo', accent: '#ef4444', desc: 'Fight camp, weight tracker, opponent scout, purse simulator' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', href: '/cricket/cricket-demo', accent: '#10b981', desc: 'GPS bowling load, batting analytics, D/L calculator, camp mode' },
  { id: 'rugby', label: 'Rugby', emoji: '🏉', href: '/rugby/rugby-demo', accent: '#f97316', desc: 'Salary cap, GPS, pre-season camp, set pieces, board suite' },
  { id: 'football', label: 'Football Pro', emoji: '⚽', href: '/football/lumio-dev', accent: '#3b82f6', desc: 'PSR compliance, FIFA pitch view, set pieces, board suite' },
  { id: 'nonleague', label: 'Non-League', emoji: '⚽', href: '/football/nonleague/harfield-fc', accent: '#f59e0b', desc: 'FA Ground Grading, wage bill, sponsorship, match day revenue' },
  { id: 'grassroots', label: 'Grassroots', emoji: '⚽', href: '/football/grassroots/sunday-rovers-fc', accent: '#10b981', desc: 'AI team selection, subs collection, safeguarding, parent portal' },
  { id: 'womens', label: "Women's FC", emoji: '⚽', href: '/womens/oakridge-women-fc', accent: '#be185d', desc: 'FSR compliance, player welfare, dual registration, demerger tracker' },
]

export default function TryDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07080F', padding: '60px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: '#6C3FC520', border: '1px solid #6C3FC540', borderRadius: 20, padding: '4px 14px', marginBottom: 16, color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>
            Interactive demos — no account needed
          </div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Try a demo</h1>
          <p style={{ color: '#6B7280', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Choose your sport and explore the portal. Enter your email to get instant access.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {SPORTS.map(sport => (
            <Link key={sport.id} href={sport.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s', borderTop: `3px solid ${sport.accent}` }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = sport.accent; (e.currentTarget as HTMLDivElement).style.background = sport.accent + '10' }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'; (e.currentTarget as HTMLDivElement).style.background = '#0d1117' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{sport.emoji}</div>
                <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{sport.label}</div>
                <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.5 }}>{sport.desc}</div>
                <div style={{ marginTop: 16, color: sport.accent, fontSize: 13, fontWeight: 600 }}>Try demo →</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Ready to get your own portal?</p>
          <Link href="/sports-signup" style={{ display: 'inline-block', background: '#6C3FC5', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Apply for founding access →
          </Link>
        </div>
      </div>
    </div>
  )
}
