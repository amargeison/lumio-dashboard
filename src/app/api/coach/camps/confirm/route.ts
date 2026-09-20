import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { calendarButtonsHtml, googleCalendarUrl, icsUrl, type CalendarEvent } from '@/lib/coach/calendar-links'
import { notifyBooked } from '@/lib/coach/booking-notify'

export const runtime = 'nodejs'

// A camp place is confirmed — tell the family the same three ways a lesson does:
// in the portal, by email, and with a calendar entry they can actually add.
//
// Called fire-and-forget when a coach adds somebody to a camp. The public
// sign-up form has its own confirmation (it has to, there is no coach in the
// loop), so this is for the places a coach books on a family's behalf.
//
// Same rule as booking confirmations on who is written to: an under-16's
// confirmation goes to the parent, never to the child.

const esc = (s: string) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const prettyDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { attendeeId } = (await req.json().catch(() => ({}))) as { attendeeId?: string }
  if (!attendeeId) return NextResponse.json({ error: 'attendeeId is required' }, { status: 400 })

  try {
    const db = serviceClient()
    const { data: a } = await db.from('coach_camp_attendees')
      .select('id, camp_id, player_id, player_name, parent_email, parent_name, status')
      .eq('id', attendeeId).eq('coach_id', coachId).maybeSingle()
    if (!a) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    if ((a.status || '') === 'cancelled') return NextResponse.json({ sent: false, reason: 'cancelled' })

    const [{ data: camp }, { data: profile }, { data: player }] = await Promise.all([
      db.from('coach_camps').select('id, name, start_date, end_date, location, region, board, price')
        .eq('id', a.camp_id).eq('coach_id', coachId).maybeSingle(),
      db.from('sports_profiles').select('brand_name, display_name, contact_email, brand_logo_url').eq('id', coachId).maybeSingle(),
      a.player_id
        ? db.from('coach_players').select('name, age, email, contact_email, parent_email, parent_name, category').eq('id', a.player_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const academy = profile?.brand_name || 'Your academy'
    const coachName = profile?.display_name || ''
    const playerName = (player?.name || a.player_name || '').trim()
    const where = [camp.location, camp.region].filter(Boolean).join(', ')
    const origin = new URL(req.url).origin

    const event: CalendarEvent = {
      title: `${camp.name} · ${academy}`,
      date: String(camp.start_date || ''),
      time: null,
      location: where || undefined,
      description: `${playerName ? `${playerName}'s place` : 'Your place'} is booked with ${academy}.`,
      uid: `camp-${camp.id}`,
    }
    const hasDate = !!camp.start_date

    // ── In the portal ────────────────────────────────────────────────────
    const dates = [prettyDate(camp.start_date), camp.end_date && camp.end_date !== camp.start_date ? `to ${prettyDate(camp.end_date)}` : '']
      .filter(Boolean).join(' ')
    const inApp = await notifyBooked(db, {
      academyId: coachId,
      playerName,
      kind: 'camp',
      title: camp.name,
      date: camp.start_date,
      location: where || null,
      detail: [dates ? `Runs ${dates}.` : '', camp.board ? `${camp.board}.` : '', 'Everything you need — what to bring and how the days run — is on your page.']
        .filter(Boolean).join(' '),
      googleUrl: hasDate ? googleCalendarUrl(event) : null,
      icsUrl: hasDate ? icsUrl(origin, 'camp', camp.id) : null,
      dedupeKey: a.id,
    })

    // ── By email ─────────────────────────────────────────────────────────
    // Under-16s: the parent. This mirrors resolveRecipient in the booking path.
    const age = Number(player?.age) || 0
    const isAdult = (player?.category || '').toLowerCase() === 'adult' || age >= 18
    const parentTo = (a.parent_email || player?.parent_email || '').trim()
    const playerTo = (player?.email || player?.contact_email || '').trim()
    const to = isAdult ? (playerTo || parentTo) : (parentTo || (age === 0 ? playerTo : ''))
    const greeting = isAdult ? (playerName.split(' ')[0] || 'there') : (a.parent_name || player?.parent_name || 'there')

    let sentTo: string | null = null
    if (to) {
      const accent = '#3A8EE0'
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f5;padding:22px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
      <tr><td style="background:linear-gradient(120deg, ${accent}, ${accent}bb);padding:24px 26px">
        <div style="font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.85)">Place confirmed</div>
        <div style="font-size:23px;font-weight:800;color:#fff;margin-top:5px;line-height:1.2">${esc(camp.name)}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.92);margin-top:4px">${esc(academy)}</div>
      </td></tr>
      <tr><td style="padding:20px 26px 0">
        <p style="margin:0;font-size:14.5px;line-height:1.65;color:#374151">Hi ${esc(greeting)} — ${isAdult ? 'your place is' : `${esc(playerName)}'s place is`} booked.</p>
      </td></tr>
      <tr><td style="padding:16px 26px 0">
        <table role="presentation" width="100%" style="background:#f6f8fb;border:1px solid #e5e9f0;border-radius:11px"><tr><td style="padding:15px 17px">
          <div style="font-size:17px;font-weight:700;color:#1a1d29">${esc(prettyDate(camp.start_date))}</div>
          ${camp.end_date && camp.end_date !== camp.start_date ? `<div style="font-size:14px;color:${accent};font-weight:600;margin-top:3px">to ${esc(prettyDate(camp.end_date))}</div>` : ''}
          ${where ? `<div style="font-size:13.5px;color:#4b5563;margin-top:9px">📍 ${esc(where)}</div>` : ''}
          ${camp.board ? `<div style="font-size:12.5px;color:#6b7280;margin-top:2px">${esc(String(camp.board))}</div>` : ''}
        </td></tr></table>
      </td></tr>
      ${hasDate ? `<tr><td style="padding:16px 26px 0">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${accent};font-weight:700;padding-bottom:10px">Put it in the diary</div>
        ${calendarButtonsHtml(event, origin, 'camp', camp.id)}
      </td></tr>` : ''}
      <tr><td style="padding:22px 26px 26px">
        <div style="border-top:1px solid #eceef3;padding-top:14px;font-size:12.5px;color:#6b7280;line-height:1.6">
          What to bring and how the days run are on ${isAdult ? 'your' : `${esc(playerName)}'s`} page, and we'll send a reminder nearer the time.
          Need to change anything? Reply to this email${coachName ? ` and it comes straight to ${esc(coachName)}` : ''}.
          <div style="margin-top:8px;color:#9aa1b1">${esc(academy)}${coachName ? ` · ${esc(coachName)}` : ''}</div>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
      const subject = `Camp place confirmed — ${camp.name}`
      const sent = await sendAsCoach(coachId, { to, subject, html })
      if (!sent.ok) {
        const fb = await sendEmail({
          from: 'Lumio Tennis <noreply@lumiosports.com>', to: [to], subject, html,
          replyTo: profile?.contact_email || undefined,
          context: 'coach/camps/confirm fallback',
        }).catch(() => null)
        if (fb && !fb.error) sentTo = to
      } else sentTo = to
    }

    return NextResponse.json({ ok: true, inApp, emailedTo: sentTo })
  } catch (err) {
    console.error('[coach/camps/confirm]', err)
    return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
  }
}
