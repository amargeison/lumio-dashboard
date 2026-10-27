import { NextRequest, NextResponse } from 'next/server'
import { coachContext } from '@/lib/app/coach-context'
import { isUuid } from '@/lib/coach/membership'
import { POST as send } from '@/app/api/coach/message/send/route'

export const runtime = 'nodejs'

// A reply from the app, in a player's conversation: into their family's app
// and by email, through the same route the web inbox uses (who it goes to is
// looked up there, by the player's id, in the academy's own records).
//   POST { id: 'player:<uuid>', body } → the send route's answer
export async function POST(req: NextRequest) {
  const c = await coachContext()
  if (!c.ok) return c.res
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; body?: unknown }
  const playerId = typeof b.id === 'string' && b.id.startsWith('player:') ? b.id.slice(7) : ''
  const body = typeof b.body === 'string' ? b.body.trim() : ''
  if (!isUuid(playerId)) return NextResponse.json({ error: 'Replies from the app go to players. Open this conversation on the website.' }, { status: 400 })
  if (!body) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
  const inner = new NextRequest(new URL('/api/coach/message/send', req.url), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipients: [{ playerId }], channels: ['inapp', 'email'], body }),
  })
  return send(inner)
}
