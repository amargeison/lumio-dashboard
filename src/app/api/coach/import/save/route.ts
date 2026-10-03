import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { normaliseWebLink } from '@/lib/coach/resource-files'
import { cleanRecord, type ImportCategory } from '@/lib/coach/import-records'

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

// Per request. The browser sends big imports in batches of 500.
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

  // Every row made to fit its table: an age of "U10" or a date of "next
  // Tuesday" used to fail the whole batch; now it moves into the notes.
  const clean = rows.map(r => cleanRecord(body.category as ImportCategory, (r || {}) as Record<string, unknown>))
    .filter((r): r is Record<string, unknown> => !!r)
    .map(r => ({ ...r, coach_id: academyId, ...(staffId && spec.assignable ? { staff_id: staffId } : {}) }))
    // A spreadsheet can only carry a web link, not the file itself. Links typed
    // without https:// ("riverside.co.uk/handbook") are completed so they open;
    // a bare filename ("handbook.pdf") is left empty, so the Resource Centre
    // offers "+ Add link" / "Upload file" rather than a link that 404s.
    .map((r: Record<string, unknown>) => spec.table === 'coach_resources' && r.url ? { ...r, url: normaliseWebLink(String(r.url)) } : r)

  if (!clean.length) return NextResponse.json({ inserted: 0 })

  // The Payments page reads the `paid` tick, not the word in `status` — so an
  // imported "Paid ✓" used to arrive as an unpaid line with a MARK PAID button.
  // `status` on that page means the plan's state (active / expiring / overdue),
  // so only "overdue" is kept there; paid and due become the tick.
  if (spec.table === 'coach_payments') {
    for (const r of clean as Record<string, unknown>[]) {
      // A refunded or cancelled invoice is not owed: it is ticked off so it
      // never shows as money to chase, with the original word kept in the notes.
      r.paid = r.status === 'paid' || /status: (refund|cancel|void|written off)/i.test(String(r.notes ?? ''))
      r.status = r.status === 'overdue' ? 'overdue' : null
    }
  }

  // Courts belong to a venue, and the Court Planner is built from venues — a
  // court saved without one is counted but never shown. So each court's
  // location becomes a venue (found by name if the coach already has it,
  // created if not) and the court is attached to it. Courts with no location
  // at all go to the coach's home venue, or a "Main venue" made for them.
  let venuesAdded = 0
  if (spec.table === 'coach_courts') {
    try {
      const { data: have } = await admin.from('coach_venues').select('id, name, is_home').eq('coach_id', academyId)
      const key = (n: unknown) => String(n ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
      const venues = new Map<string, string>((have || []).map(v => [key(v.name), v.id as string]))
      let fallback = (have || []).find(v => v.is_home)?.id as string | undefined
      const venueFor = async (location: string): Promise<string | undefined> => {
        // "Riverside Tennis Centre — Kingsmead KT1" → the name, and where it is.
        const [name, ...rest] = location.split(/\s+[—–-]\s+/)
        const k = key(name)
        if (!k) return undefined
        if (venues.has(k)) return venues.get(k)
        const { data: made, error: vErr } = await admin.from('coach_venues')
          .insert({ coach_id: academyId, name: name.trim().slice(0, 120), address: rest.join(' — ').trim().slice(0, 300) || null, is_home: !have?.length && venues.size === 0 })
          .select('id').maybeSingle()
        if (vErr || !made) { console.error('[coach/import/save] venue', vErr?.message); return undefined }
        venues.set(k, made.id as string); venuesAdded++
        return made.id as string
      }
      for (const r of clean as Record<string, unknown>[]) {
        const loc = String(r.location ?? '').trim()
        let id = loc ? await venueFor(loc) : undefined
        if (!id) { fallback = fallback || await venueFor('Main venue'); id = fallback }
        if (id) r.venue_id = id
      }
    } catch (e) { console.error('[coach/import/save] venues', e) }
  }

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
  // Resources that arrived without a file, so the import can say so.
  const needFiles = spec.table === 'coach_resources' ? clean.filter((r: Record<string, unknown>) => !r.url).length : 0
  return NextResponse.json({ inserted: clean.length, ...(calendar ? { calendar } : {}), ...(needFiles ? { needFiles } : {}), ...(venuesAdded ? { venuesAdded } : {}) })
}
