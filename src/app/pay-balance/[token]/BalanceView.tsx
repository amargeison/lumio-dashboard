'use client'

// Paying a camp or holiday balance, from the family's side. Light, like the
// other client pages: opened from an email on a phone.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

const ACCENT = '#3A8EE0'
type View = { academy: string; logoUrl: string | null; camp: string; player: string; owed: number; due: string | null; cancelled: boolean; card: string | null; ready: boolean; error?: string }
const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const p = (x: number) => `£${(x / 100).toLocaleString('en-GB', { minimumFractionDigits: x % 100 ? 2 : 0, maximumFractionDigits: 2 })}`

export default function BalanceView({ token }: { token: string }) {
  const [v, setV] = useState<View | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [back, setBack] = useState(false)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('paid') === '1') { setBack(true); window.history.replaceState(null, '', window.location.pathname) }
    fetch(`/api/camp/balance/${encodeURIComponent(token)}`).then(r => r.json()).then(setV).catch(() => setV({ error: 'We could not load this page.' } as View))
  }, [token])
  const pay = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      const r = await fetch(`/api/camp/balance/${encodeURIComponent(token)}`, { method: 'POST' })
      const d = await r.json()
      if (d.url) { window.location.href = d.url; return }
      setErr(d.error || 'The payment page could not be opened.')
    } catch { setErr('Something went wrong. Check your connection and try again.') }
    setBusy(false)
  }
  const page = (title: string, children: ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 28px', textAlign: 'center', color: '#fff' }}>
        {!!v?.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.logoUrl} alt="" style={{ height: 50, maxWidth: 180, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8 }} />
          </div>
        )}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{v?.academy || 'Tennis'}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{title}</h1>
      </div>
      <div style={{ maxWidth: 520, margin: '-16px auto 0', padding: '0 16px' }}>{children}</div>
    </div>
  )
  if (!v) return page('Your balance', <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>Loading…</div>)
  if (v.error && !v.camp) return page('Your balance', <div style={{ ...card, textAlign: 'center', color: '#374151' }}>{v.error}</div>)
  if (back || v.owed < 50) return page('Thank you', <div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15.5, lineHeight: 1.6 }}><div style={{ fontSize: 36 }}>🎾</div>{v.owed < 50 ? `${v.player}’s place on ${v.camp} is paid in full.` : `Thanks, your payment is being confirmed. ${v.player}’s place on ${v.camp} will show as paid in full shortly.`}</div>)
  if (v.cancelled) return page('Your balance', <div style={{ ...card, textAlign: 'center', color: '#374151' }}>This place has been cancelled, so there is nothing to pay.</div>)
  return page('Your balance', <>
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '.08em' }}>{v.camp}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1d29', marginTop: 6 }}>{p(v.owed)}</div>
      <div style={{ fontSize: 15, color: '#374151', marginTop: 4 }}>The balance for {v.player}’s place{v.due ? `, due ${v.due}` : ''}.</div>
      {v.card && <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '10px 0 0' }}>As you agreed, it will be taken from your {v.card}{v.due ? ` on ${v.due}` : ''}. You only need to pay here if you would rather pay now or use a different card.</p>}
    </div>
    <div style={card}>
      {!v.ready ? <p style={{ fontSize: 14.5, color: '#6b7280', margin: 0 }}>{v.academy} cannot take card payments just yet. Please contact them.</p> : <>
        {err && <div role="alert" style={{ fontSize: 14, color: '#b42318', marginBottom: 10 }}>{err}</div>}
        <button onClick={pay} disabled={busy} style={{ appearance: 'none', width: '100%', border: 0, background: ACCENT, color: '#fff', borderRadius: 12, padding: '15px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.7 : 1, fontFamily: 'inherit' }}>{busy ? 'Opening the secure page…' : `Pay ${p(v.owed)} by card`}</button>
        <p style={{ fontSize: 12.5, color: '#9aa1ad', textAlign: 'center', margin: '10px 0 0' }}>Your card details go straight to Stripe, the payment company.</p>
      </>}
    </div>
  </>)
}
