// Booking confirmation emails for the Tennis Coach portal.
//
// Sent when a booking is created. Three rules drive the whole module:
//
//  1. SAFEGUARDING — an under-16's confirmation goes to their PARENT, never
//     directly to the child. Age comes from coach_players.age; if we do not know
//     the age we treat the player as a minor, because the safe default when you
//     are unsure whether you are emailing a child is to email the adult.
//  2. THE COACH ALWAYS GETS A COPY, so a booking made by anyone never goes unseen.
//  3. IT IS SENT AS THE COACH, not as Lumio — from their own address via their
//     connected mailbox (iCloud SMTP / Gmail / Outlook). A parent should recognise
//     the sender. Lumio's own transport is only a fallback.
//
// Content is deliberately more than a receipt: where and when with a map link,
// what was covered last time (including the homework that was set), and what this
// session will work on. That turns a confirmation into something a parent reads.

import { serviceClient } from './oauth'

export type BookingRow = {
  id: string; coach_id: string
  title?: string | null; player_name?: string | null; court?: string | null
  booking_date?: string | null; start_time?: string | null; duration_min?: number | null
  status?: string | null; notes?: string | null; type?: string | null
}

type PlayerRow = {
  id: string; name: string; age?: number | null
  email?: string | null; contact_email?: string | null; parent_email?: string | null
  parent_name?: string | null
}

type Review = { focus?: string; covered?: string[]; takeaways?: string[]; homework?: string; nextFocus?: string; recap?: string; assessment?: string }
type SessionRow = { session_date?: string | null; focus?: string | null; summary?: string | null; ai_review?: string | null; review_json?: Review | null }

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Under-16 → parent. Unknown age → treat as a minor (safe default).
export const MINOR_AGE = 16
export function isMinor(age?: number | null): boolean {
  return age == null || age < MINOR_AGE
}

export type Recipients = { to: string | null; toParent: boolean; reason: string }

// Who the confirmation goes to. Returns the reason too, so the coach-facing copy
// and the logs can say WHY it went where it went rather than being a black box.
export function resolveRecipient(p: PlayerRow | null): Recipients {
  if (!p) return { to: null, toParent: false, reason: 'no player record matched this booking' }
  const parent = (p.parent_email || '').trim() || null
  const player = ((p.email || p.contact_email) || '').trim() || null

  if (isMinor(p.age)) {
    if (parent) return { to: parent, toParent: true, reason: p.age == null ? 'age unknown — sent to parent as the safe default' : `under ${MINOR_AGE} — sent to parent` }
    // No parent address on file. We do NOT silently email the child instead.
    return { to: null, toParent: true, reason: `under ${MINOR_AGE} (or age unknown) and no parent email on file — nothing sent` }
  }
  if (player) return { to: player, toParent: false, reason: `${MINOR_AGE} or over — sent to the player` }
  return { to: null, toParent: false, reason: 'no email address on file for this player' }
}

