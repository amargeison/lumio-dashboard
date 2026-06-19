'use client'

// Onboarding wizard for the Lumio Tennis Coach portal. Coach/academy-appropriate
// questions (no athlete ranking / FIFA-card framing). Persists only to columns
// known to exist on sports_profiles, plus optional first players to coach_players.

import { useState, useRef } from 'react'
import { sb, currentCoachId } from '../_lib/coach-db'

const ACCENT = '#3A8EE0'
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
  const [setupType, setSetupType] = useState<'lumio' | 'self' | null>(null)
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
      const { error } = await sb().from('sports_profiles').update(update).eq('id', uid)
      if (error) throw new Error(error.message)

      // Optional first players (self-setup path).
      const toAdd = players.filter(p => p.name.trim())
      if (toAdd.length) {
        await sb().from('coach_players').insert(toAdd.map(p => ({ coach_id: uid, name: p.name.trim(), level: p.level.trim() || null })))
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
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Add your first players</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>Optional — add a few now, or skip and add them later in the Players module.</p>
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

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 14 }}>{err}</p>}

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>← Back</button> : <div />}
          {step === 1 && (
            <button onClick={() => { if (!academy.trim() || !name.trim()) { setErr('Add your academy name and your name'); return } setErr(''); setStep(2) }} style={primary(true)}>Continue →</button>
          )}
          {step === 2 && (
            setupType === 'self'
              ? <button onClick={() => setStep(3)} style={primary(true)}>Continue →</button>
              : <button onClick={finish} disabled={!setupType || saving} style={primary(!!setupType && !saving)}>{saving ? 'Saving…' : 'Finish →'}</button>
          )}
          {step === 3 && (
            <button onClick={finish} disabled={saving} style={primary(!saving)}>{saving ? 'Saving…' : 'Go to my portal →'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

function primary(enabled: boolean): React.CSSProperties {
  return { padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: enabled ? 'pointer' : 'default', background: enabled ? ACCENT : '#374151', color: '#fff' }
}
