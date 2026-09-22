// Server-only access-control core for student/coach portals. Every scoped portal
// route resolves the caller's membership HERE and filters strictly to its scope.
// This is the single audit point — if a row isn't allowed by the membership, it
// must never be returned.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type Membership = {
  id: string
  academyId: string            // the head coach whose data this member may see (a slice of)
  role: 'coach' | 'parent' | 'student'
  scopePlayerId: string | null // parent/student: the ONE player
  scopeCoachName: string | null// coach: assigned_coach filter
  email: string
  status: string
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

// The signed-in auth user (their own session cookie).
export async function sessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Resolve the caller's membership. Binds member_user_id on first sign-in (matching
// the invited email), so an invite becomes active when the right person logs in.
// Returns null if the caller is not a member (→ routes must 403).
export async function getMembership(): Promise<Membership | null> {
  const user = await sessionUser()
  if (!user) return null
  const db = admin()

  // Already bound to this auth user? A user can legitimately belong to more than
  // one academy (a parent with children at two clubs), so `.maybeSingle()` would
  // ERROR on >1 row and lock them out. Take the most recent membership
  // deterministically instead. (Multi-academy switching is a future enhancement.)
  const { data: boundRows } = await db.from('coach_members').select('*')
    .eq('member_user_id', user.id).neq('status', 'revoked')
    .order('created_at', { ascending: false }).limit(1)
  let row: any = boundRows?.[0] ?? null

  // Otherwise bind by the invited email (first sign-in), then re-read.
  if (!row && user.email) {
    if (await bindPendingInvites(user.id, user.email)) {
      const { data: justBound } = await db.from('coach_members').select('*')
        .eq('member_user_id', user.id).neq('status', 'revoked')
        .order('created_at', { ascending: false }).limit(1)
      row = justBound?.[0] ?? null
    }
  }
  if (!row) return null
  return {
    id: row.id, academyId: row.academy_id, role: row.role,
    scopePlayerId: row.scope_player_id, scopeCoachName: row.scope_coach_name,
    email: row.email, status: row.status,
  }
}

// Bind any invites addressed to this signed-in user's email.
//
// THIS IS WHAT MAKES AN INVITE REAL. A coach_members row starts life with
// member_user_id = null and status = 'invited'; until it is bound, whoami and
// every RLS policy correctly refuse to recognise the person.
//
// It used to happen only inside getMembership(), which is reached exclusively
// through /api/portal/* — fine while every invited user landed on /portal. Once
// coaches were sent straight to their own portal at /coach/[slug] they stopped
// touching those routes entirely, so the binding never ran and every coach
// invite silently stayed 'invited'. It lives here now, and whoami calls it, so
// both doors bind.
//
// Binds EVERY pending row for the address, not just the newest: a coach invited
// by two academies is two genuine invites, and binding one of them at random is
// how somebody ends up unable to reach the club that invited them.
export async function bindPendingInvites(userId: string, email?: string | null): Promise<number> {
  if (!email) return 0
  const db = admin()
  // member_user_id must be null. A row already bound to a different auth user is
  // never re-pointed by an email match — that would be a way to take over
  // somebody else's membership by claiming their address.
  const { data: pending } = await db.from('coach_members')
    .select('id, academy_id, role, scope_player_id')
    .ilike('email', email)
    .is('member_user_id', null)
    .neq('status', 'revoked')
  if (!pending?.length) return 0
  const { error } = await db.from('coach_members')
    .update({ member_user_id: userId, status: 'active', updated_at: new Date().toISOString() })
    .in('id', pending.map(r => r.id))
  if (error) { console.error('[membership] bind', error.message); return 0 }

  // Say hello, once, in the portal itself.
  //
  // The invite email already welcomed them; a second email would be noise. What
  // was missing is the thing a family sees when they arrive: an empty Messages
  // panel on a page full of their child's data, with no sign that anyone is on
  // the other end. This puts the first message there before they look.
  //
  // Fired here because binding happens exactly once per invite — so this cannot
  // send twice, however many times they sign in afterwards. Failures are logged
  // and swallowed: a greeting must never be the reason somebody cannot get in.
  for (const m of pending) {
    if (m.role !== 'parent' && m.role !== 'student') continue
    try { await sendWelcomeMessage(db, m.academy_id as string, m.scope_player_id as string | null, m.role as 'parent' | 'student') }
    catch (e) { console.error('[membership] welcome message', e) }
  }

  return pending.length
}

