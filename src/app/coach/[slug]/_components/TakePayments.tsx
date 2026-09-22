'use client'

// Stripe Connect onboarding — "Take payments".
//
// Pulled out of CoachDevelopmentSettings so it can live where a coach actually
// looks for it. It used to sit inside the "Coaching, rewards & modules" modal,
// alongside racket criteria and module toggles, while the Payments page told
// coaches to find it under "Settings → Payments & Packages". Nobody goes looking
// for their bank details under coaching rewards.
//
// Money goes straight to the coach's own Stripe account (direct charges), so no
// card details ever pass through Lumio.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { V2_LABEL, V2_NOTES } from '@/lib/coach/v2'

export function TakePayments({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [conn, setConn] = useState<'unknown' | 'no' | 'yes'>('unknown')
  const [connecting, setConnecting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/coach/pay/status')
      .then(r => r.json())
      .then(d => setConn(d.chargesEnabled ? 'yes' : 'no'))
      .catch(() => setConn('no'))
  }, [])

  // Kept, not deleted: turning card payments on for V2 is restoring the button
  // below, not rewriting the onboarding call.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const connect = async () => {
    if (connecting) return
    setConnecting(true); setErr('')
    try {
      const r = await fetch('/api/coach/pay/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: window.location.pathname }),
      })
      const d = await r.json()
      if (d.url) { window.location.href = d.url; return }
      setErr(d.error || 'Could not start Stripe onboarding.')
      setConnecting(false)
    } catch {
      setErr('Could not start Stripe onboarding.')
      setConnecting(false)
    }
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>Take payments</div>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: T.text3, lineHeight: 1.55 }}>
        In V2 you&rsquo;ll connect your bank and take card, Apple Pay and Google Pay payments — straight into your
        own account, not ours, with none of the details ever touching Lumio. Everything else on the Payments
        page works today: what is owed, what has been paid, chasers and reports.
      </p>

      {/* Founders access does not take card payments — see lib/coach/v2.ts. A
          coach who already connected their bank keeps it (nothing is torn out),
          but nobody is invited to spend ten minutes on Stripe onboarding for
          something that will not take a payment until V2. */}
      {conn === 'yes' ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${T.good}1a`, border: `1px solid ${T.good}55`, color: T.good, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 700 }}>
          ✓ Connected — ready for when card payments go live
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 13px' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '3px 9px' }}>{V2_LABEL}</span>
          <span style={{ flex: 1, minWidth: 220, fontSize: 12, color: T.text2, lineHeight: 1.55 }}>{V2_NOTES.payments}</span>
        </div>
      )}

      {err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>{err}</div>}
    </div>
  )
}
