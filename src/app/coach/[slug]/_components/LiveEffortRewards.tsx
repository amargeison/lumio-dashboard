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

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function LiveEffortRewards({ T, accent, density }: Common) {
  const players = useCoachTable<any>('coach_players')
  const sessions = useCoachTable<any>('coach_watch_sessions')
  const [selId, setSelId] = useState('')

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
      ⌚ Smartwatch effort · estimated · no court tracking
    </span>
  )
  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Effort &amp; Rewards</h2>
        <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>XP your players earn from sessions on their own smartwatch. Separate from Racket Progression.</p>
      </div>
      {honest}
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
          <div style={{ fontSize: 26 }}>⌚</div>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>No watch sessions yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Open a player and use <b style={{ color: T.text2 }}>Connect a watch</b> to set them up. Finished sessions appear here as XP automatically.</p>
        </div>
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

  return (
    <div>
      {header}

      {/* Squad leaderboard */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Squad leaderboard</div>
        {ranked.map((r, i) => {
          const on = r.p.id === sel.p.id
          const rl = levelFor(r.xp)
          return (
            <button key={r.p.id} onClick={() => setSelId(r.p.id)}
              style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, border: `1px solid ${on ? accent.hex : 'transparent'}`, background: on ? accent.dim : 'transparent', marginBottom: 2 }}>
              <span className="tnum" style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 800, color: i === 0 ? '#F5C518' : i === 1 ? '#C0C5CE' : i === 2 ? '#CD7F32' : T.text3 }}>{i + 1}</span>
              <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(r.p.name)}</span>
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
      {latest && (
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

      {/* Session history */}
      <div style={card}>
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

      <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6, margin: '2px 4px' }}>
        <Icon name="check" size={12} stroke={2} style={{ color: T.good, verticalAlign: -1, marginRight: 4 }} />
        Estimated smartwatch effort — heart rate, distance and duration. It builds XP and effort levels and never advances a racket or tracks court position. Short or odd sessions can be voided from a player&apos;s record.
      </p>
    </div>
  )
}
