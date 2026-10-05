import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, scopedDb } from '@/lib/coach/membership'
import { uploadAvatar } from '../../coach/avatar/route'
import { checkImage, imageTypeOf } from '@/lib/coach/image-check'

export const runtime = 'nodejs'

const PHOTO_HELP = 'Choose a photo (JPG or PNG, up to 3MB).'

// Parent/student changes their own player's photo from the portal. Scope-locked:
// only for a player they hold an active membership for (`playerId`, checked).
export async function POST(req: NextRequest) {
  const { dataUrl, playerId } = (await req.json().catch(() => ({}))) as { dataUrl?: string; playerId?: string }
  const access = await familyAccess(playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m

  if (!dataUrl || typeof dataUrl !== 'string') return NextResponse.json({ error: PHOTO_HELP }, { status: 400 })
  const parts = dataUrl.match(/^data:image\/[\w.+-]+;base64,([A-Za-z0-9+/=\s]+)$/)
  if (!parts) return NextResponse.json({ error: `That file is not a photo we can use. ${PHOTO_HELP}` }, { status: 400 })
  const bytes = Buffer.from(parts[1], 'base64')
  if (bytes.length > 3_000_000) return NextResponse.json({ error: `That photo is too big. ${PHOTO_HELP}` }, { status: 413 })
  // What the bytes really are, whatever the label says. The label is typed by
  // the sender ("data:image/png"), and checking only how the file starts let
  // the PNG signature followed by a web page through. The whole file is read.
  const kind = checkImage(bytes)?.kind
  if (!kind) return NextResponse.json({ error: `That file is not a photo we can use. ${PHOTO_HELP}` }, { status: 400 })

  const db = scopedDb()
  const { data: player } = await db.from('coach_players').select('id, avatar_url').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'This player is no longer on the academy\u2019s roster.' }, { status: 404 })

  // Re-labelled with what the bytes actually are, so the stored type is true.
  const url = await uploadAvatar(db, m.academyId, m.scopePlayerId, `data:image/${kind};base64,${bytes.toString('base64')}`, { previous: player.avatar_url })
  if (!url) return NextResponse.json({ error: 'The photo could not be saved. Please try again.' }, { status: 500 })
  await db.from('coach_players').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', m.scopePlayerId).eq('coach_id', m.academyId)
  return NextResponse.json({ url })
}

// The child's photo, for their own family's page.
//
// The page used to be handed a link straight to the file store. This serves the
// picture itself instead, so two things are always true whatever is in the
// store: it is sent as an image (worked out from the bytes), and the browser is
// told not to second-guess that. Scope-locked like everything else here: only
// for a player the caller holds an active membership for.
export async function GET(req: NextRequest) {
  const access = await familyAccess(req.nextUrl.searchParams.get('playerId'))
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  const db = scopedDb()
  const { data: player } = await db.from('coach_players').select('avatar_url').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  const stored = String(player?.avatar_url || '')
  const path = stored.match(/\/avatars\/(.+?)(?:\?|$)/)?.[1] || (/^(https?:|data:|\/)/.test(stored) ? null : stored.split('?')[0])
  // Only ever a file in this academy's own folder.
  if (!path || path.includes('..') || !path.startsWith(`${m.academyId}/`)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: file, error } = await db.storage.from('avatars').download(path)
  if (error || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const bytes = Buffer.from(await file.arrayBuffer())
  const type = imageTypeOf(bytes)
  if (!type) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(bytes), { headers: {
    'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline',
    'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'private, max-age=3600',
  } })
}
