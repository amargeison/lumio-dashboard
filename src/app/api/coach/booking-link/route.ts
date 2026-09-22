import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'

// Booking links — "pick a time that suits you" instead of four emails.
//
// The coach creates a link here and Lumio sends it; the player books themselves
// on /book/<token>. What the coach is really doing is publishing a slice of
// their diary, so every decision about the SHAPE of the session is made on this
// side — duration, type, court, which coach — and stored on the link row. The
// public route never takes any of it from the browser.
//
// Auth is the coach's own session. A staff id passed in is checked against this
// academy before it is stored, so nobody can hang a link off another club's
// coach.

export const runtime = 'nodejs'

const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 16 URL-safe characters. Long enough that guessing one is not a strategy. */
const newToken = () => randomBytes(12).toString('base64url')

function inviteHtml(o: {
  academy: string; coachName: string; logoUrl?: string | null
  toName: string; url: string; sessionType: string; durationMin: number
  venue?: string | null; note?: string | null
}) {
  const hi = o.toName ? `Hi ${esc(o.toName.split(/\s+/)[0])},` : 'Hi,'
  return `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 12px">${hi}</p>
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 18px">
        Here's a link to book your next ${esc(o.sessionType.toLowerCase())} session with ${esc(o.coachName || o.academy)}.
        You'll see the times I'm actually free — pick whichever suits you and it goes straight into my diary.
      </p>
      <p style="text-align:center;margin:0 0 18px">
        <a href="${esc(o.url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 26px;border-radius:12px">Pick a time →</a>
      </p>
      <div style="font-size:14px;color:#6b7280;line-height:1.6">
        ${esc(o.sessionType)} · ${o.durationMin} minutes${o.venue ? ` · ${esc(o.venue)}` : ''}
      </div>
      ${o.note ? `<p style="font-size:14.5px;color:#374151;line-height:1.6;margin:14px 0 0;padding-top:14px;border-top:1px solid #eef0f5">${esc(o.note)}</p>` : ''}
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:16px 0 0">
      ${esc(o.academy)} · sent through Lumio
    </p>
  </div></body></html>`
}

// ── Create (and send) ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const playerId = clean(b.playerId, 40) || null
  const email = clean(b.email, 120).toLowerCase()
  const name = clean(b.name, 80)
  const durationMin = Math.max(15, Math.min(180, Number(b.durationMin) || 60))
  const sessionType = clean(b.sessionType, 40) || 'Private'
  const venueId = clean(b.venueId, 40) || null
  const court = clean(b.court, 80) || null
  const note = clean(b.note, 400) || null
  const reusable = !!b.reusable
  const send = b.send !== false && !reusable

  if (send && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Give an email address to send the link to, or copy a general link instead.' }, { status: 400 })
  }

  try {
    const db = serviceClient()

    // Everything referenced has to belong to THIS academy. A link is a door into
    // a diary; it does not get to point at somebody else's.
    let staffId = clean(b.staffId, 40) || null
    if (staffId) {
      const { data: st } = await db.from('coach_staff').select('id').eq('id', staffId).eq('coach_id', coachId).maybeSingle()
      if (!st) staffId = null
    }
    let player: { id: string; name: string; email: string | null; parent_email: string | null; contact_email: string | null } | null = null
    if (playerId) {
      const { data } = await db.from('coach_players')
        .select('id, name, email, parent_email, contact_email')
        .eq('id', playerId).eq('coach_id', coachId).maybeSingle()
      player = (data as any) || null
    }
    if (venueId) {
      const { data: v } = await db.from('coach_venues').select('id').eq('id', venueId).eq('coach_id', coachId).maybeSingle()
      if (!v) return NextResponse.json({ error: 'That venue is not on your account.' }, { status: 400 })
    }

    const toEmail = email || player?.parent_email || player?.email || player?.contact_email || ''
    const toName = name || player?.name || ''

    const token = newToken()
    const { data: link, error } = await db.from('coach_booking_links').insert({
      coach_id: coachId,
      staff_id: staffId,
      player_id: player?.id || null,
      token,
      name: toName || null,
      email: toEmail || null,
      duration_min: durationMin,
      session_type: sessionType,
      venue_id: venueId,
      court,
      note,
      reusable,
    }).select('id, token, created_at').single()
    if (error || !link) {
      console.error('[coach/booking-link] insert', error)
      return NextResponse.json({ error: 'Could not create that link.' }, { status: 500 })
    }

    const origin = publicSiteOrigin(new URL(req.url).origin)
    const url = `${origin}/book/${link.token}`

    if (!send) return NextResponse.json({ ok: true, id: link.id, url, sent: false })

    const [{ data: profile }, { data: staff }] = await Promise.all([
      db.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', coachId).maybeSingle(),
      staffId ? db.from('coach_staff').select('name').eq('id', staffId).maybeSingle() : Promise.resolve({ data: null } as { data: null }),
    ])
    const academy = profile?.brand_name || 'Your academy'
    const coachName = (staff?.name as string) || profile?.display_name || ''
    let venueName: string | null = null
    if (venueId) {
      const { data: v } = await db.from('coach_venues').select('name').eq('id', venueId).maybeSingle()
      venueName = (v?.name as string) || null
    }

    const html = inviteHtml({
      academy, coachName, logoUrl: profile?.brand_logo_url,
      toName, url, sessionType, durationMin, venue: venueName || court, note,
    })
    const subject = `Book your next session with ${coachName || academy}`

    const sent = await sendAsCoach(coachId, { to: toEmail, subject, html })
    let delivered = sent.ok
    if (!sent.ok) {
      const fb = await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [toEmail], subject, html,
        replyTo: profile?.contact_email || undefined,
        context: 'coach/booking-link invite',
      }).catch(() => null)
      delivered = !!fb && !fb.error
    }

    // In the portal too, for a family that uses the app. A link that only exists
    // in an inbox is a link that gets archived.
    if (player?.name) {
      await db.from('coach_messages').insert({
        coach_id: coachId,
        recipients: player.name,
        thread_key: player.name,
        subject: 'Book your next session',
        body: `Pick a time that suits you and it goes straight into my diary.\n\n[Book a session](${url})\n\n${sessionType} · ${durationMin} minutes${note ? `\n\n${note}` : ''}`,
        status: 'sent',
      }).then(({ error: e }) => { if (e) console.error('[coach/booking-link] in-app', e.message) })
    }

    return NextResponse.json({ ok: true, id: link.id, url, sent: delivered, to: toEmail })
  } catch (err) {
    console.error('[coach/booking-link]', err)
    return NextResponse.json({ error: 'Could not create that link.' }, { status: 500 })
  }
}

// ── The links this coach has sent ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    const db = serviceClient()
    const { data } = await db.from('coach_booking_links')
      .select('id, token, name, email, duration_min, session_type, reusable, uses, used_at, revoked_at, expires_at, created_at')
      .eq('coach_id', coachId).order('created_at', { ascending: false }).limit(12)
    const origin = publicSiteOrigin(new URL(req.url).origin)
    return NextResponse.json({
      links: (data || []).map((l: any) => ({ ...l, url: `${origin}/book/${l.token}` })),
    })
  } catch {
    return NextResponse.json({ links: [] })
  }
}

// ── Turn one off ────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  try {
    const db = serviceClient()
    await db.from('coach_booking_links').update({ revoked_at: new Date().toISOString() })
      .eq('id', id).eq('coach_id', coachId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not turn that link off.' }, { status: 500 })
  }
}
