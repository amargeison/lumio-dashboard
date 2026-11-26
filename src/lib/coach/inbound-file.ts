// Files one inbound email reply for Lumio Coach, however it arrived (the Cloudflare Email
// Worker via /api/inbound/email, or a Resend inbound webhook via /api/coach/inbound-email).
// The logic is what /api/coach/inbound-email always did, moved here unchanged apart from
// taking a parsed message: the signed reply+<token>.<sig>@ address names the coach and the
// conversation; the token must verify, so nobody can write into another coach's inbox.
//
// Text only: attachments are listed as "not shown". A sender whose SPF/DKIM didn't pass is
// filed, with "(sender not verified)" after their name.

import type { SupabaseClient } from '@supabase/supabase-js'
import { parseInboundToken } from './inbound'
import { nudgeCoach } from '@/lib/app/push'
import { withAttachmentNotes, type InboundMessage } from '@/lib/inbound/message'

// Strip the most common quoted-reply tail so we store just the new text.
const clean = (t: string): string => String(t || '').split(/\n\s*On .+wrote:|\n-----Original|\n________/)[0].trim()

export type CoachFiled = { status: 'filed' } | { status: 'dedup' } | { status: 'ignored'; why: string } | { status: 'error'; error: string }

export async function fileCoachReply(admin: SupabaseClient, m: InboundMessage): Promise<CoachFiled> {
  const tokenAddr = m.recipients.find(a => /reply\+/i.test(a) && parseInboundToken(a))
  const parsed = tokenAddr ? parseInboundToken(tokenAddr) : null
  if (!parsed) return { status: 'ignored', why: 'no valid Coach token' }

  const body = withAttachmentNotes(clean(m.text), m.attachments)
  if (!body) return { status: 'ignored', why: 'empty' }
  const fromName = (m.fromName || m.from || 'Unknown sender') + (m.verified === false ? ' (sender not verified)' : '')
  const externalId = m.messageId

  if (externalId) {
    const { data: dupe } = await admin.from('coach_messages').select('id').eq('coach_id', parsed.coachId).eq('external_id', externalId).maybeSingle()
    if (dupe) return { status: 'dedup' }
  }
  // ── Which conversation ──────────────────────────────────────────────────────
  // The token says who the coach's email was to. Since messages moved to player
  // ids it carries `player:<id>`; an email sent before that carries the name.
  //
  // A name is only trusted when exactly one player in the academy has it. Two
  // players called "Sam Twin" → the reply is kept for the coach but linked to
  // neither child, so it cannot appear in the wrong family's app.
  const key = parsed.recipientName || ''
  let playerId: string | null = null
  let conv = m.fromName || m.from || 'Unknown sender'
  let threadKey = `contact:${(m.from || conv).toLowerCase()}`
  if (key.startsWith('player:')) {
    const { data: p } = await admin.from('coach_players').select('id, name').eq('id', key.slice(7)).eq('coach_id', parsed.coachId).maybeSingle()
    if (p) { playerId = p.id as string; conv = (p.name || '').trim() || conv; threadKey = conv }
  } else if (/^(contact|staff|attendee):/.test(key)) {
    // Somebody who is not a player. Their conversation keeps the name the coach wrote to them under.
    const { data: prior } = await admin.from('coach_messages').select('recipients').eq('coach_id', parsed.coachId).eq('thread_key', key).order('created_at', { ascending: false }).limit(1)
    conv = (prior?.[0]?.recipients as string | undefined) || conv
    threadKey = key
  } else if (key) {
    const { data: named } = await admin.from('coach_players').select('id, name').eq('coach_id', parsed.coachId).ilike('name', key.replace(/[\\%_]/g, x => `\\${x}`)).limit(20)
    const hits = (named ?? []).filter(p => String(p.name || '').trim().toLowerCase() === key.trim().toLowerCase())
    conv = key
    if (hits.length === 1) { playerId = hits[0].id as string; threadKey = key }
    // Shared by two players: kept under the name, linked to nobody.
    else if (hits.length > 1) threadKey = key
    // Nobody on the roster has it — a contact. Keyed so that it can never be
    // mistaken for a player who joins later with the same name.
    else threadKey = `contact:${key.trim().toLowerCase()}`
  }

  const { error } = await admin.from('coach_messages').insert({
    coach_id: parsed.coachId, player_id: playerId, direction: 'in', from_name: fromName, recipients: conv, thread_key: threadKey,
    subject: m.subject, body, channels: 'email', status: 'received', external_id: externalId, read: false, created_at: new Date().toISOString(),
  })
  if (error) return { status: 'error', error: error.message }
  await nudgeCoach(admin, parsed.coachId, { title: `Email from ${conv}`, body: m.subject ? `${m.subject}: ${body}` : body })
  console.log('[coach/inbound] reply filed', JSON.stringify({ coach: parsed.coachId, verified: m.verified }))
  return { status: 'filed' }
}
