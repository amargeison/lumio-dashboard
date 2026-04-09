'use client'

import { useState, useRef, useCallback, memo } from 'react'

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
  | 'golf' | 'tennis' | 'darts' | 'cricket' | 'boxing'

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

// ── STABLE STEP COMPONENTS (prevent input remount on keystroke) ───────────

const ClubStep = memo(function ClubStep({
  clubNameRef, defaultClubName, logoDataUrl, setLogoDataUrl, logoInputRef,
  handlePhotoUpload, sportEmoji, roles, selectedRole, setSelectedRole,
  accentColor, onContinue,
}: {
  clubNameRef: React.RefObject<HTMLInputElement | null>
  defaultClubName: string
  logoDataUrl: string | null
  setLogoDataUrl: (v: string) => void
  logoInputRef: React.RefObject<HTMLInputElement | null>
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => void
  sportEmoji?: string
  roles: Array<{ id: string; label: string; icon: string; description?: string }>
  selectedRole: string
  setSelectedRole: (id: string) => void
  accentColor: string
  onContinue: () => void
}) {
  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Step 1 of 4</div>
        <h2 className="text-lg font-bold text-white mb-1">Set up your club</h2>
        <p className="text-sm text-gray-400">Add your club details and choose your role.</p>
      </div>
      <div className="space-y-3">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Club / Team name</label>
        <div className="flex gap-3 items-center">
          <button onClick={() => logoInputRef.current?.click()} className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden hover:border-gray-500 transition-colors" title="Upload club logo">
            {logoDataUrl ? <img src={logoDataUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-lg">{sportEmoji}</span>}
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, setLogoDataUrl)} />
          <input ref={clubNameRef} type="text" defaultValue={defaultClubName} placeholder={defaultClubName}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500" />
        </div>
        <p className="text-[10px] text-gray-700">Click the icon to upload your club logo</p>
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
      <button onClick={onContinue} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: accentColor }}>Continue →</button>
    </div>
  )
})

