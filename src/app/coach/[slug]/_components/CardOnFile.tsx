'use client'

// A player's card (or Direct Debit) on file — the strip on their profile.
//
// The coach never types a client's card. They send a link; the client reads
// the cancellation policy, agrees, and saves the card on Stripe's own page
// (/card/<token>). This strip shows where that has got to and lets the coach
// send the link, copy it, or take a saved card off file.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useWallet, reloadWallet, savedFor, invitedFor, methodLabel } from '../_lib/pay-wallet'

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }) : '')

export function CardOnFile({ T, accent, player, pad }: {
  T: ThemeTokens; accent: AccentTokens; pad: number
  player: { id: string; name: string; email?: string | null; parent_email?: string | null; contact_email?: string | null }
}) {
  const { wallet, loading } = useWallet()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  if (loading) return null

  const saved = savedFor(wallet, player.id)
  const invited = invitedFor(wallet, player.id)
  const to = player.parent_email || player.email || player.contact_email || ''
  const first = player.name.split(/\s+/)[0]

  const send = async (sendIt: boolean) => {
    if (busy) return
    setBusy(sendIt ? 'send' : 'copy'); setMsg(null)
    try {
      const r = await fetch('/api/coach/pay/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: player.id, send: sendIt }) })
      const d = await r.json()
      if (!r.ok) { setMsg({ text: d.error || 'The link could not be made. Please try again.', bad: true }); return }
      if (!sendIt) {
        try { await navigator.clipboard.writeText(d.url); setMsg({ text: 'Link copied. Send it to them however suits you.' }) }
        catch { setMsg({ text: `Copy this link: ${d.url}` }) }
      } else setMsg(d.sent ? { text: `✓ Sent to ${d.to}.` } : { text: 'The link was made but the email did not send. Copy the link and send it yourself.', bad: true })
      await reloadWallet()
    } catch { setMsg({ text: 'You appear to be offline. Nothing was sent.', bad: true }) }
    finally { setBusy('') }
  }
  const remove = async () => {
    if (!saved || busy) return
    if (!confirm(`Take ${methodLabel(saved)} off file for ${player.name}?\n\nNothing already charged changes. To take payments from them again, they will need to save their details again.`)) return
    setBusy('remove'); setMsg(null)
    try {
      const r = await fetch(`/api/coach/pay/cards?id=${encodeURIComponent(saved.id)}`, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) setMsg({ text: d.error || 'The card could not be removed. Please try again.', bad: true })
      else { setMsg({ text: 'Removed.' }); await reloadWallet() }
    } catch { setMsg({ text: 'You appear to be offline. Nothing was changed.', bad: true }) }
    finally { setBusy('') }
  }

  const btn: CSSProperties = { appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, color: T.text2, padding: '0 10px', minHeight: 32, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
  const wrap: CSSProperties = { padding: `8px ${pad + 4}px`, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 5, fontFamily: FONT }
  const head = <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Card on file</div>

  if (!wallet.chargesEnabled) {
    return (
      <div data-testid="card-on-file" style={wrap}>
        {head}
        <div style={{ fontSize: 12, color: T.text3 }}>Connect your bank in Settings → Pricing &amp; packages, then {first} can save a card with you.</div>
      </div>
    )
  }

  return (
    <div data-testid="card-on-file" style={wrap}>
      {head}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
        {saved ? <>
          <span style={{ color: T.text, fontWeight: 600 }}>💳 {methodLabel(saved)}</span>
          <span style={{ color: T.text3 }}>
            · saved {day(saved.saved_at)}{saved.exp_month && saved.exp_year ? ` · expires ${String(saved.exp_month).padStart(2, '0')}/${String(saved.exp_year).slice(-2)}` : ''}
            {saved.policy_agreed_at ? ` · cancellation policy agreed${saved.agreed_by ? ` by ${saved.agreed_by}` : ''}` : ''}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => send(true)} disabled={!!busy || !to} title={to ? `Send ${to} a link to save a different card` : 'Add an email address to send a link'} style={btn}>{busy === 'send' ? 'Sending…' : 'Ask for a new card'}</button>
            <button onClick={remove} disabled={!!busy} style={{ ...btn, color: T.bad }}>{busy === 'remove' ? 'Removing…' : 'Remove'}</button>
          </span>
        </> : <>
          <span style={{ color: invited?.link_sent_at ? T.warn : T.text3 }}>
            {invited?.link_sent_at ? `Link sent to ${invited.link_sent_to} on ${day(invited.link_sent_at)}. Not saved yet.` : 'No card saved.'}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => send(true)} disabled={!!busy || !to} title={to ? `Email the link to ${to}` : 'Add an email address to their profile to send it'}
              style={{ ...btn, border: 0, background: accent.hex, color: T.btnText, opacity: !to ? 0.5 : 1 }}>{busy === 'send' ? 'Sending…' : invited?.link_sent_at ? 'Send again' : 'Send card link'}</button>
            <button onClick={() => send(false)} disabled={!!busy} style={btn}>{busy === 'copy' ? 'Copying…' : 'Copy link'}</button>
          </span>
        </>}
      </div>
      {!saved && !to && <div style={{ fontSize: 11, color: T.text3 }}>There is no email address on {first}’s profile. Add one to email the link, or copy it and send it yourself.</div>}
      {msg && <div role="status" style={{ fontSize: 11.5, color: msg.bad ? T.bad : T.good, overflowWrap: 'anywhere' }}>{msg.text}</div>}
    </div>
  )
}
