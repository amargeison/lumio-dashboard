'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function SchoolsLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')

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
