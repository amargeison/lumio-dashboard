import { NextRequest, NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { playerOf } from '@/lib/app/coach-data'
import { isUuid } from '@/lib/coach/membership'
import { loadMyPage } from '@/lib/student/my-account-server'

export const runtime = 'nodejs'

// One player: their details, then their next lessons, groups, plan, packs, card
// and anything owed — the same picture their family's app shows.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Read as the coach: a player they may not see is simply not found.
  const { data: p } = await c.ctx.db.from('coach_players').select('*').eq('id', id).eq('coach_id', c.ctx.seat.academyId).maybeSingle()
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const page = await loadMyPage(c.ctx.service, c.ctx.seat.academyId, id, { origin: req.nextUrl.origin })
  const next = page.lessons[0] ? { date: page.lessons[0].date, time: page.lessons[0].time } : null
  return NextResponse.json({ player: playerOf(p, next), page }, noStore)
}
