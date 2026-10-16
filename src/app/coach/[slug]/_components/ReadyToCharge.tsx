'use client'

// Payments → Card payments. Lessons that have happened and have not been paid
// for, for players with a card on file; late cancellations the policy charges
// for; charges that failed; and what has been taken recently.
//
// Nothing here charges on its own. The coach ticks what to take and presses
// one button; each lesson is charged once (the database refuses a second).

import { useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { useCoachSettings } from '../_lib/use-settings'
import { useWallet, reloadWallet, savedFor, methodLabel, chargeState } from '../_lib/pay-wallet'
import { priceFor } from '@/lib/coach/pricing'
import { readPolicy, isLateCancel, feeFor, ukLocalToMs } from '@/lib/coach/cancel-policy'
import { formatPennies } from '@/lib/coach/money'

type Bk = { id: string; player_id?: string | null; player_name?: string | null; booking_date?: string | null; start_time?: string | null; type?: string | null; status?: string | null; venue_id?: string | null; duration_min?: number | null; price_pennies?: number | null; headcount?: number | null; cancelled_at?: string | null }
type Player = { id: string; name: string; rate_pennies?: number | null; rate_reason?: string | null }
type Line = { key: string; at: number; bookingId: string; playerId: string; who: string; when: string; kind: 'lesson' | 'late_cancel'; amount: number; card: string; failed?: string | null }

const whenOf = (b: Bk) => {
  const d = b.booking_date ? new Date(`${b.booking_date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''
  return `${d}${b.start_time ? ` ${b.start_time.slice(0, 5)}` : ''}`
}

export function ReadyToCharge({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const { wallet, loading } = useWallet({ fresh: true })
  const bookings = useCoachTable<Bk>('coach_bookings')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const policy = readPolicy(s.cancelPolicy)

  const lines = useMemo<Line[]>(() => {
    const now = Date.now()
    const since = now - 60 * 86_400_000
    const out: Line[] = []
    for (const b of bookings.rows) {
      if (!b.player_id || b.type === 'Block' || !b.booking_date) continue
      const card = savedFor(wallet, b.player_id)
      if (!card) continue
      const at = ukLocalToMs(b.booking_date, (b.start_time || '00:00').slice(0, 5))
      if (at < since) continue
      const mine = wallet.charges.filter(c => c.booking_id === b.id)
      const taken = (k: string) => mine.some(c => (c.kind === k || (k === 'lesson' && c.kind === 'no_show')) && ['paid', 'processing', 'charging', 'refunded'].includes(c.status))
      const lastFail = mine.find(c => c.status === 'failed')?.failure_reason || null
      const player = players.find(p => p.id === b.player_id)
      const price = priceFor(b, { rules: s.priceList || [], client: player || null, defaultHourly: s.privateRate })
      const base = price.each != null && price.people > 1 ? price.each : price.total
      const who = player?.name || b.player_name || 'Player'
      if (b.status === 'confirmed' && at <= now && !taken('lesson') && base > 0) {
        out.push({ key: `${b.id}:lesson`, at, bookingId: b.id, playerId: b.player_id, who, when: whenOf(b), kind: 'lesson', amount: base, card: methodLabel(card), failed: lastFail })
      }
      if (b.status === 'cancelled' && isLateCancel(b, policy) && !taken('late_cancel')) {
        const fee = feeFor(base, policy.lateChargePct)
        if (fee > 0) out.push({ key: `${b.id}:late_cancel`, at, bookingId: b.id, playerId: b.player_id, who, when: whenOf(b), kind: 'late_cancel', amount: fee, card: methodLabel(card), failed: lastFail })
      }
    }
    // Oldest first: the longest-owed is the one to deal with.
    return out.sort((a, b) => a.at - b.at)
  }, [bookings.rows, players, wallet, s.priceList, s.privateRate, policy.hours, policy.lateChargePct]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !wallet.chargesEnabled) return null
  const recent = wallet.charges.filter(c => c.status !== 'pending').slice(0, 8)
  if (!lines.length && !recent.length && !wallet.methods.some(m => m.status === 'active')) return null

  // Lessons are ticked to start with; late-cancellation fees are the coach's call.
  const sel = picked ?? new Set(lines.filter(l => l.kind === 'lesson' && !l.failed).map(l => l.key))
  const chosen = lines.filter(l => sel.has(l.key))
  const total = chosen.reduce((n, l) => n + l.amount, 0)
  const toggle = (k: string) => { const next = new Set(sel); if (next.has(k)) next.delete(k); else next.add(k); setPicked(next) }

  const run = async () => {
    if (busy || !chosen.length) return
    if (!confirm(`Take ${formatPennies(total)} for ${chosen.length} ${chosen.length === 1 ? 'payment' : 'payments'} from the saved cards and Direct Debits?`)) return
    setBusy(true); setMsg(null)
    let ok = 0, failed = 0, firstError = ''
    for (const l of chosen) {
      try {
        const r = await fetch('/api/coach/pay/charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: l.playerId, bookingId: l.bookingId, kind: l.kind, amountPennies: l.amount }) })
        const d = await r.json()
        if (d.ok) ok++; else { failed++; firstError ||= d.error || '' }
      } catch { failed++; firstError ||= 'You appear to be offline.' }
    }
    await reloadWallet()
    setPicked(null); setBusy(false)
    setMsg(!failed ? { text: `✓ ${ok} ${ok === 1 ? 'payment' : 'payments'} taken.` }
      : !ok ? { text: firstError || 'Nothing was taken.', bad: true }
      : { text: `${ok} taken, ${failed} did not go through. The reasons are shown against each lesson.`, bad: true })
  }

  const th: CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', whiteSpace: 'nowrap' }
  const td: CSSProperties = { fontSize: 12, color: T.text2, padding: '8px', borderTop: `1px solid ${T.border}`, fontVariantNumeric: 'tabular-nums' }
  const tone = { good: T.good, warn: T.warn, bad: T.bad, muted: T.text3 }

  return (
    <div data-testid="ready-to-charge" style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Card payments</div>
        <span style={{ fontSize: 11.5, color: T.text3 }}>
          {policy.autoCharge ? `Lessons are charged automatically ${policy.hours} hours before they start. Anything missed is here.` : 'Lessons that have happened and are not paid yet, for players with a card on file.'}
        </span>
      </div>
      {lines.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3 }}>Nothing waiting to be charged.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr><th style={th} /><th style={th}>Player</th><th style={th}>Lesson</th><th style={th}>For</th><th style={th}>Amount</th><th style={th}>From</th></tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.key}>
                  <td style={{ ...td, width: 30 }}><input type="checkbox" aria-label={`Charge ${l.who} ${l.when}`} checked={sel.has(l.key)} onChange={() => toggle(l.key)} style={{ width: 17, height: 17, accentColor: accent.hex }} /></td>
                  <td style={{ ...td, color: T.text, fontWeight: 600 }}>{l.who}</td>
                  <td style={td}>{l.when}</td>
                  <td style={td}>{l.kind === 'late_cancel' ? 'Late cancellation' : 'Lesson'}{l.failed && <div style={{ fontSize: 11, color: T.bad, whiteSpace: 'normal', maxWidth: 260 }}>Last try failed: {l.failed}</div>}</td>
                  <td style={{ ...td, color: T.text }}>{formatPennies(l.amount)}</td>
                  <td style={{ ...td, color: T.text3, whiteSpace: 'nowrap' }}>{l.card}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={run} disabled={busy || !chosen.length}
              style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 38, fontSize: 12.5, fontWeight: 700, cursor: busy || !chosen.length ? 'not-allowed' : 'pointer', opacity: busy || !chosen.length ? 0.5 : 1, fontFamily: FONT }}>
              {busy ? 'Charging…' : chosen.length ? `Charge ${chosen.length} · ${formatPennies(total)}` : 'Tick what to charge'}
            </button>
            {msg && <span role="status" style={{ fontSize: 12, color: msg.bad ? T.bad : T.good }}>{msg.text}</span>}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Recent</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.map(c => {
              const st = chargeState(c)
              return (
                <div key={c.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.text2 }}>
                  <span style={{ color: T.text3, minWidth: 74 }}>{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}</span>
                  <span style={{ flex: 1, minWidth: 160 }}>{c.description || c.player_name}</span>
                  <span style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{formatPennies(c.amount_pennies)}</span>
                  <span style={{ color: tone[st.tone], fontWeight: 700, minWidth: 90 }}>{st.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
