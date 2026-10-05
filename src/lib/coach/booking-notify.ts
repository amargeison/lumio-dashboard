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
  /** The player this is about. A conversation belongs to a player id — the
      name below is only what the coach's inbox shows. */
  playerId?: string | null
  /** The coach_players.name this is about. */
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
  /** Set when a lesson the family has already been told about is moved or
      called off. The message they already have is rewritten to say so — it is
      never left claiming a session that is no longer happening then. */
  change?: 'moved' | 'place' | 'cancelled'
}

const prettyDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? String(iso)
    // With the year: a booking for next March read "Sunday 28 March", which
    // could as easily be this year's.
    : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
      .select('id, subject, body').eq('coach_id', n.academyId).eq('channels', key).limit(1)
    // A camp or plan message is written once. A lesson's is kept true: see below.
    if (seen?.length && n.kind !== 'lesson') return false
    // Nothing to correct when the family never had the message.
    if (!seen?.length && n.change) return false

    const cancelled = n.change === 'cancelled'
    const subject = cancelled ? 'Session cancelled' : n.change === 'moved' ? 'Session moved' : n.change === 'place' ? 'Session venue changed' : SUBJECTS[n.kind]
    const when = [prettyDate(n.date), n.time ? `at ${n.time}` : ''].filter(Boolean).join(' ')
    const lines: string[] = []
    lines.push(n.title)
    if (when) lines.push(when + (n.durationMin ? ` · ${n.durationMin} min` : ''))
    if (n.location && !cancelled) lines.push(`📍 ${n.location}`)
    if (cancelled) lines.push('', 'This session has been cancelled. Please take it out of your diary.')
    if (n.change === 'moved') lines.push('', 'This session has moved. The day and time above are the new ones.')
    if (n.change === 'place') lines.push('', 'This session is at a different venue or court. The day and time are the same.')
    if (n.detail) lines.push('', n.detail)
    // Written as [label](url), not as a bare address. A Google Calendar link is
    // ~400 characters of encoded title and description; pasted raw into a chat
    // bubble it is an unreadable wall that pushes the message out of its own
    // box. The player app renders these as a short tappable link; anywhere that
    // does not understand the syntax still shows a sane label and the address.
    if (!cancelled && (n.googleUrl || n.icsUrl)) {
      lines.push('', 'Add it to your calendar:')
      if (n.googleUrl) lines.push(`[Google Calendar](${n.googleUrl})`)
      if (n.icsUrl) lines.push(`[Apple / Outlook](${n.icsUrl})`)
    }

    // Whose conversation this goes in. The caller's player id when it has one;
    // otherwise the name, but only when exactly one player in the academy has
    // it. Two children with the same name and no id → no message, rather than
    // one family being told about the other's booking.
    let playerId = n.playerId || null
    if (!playerId) {
      const { data: named } = await db.from('coach_players')
        .select('id, name').eq('coach_id', n.academyId).ilike('name', name.replace(/[\\%_]/g, m => `\\${m}`)).limit(20)
      const hits = (named ?? []).filter(p => String(p.name || '').trim().toLowerCase() === name.toLowerCase())
      if (hits.length !== 1) return false
      playerId = hits[0].id as string
    }

    // The family already has a message about this lesson: bring it up to date
    // rather than add another. The original "Session booked … Wednesday at 09:00"
    // used to stay in the portal after the lesson was moved, cancelled or deleted.
    if (seen?.length) {
      const body = lines.join('\n').trim()
      if (seen[0].subject === subject && seen[0].body === body) return false
      const { error: upErr } = await db.from('coach_messages')
        .update({ subject, body, updated_at: new Date().toISOString() })
        .eq('id', seen[0].id).eq('coach_id', n.academyId)
      if (upErr) { console.error('[notifyBooked] update', upErr.message); return false }
      return true
    }

    const { error } = await db.from('coach_messages').insert({
      coach_id: n.academyId,
      player_id: playerId,
      recipients: name,
      thread_key: name,
      direction: 'out',
      channels: key,
      subject,
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
