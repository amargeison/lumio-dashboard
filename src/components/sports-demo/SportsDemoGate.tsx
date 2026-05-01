'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { SPORT_STATS } from '@/lib/sports/cardStats'
import { clearDemoSession, wipeDemoSurvivors, touchDemoSessionTs, DEMO_SESSION_TTL_MS } from '@/lib/demo-session/clear'

// ── SPORT LOGOS ───────────────────────────────────────────────────────────
const SPORT_LOGOS: Record<string, string> = {
  tennis: '/tennis_logo.png',
  darts: '/darts_logo.png',
  golf: '/golf_logo.png',
  boxing: '/boxing_logo.png',
  cricket: '/cricket_logo.png',
  rugby: '/rugby_logo.png',
  football: '/football_logo.png',
  nonleague: '/football_logo.png',
  grassroots: '/football_logo.png',
  womens: '/womens_fc_logo.png',
}

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
  invites?: { name: string; role: string; email?: string }[]
  nickname?: string | null
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
  const [liveName, setLiveName] = useState(defaultUserName || '')
  const initials = (liveName || defaultUserName || 'DU').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.2 }}>{liveName ? liveName.toUpperCase().split(' ')[0] : 'YOUR'}</div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{liveName ? (liveName.toUpperCase().split(' ').slice(1).join(' ') || '') : 'NAME'}</div>
            {liveNickname && <div style={{ color: accentColor, fontSize: 10, fontWeight: 600 }}>&quot;{liveNickname}&quot;</div>}
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
        <input ref={userNameRef} type="text" value={liveName} onChange={e => setLiveName(e.target.value)} placeholder="Your name"
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

