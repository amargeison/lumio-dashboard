// Who belongs to an org, in the terms the portal and the Members list use. No
// database here, so the rules run the same in the browser and the tests.

export type MemberRole = 'coach' | 'parent' | 'school'

export interface MemberRow {
  id: string; user_id: string; hq_id: string; role: MemberRole
  staff_id: string | null; family_id: string | null; school_id: string | null
  invited_email: string | null; invited_at: string | null; accepted_at: string | null; revoked_at: string | null
}
export interface InviteRow {
  id: string; hq_id: string; role: MemberRole
  staff_id: string | null; family_id: string | null; school_id: string | null
  email: string; expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string
}

export const isActive = (m: Pick<MemberRow, 'accepted_at' | 'revoked_at'>) => !!m.accepted_at && !m.revoked_at

/** What a signed-in person gets at one org's address. The coach view comes first if they hold two roles. */
export type PortalAccess = { kind: 'member'; member: MemberRow; otherRole: MemberRole | null } | { kind: 'denied' } | { kind: 'public' }
const ORDER: MemberRole[] = ['coach', 'parent', 'school']
export function portalAccess(memberships: MemberRow[], orgHq: string | null, isOtherOrgHq: boolean, wanted?: string | null): PortalAccess {
  const here = memberships.filter(m => m.hq_id === orgHq && isActive(m)).sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))
  // ?view= only chooses between roles this person holds.
  const member = here.find(m => m.role === wanted) ?? here[0]
  if (member) return { kind: 'member', member, otherRole: here.find(m => m.role !== member.role)?.role ?? null }
  // Any membership at all, even a revoked one, means this person isn't a visitor.
  return memberships.length || isOtherOrgHq ? { kind: 'denied' } : { kind: 'public' }
}

export type MemberStatus = 'active' | 'invited' | 'expired' | 'revoked'
export interface MemberLine {
  key: string; role: MemberRole; email: string; status: MemberStatus
  memberId: string | null; inviteId: string | null
  staffId: string | null; familyId: string | null; schoolId: string | null
}

const targetKey = (r: { role: MemberRole; staff_id: string | null; family_id: string | null; school_id: string | null }) =>
  `${r.role}:${r.staff_id ?? r.family_id ?? r.school_id}`

/** One line per person: a membership wins over the invites behind it, and only the latest invite counts. */
export function memberLines(members: MemberRow[], invites: InviteRow[], now = new Date()): MemberLine[] {
  const lines = new Map<string, MemberLine>()
  for (const m of members) {
    lines.set(targetKey(m), {
      key: targetKey(m), role: m.role, email: m.invited_email ?? '', status: m.revoked_at ? 'revoked' : m.accepted_at ? 'active' : 'invited',
      memberId: m.id, inviteId: null, staffId: m.staff_id, familyId: m.family_id, schoolId: m.school_id,
    })
  }
  const latestFirst = [...invites].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const seen = new Set<string>()
  for (const i of latestFirst) {
    const key = targetKey(i)
    if (seen.has(key)) continue
    seen.add(key)
    const live = !i.accepted_at && !i.revoked_at
    const had = lines.get(key)
    // A new invite after a revoke shows as pending; an old invite never hides a member.
    if (had && !(had.status === 'revoked' && live)) continue
    if (!had && i.accepted_at) continue
    lines.set(key, {
      key, role: i.role, email: i.email, status: i.revoked_at ? 'revoked' : new Date(i.expires_at) < now ? 'expired' : 'invited',
      memberId: had?.memberId ?? null, inviteId: i.id, staffId: i.staff_id, familyId: i.family_id, schoolId: i.school_id,
    })
  }
  return [...lines.values()]
}

/** Families the bulk invite would reach: an email on file, not unsubscribed, no login and no invite waiting. */
export function familiesToInvite<F extends { id: string; email: string | null; unsubscribed: boolean }>(families: F[], lines: MemberLine[]): F[] {
  const taken = new Set(lines.filter(l => l.status === 'active' || l.status === 'invited').map(l => l.familyId))
  return families.filter(f => (f.email ?? '').trim() && !f.unsubscribed && !taken.has(f.id))
}

/** How many families have an app message waiting and no accepted parent login. */
export function familiesMessagedNoLogin(
  messaged: string[] | undefined,
  members: { role: string; family_id: string | null; accepted_at: string | null; revoked_at: string | null }[] | undefined,
): number {
  const withLogin = new Set((members ?? []).filter(m => m.role === 'parent' && m.accepted_at && !m.revoked_at).map(m => m.family_id))
  return new Set((messaged ?? []).filter(id => !withLogin.has(id))).size
}

/** Parent activation for a school: families with a child there who have an accepted parent login. */
export function activationPct(
  children: { family_id: string | null; school_id: string | null; programme_id?: string | null }[],
  members: { role: string; family_id: string | null; accepted_at: string | null; revoked_at: string | null }[] | undefined,
  schoolId: string,
  programmes: { id: string; school_id: string | null }[] = [],
): number | null {
  // A child's school is its own, or failing that its programme's.
  const schoolOfProgramme = new Map(programmes.map(p => [p.id, p.school_id]))
  const schoolOf = (c: { school_id: string | null; programme_id?: string | null }) => c.school_id ?? schoolOfProgramme.get(c.programme_id ?? '') ?? null
  const families = new Set(children.filter(c => schoolOf(c) === schoolId && c.family_id).map(c => c.family_id))
  if (!families.size) return null
  const active = new Set((members ?? []).filter(m => m.role === 'parent' && isActive(m)).map(m => m.family_id))
  return Math.round(100 * [...families].filter(f => active.has(f)).length / families.size)
}
