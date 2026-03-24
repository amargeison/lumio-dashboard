'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function SchoolsLoginPage() {
  const router = useRouter()
  const [step, setStep]         = useState<Step>('email')
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
          setError('No school workspace found for this email address. Contact your school administrator.')
        } else {
          setError(data.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setSchoolName(data.school_name || '')
      setStep('otp')
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#07080F' }}>
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>for Schools</span></span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Your school, fully connected.</h1>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            {step === 'email' ? 'Log in to your school workspace' : `Enter the code sent to ${email}`}
          </p>
          {step === 'otp' && schoolName && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
              {schoolName}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>School email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.org.uk"
                  required
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                />
              </div>
              {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending code…' : 'Send sign-in code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
              {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB', opacity: (loading || code.length !== 6) ? 0.6 : 1 }}
              >
                {loading ? 'Verifying…' : 'Enter workspace'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setCode(''); setError('') }}
                className="w-full text-xs" style={{ color: '#9CA3AF' }}>
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        {/* Links */}
        <div className="mt-5 text-center space-y-2">
          <Link href="/demo/schools/oakridge-primary" className="text-sm font-medium" style={{ color: '#0D9488' }}>
            New school? Try the demo →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-center" style={{ color: '#4B5563' }}>
        Powered by Lumio · GDPR compliant · UK data centres
      </p>
    </div>
  )
}
