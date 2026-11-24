// What the signed-in person gets at /impact/<slug>. Takes a Supabase client, so the
// security script runs the same decision with real sessions. Anything short of the org's
// HQ, an admin or an accepted member is 'private', which shows the sign-in card only. An
// address with no org behind it answers exactly the same.

import type { SupabaseClient } from '@supabase/supabase-js'
import { portalAccess, type MemberRow, type MemberRole } from './members'
import type { ImpactOrgSettings } from './org'

interface Org { hqId: string; settings: ImpactOrgSettings }
interface Who { id: string; email: string }
export type ResolvedAccess =
  | { kind: 'private'; email: string | null }
  | { kind: 'hq'; user: Who; org: Org; admin: boolean }
  | { kind: 'member'; user: Who; org: Org; member: MemberRow; otherRole: MemberRole | null }

export async function resolvePortal(db: SupabaseClient, slug: string, wanted?: string | null): Promise<ResolvedAccess> {
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { kind: 'private', email: null }
  const email = user.email ?? ''
  const who = { id: user.id, email }
  const org = await db.from('impact_orgs').select('settings, hq_id').eq('slug', slug).maybeSingle()
  if (org.error) throw new Error('Your access couldn’t be checked. Please refresh the page.')
  const hqId = (org.data?.hq_id as string | null | undefined) ?? null
  if (!hqId) return { kind: 'private', email }
  const found = { hqId, settings: (org.data?.settings as ImpactOrgSettings | null) ?? {} }
  if (hqId === user.id) return { kind: 'hq', user: who, org: found, admin: false }
  const mine = await db.from('impact_members').select('*').eq('user_id', user.id)
  if (mine.error) throw new Error('Your access couldn’t be checked. Please refresh the page.')
  const access = portalAccess((mine.data ?? []) as MemberRow[], hqId, wanted)
  if (access.kind === 'private') return { kind: 'private', email }
  if (access.member.role === 'admin') return { kind: 'hq', user: who, org: found, admin: true }
  return { kind: 'member', user: who, org: found, member: access.member, otherRole: access.otherRole }
}
