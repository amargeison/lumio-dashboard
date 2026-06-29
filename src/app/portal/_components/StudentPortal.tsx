'use client'

// Read-only player & parent portal. Renders ONLY the scoped bundle from
// /api/portal/player (one player, one academy). Maps the demo's student view:
// progress header, racket pathway + working skills, latest session report,
// session videos, homework / what's next, and message-the-coach.

import { useEffect, useState } from 'react'
import { RACKET_STAGES, SKILLS_BY_STAGE } from '../../coach/[slug]/_lib/coach-db'

const BG = '#0B0F17', CARD = '#0F1623', PANEL2 = '#0B1220', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0', GOOD = '#3FB37F'

type Bundle = {
  player: { id: string; name: string; racket_stage?: string; level?: string; goal?: string; category?: string; age?: number }
  skills: { skill: string; score: number }[]
  lessons: any[]
  bookings: any[]
  media: any[]
  messages: any[]
}

const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 14 }
const h2: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

export function StudentPortal({ onSignOut }: { onSignOut: () => void }) {
  const [b, setB] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState('')

  const load = () => fetch('/api/portal/player').then(r => r.ok ? r.json() : null).then(d => { setB(d); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const send = async () => {
    if (!msg.trim()) return
    setSent('Sending…')
    try {
      const r = await fetch('/api/portal/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: msg.trim() }) })
      if (r.ok) { setMsg(''); setSent('✓ Sent to your coach'); load() } else setSent('Could not send')
    } catch { setSent('Could not send') }
  }

  if (loading) return <Shell onSignOut={onSignOut}><div style={{ color: MUTED, fontSize: 13 }}>Loading…</div></Shell>
  if (!b?.player) return <Shell onSignOut={onSignOut}><div style={{ color: MUTED, fontSize: 13 }}>No player data available yet.</div></Shell>

  const stageIdx = RACKET_STAGES.findIndex(s => s.id === b.player.racket_stage)
  const stage = stageIdx >= 0 ? RACKET_STAGES[stageIdx] : null
  const stageSkills: string[] = stage ? (SKILLS_BY_STAGE[stage.id] || []) : []
  const skillMap: Record<string, number> = Object.fromEntries(b.skills.map(s => [s.skill, s.score]))
  const progress = stageSkills.length ? Math.round(stageSkills.filter(s => (skillMap[s] || 0) >= 4).length / stageSkills.length * 100) : 0
  const latest = b.lessons[0]
  const rv = latest?.review_json || {}
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  return (
    <Shell onSignOut={onSignOut}>
      {/* Header */}
      <div style={{ ...card, background: `linear-gradient(135deg, rgba(58,142,224,0.16), ${CARD})` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{b.player.name}’s progress</div>
        <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: TEXT }}>{stage ? stage.name : 'Racket'} racket · {progress}% to next</h1>
        {b.player.goal && <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>🎯 {b.player.goal}</div>}
        <div style={{ height: 8, borderRadius: 4, background: PANEL2, overflow: 'hidden', marginTop: 12 }}><div style={{ width: `${progress}%`, height: '100%', background: ACCENT }} /></div>
      </div>

      {/* Racket pathway */}
      {stage && (
        <div style={card}>
          <p style={h2}>Racket journey</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RACKET_STAGES.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, border: `1px solid ${i === stageIdx ? ACCENT : BORDER}`, background: i === stageIdx ? 'rgba(58,142,224,0.16)' : 'transparent', opacity: i <= stageIdx ? 1 : 0.55 }}>
                <span style={{ width: 12, height: 9, borderRadius: 2, background: s.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                <span style={{ fontSize: 11, color: i === stageIdx ? TEXT : MUTED, fontWeight: i === stageIdx ? 700 : 400 }}>{s.name}{i === stageIdx ? ' · now' : ''}</span>
              </div>
            ))}
          </div>
          {stageSkills.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {stageSkills.map(sk => { const v = skillMap[sk] || 0; return (
                <div key={sk} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: TEXT }}>{sk}</span>
                  <div style={{ width: 120, display: 'flex', gap: 3 }}>{[1, 2, 3, 4].map(n => <span key={n} style={{ flex: 1, height: 7, borderRadius: 2, background: v >= n ? (v >= 4 ? GOOD : ACCENT) : PANEL2 }} />)}</div>
                </div>
              ) })}
            </div>
          )}
        </div>
      )}

      {/* Session videos */}
      {b.media.length > 0 && (
        <div style={card}>
          <p style={h2}>Session highlights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {b.media.slice(0, 8).map((m: any) => (
              <a key={m.id} href={m.url || m.signed_url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, color: TEXT }}>
                <div style={{ fontSize: 22 }}>▶</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title || m.kind || 'Clip'}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{fmt(m.created_at)}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Latest session report */}
      {latest && (
        <div style={card}>
          <p style={h2}>Latest session · {fmt(latest.session_date)}</p>
          {latest.focus && <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{latest.focus}</div>}
          {Array.isArray(rv.takeaways) && rv.takeaways.length > 0 && (
            <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>{rv.takeaways.map((t: string, i: number) => <li key={i} style={{ fontSize: 12.5, color: TEXT, marginBottom: 4 }}>{t}</li>)}</ul>
          )}
          {(rv.homework || rv.nextFocus) && (
            <div style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
              {rv.nextFocus && <div style={{ fontSize: 12.5, color: TEXT }}><strong style={{ color: ACCENT }}>Next:</strong> {rv.nextFocus}</div>}
              {rv.homework && <div style={{ fontSize: 12.5, color: MUTED, marginTop: rv.nextFocus ? 6 : 0 }}><strong style={{ color: ACCENT }}>Homework:</strong> {rv.homework}</div>}
            </div>
          )}
          {!rv.takeaways && (latest.summary || latest.ai_review) && <div style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{latest.summary || latest.ai_review}</div>}
        </div>
      )}

      {/* Message the coach */}
      <div style={card}>
        <p style={h2}>Message your coach</p>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="Send your coach a message…" style={{ width: '100%', background: PANEL2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 11, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <button onClick={send} disabled={!msg.trim()} style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '8px 16px', background: ACCENT, color: '#06223f', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: msg.trim() ? 1 : 0.5 }}>Send</button>
          {sent && <span style={{ fontSize: 12, color: sent.startsWith('✓') ? GOOD : MUTED }}>{sent}</span>}
        </div>
        {b.messages.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {b.messages.slice(0, 6).map((m: any) => (
              <div key={m.id} style={{ alignSelf: m.direction === 'in' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.direction === 'in' ? 'rgba(58,142,224,0.16)' : PANEL2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 11px' }}>
                <div style={{ fontSize: 12.5, color: TEXT, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>{m.direction === 'in' ? 'You' : 'Coach'} · {fmt(m.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>Lumio</span>
        <button onClick={onSignOut} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 18 }}>{children}</div>
    </div>
  )
}