const ProfileStep = memo(function ProfileStep({
  userNameRef, photoDataUrl, setPhotoDataUrl, photoInputRef, handlePhotoUpload,
  accentColor, sportLabel, roles, selectedRole, defaultUserName,
  onContinue, onSkip,
}: {
  userNameRef: React.RefObject<HTMLInputElement | null>
  photoDataUrl: string | null
  setPhotoDataUrl: (v: string) => void
  photoInputRef: React.RefObject<HTMLInputElement | null>
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => void
  accentColor: string
  sportLabel: string
  roles: Array<{ id: string; label: string; icon: string; description?: string }>
  selectedRole: string
  defaultUserName: string
  onContinue: () => void
  onSkip: () => void
}) {
  const initials = (defaultUserName || 'DU').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Step 2 of 4</div>
        <h2 className="text-lg font-bold text-white mb-1">Add your photo — see how you look in Lumio</h2>
      </div>
      <div className="flex gap-8 items-start">
        {/* Photo upload */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <button onClick={() => photoInputRef.current?.click()} className="relative group">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden bg-gray-900 hover:border-gray-400 transition-colors">
              {photoDataUrl
                ? <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-gray-600">{initials}</span>}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">Upload</span>
            </div>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, setPhotoDataUrl)} />
          <p className="text-[10px] text-gray-600">Click to upload</p>
        </div>
        {/* FIFA card preview */}
        <div className="flex-shrink-0">
          <div className="w-28 h-40 rounded-lg flex flex-col items-center justify-between py-3 px-2"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`, border: `1px solid ${accentColor}60` }}>
            <div className="text-[8px] font-bold tracking-widest uppercase w-full text-center" style={{ color: accentColor }}>{sportLabel.toUpperCase()}</div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-800" style={{ borderColor: accentColor }}>
              {photoDataUrl ? <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-600">{initials}</span>}
            </div>
            <div className="text-[9px] text-center w-full truncate font-semibold text-white">{defaultUserName || 'YOUR NAME'}</div>
            <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{roles.find(r => r.id === selectedRole)?.label ?? 'ROLE'}</div>
          </div>
        </div>
      </div>
      <div>
        <input ref={userNameRef} type="text" defaultValue={defaultUserName} placeholder="Your name"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onContinue} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: accentColor }}>Continue →</button>
        <button onClick={onSkip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Skip</button>
      </div>
    </div>
  )
})

const EarlyAccessStep = memo(function EarlyAccessStep({
  accentColor, email, clubName, sport, onApply, onContinue,
}: {
  accentColor: string
  email: string
  clubName: string
  sport: string
  onApply: () => void
  onContinue: () => void
}) {
  const [applied, setApplied] = useState(false)

  const handleApply = async () => {
    try {
      await fetch('mailto:hello@lumiocms.com', { mode: 'no-cors' }).catch(() => {})
      // Fire-and-forget email — open mailto as fallback
      const subject = encodeURIComponent(`Early Access Application — ${clubName} (${sport})`)
      const body = encodeURIComponent(`Hi Lumio,\n\nI'd like to apply for early access.\n\nClub: ${clubName}\nSport: ${sport}\nEmail: ${email}\n\nThanks!`)
      window.open(`mailto:hello@lumiocms.com?subject=${subject}&body=${body}`, '_blank')
    } catch { /* ignore */ }
    setApplied(true)
    onApply()
  }

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Step 3 of 4</div>
        <h2 className="text-xl font-bold text-white mb-2">Want 6 months free with your own data?</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          We&apos;re looking for a small number of clubs to help us shape Lumio. Sign up for our early access programme and get 6 months completely free — no commitment, no contract, no pushy sales. All we ask at the end is an honest case study and the chance to keep working with you.
        </p>
      </div>
      <div className="space-y-2.5">
        {[
          '6 months completely free',
          'We build features you ask for',
          'No commitment or lock-in',
          'Honest feedback shapes the product',
        ].map(item => (
          <div key={item} className="flex items-center gap-2.5">
            <span className="text-green-400 text-sm">✓</span>
            <span className="text-sm text-gray-300">{item}</span>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <button onClick={handleApply} disabled={applied}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: accentColor }}>
          {applied ? 'Applied ✓' : 'Apply for Early Access'}
        </button>
        <button onClick={onContinue} className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">Continue →</button>
      </div>
    </div>
  )
})

