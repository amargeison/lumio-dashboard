'use client'

// A coach's own details: photo, accreditation, contact, DBS and safeguarding.
//
// ONE component, two jobs. As a `wizard` it is the first thing a coach sees when
// they sign in for the first time; as `settings` it is their Settings page for
// ever after. They ask for exactly the same things, and keeping them as one
// component means the two can never drift into disagreeing about what a coach is
// allowed to change.
//
// What is NOT here matters as much: name, role, contracted hours, and which
// venues they work at. Those are the head coach's to set, so they are shown as
// read-only facts rather than as controls that quietly do nothing.

import { useState, useEffect } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { ACCREDITATIONS } from '../_lib/settings-store'
import { fileToAvatarDataUrl, avatarSrc } from '@/lib/avatar'
import { forgetIdentity } from '../_lib/coach-db'

type Staff = {
  id: string; name: string; role?: string | null; email?: string | null; phone?: string | null
  qualifications?: string | null; avatar_url?: string | null; contracted_hours?: number | null
  dbs_number?: string | null; dbs_issued?: string | null; dbs_expiry?: string | null
  safeguarding_trained?: boolean | null; safeguarding_date?: string | null
  profile_complete?: boolean | null
}
type Venue = { id: string; name: string | null; isPrimary: boolean }

export function CoachMyProfile({ T, accent, mode, onDone }: {
  T: ThemeTokens; accent: AccentTokens; mode: 'wizard' | 'settings'; onDone?: () => void
}) {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [d, setD] = useState<Record<string, unknown>>({})
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/coach/my-profile')
        const j = await r.json()
        if (!alive) return
        if (!r.ok) { setErr(j.error || 'Could not load your details.'); return }
        setStaff(j.staff); setVenues(j.venues || [])
        setD({ ...(j.staff || {}) })
        setPhoto(j.staff?.avatar_url ?? null)
      } catch { if (alive) setErr('Could not load your details.') }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const set = (k: string, v: unknown) => { setD(p => ({ ...p, [k]: v })); setSaved(false) }

  const pickPhoto = async (file: File | null) => {
    if (!file) return
    try { const url = await fileToAvatarDataUrl(file, 256); setPhoto(url); set('avatar_url', url) }
    catch { setErr('Could not read that image.') }
  }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const r = await fetch('/api/coach/my-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_url: photo ?? null,
          phone: d.phone ?? null,
          email: d.email ?? null,
          qualifications: d.qualifications ?? null,
          dbs_number: d.dbs_number ?? null,
          dbs_issued: d.dbs_issued ?? null,
          dbs_expiry: d.dbs_expiry ?? null,
          safeguarding_trained: !!d.safeguarding_trained,
          safeguarding_date: d.safeguarding_date ?? null,
          // Setting this is what stops the wizard coming back. Written on save
          // AND on skip — a coach who chose to do it later has still seen it.
          profile_complete: true,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Could not save your details.')
      // The shell caches whoami (name + photo); drop it so the new photo shows
      // in the sidebar straight away rather than after a reload.
      forgetIdentity()
      setSaved(true)
      onDone?.()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save your details.') }
    finally { setSaving(false) }
  }

  const skip = async () => {
    try {
      await fetch('/api/coach/my-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_complete: true }),
      })
    } catch { /* non-blocking — worst case they see this once more */ }
    onDone?.()
  }

  const input: React.CSSProperties = { width: '100%', marginTop: 5, padding: '9px 11px', borderRadius: 9, background: T.panel2, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none' }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }

  if (loading) return <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
  if (!staff) return <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>{err || 'Could not load your details.'}</p>

  const initials = (staff.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

  return (
    <div style={{ maxWidth: 620 }}>
      {mode === 'wizard' ? (
        <>
          <h2 style={{ color: T.text, fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>Welcome, {staff.name.split(/\s+/)[0]}.</h2>
          <p style={{ color: T.text3, fontSize: 13.5, margin: '0 0 22px', lineHeight: 1.6 }}>
            Two minutes to set yourself up. Your photo shows on the players&rsquo; app and on anything you send them; your DBS and safeguarding dates keep your academy&rsquo;s register straight. You can change any of it later in Settings.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Your details</h1>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 22px' }}>Your photo, accreditation and safeguarding record.</p>
        </>
      )}

      {/* Photo + who they are */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, overflow: 'hidden' }}>
          {photo ? <img src={avatarSrc(photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: T.text, fontSize: 15, fontWeight: 700 }}>{staff.name}</div>
          <div style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>
            {[staff.role || 'Coach', venues.map(v => v.name).filter(Boolean).join(' · ') || null].filter(Boolean).join(' — ')}
          </div>
          <label style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 600, color: accent.hex, cursor: 'pointer' }}>
            {photo ? 'Change photo' : 'Add a photo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickPhoto(e.target.files?.[0] ?? null)} />
          </label>
          {photo && <button onClick={() => { setPhoto(null); set('avatar_url', null) }} style={{ marginLeft: 12, appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>}
        </div>
      </div>

      <p style={{ color: T.text3, fontSize: 11.5, margin: '0 0 18px', lineHeight: 1.5 }}>
        Your name, role{venues.length ? ' and venues' : ''} are set by your head coach. Ask them if any of it needs changing.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Accreditation</label>
          <select value={String(d.qualifications ?? '')} onChange={e => set('qualifications', e.target.value)} style={{ ...input, cursor: 'pointer' }}>
            <option value="">— select your qualification —</option>
            {Array.from(new Set([d.qualifications as string, ...ACCREDITATIONS].filter(Boolean))).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Email</label><input value={String(d.email ?? '')} onChange={e => set('email', e.target.value)} style={input} /></div>
        <div><label style={lbl}>Phone</label><input value={String(d.phone ?? '')} onChange={e => set('phone', e.target.value)} style={input} /></div>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>DBS &amp; safeguarding</div>
        <p style={{ color: T.text3, fontSize: 11.5, margin: '0 0 12px', lineHeight: 1.5 }}>
          Optional, and only your head coach sees it — it feeds the academy&rsquo;s register and the expiry reminders.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>DBS certificate number</label><input value={String(d.dbs_number ?? '')} onChange={e => set('dbs_number', e.target.value)} style={input} /></div>
          <div><label style={lbl}>Issued</label><input type="date" value={String(d.dbs_issued ?? '')} onChange={e => set('dbs_issued', e.target.value)} style={input} /></div>
          <div><label style={lbl}>Expires</label><input type="date" value={String(d.dbs_expiry ?? '')} onChange={e => set('dbs_expiry', e.target.value)} style={input} /></div>
          <div><label style={lbl}>Safeguarding training</label><input type="date" value={String(d.safeguarding_date ?? '')} onChange={e => set('safeguarding_date', e.target.value)} style={input} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: T.text2, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!d.safeguarding_trained} onChange={e => set('safeguarding_trained', e.target.checked)} />
          Safeguarding training completed
        </label>
      </div>

      {err && <div style={{ marginTop: 14, color: '#EF4444', fontSize: 12.5 }}>{err}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
        <button onClick={save} disabled={saving}
          style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : mode === 'wizard' ? 'Save and continue →' : 'Save changes'}
        </button>
        {mode === 'wizard' && (
          <button onClick={skip} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>I&rsquo;ll do this later</button>
        )}
        {saved && mode === 'settings' && <span style={{ color: T.good, fontSize: 12.5, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  )
}
