'use client'

// Authenticated darts portal — /darts/app
// DartsPortalInner takes a `slug` prop (used as a fallback display key in
// the demo flow). For a real signed-in user we synthesise a stable slug
// based on the display name.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { SportsDemoSession } from '@/components/sports-demo'
import { DartsPortalInner } from '../[slug]/page'

const SPORT = 'darts'

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'player'
}

export default function DartsAppPage() {
  const router = useRouter()
  const [session, setSession] = useState<SportsDemoSession | null>(null)
  const [slug, setSlug] = useState<string>('player')
  const [loadError, setLoadError] = useState<string | null>(null)

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
        .select('sport, display_name, nickname, avatar_url, brand_name, brand_logo_url')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (error) { setLoadError(error.message); return }
      if (!profile) { router.replace('/sports-signup'); return }
      if (profile.sport !== SPORT) { router.replace(`/${profile.sport}/app`); return }

      setSlug(slugify(profile.display_name ?? 'player'))
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
      })
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
  return <DartsPortalInner slug={slug} session={session} />
}
