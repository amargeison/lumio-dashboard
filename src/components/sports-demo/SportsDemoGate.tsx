'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { SPORT_STATS } from '@/lib/sports/cardStats'

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
  /**
   * False when the portal is rendered for a real signed-in user via
   * /{sport}/app. Undefined or true when rendered inside the public
   * /{sport}/{slug} demo shell. Used to gate the demo banner.
   */
  isDemoShell?: boolean
  enabledFeatures?: string[]
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
  userNameRef, nicknameRef, photoDataUrl, setPhotoDataUrl, photoInputRef, handlePhotoUpload,
  accentColor, sport, sportLabel, sportEmoji, roles, selectedRole, defaultUserName,
  onContinue, onSkip,
}: {
  userNameRef: React.RefObject<HTMLInputElement | null>
  nicknameRef: React.RefObject<HTMLInputElement | null>
  photoDataUrl: string | null
  setPhotoDataUrl: (v: string) => void
  photoInputRef: React.RefObject<HTMLInputElement | null>
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => void
  sport: string
  accentColor: string
  sportLabel: string
  sportEmoji: string
  roles: Array<{ id: string; label: string; icon: string; description?: string }>
  selectedRole: string
  defaultUserName: string
  onContinue: () => void
  onSkip: () => void
}) {
  const [liveNickname, setLiveNickname] = useState('')
  const initials = (defaultUserName || 'DU').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 2 of 4</div>
        <h2 className="text-lg font-bold text-white mb-1">Add your photo — see how you look in Lumio</h2>
        <p className="text-sm text-gray-500">Your photo appears on your player card and across the portal.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* LEFT: Large photo upload circle */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => photoInputRef.current?.click()} className="relative group">
            <div className="w-40 h-40 rounded-full flex items-center justify-center cursor-pointer transition-all"
              style={{ background: `${accentColor}15`, border: `2px dashed ${accentColor}60` }}>
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="You" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-black" style={{ color: `${accentColor}80` }}>{initials}</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">Upload photo</span>
            </div>
          </button>
          <span className="text-sm" style={{ color: '#6B7280' }}>Upload your photo</span>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, setPhotoDataUrl)} />
        </div>

        {/* RIGHT: Large FIFA card */}
        <div className="w-48 h-72 rounded-2xl flex flex-col items-center justify-between py-4 px-3 relative"
          style={{ background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}20)`, border: `1px solid ${accentColor}80`, boxShadow: `0 0 40px ${accentColor}30` }}>
          <div className="w-full flex items-start justify-between">
            <div>
              <div className="text-4xl font-black leading-none text-white">
                {selectedRole === 'player' ? '92' : selectedRole === 'coach' ? '88' : selectedRole === 'chairman' ? '94' : selectedRole === 'manager' ? '91' : '89'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: accentColor }}>
                {roles.find(r => r.id === selectedRole)?.label?.toUpperCase() ?? 'PLAYER'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: accentColor }}>YOU</span>
              <span className="text-xl">{sportEmoji}</span>
            </div>
          </div>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center" style={{ borderColor: accentColor, backgroundColor: `${accentColor}20` }}>
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black" style={{ color: accentColor }}>{initials}</span>
            )}
          </div>
          <div className="text-center">
            <div className="text-base font-black text-white uppercase tracking-wide">{defaultUserName || 'YOUR NAME'}</div>
            {liveNickname && <div style={{ color: accentColor, fontSize: 10, fontWeight: 600 }}>&quot;{liveNickname}&quot;</div>}
            <div className="text-xs mt-0.5" style={{ color: accentColor }}>{roles.find(r => r.id === selectedRole)?.label ?? 'Player'}</div>
          </div>
          <div className="w-full grid grid-cols-2 gap-x-4 text-[10px]">
            {(SPORT_STATS[sport] || SPORT_STATS.football).map(s => (
              <div key={s.label} className="flex items-center justify-between py-0.5" style={{ borderBottom: `1px solid ${accentColor}20` }}>
                <span className="font-black text-white">{s.value}</span>
                <span style={{ color: accentColor }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <input ref={userNameRef} type="text" defaultValue={defaultUserName} placeholder="Your name"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500" />
        <input ref={nicknameRef} type="text" value={liveNickname}
          onChange={e => setLiveNickname(e.target.value)}
          placeholder='e.g. "The Hammer", "The Arrow"'
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500"
          style={{ marginTop: 8 }} />
        <p style={{ color: '#4B5563', fontSize: 11, marginTop: 4, marginBottom: 0 }}>Optional — your playing nickname</p>
        <p style={{ color: '#4B5563', fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
          No photo or name? No problem — we&apos;ll load demo player data so you can still explore the full portal.
        </p>
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
        <h2 className="text-xl font-bold text-white mb-2">Want 3 months free with your own data?</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          We&apos;re looking for a small number of clubs to help us shape Lumio. Sign up for our early access programme and get 3 months completely free — no commitment, no contract, no pushy sales. All we ask at the end is an honest case study and the chance to keep working with you.
        </p>
      </div>
      <div className="space-y-2.5">
        {[
          '3 months completely free',
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

  // Check for ?restore=true from smart sign-in flow
  const restoredFromParams = (() => {
    if (typeof window === 'undefined') return null
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('restore') !== 'true') return null
      const restoreName = url.searchParams.get('name')
      if (!restoreName) return null
      const restored: SportsDemoSession = {
        email: '',
        userName: restoreName,
        clubName: url.searchParams.get('club') || defaultClubName,
        role: url.searchParams.get('role') || roles[0]?.id || 'player',
        photoDataUrl: null,
        logoDataUrl: null,
        sport,
        verifiedAt: new Date().toISOString(),
      }
      // Persist so future visits don't need restore params
      saveSession(sport, restored)
      // Clean URL
      url.searchParams.delete('restore')
      url.searchParams.delete('name')
      url.searchParams.delete('club')
      url.searchParams.delete('role')
      window.history.replaceState({}, '', url.pathname)
      return restored
    } catch { return null }
  })()

  const initialSession = restoredFromParams || existingSession

  const isDevHost = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('dev.') ||
    window.location.hostname === 'localhost'
  )

  const [session, setSession] = useState<SportsDemoSession | null>(initialSession)
  const [step, setStep] = useState<'email'|'otp'|'club'|'profile'|'earlyaccess'|'invite'|'done'>(initialSession ? 'done' : isDevHost ? 'club' : 'email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id ?? '')
  const [userName, setUserName] = useState('')
  const [clubName, setClubName] = useState(defaultClubName)
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
  const nicknameRef = useRef<HTMLInputElement>(null)

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
      // Check for existing demo profile — skip setup if found
      try {
        const profileRes = await fetch(`/api/sports-demo/get-profile?email=${encodeURIComponent(email)}&sport=${sport}`)
        const profileData = await profileRes.json()
        if (profileData.profile?.user_name) {
          // Restore saved photo from localStorage keyed by email
          const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem(`lumio_demo_photo_${email.toLowerCase()}`) : null
          const restored: SportsDemoSession = {
            email,
            userName: profileData.profile.user_name,
            clubName: profileData.profile.club_name || defaultClubName,
            role: profileData.profile.role || 'player',
            photoDataUrl: savedPhoto || null,
            logoDataUrl: null,
            sport,
            verifiedAt: new Date().toISOString(),
          }
          try { localStorage.setItem(sessionKey(sport), JSON.stringify(restored)); localStorage.setItem(`lumio_${sport}_demo_active`, 'true') } catch {}
          setSession(restored)
          setStep('done')
          setLoading(false)
          return
        }
      } catch {}
      setStep('club')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid or expired code.') }
    setLoading(false)
  }

  const finaliseSession = () => {
    const resolvedUserName = userName.trim() || userNameRef.current?.value?.trim() || ''
    const resolvedClubName = clubName.trim() || clubNameRef.current?.value?.trim() || defaultClubName
    const resolvedNickname = nicknameRef.current?.value?.trim() || ''

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
    // Persist nickname to localStorage for the portal to pick up
    if (resolvedNickname) {
      try { localStorage.setItem(`lumio_${sport}_nickname`, resolvedNickname) } catch {}
    }
    try {
      localStorage.setItem(sessionKey(sport), JSON.stringify(newSession))
      localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
      // Save photo keyed by email for cross-session persistence
      if (photoDataUrl && email) localStorage.setItem(`lumio_demo_photo_${email.toLowerCase()}`, photoDataUrl)
    } catch (e) {
      console.warn('localStorage unavailable, proceeding without persistence', e)
    }
    // Update demo lead with profile data (non-blocking)
    if (email) {
      fetch('/api/sports-demo/get-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sport, userName: resolvedUserName, clubName: resolvedClubName, role: selectedRole, nickname: resolvedNickname }),
      }).catch(() => {})
    }
    setSession(newSession)
    setStep('done')
  }

  const resetSession = () => {
    try {
      localStorage.removeItem(sessionKey(sport))
      localStorage.removeItem(`lumio_${sport}_demo_active`)
      localStorage.removeItem(`lumio_${sport}_photos`)
    } catch { /* ignore */ }
    setSession(null); setStep(isDevHost ? 'club' : 'email'); setEmail(''); setCode('')
    setUserName(''); setClubName(defaultClubName)
    setPhotoDataUrl(null); setLogoDataUrl(null)
    setShowResetConfirm(false); setError('')
    setInviteEmails(['', '', '', '', ''])
  }

  // ── AUTHENTICATED ──
  if (step === 'done' && session) {
    return <>{children(session)}</>
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
        onContinue={() => {
          setClubName(clubNameRef.current?.value?.trim() || defaultClubName)
          setStep('profile')
        }}
      />
    </Overlay>
  )

  // ── STEP 4: PROFILE ──
  if (step === 'profile') return (
    <Overlay>
      <ProfileStep
        userNameRef={userNameRef}
        nicknameRef={nicknameRef}
        photoDataUrl={photoDataUrl}
        setPhotoDataUrl={setPhotoDataUrl}
        photoInputRef={photoInputRef}
        handlePhotoUpload={handlePhotoUpload}
        accentColor={accentColor}
        sport={sport}
        sportLabel={sportLabel}
        sportEmoji={sportEmoji || '⚽'}
        roles={roles}
        selectedRole={selectedRole}
        defaultUserName={userName}
        onContinue={() => {
          setUserName(userNameRef.current?.value?.trim() || '')
          setStep('earlyaccess')
        }}
        onSkip={() => {
          setUserName(userNameRef.current?.value?.trim() || '')
          setStep('earlyaccess')
        }}
      />
    </Overlay>
  )

  // ── STEP 5: EARLY ACCESS ──
  if (step === 'earlyaccess') return (
    <Overlay>
      <EarlyAccessStep
        accentColor={accentColor}
        email={email}
        clubName={clubName}
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
