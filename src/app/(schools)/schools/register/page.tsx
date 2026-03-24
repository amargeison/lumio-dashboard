'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type WizardStep = 1 | 2 | 3 | 'otp'
type Plan = 'starter' | 'school' | 'trust'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#07080F',
  border: '1px solid #1F2937',
  color: '#F9FAFB',
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
}

const LABEL_STYLE: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: 12,
  fontWeight: 500,
  display: 'block',
  marginBottom: 6,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}

function focusTeal(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#0D9488'
}
function blurTeal(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#1F2937'
}

export default function SchoolsRegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<WizardStep>(1)
  const [slug, setSlug] = useState('')
  const [plan, setPlan] = useState<Plan>('school')
  const [form, setForm] = useState({
    schoolName: '',
    schoolType: 'primary',
    ofstedRating: 'not_yet_inspected',
    pupilCount: '',
    staffCount: '',
    town: '',
    postcode: '',
    yourName: '',
    yourRole: 'headteacher',
    yourEmail: '',
    yourPhone: '',
  })

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')

  function updateForm(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/schools/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSlug(data.school_slug || '')
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
        body: JSON.stringify({ email: form.yourEmail, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.')
        return
      }
      router.push(`/schools/${slug || data.school_slug}`)
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
        body: JSON.stringify({ email: form.yourEmail }),
      })
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } catch {
      // silently fail
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

  const numericStep = typeof step === 'number' ? step : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#07080F' }}
    >
      <div className="w-full" style={{ maxWidth: 500 }}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/lumio-transparent-new.png" height="36" alt="Lumio" style={{ height: 36 }} />
          <span className="text-lg font-semibold" style={{ color: '#0D9488' }}>for Schools</span>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#111318',
            border: '1px solid #1F2937',
            borderRadius: 16,
            padding: 32,
          }}
        >
          {/* Progress indicator — only for numeric steps */}
          {numericStep !== null && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {(['School details', 'Your details', 'Choose plan'] as const).map((title, i) => {
                  const sn = i + 1
                  const isActive = numericStep === sn
                  const isDone = numericStep > sn
                  return (
                    <div key={i} className="flex items-center" style={{ flex: 1 }}>
                      <div className="flex flex-col items-center" style={{ flex: 'none' }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: isActive || isDone ? '#0D9488' : '#1F2937',
                            border: isActive ? '2px solid #0D9488' : isDone ? '2px solid #0D9488' : '2px solid #374151',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: isActive || isDone ? '#F9FAFB' : '#6B7280',
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : sn}
                        </div>
                        <span
                          className="mt-1 text-center"
                          style={{
                            fontSize: 10,
                            color: isActive ? '#0D9488' : isDone ? '#6EE7E7' : '#6B7280',
                            whiteSpace: 'nowrap',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {title}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            backgroundColor: isDone ? '#0D9488' : '#1F2937',
                            margin: '0 6px',
                            marginBottom: 18,
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 1 — School details ── */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold mb-6" style={{ color: '#F9FAFB' }}>School details</h2>
              <div className="space-y-4">
                <Field label="School name">
                  <input
                    type="text"
                    value={form.schoolName}
                    onChange={e => updateForm('schoolName', e.target.value)}
                    placeholder="e.g. Oakridge Primary School"
                    required
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  />
                </Field>

                <Field label="School type">
                  <select
                    value={form.schoolType}
                    onChange={e => updateForm('schoolType', e.target.value)}
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="special">Special</option>
                    <option value="all_through">All-through</option>
                    <option value="independent">Independent</option>
                    <option value="mat">MAT</option>
                  </select>
                </Field>

                <Field label="Ofsted rating">
                  <select
                    value={form.ofstedRating}
                    onChange={e => updateForm('ofstedRating', e.target.value)}
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  >
                    <option value="outstanding">Outstanding</option>
                    <option value="good">Good</option>
                    <option value="requires_improvement">Requires Improvement</option>
                    <option value="inadequate">Inadequate</option>
                    <option value="not_yet_inspected">Not yet inspected</option>
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Number of pupils">
                    <input
                      type="number"
                      value={form.pupilCount}
                      onChange={e => updateForm('pupilCount', e.target.value)}
                      placeholder="e.g. 420"
                      min={0}
                      style={INPUT_STYLE}
                      onFocus={focusTeal}
                      onBlur={blurTeal}
                    />
                  </Field>
                  <Field label="Number of staff">
                    <input
                      type="number"
                      value={form.staffCount}
                      onChange={e => updateForm('staffCount', e.target.value)}
                      placeholder="e.g. 40"
                      min={0}
                      style={INPUT_STYLE}
                      onFocus={focusTeal}
                      onBlur={blurTeal}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Town / city">
                    <input
                      type="text"
                      value={form.town}
                      onChange={e => updateForm('town', e.target.value)}
                      placeholder="e.g. Milton Keynes"
                      style={INPUT_STYLE}
                      onFocus={focusTeal}
                      onBlur={blurTeal}
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      type="text"
                      value={form.postcode}
                      onChange={e => updateForm('postcode', e.target.value)}
                      placeholder="e.g. MK6 5AA"
                      style={INPUT_STYLE}
                      onFocus={focusTeal}
                      onBlur={blurTeal}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  disabled={!form.schoolName.trim()}
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    color: '#F9FAFB',
                    opacity: !form.schoolName.trim() ? 0.5 : 1,
                    cursor: !form.schoolName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── Step 2 — Your details ── */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-bold mb-6" style={{ color: '#F9FAFB' }}>Your details</h2>
              <div className="space-y-4">
                <Field label="Your name">
                  <input
                    type="text"
                    value={form.yourName}
                    onChange={e => updateForm('yourName', e.target.value)}
                    placeholder="e.g. Sarah Henderson"
                    required
                    autoFocus
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  />
                </Field>

                <Field label="Your role">
                  <select
                    value={form.yourRole}
                    onChange={e => updateForm('yourRole', e.target.value)}
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  >
                    <option value="headteacher">Headteacher</option>
                    <option value="deputy_head">Deputy Head</option>
                    <option value="business_manager">Business Manager</option>
                    <option value="school_administrator">School Administrator</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Your email">
                  <input
                    type="email"
                    value={form.yourEmail}
                    onChange={e => updateForm('yourEmail', e.target.value)}
                    placeholder="you@school.org.uk"
                    required
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  />
                </Field>

                <Field label="Your phone number">
                  <input
                    type="text"
                    value={form.yourPhone}
                    onChange={e => updateForm('yourPhone', e.target.value)}
                    placeholder="e.g. 07700 900000"
                    style={INPUT_STYLE}
                    onFocus={focusTeal}
                    onBlur={blurTeal}
                  />
                </Field>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl py-3 px-5 text-sm font-medium"
                  style={{
                    backgroundColor: '#1F2937',
                    color: '#9CA3AF',
                    border: '1px solid #374151',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!form.yourName.trim() || !form.yourEmail.trim()}
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    color: '#F9FAFB',
                    opacity: (!form.yourName.trim() || !form.yourEmail.trim()) ? 0.5 : 1,
                    cursor: (!form.yourName.trim() || !form.yourEmail.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3 — Choose plan ── */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Choose your plan</h2>
              <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>All plans include a 14-day free trial.</p>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                {/* Starter */}
                <button
                  type="button"
                  onClick={() => setPlan('starter')}
                  className="flex-1 rounded-xl p-4 text-left transition-all"
                  style={{
                    backgroundColor: plan === 'starter' ? 'rgba(13,148,136,0.08)' : '#07080F',
                    border: plan === 'starter' ? '2px solid #0D9488' : '1px solid #1F2937',
                    cursor: 'pointer',
                  }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Starter</p>
                  <p className="text-xl font-bold mb-3" style={{ color: '#0D9488' }}>
                    £299<span className="text-xs font-normal" style={{ color: '#6B7280' }}>/mo</span>
                  </p>
                  <ul className="space-y-1.5">
                    {['3 departments', '20 workflows', '14-day free trial'].map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>

                {/* School (recommended) */}
                <button
                  type="button"
                  onClick={() => setPlan('school')}
                  className="flex-1 rounded-xl p-4 text-left transition-all relative"
                  style={{
                    backgroundColor: plan === 'school' ? 'rgba(13,148,136,0.08)' : '#07080F',
                    border: plan === 'school' ? '2px solid #0D9488' : '2px solid rgba(13,148,136,0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#0D9488', color: '#F9FAFB', whiteSpace: 'nowrap' }}
                  >
                    ⭐ Recommended
                  </span>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>School</p>
                  <p className="text-xl font-bold mb-3" style={{ color: '#0D9488' }}>
                    £599<span className="text-xs font-normal" style={{ color: '#6B7280' }}>/mo</span>
                  </p>
                  <ul className="space-y-1.5">
                    {['All departments', '75 workflows', 'Priority support', '14-day free trial'].map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>

                {/* Trust */}
                <button
                  type="button"
                  onClick={() => setPlan('trust')}
                  className="flex-1 rounded-xl p-4 text-left transition-all"
                  style={{
                    backgroundColor: plan === 'trust' ? 'rgba(13,148,136,0.08)' : '#07080F',
                    border: plan === 'trust' ? '2px solid #0D9488' : '1px solid #1F2937',
                    cursor: 'pointer',
                  }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Trust</p>
                  <p className="text-xl font-bold mb-3" style={{ color: '#0D9488' }}>
                    £1,499<span className="text-xs font-normal" style={{ color: '#6B7280' }}>/mo</span>
                  </p>
                  <ul className="space-y-1.5">
                    {['Multi-school', 'Cross-trust dashboard', 'Dedicated CSM', '14-day free trial'].map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              </div>

              <p className="text-center text-xs mt-4" style={{ color: '#6B7280' }}>
                No credit card required · Cancel anytime · UK GDPR compliant
              </p>

              {error && (
                <p className="text-xs mt-3" style={{ color: '#EF4444' }}>{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(2); setError('') }}
                  className="rounded-xl py-3 px-5 text-sm font-medium"
                  style={{
                    backgroundColor: '#1F2937',
                    color: '#9CA3AF',
                    border: '1px solid #374151',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRegister}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    color: '#F9FAFB',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Creating workspace…' : 'Start free trial →'}
                </button>
              </div>
            </>
          )}

          {/* ── OTP step — after registration ── */}
          {step === 'otp' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-1.5" style={{ color: '#F9FAFB' }}>
                  Verify your email
                </h2>
                <p className="text-sm mb-3" style={{ color: '#9CA3AF' }}>
                  Enter the 6-digit code sent to{' '}
                  <span style={{ color: '#F9FAFB' }}>{form.yourEmail}</span>{' '}
                  to enter your workspace.
                </p>
                {form.schoolName && (
                  <span
                    className="inline-block text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(13,148,136,0.12)',
                      color: '#0D9488',
                      border: '1px solid rgba(13,148,136,0.25)',
                    }}
                  >
                    {form.schoolName}
                  </span>
                )}
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
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

                <div className="flex items-center justify-end pt-1">
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

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Already have an account?{' '}
            <Link href="/schools" style={{ color: '#0D9488' }}>
              Sign in →
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
