'use client'

// Streamlined founding-member signup for Lumio Sports.
// Flow: Name + Email + Sport → OTP verify → /{sport}/app (wizard handles rest)

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

type SportId = 'tennis' | 'golf' | 'darts' | 'boxing' | 'cricket' | 'rugby' | 'football' | 'nonleague' | 'grassroots' | 'womens'

const SPORTS: { id: SportId; label: string; icon: string; color: string }[] = [
  { id: 'tennis', label: 'Tennis', icon: '🎾', color: '#7C3AED' },
  { id: 'golf', label: 'Golf', icon: '⛳', color: '#15803D' },
  { id: 'darts', label: 'Darts', icon: '🎯', color: '#dc2626' },
  { id: 'boxing', label: 'Boxing', icon: '🥊', color: '#dc2626' },
  { id: 'cricket', label: 'Cricket', icon: '🏏', color: '#10b981' },
  { id: 'rugby', label: 'Rugby', icon: '🏉', color: '#f97316' },
  { id: 'football', label: 'Football Pro', icon: '⚽', color: '#2563eb' },
  { id: 'nonleague', label: 'Non-League', icon: '⚽', color: '#f59e0b' },
  { id: 'grassroots', label: 'Grassroots', icon: '⚽', color: '#22c55e' },
  { id: 'womens', label: "Women's FC", icon: '⚽', color: '#ec4899' },
]

const LIVE_SPORTS = new Set<SportId>(['tennis', 'golf', 'darts', 'boxing'])

export default function SportsSignupPage() {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const preselectedSport = searchParams?.get('sport') || ''

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sport, setSport] = useState<SportId | ''>(preselectedSport as SportId | '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const accent = sport ? SPORTS.find(s => s.id === sport)?.color || '#8B5CF6' : '#8B5CF6'

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Enter your full name.'); return }
    if (!email.includes('@')) { setError('Enter a valid email.'); return }
    if (!sport) { setError('Select your sport.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-auth/create-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), displayName: name.trim(), sport }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      // Send OTP for login
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
      if (otpError) throw otpError

      setStep('otp')
      setResendCountdown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    const code = digits.join('')
    if (code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' })
      if (verifyError) throw verifyError
      router.push(`/${sport}/app`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.')
    }
    setLoading(false)
  }

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[index] = char; setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) setTimeout(verifyOtp, 50)
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 36 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 48, margin: '0 auto 20px', display: 'block' }} />

        {/* Founding member badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 999, padding: '4px 14px', textTransform: 'uppercase' }}>
            Founding Member · 20 spots · Free for 3 months
          </span>
        </div>

        {step === 'form' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Create your account</h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>No card needed. Set up your portal in 2 minutes.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Your sport</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {SPORTS.map(s => {
                    const isLive = LIVE_SPORTS.has(s.id)
                    const selected = sport === s.id
                    return (
                      <button key={s.id} onClick={() => isLive && setSport(s.id)}
                        style={{
                          padding: '10px 4px', borderRadius: 10, textAlign: 'center', cursor: isLive ? 'pointer' : 'default',
                          background: selected ? s.color + '22' : '#111318',
                          border: `1px solid ${selected ? s.color : '#1F2937'}`,
                          opacity: isLive ? 1 : 0.4, transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon}</div>
                        <div style={{ color: selected ? s.color : '#9CA3AF', fontSize: 10, fontWeight: 600 }}>{s.label}</div>
                        {!isLive && <div style={{ color: '#4B5563', fontSize: 8, fontWeight: 700, marginTop: 2 }}>SOON</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account...' : 'Create my account →'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Enter your code</h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Code sent to <strong style={{ color: '#9CA3AF' }}>{email}</strong></p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {digits.map((d, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? e => { e.preventDefault(); const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (pasted.length > 0) { const next = ['','','','','','']; pasted.split('').forEach((c, j) => { next[j] = c }); setDigits(next); setTimeout(() => inputRefs.current[Math.min(pasted.length, 5)]?.focus(), 50) } } : undefined}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, background: '#111318', border: d ? `1px solid ${accent}` : '1px solid #374151', borderRadius: 12, color: '#fff', outline: 'none' }} />
              ))}
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

            <button onClick={verifyOtp} disabled={loading}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 12 }}>
              {loading ? 'Verifying...' : 'Verify & continue →'}
            </button>

            <div style={{ textAlign: 'center' }}>
              {resendCountdown > 0
                ? <span style={{ color: '#6B7280', fontSize: 12 }}>Resend in {resendCountdown}s</span>
                : <button onClick={() => { setDigits(['','','','','','']); setError(''); handleSubmit() }}
                    style={{ background: 'none', border: 'none', color: accent, fontSize: 12, cursor: 'pointer' }}>Resend code</button>
              }
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid #1F2937', paddingTop: 20 }}>
          <Link href="/sports-login" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 8 }}>
            Already have an account? <span style={{ color: accent, fontWeight: 600 }}>Sign in</span>
          </Link>
          <Link href="/sports" style={{ color: '#4B5563', fontSize: 11, textDecoration: 'none' }}>
            ← Back to Lumio Sports
          </Link>
        </div>
      </div>
    </div>
  )
}
