// Sending a message to a player's family for the coach (server only).
//
// Email goes from the coach's own connected mailbox when there is one (Google,
// Microsoft, iCloud), so it lands as a message from the coach. Otherwise it
// goes from Lumio's address with replies to the coach. The same words are
// filed in the player's conversation in the app, where the family can see them.

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAsCoach } from './mail'
import { sendEmail } from '@/lib/emails/send'
import { createClient } from '@supabase/supabase-js'
import { apnsConfigured } from '@/lib/app/apns'
import { pushToEmail, academyTitle } from '@/lib/app/push'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export type FamilyPlayer = { id: string; name: string; email?: string | null; parent_email?: string | null; parent_name?: string | null; contact_email?: string | null }

/** Who an email about this player goes to, and what to call them. */
export function familyAddress(p: FamilyPlayer): { to: string; hello: string; toParent: boolean } | null {
  const parent = String(p.parent_email || '').trim()
  const own = String(p.email || p.contact_email || '').trim()
  const to = parent || own
  if (!EMAIL_RE.test(to)) return null
  const toParent = !!parent && to === parent
  const first = (s?: string | null) => String(s || '').trim().split(/\s+/)[0]
  const hello = toParent ? (p.parent_name ? `Hi ${first(p.parent_name)},` : 'Hi,') : `Hi ${first(p.name) || 'there'},`
  return { to: to.toLowerCase(), hello, toParent }
}

/**
 * Send one email as the coach. True when it went.
 *
 * If the family has the iPhone app, they also get a notification saying the
 * same thing (the subject line), which opens `push.url` — or their own page.
 * `push: false` for an email that answers something they just did themselves.
 */
export async function sendFamilyEmail(senderId: string, o: { to: string; subject: string; html: string; replyTo?: string | null; context: string; push?: { body?: string; url?: string } | false }): Promise<boolean> {
  const sent = await sendAsCoach(senderId, { to: o.to, subject: o.subject, html: o.html }).catch(() => ({ ok: false }))
  let ok = sent.ok
  if (!ok) {
    const fb = await sendEmail({ from: 'Lumio Tennis <noreply@lumiosports.com>', to: [o.to], subject: o.subject, html: o.html, replyTo: o.replyTo || undefined, context: o.context }).catch(() => null)
    ok = !!fb && !fb.error
  }
  if (ok && o.push !== false) await nudgeFamily(senderId, o.to, { body: o.push?.body || o.subject, url: o.push?.url || '/portal' })
  return ok
}

async function nudgeFamily(academyId: string, to: string, m: { body: string; url: string }) {
  try {
    if (!apnsConfigured()) return
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    await pushToEmail(db, to, { title: await academyTitle(db, academyId), body: m.body, url: m.url, thread: academyId })
  } catch { /* the email is what matters */ }
}

/** File the same words in the player's conversation, so the family sees them in the app. Never throws. */
export async function fileInApp(db: SupabaseClient, o: { coachId: string; player: FamilyPlayer; subject: string; body: string }) {
  try {
    await db.from('coach_messages').insert({
      coach_id: o.coachId, player_id: o.player.id, recipients: o.player.name, thread_key: o.player.name,
      direction: 'out', subject: o.subject, body: o.body, status: 'sent',
    })
  } catch { /* the email is what matters */ }
}
