// Creating and sending one invite. Used by the invite route and by Resend invite on
// the Members list. IMPACT_INVITES_LIVE decides whether anything is emailed:
//   on     send through Resend
//   dry    local testing only: nothing sent, the link comes back to the caller
//   unset  refused

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { verifiedSender } from './comms-rules'
import { hashInviteToken, inviteEmail, inviteLink, invitesLeft, newInviteToken, type InviteRole } from './invites'

// The www address: a browser treats the bare domain as a different site.
const SITE = 'https://www.lumiosports.com'

export const serviceDb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const dryRun = () => process.env.IMPACT_INVITES_LIVE === 'dry' && process.env.NODE_ENV !== 'production'
export const invitesOn = () => process.env.IMPACT_INVITES_LIVE === 'on' || dryRun()

export interface OrgForInvite { hqId: string; userId: string; slug: string; name: string }
export interface InviteTarget { role: InviteRole; staffId?: string; familyId?: string; email: string }
export type InviteResult = { ok: true; link?: string } | { ok: false; error: string; status: number }

export async function sentThisHour(db: SupabaseClient, hqId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60_000).toISOString()
  const { count } = await db.from('impact_invites').select('id', { count: 'exact', head: true }).eq('hq_id', hqId).gt('created_at', since)
  return count ?? 0
}

export async function sendInvite(db: SupabaseClient, org: OrgForInvite, t: InviteTarget): Promise<InviteResult> {
  if (!invitesOn()) return { ok: false, error: 'Invites aren’t switched on yet.', status: 503 }
  const address = verifiedSender(org.slug, process.env.IMPACT_EMAIL_SENDERS)
  if (!address && !dryRun()) return { ok: false, error: 'No verified sending address for this organisation yet.', status: 503 }
  if (!process.env.RESEND_API_KEY && !dryRun()) return { ok: false, error: 'Email is not set up on this server.', status: 503 }
  if (!invitesLeft(await sentThisHour(db, org.hqId))) return { ok: false, error: 'Hourly invite limit reached. Try again later.', status: 429 }

  const target = t.role === 'parent' ? { family_id: t.familyId } : { staff_id: t.staffId }
  // A new invite replaces any that is still waiting, so only the latest link works.
  await db.from('impact_invites').update({ revoked_at: new Date().toISOString() })
    .eq('hq_id', org.hqId).eq('role', t.role).match(target).is('accepted_at', null).is('revoked_at', null)

  const token = newInviteToken()
  const { data: row, error } = await db.from('impact_invites')
    .insert({ hq_id: org.hqId, role: t.role, ...target, email: t.email.trim(), token_hash: hashInviteToken(token), created_by: org.userId })
    .select('id').single()
  if (error || !row) return { ok: false, error: 'The invite could not be saved.', status: 500 }

  const link = inviteLink(SITE, t.email.trim(), token)
  if (dryRun()) return { ok: true, link }

  const mail = inviteEmail({ org: org.name, role: t.role, link })
  const failed = async (message: string): Promise<InviteResult> => {
    await db.from('impact_invites').update({ revoked_at: new Date().toISOString() }).eq('id', row.id)
    console.error('[impact/invite] send failed →', `@${t.email.split('@')[1]}:`, message)
    return { ok: false, error: 'The invite email could not be sent.', status: 502 }
  }
  try {
    const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({ from: `${org.name.replace(/["<>\\]/g, '')} <${address}>`, to: t.email.trim(), subject: mail.subject, html: mail.html })
    if (sendError) return failed(sendError.message)
    console.log('[impact/invite] sent →', `@${t.email.split('@')[1]}`)
    return { ok: true }
  } catch (e) {
    return failed(e instanceof Error ? e.message : 'unknown')
  }
}
