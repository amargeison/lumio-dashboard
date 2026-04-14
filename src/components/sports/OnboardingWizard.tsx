'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SPORT_FEATURES, ALWAYS_ON } from '@/lib/sports/features'
import { SPORT_STATS } from '@/lib/sports/cardStats'
import { Check, Upload, Plus, X } from 'lucide-react'

type Props = {
  sport: string
  accentColor: string
  profile: { id: string; display_name?: string; email?: string }
  onComplete: (enabledFeatures: string[], portalSlug?: string) => void
}
type Invite = { name: string; email: string; role: string }

export default function OnboardingWizard({ sport, accentColor, profile, onComplete }: Props) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const features = SPORT_FEATURES[sport] || []
  const defaultEnabled = [...ALWAYS_ON, ...features.filter(f => f.defaultOn).map(f => f.id)]
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [nickname, setNickname] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [portalSlug, setPortalSlug] = useState((profile.display_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  const photoRef = useRef<HTMLInputElement>(null)
  const [clubName, setClubName] = useState('')
  const [location, setLocation] = useState('')
  const [brandLogoDataUrl, setBrandLogoDataUrl] = useState<string | null>(null)
  const brandLogoRef = useRef<HTMLInputElement>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(defaultEnabled)
  const [invites, setInvites] = useState<Invite[]>([{ name: '', email: '', role: 'Manager' }])
  const [setupType, setSetupType] = useState<'lumio' | 'self' | null>(null)
  const ROLES = ['Manager', 'Agent', 'Coach', 'Physio', 'Sponsor', 'Other']
  const TOTAL_STEPS = 5

  const compressImage = (file: File, size: number): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = size; c.height = size; c.getContext('2d')!.drawImage(img, 0, 0, size, size); resolve(c.toDataURL('image/jpeg', 0.7)) }; img.onerror = reject; img.src = e.target?.result as string }
    reader.onerror = reject; reader.readAsDataURL(file)
  })

  const toggleFeature = (id: string) => { if (ALWAYS_ON.includes(id)) return; setEnabledFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]) }
  const slugify = (val: string) => val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const saveAndComplete = async () => {
    setSaving(true)
    try {
      await supabase.from('sports_profiles').update({
        display_name: displayName, nickname, avatar_url: photoDataUrl, portal_slug: portalSlug,
        club_name: clubName, location, brand_logo_url: brandLogoDataUrl, enabled_features: enabledFeatures,
        invites: invites.filter(i => i.email), setup_type: setupType, onboarding_complete: true,
      }).eq('id', profile.id)
      if (setupType === 'lumio') {
        fetch('/api/sports-auth/notify-setup', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: displayName, sport, email: profile.email, clubName, location, portalSlug, setupType })
        }).catch(() => {})
      }
      onComplete(enabledFeatures, portalSlug)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const featureGroups = features.reduce((acc, f) => { if (!acc[f.group]) acc[f.group] = []; acc[f.group].push(f); return acc }, {} as Record<string, typeof features>)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07080F', zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 48, objectFit: 'contain', marginBottom: 24 }} />
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: TOTAL_STEPS }).map((_, i) => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? accentColor : '#1F2937', transition: 'background 0.3s' }} />))}</div>
        <p style={{ color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'right' }}>Step {step} of {TOTAL_STEPS}</p>
      </div>
      <div style={{ width: '100%', maxWidth: 560, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 36 }}>

        {step === 1 && (<div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Create your player card</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>This is how you&apos;ll appear in your portal.</p>
          <div style={{ width: 180, margin: '0 auto 28px', background: 'linear-gradient(135deg, #1a0a0a, #2d1a0a)', border: `2px solid ${accentColor}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center', position: 'relative' }}>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 2 }}>92</div>
            <div style={{ color: accentColor, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>{sport}</div>
            <div onClick={() => photoRef.current?.click()} style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 10px', cursor: 'pointer', border: `2px solid ${accentColor}`, overflow: 'hidden', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoDataUrl ? <img src={photoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={20} color={accentColor} />}
            </div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 1, lineHeight: 1.2, textTransform: 'uppercase' }}>{displayName ? displayName.toUpperCase().split(' ')[0] : 'YOUR'}</div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{displayName ? (displayName.toUpperCase().split(' ')[1] || '') : 'NAME'}</div>
            {nickname && <div style={{ color: accentColor, fontSize: 10, fontWeight: 600, marginTop: 2 }}>&quot;{nickname}&quot;</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 10, padding: '8px 4px 0', borderTop: `1px solid ${accentColor}30` }}>
              {(SPORT_STATS[sport] || SPORT_STATS.darts).map((stat: { label: string; value: number }) => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: accentColor, fontWeight: 700 }}>{stat.value}</span>
                  <span style={{ color: '#9CA3AF' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compressImage(e.target.files[0], 400).then(setPhotoDataUrl)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label><input value={displayName} onChange={e => { setDisplayName(e.target.value); setPortalSlug(slugify(e.target.value)) }} placeholder="Your full name" style={{ width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} /></div>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nickname <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label><input value={nickname} onChange={e => setNickname(e.target.value)} placeholder='e.g. "The Hammer"' style={{ width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} /></div>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Portal URL</label><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><span style={{ color: '#4B5563', fontSize: 12, whiteSpace: 'nowrap' }}>lumiosports.com/{sport}/</span><input value={portalSlug} onChange={e => setPortalSlug(slugify(e.target.value))} placeholder="your-name" style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: '#111318', border: `1px solid ${accentColor}40`, color: accentColor, fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }} /></div></div>
          </div>
        </div>)}

        {step === 2 && (<div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Your club or brand</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Add your team, academy or personal brand. All optional.</p>
          {(clubName || brandLogoDataUrl) && <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#111318', border: `1px solid ${accentColor}40`, borderRadius: 12, padding: 16, marginBottom: 24 }}>{brandLogoDataUrl ? <img src={brandLogoDataUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 48, height: 48, borderRadius: 8, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 20 }}>🏆</span></div>}<div><div style={{ color: '#fff', fontWeight: 700 }}>{clubName || 'Your Brand'}</div>{location && <div style={{ color: '#6B7280', fontSize: 12 }}>{location}</div>}</div></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Club / Brand Name <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label><input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="e.g. Team Morrison" style={{ width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} /></div>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Manchester, UK" style={{ width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} /></div>
            <div><label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Club / Brand Logo <span style={{ color: '#4B5563', fontWeight: 400 }}>(optional)</span></label><input ref={brandLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compressImage(e.target.files[0], 300).then(setBrandLogoDataUrl)} /><button onClick={() => brandLogoRef.current?.click()} style={{ width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: `1px solid ${brandLogoDataUrl ? accentColor : '#374151'}`, color: brandLogoDataUrl ? accentColor : '#6B7280', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>{brandLogoDataUrl ? '✅ Logo uploaded — click to change' : '⬆ Upload logo'}</button></div>
          </div>
        </div>)}

        {step === 3 && (<div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Choose your features</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>Select what appears in your portal. Change anytime in Settings.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}><p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>{enabledFeatures.length} features selected</p><button onClick={() => { const allIds = features.map(f => f.id); if (allIds.every(id => enabledFeatures.includes(id))) { setEnabledFeatures([...ALWAYS_ON]) } else { setEnabledFeatures([...new Set([...ALWAYS_ON, ...allIds])]) } }} style={{ background: 'none', border: `1px solid ${accentColor}`, borderRadius: 8, padding: '4px 12px', color: accentColor, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{features.every(f => enabledFeatures.includes(f.id)) ? 'Deselect all' : 'Select all'}</button></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 420, overflowY: 'auto' }}>
            {Object.entries(featureGroups).map(([group, gf]) => (<div key={group}><div style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{group}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{gf.map(f => { const isOn = enabledFeatures.includes(f.id); const isLocked = ALWAYS_ON.includes(f.id); return (<button key={f.id} onClick={() => toggleFeature(f.id)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isLocked ? 'default' : 'pointer', border: `1px solid ${isOn ? accentColor : '#374151'}`, background: isOn ? accentColor + '22' : '#111318', color: isOn ? accentColor : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}><span>{f.icon}</span><span>{f.label}</span>{isOn && !isLocked && <Check size={12} />}{isLocked && <span style={{ fontSize: 9, opacity: 0.6 }}>always on</span>}</button>) })}</div></div>))}
          </div>
        </div>)}

        {step === 4 && (<div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Invite your team</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Add your manager, agent, coach or physio. All optional.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map((inv, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><input value={inv.name} onChange={e => { const n = [...invites]; n[i].name = e.target.value; setInvites(n) }} placeholder="Name" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 13, boxSizing: 'border-box' }} /><input value={inv.email} onChange={e => { const n = [...invites]; n[i].email = e.target.value; setInvites(n) }} placeholder="Email" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 13, boxSizing: 'border-box' }} /><select value={inv.role} onChange={e => { const n = [...invites]; n[i].role = e.target.value; setInvites(n) }} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 13 }}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>{invites.length > 1 && <button onClick={() => setInvites(invites.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', marginTop: 8 }}><X size={16} /></button>}</div>))}
            {invites.length < 5 && <button onClick={() => setInvites([...invites, { name: '', email: '', role: 'Manager' }])} style={{ background: 'none', border: 'none', color: accentColor, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}><Plus size={14} /> Add another</button>}
          </div>
        </div>)}

        {step === 5 && (<div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How would you like to get started?</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Choose how your portal gets configured.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setSetupType('lumio')} style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: setupType === 'lumio' ? accentColor + '15' : '#111318', border: `2px solid ${setupType === 'lumio' ? accentColor : '#1F2937'}`, transition: 'all 0.2s' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}><span style={{ fontSize: 24 }}>✨</span><span style={{ background: accentColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>RECOMMENDED</span></div><div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Set it up for me</div><div style={{ color: '#9CA3AF', fontSize: 13 }}>Our team configures your portal, connects your integrations, and hands you a fully working setup.</div><div style={{ color: accentColor, fontSize: 12, marginTop: 8, fontWeight: 600 }}>Estimated: 2-3 business days</div></button>
            <div style={{ padding: 20, borderRadius: 14, textAlign: 'left', pointerEvents: 'none', opacity: 0.5, cursor: 'not-allowed', background: '#111318', border: '2px solid #1F2937' }}><div style={{ fontSize: 24, marginBottom: 8 }}>🔧</div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>I&apos;ll set it up myself</span><span style={{ background: '#374151', color: '#9CA3AF', fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>Coming soon</span></div><div style={{ color: '#9CA3AF', fontSize: 13 }}>Walk through connecting your accounts and integrations now.</div></div>
          </div>
        </div>)}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>← Back</button> : <div />}
          {step === 4 && <button onClick={() => setStep(5)} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 13, cursor: 'pointer' }}>Skip →</button>}
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !displayName.trim()} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: (step === 1 && !displayName.trim()) ? '#374151' : accentColor, color: '#fff' }}>Continue →</button>
          ) : (
            <button onClick={saveAndComplete} disabled={!setupType || saving} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: (!setupType || saving) ? '#374151' : accentColor, color: '#fff' }}>{saving ? 'Setting up...' : 'Go to my portal →'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
