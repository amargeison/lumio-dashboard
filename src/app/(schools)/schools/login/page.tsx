'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

type Step = 'email' | 'otp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function SchoolsLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [ssoError, setSsoError] = useState('')

  useEffect(() => {
    const ssoErr = searchParams.get('sso_error')
    const ssoEmail = searchParams.get('email')
    if (ssoErr === 'no_school') {
      setSsoError(
        `We couldn't find a school registered with ${ssoEmail || 'this email'}. Start a free trial or contact your school admin.`
      )
    } else if (searchParams.get('error') === 'auth_failed') {
      setSsoError('Sign-in failed. Please try again.')
    }
  }, [searchParams])
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [ssoLoading, setSsoLoading] = useState<'google' | 'azure' | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')

  async function handleSSO(provider: 'google' | 'azure') {
    setSsoLoading(provider)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/auth/schools-callback`,
      },
    })
    if (error) {
      setError(error.message)
      setSsoLoading(null)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/schools/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'school_not_found') {
          setError('school_not_found')
        } else {
          setError(data.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setSchoolName(data.school_name || '')
      setDigits(['', '', '', '', '', ''])
      setStep('otp')
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/schools/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.')
        return
      }
      router.push(`/schools/${data.school_slug}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      await fetch('/api/schools/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } catch {
      // silently fail on resend
    }
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, 6)
    const next = ['', '', '', '', '', '']
    pasted.forEach((d, i) => { next[i] = d })
    setDigits(next)
    const lastFilled = Math.min(pasted.length, 5)
    inputRefs.current[lastFilled]?.focus()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#07080F' }}
    >
      <div className="w-full" style={{ maxWidth: 400 }}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/lumio-transparent-new.png" height="36" alt="Lumio" style={{ height: 36 }} />
          <span className="text-lg font-semibold" style={{ color: '#0D9488' }}>for Schools</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 16 }}
        >
          {step === 'email' ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-1.5" style={{ color: '#F9FAFB' }}>
                  Welcome to Lumio for Schools
                </h1>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  Sign in to your school workspace
                </p>
              </div>

              {/* SSO Buttons */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                  Sign in with your school account
                </p>
                <button
                  type="button"
                  onClick={() => handleSSO('google')}
                  disabled={ssoLoading !== null}
                  className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    opacity: ssoLoading === 'google' ? 0.7 : 1,
                    cursor: ssoLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
                  </svg>
                  {ssoLoading === 'google' ? 'Redirecting…' : 'Continue with Google Workspace'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSSO('azure')}
                  disabled={ssoLoading !== null}
                  className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    opacity: ssoLoading === 'azure' ? 0.7 : 1,
                    cursor: ssoLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  {ssoLoading === 'azure' ? 'Redirecting…' : 'Continue with Microsoft 365'}
                </button>
              </div>

              {ssoError && (
                <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                  {ssoError}{' '}
                  <Link href="/schools/register" style={{ color: '#0D9488', fontWeight: 600 }}>
                    Get started →
                  </Link>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
                <span className="text-xs" style={{ color: '#6B7280' }}>or sign in with email</span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
                    School email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@school.org.uk"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: '#07080F',
                      border: '1px solid #1F2937',
                      color: '#F9FAFB',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                  />
                </div>

                {error && error !== 'school_not_found' && (
                  <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
                )}
                {error === 'school_not_found' && (
                  <p className="text-xs" style={{ color: '#EF4444' }}>
                    We couldn&apos;t find your school account. Contact your administrator or{' '}
                    <Link href="/schools/register" style={{ color: '#0D9488' }}>
                      get started →
                    </Link>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    color: '#F9FAFB',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Sending code…' : 'Send code →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-1.5" style={{ color: '#F9FAFB' }}>
                  Check your email
                </h1>
                <p className="text-sm mb-3" style={{ color: '#9CA3AF' }}>
                  Enter the 6-digit code sent to{' '}
                  <span style={{ color: '#F9FAFB' }}>{email}</span>
                </p>
                {schoolName && (
                  <span
                    className="inline-block text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(13,148,136,0.12)',
                      color: '#0D9488',
                      border: '1px solid rgba(13,148,136,0.25)',
                    }}
                  >
                    {schoolName}
                  </span>
                )}
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                {/* 6-box OTP */}
                <div className="flex gap-2 justify-between">
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={handlePaste}
                      className="text-center text-xl font-bold rounded-lg outline-none transition-colors"
                      style={{
                        width: 48,
                        height: 52,
                        backgroundColor: '#07080F',
                        border: '1px solid #1F2937',
                        color: '#F9FAFB',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                      onBlur={e => (e.currentTarget.style.borderColor = digit ? '#0D9488' : '#1F2937')}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    color: '#F9FAFB',
                    opacity: loading || code.length !== 6 ? 0.5 : 1,
                    cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Verifying…' : 'Verify code →'}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setDigits(['', '', '', '', '', '']); setError('') }}
                    className="text-xs"
                    style={{ color: '#9CA3AF' }}
                  >
                    ← Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-xs font-medium"
                    style={{ color: resent ? '#10B981' : '#0D9488' }}
                  >
                    {resent ? 'Code resent ✓' : 'Resend code'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            New school?{' '}
            <Link href="/schools/register" style={{ color: '#0D9488' }}>
              Get started →
            </Link>
          </p>
          <p className="text-xs" style={{ color: '#374151' }}>
            Powered by Lumio · UK data centres · GDPR compliant
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SchoolsLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#07080F' }}>
        <p style={{ color: '#6B7280' }}>Loading...</p>
      </div>
    }>
      <SchoolsLoginContent />
    </Suspense>
  )
}
