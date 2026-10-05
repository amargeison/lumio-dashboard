import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { imageTypeOf } from '@/lib/coach/image-check'

export const runtime = 'nodejs'

// Player/staff photos for the coach's screens (the `avatars` bucket is PRIVATE).
// The coach's browser requests /api/coach/avatar-img?p=<storage path>; we verify
// the signed-in coach owns that path (it lives under their own uid folder) and
// send the picture back from here. Parents never use this route — the portal
// has its own (/api/portal/avatar).
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('p')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // Which folders may this user read from?
  //
  // The bucket is keyed by ACADEMY: every player and staff photo lives under
  // {academyId}/. For a head coach that is their own uid, which is why checking
  // `user.id` alone worked — right up until an invited coach asked for a photo.
  // Their uid is not the academy id, so every avatar 403'd and rendered as a
  // broken image: uploaded fine, saved fine, impossible to look at.
  const allowed = new Set<string>([user.id])
  const { data: memberships } = await admin.from('coach_members')
    .select('academy_id').eq('member_user_id', user.id).eq('status', 'active')
  for (const m of memberships ?? []) if (m.academy_id) allowed.add(String(m.academy_id))

  // Reject path traversal and empty segments so `{uid}/../otherUid/x` can't escape.
  const prefix = path.split('/')[0]
  if (path.includes('..') || path.split('/').some(seg => !seg) || !allowed.has(prefix)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // The picture is sent from here rather than by pointing the browser at the
  // file store, so it always goes out as an image (worked out from the bytes,
  // not from a label) and the browser is told not to guess otherwise. A stored
  // file that is not a picture is not served at all.
  const { data: file, error } = await admin.storage.from('avatars').download(path)
  if (error || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const bytes = Buffer.from(await file.arrayBuffer())
  const type = imageTypeOf(bytes)
  if (!type) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(bytes), { headers: {
    'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline',
    'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'private, max-age=3600',
  } })
}
