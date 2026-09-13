import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { uploadAvatar } from '../avatar/route'

export const runtime = 'nodejs'

// A coach editing their OWN staff record — photo, accreditation, contact, DBS.
//
// Deliberately a route and not a row level security policy. Migration 167 took
// coach_staff away from coaches on purpose: the table carries every colleague's
// DBS number and safeguarding dates. Handing back an UPDATE policy scoped to
// their own row would also hand back the ability to set is_head on it, and
// guarding that needs a trigger — more moving parts than a whitelist.
//
// So: the service role writes, and only these columns can be written. Note what
// is NOT here — is_head, coach_id, name, role, contracted_hours. Who somebody is
// and what they are paid for is the head coach's call.
const EDITABLE = ['avatar_url', 'phone', 'email', 'qualifications',
  'dbs_number', 'dbs_issued', 'dbs_expiry', 'safeguarding_trained', 'safeguarding_date',
  'profile_complete'] as const

const READABLE = 'id, name, role, email, phone, qualifications, avatar_url, home_venue, contracted_hours, dbs_number, dbs_issued, dbs_expiry, safeguarding_trained, safeguarding_date, profile_complete'

async function me() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  // Resolved from the membership, never from the request — otherwise a coach
  // could name somebody else's staff row and edit it.
  const { data: rows } = await admin.from('coach_members')
    .select('academy_id, staff_id, role, status')
    .eq('member_user_id', user.id).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1)
  const m = rows?.[0]
  if (!m || m.role !== 'coach' || !m.staff_id) return null
  return { admin, academyId: m.academy_id as string, staffId: m.staff_id as string }
}

export async function GET() {
  const who = await me()
  if (!who) return NextResponse.json({ error: 'No coach access' }, { status: 403 })

  const [{ data: staff }, { data: venues }] = await Promise.all([
    who.admin.from('coach_staff').select(READABLE).eq('id', who.staffId).maybeSingle(),
    who.admin.from('coach_staff_venues')
      .select('venue_id, is_primary, coach_venues(name)')
      .eq('staff_id', who.staffId),
  ])

  // Self-healing migration for photos saved before they went to the bucket.
  //
  // Those rows hold a base64 JPEG inline, which whoami withholds — so the coach
  // sees their photo here and NOWHERE ELSE, which is the confusing half-state.
  // Rather than ask them to re-pick it, move it the first time they open this
  // page and rewrite the row. One upload, once, and then the face appears in the
  // sidebar, the rail and the head coach's Coaches page like any other.
  let row = staff as Record<string, unknown> | null
  if (row && typeof row.avatar_url === 'string' && row.avatar_url.startsWith('data:')) {
    const moved = await uploadAvatar(who.admin, who.academyId, `staff-${who.staffId}`, row.avatar_url)
    if (moved) {
      await who.admin.from('coach_staff')
        .update({ avatar_url: moved, updated_at: new Date().toISOString() })
        .eq('id', who.staffId).eq('coach_id', who.academyId)
      row = { ...row, avatar_url: moved }
    } else {
      // Could not move it (unreadable, or over the size cap). Withhold it rather
      // than hand back a payload this route would then carry on every visit.
      row = { ...row, avatar_url: null }
    }
  }

  return NextResponse.json({
    staff: row,
    // Read-only here: which sites they work at is the head coach's call, and
    // showing it as text is kinder than a control that silently does nothing.
    venues: (venues ?? []).map((v: Record<string, unknown>) => ({
      id: v.venue_id,
      name: (v.coach_venues as { name?: string } | null)?.name ?? null,
      isPrimary: !!v.is_primary,
    })),
  })
}

export async function POST(req: NextRequest) {
  const who = await me()
  if (!who) return NextResponse.json({ error: 'No coach access' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const k of EDITABLE) if (k in body) patch[k] = body[k] === '' ? null : body[k]
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }
  patch.updated_at = new Date().toISOString()

  // Scoped to BOTH their staff id and their academy. staffId already comes from
  // their own membership, but a statement that can only ever touch one row
  // inside one academy is worth the extra clause.
  const { error } = await who.admin.from('coach_staff')
    .update(patch).eq('id', who.staffId).eq('coach_id', who.academyId)
  if (error) {
    console.error('[coach/my-profile]', error.message)
    return NextResponse.json({ error: 'Could not save your details.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
