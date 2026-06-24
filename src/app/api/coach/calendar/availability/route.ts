import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId } from '@/lib/coach/oauth'
import { getBusyTimes } from '@/lib/coach/calendar'

// GET ?from=<ISO>&to=<ISO> → the coach's merged busy intervals across their
// connected Google/Outlook calendars, so the booking calendar can show true free
// slots. Returns { busy: [] } (not an error) when nothing is connected.
export async function GET(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from and to are required (ISO)' }, { status: 400 })

  try {
    const busy = await getBusyTimes(coachId, from, to)
    return NextResponse.json({ busy })
  } catch (err) {
    console.error('[coach/calendar/availability]', err)
    return NextResponse.json({ busy: [] })
  }
}
