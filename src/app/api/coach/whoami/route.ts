import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { coachSeats, pickSeat, requestedAcademy } from '@/lib/coach/membership'

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
//   academies — every academy this person coaches at, with its address, so the
//               portal can offer a way to switch. Only sent when there is more
//               than one.
//
// The portal funnels every query through currentCoachId() in coach-db.ts, so
// answering this correctly here is what makes the rest of the portal work
// unchanged. Row level security (migration 166) is what actually enforces it —
// this only decides which academy to ASK for.
//
// WHICH academy: the one in the portal's address. A coach can belong to more
// than one — they assist at two clubs, or run their own and help at another —
// and this route used to answer with their own, else the newest, whatever
// address was open. The portal now says which address it is showing (`?slug=`,
// or the header the data layer sends on every coach request) and the answer is
// for THAT academy, or a refusal when they are not a coach there. With no
// address given the old answer stands, so nothing that still asks the old way
// breaks.

export async function GET(req: NextRequest) {
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

  // Every academy they coach at — their own first, then each ACTIVE coach
  // membership. Bound memberships only: an invite that has never been signed
  // into has no member_user_id and must not resolve to anything, or an
  // unclaimed invite would be a way into somebody's academy.
  //
  // Which is why the binding has to happen on the way in (coachSeats does it).
  // This route is the coach portal's only door; /api/portal/* is the other one
  // and is no longer on a coach's path at all. Without it the invite stays
  // 'invited' for ever and the coach is refused from the portal they were
  // invited to. It runs for a head coach too: somebody who owns one academy and
  // is invited to help at another was never bound, because this route answered
  // "head coach" before it looked. Idempotent — a no-op once bound.
  // user.email comes from auth.getUser(), which verifies against the auth server
  // — it is the address they actually proved they control, not a client claim.
  const seats = await coachSeats(user.id, user.email)
  const wanted = (req.nextUrl.searchParams.get('slug') || '').trim().toLowerCase() || await requestedAcademy()
  const m = pickSeat(seats, wanted)

  // Parents and students are members too, and they do NOT belong in the coach
  // portal. They keep their own scoped routes. The same answer for a coach at
  // an address that is not one of their academies.
  if (!m) {
    return NextResponse.json({ error: 'No coach access' }, { status: 403 })
  }

  // Shown in the profile menu when there is somewhere else to go.
  const academies = seats.length > 1
    ? seats.filter(s => s.address).map(s => ({ slug: s.address, name: s.brandName, isHead: s.isHead, current: s.academyId === m.academyId }))
    : undefined

  // A head coach owns an academy — their own profile.
  if (m.isHead) {
    return NextResponse.json({
      academyId: m.academyId,
      staffId: null,
      isHead: true,
      role: 'head',
      equipmentOwn: true,
      brandName: m.brandName,
      slug: m.address,
      academies,
    })
  }

  // A coach with no staff link is one the backfill could not resolve. They are
  // refused rather than shown an empty portal, because "you have no players"
  // and "we could not work out who you are" need different answers — the second
  // is something the head coach has to fix.
  if (!m.staffId) {
    return NextResponse.json({
      error: 'Your account is not linked to a coach record yet. Ask your head coach to re-send your invite.',
    }, { status: 409 })
  }

  const [{ data: academy }, { data: staff }] = await Promise.all([
    admin.from('sports_profiles').select('brand_name, portal_slug, brand_logo_url').eq('id', m.academyId).maybeSingle(),
    admin.from('coach_staff')
      .select('equipment_own, name, avatar_url, role, qualifications')
      .eq('id', m.staffId).eq('coach_id', m.academyId).maybeSingle(),
  ])

  return NextResponse.json({
    academyId: m.academyId,
    staffId: m.staffId,
    isHead: false,
    role: 'coach',
    brandName: academy?.brand_name ?? null,
    slug: m.address || (academy?.portal_slug ?? null),
    academies,
    // The academy's badge. A coach works for the club, so the club's mark belongs
    // in their sidebar — without this they saw the generic Lumio logo while the
    // head coach two desks away saw the academy's.
    brandLogoUrl: academy?.brand_logo_url ?? null,
    // Have they set up their own kit list, or are they still on the club's?
    equipmentOwn: !!staff?.equipment_own,
    // Who they actually are. The portal shell had nothing to show for a signed-in
    // coach and fell back to the DEMO persona — which is how an invited coach
    // ended up being greeted as Rachel Adeyemi inside their own portal.
    displayName: staff?.name ?? null,
    // A stored path only. Rows written before photos went to the avatars bucket
    // hold a base64 JPEG inline, and this route runs on EVERY portal page load —
    // returning one would drag a few hundred KB through the hot path, on a phone,
    // on club wifi. Withheld rather than deleted: the full row is still served by
    // /api/coach/my-profile, so the coach can see their photo and re-upload it,
    // which quietly migrates them to the bucket.
    avatarUrl: staff?.avatar_url?.startsWith('data:') ? null : (staff?.avatar_url ?? null),
    staffRole: staff?.role ?? null,
    accreditation: staff?.qualifications ?? null,
  })
}
