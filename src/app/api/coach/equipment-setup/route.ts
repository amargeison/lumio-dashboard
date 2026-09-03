import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
  coach_equipment: ['item', 'category', 'quantity', 'status', 'notes'],
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
  const { data: rows } = await admin.from('coach_members')
    .select('academy_id, staff_id, role, status')
    .eq('member_user_id', user.id).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1)
  const m = rows?.[0]
  if (!m || m.role !== 'coach' || !m.staff_id) {
    return NextResponse.json({ error: 'No coach access' }, { status: 403 })
  }

  try {
    let copied = 0

    if (mode === 'copy') {
      for (const [table, cols] of Object.entries(COPY_COLUMNS)) {
        const { data: shared } = await admin.from(table)
          .select(cols.join(', '))
          .eq('coach_id', m.academy_id)
          .is('staff_id', null)

        // Guard against a double-click leaving two of everything.
        const { count: existing } = await admin.from(table)
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', m.academy_id).eq('staff_id', m.staff_id)

        if ((shared?.length ?? 0) && !existing) {
          const copy = (shared as unknown as Record<string, unknown>[]).map(r => ({
            ...r, coach_id: m.academy_id, staff_id: m.staff_id,
          }))
          const { error } = await admin.from(table).insert(copy)
          if (error) throw error
          copied += copy.length
        }
      }
    }

    const { error: flagErr } = await admin.from('coach_staff')
      .update({ equipment_own: true }).eq('id', m.staff_id).eq('coach_id', m.academy_id)
    if (flagErr) throw flagErr

    return NextResponse.json({ ok: true, mode, copied })
  } catch (e) {
    console.error('[coach/equipment-setup]', e)
    return NextResponse.json({ error: 'Could not set up your kit list.' }, { status: 500 })
  }
}
