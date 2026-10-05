'use client'

// The academy's contact email and phone. The email is where the coach's own
// copies of booking and camp emails go, and where a family's reply lands, so a
// value that is not an email address is refused here (and by the database).
//
// The calendar picker that used to sit here is gone: it saved a word to the
// profile and showed "✓ Bookings → calendar" the moment a provider was picked,
// with nothing connected. What is really connected is shown beneath this card
// by Settings, from the account.

import { useState, useEffect } from 'react'
import { useCoachProfile, saveCoachProfile } from '../_lib/coach-db'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }

// The same shapes the setup wizard and the database insist on (migration 202).
// Exported: the head coach's own email and phone (Settings → Head coach
// profile) are held to the same rule.
export const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phoneOk = (v: string) => /^[+()\d\s.-]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.length <= 40

export function CoachContactSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const profile = useCoachProfile()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!profile.loading) {
      setEmail(profile.contact_email || '')
      setPhone(profile.contact_phone || '')
    }
  }, [profile.loading, profile.contact_email, profile.contact_phone])

  const save = async () => {
    setErr(''); setMsg('')
    const e1 = email.trim(), p1 = phone.trim()
    if (e1 && (e1.length > 254 || !EMAIL_OK.test(e1))) { setErr('That email address does not look right. Check it, or leave it empty.'); return }
    if (p1 && !phoneOk(p1)) { setErr('That phone number does not look right. Use digits, with + for a country code, for example +44 7700 900123.'); return }
    setSaving(true)
    try {
      await saveCoachProfile({ contact_email: e1 || null, contact_phone: p1 || null })
      setMsg('Saved ✓'); setTimeout(() => setMsg(''), 3000); profile.reload()
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : 'That could not be saved. Try again.') }
    setSaving(false)
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 6 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Contact details</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Your contact email is where your own copies of booking and camp emails are sent, and where a family’s reply goes. Your phone number is kept on your academy’s record.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@academy.com" maxLength={254} style={input} />
        </div>
        <div>
          <label style={lbl}>Phone number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7…" maxLength={40} style={input} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button onClick={save} disabled={saving} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <span style={{ color: '#22C55E', fontSize: 12 }}>{msg}</span>}
        {err && <span style={{ color: '#EF4444', fontSize: 12 }}>{err}</span>}
      </div>
    </div>
  )
}
