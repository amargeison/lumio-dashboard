// Server-only helpers for the camp player-information form.
import type { SupabaseClient } from '@supabase/supabase-js'
import { formEnabled, formUrl } from '@/lib/coach/camp-form'

/**
 * The link to one attendee's form, or null when there is nothing to send:
 * the camp has its form switched off, they have already filled it in, or the
 * database has not had migration 192 yet.
 *
 * Deliberately its own small query and deliberately unable to throw. It is
 * called from the sign-up route and the payment webhook, and a missing form
 * link must never be the reason a family's place is not confirmed.
 */
export async function formLinkFor(db: SupabaseClient, attendeeId: string, origin: string): Promise<string | null> {
  try {
    const { data: a, error } = await db.from('coach_camp_attendees')
      .select('camp_id, form_token, form_submitted_at').eq('id', attendeeId).maybeSingle()
    if (error || !a?.form_token || a.form_submitted_at) return null
    const { data: camp, error: campErr } = await db.from('coach_camps')
      .select('info_form, overseas, audience').eq('id', a.camp_id).maybeSingle()
    if (campErr || !camp || !formEnabled(camp)) return null
    return formUrl(origin, a.form_token as string)
  } catch { return null }
}