// The coach's first message to a new family, written in their academy's name.
//
// Exported because binding is not the only moment it can be needed: anyone who
// signed in BEFORE this existed is already bound and would never be greeted, so
// the portal calls it on load too. It dedupes on the subject, so calling it
// twice is a no-op rather than a second hello.
export async function sendWelcomeMessage(
  db: ReturnType<typeof admin>,
  academyId: string,
  playerId: string | null,
  role: 'parent' | 'student',
) {
  if (!playerId) return
  const [{ data: player }, { data: profile }] = await Promise.all([
    db.from('coach_players').select('name').eq('id', playerId).eq('coach_id', academyId).maybeSingle(),
    db.from('sports_profiles').select('brand_name, display_name').eq('id', academyId).maybeSingle(),
  ])
  const name = (player?.name || '').trim()
  if (!name) return
  const academy = (profile?.brand_name || '').trim() || 'your academy'
  const coach = (profile?.display_name || '').trim()
  const first = name.split(/\s+/)[0]

  // Don't greet twice if a family is re-invited or holds two memberships.
  const { data: existing } = await db.from('coach_messages')
    .select('id').eq('coach_id', academyId).eq('recipients', name).eq('subject', WELCOME_SUBJECT).limit(1)
  if (existing?.length) return

  const body = role === 'student'
    ? [
        `Welcome to ${academy}.`,
        '',
        'This is your page. After each lesson you will find the summary here — what you worked on, what to practise before next time, and the coach note that goes with it. Your progress through the colours updates as you are graded, and anything your coach recommends you read turns up here too.',
        '',
        'You can reply to this message any time — it comes straight to the coach.',
        coach ? `\n${coach}` : '',
      ].join('\n')
    : [
        `Welcome to ${academy}.`,
        '',
        `This is ${first}'s page. After each lesson you will find the summary here — what they worked on, what to practise at home before the next session, and the coach's note. Their progress through the colours updates as they are graded, and anything the coach recommends for them appears here too.`,
        '',
        'You can reply to this message any time — it comes straight to the coach.',
        coach ? `\n${coach}` : '',
      ].join('\n')

  await db.from('coach_messages').insert({
    coach_id: academyId,
    recipients: name,
    channels: 'inapp',
    subject: WELCOME_SUBJECT,
    body: body.trim(),
    status: 'sent',
  })
}

const WELCOME_SUBJECT = 'Welcome to your portal'

// Service-role DB handle for scoped reads — callers MUST apply the membership
// scope to every query (academy_id = m.academyId, plus player/coach scope).
export function scopedDb() { return admin() }

// Sign a value from the PRIVATE `avatars` bucket for external viewers (parents /
// sub-coaches), who can't use the coach-side signing proxy. Accepts a bare storage
// path or a legacy full public URL; passes data/already-signed/external URLs through.
// SECURITY (defence-in-depth): `ownerId` is the academy/head-coach id that owns the
// bucket folder ({ownerId}/…). The path MUST live under it and contain no traversal,
// so a poisoned avatar_url can't be used to sign another folder's object.
export async function signAvatar(db: ReturnType<typeof admin>, value: string | null | undefined, ownerId?: string): Promise<string | null> {
  if (!value) return null
  if (value.startsWith('data:') || value.includes('/object/sign/')) return value
  const path = value.match(/\/avatars\/(.+?)(?:\?|$)/)?.[1] || (value.startsWith('http') ? null : value)
  if (!path) return value
  if (ownerId && (path.includes('..') || !path.startsWith(`${ownerId}/`))) return null
  try { const { data } = await db.storage.from('avatars').createSignedUrl(path, 3600); return data?.signedUrl ?? null } catch { return null }
}
