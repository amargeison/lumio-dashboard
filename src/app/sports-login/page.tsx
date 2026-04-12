'use client'

// Lumio Sports portal sign-in — passwordless OTP via Supabase Auth.
// Email → send magic code → 6-digit OTP → verify → redirect to /{sport}/app.

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function SportsLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const intendedRedirect = params.get('redirectTo') || ''
  const prefillEmail = params.get('email') || ''

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState(prefillEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const sendOtp = async () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email.'); return }
    setLoading(true); setError('')
    try {
      const supabase = getSupabase()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpError) throw otpError
      setStep('otp')
      setResendCountdown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send code. Is your account registered?')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    const code = digits.join('')
    if (code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const supabase = getSupabase()
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (verifyError) throw verifyError
      if (!data.session) throw new Error('Verification failed — no session returned.')

      // Honour explicit redirectTo
      if (intendedRedirect) { router.push(intendedRedirect); return }

      // Look up sport from profile
      const { data: profile } = await supabase
        .from('sports_profiles')
        .select('sport')
        .eq('id', data.session.user.id)
        .maybeSingle()

      if (!profile) { router.push('/sports-signup'); return }
      router.push(`/${profile.sport}/app`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.')
    }
    setLoading(false)
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

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 56, margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
          {step === 'email' ? 'Sign in to Lumio Sports' : 'Enter your code'}
        </h1>
        <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
          {step === 'email' ? 'We\'ll send a 6-digit code to your email.' : `Code sent to ${email}`}
        </p>

        {step === 'email' && (
          <>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendOtp() }}
              placeholder="you@example.com" autoFocus
              style={{ width: '100%', background: '#111318', border: '1px solid #374151', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <button onClick={sendOtp} disabled={loading}
              style={{ width: '100%', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending...' : 'Send sign-in code'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
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
                <button onClick={() => { setDigits(['','','','','','']); setError(''); sendOtp() }}
                  style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 12, cursor: 'pointer' }}>
                  Resend code
                </button>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #1F2937', paddingTop: 20 }}>
          <Link href="/sports-signup" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>
            Don&apos;t have an account? <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Sign up free</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SportsLoginPage() {
  return <Suspense><SportsLoginForm /></Suspense>
}
