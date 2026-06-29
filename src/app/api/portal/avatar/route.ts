import { NextRequest, NextResponse } from 'next/server'
import { getMembership, scopedDb } from '@/lib/coach/membership'
import { uploadAvatar } from '../../coach/avatar/route'

export const runtime = 'nodejs'

// Parent/student changes their own player's photo from the portal. Scope-locked:
// they can only touch their scope_player_id within their academy.
export async function POST(req: NextRequest) {
  const m = await getMembership()
  if (!m || (m.role !== 'parent' && m.role !== 'student') || !m.scopePlayerId) return NextResponse.json({ error: 'No access' }, { status: 403 })

  const { dataUrl } = (await req.json().catch(() => ({}))) as { dataUrl?: string }
  if (!dataUrl) return NextResponse.json({ error: 'Missing image' }, { status: 400 })

  const db = scopedDb()
  const { data: player } = await db.from('coach_players').select('id').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const url = await uploadAvatar(db, m.academyId, m.scopePlayerId, dataUrl)
  if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  await db.from('coach_players').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', m.scopePlayerId).eq('coach_id', m.academyId)
  return NextResponse.json({ url })
}
