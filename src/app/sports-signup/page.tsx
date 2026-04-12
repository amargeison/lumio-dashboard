'use client'

// 3-step founding-member signup for Lumio Sports.
//
// Flow:
//   Step 1 — Your details (name, email, password)
//   Step 2 — Your sport  (10 sports)
//   Step 3 — Your profile (player/brand name, nickname, photo, club logo)
//
// On submit:
//   POST /api/sports-auth/create-profile
//   All sports → /{sport}/app  (live ones render the portal; the rest render
//                                a coming-soon placeholder)
//
// NOTE: Photo uploads are stored as base64 dataURLs for now and passed
// straight through to the API. Migrating to Supabase Storage is a
// follow-up — see https://supabase.com/docs/guides/storage

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type SportId =
  | 'tennis' | 'golf' | 'darts' | 'boxing' | 'cricket'
  | 'rugby' | 'football' | 'nonleague' | 'grassroots' | 'womens'

interface SportDef {
  id: SportId
  label: string
  icon: string
  color: string
}

const SPORTS: SportDef[] = [
  { id: 'tennis',     label: "Tennis",        icon: '🎾', color: '#7C3AED' },
  { id: 'golf',       label: "Golf",          icon: '⛳', color: '#15803D' },
  { id: 'darts',      label: "Darts",         icon: '🎯', color: '#dc2626' },
  { id: 'boxing',     label: "Boxing",        icon: '🥊', color: '#dc2626' },
  { id: 'cricket',    label: "Cricket",       icon: '🏏', color: '#10b981' },
  { id: 'rugby',      label: "Rugby",         icon: '🏉', color: '#f97316' },
  { id: 'football',   label: "Football Pro",  icon: '⚽', color: '#2563eb' },
  { id: 'nonleague',  label: "Non-League",    icon: '⚽', color: '#f59e0b' },
  { id: 'grassroots', label: "Grassroots",    icon: '⚽', color: '#22c55e' },
  { id: 'womens',     label: "Women's FC",    icon: '⚽', color: '#ec4899' },
]

const LIVE_SPORTS: SportId[] = ['tennis', 'golf', 'darts', 'boxing']

const DEFAULT_ACCENT = '#8B5CF6'
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

// Down-rez an image to 400×400 JPEG (quality 0.7) for the avatar / logo
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error('Image must be 2 MB or smaller'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, 400, 400)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export default function SportsSignupPage() {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const preselectedSport = searchParams?.get('sport') || ''

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step1Error, setStep1Error] = useState('')

  // Step 2
  const [sport, setSport] = useState<SportId | ''>(preselectedSport as SportId | '')

  // Step 3
  const [displayName, setDisplayName] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')

  // Submit
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const accent = useMemo(() => {
    if (!sport) return DEFAULT_ACCENT
    return SPORTS.find(s => s.id === sport)?.color ?? DEFAULT_ACCENT
  }, [sport])

  const advanceFromStep1 = () => {
    if (!name.trim()) { setStep1Error('Please enter your full name.'); return }
    if (!email.includes('@')) { setStep1Error('Please enter a valid email.'); return }
    setStep1Error('')
    setDisplayName(name) // pre-fill display name
    // Skip sport selection if pre-selected from /join
    setStep(preselectedSport && sport ? 3 : 2)
  }

  const advanceFromStep2 = () => {
    if (!sport) return
    setStep(3)
  }

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    try {
      const dataUrl = await compressImage(file)
      setter(dataUrl)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not process image')
    }
  }

  const handleSubmit = async () => {
    if (!sport) return
    setLoading(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/sports-auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName: displayName.trim() || name.trim(),
          nickname: nickname.trim() || null,
          sport,
          brandName: brandName.trim() || null,
          avatarUrl,
          brandLogoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)

      const redirectTo: string = data.redirectTo || `/${sport}/app`
      router.push(redirectTo)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Signup failed.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-6">
          <img src="/Lumio_Sports_logo.png" alt="Lumio Sports" style={{ height: 56, margin: '0 auto', objectFit: 'contain' }} />
          <div
            className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
          >
            <span>🎯 Founding Member</span>
            <span style={{ color: '#6B7280' }}>·</span>
            <span>20 spots</span>
            <span style={{ color: '#6B7280' }}>·</span>
            <span>Free for 3 months</span>
            <span style={{ color: '#6B7280' }}>·</span>
            <span>No card needed</span>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: step === n ? 32 : 16,
                background: step >= n ? accent : '#1F2937',
              }}
            />
          ))}
        </div>

        {/* CARD */}
        <div className="rounded-2xl p-7" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Your details</h2>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Start with the basics — we&apos;ll build your portal in a moment.</p>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Full name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>
              {step1Error && <p className="text-xs text-red-400">{step1Error}</p>}
              <button
                onClick={advanceFromStep1}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: accent }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Which sport are you in?</h2>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Pick one — you can join others later.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SPORTS.map(s => {
                  const selected = sport === s.id
                  const isLive = LIVE_SPORTS.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSport(s.id)}
                      className="rounded-xl p-3 text-left transition-all relative"
                      style={{
                        backgroundColor: selected ? `${s.color}18` : '#111318',
                        border: selected ? `1.5px solid ${s.color}` : '1px solid #1F2937',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-bold truncate"
                            style={{ color: selected ? s.color : '#E5E7EB' }}
                          >
                            {s.label}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: isLive ? '#10b981' : '#6B7280' }}>
                            {isLive ? 'Live' : 'Soon'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}
                >
                  ← Back
                </button>
                <button
                  onClick={advanceFromStep2}
                  disabled={!sport}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: accent }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Your profile</h2>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>This is how you&apos;ll appear inside Lumio.</p>
              </div>

              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative group"
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden"
                    style={{ background: `${accent}15`, border: `2px dashed ${accent}60` }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: accent }}>
                        Upload
                      </span>
                    )}
                  </div>
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handlePhotoUpload(e, setAvatarUrl)}
                />
                <span className="text-[10px]" style={{ color: '#6B7280' }}>Profile photo · optional · 2 MB max</span>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Player / brand name</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Nickname (optional)</label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="What your team calls you"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Club / brand name (optional)</label>
                <input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="e.g. Team Rivera, Rolex partnership"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Club / brand logo (optional)</label>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: `${accent}15`, border: `1px dashed ${accent}40` }}
                  >
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs" style={{ color: accent }}>+</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {brandLogoUrl ? 'Logo selected · click to change' : 'Upload logo · 2 MB max'}
                  </span>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handlePhotoUpload(e, setBrandLogoUrl)}
                />
              </div>

              {photoError && <p className="text-xs text-red-400">{photoError}</p>}
              {submitError && <p className="text-xs text-red-400">{submitError}</p>}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !displayName.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: accent }}
                >
                  {loading ? 'Creating your portal…' : 'Create my portal →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-5 space-y-2">
          <Link href="/sports-login" className="text-xs hover:underline block" style={{ color: '#9CA3AF' }}>
            Already have an account? Sign in →
          </Link>
          <Link href="/sports" className="text-[11px] hover:underline block" style={{ color: '#6B7280' }}>
            ← Back to Lumio Sports
          </Link>
        </div>
      </div>
    </div>
  )
}
