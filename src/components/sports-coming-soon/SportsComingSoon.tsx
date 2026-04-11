'use client'

// Shared shell for /{sport}/app pages whose live portals haven't been
// built yet. Requires auth — redirects to /sports-login if no session.
// Renders a small placeholder card with a link back to the public demo.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

interface SportsComingSoonProps {
  sport: string
  sportLabel: string
  emoji: string
  accentColor: string
  /** Where to send users who want to revisit the demo. */
  demoHref: string
}

export default function SportsComingSoon({ sport, sportLabel, emoji, accentColor, demoHref }: SportsComingSoonProps) {
  const router = useRouter()
  const [authState, setAuthState] = useState<'checking' | 'authed' | 'anon'>('checking')
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.replace(`/sports-login?redirectTo=/${sport}/app`)
        setAuthState('anon')
        return
      }
      setAuthState('authed')
      const { data: profile } = await supabase
        .from('sports_profiles')
        .select('display_name, sport')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.display_name) setDisplayName(profile.display_name)
    })()
    return () => { cancelled = true }
  }, [router, sport])

  if (authState !== 'authed') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080F', color: '#9CA3AF' }}>
        <div className="text-xs uppercase tracking-widest">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {displayName ? `Welcome, ${displayName}` : 'Welcome'}
        </h1>
        <div
          className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
        >
          {sportLabel} · Founding Member
        </div>
        <div className="rounded-2xl p-7 text-left" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold text-white mb-2">Your portal launches soon</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
            We&apos;re actively building the {sportLabel} portal with founding members. Your account
            is ready and your spot is reserved — check back here in the coming weeks.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: '#9CA3AF' }}>
            In the meantime, you can keep exploring the public demo to get a feel for how Lumio works.
          </p>
          <Link
            href={demoHref}
            className="inline-block mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: accentColor }}
          >
            Open the {sportLabel} demo →
          </Link>
        </div>
        <Link href="/sports-login" className="inline-block mt-5 text-[11px] hover:underline" style={{ color: '#6B7280' }}>
          Sign out from another window to switch accounts
        </Link>
      </div>
    </div>
  )
}
