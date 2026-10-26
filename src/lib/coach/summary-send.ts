// Sending one lesson summary to the family (server only). Used by the coach's
// "Send to family" button and by the timer for summaries scheduled for later.

import type { SupabaseClient } from '@supabase/supabase-js'
import { familyAddress, fileInApp, sendFamilyEmail } from './family-mail'
import { shareEmailHtml, shareText, whoLabel, hasShareable, type ShareSession } from './summary-share'

export type SummaryResult = { ok: true; sentTo: string; sentAt: string } | { ok: false; error: string }

export async function sendSummary(db: SupabaseClient, academyId: string, senderId: string, s: ShareSession & { id: string; player_id?: string | null }): Promise<SummaryResult> {
  const fail = async (error: string): Promise<SummaryResult> => {
    await db.from('coach_sessions').update({ share_error: error, share_due_at: null }).eq('id', s.id)
    return { ok: false, error }
  }
  if (!s.player_id) return fail('This summary is not linked to a player.')
  if (!hasShareable(s)) return fail('There was nothing to send in this summary.')
  const [{ data: player }, { data: prof }] = await Promise.all([
    db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('id', s.player_id).eq('coach_id', academyId).maybeSingle(),
    db.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', academyId).maybeSingle(),
  ])
  if (!player) return fail('The player is no longer on the roster.')
  const addr = familyAddress(player)
  if (!addr) return fail(`There is no email address for ${player.name}. Add one to their profile, then send it again.`)
  const academy = (prof?.brand_name as string) || 'Your coach'
  const html = shareEmailHtml(s, { academy, coachName: (prof?.display_name as string) || null, logoUrl: (prof?.brand_logo_url as string) || null, hello: addr.hello })
  const subject = `Lesson summary — ${whoLabel(s)}`
  const ok = await sendFamilyEmail(senderId, { to: addr.to, subject, html, replyTo: (prof?.contact_email as string) || null, context: 'coach/lesson summary' })
  if (!ok) return fail('The email did not send. Please try again.')
  const at = new Date().toISOString()
  await db.from('coach_sessions').update({ shared_at: at, shared_to: addr.to, share_due_at: null, share_error: null }).eq('id', s.id)
  await fileInApp(db, { coachId: academyId, player, subject, body: shareText(s) })
  return { ok: true, sentTo: addr.to, sentAt: at }
}
