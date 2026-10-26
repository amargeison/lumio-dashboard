// A lesson summary as the family sees it — the same words whether the coach
// copies it, opens it in their mail app, or Lumio sends it for them.
//
// The coach's private note never leaves: a summary line that is (or contains)
// the private note is left out, as it always has been on the Lessons page.

export type ShareReview = {
  type?: string; focus?: string; assessment?: string; covered?: string[]; technique?: string[]; takeaways?: string[]
  drills?: string[]; homework?: string; nextFocus?: string; playerNote?: string; coachNote?: string; rating?: number
}
export type ShareSession = {
  player_name: string | null; session_date: string | null; focus: string | null; summary: string | null
  review_json: ShareReview | null
}

const flat = (x?: string | null) => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase()
const fmtDate = (d: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
export const whoLabel = (s: { player_name: string | null; review_json?: ShareReview | null }) =>
  (s.player_name || '').trim() || (s.review_json?.type ? `${s.review_json.type} session` : 'Session')

/** The shareable one-line summary, or '' when the only summary is the private note. */
export function sharedSummary(s: ShareSession): string {
  const sum = (s.summary || '').trim(), priv = flat(s.review_json?.coachNote)
  return sum && !(priv && flat(sum).includes(priv)) ? sum : ''
}

type Block = { title?: string; lines: string[]; bullets?: boolean }

function blocks(s: ShareSession): Block[] {
  const r = s.review_json || {}
  const out: Block[] = []
  const focus = s.focus || r.focus
  if (focus) out.push({ title: 'Focus', lines: [focus] })
  if (r.assessment) out.push({ title: 'Assessment', lines: [r.assessment] })
  if (r.covered?.length) out.push({ title: 'What we covered', lines: r.covered, bullets: true })
  if (r.technique?.length) out.push({ title: 'How we worked on it', lines: r.technique, bullets: true })
  if (r.takeaways?.length) out.push({ title: 'Key takeaways', lines: r.takeaways, bullets: true })
  if (r.drills?.length) out.push({ title: 'Drills', lines: [r.drills.join(', ')] })
  if (r.homework) out.push({ title: 'Homework', lines: [r.homework] })
  if (r.nextFocus) out.push({ title: 'Next session', lines: [r.nextFocus] })
  if (r.playerNote) out.push({ lines: [r.playerNote] })
  const sum = sharedSummary(s)
  if (!r.covered?.length && sum && flat(sum) !== flat(r.playerNote)) out.push({ lines: [sum] })
  return out
}

/** Whether there is anything to send at all. */
export const hasShareable = (s: ShareSession) => blocks(s).length > 0

/** Plain text: for copying, WhatsApp, the mail app and the in-app message. */
export function shareText(s: ShareSession): string {
  const out: string[] = [`Lesson summary — ${whoLabel(s)} (${fmtDate(s.session_date)})`, '']
  for (const b of blocks(s)) {
    if (b.title && !b.bullets && b.lines.length === 1 && ['Focus', 'Drills', 'Homework', 'Next session'].includes(b.title)) out.push(`${b.title}: ${b.lines[0]}`, '')
    else { if (b.title) out.push(`${b.title}:`); out.push(...b.lines.map(l => (b.bullets ? `• ${l}` : l)), '') }
  }
  return out.join('\n').trim()
}

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The email Lumio sends for the coach. */
export function shareEmailHtml(s: ShareSession, o: { academy: string; coachName?: string | null; logoUrl?: string | null; hello: string }): string {
  const body = blocks(s).map(b => `
      ${b.title ? `<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;font-weight:700;margin:16px 0 4px">${esc(b.title)}</div>` : '<div style="height:12px"></div>'}
      ${b.bullets
        ? `<ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;line-height:1.55">${b.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
        : b.lines.map(l => `<p style="margin:0;color:#374151;font-size:15px;line-height:1.55">${esc(l)}</p>`).join('')}`).join('')
  return `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 6px">${esc(o.hello)}</p>
      <p style="font-size:15px;color:#374151;margin:0 0 4px;line-height:1.55">Here is the summary from ${esc(whoLabel(s))}’s lesson on ${esc(fmtDate(s.session_date))}.</p>
      ${body}
      <p style="font-size:14px;color:#6b7280;margin:20px 0 0;line-height:1.55">${o.coachName ? esc(o.coachName) : esc(o.academy)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:16px 0 0">${esc(o.academy)} · sent through Lumio · reply to this email to reach your coach</p>
  </div></body></html>`
}
