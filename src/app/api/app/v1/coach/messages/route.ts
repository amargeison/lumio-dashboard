import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { conversations } from '@/lib/app/coach-data'

export const runtime = 'nodejs'

// The inbox: one row per conversation, newest first, with unread counts.
export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  return NextResponse.json({ conversations: await conversations(c.ctx.db, c.ctx.seat.academyId) }, noStore)
}
