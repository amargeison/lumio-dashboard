import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isUuid } from '@/lib/coach/membership'
import { checkImage } from '@/lib/coach/image-check'

export const runtime = 'nodejs'

// Coach uploads, changes or removes a player's profile photo.
//
// Who: anyone who can see the player — the head coach, or the assistant the
// player is assigned to. The player is read with the caller's own session, so
// the database decides, and the row says which academy's folder the photo
// belongs in. (It used to require the caller to BE the academy, so an
// assistant's upload answered "Player not found" for their own player.)
async function resolve(playerId: string | undefined) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  if (!isUuid(playerId)) return { error: NextResponse.json({ error: 'Player not found' }, { status: 404 }) }
  const { data: player } = await supabase.from('coach_players').select('id, coach_id, avatar_url').eq('id', playerId).maybeSingle()
  if (!player) return { error: NextResponse.json({ error: 'Player not found' }, { status: 404 }) }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  return { admin, player: player as { id: string; coach_id: string; avatar_url: string | null } }
}

const PHOTO_HELP = 'Choose a photo (JPG or PNG, up to 3MB).'

export async function POST(req: NextRequest) {
  const { playerId, dataUrl } = (await req.json().catch(() => ({}))) as { playerId?: string; dataUrl?: string }
  const r = await resolve(playerId)
  if ('error' in r) return r.error
  const { admin, player } = r

  if (!dataUrl || typeof dataUrl !== 'string') return NextResponse.json({ error: PHOTO_HELP }, { status: 400 })
  const parts = dataUrl.match(/^data:image\/[\w.+-]+;base64,([A-Za-z0-9+/=\s]+)$/)
  if (!parts) return NextResponse.json({ error: `That file is not a photo we can use. ${PHOTO_HELP}` }, { status: 400 })
  const bytes = Buffer.from(parts[1], 'base64')
  if (bytes.length > 3_000_000) return NextResponse.json({ error: `That photo is too big. ${PHOTO_HELP}` }, { status: 413 })
  // What the bytes really are, whatever the label says — the whole file, not
  // just how it starts (the same check the family's own upload makes).
  const kind = checkImage(bytes)?.kind
  if (!kind) return NextResponse.json({ error: `That file is not a photo we can use. ${PHOTO_HELP}` }, { status: 400 })

  const url = await uploadAvatar(admin, player.coach_id, player.id, `data:image/${kind};base64,${bytes.toString('base64')}`, { previous: player.avatar_url })
  if (!url) return NextResponse.json({ error: 'The photo could not be saved. Please try again.' }, { status: 500 })
  await admin.from('coach_players').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', player.id).eq('coach_id', player.coach_id)
  return NextResponse.json({ url })
}

// Removing a photo. There was no way to: a photo could only be replaced, so
// when a family withdrew photo consent the picture stayed on show. The file is
// removed from storage as well as from the profile.
export async function DELETE(req: NextRequest) {
  const { playerId } = (await req.json().catch(() => ({}))) as { playerId?: string }
  const r = await resolve(playerId)
  if ('error' in r) return r.error
  const { admin, player } = r

  const { error } = await admin.from('coach_players').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', player.id).eq('coach_id', player.coach_id)
  if (error) { console.error('[avatar] remove', error.message); return NextResponse.json({ error: 'The photo could not be removed. Please try again.' }, { status: 500 }) }
  const path = storedPath(player.avatar_url, player.coach_id)
  if (path) {
    const { error: rmErr } = await admin.storage.from('avatars').remove([path])
    if (rmErr) console.error('[avatar] remove file', rmErr.message)
  }
  return NextResponse.json({ ok: true })
}

// The storage path inside a stored avatar value, and only if it sits in this
// academy's own folder — a stored value is never followed anywhere else.
function storedPath(value: string | null | undefined, academyId: string): string | null {
  if (!value) return null
  const path = value.match(/\/avatars\/(.+?)(?:\?|$)/)?.[1] || (/^(https?:|data:|\/)/.test(value) ? null : value)
  return path && !path.includes('..') && path.startsWith(`${academyId}/`) ? path : null
}

// Shared by the parent route too.
//
// `replace` is passed for a player's photo. Each upload then gets a path of its
// own and the photo it replaces is removed. With one fixed path per player a
// replaced photo kept the same address, so every screen went on showing the old
// picture until the page was reloaded. (Coach photos still use a fixed path.)
export async function uploadAvatar(admin: any, academyId: string, playerId: string, dataUrl: string, replace?: { previous: string | null | undefined }): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/)
    if (!m) return null
    const bytes = Buffer.from(m[2], 'base64')
    if (bytes.length > 3_000_000) return null // ~3MB cap
    // Every photo goes through here, so this is where it is checked: the file
    // has to BE a picture, and it is stored as the kind it really is — never as
    // whatever the sender called it.
    const image = checkImage(bytes)
    if (!image) return null
    const path = replace ? `${academyId}/${playerId}-${Date.now().toString(36)}.jpg` : `${academyId}/${playerId}.jpg`
    const { error } = await admin.storage.from('avatars').upload(path, bytes, { upsert: true, contentType: `image/${image.kind}` })
    if (error) { console.error('[avatar] upload', error.message); return null }
    const old = replace ? storedPath(replace.previous, academyId) : null
    if (old && old !== path) {
      const { error: rmErr } = await admin.storage.from('avatars').remove([old])
      if (rmErr) console.error('[avatar] remove replaced file', rmErr.message)
    }
    // Store the storage PATH — the bucket is private, so reads are signed on demand
    // (via /api/coach/avatar-img for the coach, or server-side in the portal routes).
    return path
  } catch (e) { console.error('[avatar]', e); return null }
}
