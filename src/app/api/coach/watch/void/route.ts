import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// ─── Strike out (or put back) an effort session ─────────────────────────────
// The Effort & Rewards page has always said "you can void anything odd", and
// the `voided` column has always been there — but nothing set it, so a session
// logged for the wrong player, or with the wrong numbers, could never be
// corrected and XP could only go up.
//
// Voiding keeps the row (so the watch cannot re-send it and have it counted
// again) and takes its XP off the player's total in the same step in the
// database (lumio_void_effort, migration 195). Un-voiding puts it back.
//
// Who: whoever may see the session through row level security — effort
// sessions are the head coach's (migration 166, tier 3).
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { id?: string; voided?: boolean }
  const id = String(body.id || '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  const voided = body.voided !== false

  // Read with the caller's own session: if they cannot see it, it is not theirs
  // to void.
  const { data: session } = await supabase.from('coach_watch_sessions')
    .select('id, coach_id').eq('id', id).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await admin.rpc('lumio_void_effort', { p_coach: session.coach_id, p_session: session.id, p_voided: voided })
  const out = (data || {}) as { status?: string; xp_total?: number }
  if (error || !out.status || out.status === 'not_found') {
    console.error('[coach/watch/void]', error?.message || out.status)
    return NextResponse.json({ error: 'That session could not be changed. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, voided, xp_total: out.xp_total ?? null })
}
