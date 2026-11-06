// Whether an address may be sent a sign-in code as an Impact member: it has a current
// membership, or it holds a valid invite for that exact address. Server only.

import { createClient } from '@supabase/supabase-js'
import { findAuthUserByEmail } from '@/app/api/sports-auth/_lib/account'
import { hashInviteToken } from './invites'

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

/** The slug of the org this address belongs to as a member, or null. */
export async function impactMemberSlug(email: string): Promise<string | null> {
  try {
    const db = admin()
    const user = await findAuthUserByEmail(db, email.trim().toLowerCase())
    if (!user) return null
    const { data: rows } = await db.from('impact_members').select('hq_id').eq('user_id', user.id).not('accepted_at', 'is', null).is('revoked_at', null).order('accepted_at').limit(1)
    if (!rows?.length) return null
    const { data: org } = await db.from('impact_orgs').select('slug').eq('hq_id', rows[0].hq_id).maybeSingle()
    return (org?.slug as string | undefined) ?? null
  } catch { return null }
}

export async function impactInviteValid(email: string, token: unknown): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false
  try {
    const { data } = await admin().from('impact_invites').select('email, expires_at, accepted_at, revoked_at').eq('token_hash', hashInviteToken(token)).maybeSingle()
    return !!data && !data.accepted_at && !data.revoked_at && new Date(data.expires_at) > new Date()
      && String(data.email).trim().toLowerCase() === email.trim().toLowerCase()
  } catch { return false }
}

export const impactMayGetCode = async (email: string, token: unknown) =>
  await impactInviteValid(email, token) || !!(await impactMemberSlug(email))
