'use client'
import Link from 'next/link'
import { SPORTS, type Sport } from '@/lib/sports/marketing-sports'

const CARD_BASE_BG = '#0d1117'
const CARD_BORDER = '#1F2937'

function SportCard({ sport }: { sport: Sport }) {
  const inner = (
    <div
      style={{
        background: CARD_BASE_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16,
        padding: 24,
        borderTop: `3px solid ${sport.accent}`,
        cursor: sport.available ? 'pointer' : 'default',
        transition: 'all 0.2s',
        opacity: sport.available ? 1 : 0.8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        boxSizing: 'border-box',
      }}
      onMouseOver={e => {
        if (!sport.available) return
        ;(e.currentTarget as HTMLDivElement).style.borderColor = sport.accent
        ;(e.currentTarget as HTMLDivElement).style.background = sport.accent + '10'
      }}
      onMouseOut={e => {
        if (!sport.available) return
        ;(e.currentTarget as HTMLDivElement).style.borderColor = CARD_BORDER
        ;(e.currentTarget as HTMLDivElement).style.background = CARD_BASE_BG
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sport.logo}
        alt={sport.label}
        style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 14 }}
      />
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{sport.label}</div>
      <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{sport.desc}</div>
      <div style={{ marginTop: 'auto' }}>
        {sport.available ? (
          <span style={{ color: sport.accent, fontSize: 13, fontWeight: 600 }}>Try demo →</span>
        ) : (
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>Coming soon</span>
        )}
      </div>
    </div>
  )

  if (sport.available) {
    return (
      <Link key={sport.id} href={sport.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </Link>
    )
  }

  return (
    <div
      key={sport.id}
      aria-disabled="true"
      style={{ height: '100%' }}
    >
      {inner}
    </div>
  )
}

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          {SPORTS.map(sport => (
            <SportCard key={sport.id} sport={sport} />
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
