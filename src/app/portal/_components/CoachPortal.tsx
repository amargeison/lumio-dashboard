'use client'

// Scoped sub-coach portal. Renders ONLY the bundle from /api/portal/coach (this
// coach's assigned players, their schedule and their players' lesson summaries).
// No staff / camps / venues / equipment / payments — and never another coach's data.

import { useEffect, useState } from 'react'
import { RACKET_STAGES } from '../../coach/[slug]/_lib/coach-db'

const BG = '#0B0F17', CARD = '#0F1623', PANEL2 = '#0B1220', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'
const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 14 }
const h2: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }
const stageName = (id?: string) => RACKET_STAGES.find(s => s.id === id)?.name || '—'
const stageColour = (id?: string) => RACKET_STAGES.find(s => s.id === id)?.colour || '#888'
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''

export function CoachPortal({ onSignOut }: { onSignOut: () => void }) {
  const [b, setB] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/portal/coach').then(r => r.ok ? r.json() : null).then(d => { setB(d); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const today = new Date().toLocaleDateString('en-CA')
  const dayKey = (x?: string) => String(x ?? '').slice(0, 10)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>Lumio · Coach</span>
        <button onClick={onSignOut} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 18 }}>
        {loading ? <div style={{ color: MUTED, fontSize: 13 }}>Loading…</div> : !b ? <div style={{ color: MUTED, fontSize: 13 }}>No data available.</div> : (() => {
          const todays = (b.bookings || []).filter((x: any) => dayKey(x.booking_date) === today)
          return (<>
            <div style={{ ...card, background: `linear-gradient(135deg, rgba(58,142,224,0.16), ${CARD})` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{b.coachName}</div>
              <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: TEXT }}>{todays.length} session{todays.length === 1 ? '' : 's'} today</h1>
              <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
                {[['Players', (b.players || []).length], ['Upcoming', (b.bookings || []).length], ['Summaries', (b.sessions || []).length]].map(([l, v]) => (
                  <div key={l as string}><div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{v as number}</div><div style={{ fontSize: 9.5, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l as string}</div></div>
                ))}
              </div>
            </div>

            <div style={card}>
              <p style={h2}>Upcoming sessions</p>
              {(b.bookings || []).length === 0 ? <div style={{ fontSize: 12.5, color: MUTED }}>Nothing booked yet.</div> : (b.bookings || []).slice(0, 8).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 11.5, color: ACCENT, fontWeight: 600, width: 96, flexShrink: 0 }}>{fmt(s.booking_date)}{s.start_time ? ` ${s.start_time}` : ''}</span>
                  <span style={{ fontSize: 12.5, color: TEXT, fontWeight: 500 }}>{s.player_name || 'Session'}<span style={{ color: MUTED }}>{[s.type, s.court].filter(Boolean).length ? ` · ${[s.type, s.court].filter(Boolean).join(' · ')}` : ''}</span></span>
                </div>
              ))}
            </div>

            <div style={card}>
              <p style={h2}>Your players · {(b.players || []).length}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {(b.players || []).map((p: any) => (
                  <div key={p.id} style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(58,142,224,0.2)', color: ACCENT, display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700, flexShrink: 0 }}>{(p.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>}
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{p.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ width: 12, height: 9, borderRadius: 2, background: stageColour(p.racket_stage), border: '1px solid rgba(128,128,128,0.4)' }} />
                      <span style={{ fontSize: 11, color: MUTED }}>{stageName(p.racket_stage)}{p.age ? ` · Age ${p.age}` : ''}</span>
                    </div>
                    {p.goal && <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>🎯 {p.goal}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <p style={h2}>Recent lesson summaries</p>
              {(b.sessions || []).length === 0 ? <div style={{ fontSize: 12.5, color: MUTED }}>No summaries yet.</div> : (b.sessions || []).slice(0, 10).map((s: any) => (
                <div key={s.id} style={{ padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 600 }}>{s.player_name}<span style={{ color: MUTED, fontWeight: 400 }}> · {fmt(s.session_date)}</span></div>
                  {s.focus && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{s.focus}</div>}
                </div>
              ))}
            </div>
          </>)
        })()}
      </div>
    </div>
  )
}
