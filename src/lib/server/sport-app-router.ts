import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type SportId = 'tennis' | 'golf' | 'boxing' | 'darts'

/**
 * Server-side router for the /<sport>/app entry URL.
 *
 * Reads the Supabase session from cookies and redirects to the right
 * destination — unauthenticated → login, profile missing → signup,
 * cross-sport mismatch → the correct sport's /app, onboarding still in
 * progress → /<sport>/setup, onboarded with a slug → /<sport>/<slug>.
 *
 * The slugged portal render is where /<sport>/[slug]/layout.tsx mints the
 * PWA install-token on the manifest link — so getting founders routed
 * through this function to the [slug] route is how they pick up a
 * sessioned manifest.
 *
 * This function always terminates by calling `redirect()`, which throws
 * the NEXT_REDIRECT error — callers don't need to do anything with its
 * return value.
 */
export async function routeSportApp(sport: SportId): Promise<never> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/sports-login?redirectTo=/${sport}/app`)
  }

  const { data: profile } = await supabase
    .from('sports_profiles')
    .select('sport, portal_slug, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/sports-signup')
  }

  if (profile.sport && profile.sport !== sport) {
    // User signed in but their profile belongs to a different sport —
    // bounce them to their sport's router (which will redirect on from
    // there).
    redirect(`/${profile.sport}/app`)
  }

  if (!profile.onboarding_complete || !profile.portal_slug) {
    redirect(`/${sport}/setup`)
  }

  redirect(`/${sport}/${profile.portal_slug}`)
}
