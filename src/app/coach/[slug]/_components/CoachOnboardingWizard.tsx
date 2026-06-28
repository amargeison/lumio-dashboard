'use client'

// Onboarding wizard for the Lumio Tennis Coach portal. Coach/academy-appropriate
// questions (no athlete ranking / FIFA-card framing). Persists only to columns
// known to exist on sports_profiles, plus optional first players to coach_players.

import { useState, useRef } from 'react'
import { sb, currentCoachId } from '../_lib/coach-db'
import { CoachImport } from './CoachImport'
import { addVenue } from '../_lib/venues-store'
import { setSettings, getSettings } from '../_lib/settings-store'
import { seedLumioResources } from '../_lib/lumio-resources'
import { seedLumioPackages } from '../_lib/lumio-packages'
import { applyTier } from '../_lib/feature-flags'

const ACCENT = '#3A8EE0'
const IMPORT_THEME = { text: '#fff', text2: '#D1D5DB', text3: '#9CA3AF', panel: '#0d1117', panel2: '#111318', border: '#1F2937', btnText: '#fff', isDark: true }
const IMPORT_ACCENT = { hex: ACCENT, dim: ACCENT + '22' }
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function compress(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = size; c.height = size; c.getContext('2d')!.drawImage(img, 0, 0, size, size); resolve(c.toDataURL('image/jpeg', 0.7)) }; img.onerror = reject; img.src = e.target?.result as string }
    reader.onerror = reject; reader.readAsDataURL(file)
  })
}

type Props = { defaultName?: string; defaultAcademy?: string; onClose: () => void; onDone: () => void }
type Player = { name: string; level: string }

