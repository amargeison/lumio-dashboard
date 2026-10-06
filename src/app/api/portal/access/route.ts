import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isUuid } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Who has portal access — and taking it away.
//
// Until this existed there was no way to remove anybody: not a parent after a
// separation, not a family that had left, not a coach who had moved on. The
// only route in was the invite, and nothing ever wrote 'revoked'.
//
//   GET  ?playerId=…  the parent/player logins for one player
//   GET  ?staffId=…   the login for one coach
//   DELETE { memberId }  withdraw that login
//
// Head coach only — who may sign in to an academy is the head's decision, the
// same rule the invite route applies.
//
// Withdrawing sets the membership to 'revoked'. That takes effect at once: every
// portal route and every database rule asks for an ACTIVE membership. The row
// is kept (not deleted) so that inviting the same person again restores exactly
// what they had — see the invite route — and so the person is told their access
// was removed rather than that they never had any.

async function head() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: own } = await admin.from('sports_profiles').select('id, sport').eq('id', user.id).maybeSingle()
  if (own?.sport !== 'coach') return { error: NextResponse.json({ error: 'Only the head coach can manage who has access.' }, { status: 403 }) }
  return { admin, academyId: user.id }
}

export async function GET(req: NextRequest) {
  const who = await head()
  if ('error' in who) return who.error
  const playerId = req.nextUrl.searchParams.get('playerId')
  const staffId = req.nextUrl.searchParams.get('staffId')
  if ((playerId && !isUuid(playerId)) || (staffId && !isUuid(staffId)) || (!playerId && !staffId)) {
    return NextResponse.json({ error: 'Choose a player or a coach.' }, { status: 400 })
  }

  let q = who.admin.from('coach_members')
    .select('id, email, role, status, member_user_id, invite_sent_at, created_at')
    .eq('academy_id', who.academyId)
  q = playerId
    ? q.eq('scope_player_id', playerId).in('role', ['parent', 'student'])
    : q.eq('staff_id', staffId!).eq('role', 'coach')
  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) { console.error('[portal/access] list', error.message); return NextResponse.json({ error: 'Could not load who has access. Please try again.' }, { status: 500 }) }

  return NextResponse.json({
    members: (data || []).map(m => ({
      id: m.id, email: m.email, role: m.role,
      // invited = email sent, not signed in yet · active = has access · revoked = access withdrawn
      status: m.status,
      signedIn: !!m.member_user_id,
      invitedAt: m.invite_sent_at || m.created_at,
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const who = await head()
  if ('error' in who) return who.error
  const { memberId } = (await req.json().catch(() => ({}))) as { memberId?: string }
  if (!isUuid(memberId)) return NextResponse.json({ error: 'Choose whose access to remove.' }, { status: 400 })

  // Scoped to this academy in the write itself: a membership id from another
  // academy matches nothing.
  const { data, error } = await who.admin.from('coach_members')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', memberId).eq('academy_id', who.academyId).select('id, email, role')
  if (error) { console.error('[portal/access] revoke', error.message); return NextResponse.json({ error: 'Access could not be removed. Please try again.' }, { status: 500 }) }
  if (!data?.length) return NextResponse.json({ error: 'That login was not found in your academy.' }, { status: 404 })

  return NextResponse.json({ ok: true, revoked: data[0] })
}
