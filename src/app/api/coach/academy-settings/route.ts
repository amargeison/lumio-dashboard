import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

export const runtime = 'nodejs'

// The part of an academy's settings that an invited coach's portal needs.
//
// coach_settings is the head coach's row and only they can read it (it holds
// their DBS record, the safeguarding lead, sender addresses). But the modules
// that are switched on, the theme, the colour and the tidied menu are the
// academy's choices, and a coach who works there has to see the same portal the
// head coach set up. Without this their portal fell back to "everything on,
// Lumio blue" whatever the head coach had chosen.
//
// A whitelist, so a key added to the settings blob later is private until
// somebody decides otherwise. Nothing personal to the head coach is on it.
const SHARED = [
  'theme', 'accentKey', 'density', 'academy', 'brandLogo',
  'features', 'menuHidden', 'sectionsOff',
  'awardThreshold', 'lessonTypes', 'ownRewards', 'rewards', 'audioOnly',
  'resourcesPreloaded', 'helpHints',
  // The safeguarding lead's name and the DBS warning rules: every coach needs
  // to know who the lead is.
  'staff',
] as const

export async function GET(req: NextRequest) {
  const uid = await sessionCoachId()
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const db = serviceClient()
  // Which academy — from the caller's own active coach membership, never from
  // the request alone. `academy` only chooses between academies they are
  // already a coach at; naming one they are not gets nothing.
  const wanted = req.nextUrl.searchParams.get('academy')
  let q = db.from('coach_members')
    .select('academy_id')
    .eq('member_user_id', uid).eq('status', 'active').eq('role', 'coach')
  if (wanted) q = q.eq('academy_id', wanted)
  const { data: rows, error: memberErr } = await q.order('created_at', { ascending: false }).limit(1)
  if (memberErr) return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
  const academyId = (rows as { academy_id: string }[] | null)?.[0]?.academy_id
  if (!academyId) return NextResponse.json({ error: 'No coach access' }, { status: 403 })

  const { data, error } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load settings' }, { status: 500 })
  const all = ((data as { data?: Record<string, unknown> } | null)?.data || {}) as Record<string, unknown>
  const settings: Record<string, unknown> = {}
  for (const k of SHARED) if (k in all) settings[k] = all[k]
  return NextResponse.json({ settings })
}