const InviteStep = memo(function InviteStep({
  accentColor, sport, defaultSlug, inviteEmails, setInviteEmails,
  onSendAndContinue, onSkip,
}: {
  accentColor: string
  sport: string
  defaultSlug?: string
  inviteEmails: string[]
  setInviteEmails: (emails: string[]) => void
  onSendAndContinue: () => void
  onSkip: () => void
}) {
  const [copied, setCopied] = useState(false)
  const demoUrl = `lumiosports.com/${sport}/${defaultSlug || 'demo'}`

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${demoUrl}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Step 4 of 4</div>
        <h2 className="text-lg font-bold text-white mb-1">Invite colleagues to explore</h2>
        <p className="text-sm text-gray-400">Want to show a colleague? Send them a link to the demo — they can explore it alongside you.</p>
      </div>
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Demo link</label>
        <div className="flex gap-2">
          <input type="text" readOnly value={demoUrl}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400 focus:outline-none" />
          <button onClick={handleCopy} className="px-4 py-3 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Invite by email</label>
        {inviteEmails.map((em, i) => (
          <input key={i} type="email" value={em}
            onChange={e => {
              const next = [...inviteEmails]
              next[i] = e.target.value
              setInviteEmails(next)
            }}
            placeholder={`colleague${i + 1}@club.com`}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-gray-500" />
        ))}
      </div>
      <div className="space-y-3">
        <button onClick={onSendAndContinue} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: accentColor }}>Send &amp; continue →</button>
        <button onClick={onSkip} className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">Skip — go to demo →</button>
      </div>
    </div>
  )
})

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function SportsDemoGate({
  sport, defaultClubName, defaultSlug, accentColor, accentColorLight,
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

  const isDevHost = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('dev.') ||
    window.location.hostname === 'localhost'
  )

  const [session, setSession] = useState<SportsDemoSession | null>(existingSession)
  const [step, setStep] = useState<'email'|'otp'|'club'|'profile'|'earlyaccess'|'invite'|'done'>(existingSession ? 'done' : isDevHost ? 'club' : 'email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [inviteEmails, setInviteEmails] = useState(['', '', '', '', ''])

  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const clubNameRef = useRef<HTMLInputElement>(null)
  const userNameRef = useRef<HTMLInputElement>(null)

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
      setStep('club')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid or expired code.') }
    setLoading(false)
  }

  const finaliseSession = () => {
    const resolvedUserName = userNameRef.current?.value?.trim() || 'Demo User'
    const resolvedClubName = clubNameRef.current?.value?.trim() || defaultClubName
    console.log('finaliseSession called', { email, userName: resolvedUserName, clubName: resolvedClubName, role: selectedRole, logoDataUrl })

    const newSession: SportsDemoSession = {
      email: email || 'dev@lumio.test',
      userName: resolvedUserName,
      clubName: resolvedClubName,
      role: selectedRole,
      photoDataUrl,
      logoDataUrl,
      sport,
      verifiedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(sessionKey(sport), JSON.stringify(newSession))
      localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
    } catch (e) {
      console.warn('localStorage unavailable, proceeding without persistence', e)
    }
    setSession(newSession)
    setStep('done')
  }

  const resetSession = () => {
    localStorage.removeItem(sessionKey(sport))
    localStorage.removeItem(`lumio_${sport}_demo_active`)
    setSession(null); setStep('email'); setEmail(''); setCode('')
    setPhotoDataUrl(null); setLogoDataUrl(null)
    setShowResetConfirm(false); setError('')
    setInviteEmails(['', '', '', '', ''])
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

  // ── STEP 3: CLUB ──
  if (step === 'club') return (
    <Overlay>
      <ClubStep
        clubNameRef={clubNameRef}
        defaultClubName={defaultClubName}
        logoDataUrl={logoDataUrl}
        setLogoDataUrl={setLogoDataUrl}
        logoInputRef={logoInputRef}
        handlePhotoUpload={handlePhotoUpload}
        sportEmoji={sportEmoji}
        roles={roles}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        accentColor={accentColor}
        onContinue={() => setStep('profile')}
      />
    </Overlay>
  )

  // ── STEP 4: PROFILE ──
  if (step === 'profile') return (
    <Overlay>
      <ProfileStep
        userNameRef={userNameRef}
        photoDataUrl={photoDataUrl}
        setPhotoDataUrl={setPhotoDataUrl}
        photoInputRef={photoInputRef}
        handlePhotoUpload={handlePhotoUpload}
        accentColor={accentColor}
        sportLabel={sportLabel}
        roles={roles}
        selectedRole={selectedRole}
        defaultUserName={userNameRef.current?.value ?? ''}
        onContinue={() => setStep('earlyaccess')}
        onSkip={() => setStep('earlyaccess')}
      />
    </Overlay>
  )

  // ── STEP 5: EARLY ACCESS ──
  if (step === 'earlyaccess') return (
    <Overlay>
      <EarlyAccessStep
        accentColor={accentColor}
        email={email}
        clubName={clubNameRef.current?.value?.trim() || defaultClubName}
        sport={sport}
        onApply={() => setStep('invite')}
        onContinue={() => setStep('invite')}
      />
    </Overlay>
  )

  // ── STEP 6: INVITE ──
  if (step === 'invite') return (
    <Overlay>
      <InviteStep
        accentColor={accentColor}
        sport={sport}
        defaultSlug={defaultSlug}
        inviteEmails={inviteEmails}
        setInviteEmails={setInviteEmails}
        onSendAndContinue={() => {
          const validEmails = inviteEmails.filter(e => e.includes('@'))
          if (validEmails.length > 0) {
            fetch('/api/sports-demo/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emails: validEmails, sport, slug: defaultSlug }),
            }).catch(() => {})
          }
          finaliseSession()
        }}
        onSkip={finaliseSession}
      />
    </Overlay>
  )

  return null
}

export { sessionKey }
export type { SportsDemoGateProps }
