import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Save the records an import found — server-side.
//
// The import used to write each row from the browser, filed under whatever
// academy the portal had cached for "who am I". During onboarding that answer
// could be stale (a coach who had been signed in to another academy on the same
// browser, a sign-up that followed straight on from a sign-out), and the row
// level security check then refused every row: "new row violates row-level
// security policy for table coach_players / coach_staff". The coach saw the
// error with no way past it.
//
// Here the academy comes from the session cookie on this request and nowhere
// else, and the columns are whitelisted, so the only thing the browser decides
// is which of its own records to keep.

const TABLES: Record<string, { table: string; fields: string[]; headOnly?: boolean; assignable?: boolean }> = {
  players:   { table: 'coach_players',   fields: ['name', 'category', 'age', 'parent_name', 'racket_stage', 'goal', 'level', 'email', 'phone', 'notes'], assignable: true },
  staff:     { table: 'coach_staff',     fields: ['name', 'role', 'email', 'phone', 'qualifications', 'notes'], headOnly: true },
  courts:    { table: 'coach_courts',    fields: ['name', 'surface', 'location', 'hours', 'status', 'notes'], headOnly: true },
  camps:     { table: 'coach_camps',     fields: ['name', 'start_date', 'end_date', 'capacity', 'price', 'location', 'notes'], assignable: true },
  equipment: { table: 'coach_equipment', fields: ['item', 'category', 'quantity', 'status', 'notes'], assignable: true },
  payments:  { table: 'coach_payments',  fields: ['player_name', 'item', 'amount', 'status', 'due_date', 'notes'], headOnly: true },
  resources: { table: 'coach_resources', fields: ['title', 'type', 'url', 'category', 'notes'], headOnly: true },
}

const MAX_ROWS = 1000

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You are signed out — sign in again and retry the import.' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { category?: string; rows?: Record<string, unknown>[] }
  const spec = TABLES[body.category || '']
  if (!spec) return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : []
  if (!rows.length) return NextResponse.json({ inserted: 0 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // Whose academy: the signed-in person's own (a head coach), or the one they
  // are an active coach in. Same rule as /api/coach/whoami.
  let academyId: string | null = null
  let staffId: string | null = null
  const { data: own } = await admin.from('sports_profiles').select('id, sport').eq('id', user.id).maybeSingle()
  if (own?.sport === 'coach') {
    academyId = own.id
  } else {
    const { data: m } = await admin.from('coach_members')
      .select('academy_id, staff_id, role').eq('member_user_id', user.id).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (m?.role === 'coach' && m.staff_id) { academyId = m.academy_id; staffId = m.staff_id }
  }
  if (!academyId) return NextResponse.json({ error: 'We could not find an academy for your account to import into.' }, { status: 403 })
  if (staffId && spec.headOnly) return NextResponse.json({ error: 'Only the head coach can import these.' }, { status: 403 })

  const clean = rows.map(r => {
    const out: Record<string, unknown> = {}
    for (const k of spec.fields) {
      const v = (r as Record<string, unknown>)[k]
      if (v !== undefined && v !== null && v !== '') out[k] = v
    }
    return out
  }).filter(r => Object.keys(r).length > 0)
    .map(r => ({ ...r, coach_id: academyId, ...(staffId && spec.assignable ? { staff_id: staffId } : {}) }))

  if (!clean.length) return NextResponse.json({ inserted: 0 })
  const { data: saved, error } = await admin.from(spec.table).insert(clean).select('id')
  if (error) {
    console.error('[coach/import/save]', spec.table, error.message)
    return NextResponse.json({ error: `Could not save ${body.category}: ${error.message}` }, { status: 500 })
  }

  // Camps go straight into the coach's own calendar, exactly as a camp added by
  // hand does — a camp that is not on their phone is a week they can be
  // double-booked into. A calendar hiccup never fails the import: the camps are
  // saved, and the Camps page's catch-up pass picks up anything missed.
  let calendar: { synced: number; failed: number } | undefined
  if (spec.table === 'coach_camps' && saved?.length) {
    try {
      const { syncCampsToCalendar } = await import('@/lib/coach/camp-calendar')
      const results = await syncCampsToCalendar(academyId, { campIds: saved.map((r: { id: string }) => r.id) })
      calendar = { synced: results.filter(r => r.synced.length).length, failed: results.filter(r => r.failed.length).length }
    } catch (e) { console.error('[coach/import/save] camp calendar', e) }
  }
  return NextResponse.json({ inserted: clean.length, ...(calendar ? { calendar } : {}) })
}