const PortalLogo = memo(function PortalLogo({ sport }: { sport: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SPORT_LOGOS[sport] || '/Lumio_Sports_logo.png'}
      alt={sport}
      style={{ width: 144, height: 144, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }}
    />
  )
})

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function SportsDemoGate({
  sport, defaultClubName, defaultSlug, accentColor, accentColorLight,
  sportEmoji, sportLabel, roles, children,
}: SportsDemoGateProps) {
  void accentColorLight // available for future use
  const router = useRouter()

  const [session, setSession] = useState<SportsDemoSession | null>(null)
  const [step, setStep] = useState<'email'|'otp'|'club'|'profile'|'earlyaccess'|'invite'|'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id ?? '')
  const [userName, setUserName] = useState('')
  const [nickname, setNickname] = useState('')
  const [clubName, setClubName] = useState(defaultClubName)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [inviteEmails, setInviteEmails] = useState(['', '', '', '', ''])
  const [restoredParamsEmail, setRestoredParamsEmail] = useState('')

  // Mount-only: restore prior session, apply ?restore=... URL params, and pick
  // the starting step. Kept out of useState initializers so server-rendered HTML
  // (no window/localStorage) matches the first client render — reading either
  // at render time produces a hydration mismatch.
  useEffect(() => {
    let restored: SportsDemoSession | null = null
    let restoredEmailFromParams = ''

    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('restore') === 'true') {
        const restoredName = (url.searchParams.get('name') || '').replace(/\+/g, ' ')
        const restoredClub = (url.searchParams.get('club') || '').replace(/\+/g, ' ')
        const restoredNickname = (url.searchParams.get('nickname') || '').replace(/\+/g, ' ')
        restoredEmailFromParams = (url.searchParams.get('email') || '').trim()
        const restoredRole = url.searchParams.get('role') || roles[0]?.id || 'player'
        restored = {
          email: restoredEmailFromParams,
          userName: restoredName,
          clubName: restoredClub || defaultClubName,
          role: restoredRole,
          photoDataUrl: null,
          logoDataUrl: null,
          nickname: restoredNickname || null,
          sport,
          verifiedAt: new Date().toISOString(),
        }
        saveSession(sport, restored)
        try {
          if (restoredName) localStorage.setItem(`lumio_${sport}_name`, restoredName)
          if (restoredNickname) localStorage.setItem(`lumio_${sport}_nickname`, restoredNickname)
          localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
          // URL-restore implies the user came from a successful sign-in flow —
          // mark them onboarded so subsequent mounts skip the wizard.
          localStorage.setItem(`lumio_${sport}_onboarded`, 'true')
          touchDemoSessionTs(sport)
        } catch {}
        url.searchParams.delete('restore')
        url.searchParams.delete('name')
        url.searchParams.delete('club')
        url.searchParams.delete('role')
        url.searchParams.delete('nickname')
        url.searchParams.delete('email')
        window.history.replaceState({}, '', url.pathname)
      }
    } catch {}

    if (!restored) {
      try {
        const raw = localStorage.getItem(sessionKey(sport))
        if (raw) {
          const parsed = JSON.parse(raw) as SportsDemoSession
          if (parsed.nickname) {
            try { localStorage.setItem(`lumio_${sport}_nickname`, parsed.nickname) } catch {}
          }
          restored = parsed
        } else {
          // Rebuild path — the user has completed the wizard at some point on
          // this browser (the `onboarded` flag). Survivor keys carry their
          // name/nickname/photo/brand so they can resume without re-entering.
          //
          // Behaviour differs by host:
          //   - Prod: require OTP verify to resume. Mount leaves `restored`
          //     null so the gate renders the 'email' step, then verifyOtp
          //     picks the survivors back up on successful code entry.
          //   - Dev (localhost / dev.*): auto-rebuild straight to 'done' so
          //     local iteration doesn't demand a fresh OTP each reload.
          //
          // After DEMO_SESSION_TTL_MS of inactivity (no survivor write), the
          // survivors are wiped on mount and the wizard fires fresh.
          const hasOnboarded = localStorage.getItem(`lumio_${sport}_onboarded`) === 'true'
          if (hasOnboarded) {
            const tsRaw = localStorage.getItem(`lumio_${sport}_session_ts`)
            const ts = tsRaw ? Number(tsRaw) : 0
            if (!ts) {
              // Grandfather: onboarded users from before session_ts was
              // tracked keep their persona and start their 14-day window
              // from now.
              touchDemoSessionTs(sport)
            }
            const expired = ts > 0 && Date.now() - ts > DEMO_SESSION_TTL_MS
            if (expired) {
              wipeDemoSurvivors(sport)
            } else {
              const isDevHostMount = typeof window !== 'undefined' && (
                window.location.hostname.includes('dev.')
                || window.location.hostname === 'localhost'
              )
              if (isDevHostMount) {
                const savedName = localStorage.getItem(`lumio_${sport}_name`)
                const savedNickname = localStorage.getItem(`lumio_${sport}_nickname`)
                const savedPhoto = localStorage.getItem(`lumio_${sport}_profile_photo`)
                const savedClubName = localStorage.getItem(`lumio_${sport}_brand_name`)
                const savedClubLogo = localStorage.getItem(`lumio_${sport}_brand_logo`)
                if (savedName || savedPhoto || savedClubName || savedClubLogo) {
                  const rebuilt: SportsDemoSession = {
                    email: '',
                    userName: savedName || '',
                    clubName: savedClubName || defaultClubName,
                    role: roles[0]?.id ?? 'player',
                    photoDataUrl: savedPhoto || null,
                    logoDataUrl: savedClubLogo || null,
                    nickname: savedNickname || null,
                    sport,
                    verifiedAt: new Date().toISOString(),
                  }
                  try {
                    localStorage.setItem(sessionKey(sport), JSON.stringify(rebuilt))
                    localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
                    touchDemoSessionTs(sport)
                  } catch {}
                  restored = rebuilt
                }
              }
            }
          }
        }
      } catch {}
    }

    if (restored) {
      setSession(restored)
      setStep('done')
      if (restoredEmailFromParams) setRestoredParamsEmail(restoredEmailFromParams)
      return
    }

    const isDevHost = window.location.hostname.includes('dev.')
      || window.location.hostname === 'localhost'
    if (isDevHost) setStep('club')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Supabase session check — preferred source of truth post-Path C. If a
  // Supabase session is present with matching role+sport we build the gate
  // session directly (isDemoShell mirrors the metadata.role exactly so
  // founders visiting the demo URL get the founder empty-state and demo
  // users get demo data — see the darts-mirror work for the gate contract).
  // Falls back silently to the existing localStorage flow when no session.
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    let cancelled = false
    ;(async () => {
      const { data: { session: sbSession } } = await supabase.auth.getSession()
      if (cancelled || !sbSession) return
      const meta = (sbSession.user.app_metadata ?? {}) as Record<string, unknown>
      const role = typeof meta.role === 'string' ? meta.role : null
      const userSport = typeof meta.sport === 'string' ? meta.sport : null
      const matches = role === 'founder' || (role === 'demo' && userSport === sport)
      if (!matches) return

      // Reuse any localStorage survivors for persona fields (name, club,
      // photo, logo). Supabase session only carries identity.
      let savedName = ''
      let savedNickname = ''
      let savedPhoto: string | null = null
      let savedClubName = defaultClubName
      let savedClubLogo: string | null = null
      let savedRole = roles[0]?.id ?? 'player'
      try {
        const raw = localStorage.getItem(sessionKey(sport))
        if (raw) {
          const parsed = JSON.parse(raw) as SportsDemoSession
          savedName = parsed.userName || savedName
          savedNickname = parsed.nickname || savedNickname
          savedPhoto = parsed.photoDataUrl ?? savedPhoto
          savedClubName = parsed.clubName || savedClubName
          savedClubLogo = parsed.logoDataUrl ?? savedClubLogo
          savedRole = parsed.role || savedRole
        }
        savedName = savedName || (localStorage.getItem(`lumio_${sport}_name`) ?? '')
        savedNickname = savedNickname || (localStorage.getItem(`lumio_${sport}_nickname`) ?? '')
        savedPhoto = savedPhoto || localStorage.getItem(`lumio_${sport}_profile_photo`)
        savedClubName = savedClubName || localStorage.getItem(`lumio_${sport}_brand_name`) || defaultClubName
        savedClubLogo = savedClubLogo || localStorage.getItem(`lumio_${sport}_brand_logo`)
      } catch {}

      const displayName = (sbSession.user.user_metadata as Record<string, unknown> | undefined)?.display_name
      const built: SportsDemoSession = {
        email: sbSession.user.email ?? '',
        userName: savedName || (typeof displayName === 'string' ? displayName : ''),
        clubName: savedClubName,
        role: savedRole,
        photoDataUrl: savedPhoto,
        logoDataUrl: savedClubLogo,
        nickname: savedNickname || null,
        sport,
        verifiedAt: new Date().toISOString(),
        // CRITICAL — keeps the two cohorts visually separated. Demo users
        // get demo data; founders visiting the demo URL fall through to the
        // founder empty-state via the role-gated renderers.
        isDemoShell: role === 'demo',
      }
      setSession(built)
      setStep('done')
      try { localStorage.setItem(sessionKey(sport), JSON.stringify(built)) } catch {}
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport])

  useEffect(() => {
    if (!restoredParamsEmail) return
    fetch(`/api/sports-demo/get-profile?email=${encodeURIComponent(restoredParamsEmail)}&sport=${sport}`)
      .then(r => r.json())
      .then(data => {
        const p = data?.profile || data
        if (!p || (!p.avatar_url && !p.logo_url && !p.nickname)) return
        setSession(prev => prev ? {
          ...prev,
          photoDataUrl: p.avatar_url || prev.photoDataUrl,
          logoDataUrl: p.logo_url || prev.logoDataUrl,
          nickname: p.nickname || prev.nickname,
        } : prev)
        try {
          if (p.avatar_url) localStorage.setItem(`lumio_demo_photo_${restoredParamsEmail.toLowerCase()}`, p.avatar_url)
          const raw = localStorage.getItem(sessionKey(sport))
          if (raw) {
            const parsed = JSON.parse(raw) as SportsDemoSession
            parsed.photoDataUrl = p.avatar_url || parsed.photoDataUrl
            parsed.logoDataUrl = p.logo_url || parsed.logoDataUrl
            parsed.nickname = p.nickname || parsed.nickname
            localStorage.setItem(sessionKey(sport), JSON.stringify(parsed))
          }
          if (p.nickname) localStorage.setItem(`lumio_${sport}_nickname`, p.nickname)
        } catch {}
      })
      .catch(() => {})
  }, [restoredParamsEmail, sport])

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
      // Slug is the second path segment (/<sport>/<slug>) — defaults to
      // 'demo' on a bare /<sport> visit. Sent so verify-otp can mint a
      // slug-bound install_token (consume-token requires it to match).
      let postSlug: string | undefined
      if (typeof window !== 'undefined') {
        const segs = window.location.pathname.split('/').filter(Boolean)
        if (segs.length >= 2) postSlug = segs[1]
      }
      const res = await fetch('/api/sports-demo/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, sport, slug: postSlug }),
      })
      const data = await res.json()
      if (!data.verified && !data.success) throw new Error(data.error ?? 'Invalid code')
      // Path C: verify-otp set an sb-*-auth-token cookie for the
      // provisioned demo user. Before redirecting we MUST persist the
      // gate session to localStorage — otherwise we get an OTP loop:
      //   - cookie set, app_metadata.role updated server-side
      //   - reload happens
      //   - TennisTourPage (and friends) require a sports_profiles row
      //     to treat the user as authed, demo users don't have one
      //   - falls through to <SportsDemoGate>, which checks localStorage
      //     first (empty before this fix) then Supabase getSession
      //     (race-prone when app_metadata hasn't propagated yet)
      //   - lands on the email screen again → loop
      // Persisting the session key here means the post-reload mount
      // immediately restores to 'done' regardless of metadata timing.
      if (data.sessionMinted) {
        if (typeof window !== 'undefined') {
          // Best-effort: pull the saved profile so the persisted session
          // includes name/avatar/club without waiting for a follow-up
          // mount fetch. Failure is non-fatal — we still write a minimal
          // session below so the loop is broken either way.
          let profile: {
            user_name?: string; club_name?: string; role?: string
            avatar_url?: string | null; logo_url?: string | null; nickname?: string | null
          } | null = null
          try {
            const profileRes = await fetch(
              `/api/sports-demo/get-profile?email=${encodeURIComponent(email)}&sport=${sport}`,
            )
            const profileData = await profileRes.json().catch(() => null)
            if (profileData?.profile?.user_name) profile = profileData.profile
          } catch { /* network — fall through with minimal session */ }

          const savedPhoto = (() => {
            try { return localStorage.getItem(`lumio_demo_photo_${email.toLowerCase()}`) } catch { return null }
          })()

          const persisted: SportsDemoSession = {
            email,
            userName: profile?.user_name || userName || '',
            clubName: profile?.club_name || defaultClubName,
            role: profile?.role || selectedRole || roles[0]?.id || 'player',
            photoDataUrl: profile?.avatar_url ?? savedPhoto ?? null,
            logoDataUrl: profile?.logo_url ?? null,
            nickname: profile?.nickname ?? null,
            sport,
            verifiedAt: new Date().toISOString(),
          }
          try {
            localStorage.setItem(sessionKey(sport), JSON.stringify(persisted))
            localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
            // Mark onboarded only when the server confirms a profile —
            // otherwise the post-reload restore should still drop into
            // the wizard for first-time users without a profile row.
            if (profile?.user_name) localStorage.setItem(`lumio_${sport}_onboarded`, 'true')
            if (persisted.userName) localStorage.setItem(`lumio_${sport}_name`, persisted.userName)
            if (persisted.nickname) localStorage.setItem(`lumio_${sport}_nickname`, persisted.nickname)
            if (persisted.photoDataUrl) {
              localStorage.setItem(`lumio_${sport}_profile_photo`, persisted.photoDataUrl)
              localStorage.setItem(`lumio_demo_photo_${email.toLowerCase()}`, persisted.photoDataUrl)
            }
            if (persisted.logoDataUrl) localStorage.setItem(`lumio_${sport}_brand_logo`, persisted.logoDataUrl)
            touchDemoSessionTs(sport)
          } catch { /* localStorage unavailable — Safari private mode etc */ }

          if (data.installToken) {
            const url = new URL(window.location.href)
            url.searchParams.set('pwa_install', data.installToken)
            console.log('[gate] redirecting to URL with pwa_install token')
            window.location.href = url.toString()
          } else {
            // Bare-manifest fallback — full reload still re-runs
            // generateMetadata so the legacy install_token-on-manifest
            // path can pick up the session.
            window.location.href = window.location.pathname
          }
          return
        }
      }
      // Check for existing demo profile — skip setup if found
      try {
        const profileRes = await fetch(`/api/sports-demo/get-profile?email=${encodeURIComponent(email)}&sport=${sport}`)
        const profileData = await profileRes.json()
        if (profileData.profile?.user_name) {
          const p = profileData.profile
          const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem(`lumio_demo_photo_${email.toLowerCase()}`) : null
          const restored: SportsDemoSession = {
            email,
            userName: p.user_name,
            clubName: p.club_name || defaultClubName,
            role: p.role || 'player',
            photoDataUrl: p.avatar_url || savedPhoto || null,
            logoDataUrl: p.logo_url || null,
            nickname: p.nickname || null,
            sport,
            verifiedAt: new Date().toISOString(),
          }
          try {
            localStorage.setItem(sessionKey(sport), JSON.stringify(restored))
            localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
            // Server-side profile present + verified → mark this browser as
            // onboarded so future mounts skip the wizard via the rebuild path.
            localStorage.setItem(`lumio_${sport}_onboarded`, 'true')
            if (p.user_name) localStorage.setItem(`lumio_${sport}_name`, p.user_name)
            if (p.nickname) localStorage.setItem(`lumio_${sport}_nickname`, p.nickname)
            if (p.avatar_url) {
              localStorage.setItem(`lumio_${sport}_profile_photo`, p.avatar_url)
              localStorage.setItem(`lumio_demo_photo_${email.toLowerCase()}`, p.avatar_url)
            }
            if (p.logo_url) localStorage.setItem(`lumio_${sport}_brand_logo`, p.logo_url)
            touchDemoSessionTs(sport)
          } catch {}
          if (p.logo_url) setLogoDataUrl(p.logo_url)
          if (p.avatar_url) setPhotoDataUrl(p.avatar_url)
          setSession(restored)
          setStep('done')
          setLoading(false)
          return
        }
      } catch {}
      // Server had no profile for this email, but this browser might —
      // a returning demo user who signed out carries their persona in
      // localStorage survivors. Skip the wizard and resume from there.
      try {
        const hasOnboarded = typeof window !== 'undefined'
          && localStorage.getItem(`lumio_${sport}_onboarded`) === 'true'
        if (hasOnboarded) {
          const savedName = localStorage.getItem(`lumio_${sport}_name`)
          const savedNickname = localStorage.getItem(`lumio_${sport}_nickname`)
          const savedPhoto = localStorage.getItem(`lumio_${sport}_profile_photo`)
          const savedClubName = localStorage.getItem(`lumio_${sport}_brand_name`)
          const savedClubLogo = localStorage.getItem(`lumio_${sport}_brand_logo`)
          if (savedName || savedPhoto || savedClubName || savedClubLogo) {
            const rebuilt: SportsDemoSession = {
              email,
              userName: savedName || '',
              clubName: savedClubName || defaultClubName,
              role: roles[0]?.id ?? 'player',
              photoDataUrl: savedPhoto || null,
              logoDataUrl: savedClubLogo || null,
              nickname: savedNickname || null,
              sport,
              verifiedAt: new Date().toISOString(),
            }
            try {
              localStorage.setItem(sessionKey(sport), JSON.stringify(rebuilt))
              localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
              touchDemoSessionTs(sport)
            } catch {}
            if (savedPhoto) setPhotoDataUrl(savedPhoto)
            if (savedClubLogo) setLogoDataUrl(savedClubLogo)
            setSession(rebuilt)
            setStep('done')
            setLoading(false)
            return
          }
        }
      } catch {}
      setStep('club')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid or expired code.') }
    setLoading(false)
  }

  const finaliseSession = () => {
    const resolvedUserName = userName.trim() || userNameRef.current?.value?.trim() || ''
    const resolvedClubName = clubName.trim() || clubNameRef.current?.value?.trim() || defaultClubName
    const resolvedNickname = nickname.trim() || nicknameRef.current?.value?.trim() || ''
    const effectiveEmail = email || restoredParamsEmail || ''

    const newSession: SportsDemoSession = {
      email: effectiveEmail || 'dev@lumio.test',
      userName: resolvedUserName,
      clubName: resolvedClubName,
      role: selectedRole,
      photoDataUrl,
      logoDataUrl,
      nickname: resolvedNickname || null,
      sport,
      verifiedAt: new Date().toISOString(),
    }
    // Persist name + nickname + photo + logo to survivor keys so the portal
    // (and the gate's sign-out → sign-back-in rebuild path) can restore them.
    if (resolvedUserName) {
      try { localStorage.setItem(`lumio_${sport}_name`, resolvedUserName) } catch {}
    }
    if (resolvedNickname) {
      try { localStorage.setItem(`lumio_${sport}_nickname`, resolvedNickname) } catch {}
    }
    if (resolvedClubName) {
      try { localStorage.setItem(`lumio_${sport}_brand_name`, resolvedClubName) } catch {}
    }
    if (photoDataUrl) {
      try { localStorage.setItem(`lumio_${sport}_profile_photo`, photoDataUrl) } catch {}
    }
    if (logoDataUrl) {
      try { localStorage.setItem(`lumio_${sport}_brand_logo`, logoDataUrl) } catch {}
    }
    try {
      localStorage.setItem(sessionKey(sport), JSON.stringify(newSession))
      localStorage.setItem(`lumio_${sport}_demo_active`, 'true')
      // Onboarded flag — survives sign-out. Marks "this browser has completed
      // the wizard for this demo persona at least once"; the rebuild path
      // gates on this so subsequent visits skip the wizard entirely.
      localStorage.setItem(`lumio_${sport}_onboarded`, 'true')
      // Save photo keyed by email for cross-session persistence
      if (photoDataUrl && effectiveEmail) localStorage.setItem(`lumio_demo_photo_${effectiveEmail.toLowerCase()}`, photoDataUrl)
      touchDemoSessionTs(sport)
    } catch (e) {
      console.warn('localStorage unavailable, proceeding without persistence', e)
    }
    // Update demo lead with profile data (non-blocking)
    if (effectiveEmail) {
      fetch('/api/sports-demo/get-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: effectiveEmail, sport, userName: resolvedUserName, clubName: resolvedClubName, role: selectedRole, nickname: resolvedNickname }),
      }).catch(() => {})
      // Persist photo/logo/nickname to sports_demo_leads for cross-device restore
      fetch('/api/sports-demo/update-lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: effectiveEmail,
          sport,
          nickname: resolvedNickname,
          avatar_url: photoDataUrl || null,
          logo_url: logoDataUrl || null,
        }),
      }).catch(() => {})
    }
    setSession(newSession)
    setStep('done')
  }

  const resetSession = () => {
    clearDemoSession(sport)
    const isDevHost = typeof window !== 'undefined' && (
      window.location.hostname.includes('dev.')
      || window.location.hostname === 'localhost'
    )
    setSession(null)
    setStep(isDevHost ? 'club' : 'email')
    setEmail('')
    setCode('')
    setError('')
    setShowResetConfirm(false)
  }

  // ── AUTHENTICATED ──
  if (step === 'done' && session) {
    return <>{children(session)}</>
  }

  const Overlay = ({ children: inner }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <PortalLogo sport={sport} />
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>{sportLabel}</h2>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Interactive demo</p>
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
          // Capture nickname into state before ProfileStep unmounts — the ref
          // is nulled on unmount, so reading it later in finaliseSession fails.
          setNickname(nicknameRef.current?.value?.trim() || '')
          setStep('earlyaccess')
        }}
        onSkip={() => {
          setUserName(userNameRef.current?.value?.trim() || '')
          setNickname(nicknameRef.current?.value?.trim() || '')
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
