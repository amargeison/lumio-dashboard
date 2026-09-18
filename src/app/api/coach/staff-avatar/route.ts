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

  // Find the row FIRST, then ask whether this caller may touch it.
  //
  // The previous order — guess the academy from the caller, then look for the row
  // inside it — meant a caller with more than one membership, or whose newest
  // membership was not the relevant one, was refused with a bare 404 even though
  // the row was plainly theirs. Deriving the academy from the row itself removes
  // the guess: there is exactly one academy that owns a given staff id.
  const { data: staffRow } = await admin.from('coach_staff')
    .select('id, coach_id').eq('id', staffId).maybeSingle()
  if (!staffRow) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const ownerId = staffRow.coach_id as string

  // Two people may set this photo: the head coach of that academy, and the coach
  // it belongs to. Nobody else — a coach may change their OWN photo and no
  // colleague's, which is why the membership must name this exact staff row.
  let allowed = ownerId === user.id
  if (!allowed) {
    const { data: rows } = await admin.from('coach_members')
      .select('staff_id, role, status')
      .eq('member_user_id', user.id).eq('academy_id', ownerId).eq('status', 'active')
    allowed = !!rows?.some(m => m.role === 'coach' && m.staff_id === staffId)
  }
  if (!allowed) {
    console.warn('[staff-avatar] refused', { user: user.id, staffId, ownerId })
    return NextResponse.json({ error: 'You cannot change that photo.' }, { status: 403 })
  }

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
