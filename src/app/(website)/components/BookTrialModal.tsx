'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

export default function BookTrialModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep]       = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', email: '', company: '', gdpr: false })
  const [digits, setDigits]   = useState(['', '', '', '', '', ''])
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // Countdown for resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.gdpr) { setError('Please accept the terms to continue.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong. Please try again.')
      }
      setDigits(['', '', '', '', '', ''])
      setStep('otp')
      setResendCountdown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < 6) return
    setError('')
    setVerifying(true)
    try {
      const res = await fetch('/api/demo/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Invalid or expired code — please try again')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        return
      }
      // Persist session
      localStorage.setItem('demo_session_token', data.session_token)
      localStorage.setItem('demo_company_id',    data.company.id)
      localStorage.setItem('demo_company_name',  data.company.name)
      localStorage.setItem('demo_company_slug',  data.company.slug)
      localStorage.setItem('demo_user_email',    data.user.email)
      localStorage.setItem('demo_user_name',     data.user.name)

      const dest = data.is_new_user
        ? '/demo/onboarding'
        : `/demo/${data.company.slug}`
      router.push(dest)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return
    setError('')
    await fetch('/api/demo/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setDigits(['', '', '', '', '', ''])
    setResendCountdown(30)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
              {step === 'form' ? 'Start your free trial' : 'Check your email'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {step === 'form'
                ? '14 days free. No credit card. Auto-deleted after.'
                : `We sent a 6-digit code to ${form.email}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
            <X size={18} />
          </button>
        </div>

        {/* ── Step 1: Sign-up form ── */}
        {step === 'form' && (
          <form onSubmit={submit} className="p-6 space-y-4">
            {([
              { name: 'name',    label: 'Your name',    type: 'text',  placeholder: 'Sarah Chen'         },
              { name: 'email',   label: 'Work email',   type: 'email', placeholder: 'sarah@acmecorp.com' },
              { name: 'company', label: 'Company name', type: 'text',  placeholder: 'Acme Corp'          },
            ] as const).map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                <input
                  type={f.type}
                  required
                  value={form[f.name]}
                  onChange={e => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                />
              </div>
            ))}

            {/* GDPR consent */}
            <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" className="sr-only"
                    checked={form.gdpr} onChange={e => set('gdpr', e.target.checked)} />
                  <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: form.gdpr ? '#0D9488' : 'transparent',
                      borderColor: form.gdpr ? '#0D9488' : '#374151',
                    }}>
                    {form.gdpr && <Check size={10} style={{ color: '#fff' }} />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  I agree to Lumio&apos;s{' '}
                  <Link href="/terms" className="underline" style={{ color: '#0D9488' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline" style={{ color: '#0D9488' }}>Privacy Policy</Link>.
                </span>
              </label>

              <div className="text-xs space-y-1.5" style={{ color: '#6B7280' }}>
                <p>
                  <span style={{ color: '#9CA3AF' }}>14-day trial:</span>{' '}
                  Your demo workspace and all data will be permanently deleted 14 days after creation. You&apos;ll receive a warning email on day 12.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>AI processing:</span>{' '}
                  This product uses Claude by Anthropic to power automation features. By continuing, you acknowledge that demo content may be processed by Anthropic in accordance with their{' '}
                  <a href="https://www.anthropic.com/policies/usage" target="_blank" rel="noreferrer"
                    className="underline" style={{ color: '#0D9488' }}>usage policies</a>.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>Data location:</span>{' '}
                  All data is stored in EU data centres (AWS eu-west-1) and processed under GDPR.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending code…' : 'Start free trial →'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP entry ── */}
        {step === 'otp' && (
          <div className="p-6 space-y-5">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold rounded-xl transition-colors caret-transparent"
                  style={{
                    backgroundColor: '#07080F',
                    border: '1px solid #1F2937',
                    color: '#F9FAFB',
                    outline: 'none',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={verifying || digits.join('').length < 6}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: (verifying || digits.join('').length < 6) ? 0.5 : 1 }}>
              {verifying ? '⏳ Verifying…' : 'Verify code'}
            </button>

            <div className="text-center text-xs space-x-2">
              {resendCountdown > 0 ? (
                <span style={{ color: '#6B7280' }}>Resend code in {resendCountdown}s</span>
              ) : (
                <button onClick={handleResend} className="underline" style={{ color: '#9CA3AF' }}>
                  Resend code
                </button>
              )}
              <span style={{ color: '#374151' }}>·</span>
              <button onClick={() => { setStep('form'); setError('') }} className="underline" style={{ color: '#9CA3AF' }}>
                Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
