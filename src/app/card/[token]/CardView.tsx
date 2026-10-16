'use client'

// Saving a card with a coach, from the client's side.
//
// Two things happen here and the order matters: the client READS the
// cancellation policy and says yes to it, and only then goes to Stripe's
// secure page to type their card. The policy they agreed to is kept, word for
// word, with the card — that is what makes a late-cancellation charge fair
// later on, and what the coach can point to if it is ever questioned.
//
// Light, like the booking page: opened from an email on a phone.

import { useEffect, useState, type CSSProperties } from 'react'

const ACCENT = '#3A8EE0'

type Head = {
  academy: string; logoUrl: string | null; playerFirst: string
  terms: { title: string; text: string }[]; hours: number; directDebit: boolean; ready: boolean
  saved: { kind: string; brand: string | null; last4: string | null } | null
  error?: string
}

const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const label: CSSProperties = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 10 }
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #dfe3ec', borderRadius: 10, padding: '11px 13px', fontSize: 16, color: '#1a1d29', background: '#fff', outline: 'none', fontFamily: 'inherit' }
const cap = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const describe = (s: { kind: string; brand: string | null; last4: string | null }) =>
  s.kind === 'bacs_debit' ? `Direct Debit from the account ending ${s.last4 || '••••'}` : `${cap(s.brand) || 'Card'} ending ${s.last4 || '••••'}`

export default function CardView({ token }: { token: string }) {
  const [head, setHead] = useState<Head | null>(null)
  const [agree, setAgree] = useState(false)
  const [name, setName] = useState('')
  const [method, setMethod] = useState<'card' | 'bacs_debit'>('card')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [finished, setFinished] = useState<null | { kind: string; brand: string | null; last4: string | null }>(null)
  const [checking, setChecking] = useState(false)
  const [again, setAgain] = useState(false)

  useEffect(() => {
    let alive = true
    const done = new URLSearchParams(window.location.search).get('done')
    fetch(`/api/card/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((d: Head) => { if (alive) setHead(d) })
      .catch(() => { if (alive) setHead({ error: 'We could not load this page.' } as Head) })
    if (done) {
      setChecking(true)
      fetch(`/api/card/${encodeURIComponent(token)}/done`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: done }) })
        .then(r => r.json())
        .then(d => { if (!alive) return; if (d.ok && d.saved) setFinished(d.saved); else setErr(d.error || 'Your details were not saved. Please try again.') })
        .catch(() => { if (alive) setErr('We could not check that your details were saved. Refresh this page in a moment.') })
        .finally(() => { if (alive) setChecking(false) })
      // Tidy the address bar so a refresh does not resubmit.
      window.history.replaceState(null, '', window.location.pathname)
    }
    return () => { alive = false }
  }, [token])

  const go = async () => {
    if (busy) return
    if (!agree) { setErr('Please tick the box to agree to the cancellation policy.'); return }
    if (name.trim().length < 2) { setErr('Please type your full name.'); return }
    setBusy(true); setErr('')
    try {
      const r = await fetch(`/api/card/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agree: true, name: name.trim(), method }) })
      const d = await r.json()
      if (!r.ok || !d.url) { setErr(d.error || 'We could not open the secure page. Please try again.'); setBusy(false); return }
      window.location.href = d.url
    } catch { setErr('We could not open the secure page. Check your connection and try again.'); setBusy(false) }
  }

  const page = (title: string, children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 28px', textAlign: 'center', color: '#fff' }}>
        {!!head?.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={head.logoUrl} alt="" style={{ height: 50, maxWidth: 180, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8 }} />
          </div>
        )}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{head?.academy || 'Tennis'}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{title}</h1>
      </div>
      <div style={{ maxWidth: 560, margin: '-16px auto 0', padding: '0 16px' }}>{children}</div>
    </div>
  )

  if (!head || checking) return page('Your payment details', <div style={{ ...card, textAlign: 'center', color: '#6b7280', fontSize: 14.5 }}>{checking ? 'Checking your details were saved…' : 'Loading…'}</div>)

  if (head.error) {
    return page('Your payment details', (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1d29' }}>This link isn’t open</div>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>{head.error}</p>
      </div>
    ))
  }

  if (finished) {
    return page('All saved', (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 38 }}>✅</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#1a1d29', marginTop: 8 }}>{describe(finished)}</div>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 10 }}>
          {head.academy} will take payment for {head.playerFirst ? `${head.playerFirst}’s` : 'your'} lessons from this, in line with the cancellation policy you agreed to. You can close this page.
        </p>
      </div>
    ))
  }

  if (head.saved && !again) {
    return page('Your payment details', (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1d29' }}>{describe(head.saved)} is saved</div>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>{head.academy} already has payment details for {head.playerFirst || 'you'}.</p>
        <button onClick={() => setAgain(true)} style={{ appearance: 'none', marginTop: 8, border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, borderRadius: 12, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Use a different card</button>
      </div>
    ))
  }

  return page(head.directDebit ? 'Save your payment details' : 'Save your card', (
    <>
      <div style={card}>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0 }}>
          Save {head.directDebit ? 'a card or a Direct Debit' : 'a card'} with {head.academy} for {head.playerFirst ? `${head.playerFirst}’s` : 'your'} lessons. First, please read how cancellations work.
        </p>
      </div>
      <div style={card}>
        <div style={label}>Cancellation policy</div>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {head.terms.map(t => (
            <li key={t.title} style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.55 }}><strong style={{ color: '#1a1d29' }}>{t.title}.</strong> {t.text}</li>
          ))}
        </ol>
      </div>
      <div style={card}>
        {!head.ready ? (
          <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{head.academy} cannot take payment details just yet. Please try this link again later.</p>
        ) : <>
          {head.directDebit && (
            <div style={{ marginBottom: 14 }}>
              <div style={label}>How would you like to pay?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([['card', 'Card'], ['bacs_debit', 'Direct Debit']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setMethod(k)} aria-pressed={method === k}
                    style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${method === k ? ACCENT : '#dfe3ec'}`, background: method === k ? ACCENT : '#fff', color: method === k ? '#fff' : '#1a1d29', borderRadius: 12, padding: '12px 8px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>{l}</button>
                ))}
              </div>
              {method === 'bacs_debit' && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: '8px 0 0' }}>Payments by Direct Debit take about three working days to leave your account. You are protected by the Direct Debit Guarantee.</p>}
            </div>
          )}
          <label htmlFor="card-name" style={{ ...label, display: 'block' }}>Your full name</label>
          <input id="card-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="As it appears on the card or account" style={input} />
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, fontSize: 14.5, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
            <span>I have read and agree to {head.academy}’s cancellation policy, and I allow {head.academy} to take payment for lessons from these details in line with it.</span>
          </label>
          {err && <div role="alert" style={{ marginTop: 12, fontSize: 14, color: '#b42318' }}>{err}</div>}
          <button onClick={go} disabled={busy}
            style={{ appearance: 'none', width: '100%', marginTop: 16, border: 0, background: ACCENT, color: '#fff', borderRadius: 12, padding: '15px 20px', fontSize: 16, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1, fontFamily: 'inherit' }}>
            {busy ? 'Opening the secure page…' : method === 'bacs_debit' ? 'Continue to set up Direct Debit' : 'Continue to save my card'}
          </button>
          <p style={{ fontSize: 12.5, color: '#9aa1ad', lineHeight: 1.5, margin: '12px 0 0', textAlign: 'center' }}>
            Your details go straight to Stripe, the payment company. {head.academy} and Lumio never see your full card or account number.
          </p>
        </>}
      </div>
    </>
  ))
}
