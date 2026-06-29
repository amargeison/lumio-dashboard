import { NextRequest, NextResponse } from 'next/server'
import { getMembership, scopedDb } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// A parent/student sends a message to their coach. Stored as an inbound message
// on the coach's log, threaded under the player's name. Scope-locked: the sender
// can only post to their own academy, under their own player's conversation.
export async function POST(req: NextRequest) {
  const m = await getMembership()
  if (!m || (m.role !== 'parent' && m.role !== 'student') || !m.scopePlayerId) return NextResponse.json({ error: 'No access' }, { status: 403 })

  const { body = '' } = (await req.json().catch(() => ({}))) as { body?: string }
  if (!body.trim()) return NextResponse.json({ error: 'Message is empty' }, { status: 400 })

  const db = scopedDb()
  const { data: player } = await db.from('coach_players').select('name').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const conv = (player.name || '').trim()
  const { error } = await db.from('coach_messages').insert({
    coach_id: m.academyId, direction: 'in', from_name: conv, recipients: conv, thread_key: conv,
    body: body.trim(), channels: 'portal', status: 'received', read: false, created_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
