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
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

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
        Connect your bank to take card, Apple Pay and Google Pay payments. The money goes straight into your
        own account, not ours — you enter your bank details on Stripe&rsquo;s own pages, and none of them ever
        touch Lumio.
      </p>

      {conn === 'yes' ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${T.good}1a`, border: `1px solid ${T.good}55`, color: T.good, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 700 }}>
          ✓ Connected — payments land in your bank
        </div>
      ) : (
        <button onClick={connect} disabled={connecting || conn === 'unknown'}
          style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: connecting || conn === 'unknown' ? 'default' : 'pointer', fontFamily: FONT, opacity: connecting || conn === 'unknown' ? 0.6 : 1 }}>
          {connecting ? 'Opening Stripe…' : conn === 'unknown' ? 'Checking…' : '🔗 Connect your bank'}
        </button>
      )}

      {err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>{err}</div>}

      {conn === 'no' && !connecting && (
        <div style={{ fontSize: 11, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>
          Takes a couple of minutes. Stripe asks for your name, address, date of birth and bank account —
          the same checks any card processor has to make.
        </div>
      )}
    </div>
  )
}
