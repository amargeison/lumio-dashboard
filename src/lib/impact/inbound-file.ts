// Files one inbound email reply in Lumio Impact, however it arrived (the Cloudflare Email
// Worker or a Resend inbound webhook). Service role; every write pinned to the org found
// from the reply+<slug>@ address.
//
// The family is found by the sender's email only (an exact match, else ignoring a "+tag"
// when that leaves exactly one family); anyone else is an unknown sender ("Not a family here"). Text only: attachments are listed as "not shown". A sender whose
// SPF/DKIM didn't pass is filed but marked "Sender not verified" (impact_messages.detail).

import type { SupabaseClient } from '@supabase/supabase-js'
import { familyForSender, replyText, senderPatterns, slugFromRecipients, threadKeyFor } from './inbound'
import { NOT_VERIFIED, withAttachmentNotes, type InboundMessage } from '@/lib/inbound/message'

export type ImpactFiled = { status: 'filed'; known: boolean } | { status: 'dedup' } | { status: 'ignored'; why: string } | { status: 'error'; error: string }

export async function fileImpactReply(db: SupabaseClient, m: InboundMessage): Promise<ImpactFiled> {
  const slug = slugFromRecipients(m.recipients)
  if (!slug) return { status: 'ignored', why: 'not an Impact reply address' }
  const { data: org } = await db.from('impact_orgs').select('hq_id').eq('slug', slug).maybeSingle()
  if (!org) return { status: 'ignored', why: 'no such org' }
  const hqId = org.hq_id as string

  const body = withAttachmentNotes(replyText(m.text), m.attachments) || '(no text)'
  // Every family whose email is the sender's, with or without a "+tag"; familyForSender picks.
  const families: { id: string; email: string | null }[] = []
  for (const pattern of m.from ? senderPatterns(m.from) : []) {
    const { data } = await db.from('tp_families').select('id, email').eq('hq_id', hqId).ilike('email', pattern).limit(20)
    for (const f of (data ?? []) as { id: string; email: string | null }[]) if (!families.some(x => x.id === f.id)) families.push(f)
  }
  const family = familyForSender(m.from, families)
  const threadKey = threadKeyFor(family?.id ?? null, m.from)
  const { error } = await db.from('impact_messages').insert({
    hq_id: hqId, thread_key: threadKey, family_id: family?.id ?? null, channel: 'email', direction: 'in',
    subject: m.subject, body, status: 'received', external_id: m.messageId, from_address: m.from,
    detail: m.verified === false ? NOT_VERIFIED : null,
  })
  if (error) return error.code === '23505' ? { status: 'dedup' } : { status: 'error', error: error.message }
  if (family) {
    await db.from('impact_threads').upsert({ hq_id: hqId, thread_key: threadKey, family_id: family.id, closed_at: null, updated_at: new Date().toISOString() }, { onConflict: 'hq_id,thread_key' })
  }
  console.log('[impact/inbound] reply filed', JSON.stringify({ hq: hqId, known: !!family, verified: m.verified }))
  return { status: 'filed', known: !!family }
}
