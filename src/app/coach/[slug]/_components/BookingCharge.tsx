'use client'

// Taking a lesson's money — the strip at the bottom of an existing booking.
//
// Shows what has been charged for this lesson, and offers the next sensible
// thing: charge the saved card for the lesson, charge a late-cancellation fee
// when it was cancelled inside the window, give money back when the coach
// called it off. Every amount on a button is the amount that will be taken.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useWallet, reloadWallet, savedFor, chargesFor, methodLabel, chargeState, type PayCharge } from '../_lib/pay-wallet'
import { readPolicy, isLateCancel, feeFor, ukLocalToMs } from '@/lib/coach/cancel-policy'
import { priceFor, type ClientRate, type PriceRule } from '@/lib/coach/pricing'
import { formatPennies } from '@/lib/coach/money'

type Bk = { id: string; player_id?: string | null; player_name?: string | null; status?: string | null; type?: string | null; booking_date?: string | null; start_time?: string | null; duration_min?: number | null; venue_id?: string | null; price_pennies?: number | null; headcount?: number | null; cancelled_at?: string | null }

export function BookingCharge({ T, accent, booking, settings, client }: {
  T: ThemeTokens; accent: AccentTokens; booking: Bk
  settings: { priceList?: PriceRule[]; privateRate?: number; cancelPolicy?: unknown }
  client: ClientRate
}) {
  const { wallet, loading } = useWallet({ fresh: true })
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ text: string; bad?: boolean; link?: string } | null>(null)
  if (loading || !wallet.chargesEnabled || !booking.player_id || booking.type === 'Block') return null

  const policy = readPolicy(settings.cancelPolicy)
  const card = savedFor(wallet, booking.player_id)
  const charges = chargesFor(wallet, booking.id)
  const live = (k: string) => charges.find(c => c.kind === k && ['paid', 'processing', 'charging'].includes(c.status))
  const price = priceFor(booking, { rules: settings.priceList || [], client, defaultHourly: settings.privateRate })
  const base = price.each != null && price.people > 1 ? price.each : price.total
  const who = (booking.player_name || 'They').split(/\s+/)[0]
  const cancelled = booking.status === 'cancelled'
  const late = cancelled && isLateCancel(booking, policy)
  const started = booking.booking_date ? ukLocalToMs(booking.booking_date, (booking.start_time || '00:00').slice(0, 5)) <= Date.now() : false

  const offers: { kind: 'lesson' | 'late_cancel' | 'no_show'; label: string; amount: number }[] = []
  if (!cancelled && !live('lesson') && !live('no_show') && base > 0) offers.push({ kind: 'lesson', label: 'Charge for the lesson', amount: base })
  if (!cancelled && started && !live('lesson') && !live('no_show') && policy.noShowPct < 100 && feeFor(base, policy.noShowPct) > 0) offers.push({ kind: 'no_show', label: 'They did not turn up', amount: feeFor(base, policy.noShowPct) })
  if (late && !live('late_cancel') && feeFor(base, policy.lateChargePct) > 0) offers.push({ kind: 'late_cancel', label: 'Late cancellation fee', amount: feeFor(base, policy.lateChargePct) })

  const charge = async (kind: string, amount: number) => {
    if (busy || !card) return
    if (!confirm(`Take ${formatPennies(amount)} from ${who}’s ${methodLabel(card)}?`)) return
    setBusy(kind); setMsg(null)
    try {
      const r = await fetch('/api/coach/pay/charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: booking.player_id, bookingId: booking.id, kind, amountPennies: amount }) })
      const d = await r.json()
      if (d.ok) setMsg({ text: d.status === 'processing' ? `✓ Direct Debit started for ${formatPennies(amount)}. It takes about three working days.` : `✓ ${formatPennies(amount)} taken.` })
      else setMsg({ text: d.error || 'The payment did not go through.', bad: true, ...(d.needsClient ? { link: kind } : {}) })
      await reloadWallet()
    } catch { setMsg({ text: 'You appear to be offline. Nothing was charged.', bad: true }) }
    finally { setBusy('') }
  }
  // When the bank wants the client to confirm it themselves: a payment link.
  const paymentLink = async (kind: string, amount: number) => {
    setBusy('link')
    try {
      const r = await fetch('/api/coach/pay/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount / 100, description: `${kind === 'late_cancel' ? 'Late cancellation' : 'Lesson'} · ${booking.player_name || ''}`.trim(), player_name: booking.player_name, booking_id: booking.id, kind, returnPath: '/' }) })
      const d = await r.json()
      if (!d.url) { setMsg({ text: d.error || 'The payment link could not be made.', bad: true }); return }
      try { await navigator.clipboard.writeText(d.url) } catch { /* shown below */ }
      setMsg({ text: `Payment link copied. Send it to ${who}: ${d.url}` })
    } catch { setMsg({ text: 'You appear to be offline.', bad: true }) }
    finally { setBusy('') }
  }
  const refund = async (c: PayCharge) => {
    const left = c.amount_pennies - (c.refunded_pennies || 0)
    if (busy || !confirm(`Give ${who} back ${formatPennies(left)}? It goes back to the card or account it came from.`)) return
    setBusy(`refund-${c.id}`); setMsg(null)
    try {
      const r = await fetch('/api/coach/pay/charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refund: c.id }) })
      const d = await r.json()
      setMsg(d.ok ? { text: `✓ ${formatPennies(d.refunded)} refunded.` } : { text: d.error || 'The refund did not go through.', bad: true })
      await reloadWallet()
    } catch { setMsg({ text: 'You appear to be offline. Nothing was refunded.', bad: true }) }
    finally { setBusy('') }
  }

  const btn: CSSProperties = { appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '0 12px', minHeight: 36, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }
  const ghost: CSSProperties = { ...btn, background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, fontWeight: 600 }
  const tone = { good: T.good, warn: T.warn, bad: T.bad, muted: T.text3 }

  return (
    <div data-testid="booking-charge" style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: FONT }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3 }}>Payment</div>
      {charges.map(c => {
        const st = chargeState(c)
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontWeight: 600 }}>{formatPennies(c.amount_pennies)}</span>
            <span style={{ color: T.text3 }}>{c.kind === 'late_cancel' ? 'late cancellation' : c.kind === 'no_show' ? 'missed lesson' : 'lesson'}{c.charged_by === 'auto' ? ' · taken automatically' : ''}</span>
            <span style={{ color: tone[st.tone], fontWeight: 700 }}>{st.text}</span>
            {c.status === 'failed' && c.failure_reason && <span style={{ flexBasis: '100%', color: T.text3, fontSize: 11.5 }}>{c.failure_reason}</span>}
            {c.status === 'paid' && <button onClick={() => refund(c)} disabled={!!busy} style={{ ...ghost, marginLeft: 'auto', minHeight: 30 }}>{busy === `refund-${c.id}` ? 'Refunding…' : cancelled && policy.rainOff === 'refund' ? 'Refund (you cancelled)' : 'Refund'}</button>}
          </div>
        )
      })}
      {!card ? (
        <div style={{ fontSize: 12, color: T.text3 }}>{who} has no card on file. Send them a card link from their profile in Player Roster.</div>
      ) : offers.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {offers.map(o => (
            <button key={o.kind} onClick={() => charge(o.kind, o.amount)} disabled={!!busy} style={o.kind === 'lesson' ? btn : ghost}>
              {busy === o.kind ? 'Charging…' : `${o.label} · ${formatPennies(o.amount)}`}
            </button>
          ))}
          <span style={{ alignSelf: 'center', fontSize: 11, color: T.text3 }}>from {methodLabel(card)}</span>
        </div>
      ) : !charges.length ? (
        <div style={{ fontSize: 12, color: T.text3 }}>
          {cancelled ? (late ? 'Cancelled late, but your policy does not charge for it.' : `Cancelled with notice, so there is nothing to charge.`) : base <= 0 ? 'This lesson has no price, so there is nothing to charge. Set your prices in Settings → Pricing & packages.' : ''}
        </div>
      ) : null}
      {msg && (
        <div role="status" style={{ fontSize: 11.5, color: msg.bad ? T.bad : T.good, overflowWrap: 'anywhere' }}>
          {msg.text}
          {msg.link && <button onClick={() => { const o = offers.find(x => x.kind === msg.link); if (o) void paymentLink(o.kind, o.amount) }} disabled={!!busy} style={{ ...ghost, marginLeft: 8, minHeight: 28 }}>{busy === 'link' ? 'Making…' : 'Make a payment link'}</button>}
        </div>
      )}
    </div>
  )
}
