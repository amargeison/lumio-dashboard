'use client'

// Authenticated golf portal — /golf/app
// See /tennis/app/page.tsx for pattern notes.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { SportsDemoSession } from '@/components/sports-demo'
import { GolfPortalInner } from '../[slug]/page'
import OnboardingWizard from '@/components/sports/OnboardingWizard'

const SPORT = 'golf'

export default function GolfAppPage() {
  const router = useRouter()
  const [session, setSession] = useState<SportsDemoSession | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/sports-login?redirectTo=/${SPORT}/app`)
        return
      }
      const { data: profile, error } = await supabase
        .from('sports_profiles')
        .select('sport, display_name, nickname, avatar_url, brand_name, brand_logo_url, enabled_features, onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (error) { setLoadError(error.message); return }
      if (!profile) { router.replace('/sports-signup'); return }
      if (profile.sport !== SPORT) { router.replace(`/${profile.sport}/app`); return }

      setOnboardingDone(profile.onboarding_complete ?? false)
      setSession({
        email: user.email ?? '',
        userName: profile.display_name ?? '',
        clubName: profile.brand_name ?? '',
        role: 'player',
        photoDataUrl: profile.avatar_url ?? null,
        logoDataUrl: profile.brand_logo_url ?? null,
        sport: SPORT,
        verifiedAt: new Date().toISOString(),
        isDemoShell: false,
        enabledFeatures: profile.enabled_features || [],
      })
      // Track login event
      fetch('/api/sports-events', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'login', userId: user.id, sport: SPORT, user_agent: navigator.userAgent })
      }).catch(() => {})
    })()

    return () => { cancelled = true }
  }, [router])

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080F', color: '#E5E7EB' }}>
        <div className="text-sm">Could not load your portal: {loadError}</div>
      </div>
    )
  }
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080F', color: '#9CA3AF' }}>
        <div className="text-xs uppercase tracking-widest">Loading your portal…</div>
      </div>
    )
  }
  const handleSignOut = async () => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await supabase.auth.signOut()
    router.push('/sports-login')
  }

  if (!onboardingDone) {
    return <OnboardingWizard sport="golf" accentColor="#16a34a" profile={{ id: session.email, display_name: session.userName, email: session.email }} onComplete={() => setOnboardingDone(true)} />
  }
  return <GolfPortalInner session={session} onSignOut={handleSignOut} />
}
