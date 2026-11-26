'use client'

// The /join form, mobile first. Posts to /api/impact/join/<slug>; on the demo it
// posts nothing and shows the same confirmation (the demo writes nothing).

import React, { useState } from 'react'
import type { JoinPage } from '@/lib/impact/join-page'

const RED = '#D7262C', DARK = '#1A1614'
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #D9D3CC', borderRadius: 10, padding: '12px 13px', fontSize: 16, background: '#fff', color: DARK }
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: DARK, margin: '14px 0 5px' }
const check: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: DARK, margin: '12px 0', lineHeight: 1.45 }

type Child = { name: string; dob: string }

export default function JoinForm({ page, venue, viaQr }: { page: JoinPage; venue: string | null; viaQr: boolean }) {
  const [startedAt] = useState(() => Date.now())
  const [guardian, setGuardian] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [children, setChildren] = useState<Child[]>([{ name: '', dob: '' }])
  const [venueId, setVenueId] = useState(venue ?? (page.venues.length === 1 ? page.venues[0].id : ''))
  const [consentData, setConsentData] = useState(false)
  const [consentPhoto, setConsentPhoto] = useState(false)
  const [optInEmail, setOptInEmail] = useState(true)
  const [optInSms, setOptInSms] = useState(false)
  const [website, setWebsite] = useState('')   // hidden: people leave it empty
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const chosen = page.venues.find(v => v.id === venueId)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!consentData) { setError('We need your agreement to keep your details before you can join.'); return }
    setBusy(true)
    try {
      if (page.demo) { await new Promise(r => setTimeout(r, 400)); setDone(true); return }
      const res = await fetch(`/api/impact/join/${page.slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        guardian, email, phone, children, venueId, consentData, consentPhoto, optInEmail, optInSms, website, startedAt, channel: viaQr ? 'qr' : 'form' }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || `Something went wrong (error ${res.status}). Please try again.`); return }
      setDone(true)
    } catch {
      setError('We couldn’t reach Lumio — check your connection and try again.')
    } finally { setBusy(false) }
  }

  const shell = (inner: React.ReactNode) => (
    <main style={{ minHeight: '100vh', background: '#F7F5F2', padding: '24px 16px 48px', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.logo} alt={page.org} style={{ maxHeight: 56, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>{inner}</div>
        {page.demo && <p style={{ textAlign: 'center', fontSize: 12, color: '#8A847E', marginTop: 12 }}>Demo — nothing you type here is saved or sent.</p>}
      </div>
    </main>
  )

  if (page.closed) return shell(<><h1 style={{ fontSize: 21, margin: 0, color: DARK }}>{page.org}</h1><p style={{ fontSize: 15, color: '#6B6560' }}>{page.closed}</p></>)

  // The same words for everyone, whether the address was new or already known.
  if (done) return shell(
    <div role="status">
      <h1 style={{ fontSize: 22, margin: '0 0 10px', color: DARK }}>Thanks — check your email for your link</h1>
      <p style={{ fontSize: 15, color: '#3F3A36', lineHeight: 1.5 }}>Everything you need is in the email{chosen ? `, including the details for ${chosen.name}` : ''}.</p>
      <p style={{ fontSize: 13, color: '#8A847E' }}>Can’t see it? Check your junk folder.</p>
    </div>,
  )

  return shell(
    <form onSubmit={submit} noValidate>
      <h1 style={{ fontSize: 22, margin: 0, color: DARK }}>Join {page.org}’s weekend sessions</h1>
      <p style={{ fontSize: 14, color: '#6B6560', margin: '6px 0 4px', lineHeight: 1.45 }}>Free, friendly sessions for the whole family. It takes a minute.</p>

      <label style={label} htmlFor="guardian">Your name</label>
      <input id="guardian" style={field} autoComplete="name" value={guardian} onChange={e => setGuardian(e.target.value)} required />
      <label style={label} htmlFor="email">Email</label>
      <input id="email" style={field} type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <label style={label} htmlFor="phone">Mobile <span style={{ fontWeight: 400, color: '#8A847E' }}>(optional)</span></label>
      <input id="phone" style={field} type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />

      <div style={{ ...label, marginTop: 18 }}>Children</div>
      {children.map((c, i) => (
        <div key={i} style={{ border: '1px solid #EEE9E3', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
          <label style={{ ...label, marginTop: 0 }} htmlFor={`cn${i}`}>Child’s name</label>
          <input id={`cn${i}`} style={field} value={c.name} onChange={e => setChildren(cs => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <label style={label} htmlFor={`cd${i}`}>Date of birth</label>
          <input id={`cd${i}`} style={field} type="date" value={c.dob} onChange={e => setChildren(cs => cs.map((x, j) => (j === i ? { ...x, dob: e.target.value } : x)))} />
          {children.length > 1 && <button type="button" onClick={() => setChildren(cs => cs.filter((_, j) => j !== i))} style={{ marginTop: 8, background: 'none', border: 'none', color: RED, fontSize: 13, fontWeight: 700, padding: 0, cursor: 'pointer' }}>Remove</button>}
        </div>
      ))}
      {children.length < 6 && <button type="button" onClick={() => setChildren(cs => [...cs, { name: '', dob: '' }])} style={{ background: '#fff', border: '1px dashed #D9D3CC', borderRadius: 10, padding: '10px 12px', width: '100%', fontSize: 14, fontWeight: 700, color: DARK, cursor: 'pointer' }}>+ Add another child</button>}

      <label style={{ ...label, marginTop: 18 }} htmlFor="venue">Where would you like to come?</label>
      <select id="venue" style={field} value={venueId} onChange={e => setVenueId(e.target.value)}>
        <option value="">Choose a venue…</option>
        {page.venues.map(v => <option key={v.id} value={v.id}>{v.name}{v.when ? ` — ${v.when}` : ''}{v.full ? ' (waiting list)' : ''}</option>)}
      </select>
      {chosen && <p style={{ fontSize: 13, color: '#6B6560', margin: '6px 2px 0' }}>{[chosen.when, chosen.where].filter(Boolean).join(' · ')}{chosen.full ? ' · Full at the moment: you’ll join the waiting list.' : ''}</p>}

      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="website">Leave this empty</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
      </div>

      <div style={{ borderTop: '1px solid #EEE9E3', marginTop: 18, paddingTop: 4 }}>
        <label style={check}><input type="checkbox" checked={consentData} onChange={e => setConsentData(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span>{page.consentText} <a href={page.privacyUrl ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: RED }}>Privacy policy</a> <span style={{ color: RED }}>(required)</span></span></label>
        <label style={check}><input type="checkbox" checked={consentPhoto} onChange={e => setConsentPhoto(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span>Photos: you may take and share photos of my children at sessions.</span></label>
        <label style={check}><input type="checkbox" checked={optInEmail} onChange={e => setOptInEmail(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span>Email me about sessions and news.</span></label>
        <label style={check}><input type="checkbox" checked={optInSms} disabled={!phone.trim()} onChange={e => setOptInSms(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span>Text me reminders{phone.trim() ? '' : ' (add a mobile number first)'}.</span></label>
      </div>

      {error && <p role="alert" style={{ color: RED, fontWeight: 700, fontSize: 14, margin: '10px 0' }}>{error}</p>}
      <button type="submit" disabled={busy} style={{ width: '100%', marginTop: 10, background: busy ? '#D9D3CC' : RED, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 16px', fontSize: 16, fontWeight: 800, cursor: busy ? 'default' : 'pointer' }}>
        {busy ? 'Joining…' : 'Join'}
      </button>
    </form>,
  )
}
