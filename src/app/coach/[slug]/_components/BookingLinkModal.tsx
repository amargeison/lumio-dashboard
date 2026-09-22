'use client'

// "Send a booking link" — the answer to an inbox full of "any chance of a
// lesson this week?"
//
// What it replaces: read the email, open the calendar, work out what is free,
// type the booking in, reply to say when it is. Four screens, a day's delay, and
// the coach is the bottleneck in every step of it. The link moves the choosing
// to the person who actually knows when they are free, and the booking lands in
// the diary with the confirmations already sent.
//
// Two ways out of this box, because there are two situations:
//   · someone specific asked  → pick them (or type an address) and Lumio emails
//     them the link; a player on the roster also gets it in their app.
//   · you want one to hand out → a reusable link to paste in a signature, a
//     WhatsApp group or on the club noticeboard.
//
// Everything about the session — how long, what type, which court — is chosen
// HERE and stored on the link, because the public page must never be able to
// decide the shape of a session.

import { useEffect, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

type Player = { id: string; name: string; email?: string | null; parent_email?: string | null; contact_email?: string | null }
type Venue = { id: string; name: string }
type SentLink = { id: string; url: string; name: string | null; email: string | null; reusable: boolean; uses: number; used_at: string | null; revoked_at: string | null; session_type: string | null; duration_min: number }

const TYPES = ['Private', 'Group', 'Cardio', 'Match play'] as const
const DURATIONS = [30, 45, 60, 90]

export function BookingLinkModal({ T, accent, players, venues, onClose }: {
  T: ThemeTokens; accent: AccentTokens
  players: Player[]
  venues: Venue[]
  onClose: () => void
}) {
  const [mode, setMode] = useState<'send' | 'share'>('send')
  const [playerId, setPlayerId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sessionType, setSessionType] = useState<string>('Private')
  const [durationMin, setDurationMin] = useState(60)
  const [venueId, setVenueId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<{ url: string; sent: boolean; to?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState<SentLink[]>([])

  useEffect(() => {
    fetch('/api/coach/booking-link').then(r => r.json()).then(d => setSent(d.links || [])).catch(() => {})
  }, [result])

  // Picking a player fills in the address we already hold, so the common case is
  // two clicks. The parent's address wins for a junior — the same rule the
  // confirmation emails follow.
  const pick = (id: string) => {
    setPlayerId(id)
    const p = players.find(x => x.id === id)
    if (p) {
      setName(p.name)
      setEmail((p.parent_email || p.email || p.contact_email || '').trim())
    }
  }

  const create = async (reusable: boolean) => {
    if (busy) return
    setBusy(true); setErr(''); setCopied(false)
    try {
      const res = await fetch('/api/coach/booking-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerId || null, email, name,
          durationMin, sessionType, venueId: venueId || null, note,
          reusable, send: !reusable,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not create that link.')
      setResult({ url: d.url, sent: !!d.sent, to: d.to })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not create that link.') }
    setBusy(false)
  }

  const copy = (url: string) => {
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {})
  }

  const revoke = async (id: string) => {
    await fetch(`/api/coach/booking-link?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
    setSent(s => s.map(l => (l.id === id ? { ...l, revoked_at: new Date().toISOString() } : l)))
  }

  const field: CSSProperties = { width: '100%', boxSizing: 'border-box', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', color: T.text, fontSize: 13, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }
  const chip = (on: boolean): CSSProperties => ({ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: on ? 700 : 500, padding: '7px 13px', borderRadius: 999, border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2 })

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Send a booking link</div>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 28, height: 28, fontSize: 16 }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.55, margin: '0 0 16px' }}>
          They see the times you are genuinely free — your diary, your calendar and your camps — pick one, and it books
          itself in. You get the confirmation; so do they.
        </p>

        {result ? (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.good }}>
              {result.sent ? `Sent to ${result.to}` : 'Your booking link is ready'}
            </div>
            <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.55, margin: '6px 0 12px' }}>
              {result.sent
                ? 'They can book straight from the email. You’ll know the moment they do — it lands in your calendar and your inbox.'
                : 'Paste it anywhere. Anyone who opens it can book one of your free slots.'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input readOnly value={result.url} onFocus={e => e.currentTarget.select()} style={{ ...field, flex: 1, minWidth: 220, fontSize: 12 }} />
              <button onClick={() => copy(result.url)} style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '9px 14px', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{copied ? 'Copied ✓' : 'Copy'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => { setResult(null); setPlayerId(''); setName(''); setEmail(''); setNote('') }}
                style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '9px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Send another</button>
              <button onClick={onClose} style={{ appearance: 'none', border: 0, background: T.hover, color: T.text2, borderRadius: 9, padding: '9px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
              <button onClick={() => setMode('send')} style={chip(mode === 'send')}>Send it to someone</button>
              <button onClick={() => setMode('share')} style={chip(mode === 'share')}>Get a link to share</button>
            </div>

            {mode === 'send' && (
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                <div>
                  <span style={lbl}>Who</span>
                  <select value={playerId} onChange={e => pick(e.target.value)} style={field}>
                    <option value="">Someone not on my roster…</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <span style={lbl}>Their name</span>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={field} />
                  </div>
                  <div>
                    <span style={lbl}>Email</span>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" type="email" style={field} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={lbl}>Session</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TYPES.map(t => <button key={t} onClick={() => setSessionType(t)} style={chip(sessionType === t)}>{t}</button>)}
                </div>
              </div>
              <div>
                <span style={lbl}>How long</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DURATIONS.map(d => <button key={d} onClick={() => setDurationMin(d)} style={chip(durationMin === d)}>{d} min</button>)}
                </div>
              </div>
              {venues.length > 0 && (
                <div>
                  <span style={lbl}>Where</span>
                  <select value={venueId} onChange={e => setVenueId(e.target.value)} style={field}>
                    <option value="">Don’t say (you’ll confirm)</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <span style={lbl}>Anything to add</span>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional — e.g. bring your own racket, £30 payable on the day" style={field} />
              </div>
            </div>

            {!!err && <div style={{ fontSize: 12.5, color: T.bad, marginBottom: 10 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ appearance: 'none', border: 0, borderRadius: 10, padding: '11px 16px', background: T.hover, color: T.text2, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={() => create(mode === 'share')} disabled={busy}
                style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 10, padding: '11px 16px', background: busy ? T.hover : accent.hex, color: busy ? T.text3 : T.btnText, fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: FONT }}>
                {busy ? 'Working…' : mode === 'share' ? 'Create a link to share' : '✉ Send the link'}
              </button>
            </div>
          </>
        )}

        {sent.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <div style={{ ...lbl, marginBottom: 9 }}>Links you’ve sent</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {sent.map(l => {
                const dead = !!l.revoked_at
                const used = !!l.used_at && !l.reusable
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 11px' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.name || l.email || (l.reusable ? 'Shareable link' : 'Booking link')}
                      </span>
                      <span style={{ display: 'block', fontSize: 10.5, color: T.text3 }}>
                        {[l.session_type, `${l.duration_min} min`,
                          dead ? 'turned off' : used ? 'booked ✓' : l.reusable ? `${l.uses} booking${l.uses === 1 ? '' : 's'}` : 'waiting'].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <button onClick={() => copy(l.url)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>Copy</button>
                    {!dead && !used && (
                      <button onClick={() => revoke(l.id)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.bad, borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>Turn off</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
