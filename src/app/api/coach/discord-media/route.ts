import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Signing proxy for photos that arrived from Discord (the `coach-media` bucket
// is PRIVATE, and Discord's own links die within a day, which is why the file
// was copied here in the first place).
//
// The browser asks for /api/coach/discord-media?p=<storage path>; we check the
// signed-in user is allowed that folder, mint a short-lived signed URL and
// 302-redirect the <img> to it. Same shape as the avatar proxy — a coach should
// not have to think about buckets to see a photo of their own camp.
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

  // Discord media is filed as discord/{academyId}/{messageId}-{name}. A head
  // coach's academy id is their own uid; an invited coach's is not, which is the
  // bug that made every avatar 403 for staff until it was found — so the same
  // membership lookup applies here from the start.
  const allowed = new Set<string>([user.id])
  const { data: memberships } = await admin.from('coach_members')
    .select('academy_id').eq('member_user_id', user.id).eq('status', 'active')
  for (const m of memberships ?? []) if (m.academy_id) allowed.add(String(m.academy_id))

  const parts = path.split('/')
  if (path.includes('..') || parts.some(seg => !seg) || parts[0] !== 'discord' || !allowed.has(parts[1])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin.storage.from('coach-media').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl, 302)
}
