'use client'

// A free slot, from the client's side: what it is, and one tap to take it.
// Light, like the booking page: opened from an email on a phone.

import { useEffect, useState, type CSSProperties } from 'react'

const ACCENT = '#3A8EE0'

type View = {
  academy: string; coachName: string | null; logoUrl: string | null; playerFirst: string
  date: string; time: string; durMin: number; type: string
  venue: { name: string; address: string | null } | null; court: string | null; note: string | null
  when: string; state: 'open' | 'yours' | 'gone' | 'closed'; response: string | null; subscribed: boolean
  stopped?: boolean; booked?: boolean; error?: string
}

const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const btn: CSSProperties = { appearance: 'none', width: '100%', border: 0, borderRadius: 12, padding: '15px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

export default function SlotView({ token }: { token: string }) {
  const [v, setV] = useState<View | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/slot/${encodeURIComponent(token)}`).then(r => r.json()).then(setV).catch(() => setV({ error: 'We could not load this page.' } as View))
  }, [token])

  const act = async (action: 'accept' | 'decline' | 'stop') => {
    if (busy) return
    setBusy(action); setErr('')
    try {
      const r = await fetch(`/api/slot/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const d = await r.json()
      if (d.error && !d.state) setErr(d.error); else setV(d)
    } catch { setErr('Something went wrong. Check your connection and try again.') }
    finally { setBusy('') }
  }

  const who = v?.coachName || v?.academy || 'Your coach'
  const page = (title: string, children: React.ReactNode) => (
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

  if (!v) return page('A free slot', <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>Loading…</div>)
  if (v.error && !v.when) return page('A free slot', <div style={{ ...card, textAlign: 'center', color: '#374151' }}>{v.error} Ask your coach to send it again.</div>)

  const details = (
    <div style={card}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29' }}>{v.when}</div>
      <div style={{ fontSize: 15, color: '#374151', marginTop: 6 }}>{v.durMin} minutes · {/^private$/i.test(v.type) ? 'Private lesson' : v.type} with {who}</div>
      {v.venue && <div style={{ fontSize: 14.5, color: '#6b7280', marginTop: 4 }}>{v.venue.name}{v.court ? `, ${v.court}` : ''}{v.venue.address ? ` · ${v.venue.address}` : ''}</div>}
      {v.note && <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.6, margin: '10px 0 0' }}>{v.note}</p>}
    </div>
  )

  const stop = v.subscribed && !v.stopped ? (
    <p style={{ textAlign: 'center', marginTop: 18 }}>
      <button onClick={() => act('stop')} disabled={!!busy} style={{ appearance: 'none', border: 0, background: 'transparent', color: '#6b7280', textDecoration: 'underline', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>{busy === 'stop' ? 'Stopping…' : 'Stop free-slot emails'}</button>
    </p>
  ) : v.stopped ? <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13.5, marginTop: 18 }}>You won’t get free-slot emails from {v.academy} any more.</p> : null

  if (v.state === 'yours') return page('It’s yours', <>{details}<div style={{ ...card, textAlign: 'center' }}><div style={{ fontSize: 36 }}>🎾</div><p style={{ fontSize: 15.5, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>You’re booked in{v.playerFirst ? ` for ${v.playerFirst}` : ''}. A confirmation is on its way by email. See you on court!</p></div>{stop}</>)
  if (v.state === 'gone') return page('Sorry, it’s gone', <>{details}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>Somebody else took this slot first. {who} will let you know about the next one.</div>{stop}</>)
  if (v.state === 'closed') return page('This offer has closed', <>{details}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>This slot is no longer on offer. Message {who} if you would like a lesson.</div>{stop}</>)
  if (v.response === 'declined') return page('No problem', <>{details}<div style={{ ...card, textAlign: 'center', color: '#374151', fontSize: 15, lineHeight: 1.6 }}>Thanks for letting {who} know.<div style={{ marginTop: 12 }}><button onClick={() => act('accept')} disabled={!!busy} style={{ ...btn, background: ACCENT, color: '#fff' }}>{busy === 'accept' ? 'Booking…' : 'Actually, I’d like it'}</button></div></div>{stop}</>)

  return page('A free slot', <>
    {details}
    <div style={card}>
      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: '0 0 14px' }}>Would you like it{v.playerFirst ? ` for ${v.playerFirst}` : ''}? The first person to say yes gets it, and it goes straight into {who}’s diary.</p>
      {err && <div role="alert" style={{ fontSize: 14, color: '#b42318', marginBottom: 10 }}>{err}</div>}
      <button onClick={() => act('accept')} disabled={!!busy} style={{ ...btn, background: ACCENT, color: '#fff', opacity: busy ? 0.7 : 1 }}>{busy === 'accept' ? 'Booking…' : 'Yes, book it'}</button>
      <button onClick={() => act('decline')} disabled={!!busy} style={{ ...btn, marginTop: 8, background: '#fff', color: '#374151', border: '1px solid #dfe3ec', fontWeight: 700 }}>{busy === 'decline' ? '…' : 'No thanks'}</button>
    </div>
    {stop}
  </>)
}
