// Free-slot pings: the words and the rules (pure — no database, no browser).
//
// "Pete has a free slot on Thursday at 2pm. Would you like it?" goes to the
// clients who asked to hear about free slots. Each gets their own link; the
// first to say yes gets the lesson.

import { niceTime } from './reminders'
import { ukLocalToMs } from './cancel-policy'

/** Offers close two hours before the slot, so nobody books a lesson they cannot reach. */
export const CLOSE_BEFORE_MS = 2 * 3_600_000

export const offerClosesAt = (date: string, time: string) => ukLocalToMs(date, time) - CLOSE_BEFORE_MS

/** "Thursday 30 October at 2pm" */
export function slotWords(date: string, time: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  const day = Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return `${day} at ${niceTime(time)}`
}

/** Do two sessions on the same day overlap? Times "HH:MM", lengths in minutes. */
export function overlaps(aTime: string, aMin: number, bTime: string, bMin: number): boolean {
  const m = (t: string) => { const [h, mi] = String(t || '').split(':').map(Number); return (h || 0) * 60 + (mi || 0) }
  const a0 = m(aTime), b0 = m(bTime)
  return a0 < b0 + bMin && b0 < a0 + aMin
}

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function offerMessage(o: {
  hello: string; childFirst: string | null; coachName: string | null; academy: string; logoUrl?: string | null
  date: string; time: string; durMin: number; type: string; venue: string | null; note: string | null; url: string
}): { subject: string; text: string; html: string } {
  const who = o.coachName || o.academy
  const when = slotWords(o.date, o.time)
  const lesson = /^private$/i.test(o.type) ? 'lesson' : `${o.type.toLowerCase()} session`
  const forWhom = o.childFirst ? ` for ${o.childFirst}` : ''
  const line = `${who} has a free slot on ${when}${o.venue ? ` at ${o.venue}` : ''}: a ${o.durMin}-minute ${lesson}${forWhom}. Would you like it?`
  const after = 'The first person to say yes gets it.'
  const subject = `Free slot: ${when}`
  const text = `${o.hello}\n\n${line}${o.note ? `\n\n${o.note}` : ''}\n\n${after}\n${o.url}\n\n${who}`
  const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(o.hello)}</p>
      <p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(line)}</p>
      ${o.note ? `<p style="font-size:15px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(o.note)}</p>` : ''}
      <p style="font-size:14px;color:#6b7280;margin:0 0 18px">${esc(after)}</p>
      <p style="text-align:center;margin:0 0 6px"><a href="${esc(o.url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 26px;border-radius:12px">Yes, I’d like it →</a></p>
      <p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(who)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0;line-height:1.5">${esc(o.academy)} · sent through Lumio because you asked to hear about free slots.<br>To stop these emails, open the link and choose “Stop free-slot emails”.</p>
  </div></body></html>`
  return { subject, text, html }
}
