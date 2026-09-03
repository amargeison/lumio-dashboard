import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Who is signed in, and whose academy are they working in?
//
// This is the question the coach portal has never had to ask, because there was
// only ever one answer: you are the academy. Now an assistant coach signs into
// the same portal, and every read and write has to be scoped to the academy they
// belong to rather than to their own user id.
//
//   academyId — whose data this is. The head coach's user id, always.
//   staffId   — which coach they are within it. Null for the head.
//   isHead    — do they own the academy.
//
// The portal funnels every query through currentCoachId() in coach-db.ts, so
// answering this correctly here is what makes the rest of the portal work
// unchanged. Row level security (migration 166) is what actually enforces it —
// this only decides which academy to ASK for.

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // A head coach owns an academy — their own profile. That is the strong case
  // and it is checked first, so somebody who runs their own club AND helps out
  // at another still lands in their own.
  const { data: own } = await admin.from('sports_profiles')
    .select('id, brand_name, display_name, portal_slug, sport').eq('id', user.id).maybeSingle()

  if (own && own.sport === 'coach') {
    return NextResponse.json({
      academyId: own.id,
      staffId: null,
      isHead: true,
      role: 'head',
      equipmentOwn: true,
      brandName: own.brand_name,
      slug: own.portal_slug,
    })
  }

  // Otherwise: an invited coach. Bound memberships only — an invite that has
  // never been signed into has no member_user_id and must not resolve to
  // anything, or an unclaimed invite would be a way into somebody's academy.
  //
  // Which is why the binding has to happen HERE, on the way in. This route is
  // the coach portal's only door; /api/portal/* is the other one and is no
  // longer on a coach's path at all. Without this the invite stays 'invited'
  // for ever, the query below finds nothing, and the coach is refused from the
  // portal they were invited to. Idempotent — a no-op once bound.
  // user.email comes from auth.getUser(), which verifies against the auth server
  // — it is the address they actually proved they control, not a client claim.
  const { bindPendingInvites } = await import('@/lib/coach/membership')
  await bindPendingInvites(user.id, user.email)

  const { data: rows } = await admin.from('coach_members')
    .select('academy_id, staff_id, role, status')
    .eq('member_user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
  const m = rows?.[0]

  // Parents and students are members too, and they do NOT belong in the coach
  // portal. They keep their own scoped routes.
  if (!m || m.role !== 'coach') {
    return NextResponse.json({ error: 'No coach access' }, { status: 403 })
  }

  // A coach with no staff link is one the backfill could not resolve. They are
  // refused rather than shown an empty portal, because "you have no players"
  // and "we could not work out who you are" need different answers — the second
  // is something the head coach has to fix.
  if (!m.staff_id) {
    return NextResponse.json({
      error: 'Your account is not linked to a coach record yet. Ask your head coach to re-send your invite.',
    }, { status: 409 })
  }

  const [{ data: academy }, { data: staff }] = await Promise.all([
    admin.from('sports_profiles').select('brand_name, portal_slug').eq('id', m.academy_id).maybeSingle(),
    admin.from('coach_staff').select('equipment_own').eq('id', m.staff_id).maybeSingle(),
  ])

  return NextResponse.json({
    academyId: m.academy_id,
    staffId: m.staff_id,
    isHead: false,
    role: 'coach',
    brandName: academy?.brand_name ?? null,
    slug: academy?.portal_slug ?? null,
    // Have they set up their own kit list, or are they still on the club's?
    equipmentOwn: !!staff?.equipment_own,
  })
}
