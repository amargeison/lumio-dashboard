// Server-only access-control core for student/coach portals. Every scoped portal
// route resolves the caller's membership HERE and filters strictly to its scope.
// This is the single audit point — if a row isn't allowed by the membership, it
// must never be returned.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import { slugify } from '@/lib/sports-admin/portal-url'

export type Membership = {
  id: string
  academyId: string            // the head coach whose data this member may see (a slice of)
  role: 'coach' | 'parent' | 'student'
  scopePlayerId: string | null // parent/student: the player THIS row is for (one row per child)
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

// Every membership the signed-in person holds.
//
// One person can hold several: a parent has one row PER CHILD (siblings at one
// academy, or children at two), and a coach whose own child is coached here has
// a coach row and a parent row. Nothing may assume "the" membership — the old
// code took the newest row and so showed a parent of two only ever one child,
// and a parent at two academies only ever one academy.
//
// Invites are bound first, every time: a second child invited after the parent
// first signed in is a new row that still has to be claimed.
//
// `active` is what grants access. `revoked` is returned only so the portal can
// tell somebody whose access was withdrawn why they see nothing.
// Returns null when nobody is signed in.
export async function getMemberships(): Promise<{ userId: string; email: string; active: Membership[]; revoked: Membership[] } | null> {
  const user = await sessionUser()
  if (!user) return null
  await bindPendingInvites(user.id, user.email)
  const { data: rows, error } = await admin().from('coach_members').select('*')
    .eq('member_user_id', user.id).order('created_at', { ascending: true })
  // If the lookup itself fails, nobody is let in on a guess.
  if (error) { console.error('[membership] read', error.message); return { userId: user.id, email: user.email || '', active: [], revoked: [] } }
  const shape = (row: any): Membership => ({
    id: row.id, academyId: row.academy_id, role: row.role,
    scopePlayerId: row.scope_player_id, scopeCoachName: row.scope_coach_name,
    email: row.email, status: row.status,
  })
  const all = (rows || []).map(shape)
  return {
    userId: user.id, email: user.email || '',
    active: all.filter(m => m.status === 'active'),
    revoked: all.filter(m => m.status === 'revoked'),
  }
}

// ── Which academy is a COACH working in? ────────────────────────────────────
// A coach can belong to more than one academy: they assist at two clubs, or run
// their own and help out at another. "The caller's academy" then has no single
// answer, and every route that guessed one (their own, else the newest
// membership) acted on the wrong club half the time — a message sent, a payment
// taken or a spreadsheet imported into an academy the coach was not looking at.
//
// So the portal says which academy each request is for: the address it is
// showing (/tennis/coach/<address>), sent in this header by the data layer on
// every coach request (see coach-db.ts). The address is only ever a CHOICE
// between academies the signed-in person already coaches at — it is checked
// here against their own academy and their active coach memberships, and an
// address they do not belong to gets nothing.
export const ACADEMY_HEADER = 'x-lumio-academy'

export type CoachSeat = {
  academyId: string
  staffId: string | null       // which coach they are there; null for the head coach
  isHead: boolean
  address: string              // the academy's portal address, lower-case
  brandName: string | null
}

/** The address the request says it is for, or null when it does not say. */
export async function requestedAcademy(): Promise<string | null> {
  try { return ((await headers()).get(ACADEMY_HEADER) || '').trim().toLowerCase() || null } catch { return null }
}

// Every academy this person coaches at: their own first, then each active
// coach membership, newest first. Invites are bound first, so somebody invited
// to a second academy since they last signed in already has it here.
export async function coachSeats(userId: string, email?: string | null): Promise<CoachSeat[]> {
  const db = admin()
  await bindPendingInvites(userId, email)
  const [{ data: own }, { data: rows, error }] = await Promise.all([
    db.from('sports_profiles').select('id, sport, portal_slug, brand_name, display_name').eq('id', userId).maybeSingle(),
    db.from('coach_members').select('academy_id, staff_id')
      // The coach rows — the same person may also hold parent rows.
      .eq('member_user_id', userId).eq('status', 'active').eq('role', 'coach')
      .order('created_at', { ascending: false }),
  ])
  // If the lookup itself fails, nobody is placed anywhere on a guess.
  if (error) { console.error('[membership] seats', error.message); return [] }
  const address = (p: { portal_slug?: string | null; brand_name?: string | null; display_name?: string | null }) =>
    (p.portal_slug || slugify(p.brand_name) || slugify(p.display_name) || '').toLowerCase()
  const seats: CoachSeat[] = []
  if (own?.sport === 'coach') seats.push({ academyId: own.id, staffId: null, isHead: true, address: address(own), brandName: own.brand_name ?? null })
  const theirs = (rows || []).filter(r => r.academy_id !== userId)
  if (theirs.length) {
    const { data: academies } = await db.from('sports_profiles')
      .select('id, portal_slug, brand_name, display_name').in('id', theirs.map(r => r.academy_id as string))
    for (const r of theirs) {
      const a = (academies || []).find(x => x.id === r.academy_id)
      if (!a || seats.some(s => s.academyId === r.academy_id)) continue
      seats.push({ academyId: r.academy_id as string, staffId: (r.staff_id as string) ?? null, isHead: false, address: address(a), brandName: a.brand_name ?? null })
    }
  }
  return seats
}

// The one academy this request is for.
//
// `wanted` is the address from the request (left out: read from the header).
// Given an address, the answer is that academy or nothing. With none — an
// older page, a call made outside the portal — it is what it always was: their
// own academy if they have one, otherwise the newest membership.
export function pickSeat(seats: CoachSeat[], wanted: string | null): CoachSeat | null {
  if (!wanted) return seats[0] ?? null
  return seats.find(s => !!s.address && s.address === wanted.trim().toLowerCase()) ?? null
}

/** As pickSeat, for a route that needs a usable coach: the head, or a coach linked to a staff record. */
export async function coachSeat(userId: string, email?: string | null, wanted?: string | null): Promise<CoachSeat | null> {
  const seat = pickSeat(await coachSeats(userId, email), wanted === undefined ? await requestedAcademy() : wanted)
  return seat && (seat.isHead || seat.staffId) ? seat : null
}

// The door every coach route that reads or writes academy data comes through.
//
// Many routes took "the academy" to be the caller's own user id. That is only
// true for a head coach in their own portal: an invited coach's work was filed
// under their own id (where nobody, including them, ever sees it) or answered
// "not found", and a head coach helping at a second academy acted on their own
// club from inside the other one's portal. This answers, in one place: who is
// signed in, which academy is this request for (coachSeat), and are they its
// head coach.
//
// `headOnly` is for what belongs to the academy rather than to one coach (camp
// sign-ups and their emails, for instance). An invited coach — and a head coach
// working in somebody else's portal — is told so, instead of the request being
// quietly run against a different academy.
export type CoachGate =
  | { ok: true; userId: string; email: string | null; seat: CoachSeat }
  | { ok: false; status: 401 | 403; error: string }

export const HEAD_COACH_ONLY = 'Only the head coach of this academy can do that.'

export async function coachGate(opts: { headOnly?: boolean } = {}): Promise<CoachGate> {
  const user = await sessionUser()
  if (!user) return { ok: false, status: 401, error: 'Not signed in' }
  const seat = await coachSeat(user.id, user.email)
  // Signed in, but not a coach at the academy asked for (a demo account, a
  // parent, a coach whose access was removed). Nothing is guessed for them.
  if (!seat) return { ok: false, status: 403, error: 'This is only available inside your own academy portal.' }
  if (opts.headOnly && !seat.isHead) return { ok: false, status: 403, error: HEAD_COACH_ONLY }
  return { ok: true, userId: user.id, email: user.email ?? null, seat }
}

// Has this academy got its player app on? (Settings → Parent & player app.)
//
// On unless the head coach has switched it OFF. It used to be "off unless
// switched on", and a new academy starts with nothing stored — so the first
// parent a coach invited was refused, and an academy that had never opened that
// setting would have had its families shut out. Only a stored `false` is off.
// If the setting cannot be read at all the answer is still no: a database
// fault must not open a page the coach has closed.
export async function playerAppOn(db: ReturnType<typeof admin>, academyId: string): Promise<boolean> {
  try {
    const { data, error } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
    if (error) return false
    return (data?.data as { studentApp?: unknown } | null)?.studentApp !== false
  } catch { return false }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

export type FamilyAccess =
  | { ok: true; m: Membership & { scopePlayerId: string; role: 'parent' | 'student' } }
  | { ok: false; status: number; code: 'signed_out' | 'no_access' | 'choose' | 'app_off'; error: string }

// THE check every family route makes: may the signed-in person act for THIS
// player?
//
// The player id comes from the browser (the child they picked at the top of the
// page), so it is never trusted on its own: the caller must hold an ACTIVE
// parent/student membership for exactly that player. With no id given, the
// answer is only "yes" when they hold exactly one — otherwise the route cannot
// know which child is meant and must not guess.
export async function familyAccess(playerId?: string | null): Promise<FamilyAccess> {
  const mine = await getMemberships()
  if (!mine) return { ok: false, status: 401, code: 'signed_out', error: 'You are signed out. Sign in again to carry on.' }
  const family = mine.active.filter(m => (m.role === 'parent' || m.role === 'student') && !!m.scopePlayerId)
  const none = { ok: false as const, status: 403, code: 'no_access' as const, error: 'This account does not have access to that player.' }
  let m: Membership | undefined
  if (playerId) {
    if (!isUuid(playerId)) return none
    m = family.find(x => x.scopePlayerId === playerId)
  } else if (family.length === 1) {
    m = family[0]
  } else if (family.length > 1) {
    return { ok: false, status: 400, code: 'choose', error: 'Choose which player you are looking at.' }
  }
  if (!m) return none
  if (!await playerAppOn(admin(), m.academyId)) {
    return { ok: false, status: 403, code: 'app_off', error: 'Your academy has switched its player app off for now. Please ask your coach about it.' }
  }
  return { ok: true, m: m as Membership & { scopePlayerId: string; role: 'parent' | 'student' } }
}

// Is this the only player in the academy with this name?
//
// Rows written before a table carried a player id (old lessons, bookings,
// messages) say only a name. A name is not an identity: two children called
// "Sam Twin" would each be shown the other's. So a name-only row is shown to a
// family ONLY when the name belongs to exactly one player — otherwise it is
// shown to neither. Compared in code, not with a database pattern match, so a
// name containing % or _ cannot match somebody else.
export async function nameIsUnique(db: ReturnType<typeof admin>, academyId: string, name: string): Promise<boolean> {
  const n = (name || '').trim().toLowerCase()
  if (!n) return false
  const { data, error } = await db.from('coach_players').select('name').eq('coach_id', academyId).limit(5000)
  if (error) return false
  return (data || []).filter(p => String(p.name || '').trim().toLowerCase() === n).length === 1
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
  const db = admin()
  const addr = (email || '').trim().toLowerCase()
  // Two kinds of row become active here.
  //
  // 1. An invite nobody has claimed: member_user_id is null and the address is
  //    exactly this user's. A row already bound to a different auth user is
  //    never re-pointed by an email match — that would be a way to take over
  //    somebody else's membership by claiming their address. Matched exactly
  //    (addresses are stored trimmed and lower-case): a pattern match would let
  //    "a_b@…" be claimed by "axb@…".
  // 2. A row ALREADY bound to this same user that is back at 'invited' — which
  //    is what a head coach re-inviting someone they had removed looks like.
  //    Before this, nothing could ever make such a row active again, and a
  //    re-sent invite locked the person out for good.
  //
  // A revoked row is never activated from here; only the head coach can restore
  // it, by inviting again.
  const [fresh, own] = await Promise.all([
    addr
      ? db.from('coach_members').select('id, academy_id, role, scope_player_id')
          .eq('email', addr).is('member_user_id', null).neq('status', 'revoked')
      : Promise.resolve({ data: [] as { id: string; academy_id: string; role: string; scope_player_id: string | null }[] }),
    db.from('coach_members').select('id').eq('member_user_id', userId).eq('status', 'invited'),
  ])
  const pending = fresh.data || []
  const again = (own.data || []).map(r => r.id as string)
  if (!pending.length && !again.length) return 0
  const now = new Date().toISOString()
  if (again.length) {
    const { error } = await db.from('coach_members').update({ status: 'active', updated_at: now })
      .in('id', again).eq('member_user_id', userId).eq('status', 'invited')
    if (error) console.error('[membership] re-activate', error.message)
  }
  if (!pending.length) return again.length
  // `.is('member_user_id', null)` again on the write: if two sign-ins race, the
  // second must not overwrite the first one's binding.
  const { error } = await db.from('coach_members')
    .update({ member_user_id: userId, status: 'active', updated_at: now })
    .in('id', pending.map(r => r.id)).is('member_user_id', null)
  if (error) { console.error('[membership] bind', error.message); return again.length }

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

  return pending.length + again.length
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
  //
  // Checked on the PLAYER, not the name. Matching on the name meant that of two
  // children called "Sam Twin" only the first family was ever greeted — the
  // second was told their welcome had already been sent.
  const { data: existing } = await db.from('coach_messages')
    .select('id').eq('coach_id', academyId).eq('player_id', playerId).eq('subject', WELCOME_SUBJECT).limit(1)
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

  // An ordinary message in this player's conversation: filed under the academy,
  // linked to the player, in their thread. It used to be written with none of
  // that, so the app could show it but would not let the family react or reply
  // to it — under a line saying "you can reply to this message any time".
  await db.from('coach_messages').insert({
    coach_id: academyId,
    player_id: playerId,
    recipients: name,
    thread_key: name,
    direction: 'out',
    from_name: coach || null,
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
