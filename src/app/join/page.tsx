'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPORTS = [
  { id: 'tennis', name: 'Tennis', emoji: '🎾', accent: '#a855f7', tag: 'ATP · WTA · ITF', bullets: ['AI morning briefing', 'Tournament scheduler', 'Sponsor management'] },
  { id: 'golf', name: 'Golf', emoji: '⛳', accent: '#16a34a', tag: 'DP World · PGA · Challenge Tour', bullets: ['OWGR ranking tracker', 'Lumio Range session logger', 'Caddie brief AI'] },
  { id: 'darts', name: 'Darts', emoji: '🎯', accent: '#22c55e', tag: 'PDC · BDO · WDF', bullets: ['PDC ranking tracker', 'Match report AI', 'Prize money tracker'] },
  { id: 'boxing', name: 'Boxing', emoji: '🥊', accent: '#ef4444', tag: 'WBO · WBC · IBF · WBA · GPS Ring Tracking', bullets: ['GPS Ring Heatmap (world first)', 'AI opponent scouting', 'Purse breakdown + weight AI'] },
  { id: 'cricket', name: 'Cricket', emoji: '🏏', accent: '#10b981', tag: 'County · Hundred · Internationals', bullets: ['Bowling workload tracker', 'Match prep AI', 'Tour planning'] },
  { id: 'rugby', name: 'Rugby', emoji: '🏉', accent: '#f97316', tag: 'Premiership · Championship · Europe', bullets: ['GPS load monitoring', 'Contact block planner', 'Recovery tracker'] },
  { id: 'football', name: 'Football Pro', emoji: '⚽', accent: '#3b82f6', tag: 'Professional clubs', bullets: ['PSR compliance', 'Squad GPS data', 'AI manager briefing'] },
  { id: 'nonleague', name: 'Non-League', emoji: '⚽', accent: '#f59e0b', tag: 'Steps 3–7 · National League System', bullets: ['FA Ground Grading tracker', 'Player contracts', 'Match day revenue'] },
  { id: 'grassroots', name: 'Grassroots', emoji: '⚽', accent: '#10b981', tag: '45,000 UK clubs', bullets: ['Subs collection', 'Safeguarding log', 'AI team selection'] },
  { id: 'womens', name: "Women's FC", emoji: '⚽', accent: '#be185d', tag: 'WSL · WSL2 · Standalone clubs', bullets: ['FSR compliance dashboard', 'Player welfare hub', 'Dual registration tracker'] },
]

export default function JoinPage() {
  const router = useRouter()

  return (
    <div style={{ background: '#07080F', minHeight: '100vh', color: '#F9FAFB' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 80, margin: '0 auto 24px', display: 'block' }} />
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            Choose your sport
          </h1>
          <p style={{ color: '#facc15', fontSize: 15, fontWeight: 600 }}>
            🎯 Founding Member — Free for 3 months · No card needed · 20 spots remaining
          </p>
        </div>

        {/* Sport cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {SPORTS.map(sport => (
            <div
              key={sport.id}
              onClick={() => router.push(`/sports-signup?sport=${sport.id}`)}
              style={{
                background: '#0d1117',
                border: `1px solid ${sport.accent}40`,
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${sport.accent}`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${sport.accent}40`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sport.accent }} />
              <div style={{ fontSize: 32, marginBottom: 8 }}>{sport.emoji}</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{sport.name}</div>
              <div style={{ color: sport.accent, fontSize: 11, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sport.tag}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sport.bullets.map(b => (
                  <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: sport.accent, fontSize: 12, marginTop: 2 }}>✓</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, color: sport.accent, fontSize: 13, fontWeight: 600 }}>
                Apply for access →
              </div>
            </div>
          ))}
        </div>

        {/* Sign in link */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/sports-login" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>
            Already have an account? <span style={{ textDecoration: 'underline' }}>Sign in →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
