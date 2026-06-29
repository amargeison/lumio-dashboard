import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { uploadAvatar } from '../avatar/route'

export const runtime = 'nodejs'

// Coach profile photo. The head coach (head:true) stores the URL in their local
// settings (no coach_staff row); a sub-coach's photo saves to coach_staff. Scoped:
// the staff member must belong to the signed-in coach.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { staffId, head, dataUrl } = (await req.json().catch(() => ({}))) as { staffId?: string; head?: boolean; dataUrl?: string }
  if (!dataUrl) return NextResponse.json({ error: 'Missing image' }, { status: 400 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  if (head) {
    const url = await uploadAvatar(admin, user.id, 'head', dataUrl)
    if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    return NextResponse.json({ url }) // client saves it into settings.head.avatarUrl
  }

  if (!staffId) return NextResponse.json({ error: 'Missing coach' }, { status: 400 })
  const { data: staff } = await admin.from('coach_staff').select('id').eq('id', staffId).eq('coach_id', user.id).maybeSingle()
  if (!staff) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const url = await uploadAvatar(admin, user.id, `staff-${staffId}`, dataUrl)
  if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  await admin.from('coach_staff').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', staffId).eq('coach_id', user.id)
  return NextResponse.json({ url })
}
