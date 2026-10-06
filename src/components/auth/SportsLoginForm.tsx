'use client'

// The Lumio sign-in form, shared by /sports-login and the partner pages at
// /login/<academy>. One copy of the sign-in logic: a partner page that drifted
// from the real one would be a sign-in that works on one URL and not the other.

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { portalUrlFor } from '@/lib/sports-admin/portal-url'
import { clearPrivateCaches } from '@/components/PwaInstaller'

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

type UserType = 'member' | 'founder' | 'demo' | 'both' | 'unknown' | null
interface IdentifyResult {
  type: UserType
  sport?: string
  founderSport?: string
  founderSlug?: string | null
  founderBrand?: string | null
  founderDisplayName?: string | null
  demoSport?: string
  userName?: string
  clubName?: string
  role?: string
  // An invited coach, parent or student. They have no academy of their own, so
  // they sign in here and land in the portal their membership scopes them to.
  memberRole?: string
  // Where a member belongs after sign-in, resolved server-side. A coach gets the
  // real academy portal; a parent or player gets /portal.
  memberDest?: string
}

// Resolve a founder's portal destination from identify-user fields, without a
// client-side DB read. Coach/Women's are slug-based; others go to /{sport}/app.
function founderDest(info: IdentifyResult): string {
  const sport = info.founderSport || info.sport
  if (!sport) return '/sports-signup'
  if (sport === 'coach' || sport === 'womens') {
    return portalUrlFor({ sport, portal_slug: info.founderSlug, brand_name: info.founderBrand, display_name: info.founderDisplayName })
  }
  return `/${sport}/app`
}

// Where somebody asked to go after signing in (?redirectTo=…). It comes from the
// address bar, so only a path on this site is honoured — never another site.
function safePath(v: string): string {
  return /^\/(?![\/\\])/.test(v) && !/[\\\u0000-\u001f]/.test(v) ? v : ''
}

