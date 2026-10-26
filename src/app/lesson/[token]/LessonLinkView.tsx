'use client'

// The family's side of the reminder link. Opening "I'll be there" confirms
// straight away (it changes nothing that costs money). "I can't make it" never
// cancels on opening: it shows what cancelling means first, then asks.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const ACCENT = '#3A8EE0'
type View = {
  academy: string; logoUrl: string | null; player: string
  lesson: { date: string; time: string | null; mins: number; type: string | null; court: string | null; when: string }
  status: 'upcoming' | 'cancelled' | 'started'
  confirmed: { at: string; by: string | null } | null
  cancel: { free: boolean; words: string; confirm: string }
  notice?: string; error?: string
}
const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const btn = (kind: 'primary' | 'ghost' | 'danger'): CSSProperties => ({
  appearance: 'none', width: '100%', borderRadius: 12, padding: '14px 18px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  border: kind === 'primary' ? 0 : `1px solid ${kind === 'danger' ? '#dc2626' : '#d1d5db'}`,
  background: kind === 'primary' ? ACCENT : '#fff', color: kind === 'primary' ? '#fff' : kind === 'danger' ? '#dc2626' : '#1a1d29',
})

export default function LessonLinkView({ token, want }: { token: string; want: 'confirm' | 'cancel' | null }) {
  const [v, setV] = useState<View | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [asking, setAsking] = useState(want === 'cancel')
  const ran = useRef(false)
  const post = async (action: 'confirm' | 'cancel') => {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/lesson/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { setV(d); setMsg({ text: d.notice || 'Done.' }); setAsking(false) } else setMsg({ text: d.error || 'That did not work.', bad: true })
    } catch { setMsg({ text: 'You appear to be offline. Nothing was changed.', bad: true }) }
    setBusy(false)
  }
  useEffect(() => {
    fetch(`/api/lesson/${encodeURIComponent(token)}`).then(r => r.json()).then((d: View) => {
      setV(d)
      if (!ran.current && want === 'confirm' && d.status === 'upcoming' && !d.confirmed) { ran.current = true; void post('confirm') }
    }).catch(() => setV({ error: 'We could not load this page.' } as View))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const page = (children: ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 28px', textAlign: 'center', color: '#fff' }}>
        {!!v?.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.logoUrl} alt="" style={{ height: 50, maxWidth: 180, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8 }} />
          </div>
        )}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{v?.academy || 'Tennis'}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{v?.player ? `${v.player}’s lesson` : 'Your lesson'}</h1>
      </div>
      <div style={{ maxWidth: 520, margin: '-16px auto 0', padding: '0 16px' }}>{children}</div>
    </div>
  )
  if (!v) return page(<div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>Loading…</div>)
  if (v.error && !v.lesson) return page(<div style={{ ...card, textAlign: 'center', color: '#374151' }}>{v.error}</div>)
  const l = v.lesson
  return page(
    <>
      <div style={card}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29' }}>{l.when}</div>
        <div style={{ fontSize: 14.5, color: '#4b5563', marginTop: 4 }}>{[`${l.mins} minutes`, l.type && !/^private$/i.test(l.type) ? l.type : '', l.court].filter(Boolean).join(' · ')}</div>
        {v.status === 'cancelled' && <div style={{ marginTop: 12, fontSize: 15, color: '#b45309', fontWeight: 700 }}>This lesson is cancelled.</div>}
        {v.status === 'started' && <div style={{ marginTop: 12, fontSize: 15, color: '#6b7280' }}>This lesson has already started.</div>}
        {v.status === 'upcoming' && v.confirmed && <div style={{ marginTop: 12, fontSize: 15, color: '#15803d', fontWeight: 700 }}>✓ Your coach knows you’ll be there.</div>}
      </div>
      {v.status === 'upcoming' && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!v.confirmed && !asking && <button onClick={() => post('confirm')} disabled={busy} style={btn('primary')}>{busy ? 'Saving…' : 'I’ll be there'}</button>}
          {!asking ? (
            <button onClick={() => setAsking(true)} disabled={busy} style={btn('ghost')}>I can’t make it</button>
          ) : (
            <>
              <div style={{ fontSize: 15, color: v.cancel.free ? '#374151' : '#b45309', lineHeight: 1.55 }}>{v.cancel.words}</div>
              <button onClick={() => post('cancel')} disabled={busy} style={btn('danger')}>{busy ? 'Cancelling…' : v.cancel.free ? 'Cancel the lesson' : 'Cancel it anyway'}</button>
              <button onClick={() => setAsking(false)} disabled={busy} style={btn('ghost')}>Keep the lesson</button>
            </>
          )}
        </div>
      )}
      {msg && <div role="status" style={{ ...card, color: msg.bad ? '#dc2626' : '#15803d', fontSize: 15 }}>{msg.text}</div>}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#9aa1ad', marginTop: 18 }}>To move the lesson instead, reply to your coach’s email.</div>
    </>,
  )
}
