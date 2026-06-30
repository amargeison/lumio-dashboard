'use client'

// Read-only player & parent portal. Renders ONLY the scoped bundle from
// /api/portal/player (one player, one academy). Maps the demo's student view:
// progress header, racket pathway + working skills, latest session report,
// session videos, homework / what's next, and message-the-coach.

import { useEffect, useState } from 'react'
import { RACKET_STAGES, SKILLS_BY_STAGE } from '../../coach/[slug]/_lib/coach-db'
import { levelFor } from '../../coach/[slug]/_lib/effort-rewards'
import { fileToAvatarDataUrl, uploadAvatar } from '@/lib/avatar'

const BG = '#0B0F17', CARD = '#0F1623', PANEL2 = '#0B1220', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0', GOOD = '#3FB37F'

type Bundle = {
  player: { id: string; name: string; racket_stage?: string; level?: string; goal?: string; category?: string; age?: number; avatar_url?: string; watch_token?: string }
  skills: { skill: string; score: number }[]
  lessons: any[]
  bookings: any[]
  media: any[]
  messages: any[]
  watch: any[]
}

const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 14 }
const h2: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

export function StudentPortal({ onSignOut }: { onSignOut: () => void }) {
  const [b, setB] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const onPhoto = async (file?: File | null) => {
    if (!file) return
    try { const data = await fileToAvatarDataUrl(file); const url = await uploadAvatar('/api/portal/avatar', { dataUrl: data }); if (url) setAvatar(url) } catch { /* ignore */ }
  }

  const load = () => fetch('/api/portal/player').then(r => r.ok ? r.json() : null).then(d => { setB(d); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  // Manual session log (no watch needed — works on any device, any age).
  const [logOpen, setLogOpen] = useState(false)
  const [logDur, setLogDur] = useState('45')
  const [logRpe, setLogRpe] = useState(6)
  const [logDist, setLogDist] = useState('')
  const [logNote, setLogNote] = useState('')
  const [logBusy, setLogBusy] = useState(false)
  const [logErr, setLogErr] = useState('')
  const [logXp, setLogXp] = useState<number | null>(null)
  const submitLog = async () => {
    setLogErr(''); setLogBusy(true)
    try {
      const r = await fetch('/api/portal/watch/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_min: Number(logDur),
          perceived_effort: logRpe,
          distance_m: logDist ? Math.round(Number(logDist) * 1000) : undefined,
          note: logNote.trim() || undefined,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) { setLogXp(d.xp_awarded ?? null); setLogNote(''); load(); setTimeout(() => { setLogOpen(false); setLogXp(null) }, 1400) }
      else setLogErr(d.error || 'Could not save')
    } catch { setLogErr('Could not save') } finally { setLogBusy(false) }
  }

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

  // Effort & rewards (smartwatch) + session report from the player's watch sessions.
  const watch = b.watch || []
  const totalXP = watch.reduce((s: number, w: any) => s + (w.xp_awarded || 0), 0)
  const lvl = levelFor(totalXP)
  const lw = watch[0] // latest session
  // Racket-ready: every working skill consistent → ready for the next racket.
  const ready = stageSkills.length > 0 && stageSkills.every(s => (skillMap[s] || 0) >= 4)
  const nextStage = ready && stageIdx >= 0 && stageIdx < RACKET_STAGES.length - 1 ? RACKET_STAGES[stageIdx + 1] : null
  const drills: string[] = Array.isArray(rv.drills) ? rv.drills : []
  const Bar = ({ v, c = ACCENT }: { v: number; c?: string }) => <div style={{ height: 7, borderRadius: 4, background: PANEL2, overflow: 'hidden' }}><div style={{ width: `${Math.max(0, Math.min(100, v))}%`, height: '100%', background: c }} /></div>

  return (
    <Shell onSignOut={onSignOut}>
      {/* Header */}
      <div style={{ ...card, background: `linear-gradient(135deg, rgba(58,142,224,0.16), ${CARD})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            {(avatar || (b.player as any).avatar_url)
              ? <img src={avatar || (b.player as any).avatar_url} alt={b.player.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(58,142,224,0.2)', color: ACCENT, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700 }}>{b.player.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>}
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: '50%', background: ACCENT, color: '#06223f', fontSize: 11, display: 'grid', placeItems: 'center', border: `2px solid ${CARD}` }}>✎</span>
            <input type="file" accept="image/*" onChange={e => onPhoto(e.target.files?.[0])} style={{ display: 'none' }} />
          </label>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{b.player.name}’s progress</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: TEXT }}>{stage ? stage.name : 'Racket'} racket · {progress}% to next</h1>
          </div>
        </div>
        {b.player.goal && <div style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>🎯 {b.player.goal}</div>}
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

      {/* Ready for the next racket */}
      {ready && (
        <div style={{ ...card, background: 'rgba(63,179,127,0.10)', borderColor: 'rgba(63,179,127,0.4)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: GOOD }}>🎉 Ready for the {nextStage ? nextStage.name : 'next'} racket!</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Every {stage?.name} skill is consistent — ask your coach to book the assessment.</div>
        </div>
      )}

      {/* Log a session (manual — any device, any age) */}
      <div style={card}>
        <p style={h2}>Log a session</p>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Played without a watch? Log it here — how long and how hard it felt — and earn XP towards the next racket.</div>
        <button onClick={() => { setLogErr(''); setLogXp(null); setLogOpen(true) }} style={{ marginTop: 12, appearance: 'none', border: 0, background: ACCENT, color: '#06223f', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Log a session</button>
      </div>

      {logOpen && (
        <div onClick={e => { if (e.target === e.currentTarget && !logBusy) setLogOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.74)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '8vh 16px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 420, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🎾</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, flex: 1 }}>Log a session</div>
              <button onClick={() => !logBusy && setLogOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>

            {logXp != null ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: GOOD }}>+{logXp} XP earned!</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Nice work — keep it up.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>How long? (minutes)</label>
                  <input type="number" inputMode="numeric" value={logDur} onChange={e => setLogDur(e.target.value)} min={10} style={{ width: '100%', background: PANEL2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>How hard did it feel?</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button key={n} onClick={() => setLogRpe(n)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', border: `1px solid ${logRpe === n ? ACCENT : BORDER}`, background: logRpe === n ? 'rgba(58,142,224,0.2)' : 'transparent', color: logRpe === n ? TEXT : MUTED, borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700 }}>{n}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: MUTED, marginTop: 5 }}><span>Easy</span><span>Flat out</span></div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Distance (km) — optional</label>
                  <input type="number" inputMode="decimal" value={logDist} onChange={e => setLogDist(e.target.value)} placeholder="e.g. 3.2" style={{ width: '100%', background: PANEL2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Note — optional</label>
                  <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What did you work on?" style={{ width: '100%', background: PANEL2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                {logErr && <div style={{ fontSize: 12.5, color: '#E06A6A' }}>{logErr}</div>}
                <button onClick={submitLog} disabled={logBusy} style={{ appearance: 'none', border: 0, background: ACCENT, color: '#06223f', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: logBusy ? 'default' : 'pointer', opacity: logBusy ? 0.6 : 1 }}>{logBusy ? 'Saving…' : 'Save & earn XP'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Effort & rewards */}
      {watch.length > 0 && (
        <div style={card}>
          <p style={h2}>Effort &amp; rewards</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: TEXT }}>{totalXP}</div>
            <div style={{ fontSize: 12, color: MUTED }}>XP · Level {lvl.idx + 1} · {lvl.cur.name}</div>
          </div>
          <div style={{ marginTop: 8 }}><Bar v={lvl.pct} /></div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>{lvl.next ? `${lvl.next.min - totalXP} XP to ${lvl.next.name}` : 'Top level reached'}</div>
          {lw && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
              {([['Effort', lw.effort_score], ['Movement', lw.movement_score], ['Consistency', lw.consistency_score]] as [string, number][]).map(([l, v]) => (
                <div key={l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}><span>{l}</span><span style={{ color: TEXT, fontWeight: 700 }}>{v || 0}</span></div>
                  <Bar v={v || 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last session report (smartwatch) */}
      {lw && (
        <div style={card}>
          <p style={h2}>Last session report · {fmt(lw.started_at)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
            {([['Distance', lw.distance_m ? `${(lw.distance_m / 1000).toFixed(1)} km` : '—'], ['Duration', lw.duration_min ? `${Math.round(lw.duration_min)} min` : '—'], ['Avg HR', lw.avg_hr ? `${lw.avg_hr} bpm` : '—'], ['Effort', lw.effort_score != null ? `${lw.effort_score}` : '—']] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9.5, color: MUTED, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect a watch */}
      {b.player.watch_token && watch.length === 0 && (
        <div style={card}>
          <p style={h2}>Connect a watch</p>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Track {b.player.name.split(' ')[0]}’s effort, movement and XP from an Apple Watch or Wear OS watch. In the Lumio watch app, enter this pairing code:</div>
          <div onClick={() => { navigator.clipboard?.writeText(b.player.watch_token || '').catch(() => {}) }} title="Tap to copy" style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 12.5, color: TEXT, background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 11px', wordBreak: 'break-all', cursor: 'pointer' }}>{b.player.watch_token}</div>
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

      {/* Homework & what's next */}
      {(rv.homework || rv.nextFocus) && (
        <div style={card}>
          <p style={h2}>Homework &amp; what’s next</p>
          {rv.nextFocus && <div style={{ background: 'rgba(58,142,224,0.10)', border: `1px solid rgba(58,142,224,0.35)`, borderRadius: 8, padding: '10px 12px', marginBottom: rv.homework ? 8 : 0 }}><div style={{ fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Next session focus</div><div style={{ fontSize: 12.5, color: TEXT, marginTop: 3 }}>{rv.nextFocus}</div></div>}
          {rv.homework && <div style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Practice at home</div><div style={{ fontSize: 12.5, color: TEXT, marginTop: 3 }}>{rv.homework}</div></div>}
        </div>
      )}

      {/* Recent lessons */}
      {b.lessons.length > 0 && (
        <div style={card}>
          <p style={h2}>Recent lessons</p>
          {b.lessons.slice(0, 6).map((l: any, i: number) => {
            const lr = l.review_json || {}
            return (
              <div key={l.id} style={{ padding: '10px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: TEXT, fontWeight: 700 }}>{l.focus || 'Session'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: MUTED }}>{fmt(l.session_date)}{l.rating ? ` · ${'★'.repeat(l.rating)}` : ''}</span>
                </div>
                {Array.isArray(lr.takeaways) && lr.takeaways[0] && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{lr.takeaways[0]}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Recommended drills */}
      {drills.length > 0 && (
        <div style={card}>
          <p style={h2}>Recommended for {b.player.name.split(' ')[0]}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {drills.map((d, i) => <span key={i} style={{ fontSize: 11.5, color: TEXT, background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px' }}>{d}</span>)}
          </div>
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
