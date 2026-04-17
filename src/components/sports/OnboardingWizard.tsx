'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SPORT_FEATURES, ALWAYS_ON } from '@/lib/sports/features'
import { SPORT_STATS } from '@/lib/sports/cardStats'
import { Check, Upload, Plus, X } from 'lucide-react'

const SPORT_CONFIG: Record<string, {
  step2Title: string
  step2Sub: string
  step2Fields: { id: string; label: string; placeholder: string; hint: string }[]
  step3Title: string
  step3Sub: string
  step3Type: 'airport' | 'gym'
  step4Title: string
  step4Sub: string
  step4Options: string[]
  step4Hints: Record<string, string>
  step5Title: string
  step5Sub: string
  step5Type: 'music' | 'caddie' | 'weightclass'
  step6TeamRoles: string[]
  emailSectionLabel: string
}> = {
  darts: {
    step2Title: 'PDC & DartConnect',
    step2Sub: 'Links your official ranking and match history to your portal.',
    step2Fields: [
      { id: 'field1', label: 'PDC Membership ID', placeholder: 'e.g. PDC-004719', hint: 'Found on your PDC membership card or login portal' },
      { id: 'field2', label: 'DartConnect Username', placeholder: 'Your DartConnect handle', hint: 'Powers match history sync — being activated for founding members' },
    ],
    step3Title: 'Home airport',
    step3Sub: 'Powers Smart Flights AI for every PDC Tour venue worldwide.',
    step3Type: 'airport',
    step4Title: 'Practice tracker',
    step4Sub: 'Syncs your sessions and doubles % automatically.',
    step4Options: ['DartCounter', 'Lidarts', 'DartsForData', 'None / Manual'],
    step4Hints: {
      'Lidarts': '✓ Live stats sync available — we activate this during setup',
      'DartCounter': 'Partnership required — we handle the connection for you',
      'DartsForData': 'Manual sync for now — full API access in progress',
    },
    step5Title: 'Walk-on music',
    step5Sub: 'Stored and submitted for broadcaster clearance on your behalf.',
    step5Type: 'music',
    step6TeamRoles: ['Manager','Agent','Coach','Physio','Sports Psychologist','Nutritionist','Videographer','PA','Other'],
    emailSectionLabel: 'PDC & Practice',
  },
  golf: {
    step2Title: 'Tour card & ranking',
    step2Sub: 'Links your DP World Tour / PGA Tour status and world ranking to your portal.',
    step2Fields: [
      { id: 'field1', label: 'DP World Tour / PGA Tour card number', placeholder: 'e.g. DPW-00341', hint: 'Found on your tour membership portal' },
      { id: 'field2', label: 'Official World Golf Ranking (OWGR) number', placeholder: 'e.g. 47', hint: 'Your current OWGR position — we track movement automatically' },
      { id: 'field3', label: 'DataGolf username', placeholder: 'Your DataGolf handle', hint: 'Powers strokes-gained analytics — optional' },
    ],
    step3Title: 'Home airport',
    step3Sub: 'Powers Smart Flights AI for every Tour event worldwide.',
    step3Type: 'airport',
    step4Title: 'Practice technology',
    step4Sub: 'Syncs your on-course and range data automatically.',
    step4Options: ['TrackMan', 'Arccos Pro', 'DataGolf', 'None / Manual'],
    step4Hints: {
      'TrackMan': '✓ TrackMan API available — we activate this during setup',
      'Arccos Pro': 'Arccos API available — we handle the connection for you',
      'DataGolf': '✓ Live strokes-gained sync available',
      'None / Manual': '',
    },
    step5Title: 'Caddie details',
    step5Sub: 'Your caddie is added to your team and flagged in travel planning.',
    step5Type: 'caddie',
    step6TeamRoles: ['Caddie','Coach','Manager','Agent','Physio','Fitness Trainer','Sports Psychologist','Nutritionist','PA','Other'],
    emailSectionLabel: 'Tour & Ranking',
  },
  tennis: {
    step2Title: 'ATP / WTA details',
    step2Sub: 'Links your official ranking and race points to your portal.',
    step2Fields: [
      { id: 'field1', label: 'ATP / WTA player ID', placeholder: 'e.g. ATG-100432', hint: 'Found on your ATP or WTA member login' },
      { id: 'field2', label: 'Current ranking', placeholder: 'e.g. 47', hint: 'We track weekly ranking movements automatically' },
      { id: 'field3', label: 'SwingVision username', placeholder: 'Your SwingVision handle', hint: 'Powers shot analytics and video tagging — official LTA & Tennis Australia app' },
    ],
    step3Title: 'Home airport',
    step3Sub: 'Powers Smart Flights AI for every ATP / WTA Tour stop.',
    step3Type: 'airport',
    step4Title: 'Practice technology',
    step4Sub: 'Syncs your match data and training sessions automatically.',
    step4Options: ['SwingVision', 'PlaySight', 'Hawkeye', 'None / Manual'],
    step4Hints: {
      'SwingVision': '✓ Official LTA & Tennis Australia app — we activate sync during setup',
      'PlaySight': 'PlaySight API available — we handle the connection for you',
      'Hawkeye': 'Hawkeye Insight access varies by venue — we will confirm during setup',
      'None / Manual': '',
    },
    step5Title: 'Walk-on music',
    step5Sub: 'Stored and managed for tournament and broadcast use.',
    step5Type: 'music',
    step6TeamRoles: ['Coach','Manager','Agent','Physio','Fitness Trainer','Sports Psychologist','Nutritionist','Hitting Partner','PA','Other'],
    emailSectionLabel: 'ATP / WTA & Ranking',
  },
  boxing: {
    step2Title: 'Boxing credentials',
    step2Sub: 'Links your BoxRec profile and BBBofC licence to your portal.',
    step2Fields: [
      { id: 'field1', label: 'BoxRec ID', placeholder: 'e.g. 802341', hint: 'Your public BoxRec profile number' },
      { id: 'field2', label: 'BBBofC licence number', placeholder: 'e.g. BBB-2024-00912', hint: 'British Boxing Board of Control licence — expiry tracked automatically' },
      { id: 'field3', label: 'Promoter', placeholder: 'e.g. Matchroom Boxing', hint: 'Primary promoter name — used in fight camp and contract tracking' },
    ],
    step3Title: 'Home gym',
    step3Sub: 'Used for training camp planning, venue finder AI and travel logistics.',
    step3Type: 'gym',
    step4Title: 'Weight class & sanctioning bodies',
    step4Sub: 'We track mandatory challengers, rankings and title shot timelines.',
    step4Options: ['WBC', 'WBA', 'IBF', 'WBO', 'IBO', 'None / Independent'],
    step4Hints: {
      'WBC': '✓ WBC rankings tracked — we pull updates during setup',
      'WBA': '✓ WBA ratings tracked automatically',
      'IBF': '✓ IBF rankings tracked automatically',
      'WBO': '✓ WBO rankings tracked automatically',
      'IBO': 'IBO recognition tracked — smaller sanctioning body',
      'None / Independent': '',
    },
    step5Title: 'Fight camp setup',
    step5Sub: 'We will configure your fight camp planner, GPS load targets and BBBofC compliance dashboard during your portal setup.',
    step5Type: 'weightclass',
    step6TeamRoles: ['Trainer','Cut Man','Physio','Strength & Conditioning','Manager','Promoter Rep','Agent','Sports Psychologist','Nutritionist','Sparring Partner','PA','Other'],
    emailSectionLabel: 'Boxing Credentials',
  },
}

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

  const [phase, setPhase] = useState<'onboarding' | 'integrations' | 'integrations-done'>('onboarding')
  const [iStep, setIStep] = useState(1)
  const ITOTAL = 8
  const [iEmail, setIEmail] = useState('')
  const [iPhone, setIPhone] = useState('')
  const [field1, setField1] = useState('')
  const [field2, setField2] = useState('')
  const [field3, setField3] = useState('')
  const [gymLocation, setGymLocation] = useState('')
  const [weightClass, setWeightClass] = useState('')
  const [caddieeName, setCaddieeName] = useState('')
  const [caddiePhone, setCaddiePhone] = useState('')
  const [sanctioningBodies, setSanctioningBodies] = useState<string[]>([])
  const cfg = SPORT_CONFIG[sport] ?? SPORT_CONFIG.darts
  const [airport, setAirport] = useState('')
  const [airportName, setAirportName] = useState('')
  const [tracker, setTracker] = useState('')
  const [walkon, setWalkon] = useState('')
  const [bpm, setBpm] = useState('')
  const [teamMembers, setTeamMembers] = useState<{name:string;role:string}[]>([])
  const [sponsors, setSponsors] = useState<{name:string;email:string;cat:string}[]>([])
  const [addTName, setAddTName] = useState('')
  const [addTRole, setAddTRole] = useState('Manager')
  const [addSName, setAddSName] = useState('')
  const [addSEmail, setAddSEmail] = useState('')
  const [addSCat, setAddSCat] = useState('Equipment')
  const [iSaving, setISaving] = useState(false)
  const TEAM_ROLES = ['Manager','Agent','Coach','Physio','Sports Psychologist','Nutritionist','Videographer','PA','Other']
  const SPONSOR_CATS = ['Equipment','Apparel','Betting','Energy','Tech','Finance','Other']
  const TRACKERS = ['DartCounter', 'Lidarts', 'DartsForData', 'None / Manual']

  function detectAirport() {
    if (!navigator.geolocation) return
    const AIRPORTS = [
      {c:'LHR',n:'Heathrow',lat:51.470,lng:-0.454},{c:'LGW',n:'Gatwick',lat:51.148,lng:-0.190},
      {c:'MAN',n:'Manchester',lat:53.354,lng:-2.275},{c:'BHX',n:'Birmingham',lat:52.453,lng:-1.748},
      {c:'EDI',n:'Edinburgh',lat:55.950,lng:-3.372},{c:'GLA',n:'Glasgow',lat:55.872,lng:-4.433},
      {c:'BRS',n:'Bristol',lat:51.383,lng:-2.719},{c:'NCL',n:'Newcastle',lat:55.038,lng:-1.692},
      {c:'LBA',n:'Leeds Bradford',lat:53.866,lng:-1.661},{c:'STN',n:'Stansted',lat:51.885,lng:0.235},
      {c:'LTN',n:'Luton',lat:51.874,lng:-0.368},{c:'SOU',n:'Southampton',lat:50.950,lng:-1.356},
      {c:'EMA',n:'East Midlands',lat:52.831,lng:-1.328},{c:'CWL',n:'Cardiff',lat:51.397,lng:-3.343},
      {c:'BFS',n:'Belfast Int.',lat:54.657,lng:-6.216},{c:'DUB',n:'Dublin',lat:53.421,lng:-6.270},
      {c:'AMS',n:'Amsterdam',lat:52.310,lng:4.768},{c:'DUS',n:'Düsseldorf',lat:51.289,lng:6.767},
      {c:'FRA',n:'Frankfurt',lat:50.033,lng:8.571},{c:'CDG',n:'Paris CDG',lat:49.009,lng:2.548},
    ]
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: la, longitude: lo } = pos.coords
      let best = AIRPORTS[0], bestD = 999
      AIRPORTS.forEach(a => { const d = Math.hypot(a.lat - la, a.lng - lo); if (d < bestD) { bestD = d; best = a } })
      setAirport(best.c)
      setAirportName(best.n)
    }, () => {}, { timeout: 8000 })
  }

  async function submitIntegrations() {
    setISaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const mergedInvites = [
          ...invites.filter(i => i.name.trim()),
          ...teamMembers.map(m => ({ name: m.name, role: m.role, email: '' })),
        ]
        await supabase.from('sports_profiles').update({
          invites: mergedInvites,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)
      }
      const fieldsEntries: Record<string, string> = {}
      if (cfg.step2Fields[0]) fieldsEntries[cfg.step2Fields[0].label] = field1
      if (cfg.step2Fields[1]) fieldsEntries[cfg.step2Fields[1].label] = field2
      if (cfg.step2Fields[2]) fieldsEntries[cfg.step2Fields[2].label] = field3
      const integrations: Record<string, unknown> = {
        fields: fieldsEntries,
        team: teamMembers,
        sponsors,
      }
      if (cfg.step3Type === 'airport') { integrations.airport = airport; integrations.airportName = airportName }
      else { integrations.gymLocation = gymLocation }
      if (sport === 'boxing') { integrations.sanctioningBodies = sanctioningBodies; integrations.weightClass = weightClass }
      else { integrations.tracker = tracker }
      if (cfg.step5Type === 'music') { integrations.walkon = walkon; integrations.bpm = bpm }
      if (cfg.step5Type === 'caddie') { integrations.caddieeName = caddieeName; integrations.caddiePhone = caddiePhone }
      await fetch('/api/sports-auth/notify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          sport,
          email: iEmail || profile.email,
          phone: iPhone,
          clubName,
          location,
          portalSlug,
          setupType: 'lumio',
          integrations,
        })
      }).catch(() => {})
    } finally {
      setISaving(false)
      const finalSlug = portalSlug.trim() || slugify(displayName)
      onComplete(enabledFeatures, finalSlug)
    }
  }

  const compressImage = (file: File, size: number): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = size; c.height = size; c.getContext('2d')!.drawImage(img, 0, 0, size, size); resolve(c.toDataURL('image/jpeg', 0.7)) }; img.onerror = reject; img.src = e.target?.result as string }
    reader.onerror = reject; reader.readAsDataURL(file)
  })

  const toggleFeature = (id: string) => { if (ALWAYS_ON.includes(id)) return; setEnabledFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]) }
  const slugify = (val: string) => val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const saveAndComplete = async () => {
    const finalSlug = portalSlug.trim() || slugify(displayName)
    if (!finalSlug) return
    setSaving(true)
    try {
      // Resolve the real auth user id — sports_profiles is keyed on the auth
      // UUID, NOT on email. Earlier callers passed `profile.id = session.email`,
      // which silently matched zero rows and left onboarding_complete = false,
      // bouncing users back to the wizard on next mount.
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[OnboardingWizard] saveAndComplete: no auth user; cannot persist profile')
        setSaving(false)
        return
      }
      const { error: updateError } = await supabase.from('sports_profiles').update({
        display_name: displayName, nickname, avatar_url: photoDataUrl, portal_slug: finalSlug,
        club_name: clubName, location, brand_logo_url: brandLogoDataUrl, enabled_features: enabledFeatures,
        invites: invites.filter(i => i.email), setup_type: setupType, onboarding_complete: true,
      }).eq('id', user.id)
      if (updateError) {
        console.error('[OnboardingWizard] saveAndComplete: profile update failed', updateError)
        setSaving(false)
        return
      }
      if (setupType === 'lumio') {
        fetch('/api/sports-auth/notify-setup', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: displayName, sport, email: profile.email, clubName, location, portalSlug: finalSlug, setupType })
        }).catch(() => {})
      }
      if (typeof window !== 'undefined' && finalSlug) {
        window.history.replaceState(null, '', window.location.pathname.replace('/app', `/${finalSlug}`))
      }
    } catch (e) { console.error(e) }
    setSaving(false)
    if (setupType === 'lumio') {
      setPhase('integrations')
    } else {
      onComplete(enabledFeatures, finalSlug)
    }
  }

  const featureGroups = features.reduce((acc, f) => { if (!acc[f.group]) acc[f.group] = []; acc[f.group].push(f); return acc }, {} as Record<string, typeof features>)

  if (phase === 'integrations') {
    const inputStyle = { width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const }
    const labelStyle = { color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
    const rowInput = { flex: 1, background: '#111318', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box' as const }
    const rowSelect = { background: '#111318', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13 }
    const addBtn = { background: accentColor, color: '#000', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
    const reviewItem = (label: string, value: string, full = false) => (
      <div style={{ background: '#111318', borderRadius: 8, padding: '8px 11px', border: '1px solid #1F2937', gridColumn: full ? '1 / -1' : undefined }}>
        <span style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 2 }}>{label}</span>
        <span style={{ fontSize: 13, color: value ? '#fff' : '#374151' }}>{value || '—'}</span>
      </div>
    )
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#07080F', zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 48, objectFit: 'contain', marginBottom: 24 }} />
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: ITOTAL }).map((_, i) => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < iStep ? accentColor : '#1F2937', transition: 'background 0.3s' }} />))}</div>
          <p style={{ color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'right' }}>Step {iStep} of {ITOTAL}</p>
        </div>
        <div style={{ width: '100%', maxWidth: 560, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 36 }}>

          {iStep === 1 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Your details</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Your browser fills most of this automatically — just check and confirm.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Email address</label><input type="email" autoComplete="email" placeholder="your@email.com" value={iEmail} onChange={e => setIEmail(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone number</label><input type="tel" autoComplete="tel" placeholder="+44 7xxx xxxxxx" value={iPhone} onChange={e => setIPhone(e.target.value)} style={inputStyle} /></div>
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Pre-filled where possible from your browser&apos;s saved details.</p>
            </div>
          </div>)}

          {iStep === 2 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cfg.step2Title}</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>{cfg.step2Sub}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cfg.step2Fields.map((f, i) => {
                const val = i === 0 ? field1 : i === 1 ? field2 : field3
                const setter = i === 0 ? setField1 : i === 1 ? setField2 : setField3
                return (
                  <div key={f.id}>
                    <label style={labelStyle}>{f.label}</label>
                    <input placeholder={f.placeholder} value={val} onChange={e => setter(e.target.value)} style={inputStyle} />
                    <p style={{ fontSize: 12, color: '#4B5563', marginTop: 5 }}>{f.hint}</p>
                  </div>
                )
              })}
            </div>
          </div>)}

          {iStep === 3 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cfg.step3Title}</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>{cfg.step3Sub}</p>
            {cfg.step3Type === 'airport' ? (<>
              <label style={labelStyle}>Home airport IATA code</label>
              <input placeholder="e.g. LHR, MAN, BHX" maxLength={4} value={airport} onChange={e => setAirport(e.target.value.toUpperCase())} style={{ ...inputStyle, fontFamily: 'monospace' }} />
              <button onClick={detectAirport} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, background: accentColor + '15', border: '1px solid ' + accentColor + '40', color: accentColor, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{airportName ? '✓ Detected: ' + airportName : '⬡ Detect my nearest airport'}</button>
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 10 }}>We use this to pre-fill Smart Flights for every tour stop.</p>
            </>) : (<>
              <label style={labelStyle}>Home gym</label>
              <input placeholder="e.g. Hatton Garden Boxing Club, Manchester" value={gymLocation} onChange={e => setGymLocation(e.target.value)} style={inputStyle} />
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 10 }}>Used for venue finder AI and training camp planning</p>
            </>)}
          </div>)}

          {iStep === 4 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cfg.step4Title}</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>{cfg.step4Sub}</p>
            {sport === 'boxing' ? (<>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cfg.step4Options.map(opt => {
                  const on = sanctioningBodies.includes(opt)
                  return <button key={opt} onClick={() => setSanctioningBodies(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer', border: `1px solid ${on ? accentColor : '#374151'}`, background: on ? accentColor + '22' : '#111318', color: on ? accentColor : '#6B7280', transition: 'all 0.2s' }}>{opt}</button>
                })}
              </div>
              {sanctioningBodies.map(b => cfg.step4Hints[b] ? <p key={b} style={{ fontSize: 12, color: b === 'IBO' || b === 'None / Independent' ? '#6B7280' : accentColor, marginTop: 8 }}>{cfg.step4Hints[b]}</p> : null)}
              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>Weight class</label>
                <input placeholder="e.g. Super Welterweight (154 lbs)" value={weightClass} onChange={e => setWeightClass(e.target.value)} style={inputStyle} />
              </div>
            </>) : (<>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cfg.step4Options.map(opt => {
                  const on = tracker === opt
                  return <button key={opt} onClick={() => setTracker(opt)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer', border: `1px solid ${on ? accentColor : '#374151'}`, background: on ? accentColor + '22' : '#111318', color: on ? accentColor : '#6B7280', transition: 'all 0.2s' }}>{opt}</button>
                })}
              </div>
              {tracker && cfg.step4Hints[tracker] && <p style={{ fontSize: 12, color: cfg.step4Hints[tracker].startsWith('✓') ? accentColor : '#6B7280', marginTop: 10 }}>{cfg.step4Hints[tracker]}</p>}
            </>)}
          </div>)}

          {iStep === 5 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cfg.step5Title}</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>{cfg.step5Sub}</p>
            {cfg.step5Type === 'music' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={labelStyle}>Track name + artist</label><input placeholder="e.g. Enter Sandman — Metallica" value={walkon} onChange={e => setWalkon(e.target.value)} style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>BPM</label>
                  <input type="number" placeholder="e.g. 123" value={bpm} onChange={e => setBpm(e.target.value)} style={inputStyle} />
                  <p style={{ fontSize: 12, color: '#4B5563', marginTop: 5 }}>Optional — we can detect BPM automatically from the track name</p>
                </div>
                <p style={{ fontSize: 12, color: '#4B5563', marginTop: 12 }}>We submit clearance requests to Northbridge Sport, DAZN, Crown TV and Crown Broadcasting on your behalf.</p>
              </div>
            )}
            {cfg.step5Type === 'caddie' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={labelStyle}>Caddie name</label><input placeholder="e.g. John Smith" value={caddieeName} onChange={e => setCaddieeName(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Caddie phone / WhatsApp</label><input type="tel" placeholder="+44 7xxx xxxxxx" value={caddiePhone} onChange={e => setCaddiePhone(e.target.value)} style={inputStyle} /></div>
                <p style={{ fontSize: 12, color: '#4B5563', marginTop: 8 }}>Your caddie is added to your team automatically and flagged in all travel planning</p>
              </div>
            )}
            {cfg.step5Type === 'weightclass' && (
              <div style={{ background: '#111318', border: `1px solid ${accentColor}40`, borderRadius: 12, padding: 16 }}>
                {[
                  'Camp Mode will be pre-loaded for your weight class',
                  'BBBofC licence expiry tracked automatically',
                  'GPS ACWR load targets set to boxing defaults',
                  'Purse bid calculator ready for your division',
                ].map((line, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
                    <span style={{ color: accentColor, marginRight: 6 }}>✓</span>{line}
                  </div>
                ))}
              </div>
            )}
          </div>)}

          {iStep === 6 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Your team</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Manager, coach, agent, physio — everyone in one place.</p>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {teamMembers.length === 0 ? <p style={{ fontSize: 13, color: '#4B5563' }}>No team members added yet</p> : teamMembers.map((t, i) => (
                <div key={i} style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#fff', fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{t.role}</span>
                  <button onClick={() => setTeamMembers(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 15 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Full name" value={addTName} onChange={e => setAddTName(e.target.value)} style={rowInput} />
              <select value={addTRole} onChange={e => setAddTRole(e.target.value)} style={rowSelect}>{cfg.step6TeamRoles.map(r => <option key={r} value={r}>{r}</option>)}</select>
              <button onClick={() => { if (addTName.trim()) { setTeamMembers(prev => [...prev, { name: addTName.trim(), role: addTRole }]); setAddTName('') } }} style={addBtn}>Add</button>
            </div>
            <p style={{ fontSize: 12, color: '#4B5563', marginTop: 12 }}>Add everyone now or fill this in once we hand over your portal.</p>
          </div>)}

          {iStep === 7 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Your sponsors</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>We track obligations, content schedules and renewal dates.</p>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {sponsors.length === 0 ? <p style={{ fontSize: 13, color: '#4B5563' }}>No sponsors added yet</p> : sponsors.map((s, i) => (
                <div key={i} style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#fff', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: accentColor, background: accentColor + '22', borderRadius: 4, padding: '2px 6px' }}>{s.cat}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{s.email}</span>
                  <button onClick={() => setSponsors(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 15 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Sponsor name" value={addSName} onChange={e => setAddSName(e.target.value)} style={rowInput} />
              <input type="email" placeholder="Contact email" value={addSEmail} onChange={e => setAddSEmail(e.target.value)} style={rowInput} />
              <select value={addSCat} onChange={e => setAddSCat(e.target.value)} style={rowSelect}>{SPONSOR_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <button onClick={() => { if (addSName.trim()) { setSponsors(prev => [...prev, { name: addSName.trim(), email: addSEmail.trim(), cat: addSCat }]); setAddSName(''); setAddSEmail('') } }} style={addBtn}>Add</button>
            </div>
          </div>)}

          {iStep === 8 && (<div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Review everything</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Once you submit, the Lumio team gets everything they need to configure your portal.</p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>Your details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {reviewItem('Email', iEmail)}
                {reviewItem('Phone', iPhone)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>{cfg.emailSectionLabel}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {cfg.step2Fields.map((f, i) => {
                  const v = i === 0 ? field1 : i === 1 ? field2 : field3
                  return <div key={f.id}>{reviewItem(f.label, v)}</div>
                })}
                {cfg.step3Type === 'airport'
                  ? reviewItem('Home airport', airport ? (airportName ? `${airport} (${airportName})` : airport) : '')
                  : reviewItem('Home gym', gymLocation)}
                {sport === 'boxing'
                  ? <>{reviewItem('Sanctioning bodies', sanctioningBodies.join(', '))}{reviewItem('Weight class', weightClass)}</>
                  : reviewItem('Practice tracker', tracker)}
              </div>
            </div>

            {cfg.step5Type === 'music' && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>Walk-on music</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {reviewItem('Track', walkon, true)}
                  {reviewItem('BPM', bpm)}
                </div>
              </div>
            )}
            {cfg.step5Type === 'caddie' && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>Caddie</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {reviewItem('Name', caddieeName)}
                  {reviewItem('Phone', caddiePhone)}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>Team ({teamMembers.length})</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {teamMembers.length === 0 ? reviewItem('Team', 'None added', true) : teamMembers.map((t, i) => <div key={i}>{reviewItem(t.role, t.name)}</div>)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 8 }}>Sponsors ({sponsors.length})</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {sponsors.length === 0 ? reviewItem('Sponsors', 'None added', true) : sponsors.map((s, i) => <div key={i}>{reviewItem(s.cat, s.name)}</div>)}
              </div>
            </div>
          </div>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            {iStep > 1 ? <button onClick={() => setIStep(s => s - 1)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>← Back</button> : <div />}
            {iStep < 8 ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setIStep(s => s + 1)} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 13, cursor: 'pointer' }}>Skip →</button>
                <button onClick={() => setIStep(s => s + 1)} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: accentColor, color: '#fff' }}>Next →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => { const fs = portalSlug.trim() || slugify(displayName); onComplete(enabledFeatures, fs) }} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 13, cursor: 'pointer' }}>Skip — go to portal →</button>
                <button onClick={submitIntegrations} disabled={iSaving} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: iSaving ? 'default' : 'pointer', background: iSaving ? '#374151' : accentColor, color: '#fff' }}>{iSaving ? 'Submitting...' : 'Submit & go to portal →'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
