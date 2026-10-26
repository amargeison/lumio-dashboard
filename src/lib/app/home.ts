// Where the iPhone app opens for whoever is signed in (server only).
//
// The same answer the sign-in page reaches, worked out from the session: a
// head coach goes to their own portal, an assistant coach to the academy's,
// a player or parent to their own page. Nobody signed in, or an address with
// nothing to open, goes to the sign-in page.

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { portalUrlFor } from '@/lib/sports-admin/portal-url'
import { exactEmailPattern } from '@/app/api/sports-auth/_lib/account'

export const APP_SIGN_IN = '/sports-login?redirectTo=%2Fapp'

export async function appHome(): Promise<string> {
  let user: { id: string; email?: string | null } | null = null
  try {
    const jar = await cookies()
    if (!jar.getAll().some(c => c.name.startsWith('sb-'))) return APP_SIGN_IN
    const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => jar.getAll(), setAll: () => {} },
    })
    user = (await ssr.auth.getUser()).data.user
  } catch { user = null }
  if (!user) return APP_SIGN_IN

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // A head coach: their own academy.
  const { data: profile } = await db.from('sports_profiles')
    .select('sport, portal_slug, brand_name, display_name').eq('id', user.id).maybeSingle()
  if (profile?.sport) {
    if (['coach', 'womens', 'impact'].includes(profile.sport)) return portalUrlFor(profile)
    return `/${profile.sport}/app`
  }

  // Someone a head coach invited: a coach (the academy's portal) or a family.
  const email = String(user.email || '').trim().toLowerCase()
  if (email) {
    const { data: member } = await db.from('coach_members')
      .select('role, academy_id')
      .ilike('email', exactEmailPattern(email))
      .neq('status', 'revoked')
      .order('role', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle()
    if (member) {
      if (member.role !== 'coach') return '/portal'
      const { data: academy } = await db.from('sports_profiles')
        .select('brand_name, display_name, portal_slug').eq('id', member.academy_id).maybeSingle()
      return academy ? portalUrlFor({ ...academy, sport: 'coach' }) : '/portal'
    }
  }
  return APP_SIGN_IN
}
