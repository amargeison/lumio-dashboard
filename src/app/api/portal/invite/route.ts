import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isReservedEmail } from '@/lib/demo-visitor'
import { isUuid, playerAppOn, coachSeats, pickSeat, requestedAcademy } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Head coach invites a sub-coach or a parent/student to the portal. Creates a
// scoped coach_members row (academy_id = the head's own id) and emails the
// invitee how to sign in. They get NO data access until they sign in and the
// membership binds — and then only their scoped slice via the portal routes.
//
// What pressing "invite" does, for each state the membership can be in:
//
//   no row yet  → a row is created at 'invited' and the email goes out.
//   'invited'   → nothing changes; the email is sent again (they may have lost
//                 it).
//   'active'    → NOTHING about their access changes — not the status, not who
//                 it is bound to. The email is sent again as a reminder of how
//                 to sign in. (This used to reset them to 'invited', which
//                 nothing could undo: a re-sent invite locked out the very
//                 person it was meant to help.)
//   'revoked'   → access is restored: the row goes back to 'invited' and
//                 becomes active the next time that person opens the portal.
//
// A parent has one row PER CHILD, so inviting them for a second child adds a
// row and leaves the first alone. A coach has one row per academy.
//
// The same email is not sent twice within INVITE_COOLDOWN_MS — the button has
// no busy state and a double-click used to send three.
const INVITE_COOLDOWN_MS = 2 * 60_000

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // Only the head coach — the person who OWNS the academy. Who may sign in to
  // an academy is access control, and that has always been the head's alone
  // (coach_members is head-only in the database too). This used to ask only "is
  // this person part of an academy?", which is true of every assistant coach:
  // one could send invitations in the academy's name, and the rows were filed
  // under the assistant's own user id rather than the academy's.
  const { data: academy } = await admin.from('sports_profiles')
    .select('brand_name, display_name, portal_slug, sport').eq('id', user.id).maybeSingle()
  if (academy?.sport !== 'coach') return bad('Only the head coach can invite people to the academy.', 403)
  // A head coach can also be an assistant at somebody else's academy. Pressed
  // from THAT portal, an invite must not quietly go out from their own: the
  // portal says which academy it is showing, and it has to be the one they own.
  const here = await requestedAcademy()
  if (here && pickSeat(await coachSeats(user.id, user.email), here)?.academyId !== user.id) {
    return bad('Only the head coach can invite people to the academy.', 403)
  }

  const body = (await req.json().catch(() => ({}))) as { email?: unknown; role?: unknown; scopePlayerId?: unknown; scopeCoachName?: unknown; staffId?: unknown; name?: unknown }
  // Tidied once, here, and used for everything after — the row AND the email.
  // The membership was stored tidy but the email went to the address as typed,
  // trailing space and all.
  const emailLc = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = typeof body.role === 'string' ? body.role : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const scopeCoachName = typeof body.scopeCoachName === 'string' ? body.scopeCoachName.trim().slice(0, 120) || null : null
  const family = role === 'parent' || role === 'student'

  if (!emailLc || emailLc.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLc) || isReservedEmail(emailLc)) return bad('That email address does not look right. Check it and try again.')
  if (role !== 'coach' && !family) return bad('Invalid role')

  // Every id in the request is checked against THIS academy before anything is
  // written or sent. A player id from another academy used to be accepted, and
  // the email then named that academy's child.
  let scopePlayerId: string | null = null
  let playerName: string | null = null
  let staffId: string | null = null
  if (family) {
    if (!body.scopePlayerId) return bad('Choose a player for this invite.')
    if (!isUuid(body.scopePlayerId)) return bad('That player is not on your roster.')
    const { data: p } = await admin.from('coach_players')
      .select('id, name').eq('id', body.scopePlayerId).eq('coach_id', user.id).maybeSingle()
    if (!p) return bad('That player is not on your roster.')
    scopePlayerId = p.id as string
    playerName = (p.name as string) ?? null
    // Inviting a family to an app that is switched off would hand them a page
    // that refuses to open.
    if (!await playerAppOn(admin, user.id)) {
      return bad('The player app is switched off. Switch it on in Settings → Parent & player app, then invite again.', 409)
    }
  } else if (body.staffId && body.staffId !== '__head__') {
    // '__head__' is the client-side fiction for the head coach, not a real row.
    if (!isUuid(body.staffId)) return bad('That coach is not on your staff list.')
    const { data: st } = await admin.from('coach_staff')
      .select('id').eq('id', body.staffId).eq('coach_id', user.id).maybeSingle()
    if (!st) return bad('That coach is not on your staff list.')
    staffId = st.id as string
  }

  // The row this invite is about: a coach's one row, or the parent's row for
  // THIS child.
  const findRow = async () => {
    let q = admin.from('coach_members').select('id, status, member_user_id, staff_id, invite_sent_at')
      .eq('academy_id', user.id).eq('email', emailLc)
    q = family ? q.in('role', ['parent', 'student']).eq('scope_player_id', scopePlayerId!) : q.eq('role', 'coach')
    const { data } = await q.limit(1)
    return data?.[0] ?? null
  }

  const now = new Date()
  let row = await findRow()
  let send = false
  let restored = false

  if (!row) {
    // staff_id is the real link and scope_coach_name is the legacy name string.
    // Both are sent: a database trigger keeps whichever one is missing in step.
    const { error } = await admin.from('coach_members').insert({
      academy_id: user.id, email: emailLc, role,
      scope_player_id: scopePlayerId,
      scope_coach_name: family ? null : scopeCoachName,
      staff_id: staffId,
      status: 'invited', invite_sent_at: now.toISOString(), updated_at: now.toISOString(),
    })
    if (!error) send = true
    // 23505: the same invite arrived twice at once and the other one got there
    // first. Carry on with the row it made; it also owns the email.
    else if (error.code === '23505') row = await findRow()
    else { console.error('[portal/invite] insert', error.message); return bad('Could not save the invite. Please try again.', 500) }
    if (!send && !row) return bad('Could not save the invite. Please try again.', 500)
  }

  if (row) {
    // Never the binding, and never the status of somebody who is in.
    const patch: Record<string, unknown> = { updated_at: now.toISOString() }
    if (family) patch.role = role
    else {
      // A re-sent coach invite is also how a coach with no staff link gets one.
      if (staffId) patch.staff_id = staffId
      if (scopeCoachName && !staffId && !row.staff_id) patch.scope_coach_name = scopeCoachName
    }
    if (row.status === 'revoked') { patch.status = 'invited'; restored = true }
    const { error } = await admin.from('coach_members').update(patch).eq('id', row.id).eq('academy_id', user.id)
    if (error) { console.error('[portal/invite] update', error.message); return bad('Could not save the invite. Please try again.', 500) }

    // Claim the right to send. One conditional write, so two clicks landing
    // together cannot both win it.
    const cutoff = new Date(now.getTime() - INVITE_COOLDOWN_MS).toISOString()
    // (Two plain conditions, tried in turn, rather than one `or` — each is
    // still a single conditional write.)
    const claim = (q: any) => q.select('id').then((r: { data: unknown[] | null }) => !!r.data?.length)   // eslint-disable-line @typescript-eslint/no-explicit-any
    const stamp = () => admin.from('coach_members').update({ invite_sent_at: now.toISOString() }).eq('id', row.id)
    send = await claim(stamp().is('invite_sent_at', null)) || await claim(stamp().lt('invite_sent_at', cutoff))
  }

  if (!send) return NextResponse.json({ ok: true, emailed: false, restored, reason: 'An invite was sent to this address a moment ago.' })

  // Email the invite (Resend), in the same dark Lumio shell as every other email
  // the product sends. Everybody signs in at the same place: /portal is where a
  // member ENDS UP, not where they sign in — sending them straight there used
  // Supabase's own magic-link email, which is why the invite once arrived as a
  // link when the page was asking for a code.
  try {
    if (process.env.RESEND_API_KEY) {
      // Who is inviting them, and to what. Without this the email arrives from a
      // brand the recipient may never have heard of, asking them to sign in —
      // which is indistinguishable from a phishing attempt.
      // (`academy` and the player's name were read above, scoped to this
      // academy — the name in the email is always one of the caller's own.)

      // Send a COACH straight to the academy's own portal, not to the generic
      // sign-in page. /sports-login works — it identifies them and forwards — but
      // it is an extra hop that asks for their email on a page branded for
      // somebody else's product before the one they were invited to. Their portal
      // asks for the same email and signs them in where they belong.
      //
      // Parents and students keep /sports-login: /portal is their destination and
      // it is not addressed by an academy slug.
      //
      // An academy that has switched on its own sign-in page gets that page for
      // everybody — coaches included — with its badge and name at the top of the
      // email. Signing in there lands each person in the right place, same as
      // /sports-login does.
      const { partnerBrandByCoach } = await import('@/lib/coach/partner-login')
      const brand = await partnerBrandByCoach(user.id)
      const { portalUrlFor } = await import('@/lib/sports-admin/portal-url')
      const signInUrl = brand?.enabled
        ? brand.signInUrl
        : role === 'coach' && academy
          ? `https://www.lumiosports.com${portalUrlFor({ ...academy, sport: 'coach' })}`
          : null

      const { portalInviteEmail } = await import('@/lib/emails/portal-invite')
      const { subject, html } = portalInviteEmail({
        role: role as 'coach' | 'parent' | 'student',
        inviteeName: name || scopeCoachName,
        headCoachName: academy?.display_name ?? null,
        academyName: academy?.brand_name ?? null,
        playerName,
        signInUrl,
        partner: brand?.enabled ? { name: brand.name, logoUrl: brand.emailLogoUrl } : null,
      })

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error: sendErr } = await resend.emails.send({ from: 'Lumio Sports <hello@lumiocms.com>', to: emailLc, subject, html })
      if (sendErr) console.error('[portal/invite] send rejected → @' + emailLc.split('@')[1] + ':', sendErr)
    }
  } catch (e) { console.warn('[portal/invite] email', e) }

  return NextResponse.json({ ok: true, emailed: true, restored })
}
