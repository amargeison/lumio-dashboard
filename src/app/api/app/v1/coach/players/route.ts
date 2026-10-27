import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { players } from '@/lib/app/coach-data'

export const runtime = 'nodejs'

// The roster, A–Z, with each player's next lesson.
export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  return NextResponse.json({ players: await players(c.ctx.db, c.ctx.seat.academyId) }, noStore)
}
