'use client'

// Booking a session, from the other side of the net.
//
// The person here has no account, is probably on a phone, and wants one thing:
// a time. So the page is three steps and no more — pick a day, pick a time, say
// who you are — and the first two are one tap each. Anything that is not a time
// is either below the fold or not on the page at all.
//
// Light, not the dark coach portal: this is opened from a text message in a car
// park, not from a laptop in an office.

import { useEffect, useState, type CSSProperties } from 'react'

const ACCENT = '#3A8EE0'

type Day = { date: string; label: string; slots: string[] }
type Head = {
  academy: string; coachName: string; logoUrl: string | null
  durationMin: number; sessionType: string
  venue: { name: string; address: string | null } | null
  note: string | null
  invitedName: string; invitedEmail: string; known: boolean
  days: Day[]; closed?: string; error?: string
}

const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const label: CSSProperties = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 10 }
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #dfe3ec', borderRadius: 10, padding: '11px 13px', fontSize: 16, color: '#1a1d29', background: '#fff', outline: 'none', fontFamily: 'inherit' }

const endTime = (t: string, mins: number) => {
  const [h, m] = t.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function BookingView({ token }: { token: string }) {
  const [head, setHead] = useState<Head | null>(null)
  const [loading, setLoading] = useState(true)
  const [dayIdx, setDayIdx] = useState(0)
  const [time, setTime] = useState('')
  const [forChild, setForChild] = useState<boolean | null>(null)
  const [f, setF] = useState({ player_name: '', contact_name: '', email: '', phone: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<null | { date: string; time: string; durationMin: number; emailed: boolean }>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/book/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((d: Head) => { if (alive) { setHead(d); setF(s => ({ ...s, player_name: d.invitedName || '', email: d.invitedEmail || '' })); setLoading(false) } })
      .catch(() => { if (alive) { setHead({ error: 'We could not load this booking page.' } as Head); setLoading(false) } })
    return () => { alive = false }
  }, [token])

  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }))
  const days = head?.days || []
  const day = days[dayIdx] || null

  const submit = async () => {
    if (busy) return
    if (!time || !day) { setErr('Please pick a time.'); return }
    if (forChild === null) { setErr('Is this session for you, or for your child?'); return }
    if (!f.player_name.trim() || !f.email.trim()) { setErr(forChild ? 'Please give your child’s name and your email address.' : 'Please give your name and email address.'); return }
    setBusy(true); setErr('')
    try {
      const res = await fetch(`/api/book/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: day.date, time, for_child: forChild, ...f }),
      })
      const d = await res.json()
      if (!res.ok) {
        // The slot went while they were typing. Refresh the grid in place rather
        // than sending them back to a page that still shows the old times.
        if (d.days) { setHead(h => (h ? { ...h, days: d.days } : h)); setTime('') }
        setErr(d.error || 'Could not book that — please try again.')
        setBusy(false)
        return
      }
      setDone(d)
    } catch { setErr('Could not book that — please try again.') }
    setBusy(false)
  }

  const page = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 28px', textAlign: 'center', color: '#fff' }}>
        {head?.logoUrl && /* eslint-disable-next-line @next/next/no-img-element */
          <img src={head.logoUrl} alt="" style={{ height: 50, maxWidth: 160, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8, marginBottom: 12 }} />}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{head?.academy || 'Tennis'}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>Book a session</h1>
        {!!head && !head.error && (
          <div style={{ fontSize: 15, opacity: .95, marginTop: 8 }}>
            {[head.sessionType, `${head.durationMin} minutes`, head.coachName ? `with ${head.coachName}` : ''].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <div style={{ maxWidth: 560, margin: '-16px auto 0', padding: '0 16px' }}>{children}</div>
    </div>
  )

  if (loading) return page(<div style={{ ...card, textAlign: 'center', color: '#6b7280', fontSize: 14.5 }}>Finding your coach’s free times…</div>)

  if (!head || head.error || head.closed) {
    return page(
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1d29' }}>This link isn’t open</div>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
          {head?.closed || head?.error || 'We could not load this booking page.'} Drop your coach a message and they’ll send a new one.
        </p>
      </div>,
    )
  }

  if (done) {
    const d = new Date(`${done.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    return page(
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 38 }}>🎾</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29', marginTop: 8 }}>You’re booked in</div>
        <div style={{ fontSize: 16, color: '#1a1d29', marginTop: 10, fontWeight: 600 }}>{d}</div>
        <div style={{ fontSize: 15, color: '#374151' }}>{done.time} – {endTime(done.time, done.durationMin)}</div>
        {head.venue && <div style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>{head.venue.name}{head.venue.address ? ` · ${head.venue.address}` : ''}</div>}
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 14 }}>
          {done.emailed
            ? 'A confirmation is on its way to your inbox, with the address and an add-to-calendar link. See you on court.'
            : 'Your coach has it in their diary. If a confirmation email doesn’t arrive, give them a nudge.'}
        </p>
      </div>,
    )
  }

  if (days.length === 0) {
    return page(
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1d29' }}>No free times in the next three weeks</div>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
          Your coach’s diary is full for now. Message them and they’ll find you something.
        </p>
      </div>,
    )
  }

  return page(
    <>
      {(head.note || head.venue) && (
        <div style={card}>
          {head.venue && (
            <div style={{ fontSize: 14.5, color: '#374151' }}>
              <strong>{head.venue.name}</strong>
              {head.venue.address ? <> · {head.venue.address}</> : null}
              {' · '}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([head.venue.name, head.venue.address].filter(Boolean).join(', '))}`}
                target="_blank" rel="noreferrer" style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: 2 }}>Directions</a>
            </div>
          )}
          {head.note && <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, margin: head.venue ? '8px 0 0' : 0 }}>{head.note}</p>}
        </div>
      )}

      {/* ── 1. The day ──────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={label}>Pick a day</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
          {days.map((d, i) => {
            const on = i === dayIdx
            const dt = new Date(`${d.date}T12:00:00Z`)
            return (
              <button key={d.date} onClick={() => { setDayIdx(i); setTime('') }}
                style={{
                  appearance: 'none', cursor: 'pointer', flex: '0 0 auto', minWidth: 74, textAlign: 'center',
                  border: `1px solid ${on ? ACCENT : '#dfe3ec'}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#1a1d29',
                  borderRadius: 12, padding: '9px 6px', fontFamily: 'inherit',
                }}>
                <div style={{ fontSize: 11, opacity: .8 }}>{dt.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{dt.getUTCDate()}</div>
                <div style={{ fontSize: 10.5, opacity: .8 }}>{dt.toLocaleDateString('en-GB', { month: 'short' })}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 2. The time ─────────────────────────────────────────────────── */}
      {day && (
        <div style={card}>
          <div style={label}>{day.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {day.slots.map(t => {
              const on = t === time
              return (
                <button key={t} onClick={() => { setTime(t); setErr('') }}
                  style={{
                    appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${on ? ACCENT : '#dfe3ec'}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#1a1d29',
                    borderRadius: 10, padding: '11px 4px', fontSize: 15, fontWeight: on ? 700 : 500,
                  }}>
                  {t}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 12.5, color: '#9aa1ad', marginTop: 10 }}>
            All times are {head.durationMin} minutes, ending {time ? endTime(time, head.durationMin) : `${head.durationMin} minutes later`}.
          </div>
        </div>
      )}

      {/* ── 3. Who ──────────────────────────────────────────────────────── */}
      {!!time && (
        <div style={card}>
          <div style={label}>Who is this for?</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[{ v: false, l: 'Me' }, { v: true, l: 'My child' }].map(o => {
              const on = forChild === o.v
              return (
                <button key={o.l} onClick={() => { setForChild(o.v); setErr('') }}
                  style={{
                    appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', flex: 1,
                    border: `1px solid ${on ? ACCENT : '#dfe3ec'}`, background: on ? `${ACCENT}12` : '#fff',
                    color: on ? ACCENT : '#374151', fontWeight: on ? 700 : 500,
                    borderRadius: 10, padding: '11px 8px', fontSize: 15,
                  }}>
                  {o.l}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={input} placeholder={forChild ? 'Your child’s name' : 'Your name'} value={f.player_name} onChange={e => set('player_name', e.target.value)} />
            {forChild && <input style={input} placeholder="Your name (parent or guardian)" value={f.contact_name} onChange={e => set('contact_name', e.target.value)} />}
            <input style={input} type="email" inputMode="email" autoCapitalize="off" placeholder={forChild ? 'Your email address' : 'Email address'} value={f.email} onChange={e => set('email', e.target.value)} />
            <input style={input} type="tel" inputMode="tel" placeholder="Phone number (optional)" value={f.phone} onChange={e => set('phone', e.target.value)} />
            <textarea style={{ ...input, minHeight: 74, resize: 'vertical' }} placeholder="Anything your coach should know? (optional)" value={f.note} onChange={e => set('note', e.target.value)} />
          </div>

          {!!err && <div style={{ fontSize: 13.5, color: '#c2453f', marginTop: 12 }}>{err}</div>}

          <button onClick={submit} disabled={busy}
            style={{
              appearance: 'none', border: 0, width: '100%', marginTop: 14, borderRadius: 12, padding: '14px',
              background: busy ? '#9bbfe4' : ACCENT, color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>
            {busy ? 'Booking…' : `Book ${time} on ${new Date(`${day!.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`}
          </button>
          <div style={{ fontSize: 12, color: '#9aa1ad', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Your coach gets this straight away, and you’ll get a confirmation email.
          </div>
        </div>
      )}

      {!time && (
        <div style={{ fontSize: 13, color: '#8b93a1', textAlign: 'center', marginTop: 16 }}>
          Pick a time above to finish booking.
        </div>
      )}
    </>,
  )
}
