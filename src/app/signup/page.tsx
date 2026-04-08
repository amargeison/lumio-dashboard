'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowRight, Upload } from 'lucide-react'

// ─── Form internals ────────────────────────────────────────────────────────

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get('portal') as 'business' | 'schools' | null

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [alreadyExists, setAlreadyExists] = useState<{ slug: string; companyName: string } | null>(null)

  const [portalType, setPortalType] = useState<'business' | 'schools' | ''>(preselected || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [gdpr, setGdpr] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!portalType) { setError('Please select Business or School.'); return }
    if (!gdpr) { setError('Please accept the terms to continue.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, gdpr, portalType }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong. Please try again.')
      }
      const data = await res.json()
      if (data.already_exists) {
        setAlreadyExists({ slug: data.slug, companyName: data.company_name })
        return
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
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setDigits(pasted.split('')); inputRefs.current[5]?.focus() }
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
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Invalid or expired code — please try again')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        return
      }
      localStorage.setItem('demo_session_token', data.session_token)
      localStorage.setItem('demo_company_id', data.company.id)
      localStorage.setItem('demo_company_name', data.company.name)
      localStorage.setItem('demo_company_slug', data.company.slug)
      localStorage.setItem('demo_user_email', data.user.email)
      localStorage.setItem('demo_user_name', data.user.name)
      if (portalType) localStorage.setItem('lumio_signup_portal', portalType)
      if (portalType === 'schools' || data.is_school_demo) {
        localStorage.setItem('lumio_school_demo_active', 'true')
        localStorage.setItem('lumio_schools_demo_loaded', 'true')
        if (data.logo_url) {
          localStorage.setItem('lumio_school_logo', data.logo_url)
          const s = data.company?.slug
          if (s) localStorage.setItem(`lumio_school_logo_${s}`, data.logo_url)
        }
      }

      // Logo handling:
      // - Schools demo signups: the user has no workspace session token yet,
      //   so /api/workspace/logo returns 401. Read the file locally as a
      //   data URL and store in localStorage only — demo-only, no server upload.
      // - Business signups: upload to /api/workspace/logo as before.
      if (logoFile && (portalType === 'schools' || data.is_school_demo)) {
        try {
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            if (!dataUrl) return
            const s = data.company?.slug || ''
            localStorage.setItem('lumio_school_logo', dataUrl)
            if (s) localStorage.setItem(`lumio_school_logo_${s}`, dataUrl)
            try { window.dispatchEvent(new CustomEvent('lumio-logo-updated', { detail: { logo: dataUrl } })) } catch {}
          }
          reader.readAsDataURL(logoFile)
        } catch { /* silent — logo is optional */ }
      } else if (logoFile && data.session_token) {
        try {
          const fd = new FormData()
          fd.append('logo', logoFile)
          const logoRes = await fetch('/api/workspace/logo', {
            method: 'POST',
            headers: { 'x-workspace-token': data.session_token },
            body: fd,
          })
          if (logoRes.ok) {
            const logoData = await logoRes.json()
            if (logoData.logo_url) {
              localStorage.setItem('lumio_company_logo', logoData.logo_url)
              localStorage.setItem('workspace_company_logo', logoData.logo_url)
            }
          }
        } catch { /* silent — logo is optional */ }
      }

      const dest = data.redirect_to
        ? data.redirect_to
        : portalType === 'schools'
          ? `/demo/schools/${data.company?.slug || 'onboarding'}`
          : `/demo/${data.company?.slug || 'onboarding'}`
      setVerified(true)
      setTimeout(() => { try { router.push(dest) } catch { window.location.href = dest } }, 1500)
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
      body: JSON.stringify({ name, email, company, gdpr, portalType }),
    })
    setDigits(['', '', '', '', '', ''])
    setResendCountdown(30)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  const iS: React.CSSProperties = { backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#07080F' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 120, height: 'auto' }} /></Link>
        </div>

        <div className="rounded-2xl shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          {/* Header */}
          <div className="p-6" style={{ borderBottom: '1px solid #1F2937' }}>
            <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
              {alreadyExists ? 'Active trial found' : step === 'form' ? 'Start your free trial' : 'Check your email'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {alreadyExists
                ? `Workspace: ${alreadyExists.companyName}`
                : step === 'form'
                  ? '14 days free. No credit card. Auto-deleted after.'
                  : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Already exists */}
          {alreadyExists ? (
            <div className="space-y-4 text-center px-6 py-8">
              <div className="text-3xl">👋</div>
              <h3 className="text-lg font-semibold" style={{ color: '#F9FAFB' }}>You already have an active trial</h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                We found an existing trial workspace for <span className="font-medium" style={{ color: '#F9FAFB' }}>{alreadyExists.companyName}</span>.
              </p>
              <div className="rounded-lg p-3 text-sm font-mono break-all" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#0D9488' }}>
                lumiocms.com/demo/{alreadyExists.slug}
              </div>
              <a href={`/demo/${alreadyExists.slug}`} className="block w-full py-3 px-4 rounded-lg text-sm font-semibold text-center" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Go to my trial workspace →
              </a>
              <button onClick={() => setAlreadyExists(null)} className="text-xs underline" style={{ color: '#6B7280' }}>
                That&apos;s not me — use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Form */}
              {step === 'form' && (
                <form onSubmit={submit} className="p-6 space-y-4">
                  {/* Portal type selector */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>What are you building for?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: 'business' as const, icon: '🏢', label: 'Business', desc: 'CRM, HR, Sales, Ops' },
                        { key: 'schools' as const, icon: '🏫', label: 'School', desc: 'Attendance, SEND, Staff' },
                      ]).map(opt => {
                        const selected = portalType === opt.key
                        const dimmed = preselected && preselected !== opt.key
                        return (
                          <button key={opt.key} type="button" onClick={() => setPortalType(opt.key)}
                            className="flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all"
                            style={{
                              backgroundColor: '#07080F',
                              border: selected ? '2px solid #0D9488' : '1px solid #1F2937',
                              opacity: dimmed ? 0.5 : 1,
                            }}>
                            <span className="text-2xl">{opt.icon}</span>
                            <span className="text-sm font-bold" style={{ color: selected ? '#0D9488' : '#F9FAFB' }}>{opt.label}</span>
                            <span className="text-[10px]" style={{ color: '#6B7280' }}>{opt.desc}</span>
                            {selected && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>✓ Selected</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Logo upload */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Company logo (optional)</label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB'); return }
                        setLogoFile(file)
                        const reader = new FileReader()
                        reader.onload = (ev: ProgressEvent<FileReader>) => setLogoPreview(typeof ev.target?.result === 'string' ? ev.target.result : null)
                        reader.readAsDataURL(file)
                      }}
                    />
                    {!logoFile ? (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full rounded-lg flex flex-col items-center justify-center transition-colors"
                        style={{ height: 120, backgroundColor: '#07080F', border: '2px dashed #0D9488', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.05)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#07080F' }}
                      >
                        <Upload size={24} style={{ color: '#0D9488', marginBottom: 8 }} />
                        <div className="text-sm" style={{ color: '#9CA3AF' }}>Upload your logo</div>
                        <div className="text-xs mt-1" style={{ color: '#6B7280' }}>PNG, JPG up to 2MB</div>
                      </button>
                    ) : (
                      <div className="w-full rounded-lg flex items-center gap-3 p-3" style={{ backgroundColor: '#07080F', border: '2px dashed #0D9488', minHeight: 120 }}>
                        {logoPreview && (
                          <img src={logoPreview} alt="Logo preview" style={{ maxHeight: 80, maxWidth: 100, objectFit: 'contain', flexShrink: 0 }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{ color: '#F9FAFB' }}>{logoFile.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{(logoFile.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                          className="flex items-center justify-center rounded-lg transition-colors"
                          style={{ width: 32, height: 32, backgroundColor: '#1F2937', color: '#9CA3AF', flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151'; (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
                          aria-label="Remove logo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Your name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Chen" className="w-full rounded-lg px-3 py-2.5 text-sm" style={iS}
                      onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')} onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Work email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@acmecorp.com" className="w-full rounded-lg px-3 py-2.5 text-sm" style={iS}
                      onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')} onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                  </div>

                  {/* Company / School name */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>{portalType === 'schools' ? 'School name' : 'Company name'}</label>
                    <input type="text" required value={company} onChange={e => setCompany(e.target.value)}
                      placeholder={portalType === 'schools' ? 'Oakridge Primary Academy' : 'Acme Corp'}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={iS}
                      onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')} onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                  </div>

                  {/* GDPR consent */}
                  <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input type="checkbox" className="sr-only" checked={gdpr} onChange={e => setGdpr(e.target.checked)} />
                        <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                          style={{ backgroundColor: gdpr ? '#0D9488' : 'transparent', borderColor: gdpr ? '#0D9488' : '#374151' }}>
                          {gdpr && <Check size={10} style={{ color: '#fff' }} />}
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
                      <p><span style={{ color: '#9CA3AF' }}>14-day trial:</span> Your demo workspace and all data will be permanently deleted 14 days after creation.</p>
                      <p><span style={{ color: '#9CA3AF' }}>AI processing:</span> This product uses Claude by Anthropic. By continuing, you acknowledge demo content may be processed by Anthropic.</p>
                      <p><span style={{ color: '#9CA3AF' }}>Data location:</span> All data stored in EU data centres (AWS eu-west-1) under GDPR.</p>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Sending code...' : <>Create my free workspace <ArrowRight size={14} /></>}
                  </button>
                </form>
              )}

              {/* Step 2: OTP */}
              {step === 'otp' && (
                <div className="p-6 space-y-5">
                  {verified ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
                        <span style={{ color: '#0D9488', fontSize: 28 }}>✓</span>
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>You&apos;re in!</h3>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>Setting up your workspace...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {digits.map((d, i) => (
                          <input key={i} ref={el => { inputRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={d}
                            onChange={e => handleDigitChange(i, e.target.value)} onKeyDown={e => handleDigitKeyDown(i, e)}
                            className="w-11 h-14 text-center text-xl font-bold rounded-xl caret-transparent"
                            style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                            onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')} onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                        ))}
                      </div>
                      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                      <button onClick={handleVerify} disabled={verifying || digits.join('').length < 6}
                        className="w-full py-3 rounded-xl font-semibold text-sm"
                        style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: (verifying || digits.join('').length < 6) ? 0.5 : 1 }}>
                        {verifying ? 'Verifying...' : 'Verify code'}
                      </button>
                      <div className="text-center text-xs space-x-2">
                        {resendCountdown > 0
                          ? <span style={{ color: '#6B7280' }}>Resend code in {resendCountdown}s</span>
                          : <button onClick={handleResend} className="underline" style={{ color: '#9CA3AF' }}>Resend code</button>}
                        <span style={{ color: '#374151' }}>·</span>
                        <button onClick={() => { setStep('form'); setError('') }} className="underline" style={{ color: '#9CA3AF' }}>Use a different email</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Already have an account?{' '}
            <Link href="/login" className="underline font-medium" style={{ color: '#0D9488' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page wrapper with Suspense for useSearchParams ────────────────────────

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#07080F' }}><p style={{ color: '#6B7280' }}>Loading...</p></div>}>
      <SignupForm />
    </Suspense>
  )
}