// ── Formatting helpers ──────────────────────────────────────────────────────
const TZ = 'Europe/London'
function whenLine(date?: string | null, start?: string | null, mins?: number | null): { day: string; time: string } {
  if (!date) return { day: 'Date to be confirmed', time: '' }
  const d = new Date(`${date}T${(start || '00:00')}:00`)
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })
  if (!start) return { day, time: '' }
  const [h, m] = start.split(':').map(Number)
  const endTotal = h * 60 + m + (mins || 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { day, time: `${pad(h)}:${pad(m)} – ${pad(Math.floor(endTotal / 60) % 24)}:${pad(endTotal % 60)}` }
}
const mapsLink = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// ── The email ───────────────────────────────────────────────────────────────
export function buildConfirmationHtml(o: {
  academy: string; coachName: string; logoUrl?: string | null; accent?: string
  playerName: string; greetingName: string; toParent: boolean
  booking: BookingRow
  venue?: { name?: string | null; address?: string | null; access_note?: string | null } | null
  last?: SessionRow | null
  forCoach?: boolean
}): string {
  const accent = o.accent || '#3A8EE0'
  const { day, time } = whenLine(o.booking.booking_date, o.booking.start_time, o.booking.duration_min)
  const place = [o.venue?.name, o.booking.court].filter(Boolean).join(' · ') || o.booking.court || null
  const address = o.venue?.address || null
  const r = o.last?.review_json || null

  const covered = r?.covered?.length ? r.covered : null
  const homework = r?.homework || null
  const lastFocus = r?.focus || o.last?.focus || null
  const lastRecap = r?.recap || r?.assessment || (o.last?.ai_review ? String(o.last.ai_review).split('\n\n')[0] : null) || o.last?.summary || null
  const next = r?.nextFocus || o.booking.notes || null

  const section = (title: string, body: string) => `
    <tr><td style="padding:18px 26px 0">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${accent};font-weight:700;padding-bottom:6px;border-bottom:2px solid #eceef3">${esc(title)}</div>
      <div style="font-size:14px;line-height:1.65;color:#374151;padding-top:10px">${body}</div>
    </td></tr>`

  const lastBlock = (lastRecap || covered || homework) ? section(
    o.forCoach ? 'Last session with this player' : 'What we covered last time',
    [
      lastFocus ? `<div style="font-weight:600;color:#1a1d29;margin-bottom:6px">${esc(lastFocus)}</div>` : '',
      lastRecap ? `<p style="margin:0 0 10px">${esc(lastRecap)}</p>` : '',
      covered ? `<ul style="margin:0 0 10px;padding-left:18px">${covered.map(c => `<li style="margin-bottom:4px">${esc(c)}</li>`).join('')}</ul>` : '',
      homework ? `<div style="background:#fff8e6;border-left:4px solid #e0a52a;border-radius:0 8px 8px 0;padding:11px 14px;margin-top:4px">
          <div style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#a97a10;font-weight:700;margin-bottom:4px">Homework set</div>
          <div style="color:#5c4708">${esc(homework)}</div></div>` : '',
    ].join('')) : ''

  const nextBlock = next ? section(o.forCoach ? 'Planned focus' : "What we'll work on this session", `<p style="margin:0">${esc(next)}</p>`) : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f5;padding:22px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">

        <tr><td style="background:linear-gradient(120deg, ${accent}, ${accent}bb);padding:24px 26px">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle">
              <div style="font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.85)">${o.forCoach ? 'New booking' : 'Booking confirmed'}</div>
              <div style="font-size:23px;font-weight:800;color:#fff;margin-top:5px;line-height:1.2">${o.forCoach ? esc(o.playerName) : `Thanks, ${esc(o.greetingName)}!`}</div>
              <div style="font-size:13px;color:rgba(255,255,255,.92);margin-top:4px">${esc(o.academy)}</div>
            </td>
            ${o.logoUrl ? `<td width="70" style="vertical-align:middle;text-align:right"><img src="${esc(o.logoUrl)}" alt="" width="58" style="max-width:58px;background:#fff;border-radius:9px;padding:6px"></td>` : ''}
          </tr></table>
        </td></tr>

        ${o.forCoach ? '' : `<tr><td style="padding:20px 26px 0">
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#374151">${o.toParent
            ? `${esc(o.playerName)}'s next session is booked in. Everything you need is below — including what we worked on last time.`
            : `Your next session is booked in. Everything you need is below — including what we worked on last time.`}</p>
        </td></tr>`}

        <tr><td style="padding:18px 26px 0">
          <table role="presentation" width="100%" style="background:#f6f8fb;border:1px solid #e5e9f0;border-radius:11px">
            <tr><td style="padding:15px 17px">
              <div style="font-size:17px;font-weight:700;color:#1a1d29">${esc(day)}</div>
              ${time ? `<div style="font-size:15px;color:${accent};font-weight:600;margin-top:3px">${esc(time)}</div>` : ''}
              ${place ? `<div style="font-size:13.5px;color:#4b5563;margin-top:9px">${esc(place)}</div>` : ''}
              ${address ? `<div style="font-size:12.5px;color:#6b7280;margin-top:2px">${esc(address)}</div>
                <div style="margin-top:10px"><a href="${mapsLink(address)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:8px">📍 Open in Maps</a></div>` : ''}
              ${o.venue?.access_note ? `<div style="font-size:12px;color:#6b7280;margin-top:10px;font-style:italic">${esc(o.venue.access_note)}</div>` : ''}
            </td></tr>
          </table>
        </td></tr>

        ${lastBlock}
        ${nextBlock}

        <tr><td style="padding:22px 26px 26px">
          <div style="border-top:1px solid #eceef3;padding-top:14px;font-size:12.5px;color:#6b7280;line-height:1.6">
            ${o.forCoach
              ? `Sent to you so a new booking never goes unseen.`
              : `Need to change or cancel? Just reply to this email and it comes straight to ${esc(o.coachName)}.`}
            <div style="margin-top:8px;color:#9aa1b1">${esc(o.academy)}${o.coachName ? ` · ${esc(o.coachName)}` : ''}</div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ── Data gathering ──────────────────────────────────────────────────────────
// Service-role reads: this runs from a server route on behalf of the coach who
// owns the booking, and every query is explicitly scoped to that coach_id.
export async function gatherBookingContext(coachId: string, booking: BookingRow) {
  const db = serviceClient()
  const name = (booking.player_name || '').trim()

  const [{ data: players }, { data: venues }, { data: profile }] = await Promise.all([
    name
      ? db.from('coach_players').select('id,name,age,email,contact_email,parent_email,parent_name').eq('coach_id', coachId).ilike('name', name)
      : Promise.resolve({ data: [] as PlayerRow[] }),
    db.from('coach_venues').select('name,address,access_note,is_home').eq('coach_id', coachId),
    db.from('sports_profiles').select('brand_name,display_name,brand_logo_url,contact_email').eq('id', coachId).maybeSingle(),
  ]) as any

  const player: PlayerRow | null = (players ?? [])[0] ?? null

  // Most recent completed session for this player — the source of "what we
  // covered last time" and the homework that was set.
  let last: SessionRow | null = null
  if (name) {
    const { data } = await db.from('coach_sessions')
      .select('session_date,focus,summary,ai_review,review_json')
      .eq('coach_id', coachId).ilike('player_name', name)
      .order('session_date', { ascending: false }).limit(1)
    last = (data ?? [])[0] ?? null
  }

  // Venue: match the booking's court to a venue where we can, else the home venue.
  const vs = (venues ?? []) as any[]
  const court = (booking.court || '').toLowerCase()
  const venue = vs.find(v => court && (v.name || '').toLowerCase() && court.includes((v.name || '').toLowerCase()))
    || vs.find(v => v.is_home) || vs[0] || null

  return { player, last, venue, profile: profile ?? null }
}
