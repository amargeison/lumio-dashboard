import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { today } from '@/lib/app/coach-data'

export const runtime = 'nodejs'

// The coach's Today screen: today's sessions (with who has said "I'll be
// there"), tomorrow's, and the week's numbers.
export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { seat, db, service } = c.ctx
  const data = await today(db, service, seat.academyId)
  return NextResponse.json({ academy: { id: seat.academyId, name: seat.brandName, slug: seat.address, isHead: seat.isHead }, ...data }, noStore)
}
