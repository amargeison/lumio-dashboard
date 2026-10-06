import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { coachSeat } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// A coach setting up their own kit list for the first time.
//
// Two ways in, and the choice is the coach's:
//   'copy'  — start from the academy's list. Most coaches: the club has already
//             worked out what a session needs, and they want to tweak it.
//   'blank' — start empty. A coach who carries their own everything.
//
// Either way they end up owning a list, and from then on they see theirs rather
// than the academy's. Nothing on the academy's list is touched — "wipe the
// club's" means it disappears from THEIR view, not that it is deleted. A coach
// should not be able to empty the head coach's store cupboard by tidying up
// their own.

// Verified against migrations 113 and 132 rather than assumed — the two tables
// have nothing in common but coach_id, and a wrong column name here would fail
// at runtime for the first coach who tried it rather than at build time.
const COPY_COLUMNS = {
  // low_at is migration 203: the count at which an item is flagged as running low.
  coach_equipment: ['item', 'category', 'quantity', 'status', 'notes', 'low_at'],
  coach_kit_items: ['session_type', 'label', 'sort_order'],
} as const

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { mode } = (await req.json().catch(() => ({}))) as { mode?: 'copy' | 'blank' }
  if (mode !== 'copy' && mode !== 'blank') {
    return NextResponse.json({ error: 'mode must be copy or blank' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Resolve them from their membership, never from anything in the request —
  // otherwise a coach could set up a kit list inside somebody else's academy.
  // The academy in the portal's address picks WHICH of their memberships, when
  // they coach at more than one.
  const seat = await coachSeat(user.id, user.email)
  const m = seat && !seat.isHead && seat.staffId ? { academy_id: seat.academyId, staff_id: seat.staffId } : null
  if (!m) {
    return NextResponse.json({ error: 'No coach access' }, { status: 403 })
  }

  try {
    let copied = 0

    // Claim the list FIRST, in one statement that only one request can win.
    // The copy used to be guarded by counting the coach's rows and copying if
    // there were none — two presses landing together both counted none and both
    // copied, leaving two of everything. A coach who already has their own list
    // is told so and nothing is copied over it.
    const { data: claimed, error: flagErr } = await admin.from('coach_staff')
      .update({ equipment_own: true })
      .eq('id', m.staff_id).eq('coach_id', m.academy_id)
      // "Not already true" — false or never set. Written as one plain filter:
      // an or(…) filter on an update is applied a second time to the rows
      // handed back, which by then no longer match, so the answer came back
      // empty and every coach was told they already had a list.
      .not('equipment_own', 'is', true)
      .select('id')
    if (flagErr) throw flagErr
    if (!claimed?.length) return NextResponse.json({ ok: true, mode, copied: 0, already: true })

    if (mode === 'copy') {
      try {
        for (const [table, cols] of Object.entries(COPY_COLUMNS)) {
          const { data: shared, error: readErr } = await admin.from(table)
            .select(cols.join(', '))
            .eq('coach_id', m.academy_id)
            .is('staff_id', null)
          if (readErr) throw readErr

          if (shared?.length) {
            const copy = (shared as unknown as Record<string, unknown>[]).map(r => ({
              ...r, coach_id: m.academy_id, staff_id: m.staff_id,
            }))
            const { error } = await admin.from(table).insert(copy)
            if (error) throw error
            copied += copy.length
          }
        }
      } catch (e) {
        // Half a copy is worse than none: take back what was copied and the
        // claim, so the coach is offered the choice again rather than left
        // owning part of a list.
        for (const table of Object.keys(COPY_COLUMNS)) {
          await admin.from(table).delete().eq('coach_id', m.academy_id).eq('staff_id', m.staff_id)
        }
        await admin.from('coach_staff').update({ equipment_own: false }).eq('id', m.staff_id).eq('coach_id', m.academy_id)
        throw e
      }
    }

    return NextResponse.json({ ok: true, mode, copied })
  } catch (e) {
    console.error('[coach/equipment-setup]', e)
    return NextResponse.json({ error: 'Could not set up your kit list.' }, { status: 500 })
  }
}
