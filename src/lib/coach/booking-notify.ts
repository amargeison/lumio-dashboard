// The in-app half of "you're booked in".
//
// The confirmation email already goes out. What was missing is the same thing
// inside the portal: a family opens their page, sees their next session is not
// mentioned anywhere, and has to trust an email they may have archived. A
// message row costs nothing and means the portal always knows what the inbox
// knows.
//
// One function, used by lessons, camps and session plans, so the three cannot
// drift into three different wordings of the same sentence.

import type { SupabaseClient } from '@supabase/supabase-js'

export type BookedKind = 'lesson' | 'camp' | 'plan'

export type BookedNotice = {
  academyId: string
  /** The coach_players.name this is about — how coach_messages is addressed. */
  playerName: string
  kind: BookedKind
  title: string
  /** 'YYYY-MM-DD' */
  date?: string | null
  /** 'HH:MM' */
  time?: string | null
  durationMin?: number | null
  location?: string | null
  /** Anything worth saying beyond when and where. */
  detail?: string | null
  /** Add-to-calendar links, already built. */
  googleUrl?: string | null
  icsUrl?: string | null
  /** Stable per-thing, so re-sending a confirmation does not stack up messages. */
  dedupeKey: string
}

const prettyDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const SUBJECTS: Record<BookedKind, string> = {
  lesson: 'Session booked',
  camp: 'Camp place confirmed',
  plan: 'Your next session',
}

/**
 * Write the in-app confirmation. Never throws — a booking that saved must not
 * fail because a courtesy message did not.
 */
export async function notifyBooked(db: SupabaseClient, n: BookedNotice): Promise<boolean> {
  try {
    const name = (n.playerName || '').trim()
    if (!name) return false

    // Idempotent: the same booking confirmed twice is one message. The key goes
    // in `channels` because it is the only free text column nothing else reads.
    const key = `inapp:${n.kind}:${n.dedupeKey}`
    const { data: seen } = await db.from('coach_messages')
      .select('id').eq('coach_id', n.academyId).eq('channels', key).limit(1)
    if (seen?.length) return false

    const when = [prettyDate(n.date), n.time ? `at ${n.time}` : ''].filter(Boolean).join(' ')
    const lines: string[] = []
    lines.push(n.title)
    if (when) lines.push(when + (n.durationMin ? ` · ${n.durationMin} min` : ''))
    if (n.location) lines.push(`📍 ${n.location}`)
    if (n.detail) lines.push('', n.detail)
    if (n.googleUrl || n.icsUrl) {
      lines.push('', 'Add it to your calendar:')
      if (n.googleUrl) lines.push(`Google — ${n.googleUrl}`)
      if (n.icsUrl) lines.push(`Apple / Outlook — ${n.icsUrl}`)
    }

    const { error } = await db.from('coach_messages').insert({
      coach_id: n.academyId,
      recipients: name,
      channels: key,
      subject: SUBJECTS[n.kind],
      body: lines.join('\n').trim(),
      status: 'sent',
    })
    if (error) { console.error('[notifyBooked]', error.message); return false }
    return true
  } catch (e) {
    console.error('[notifyBooked]', e)
    return false
  }
}