export function CoachOnboardingWizard({ defaultName = '', defaultAcademy = '', onClose, onDone }: Props) {
  const [step, setStep] = useState(1)
  const [academy, setAcademy] = useState(defaultAcademy)
  const [name, setName] = useState(defaultName)
  const [slug, setSlug] = useState(slugify(defaultAcademy || defaultName))
  const [slugTouched, setSlugTouched] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [calendar, setCalendar] = useState('')
  const [dbsNumber, setDbsNumber] = useState('')
  const [dbsExpiry, setDbsExpiry] = useState('')
  const [safeguarding, setSafeguarding] = useState('')
  const [wantStaff, setWantStaff] = useState<boolean | null>(null)
  const [homeCourt, setHomeCourt] = useState('')
  const [resourcesPreloaded, setResourcesPreloaded] = useState(true)
  const [setupType, setSetupType] = useState<'lumio' | 'self' | null>(null)
  const [dpa, setDpa] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [pName, setPName] = useState('')
  const [pLevel, setPLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const TOTAL = setupType === 'self' ? 3 : 2

  const setAcademyName = (v: string) => { setAcademy(v); if (!slugTouched) setSlug(slugify(v)) }

  const finish = async () => {
    if (!academy.trim()) { setErr('Add your academy name'); setStep(1); return }
    if (!name.trim()) { setErr('Add your name'); setStep(1); return }
    setSaving(true); setErr('')
    try {
      const uid = await currentCoachId()
      if (!uid) throw new Error('Not signed in')
      const finalSlug = slug.trim() || slugify(academy)
      const update: Record<string, any> = {
        display_name: name.trim(),
        brand_name: academy.trim(),
        portal_slug: finalSlug,
        setup_type: setupType,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }
      if (photo) update.avatar_url = photo
      if (logo) update.brand_logo_url = logo
      if (email.trim()) update.contact_email = email.trim()
      if (phone.trim()) update.contact_phone = phone.trim()
      if (calendar) update.calendar_provider = calendar
      if (dbsNumber.trim()) update.head_coach_dbs_number = dbsNumber.trim()
      if (dbsExpiry) update.head_coach_dbs_expiry = dbsExpiry
      if (safeguarding) update.head_coach_safeguarding_date = safeguarding
      if (dpa) update.dpa_accepted_at = new Date().toISOString()
      const { error } = await sb().from('sports_profiles').update(update).eq('id', uid)
      if (error) throw new Error(error.message)

      // Optional first players (self-setup path).
      const toAdd = players.filter(p => p.name.trim())
      if (toAdd.length) {
        await sb().from('coach_players').insert(toAdd.map(p => ({ coach_id: uid, name: p.name.trim(), level: p.level.trim() || null })))
      }

      // Coaches is always visible now (a solo coach simply sees themselves), so we
      // no longer hide it during onboarding.

      // New founders start on Pro Lite — Racket Progression only. Video & Audio
      // and Effort & Rewards (smartwatch GPS) stay off until those features are
      // tested and signed off; they can be re-enabled later in Settings.
      applyTier('prolite')

      // Resource Centre: preload Lumio's library (live), or start empty for own content.
      setSettings({ resourcesPreloaded })
      if (resourcesPreloaded) seedLumioResources().catch(() => {})
      // Always preload the default package price list — the coach edits/prices it.
      seedLumioPackages().catch(() => {})

      // Home court → seed it into the Court Planner as the home/main site.
      if (homeCourt.trim()) {
        const venueId = `venue-home-${Date.now()}`
        addVenue({ id: venueId, name: homeCourt.trim(), type: 'Home court', address: '', distance: 'Home base', manager: name.trim() || 'You', managerPhone: phone.trim() || '', managerEmail: email.trim() || '', access: '', facilities: [], courts: [] })
        const cur = getSettings()
        setSettings({ primaryVenueId: venueId, syncedVenues: [...new Set([...(cur.syncedVenues || []), venueId])] })
        // Seed the live Court Planner venue too, so it's selectable for staff home venue etc.
        try {
          const uid = await currentCoachId()
          if (uid) await sb().from('coach_venues').insert({ coach_id: uid, name: homeCourt.trim(), contact_name: name.trim() || null, contact_phone: phone.trim() || null, contact_email: email.trim() || null, is_home: true })
        } catch { /* non-blocking */ }
      }

      // "Set it up for me" — notify the Lumio team (fire and forget).
      if (setupType === 'lumio') {
        fetch('/api/sports-auth/notify-setup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), sport: 'coach', clubName: academy.trim(), portalSlug: finalSlug, setupType: 'lumio' }),
        }).catch(() => {})
      }

      // Reflect the chosen slug in the URL (cosmetic — data is keyed to the session).
      if (typeof window !== 'undefined') {
        try { window.history.replaceState(null, '', `/tennis/coach/${finalSlug}`) } catch {}
      }
      onDone()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  const input: React.CSSProperties = { width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07080F', zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>
      <img src="/tennis_coach_logo.png" alt="Lumio Tennis Coach" style={{ height: 48, objectFit: 'contain', marginBottom: 20 }} />
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: TOTAL }).map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? ACCENT : '#1F2937' }} />)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 12, cursor: 'pointer' }}>Skip for now</button>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>Step {step} of {TOTAL}</p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 560, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 36 }}>
        {/* STEP 1 — Academy + you */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Set up your academy</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Tell us about your coaching business. You can change all of this later in Settings.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Academy / business name</label>
                <input value={academy} onChange={e => setAcademyName(e.target.value)} placeholder="e.g. New Malden Tennis" style={input} />
              </div>
              <div>
                <label style={lbl}>Your name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Freya Jones" style={input} />
              </div>
              <div>
                <label style={lbl}>Your portal URL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ color: '#4B5563', fontSize: 12, whiteSpace: 'nowrap' }}>lumiosports.com/tennis/coach/</span>
                  <input value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true) }} placeholder="your-academy" style={{ ...input, marginTop: 0, color: ACCENT, fontFamily: 'monospace', border: `1px solid ${ACCENT}40` }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Academy logo <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compress(e.target.files[0], 300).then(setLogo)} />
                  <button onClick={() => logoRef.current?.click()} style={{ ...input, cursor: 'pointer', textAlign: 'left', color: logo ? ACCENT : '#6B7280', border: `1px solid ${logo ? ACCENT : '#374151'}` }}>{logo ? '✓ Logo added' : '⬆ Upload logo'}</button>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Your photo <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compress(e.target.files[0], 400).then(setPhoto)} />
                  <button onClick={() => photoRef.current?.click()} style={{ ...input, cursor: 'pointer', textAlign: 'left', color: photo ? ACCENT : '#6B7280', border: `1px solid ${photo ? ACCENT : '#374151'}` }}>{photo ? '✓ Photo added' : '⬆ Upload photo'}</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Email <span style={{ color: '#4B5563', fontWeight: 400 }}>(for sending messages)</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@academy.com" style={input} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Your mobile <span style={{ color: '#4B5563', fontWeight: 400 }}>(contact number)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7…" style={input} />
                </div>
              </div>
              <div>
                <label style={lbl}>Calendar sync <span style={{ color: '#4B5563', fontWeight: 400 }}>(connect Google/Outlook in Settings after setup)</span></label>
                <select value={calendar} onChange={e => setCalendar(e.target.value)} style={input}>
                  <option value="">Not connected</option>
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook / Microsoft</option>
                  <option value="apple">Apple Calendar</option>
                </select>
              </div>
              <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16, marginTop: 2 }}>
                <label style={lbl}>Safeguarding &amp; DBS <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional — add now or later in Settings)</span></label>
                <input value={dbsNumber} onChange={e => setDbsNumber(e.target.value)} placeholder="DBS certificate number" style={input} />
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...lbl, fontSize: 10 }}>DBS expiry</label>
                    <input type="date" value={dbsExpiry} onChange={e => setDbsExpiry(e.target.value)} style={input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...lbl, fontSize: 10 }}>Safeguarding training</label>
                    <input type="date" value={safeguarding} onChange={e => setSafeguarding(e.target.value)} style={input} />
                  </div>
                </div>
                <p style={{ color: '#6B7280', fontSize: 11.5, margin: '8px 0 0', lineHeight: 1.5 }}>You can upload the certificate PDF and manage your team&apos;s DBS records once you&apos;re in — Settings → Head coach profile and the Staff page.</p>
              </div>
              <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16, marginTop: 2 }}>
                <label style={lbl}>Do you want to add coaching staff?</label>
                <p style={{ color: '#6B7280', fontSize: 11.5, margin: '4px 0 8px' }}>Solo for now? You can switch the Coaches menu on any time in Settings → Menu visibility.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setWantStaff(true)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '11px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `2px solid ${wantStaff === true ? ACCENT : '#1F2937'}`, background: wantStaff === true ? ACCENT + '18' : '#111318', color: wantStaff === true ? '#fff' : '#9CA3AF' }}>Yes — I have a team</button>
                  <button type="button" onClick={() => setWantStaff(false)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '11px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `2px solid ${wantStaff === false ? ACCENT : '#1F2937'}`, background: wantStaff === false ? ACCENT + '18' : '#111318', color: wantStaff === false ? '#fff' : '#9CA3AF' }}>No — solo coach</button>
                </div>
              </div>
              <div>
                <label style={lbl}>Home court <span style={{ color: '#4B5563', fontWeight: 400 }}>(where you do most of your coaching)</span></label>
                <input value={homeCourt} onChange={e => setHomeCourt(e.target.value)} placeholder="e.g. Riverside Tennis Centre" style={input} />
                <p style={{ color: '#6B7280', fontSize: 11.5, margin: '6px 0 0' }}>We&apos;ll set this as your home site in the Court Planner.</p>
              </div>
              <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16, marginTop: 2 }}>
                <label style={lbl}>Resource Centre</label>
                <p style={{ color: '#6B7280', fontSize: 11.5, margin: '4px 0 8px' }}>Start with Lumio&apos;s drill library, training plans and worksheets, or keep it empty and add your own. You can add your own either way.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setResourcesPreloaded(true)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '11px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `2px solid ${resourcesPreloaded ? ACCENT : '#1F2937'}`, background: resourcesPreloaded ? ACCENT + '18' : '#111318', color: resourcesPreloaded ? '#fff' : '#9CA3AF' }}>Preload Lumio resources</button>
                  <button type="button" onClick={() => setResourcesPreloaded(false)} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '11px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `2px solid ${!resourcesPreloaded ? ACCENT : '#1F2937'}`, background: !resourcesPreloaded ? ACCENT + '18' : '#111318', color: !resourcesPreloaded ? '#fff' : '#9CA3AF' }}>I&apos;ll add my own</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Setup choice */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How would you like to get started?</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>You can switch approach at any time.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setSetupType('self')} style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: setupType === 'self' ? ACCENT + '15' : '#111318', border: `2px solid ${setupType === 'self' ? ACCENT : '#1F2937'}` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎾</div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>I&rsquo;ll add my own data</div>
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Jump straight in — add your players, bookings and the rest yourself. Add a few players now to get going.</div>
              </button>
              <button onClick={() => setSetupType('lumio')} style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: setupType === 'lumio' ? ACCENT + '15' : '#111318', border: `2px solid ${setupType === 'lumio' ? ACCENT : '#1F2937'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}><span style={{ fontSize: 24 }}>✨</span><span style={{ background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>HANDS-OFF</span></div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Set it up for me</div>
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Our team imports your players and configures your portal. We&rsquo;ll be in touch within 2&ndash;3 business days.</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — First players (self only) */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Add your players</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Have a spreadsheet? Upload it and we&apos;ll add everyone for you — or add a few by hand below. All optional.</p>
            <div style={{ marginBottom: 18 }}>
              <CoachImport T={IMPORT_THEME} accent={IMPORT_ACCENT} />
            </div>
            <div style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', margin: '0 0 14px' }}>— or add manually —</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
              {players.length === 0 ? <p style={{ color: '#4B5563', fontSize: 13 }}>No players added yet.</p> : players.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#111318', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {p.level && <span style={{ color: '#6B7280', fontSize: 11 }}>{p.level}</span>}
                  <button onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 15 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Player name" style={{ ...input, marginTop: 0, flex: 2 }} />
              <input value={pLevel} onChange={e => setPLevel(e.target.value)} placeholder="Level (optional)" style={{ ...input, marginTop: 0, flex: 1 }} />
              <button onClick={() => { if (pName.trim()) { setPlayers(prev => [...prev, { name: pName.trim(), level: pLevel.trim() }]); setPName(''); setPLevel('') } }} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        )}

        {step >= 2 && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 18, fontSize: 12.5, color: '#9CA3AF', cursor: 'pointer' }}>
            <input type="checkbox" checked={dpa} onChange={e => setDpa(e.target.checked)} style={{ marginTop: 2 }} />
            <span>I accept Lumio&apos;s Data Processing Agreement — I&apos;m the data controller for my players&apos; data and Lumio processes it on my behalf to run my portal. <span style={{ color: '#EF4444' }}>(required)</span></span>
          </label>
        )}

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 14 }}>{err}</p>}

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>← Back</button> : <div />}
          {step === 1 && (
            <button onClick={() => { if (!academy.trim() || !name.trim()) { setErr('Add your academy name and your name'); return } setErr(''); setStep(2) }} style={primary(true)}>Continue →</button>
          )}
          {step === 2 && (
            setupType === 'self'
              ? <button onClick={() => { if (!dpa) { setErr('Please accept the Data Processing Agreement to continue.'); return } setErr(''); setStep(3) }} style={primary(true)}>Continue →</button>
              : <button onClick={finish} disabled={!setupType || saving || !dpa} style={primary(!!setupType && !saving && dpa)}>{saving ? 'Saving…' : 'Finish →'}</button>
          )}
          {step === 3 && (
            <button onClick={finish} disabled={saving || !dpa} style={primary(!saving && dpa)}>{saving ? 'Saving…' : 'Go to my portal →'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

function primary(enabled: boolean): React.CSSProperties {
  return { padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: enabled ? 'pointer' : 'default', background: enabled ? ACCENT : '#374151', color: '#fff' }
}
