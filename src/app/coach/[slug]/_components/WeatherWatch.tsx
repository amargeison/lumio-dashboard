'use client'

// Dashboard → the weather for today's and tomorrow's lessons.
//
// Quiet when the forecast is fine: one line per venue. When a lesson crosses
// the coach's own limits (Settings → Reminders & summaries), it turns into a
// warning with a "Call lessons off" button: pick the lessons, say why, and
// Lumio cancels them, refunds any card payment, and tells each family.
// The coach always makes the call; nothing is cancelled by the forecast alone.

import { useEffect, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { rowsChanged } from '../_lib/coach-db'
import { reloadWallet } from '../_lib/pay-wallet'
import { niceTime } from '@/lib/coach/reminders'
import type { LessonWeather } from '@/lib/coach/weather'
import { formatPennies } from '@/lib/coach/money'

type Lesson = { bookingId: string; date: string; time: string; durMin: number; player: string | null; type: string | null; weather: LessonWeather | null }
type Venue = { venueId: string; name: string; lessons: Lesson[] }
type Data = { on: boolean; credit?: string; today?: string; venues: Venue[] }

const dayWord = (date: string, today?: string) => {
  if (date === today) return 'Today'
  const t = today ? new Date(`${today}T12:00:00Z`) : new Date()
  t.setUTCDate(t.getUTCDate() + 1)
  return date === t.toISOString().slice(0, 10) ? 'Tomorrow' : new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** "Tomorrow 4pm, 4.30pm, 5pm" — each time once, grouped by day. */
function timesByDay(ls: Lesson[], today?: string): string {
  const days = new Map<string, string[]>()
  for (const l of ls) { const d = days.get(l.date) || []; const t = niceTime(l.time); if (!d.includes(t)) d.push(t); days.set(l.date, d) }
  return Array.from(days.entries()).map(([d, ts]) => `${dayWord(d, today)} ${ts.join(', ')}`).join('; ')
}

export function WeatherWatch({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [data, setData] = useState<Data | null>(null)
  const [open, setOpen] = useState(false)
  const load = () => fetch('/api/coach/weather', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => setData(d)).catch(() => setData(null))
  useEffect(() => { void load() }, [])
  if (!data?.on || !data.venues.length) return null

  const bad = data.venues.flatMap(v => v.lessons.filter(l => l.weather?.bad).map(l => ({ ...l, venue: v.name })))
  const known = data.venues.some(v => v.lessons.some(l => l.weather))
  if (!known) return null

  const card: CSSProperties = { background: bad.length ? `${T.warn}12` : T.panel, border: `1px solid ${bad.length ? `${T.warn}55` : T.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: FONT }

  return (
    <div data-testid="weather-watch" style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: bad.length ? T.warn : T.text }}>
          {bad.length ? `⚠ Weather warning: ${bad.length} lesson${bad.length === 1 ? '' : 's'} at risk` : '☀ Weather for your next lessons'}
        </div>
        {bad.length > 0 && (
          <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '0 14px', minHeight: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Call lessons off…</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {data.venues.map(v => {
          const first = v.lessons.find(l => l.weather)
          const vBad = v.lessons.filter(l => l.weather?.bad)
          if (!first) return null
          return (
            <div key={v.venueId} style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
              <strong style={{ color: T.text }}>{v.name}</strong>
              {vBad.length
                ? <> · {timesByDay(vBad, data.today)}: <span style={{ color: T.warn, fontWeight: 600 }}>{vBad[0].weather!.why.join(', ')}</span></>
                : <> · {dayWord(first.date, data.today)} {niceTime(first.time)}: {first.weather!.words}</>}
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 10.5, color: T.text3, marginTop: 6 }}>{data.credit}</div>
      {open && <RainOffModal T={T} accent={accent} lessons={data.venues.flatMap(v => v.lessons.map(l => ({ ...l, venue: v.name })))} today={data.today} onClose={() => setOpen(false)} onDone={() => { void load(); rowsChanged('coach_bookings'); void reloadWallet() }} />}
    </div>
  )
}

type Result = { bookingId: string; cancelled: boolean; refunded: number; credited?: number; told: string | null; problem?: string }

export function RainOffModal({ T, accent, lessons, today, onClose, onDone }: {
  T: ThemeTokens; accent: AccentTokens; today?: string
  lessons: (Lesson & { venue: string })[]
  onClose: () => void; onDone: () => void
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(lessons.filter(l => l.weather?.bad).map(l => l.bookingId)))
  const [reason, setReason] = useState<'weather' | 'coach'>('weather')
  const [note, setNote] = useState('')
  const [tell, setTell] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const go = async () => {
    if (busy || !picked.size) return
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/coach/rain-off', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingIds: Array.from(picked), reason, note, tell }) })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'The lessons could not be called off. Please try again.'); return }
      setResults(d.results || [])
      onDone()
    } catch { setErr('You appear to be offline. Nothing was changed.') }
    finally { setBusy(false) }
  }

  const btn: CSSProperties = { appearance: 'none', border: 0, borderRadius: 9, padding: '0 16px', minHeight: 38, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }
  const name = (id: string) => { const l = lessons.find(x => x.bookingId === id); return l ? `${l.player || l.type || 'Lesson'} · ${dayWord(l.date, today)} ${niceTime(l.time)}` : 'Lesson' }

  return (
    <div onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div role="dialog" aria-label="Call lessons off" style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Call lessons off</div>
        {results ? (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(r => (
              <div key={r.bookingId} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>
                <strong style={{ color: r.cancelled ? T.text : T.bad }}>{name(r.bookingId)}</strong>
                {' · '}{r.cancelled ? 'cancelled' : 'not cancelled'}
                {r.refunded ? ` · ${formatPennies(r.refunded)} refunded` : ''}{r.credited ? ` · ${formatPennies(r.credited)} kept as a lesson credit` : ''}
                {r.told && r.told !== 'already told' ? ` · told ${r.told}` : r.told === 'already told' ? ' · family already told' : ''}
                {r.problem && <div style={{ color: T.bad, fontSize: 11.5 }}>{r.problem}</div>}
              </div>
            ))}
            <button onClick={onClose} style={{ ...btn, alignSelf: 'flex-end', marginTop: 8, background: accent.hex, color: T.btnText }}>Done</button>
          </div>
        ) : <>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4, lineHeight: 1.5 }}>Each lesson is cancelled, any card payment for it is refunded in full (or kept as a lesson credit, if that is your policy), and the family is told by email and in the app. It never counts as a late cancellation, and never comes off a lesson pack.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, maxHeight: 260, overflowY: 'auto' }}>
            {lessons.map(l => (
              <label key={l.bookingId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', border: `1px solid ${picked.has(l.bookingId) ? accent.border : T.border}`, background: picked.has(l.bookingId) ? accent.dim : T.panel2, borderRadius: 9, cursor: 'pointer' }}>
                <input type="checkbox" checked={picked.has(l.bookingId)} onChange={() => toggle(l.bookingId)} style={{ width: 17, height: 17, marginTop: 1, accentColor: accent.hex }} />
                <span style={{ fontSize: 12.5, color: T.text, minWidth: 0 }}>
                  {l.player || l.type || 'Lesson'} · {dayWord(l.date, today)} {niceTime(l.time)} · {l.venue}
                  {l.weather && <span style={{ display: 'block', fontSize: 11.5, color: l.weather.bad ? T.warn : T.text3 }}>{l.weather.bad ? l.weather.why.join(', ') : l.weather.words}</span>}
                </span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', fontSize: 12.5, color: T.text2 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><input type="radio" checked={reason === 'weather'} onChange={() => setReason('weather')} /> Because of the weather</label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><input type="radio" checked={reason === 'coach'} onChange={() => setReason('coach')} /> I can’t coach</label>
          </div>
          <textarea value={note} maxLength={500} rows={2} placeholder="Anything to add for the families (optional)" onChange={e => setNote(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: FONT, resize: 'vertical' }} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 12.5, color: T.text2, cursor: 'pointer' }}>
            <input type="checkbox" checked={tell} onChange={e => setTell(e.target.checked)} /> Tell the families (email and in the app)
          </label>
          {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 8 }}>{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button onClick={onClose} disabled={busy} style={{ ...btn, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontWeight: 600 }}>Keep them on</button>
            <button onClick={go} disabled={busy || !picked.size} style={{ ...btn, background: T.bad, color: '#fff', opacity: busy || !picked.size ? 0.5 : 1 }}>{busy ? 'Calling off…' : `Call off ${picked.size} lesson${picked.size === 1 ? '' : 's'}`}</button>
          </div>
        </>}
      </div>
    </div>
  )
}
