'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import OnboardingWizard from './OnboardingWizard'

type Sport = 'tennis' | 'golf' | 'boxing' | 'darts'

const ACCENT: Record<Sport, string> = {
  tennis: '#a855f7',
  golf:   '#16a34a',
  boxing: '#dc2626',
  darts:  '#22c55e',
}

type Profile = { id: string; display_name?: string; email?: string }

export function SportSetupShell({ sport }: { sport: Sport }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/sports-login?redirectTo=/${sport}/app`)
        return
      }
      const { data, error: queryError } = await supabase
        .from('sports_profiles')
        .select('id, sport, display_name, portal_slug, onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()
      if (queryError) { setError(queryError.message); return }
      if (!data) { router.replace('/sports-signup'); return }
      if (data.sport && data.sport !== sport) { router.replace(`/${data.sport}/app`); return }
      if (data.onboarding_complete && data.portal_slug) {
        // Already onboarded — bounce to portal (install-token mint lives there).
        router.replace(`/${sport}/${data.portal_slug}`)
        return
      }
      setProfile({ id: user.id, display_name: data.display_name ?? undefined, email: user.email ?? undefined })
    })()
  }, [router, sport])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080F', color: '#E5E7EB' }}>
        <div className="text-sm">Could not load your setup: {error}</div>
      </div>
    )
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080F', color: '#9CA3AF' }}>
        <div className="text-xs uppercase tracking-widest">Loading your setup…</div>
      </div>
    )
  }

  return (
    <OnboardingWizard
      sport={sport}
      accentColor={ACCENT[sport]}
      profile={profile}
      onComplete={(_features, portalSlug) => {
        if (portalSlug?.trim()) {
          router.replace(`/${sport}/${portalSlug.trim()}`)
        } else {
          // Wizard didn't return a slug — re-enter /<sport>/app so the server
          // router can re-fetch the profile and decide the next step.
          router.replace(`/${sport}/app`)
        }
      }}
    />
  )
}
