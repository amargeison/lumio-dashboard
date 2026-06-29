import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Coach uploads/changes a player's profile photo. Scoped: the player must belong
// to the signed-in coach. Stores to the public 'avatars' bucket and saves the URL.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { playerId, dataUrl } = (await req.json().catch(() => ({}))) as { playerId?: string; dataUrl?: string }
  if (!playerId || !dataUrl) return NextResponse.json({ error: 'Missing image' }, { status: 400 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: player } = await admin.from('coach_players').select('id').eq('id', playerId).eq('coach_id', user.id).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const url = await uploadAvatar(admin, user.id, playerId, dataUrl)
  if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  await admin.from('coach_players').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', playerId).eq('coach_id', user.id)
  return NextResponse.json({ url })
}

// Shared by the parent route too.
export async function uploadAvatar(admin: any, academyId: string, playerId: string, dataUrl: string): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!m) return null
    const bytes = Buffer.from(m[2], 'base64')
    if (bytes.length > 3_000_000) return null // ~3MB cap
    const path = `${academyId}/${playerId}.jpg`
    const { error } = await admin.storage.from('avatars').upload(path, bytes, { upsert: true, contentType: m[1] })
    if (error) { console.error('[avatar] upload', error.message); return null }
    const pub = admin.storage.from('avatars').getPublicUrl(path).data.publicUrl
    return `${pub}?v=${Date.now()}` // cache-bust so a changed photo shows immediately
  } catch (e) { console.error('[avatar]', e); return null }
}
