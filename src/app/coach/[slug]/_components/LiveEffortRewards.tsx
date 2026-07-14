'use client'

// Live Effort & Rewards — the smartwatch reward system for a real coach's
// portal. Reads coach_watch_sessions (scores computed server-side at ingest)
// and coach_players.xp_total. A motivation layer, kept deliberately separate
// from Racket Progression (coach-assessed against the LTA Youth pathway).
// Honest by design: estimated effort only, no court position / heatmaps.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable } from '../_lib/coach-db'
import { levelFor, bandLabel } from '../_lib/effort-rewards'
import { getSettings } from '../_lib/settings-store'
import { GpsLineChart } from './CoachHeatmaps'
import { avatarSrc } from '@/lib/avatar'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function LiveEffortRewards({ T, accent, density }: Common) {
  const players = useCoachTable<any>('coach_players')
  const sessions = useCoachTable<any>('coach_watch_sessions')
  const [selId, setSelId] = useState('')

  // Coach-side manual session log — record effort for a player with no watch.
  const [logOpen, setLogOpen] = useState(false)
  const [logPlayer, setLogPlayer] = useState('')
  const [logDur, setLogDur] = useState('45')
  const [logRpe, setLogRpe] = useState(6)
  const [logDist, setLogDist] = useState('')
  const [logNote, setLogNote] = useState('')
  const [logBusy, setLogBusy] = useState(false)
  const [logErr, setLogErr] = useState('')
  const [logXp, setLogXp] = useState<number | null>(null)
  const openLog = (pid?: string) => { setLogErr(''); setLogXp(null); setLogPlayer(pid || players.rows[0]?.id || ''); setLogOpen(true) }
  const submitLog = async () => {
    if (!logPlayer) { setLogErr('Pick a player'); return }
    setLogErr(''); setLogBusy(true)
    try {
      const r = await fetch('/api/coach/watch/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: logPlayer, duration_min: Number(logDur), perceived_effort: logRpe, distance_m: logDist ? Math.round(Number(logDist) * 1000) : undefined, note: logNote.trim() || undefined }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) { setLogXp(d.xp_awarded ?? null); setLogNote(''); sessions.reload(); players.reload(); setTimeout(() => { setLogOpen(false); setLogXp(null) }, 1400) }
      else setLogErr(d.error || 'Could not save')
    } catch { setLogErr('Could not save') } finally { setLogBusy(false) }
  }
  const field: React.CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }
  const lab: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }
  const logBtn = (
    <button onClick={() => openLog()} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>+ Log a session</button>
  )
  const logModal = logOpen ? (
    <div onClick={e => { if (e.target === e.currentTarget && !logBusy) setLogOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.74)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '8vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 440, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, flex: 1 }}>Log a session</div>
          <button onClick={() => !logBusy && setLogOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        {logXp != null ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.good }}>+{logXp} XP added</div>
            <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Saved to the player’s record.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lab}>Player</label>
              <select value={logPlayer} onChange={e => setLogPlayer(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                {players.rows.length === 0 && <option value="">No players yet</option>}
                {players.rows.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lab}>How long? (minutes)</label>
              <input type="number" value={logDur} onChange={e => setLogDur(e.target.value)} min={10} style={field} />
            </div>
            <div>
              <label style={lab}>How hard did it feel?</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button key={n} onClick={() => setLogRpe(n)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', border: `1px solid ${logRpe === n ? accent.hex : T.border}`, background: logRpe === n ? accent.dim : 'transparent', color: logRpe === n ? T.text : T.text3, borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700 }}>{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.text3, marginTop: 5 }}><span>Easy</span><span>Flat out</span></div>
            </div>
            <div>
              <label style={lab}>Distance (km) — optional</label>
              <input type="number" value={logDist} onChange={e => setLogDist(e.target.value)} placeholder="e.g. 3.2" style={field} />
            </div>
            <div>
              <label style={lab}>Note — optional</label>
              <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What did they work on?" style={field} />
            </div>
            {logErr && <div style={{ fontSize: 12.5, color: T.bad }}>{logErr}</div>}
            <button onClick={submitLog} disabled={logBusy} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: logBusy ? 'default' : 'pointer', opacity: logBusy ? 0.6 : 1 }}>{logBusy ? 'Saving…' : 'Save & add XP'}</button>
          </div>
        )}
      </div>
    </div>
  ) : null

  const tone = (n: number) => n >= 70 ? T.good : n >= 40 ? T.warn : T.bad
  const when = (s: any) => String(s.started_at || s.created_at || '')
  const live = sessions.rows.filter(s => !s.voided)
  const forPlayer = (pid: string) => live.filter(s => s.player_id === pid).sort((a, b) => when(b).localeCompare(when(a)))

  const ranked = players.rows
    .map(p => ({ p, xp: Number(p.xp_total) || 0, list: forPlayer(p.id) }))
    .filter(r => r.list.length > 0 || r.xp > 0)
    .sort((a, b) => b.xp - a.xp)

  const sel = ranked.find(r => r.p.id === selId) ?? ranked[0]

  const honest = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 999, padding: '4px 11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      Effort XP · estimated · no court tracking
    </span>
  )
  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Effort &amp; Rewards</h2>
        <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>XP your players earn from training — log it here, or players can log from their app. Separate from Racket Progression.</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {honest}
        {logBtn}
      </div>
    </div>
  )

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: density.gap }

  if (players.loading || sessions.loading) {
    return <div><p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p></div>
  }

  if (!ranked.length) {
    return (
      <div>
        {header}
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>🎾</div>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>No sessions logged yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>Tap <b style={{ color: T.text2 }}>Log a session</b> to record one now. Players can also log from their own app.</p>
          {logBtn}
        </div>
        {logModal}
      </div>
    )
  }

  const scoreTile = (label: string, n: number) => (
    <div style={{ flex: 1, minWidth: 140, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: tone(n) }}>{bandLabel(n)}</span>
      </div>
      <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 2 }}>{n}<span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>/100</span></div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: (n / 100) * 4 > i ? tone(n) : T.hover }} />)}
      </div>
    </div>
  )

  const xpTotal = sel.xp
  const lvl = levelFor(xpTotal)
  const latest = sel.list[0]
  const sectOff = getSettings().sectionsOff?.gpsheatmaps || []
  const showSec = (k: string) => !sectOff.includes(k)

  // Effort trend — effort score across this player's recent sessions (chronological).
  const trendSrc = sel.list.slice().reverse()
  const effortTrend = trendSrc.map(s => Number(s.effort_score) || 0)
  const trendLabels = trendSrc.map(s => when(s) ? new Date(when(s)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '')

  return (
    <div>
      {header}
      {logModal}

      {/* Squad leaderboard */}
      <div style={{ ...card, display: showSec('leaderboard') ? undefined : 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Squad leaderboard</div>
        {ranked.map((r, i) => {
          const on = r.p.id === sel.p.id
          const rl = levelFor(r.xp)
          return (
            <button key={r.p.id} onClick={() => setSelId(r.p.id)}
              style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, border: `1px solid ${on ? accent.hex : 'transparent'}`, background: on ? accent.dim : 'transparent', marginBottom: 2 }}>
              <span className="tnum" style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 800, color: i === 0 ? '#F5C518' : i === 1 ? '#C0C5CE' : i === 2 ? '#CD7F32' : T.text3 }}>{i + 1}</span>
              {r.p.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarSrc(r.p.avatar_url)} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(r.p.name)}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.p.name}</span>
                <span style={{ fontSize: 11, color: T.text3 }}>🏅 {rl.cur.name} · {r.list.length} session{r.list.length === 1 ? '' : 's'}</span>
              </span>
              <span className="tnum" style={{ fontSize: 15, fontWeight: 800, color: accent.hex }}>{r.xp.toLocaleString()} <span style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>XP</span></span>
            </button>
          )
        })}
      </div>

      {/* XP hero + effort level */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sel.p.name} · Total XP</div>
            <div className="tnum" style={{ fontSize: 34, fontWeight: 800, color: accent.hex, lineHeight: 1.1 }}>{xpTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>{sel.list.length} session{sel.list.length === 1 ? '' : 's'} logged</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: T.text2, fontWeight: 700 }}>🏅 Effort level {lvl.idx + 1} · {lvl.cur.name}</span>
              <span style={{ color: T.text3 }}>{lvl.next ? `Next: ${lvl.next.name}` : 'Max level'}</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: T.hover, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <div style={{ width: `${lvl.pct}%`, height: '100%', background: accent.hex }} />
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>{lvl.next ? `${(lvl.next.min - xpTotal).toLocaleString()} XP to ${lvl.next.name}` : 'Top effort level reached'}</div>
          </div>
        </div>
      </div>

      {/* Latest session */}
      {latest && showSec('latest') && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Latest session</div>
          <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12 }}>{when(latest) ? new Date(when(latest)).toLocaleString('en-GB') : '—'}{latest.estimated ? ' · estimated' : ''}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {scoreTile('Effort', Number(latest.effort_score) || 0)}
            {scoreTile('Movement', Number(latest.movement_score) || 0)}
            {scoreTile('Consistency', Number(latest.consistency_score) || 0)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {[
              ['Duration', latest.duration_min ? `${Math.round(latest.duration_min)}m` : '—'],
              ['Distance', latest.distance_m ? `${(Number(latest.distance_m) / 1000).toFixed(1)}km` : '—'],
              ['Avg heart rate', latest.avg_hr ? `${latest.avg_hr}` : '—'],
              ['XP earned', `+${Number(latest.xp_awarded) || 0}`],
            ].map(([l, v], i) => (
              <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                <div className="tnum" style={{ fontSize: 18, fontWeight: 800, color: i === 3 ? accent.hex : T.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Effort trend */}
      {effortTrend.length > 1 && showSec('trend') && (
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Effort trend</div>
          <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12 }}>Effort score across recent sessions</div>
          <GpsLineChart T={T} values={effortTrend} max={100} min={0} labels={trendLabels} colour={accent.hex} height={150} width={460} target={70} valueFormat={v => `${v}`} />
        </div>
      )}

      {/* Session history */}
      <div style={{ ...card, display: showSec('history') ? undefined : 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Session history</div>
        {sel.list.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ width: 96, flexShrink: 0, fontSize: 12, color: T.text2 }}>{when(s) ? new Date(when(s)).toLocaleDateString('en-GB') : '—'}</div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {([['E', s.effort_score], ['M', s.movement_score], ['C', s.consistency_score]] as const).map(([k, n]) => (
                <span key={k} style={{ fontSize: 11, color: T.text3 }}>{k} <b style={{ color: tone(Number(n) || 0) }}>{Number(n) || 0}</b></span>
              ))}
            </div>
            <span className="tnum" style={{ fontSize: 14, fontWeight: 800, color: accent.hex, flexShrink: 0 }}>+{Number(s.xp_awarded) || 0} XP</span>
          </div>
        ))}
      </div>

      {/* How XP works */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>How XP works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            ['Effort', 'How hard they worked through the session — perceived effort now, heart-rate intensity once watches are connected.'],
            ['Movement', 'How much ground they covered — distance across the session.'],
            ['Consistency', 'Showing up and putting in a full session, every time.'],
          ].map(([h, d]) => (
            <div key={h} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{h}</div>
              <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6, margin: '14px 0 0' }}>
          XP builds the effort level shown above. It is a motivation layer, kept separate from Racket Progression, which you assess against the LTA Youth pathway each session. Effort rewards never advance a racket. Short sessions are ignored, XP is capped per session, and you can void anything odd.
        </p>
      </div>

      {/* Watch sync — coming soon */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>⌚</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Smartwatch sync <span style={{ fontSize: 10, fontWeight: 800, color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 999, padding: '2px 8px', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming soon</span></div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>Players will connect a watch so sessions log heart rate, distance and duration automatically. For now, log sessions manually above — the XP works exactly the same.</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text3, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 14px', whiteSpace: 'nowrap' }}>Notify me</span>
      </div>

      <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6, margin: '2px 4px' }}>
        <Icon name="check" size={12} stroke={2} style={{ color: T.good, verticalAlign: -1, marginRight: 4 }} />
        Estimated effort — never advances a racket or tracks court position. Short or odd sessions can be voided from a player&apos;s record.
      </p>
    </div>
  )
}
