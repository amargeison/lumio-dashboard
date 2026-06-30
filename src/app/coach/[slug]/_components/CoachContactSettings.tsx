'use client'

// Contact & calendar config for the coach. Email + phone enable the Messages
// email/text channels; calendar is a placeholder connect (sync coming later).

import { useState, useEffect } from 'react'
import { useCoachProfile, saveCoachProfile } from '../_lib/coach-db'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }

const CAL_PROVIDERS = [
  { value: '', label: 'Not connected' },
  { value: 'google', label: 'Google Calendar' },
  { value: 'outlook', label: 'Outlook / Microsoft' },
  { value: 'apple', label: 'Apple Calendar' },
]

export function CoachContactSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const profile = useCoachProfile()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [calendar, setCalendar] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!profile.loading) {
      setEmail(profile.contact_email || '')
      setPhone(profile.contact_phone || '')
      setCalendar(profile.calendar_provider || '')
    }
  }, [profile.loading, profile.contact_email, profile.contact_phone, profile.calendar_provider])

  const save = async () => {
    setSaving(true); setErr(''); setMsg('')
    try {
      await saveCoachProfile({ contact_email: email.trim() || null, contact_phone: phone.trim() || null, calendar_provider: calendar || null })
      setMsg('Saved ✓'); setTimeout(() => setMsg(''), 3000); profile.reload()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed') }
    setSaving(false)
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 6 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Contact &amp; calendar</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Your sending email and phone enable the Email and Text message channels. Your bookings two-way sync with your connected calendar.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@academy.com" style={input} />
        </div>
        <div>
          <label style={lbl}>Phone number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7…" style={input} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={lbl}>Calendar sync</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <select value={calendar} onChange={e => setCalendar(e.target.value)} style={{ ...input, marginTop: 0, flex: 1 }}>
            {CAL_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {calendar && calendar !== 'none'
            ? <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22C55E', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', padding: '4px 10px', borderRadius: 999 }}>✓ Two-way sync on</span>
            : null}
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
