import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Signing proxy for player/staff photos (the `avatars` bucket is PRIVATE).
// The coach's browser requests /api/coach/avatar-img?p=<storage path>; we verify
// the signed-in coach owns that path (it lives under their own uid folder), mint
// a short-lived signed URL, and 302-redirect the <img> to it. Parents never use
// this route — the portal routes sign their child's avatar server-side.
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

  // The coach may only view avatars directly under their own {uid}/ prefix.
  // Reject path traversal and empty segments so `{uid}/../otherUid/x` can't escape.
  if (path.includes('..') || !path.startsWith(`${user.id}/`) || path.split('/').some(seg => !seg)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await admin.storage.from('avatars').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl, 302)
}
