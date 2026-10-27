import { NextRequest, NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { thread } from '@/lib/app/coach-data'

export const runtime = 'nodejs'

// One conversation, oldest first. Opening it marks what came in as read, as
// opening it on the website does.
//   GET ?id=player:<uuid> | camp:<id> | name:<label>
export async function GET(req: NextRequest) {
  const c = await coachContext()
  if (!c.ok) return c.res
  const id = String(req.nextUrl.searchParams.get('id') || '').slice(0, 300)
  if (!/^(player|camp|name):./.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const t = await thread(c.ctx.db, c.ctx.seat.academyId, id)
  if (t.unreadIds.length) {
    await c.ctx.db.from('coach_messages').update({ read: true }).eq('coach_id', c.ctx.seat.academyId).in('id', t.unreadIds)
  }
  return NextResponse.json({ id, messages: t.messages }, noStore)
}
