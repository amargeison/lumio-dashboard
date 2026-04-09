'use client'

import { useState, useRef, useCallback } from 'react'

// ── TYPES ──────────────────────────────────────────────────────────────────
export interface SportsDemoSession {
  email: string
  userName: string
  clubName: string
  role: string
  photoDataUrl: string | null
  logoDataUrl: string | null
  sport: string
  verifiedAt: string
}

export type SportKey =
  | 'rugby' | 'football' | 'womens' | 'nonleague' | 'grassroots'
  | 'golf' | 'tennis' | 'darts' | 'cricket'

interface SportsDemoGateProps {
  sport: string
  defaultClubName: string
  defaultSlug?: string
  accentColor: string
  accentColorLight?: string
  sportEmoji?: string
  sportLabel: string
  roles: Array<{ id: string; label: string; icon: string; description?: string }>
  children: (session: SportsDemoSession) => React.ReactNode
}

// ── LOCALSTORAGE KEY ──────────────────────────────────────────────────────
const sessionKey = (sport: string) => `lumio_sports_demo_${sport}`

export function getSession(sport: string): SportsDemoSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sessionKey(sport))
    if (!raw) return null
    return JSON.parse(raw) as SportsDemoSession
  } catch { return null }
}

export function saveSession(sport: string, session: SportsDemoSession) {
  if (typeof window === 'undefined') return
  localStorage.setItem(sessionKey(sport), JSON.stringify(session))
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function SportsDemoGate({
  sport, defaultClubName, accentColor, accentColorLight,
  sportEmoji, sportLabel, roles, children,
}: SportsDemoGateProps) {
  void accentColorLight // available for future use

  const existingSession = (() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(sessionKey(sport))
      if (!raw) return null
      return JSON.parse(raw) as SportsDemoSession
    } catch { return null }
  })()

  const [session, setSession] = useState<SportsDemoSession | null>(existingSession)
  const [step, setStep] = useState<'email'|'otp'|'onboarding'|'done'>(existingSession ? 'done' : 'email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [userName, setUserName] = useState('')
  const [clubName, setClubName] = useState(defaultClubName)
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const requestOtp = async () => {
    if (!email || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-demo/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sport, clubName: defaultClubName }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStep('otp')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (!code || code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-demo/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, sport }),
      })
      const data = await res.json()
      if (!data.verified && !data.success) throw new Error(data.error ?? 'Invalid code')
      setStep('onboarding')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid or expired code.') }
    setLoading(false)
  }

  const completeOnboarding = () => {
    if (!userName.trim()) { setError('Please enter your name.'); return }
    const newSession: SportsDemoSession = {
      email, userName: userName.trim(), clubName: clubName.trim() || defaultClubName,
      role: selectedRole, photoDataUrl, logoDataUrl, sport,
      verifiedAt: new Date().toISOString(),
    }
    localStorage.setItem(sessionKey(sport), JSON.stringify(newSession))
    localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
    setSession(newSession); setStep('done')
  }

  const resetSession = () => {
    localStorage.removeItem(sessionKey(sport))
    localStorage.removeItem(`lumio_${sport}_demo_active`)
    setSession(null); setStep('email'); setEmail(''); setCode('')
    setUserName(''); setClubName(defaultClubName); setPhotoDataUrl(null)
    setLogoDataUrl(null); setShowResetConfirm(false); setError('')
  }

  // ── AUTHENTICATED ──
  if (step === 'done' && session) {
    return (
      <div className="relative">
        {children(session)}
        {showResetConfirm ? (
          <div className="fixed bottom-4 left-4 z-50 bg-[#0d1117] border border-red-600/40 rounded-xl p-4 shadow-2xl">
            <p className="text-xs text-gray-300 mb-3">Exit demo and clear session?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Cancel</button>
              <button onClick={resetSession} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30">Exit demo</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)} className="fixed bottom-4 left-4 z-50 text-[10px] text-gray-700 hover:text-gray-500 transition-colors">Exit demo</button>
        )}
      </div>
    )
  }

  const Overlay = ({ children: inner }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{sportEmoji}</div>
          <div className="text-xl font-bold text-white">{sportLabel}</div>
          <div className="text-sm text-gray-500 mt-1">Interactive demo</div>
        </div>
        {inner}
      </div>
    </div>
  )

  // ── STEP 1: EMAIL ──
  if (step === 'email') return (
    <Overlay>
      <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8">
        <h2 className="text-lg font-bold text-white mb-1">Explore the demo</h2>
        <p className="text-sm text-gray-400 mb-6">Enter your email to get instant access. We&apos;ll send a quick verification code.</p>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && requestOtp()} placeholder="your@email.com" autoFocus
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 mb-3" />
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <button onClick={requestOtp} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: loading ? '#374151' : accentColor }}>{loading ? 'Sending code...' : 'Get access →'}</button>
        <p className="text-[11px] text-gray-600 text-center mt-4">No password. No credit card. Just a quick code to keep bots out.</p>
      </div>
    </Overlay>
  )

  // ── STEP 2: OTP ──
  if (step === 'otp') return (
    <Overlay>
      <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8">
        <h2 className="text-lg font-bold text-white mb-1">Check your email</h2>
        <p className="text-sm text-gray-400 mb-6">We sent a 6-digit code to <span className="text-white font-medium">{email}</span>.</p>
        <input type="text" value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
          onKeyDown={e => e.key === 'Enter' && verifyOtp()} placeholder="000000" maxLength={6} autoFocus
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-bold text-white text-center tracking-widest placeholder-gray-700 focus:outline-none focus:border-gray-500 mb-3" />
        {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
        <button onClick={verifyOtp} disabled={loading || code.length < 6} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{ background: accentColor }}>{loading ? 'Verifying...' : 'Verify →'}</button>
        <button onClick={() => { setStep('email'); setCode(''); setError('') }} className="w-full mt-3 py-2 text-xs text-gray-600 hover:text-gray-400">← Use a different email</button>
      </div>
    </Overlay>
  )

  // ── STEP 3: ONBOARDING ──
  if (step === 'onboarding') return (
    <Overlay>
      <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
        <div><h2 className="text-lg font-bold text-white mb-1">Make it yours</h2><p className="text-sm text-gray-400">Personalise the demo with your details.</p></div>
        <div className="space-y-3">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Club / Team name</label>
          <div className="flex gap-3 items-center">
            <button onClick={() => logoInputRef.current?.click()} className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden hover:border-gray-500 transition-colors" title="Upload club logo">
              {logoDataUrl ? <img src={logoDataUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-lg">{sportEmoji}</span>}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, setLogoDataUrl)} />
            <input type="text" value={clubName} onChange={e => setClubName(e.target.value)} placeholder={defaultClubName}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500" />
          </div>
          <p className="text-[10px] text-gray-700">Click the icon to upload your club logo</p>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Your name &amp; photo</label>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0">
              <button onClick={() => photoInputRef.current?.click()} className="relative group">
                <div className="w-20 h-28 rounded-lg flex flex-col items-center justify-between py-2 px-1.5 cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`, border: `1px solid ${accentColor}60` }}>
                  <div className="text-[8px] font-bold tracking-widest uppercase w-full text-center" style={{ color: accentColor }}>{sportLabel.toUpperCase()}</div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-800" style={{ borderColor: accentColor }}>
                    {photoDataUrl ? <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" /> : <span className="text-2xl">👤</span>}
                  </div>
                  <div className="text-[7px] text-center w-full truncate font-semibold text-white">{userName || 'YOUR NAME'}</div>
                  <div className="text-[6px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{roles.find(r => r.id === selectedRole)?.label ?? 'ROLE'}</div>
                </div>
                <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">Upload photo</span>
                </div>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, setPhotoDataUrl)} />
            </div>
            <div className="flex-1 space-y-2">
              <input type="text" value={userName} onChange={e => { setUserName(e.target.value); setError('') }} placeholder="Your name"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500" />
              <p className="text-[10px] text-gray-600">Click the card to upload your photo</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Your role</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(r => (
              <button key={r.id} onClick={() => setSelectedRole(r.id)}
                className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${selectedRole === r.id ? 'text-white' : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'}`}
                style={selectedRole === r.id ? { background: `${accentColor}15`, borderColor: `${accentColor}60` } : {}}>
                <span className="text-base flex-shrink-0">{r.icon}</span>
                <div><div className="text-xs font-semibold">{r.label}</div><div className="text-[10px] text-gray-600 mt-0.5">{r.description}</div></div>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button onClick={completeOnboarding} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: accentColor }}>Enter demo →</button>
        <p className="text-[11px] text-gray-600 text-center">Demo data only — nothing is saved to a real account.</p>
      </div>
    </Overlay>
  )

  return null
}

export { sessionKey }
export type { SportsDemoGateProps }
