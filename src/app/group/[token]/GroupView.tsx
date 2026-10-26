'use client'

// A weekly group, from the client's side: this week's session, and yes or no.
// Light, like the free-slot page: opened from an email on a phone.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

const ACCENT = '#3A8EE0'

type View = {
  academy: string; coachName: string | null; logoUrl: string | null; playerFirst: string
  group: string; when: string; durMin: number
  venue: { name: string; address: string | null } | null; court: string | null
  price: number; placesLeft: number
  state: 'open' | 'past' | 'off'; answer: 'yes' | 'no' | null; late: boolean
  paid: 'paid' | 'processing' | 'refunded' | 'none'
  payWay: 'card' | 'link' | 'day'; card: string | null
  freeUntil: string | null; free: boolean; onPlan?: boolean
  notice?: string | null; error?: string
}

const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const btn: CSSProperties = { appearance: 'none', width: '100%', border: 0, borderRadius: 12, padding: '15px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const quiet: CSSProperties = { ...btn, marginTop: 8, background: '#fff', color: '#374151', border: '1px solid #dfe3ec', fontWeight: 700 }
const p = (x: number) => `£${(x / 100).toFixed(x % 100 ? 2 : 0)}`

export default function GroupView({ token }: { token: string }) {
  const [v, setV] = useState<View | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [hint, setHint] = useState<'yes' | 'no' | null>(null)
  const [paidBack, setPaidBack] = useState(false)

  const load = () => fetch(`/api/group/${encodeURIComponent(token)}`).then(r => r.json()).then(setV).catch(() => setV({ error: 'We could not load this page.' } as View))
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const a = q.get('a'); if (a === 'yes' || a === 'no') setHint(a)
    if (q.get('paid') === '1') { setPaidBack(true); setTimeout(() => { void load() }, 3000) }
    void load()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (action: 'yes' | 'no' | 'pay') => {
    if (busy) return
    setBusy(action); setErr('')
    try {
      const r = await fetch(`/api/group/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const d = await r.json()
      if (action === 'pay') { if (d.url) { window.location.href = d.url; return } setErr(d.error || 'The payment page could not be opened.'); return }
      if (d.error && !d.when) setErr(d.error); else { setV(d); setHint(null) }
    } catch { setErr('Something went wrong. Check your connection and try again.') }
    finally { setBusy('') }
  }

  const who = v?.coachName || v?.academy || 'Your coach'
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

  if (!v) return page('Are you coming?', <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>Loading…</div>)
  if (v.error && !v.when) return page('Are you coming?', <div style={{ ...card, textAlign: 'center', color: '#374151' }}>{v.error} Ask your coach to send it again.</div>)

  const details = (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '.08em' }}>{v.group}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29', marginTop: 4 }}>{v.when}</div>
      <div style={{ fontSize: 15, color: '#374151', marginTop: 6 }}>{v.durMin} minutes with {who}{v.price > 0 ? ` · ${p(v.price)}` : ''}</div>
      {v.venue && <div style={{ fontSize: 14.5, color: '#6b7280', marginTop: 4 }}>{v.venue.name}{v.court ? `, ${v.court}` : ''}{v.venue.address ? ` · ${v.venue.address}` : ''}</div>}
    </div>
  )
  const note = (v.notice || err) ? <div role={err ? 'alert' : 'status'} style={{ ...card, fontSize: 14.5, lineHeight: 1.55, color: err ? '#b42318' : '#374151' }}>{err || v.notice}</div> : null
  const payBits = v.onPlan ? 'Your place is covered by your monthly plan.' : v.price <= 0 ? '' : v.payWay === 'card' ? `Saying yes pays ${p(v.price)} from your saved ${v.card || 'card'}.` : v.payWay === 'link' ? `It is ${p(v.price)}, paid by card when you say yes.` : `It is ${p(v.price)}, paid to ${who} on the day.`
  const freeBits = v.freeUntil ? (v.free ? `Free to cancel until ${v.freeUntil}.` : 'The free cancellation window has closed, so a yes now is final.') : ''

  if (v.state === 'off') return page('This week is off', <>{details}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>{who} has called this session off.{v.paid === 'refunded' ? ' Your money has been refunded.' : ''} See you next week.</div></>)
  if (v.state === 'past') return page(v.answer === 'yes' ? 'See you there' : 'This session has started', <>{details}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>{v.answer === 'yes' ? 'You’re in.' : 'Answers have closed for this week. Look out for next week’s email.'}</div></>)

  if (v.answer === 'yes') {
    const unpaid = v.price > 0 && v.paid === 'none' && v.payWay !== 'day' && !v.onPlan
    return page(unpaid ? 'Your place is held' : 'You’re in', <>
      {details}
      {note}
      <div style={card}>
        <div style={{ textAlign: 'center', fontSize: 36 }}>🎾</div>
        <p style={{ fontSize: 15.5, color: '#374151', lineHeight: 1.6, margin: '6px 0 0', textAlign: 'center' }}>
          {v.playerFirst ? `${v.playerFirst} is` : 'You’re'} in.{' '}
          {v.onPlan ? 'Covered by your monthly plan.' : v.paid === 'paid' ? 'Paid, thank you.' : v.paid === 'processing' ? 'Your Direct Debit is on its way.' : unpaid ? (paidBack ? 'Thanks, your payment is being confirmed. This page updates in a moment.' : `Please pay ${p(v.price)} to finish.`) : v.price > 0 ? `Pay ${who} ${p(v.price)} on the day.` : ''}
        </p>
        {unpaid && !paidBack && <button onClick={() => act('pay')} disabled={!!busy} style={{ ...btn, marginTop: 14, background: ACCENT, color: '#fff', opacity: busy ? 0.7 : 1 }}>{busy === 'pay' ? 'Opening…' : `Pay ${p(v.price)} by card`}</button>}
        <p style={{ fontSize: 13.5, color: '#6b7280', textAlign: 'center', margin: '12px 0 0' }}>{v.free ? (v.freeUntil ? `Can’t come after all? Cancel free of charge until ${v.freeUntil}.` : 'Can’t come after all? Let us know below.') : 'The free cancellation window has closed. You can still tell us you’re not coming.'}</p>
        <button onClick={() => act('no')} disabled={!!busy} style={quiet}>{busy === 'no' ? '…' : 'I can’t come after all'}</button>
      </div>
    </>)
  }

  if (v.placesLeft <= 0) return page('This week is full', <>{details}{note}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>Every place has gone this week. If one comes free, this link will let you take it, so check back.</div></>)

  return page(v.answer === 'no' ? 'No problem' : 'Are you coming?', <>
    {details}
    {note}
    <div style={card}>
      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: '0 0 6px' }}>
        {v.answer === 'no' ? `Thanks for letting ${who} know. Changed your mind?` : v.playerFirst ? `Is ${v.playerFirst} coming this week?` : 'Are you coming this week?'}
      </p>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.55, margin: '0 0 14px' }}>
        {[payBits, freeBits].filter(Boolean).join(' ')} {v.placesLeft <= 3 ? `${v.placesLeft} ${v.placesLeft === 1 ? 'place' : 'places'} left.` : ''}
      </p>
      <button onClick={() => act('yes')} disabled={!!busy} style={{ ...btn, background: ACCENT, color: '#fff', opacity: busy ? 0.7 : 1, boxShadow: hint === 'yes' ? `0 0 0 4px ${ACCENT}44` : 'none' }}>
        {busy === 'yes' ? 'Saving…' : v.payWay === 'card' && v.price > 0 && !v.onPlan ? `Yes, I’m coming · pay ${p(v.price)}` : 'Yes, I’m coming'}
      </button>
      {v.answer !== 'no' && <button onClick={() => act('no')} disabled={!!busy} style={{ ...quiet, boxShadow: hint === 'no' ? '0 0 0 4px #dfe3ec' : 'none' }}>{busy === 'no' ? '…' : 'Can’t make it this week'}</button>}
    </div>
  </>)
}