// The academy in a coach-portal address (/tennis/coach/<academy>), if it is one.
function coachSlugOf(path: string): string | null {
  const m = /^\/(?:tennis\/)?coach\/([^/?#]+)/.exec(path)
  return m ? m[1].toLowerCase() : null
}

// A partner academy's colours and name, for /login/<their-slug>. Absent on the
// plain Lumio sign-in, which keeps its own look.
export type PartnerBrand = {
  slug: string
  name: string
  logoUrl: string | null
  accent: string
  theme: 'dark' | 'light' | 'white'
}

type Palette = { page: string; card: string; border: string; input: string; inputBorder: string; text: string; muted: string; sub: string; accent: string; onAccent: string }

const LUMIO: Palette = { page: '#07080F', card: '#0d1117', border: '#1F2937', input: '#111318', inputBorder: '#374151', text: '#fff', muted: '#6B7280', sub: '#9CA3AF', accent: '#8B5CF6', onAccent: '#fff' }

// The partner's own theme and colour, so the page a parent lands on from the
// club's website looks like the club — not like a different company.
function paletteFor(b: PartnerBrand): Palette {
  if (b.theme === 'dark') return { ...LUMIO, page: '#0B0E14', card: '#11151D', border: 'rgba(255,255,255,0.08)', accent: b.accent }
  const white = b.theme === 'white'
  return {
    page: white ? '#F6F7F9' : '#F1EEE8', card: '#FFFFFF', border: white ? 'rgba(15,23,42,0.10)' : 'rgba(20,24,33,0.10)',
    input: white ? '#FAFBFC' : '#F8F5EF', inputBorder: white ? 'rgba(15,23,42,0.18)' : 'rgba(20,24,33,0.18)',
    text: white ? '#0F172A' : '#141821', muted: 'rgba(15,23,42,0.55)', sub: 'rgba(15,23,42,0.70)',
    accent: b.accent, onAccent: '#fff',
  }
}

export function SportsLoginForm({ brand }: { brand?: PartnerBrand } = {}) {
  const P = brand ? paletteFor(brand) : LUMIO
  const router = useRouter()
  const params = useSearchParams()
  const intendedRedirect = safePath(params.get('redirectTo') || '')
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-auth/identify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data: IdentifyResult & { error?: string } = await res.json().catch(() => ({ type: null }))
      if (!res.ok || !data.type) throw new Error(data.error || 'We could not check that address just now. Please try again.')
      setUserInfo(data)

      if (data.type === 'founder') {
        // Send the branded founder OTP (same email as signup, purpose='founder').
        const otpRes = await fetch('/api/sports-demo/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), sport: data.founderSport || data.sport, purpose: 'founder' }),
        })
        const otpData = await otpRes.json().catch(() => ({}))
        if (!otpRes.ok || otpData.error) throw new Error(otpData.error || 'Failed to send code')
        setStep('otp')
        setResendCountdown(30)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else if (data.type === 'both') {
        // Both accounts — let user choose
        setStep('choose')
      } else if (data.type === 'member') {
        // An invited coach or parent. Same OTP machinery as everyone else — which
        // is the point of routing them here rather than at /portal, where
        // Supabase's own email was sending a link while the page asked for a code.
        const otpRes = await fetch('/api/sports-demo/send-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), sport: 'coach', purpose: 'member' }),
        })
        const otpData = await otpRes.json().catch(() => ({}))
        if (!otpRes.ok || otpData.error) throw new Error(otpData.error || 'Failed to send code')
        setStep('otp')
        setResendCountdown(30)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
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
        const otpRes = await fetch('/api/sports-demo/send-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), sport: userInfo.founderSport || userInfo.sport, purpose: 'founder' }),
        })
        const otpData = await otpRes.json().catch(() => ({}))
        if (!otpRes.ok || otpData.error) throw new Error(otpData.error || 'Failed to send code')
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

  // Before the code is entered the server says only WHICH KIND of account an
  // address has — it will not tell a stranger whose academy it is. Once the
  // code has passed we are signed in as that address, and asking again returns
  // where this person's own portal is.
  const whereAmIGoing = async (): Promise<IdentifyResult> => {
    try {
      const res = await fetch('/api/sports-auth/identify-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const mine = await res.json()
      return res.ok && mine?.type ? { ...userInfo, ...mine } : userInfo
    } catch { return userInfo }
  }

  // A link back to one academy's portal is only followed by somebody who
  // belongs there. On a shared computer the last coach's sign-out leaves their
  // portal address in ?redirectTo, and the next coach to sign in was sent to
  // it; they now land in their own.
  const destination = (own: string) => {
    if (!intendedRedirect) return own
    const wanted = coachSlugOf(intendedRedirect)
    if (wanted && wanted !== coachSlugOf(own)) return own
    return intendedRedirect
  }

  // Step 2: Verify OTP. `typed` is the code as just typed or pasted — state has
  // not caught up yet when the sixth digit goes in, which is why submitting on
  // the last digit used to complain that the code was incomplete.
  const verifyOtp = async (typed?: string) => {
    const code = typed ?? digits.join('')
    if (code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const effectiveType = userInfo.type === 'both' ? chosenPath : userInfo.type
      if (effectiveType === 'founder') {
        // Branded OTP verify (mints the Supabase session cookie, purpose=founder).
        const res = await fetch('/api/sports-demo/verify-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code, sport: userInfo.founderSport || userInfo.sport, purpose: 'founder' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!data.verified && !data.success) throw new Error(data.error || 'Invalid or expired code.')
        // A new person on this device: nothing an older service worker kept
        // for the last one may be shown to them (see clearPrivateCaches).
        await clearPrivateCaches()
        // Hard navigation so the portal reads the freshly-minted session cookie.
        window.location.href = destination(founderDest(await whereAmIGoing()))
        return
      } else if (effectiveType === 'member') {
        // purpose:'member' mints the Supabase session WITHOUT writing a demo lead
        // — otherwise they would be greeted as a demo user next time and sent to
        // the wrong place entirely.
        const res = await fetch('/api/sports-demo/verify-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code, sport: 'coach', purpose: 'member' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!data.verified && !data.success) throw new Error(data.error || 'Invalid or expired code.')
        // A coach uses the REAL portal, scoped by row level security. Customers
        // keep /portal, which is built for them.
        await clearPrivateCaches()   // as above: nothing kept for the last person on this device
        const dest = (await whereAmIGoing()).memberDest || '/portal'
        // Hard navigation so the portal reads the freshly-minted session cookie.
        window.location.href = destination(dest)
        return
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
        const known = await whereAmIGoing()

        const sport = userInfo.demoSport || userInfo.sport || 'darts'
        // Coach demo lives at /tennis/coach/demo; other sports at /{sport}/{sport}-demo.
        const demoBase = sport === 'coach' ? '/tennis/coach/demo' : `/${sport}/${sport}-demo`

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
            email: email.trim(),
            ...(lead.club_name ? { club: lead.club_name } : {}),
            ...(lead.nickname ? { nickname: lead.nickname } : {}),
            ...(lead.role ? { role: lead.role } : {}),
          }).toString()
          router.push(`${demoBase}?${restoreParams}`)
          return
        }

        // New user — fall through to normal restore with whatever we know from identify
        const restoreParams = new URLSearchParams({
          restore: 'true',
          ...(known.userName ? { name: known.userName } : {}),
          ...(known.clubName ? { club: known.clubName } : {}),
          ...(known.role ? { role: known.role } : {}),
        })
        router.push(`${demoBase}?${restoreParams}`)
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
      void verifyOtp(next.join(''))
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
      if (pasted.length === 6) void verifyOtp(pasted)
    }
  }

  const typeLabel = userInfo.type === 'founder' ? 'Founding member' : userInfo.type === 'demo' ? 'Demo account' : ''

  return (
    <div style={{ minHeight: '100vh', background: P.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 40 }}>
        {brand ? (
          // The club first and largest — it is their page, reached from their
          // website — with Lumio beside it and the line that says what powers it.
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              {brand.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} style={{ height: 64, maxWidth: 150, objectFit: 'contain' }} />
              )}
              {brand.logoUrl && <span style={{ width: 1, height: 40, background: P.border }} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.theme === 'dark' ? '/tennis_coach_logo_on_dark.png' : '/tennis_coach_logo_on_light.png'} alt="Lumio Tennis Coach" style={{ height: brand.logoUrl ? 52 : 64, objectFit: 'contain' }} />
            </div>
            <div style={{ color: P.muted, fontSize: 12, marginTop: 12, letterSpacing: '0.01em' }}>
              <strong style={{ color: P.sub, fontWeight: 700 }}>{brand.name}</strong> — running on Lumio Tennis Coach
            </div>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 56, margin: '0 auto 24px', display: 'block' }} />
          </>
        )}

        {/* STEP 1: Email */}
        {step === 'email' && (
          <>
            <h1 style={{ color: P.text, fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
              {brand ? `Sign in to ${brand.name}` : 'Sign in to Lumio Sports'}
            </h1>
            <p style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              Enter your email and we&apos;ll send you a code.
            </p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit() }}
              placeholder="you@example.com" autoFocus
              style={{ width: '100%', background: P.input, border: `1px solid ${P.inputBorder}`, borderRadius: 12, padding: '12px 16px', color: P.text, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleEmailSubmit} disabled={loading}
              style={{ width: '100%', background: P.accent, color: P.onAccent, border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Checking...' : 'Continue →'}
            </button>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === 'otp' && (
          <>
            <h1 style={{ color: P.text, fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
              Enter your code
            </h1>
            <p style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
              Code sent to {email}
            </p>
            {typeLabel && (
              <p style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ background: userInfo.type === 'founder' ? `${P.accent}20` : '#22C55E20', color: userInfo.type === 'founder' ? P.accent : '#4ade80', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
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
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, background: P.input, border: d ? `1px solid ${P.accent}` : `1px solid ${P.inputBorder}`, borderRadius: 12, color: P.text, outline: 'none' }}
                />
              ))}
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>{error}</p>}
            <button onClick={() => verifyOtp()} disabled={loading}
              style={{ width: '100%', background: P.accent, color: P.onAccent, border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 12 }}>
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <div style={{ textAlign: 'center' }}>
              {resendCountdown > 0 ? (
                <span style={{ color: P.muted, fontSize: 12 }}>Resend in {resendCountdown}s</span>
              ) : (
                <button onClick={resendCode}
                  style={{ background: 'none', border: 'none', color: P.accent, fontSize: 12, cursor: 'pointer' }}>
                  Resend code
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP: Choose — both accounts exist */}
        {step === 'choose' && (
          <>
            <h1 style={{ color: P.text, fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              We found two accounts
            </h1>
            <p style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              <strong style={{ color: P.sub }}>{email}</strong> has both a founding member portal and a demo session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => proceedWithChoice('founder')} disabled={loading}
                style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: `${P.accent}15`, border: `2px solid ${P.accent}`, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <span style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>Founding Member Portal</span>
                </div>
                <div style={{ color: P.sub, fontSize: 13 }}>Access your private {userInfo.founderSport} portal</div>
                <div style={{ color: P.accent, fontSize: 13, fontWeight: 600, marginTop: 8 }}>Sign in as founding member →</div>
              </button>
              <button onClick={() => proceedWithChoice('demo')} disabled={loading}
                style={{ padding: 20, borderRadius: 14, textAlign: 'left', cursor: 'pointer', background: P.input, border: `2px solid ${P.border}`, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <span style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>Demo Account</span>
                </div>
                <div style={{ color: P.sub, fontSize: 13 }}>Continue exploring the {userInfo.demoSport} demo</div>
                <div style={{ color: P.muted, fontSize: 13, fontWeight: 600, marginTop: 8 }}>Load my demo →</div>
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{error}</p>}
            <button onClick={() => { setStep('email'); setError(''); setUserInfo({ type: null }); setChosenPath(null) }}
              style={{ background: 'none', border: 'none', color: P.muted, fontSize: 12, cursor: 'pointer', marginTop: 16, display: 'block', width: '100%', textAlign: 'center' }}>
              ← Use a different email
            </button>
          </>
        )}

        {/* STEP: Unknown user */}
        {step === 'unknown' && (
          <>
            <h1 style={{ color: P.text, fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              We don&apos;t recognise that email
            </h1>
            <p style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              {brand
                ? <><strong style={{ color: P.sub }}>{email}</strong> isn&apos;t on {brand.name}&apos;s list yet. Ask {brand.name} to add you — they&apos;ll send you an invite to this address.</>
                : <><strong style={{ color: P.sub }}>{email}</strong> isn&apos;t linked to a founding member account or a demo session.</>}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!brand && <>
              <Link href="/sports-signup"
                style={{ display: 'block', width: '100%', background: P.accent, color: P.onAccent, border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                Apply for founding access →
              </Link>
              <Link href="/sports/try-demo"
                style={{ display: 'block', width: '100%', background: 'transparent', color: P.accent, border: `1px solid ${P.accent}30`, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                Try a demo →
              </Link>
              </>}
              <button onClick={() => { setStep('email'); setError(''); setUserInfo({ type: null }) }}
                style={{ background: 'none', border: 'none', color: P.muted, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                ← Try a different email
              </button>
            </div>
          </>
        )}

        {step !== 'unknown' && !brand && (
          <div style={{ marginTop: 24, textAlign: 'center', borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
            <Link href="/sports-signup" style={{ color: P.muted, fontSize: 13, textDecoration: 'none' }}>
              Don&apos;t have an account? <span style={{ color: P.accent, fontWeight: 600 }}>Sign up free</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

