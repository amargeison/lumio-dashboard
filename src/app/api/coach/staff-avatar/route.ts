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

  // Who owns the academy this staff row belongs to?
  //
  // Two callers, and only one of them used to work. The HEAD COACH is the
  // academy (coach_id = their user id), which is what the original check
  // assumed. An INVITED COACH is not — their user id matches no coach_id at all,
  // so uploading their own photo 404'd, and the coach profile page fell back to
  // storing the image as a base64 data URL on the row. That put a few hundred KB
  // of JPEG into every whoami response and every staff query.
  let ownerId: string | null = null

  const { data: asHead } = await admin.from('coach_staff')
    .select('id').eq('id', staffId).eq('coach_id', user.id).maybeSingle()
  if (asHead) {
    ownerId = user.id
  } else {
    // A coach may change their OWN photo and nobody else's — the membership is
    // what says which row is theirs, never anything in the request.
    const { data: rows } = await admin.from('coach_members')
      .select('academy_id, staff_id, role, status')
      .eq('member_user_id', user.id).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1)
    const m = rows?.[0]
    if (m && m.role === 'coach' && m.staff_id === staffId) ownerId = m.academy_id as string
  }

  if (!ownerId) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  // Stored under the ACADEMY's folder, not the uploader's — the bucket is keyed
  // by academy, and filing a coach's photo under their own user id would put it
  // somewhere the head coach's own reads never look.
  const url = await uploadAvatar(admin, ownerId, `staff-${staffId}`, dataUrl)
  if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  await admin.from('coach_staff')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', staffId).eq('coach_id', ownerId)
  return NextResponse.json({ url })
}
