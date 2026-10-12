// Who may import into a Lumio Impact org: a signed-in user with an Impact
// sports_profiles row who is the HQ of an org (impact_orgs.hq_id). Returns a
// Supabase client acting AS that user, so every write is checked by the tp_*
// RLS policies (hq_id = auth.uid()) — an import can only ever land in the
// signed-in org's own rows. Demo and anonymous visitors are refused.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function impactHq(): Promise<{ user: User; db: SupabaseClient } | NextResponse> {
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in as your organisation’s HQ to import data.' }, { status: 401 })
  const { data: profile } = await db.from('sports_profiles').select('sport').eq('id', user.id).maybeSingle()
  if (profile?.sport !== 'impact') return NextResponse.json({ error: 'Only a Lumio Impact HQ account can import here.' }, { status: 403 })
  // HQ of an org. (Before impact_orgs exists, an Impact profile is enough —
  // RLS still confines every write to this user's own rows.)
  const org = await db.from('impact_orgs').select('slug').eq('hq_id', user.id).maybeSingle()
  if (!org.error && !org.data) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  return { user, db }
}
