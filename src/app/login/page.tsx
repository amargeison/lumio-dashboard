'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

function LoginContent() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  const message = searchParams.get('message')
  const error = searchParams.get('error')
  const type = searchParams.get('type')

  useEffect(() => {
    if (type === 'school') router.replace('/schools/login')
  }, [type, router])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [formError, setFormError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [slug, setSlug] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  // ── Step 1 → Send OTP via workspace flow ──────────────────────────────────

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)

    // Look up workspace for this email
    const lookupRes = await fetch('/api/workspace/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })

    if (!lookupRes.ok) {
      // No workspace found — try Supabase Auth OTP as fallback (for SSO-registered users)
      const { error: supaErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (supaErr) {
        setFormError('No account found for this email. Start a free trial at lumiocms.com or contact hello@lumiocms.com.')
        setLoading(false)
        return
      }
      setSlug('')
      setDigits(['', '', '', '', '', ''])
      setStep('otp')
      setResendCountdown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
      setLoading(false)
      return
    }

    const { slug: foundSlug } = await lookupRes.json()
    setSlug(foundSlug || '')

    // Send OTP
    const otpRes = await fetch('/api/workspace/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })

    if (!otpRes.ok) {
      setFormError('Failed to send code — please try again.')
      setLoading(false)
      return
    }

    setDigits(['', '', '', '', '', ''])
    setStep('otp')
    setResendCountdown(30)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
    setLoading(false)
  }

  // ── OTP digit handlers ────────────────────────────────────────────────────

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  // ── Step 2 → Verify OTP ───────────────────────────────────────────────────

  const handleVerify = async () => {
    const token = digits.join('')
    if (token.length < 6) return
    setFormError('')
    setVerifying(true)

    if (slug) {
      // Workspace OTP flow
      const res = await fetch('/api/workspace/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: token }),
      })

      if (!res.ok) {
        setFormError('Invalid or expired code — please try again')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        setVerifying(false)
        return
      }

      const data = await res.json()
      // Store session
      localStorage.setItem('workspace_session_token', data.session_token)
      if (data.company_name) {
        localStorage.setItem('workspace_company_name', data.company_name)
        localStorage.setItem('lumio_company_name', data.company_name)
      }
      if (data.owner_name) {
        localStorage.setItem('workspace_user_name', data.owner_name)
        localStorage.setItem('lumio_user_name', data.owner_name)
      }
      if (data.logo_url) {
        localStorage.setItem('workspace_company_logo', data.logo_url)
        localStorage.setItem('lumio_company_logo', data.logo_url)
      }
      localStorage.setItem('lumio_workspace_slug', data.slug)
      localStorage.setItem('lumio_company_active', 'true')

      // Redirect to workspace or original destination
      const dest = redirectTo !== '/' ? redirectTo : `/${data.slug}`
      router.push(dest)
    } else {
      // Supabase Auth OTP fallback
      const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (verifyErr) {
        setFormError('Invalid or expired code — please try again')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        router.push(redirectTo)
      }
    }
    setVerifying(false)
  }

  // ── Resend ────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setFormError('')
    if (slug) {
      await fetch('/api/workspace/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
    } else {
      await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    }
    setDigits(['', '', '', '', '', ''])
    setResendCountdown(30)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  // ── SSO handlers ──────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setSsoLoading('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
    if (error) { setFormError(error.message); setSsoLoading(null) }
  }

  const handleMicrosoft = () => {
    setSsoLoading('microsoft')
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
    if (!clientId) { setFormError('Microsoft SSO not configured'); setSsoLoading(null); return }
    const state = JSON.stringify({ redirectTo })
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: 'https://lumiocms.com/api/auth/callback/microsoft-sso',
      scope: 'openid email profile User.Read offline_access',
      state,
      response_mode: 'query',
      prompt: 'select_account',
    })
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  const handleGitHub = async () => {
    setSsoLoading('github')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) { setFormError(error.message); setSsoLoading(null) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Link href="https://lumiocms.com" className="font-black text-xl tracking-widest text-white">
          LUMIO
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Don&apos;t have an account?</span>
          <Link
            href="/demo"
            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-500 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {message && (
            <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-amber-300">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-600/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-300">
              {error === 'no_account'
                ? 'No account found for this email. Start a free trial at lumiocms.com or contact hello@lumiocms.com.'
                : 'Something went wrong with sign in. Please try again.'}
            </div>
          )}

          {/* ── Step 1: Email entry ── */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black mb-2">Sign in to Lumio</h1>
                <p className="text-gray-500 text-sm">Access your portal</p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleGoogle}
                  disabled={!!ssoLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {ssoLoading === 'google' ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <button
                  onClick={handleMicrosoft}
                  disabled={!!ssoLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#3D3D3D] disabled:opacity-60 transition-colors border border-white/10"
                >
                  {ssoLoading === 'microsoft' ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                  )}
                  Continue with Microsoft
                </button>

                <button
                  onClick={handleGitHub}
                  disabled={!!ssoLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#2f363d] disabled:opacity-60 transition-colors border border-white/10"
                >
                  {ssoLoading === 'github' ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                  Continue with GitHub
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-600 font-medium">or sign in with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSendCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Work email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
                {formError && <p className="text-red-400 text-xs">{formError}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Sending...' : 'Send me a code →'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login/sso" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Enterprise SSO / SAML →
                </Link>
              </div>
            </>
          )}

          {/* ── Step 2: OTP entry ── */}
          {step === 'otp' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  📬
                </div>
                <h1 className="text-2xl font-black mb-2">Check your email</h1>
                <p className="text-gray-400 text-sm">We sent a 6-digit code to</p>
                <p className="font-semibold text-white mt-1">{email}</p>
              </div>

              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
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
                    className="w-11 h-14 text-center text-xl font-bold bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors caret-transparent"
                  />
                ))}
              </div>

              {formError && (
                <p className="text-red-400 text-xs text-center mb-4">{formError}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={verifying || digits.join('').length < 6}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-4"
              >
                {verifying ? '⏳ Verifying...' : 'Verify code'}
              </button>

              <div className="text-center text-xs">
                {resendCountdown > 0 ? (
                  <span className="text-gray-600">Resend code in {resendCountdown}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-gray-500 hover:text-gray-300 transition-colors underline"
                  >
                    Resend code
                  </button>
                )}
                <span className="mx-2 text-gray-700">·</span>
                <button
                  onClick={() => { setStep('email'); setFormError(''); setSlug('') }}
                  className="text-gray-500 hover:text-gray-300 transition-colors underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-gray-700">
            <Link href="/privacy" className="hover:text-gray-500 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-500 transition-colors">Terms</Link>
            <span>·</span>
            <a href="mailto:hello@lumiocms.com" className="hover:text-gray-500 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
