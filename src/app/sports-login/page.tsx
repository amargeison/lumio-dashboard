'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

type UserType = 'founder' | 'demo' | 'both' | 'unknown' | null
interface IdentifyResult {
  type: UserType
  sport?: string
  founderSport?: string
  demoSport?: string
  userName?: string
  clubName?: string
  role?: string
}

function SportsLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const intendedRedirect = params.get('redirectTo') || ''
  const prefillEmail = params.get('email') || ''

  const [step, setStep] = useState<'email' | 'otp' | 'choose' | 'unknown'>('email')
  const [chosenPath, setChosenPath] = useState<'founder' | 'demo' | null>(null)
  const [email, setEmail] = useState(prefillEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<IdentifyResult>({ type: null })
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  // Step 1: Identify user type
  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-auth/identify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data: IdentifyResult = await res.json()
      setUserInfo(data)

      if (data.type === 'founder') {
        // Send Supabase Auth OTP
        const supabase = getSupabase()
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: false },
        })
        if (otpError) throw otpError
        setStep('otp')
        setResendCountdown(30)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else if (data.type === 'both') {
        // Both accounts — let user choose
        setStep('choose')
      } else if (data.type === 'demo') {
        // Send demo OTP
        setChosenPath('demo')
        const otpRes = await fetch('/api/sports-demo/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), sport: data.sport }),
        })
        if (!otpRes.ok) throw new Error('Failed to send demo code')
        setStep('otp')
        setResendCountdown(30)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setStep('unknown')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  // Proceed after choosing founder or demo path
  const proceedWithChoice = async (path: 'founder' | 'demo') => {
    setChosenPath(path)
    setLoading(true); setError('')
    try {
      if (path === 'founder') {
        const supabase = getSupabase()
        const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
        if (otpError) throw otpError
      } else {
        const sport = userInfo.demoSport || userInfo.sport || 'darts'
        const otpRes = await fetch('/api/sports-demo/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), sport }) })
        if (!otpRes.ok) throw new Error('Failed to send demo code')
      }
      setStep('otp')
      setResendCountdown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to send code.') }
    setLoading(false)
  }

  // Step 2: Verify OTP
  const verifyOtp = async () => {
    const code = digits.join('')
    if (code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const effectiveType = userInfo.type === 'both' ? chosenPath : userInfo.type
      if (effectiveType === 'founder') {
        const supabase = getSupabase()
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code,
          type: 'email',
        })
        if (verifyError) throw verifyError
        if (!data.session) throw new Error('Verification failed — no session returned.')

        if (intendedRedirect) { router.push(intendedRedirect); return }

        const { data: profile } = await supabase
          .from('sports_profiles')
          .select('sport')
          .eq('id', data.session.user.id)
          .maybeSingle()

        router.push(profile ? `/${profile.sport}/app` : '/sports-signup')
      } else if (effectiveType === 'demo') {
        const res = await fetch('/api/sports-demo/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            code,
            sport: userInfo.demoSport || userInfo.sport || 'darts',
            userName: userInfo.userName,
            clubName: userInfo.clubName,
            role: userInfo.role,
          }),
        })
        const data = await res.json()
        if (!data.success && !data.verified) throw new Error(data.error || 'Invalid code')

        const sport = userInfo.demoSport || userInfo.sport || 'darts'

        // Check if returning demo user has a completed profile — skip the gate
        const supabase = getSupabase()
        const { data: lead } = await supabase
          .from('sports_demo_leads')
          .select('user_name, nickname, club_name, role')
          .eq('email', email.trim().toLowerCase())
          .eq('sport', sport)
          .maybeSingle()

        if (lead?.user_name) {
          const restoreParams = new URLSearchParams({
            restore: 'true',
            name: lead.user_name,
            ...(lead.club_name ? { club: lead.club_name } : {}),
            ...(lead.nickname ? { nickname: lead.nickname } : {}),
            ...(lead.role ? { role: lead.role } : {}),
          }).toString()
          router.push(`/${sport}/${sport}-demo?${restoreParams}`)
          return
        }

        // New user — fall through to normal restore with whatever we know from identify
        const restoreParams = new URLSearchParams({
          restore: 'true',
          ...(userInfo.userName ? { name: userInfo.userName } : {}),
          ...(userInfo.clubName ? { club: userInfo.clubName } : {}),
          ...(userInfo.role ? { role: userInfo.role } : {}),
        })
        router.push(`/${sport}/${sport}-demo?${restoreParams}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.')
    }
    setLoading(false)
  }

  // Resend handler
  const resendCode = () => {
    setDigits(['', '', '', '', '', ''])
    setError('')
    handleEmailSubmit()
  }

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      setTimeout(() => verifyOtp(), 50)
    }
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const next = ['', '', '', '', '', '']
      pasted.split('').forEach((char, j) => { next[j] = char })
      setDigits(next)
      setTimeout(() => inputRefs.current[Math.min(pasted.length, 5)]?.focus(), 50)
    }
  }

  const typeLabel = userInfo.type === 'founder' ? 'Founding member' : userInfo.type === 'demo' ? 'Demo account' : ''

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 56, margin: '0 auto 24px', display: 'block' }} />

        {/* STEP 1: Email */}
        {step === 'email' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
              Sign in to Lumio Sports
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              Enter your email and we&apos;ll send you a code.
            </p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit() }}
              placeholder="you@example.com" autoFocus
              style={{ width: '100%', background: '#111318', border: '1px solid #374151', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleEmailSubmit} disabled={loading}
              style={{ width: '100%', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Checking...' : 'Continue →'}
            </button>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === 'otp' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
              Enter your code
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
              Code sent to {email}
            </p>
            {typeLabel && (
              <p style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ background: userInfo.type === 'founder' ? '#8B5CF620' : '#22C55E20', color: userInfo.type === 'founder' ? '#a78bfa' : '#4ade80', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
                  {typeLabel}
                </span>
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, background: '#111318', border: d ? '1px solid #8B5CF6' : '1px solid #374151', borderRadius: 12, color: '#fff', outline: 'none' }}
                />
              ))}
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>{error}</p>}
            <button onClick={verifyOtp} disabled={loading}
              style={{ width: '100%', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 12 }}>
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <div style={{ textAlign: 'center' }}>
              {resendCountdown > 0 ? (
                <span style={{ color: '#6B7280', fontSize: 12 }}>Resend in {resendCountdown}s</span>
              ) : (
                <button onClick={resendCode}
                  style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 12, cursor: 'pointer' }}>
                  Resend code
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP: Choose — both accounts exist */}
        {step === 'choose' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              We found two accounts
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              <strong style={{ color: '#9CA3AF' }}>{email}</strong> has both a founding member portal and a demo session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => proceedWithChoice('founder')} disabled={loading}
                style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: '#8B5CF615', border: '2px solid #8B5CF6', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Founding Member Portal</span>
                </div>
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Access your private {userInfo.founderSport} portal</div>
                <div style={{ color: '#8B5CF6', fontSize: 13, fontWeight: 600, marginTop: 8 }}>Sign in as founding member →</div>
              </button>
              <button onClick={() => proceedWithChoice('demo')} disabled={loading}
                style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: '#111318', border: '2px solid #1F2937', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Demo Account</span>
                </div>
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Continue exploring the {userInfo.demoSport} demo</div>
                <div style={{ color: '#6B7280', fontSize: 13, fontWeight: 600, marginTop: 8 }}>Load my demo →</div>
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{error}</p>}
            <button onClick={() => { setStep('email'); setError(''); setUserInfo({ type: null }); setChosenPath(null) }}
              style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', marginTop: 16, display: 'block', width: '100%', textAlign: 'center' }}>
              ← Use a different email
            </button>
          </>
        )}

        {/* STEP: Unknown user */}
        {step === 'unknown' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              We don&apos;t recognise that email
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              <strong style={{ color: '#9CA3AF' }}>{email}</strong> isn&apos;t linked to a founding member account or a demo session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/sports-signup"
                style={{ display: 'block', width: '100%', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                Apply for founding access →
              </Link>
              <Link href="/tennis/tennis-demo"
                style={{ display: 'block', width: '100%', background: 'transparent', color: '#8B5CF6', border: '1px solid #8B5CF630', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                Try a demo →
              </Link>
              <button onClick={() => { setStep('email'); setError(''); setUserInfo({ type: null }) }}
                style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                ← Try a different email
              </button>
            </div>
          </>
        )}

        {step !== 'unknown' && (
          <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #1F2937', paddingTop: 20 }}>
            <Link href="/sports-signup" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>
              Don&apos;t have an account? <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Sign up free</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SportsLoginPage() {
  return <Suspense><SportsLoginForm /></Suspense>
}
