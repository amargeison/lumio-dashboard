import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { campsMatch, tidyPersonName, isPersonName, personKey } from '@/lib/coach/import-records'
import { coachSeat } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Put imported players onto the camps they are listed for.
//
// A coach's workbook usually has a tab per camp: the camp in the title, the
// children underneath. The import used to bring in the camp and the children
// and leave them unconnected, so every camp read "0 booked". This is the join:
// each name on a camp's tab becomes an attendee of that camp, linked to the
// roster player of the same name where there is one.
//
// One safety rule. Camps send countdown emails to attendees' families
// automatically. An import is a coach loading history, not confirming places —
// so a camp that gains attendees here has its automatic emails PAUSED, and the
// coach turns them on from the camp's Emails tab when they are ready. Nobody's
// parents hear from Lumio because a spreadsheet was uploaded.

type List = { camp?: { name?: unknown; start_date?: unknown }; attendees?: { name?: unknown; paid?: unknown }[] }

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You are signed out — sign in again and retry.' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  // Head coach only: camps and their attendee lists are the academy's. And the
  // academy is the one whose portal the import was made in — a head coach who
  // also helps at another academy must not fill their own camps from there.
  const seat = await coachSeat(user.id, user.email)
  if (!seat?.isHead) return NextResponse.json({ error: 'Only the head coach can add camp attendees from an import.' }, { status: 403 })
  const academyId = seat.academyId

  const body = await req.json().catch(() => ({})) as { lists?: List[] }
  const lists = (Array.isArray(body.lists) ? body.lists : []).slice(0, 40)
  if (!lists.length) return NextResponse.json({ added: 0, camps: [] })

  try {
    const [{ data: camps }, { data: players }] = await Promise.all([
      admin.from('coach_camps').select('id, name, start_date, emails_paused').eq('coach_id', academyId),
      admin.from('coach_players').select('id, name, age').eq('coach_id', academyId).limit(10000),
    ])
    const key = personKey
    const byName = new Map<string, { id: string; age: number | null }>()
    const twice = new Set<string>()
    for (const p of players || []) {
      const k = key(p.name)
      if (byName.has(k)) twice.add(k); else byName.set(k, { id: p.id as string, age: (p.age as number | null) ?? null })
    }

    const result: { camp: string; added: number; already: number }[] = []
    const unmatched: string[] = []
    let added = 0
    for (const list of lists) {
      // The camp must be unmistakable. "Summer Camp" against a Week 1 and a
      // Week 3 is a guess, and a guess puts children on the wrong camp.
      const want = String(list.camp?.name ?? '').trim().toLowerCase()
      const hits = (camps || []).filter(c => campsMatch(c, list.camp || {}))
      const exact = hits.filter(c => String(c.name).trim().toLowerCase() === want)
      const camp = exact.length === 1 ? exact[0] : hits.length === 1 ? hits[0] : undefined
      if (!camp) { if (list.camp?.name) unmatched.push(String(list.camp.name).slice(0, 80)); continue }
      const { data: have } = await admin.from('coach_camp_attendees').select('player_id, player_name').eq('camp_id', camp.id)
      const haveIds = new Set((have || []).map(a => a.player_id).filter(Boolean) as string[])
      const haveNames = new Set((have || []).map(a => key(a.player_name)))
      const rows: Record<string, unknown>[] = []
      let already = 0
      for (const a of (list.attendees || []).slice(0, 2000)) {
        const name = tidyPersonName(String(a.name ?? ''))
        if (!isPersonName(name)) continue
        const k = name.toLowerCase()
        // Two players with the same name: the place is recorded by name only,
        // rather than guessing which of them is going.
        const player = twice.has(k) ? undefined : byName.get(k)
        if ((player && haveIds.has(player.id)) || haveNames.has(k)) { already++; continue }
        haveNames.add(k)
        rows.push({
          coach_id: academyId, camp_id: camp.id, player_id: player?.id ?? null, player_name: name,
          player_age: player?.age ?? null, paid: a.paid === true, status: 'confirmed', source: 'import',
        })
      }
      if (rows.length) {
        const { error } = await admin.from('coach_camp_attendees').insert(rows)
        if (error) throw new Error(error.message)
        if (!camp.emails_paused) await admin.from('coach_camps').update({ emails_paused: true }).eq('id', camp.id).eq('coach_id', academyId)
        added += rows.length
      }
      result.push({ camp: String(camp.name), added: rows.length, already })
    }
    return NextResponse.json({ added, camps: result, unmatched })
  } catch (e) {
    console.error('[coach/import/attendees]', e)
    return NextResponse.json({ error: `Could not add the camp attendees: ${e instanceof Error ? e.message : 'unknown error'}` }, { status: 500 })
  }
}
