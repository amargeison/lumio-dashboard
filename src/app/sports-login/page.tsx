'use client'

// Lumio Sports portal sign-in.
//
// Email + password via Supabase Auth. On success, look up the
// sports_profiles row for the user and route them to /{sport}/app.

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const ACCENT = '#8B5CF6'
const ALLOWED_SPORTS = new Set([
  'tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens',
])

function SportsLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const intendedRedirect = params.get('redirectTo') || ''
  const showResetBanner = params.get('reset') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSignIn = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true)
    setError('')
    setResetMessage('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (!data.user) throw new Error('No user returned from sign-in')

      // Honour explicit redirectTo first
      if (intendedRedirect && intendedRedirect.startsWith('/')) {
        router.push(intendedRedirect)
        return
      }

      // Look up the user's sport
      const { data: profile, error: profileError } = await supabase
        .from('sports_profiles')
        .select('sport')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profile || !ALLOWED_SPORTS.has(profile.sport)) {
        // No profile yet — send to signup completion fallback
        router.push('/sports-signup')
        return
      }

      router.push(`/${profile.sport}/app`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email first, then click forgot password.'); return }
    setError('')
    setResetMessage('')
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/sports-login?reset=true`
          : undefined,
      })
      if (resetError) throw resetError
      setResetMessage('Check your email for a reset link.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Lumio_Sports_logo.png" alt="Lumio Sports" style={{ height: 56, margin: '0 auto', objectFit: 'contain' }} />
          <h1 className="text-xl font-bold text-white mt-5">Sign in to your portal</h1>
          <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>Welcome back, founding member.</p>
        </div>

        {showResetBanner && (
          <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: '#E5E7EB' }}>
            Password reset link opened. You can sign in with your new password below.
          </div>
        )}

        <div className="rounded-2xl p-7 space-y-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="your@email.com"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="Your password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {resetMessage && <p className="text-xs" style={{ color: '#10b981' }}>{resetMessage}</p>}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: loading ? '#374151' : ACCENT }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-xs hover:underline"
            style={{ color: '#9CA3AF' }}
          >
            Forgot your password?
          </button>
        </div>

        <div className="text-center mt-5 space-y-2">
          <Link href="/sports-signup" className="text-xs hover:underline block" style={{ color: ACCENT }}>
            Don&apos;t have an account? Apply for founding access →
          </Link>
          <Link href="/sports" className="text-[11px] hover:underline block" style={{ color: '#6B7280' }}>
            ← Back to Lumio Sports
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SportsLoginPage() {
  return (
    <Suspense fallback={null}>
      <SportsLoginForm />
    </Suspense>
  )
}
