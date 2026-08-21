'use client'

// Public camp sign-up page. Deliberately NOT the dark coach portal — this is
// shown to parents on a phone, usually from a WhatsApp link, so it is light,
// wide-spaced and readable in sunlight at the side of a court.
//
// The selling copy is Boris's parent brief, written for a parent rather than a
// coach. That is the whole reason the camp designer produces one.

import { useState, useEffect, type CSSProperties } from 'react'

export type CampPublic = {
  slug: string; name: string; academy: string; logoUrl: string | null
  startDate: string | null; endDate: string | null; location: string | null
  surface: string | null; ages: string | null
  price: number | null; paymentMode: string; depositAmount: number | null
  note: string | null; spacesLeft: number | null
  intro: string | null; whatTheyWorkOn: string[]; whatToBring: string[]
  dailyShape: string | null; whatTheyLeaveWith: string[]
  days: { day: number; theme: string }[]
}

const ACCENT = '#3A8EE0'
const fmt = (d: string | null) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const money = (n: number) => `£${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`

export default function CampSignupView({ camp }: { camp: CampPublic }) {
  const [f, setF] = useState({ player_name: '', player_age: '', parent_name: '', parent_email: '', parent_phone: '', emergency_contact: '', medical_notes: '', consent_photo: false, consent_medical: false })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<null | { status: string; note?: string }>(null)

  // Coming back from Stripe. Without this the parent pays, lands back here and
  // sees the empty form again — which reads as "it didn't work" and gets you a
  // second payment or a phone call.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('signed_up')) { setDone({ status: 'paid' }); history.replaceState(null, '', window.location.pathname) }
    else if (q.get('cancelled')) { setErr('Payment was cancelled — your place isn’t held yet. You can try again below.'); history.replaceState(null, '', window.location.pathname) }
  }, [])

  const set = (k: string, v: unknown) => setF(s => ({ ...s, [k]: v }))
  const full = camp.spacesLeft === 0
  const due = camp.paymentMode === 'full' ? camp.price : camp.paymentMode === 'deposit' ? camp.depositAmount : null

  const submit = async () => {
    if (busy) return
    if (!f.player_name.trim() || !f.parent_email.trim()) { setErr('Please add the player’s name and your email address.'); return }
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/camp/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, slug: camp.slug, player_age: Number(f.player_age) || null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not sign up')
      if (d.url) { window.location.href = d.url; return }   // straight to payment
      setDone({ status: d.already ? 'already' : d.status || 'confirmed', note: d.note })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not sign up'); setBusy(false) }
  }

  const card: CSSProperties = { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(20,25,40,.07)', marginBottom: 16 }
  const field: CSSProperties = { width: '100%', border: '1px solid #dfe3ec', borderRadius: 10, padding: '11px 13px', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
  const lbl: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4b5563', marginBottom: 5 }
  const h2: CSSProperties = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 10 }

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 40 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '34px 20px 30px', textAlign: 'center', color: '#fff' }}>
        {camp.logoUrl && <img src={camp.logoUrl} alt="" style={{ height: 54, maxWidth: 170, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8, marginBottom: 14 }} />}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{camp.academy}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{camp.name}</h1>
        <div style={{ fontSize: 15, opacity: .95, marginTop: 8 }}>
          {[fmt(camp.startDate), camp.endDate && camp.endDate !== camp.startDate ? fmt(camp.endDate) : ''].filter(Boolean).join(' – ')}
        </div>
        {camp.location && (
          <div style={{ fontSize: 14, opacity: .9, marginTop: 3 }}>
            {camp.location}
            {' · '}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(camp.location)}`} target="_blank" rel="noreferrer"
              style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: 2 }}>Directions</a>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 620, margin: '-18px auto 0', padding: '0 16px' }}>
        <div style={card}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: camp.intro ? 14 : 0 }}>
            {camp.ages && <Chip>Ages {camp.ages}</Chip>}
            {camp.surface && <Chip>{camp.surface}</Chip>}
            {due != null && <Chip>{camp.paymentMode === 'deposit' ? `${money(due)} deposit` : money(due)}</Chip>}
            {camp.spacesLeft != null && <Chip highlight={camp.spacesLeft <= 3}>{camp.spacesLeft === 0 ? 'Full' : `${camp.spacesLeft} place${camp.spacesLeft === 1 ? '' : 's'} left`}</Chip>}
          </div>
          {camp.intro && <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#374151', margin: 0 }}>{camp.intro}</p>}
          {camp.note && <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#6b7280', margin: '10px 0 0' }}>{camp.note}</p>}
        </div>

        {(camp.whatTheyWorkOn.length > 0 || camp.dailyShape) && (
          <div style={card}>
            <div style={h2}>What your child will work on</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{camp.whatTheyWorkOn.map((x, i) => <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: '#374151', marginBottom: 6 }}>{x}</li>)}</ul>
            {camp.dailyShape && <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}><strong style={{ color: '#374151' }}>A typical day:</strong> {camp.dailyShape}</p>}
          </div>
        )}

        {camp.days.length > 0 && (
          <div style={card}>
            <div style={h2}>Day by day</div>
            {camp.days.map(d => (
              <div key={d.day} style={{ display: 'flex', gap: 12, padding: '7px 0', borderTop: d.day > 1 ? '1px solid #f0f1f6' : 'none' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, width: 30, flexShrink: 0 }}>D{d.day}</span>
                <span style={{ fontSize: 14.5, color: '#374151' }}>{d.theme}</span>
              </div>
            ))}
          </div>
        )}

        {camp.whatToBring.length > 0 && (
          <div style={card}>
            <div style={h2}>What to bring</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {camp.whatToBring.map((x, i) => <span key={i} style={{ fontSize: 13.5, color: '#374151', background: '#f4f6fa', border: '1px solid #e5e9f0', borderRadius: 999, padding: '5px 12px' }}>{x}</span>)}
            </div>
          </div>
        )}

        {camp.whatTheyLeaveWith.length > 0 && (
          <div style={{ ...card, background: '#f1faf4', border: '1px solid #cdebd8' }}>
            <div style={{ ...h2, color: '#2f9d57' }}>What they leave with</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{camp.whatTheyLeaveWith.map((x, i) => <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: '#31543f', marginBottom: 5 }}>{x}</li>)}</ul>
          </div>
        )}

        {/* ── Sign-up ── */}
        <div id="signup" style={{ ...card, scrollMarginTop: 20 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 38 }}>🎾</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1d29', marginTop: 8 }}>
                {done.status === 'already' ? 'Already signed up'
                  : done.status === 'pending' ? 'Place reserved'
                  : done.status === 'paid' ? 'Payment received — you’re booked in!'
                  : `${f.player_name.split(' ')[0]} is booked in!`}
              </div>
              <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
                {done.note || (done.status === 'already'
                  ? 'We already have this player on the list for this camp — nothing more to do.'
                  : 'You’ll get a confirmation email shortly with everything you need. See you on court.')}
              </p>
            </div>
          ) : full ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1d29' }}>This camp is full</div>
              <p style={{ fontSize: 14.5, color: '#6b7280', marginTop: 6 }}>Speak to your coach about a place on the waiting list or the next camp.</p>
            </div>
          ) : (
            <>
              <div style={h2}>Sign up</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Player’s name *</label><input value={f.player_name} onChange={e => set('player_name', e.target.value)} style={field} /></div>
                  <div><label style={lbl}>Age</label><input type="number" value={f.player_age} onChange={e => set('player_age', e.target.value)} style={field} /></div>
                </div>
                <div><label style={lbl}>Your name (parent or guardian)</label><input value={f.parent_name} onChange={e => set('parent_name', e.target.value)} style={field} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Your email *</label><input type="email" value={f.parent_email} onChange={e => set('parent_email', e.target.value)} style={field} /></div>
                  <div><label style={lbl}>Your phone</label><input value={f.parent_phone} onChange={e => set('parent_phone', e.target.value)} style={field} /></div>
                </div>
                <div><label style={lbl}>Emergency contact (if different)</label><input value={f.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="Name and number" style={field} /></div>
                <div>
                  <label style={lbl}>Medical notes or allergies</label>
                  <textarea value={f.medical_notes} onChange={e => set('medical_notes', e.target.value)} rows={2} placeholder="Anything the coaches should know" style={{ ...field, resize: 'vertical' }} />
                </div>
                <Check checked={f.consent_photo} onChange={v => set('consent_photo', v)}>I’m happy for photos or video of my child to be used by the academy</Check>
                <Check checked={f.consent_medical} onChange={v => set('consent_medical', v)}>I consent to the coaches holding the medical information above</Check>

                {due != null && (
                  <div style={{ background: '#f6f8fb', border: '1px solid #e5e9f0', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#374151' }}>
                    {camp.paymentMode === 'deposit'
                      ? <>A <strong>{money(due)} deposit</strong> secures the place{camp.price ? <> — the balance of {money(Number(camp.price) - due)} is due before the camp starts.</> : '.'}</>
                      : <>Places are <strong>{money(due)}</strong>, paid now to secure the spot.</>}
                    <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 4 }}>You’ll be taken to a secure payment page next.</div>
                  </div>
                )}

                {err && <div style={{ fontSize: 13.5, color: '#c0392b' }}>{err}</div>}

                <button onClick={submit} disabled={busy}
                  style={{ appearance: 'none', border: 0, background: ACCENT, color: '#fff', borderRadius: 11, padding: '14px 18px', fontSize: 16, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? .6 : 1, fontFamily: 'inherit' }}>
                  {busy ? 'Just a moment…' : due != null ? `Sign up & pay ${money(due)}` : 'Sign up'}
                </button>
                <div style={{ fontSize: 12, color: '#9aa1b1', textAlign: 'center' }}>Your details go only to {camp.academy} — never shared or sold.</div>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#9aa1b1', padding: '8px 0 0' }}>Powered by Lumio</div>
      </div>
    </div>
  )
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#b45309' : '#374151', background: highlight ? '#fff7ed' : '#f4f6fa', border: `1px solid ${highlight ? '#fcd9a8' : '#e5e9f0'}`, borderRadius: 999, padding: '5px 12px' }}>{children}</span>
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2, width: 17, height: 17, flexShrink: 0, accentColor: ACCENT }} />
      <span>{children}</span>
    </label>
  )
}
