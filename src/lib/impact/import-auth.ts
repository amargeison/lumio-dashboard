// Who may act for a Lumio Impact org (import, send messages): its HQ, or an admin of it.
// The portal names the org in a header; with none, it's the caller's own. The database
// confirms it (impact_hqs_for), so naming someone else's org gets a refusal. The client
// returned acts AS the user, so RLS checks every write.
//
// RLS alone is not a filter: an admin's session can read several orgs. Every query made
// with this client must also match hqId.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { ORG_HEADER } from './org-scope'

export async function impactHq(action = 'import data'): Promise<{ user: User; db: SupabaseClient; hqId: string } | NextResponse> {
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: `Sign in as your organisation’s HQ to ${action}.` }, { status: 401 })
  const hqId = (await headers()).get(ORG_HEADER) ?? user.id
  const { data: allowed, error } = await db.rpc('impact_hqs_for', { p_role: 'hq' })
  if (error) return NextResponse.json({ error: 'Your access couldn’t be checked. Please try again.' }, { status: 503 })
  if (!((allowed ?? []) as string[]).includes(hqId)) return NextResponse.json({ error: `Only this organisation’s HQ can ${action}.` }, { status: 403 })
  return { user, db, hqId }
}
