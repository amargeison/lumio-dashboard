import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { publicSiteOrigin } from '@/lib/public-origin'
import { formEmailBlock, formEnabled, formUrl } from '@/lib/coach/camp-form'
import { recipientFor } from '@/lib/coach/camp-email-build'

export const runtime = 'nodejs'
export const maxDuration = 120

// "Email the form to everyone who has not filled it in" — the coach's button on
// a camp's Info form tab. For the people the automatic emails will not reach in
// time: a camp whose countdown emails are paused, somebody added last week.
//
// Only ever sent because the coach pressed the button, only to attendees of
// that coach's own camp, and only to those who have not answered.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(coachId)) return notAnAcademy()
  const body = await req.json().catch(() => ({})) as { campId?: string; attendeeId?: string }
  if (!body.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  try {
    const db = serviceClient()
    const { data: camp } = await db.from('coach_camps').select('*').eq('id', body.campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })
    if (!formEnabled(camp)) return NextResponse.json({ error: 'The form is switched off for this camp.' }, { status: 400 })

    let q = db.from('coach_camp_attendees').select('*').eq('camp_id', camp.id).eq('coach_id', coachId).is('form_submitted_at', null)
    if (body.attendeeId) q = q.eq('id', body.attendeeId)
    const { data: rows } = await q
    const attendees = (rows || []).filter(a => a.status !== 'cancelled' && a.form_token)
    const playerIds = attendees.map(a => a.player_id).filter(Boolean)
    const { data: players } = playerIds.length
      ? await db.from('coach_players').select('id, name, age, parent_name, email, contact_email, parent_email').in('id', playerIds)
      : { data: [] as Record<string, unknown>[] }
    const byId = new Map((players || []).map(p => [p.id as string, p]))
    const { data: profile } = await db.from('sports_profiles').select('brand_name, brand_logo_url, display_name, contact_email').eq('id', coachId).maybeSingle()

    const origin = publicSiteOrigin(new URL(req.url).origin)
    const academy = profile?.brand_name || 'Your academy'
    let sent = 0, failed = 0
    const noAddress: string[] = []
    for (const a of attendees) {
      const r = recipientFor(camp, a, a.player_id ? byId.get(a.player_id) : null)
      if (!r.to) { noAddress.push(a.player_name); continue }
      const subject = r.toParent ? `${camp.name} — a few details about ${String(a.player_name).split(' ')[0]}` : `${camp.name} — a few details before we start`
      const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
  <div style="background:linear-gradient(135deg,#3A8EE0,#3A8EE0bb);padding:22px;text-align:center;color:#fff">
    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.9">${esc(academy)}</div>
    <div style="font-size:21px;font-weight:800;margin-top:6px">${esc(camp.name)}</div>
  </div>
  <div style="padding:22px">
    <p style="margin:0 0 4px;font-size:15.5px;line-height:1.6;color:#374151">Hi ${esc(r.greeting)},</p>
    ${formEmailBlock(formUrl(origin, a.form_token), { toParent: r.toParent, playerName: a.player_name })}
    <p style="margin:0;font-size:13.5px;line-height:1.6;color:#6b7280">The link is yours alone, and you can go back and change an answer until the camp is over. Any questions, just reply${profile?.display_name ? ` — it comes straight to ${esc(profile.display_name)}` : ''}.</p>
  </div>
</div>
<div style="max-width:560px;margin:14px auto 0;text-align:center;font-size:11px;color:#9aa1b1">Powered by Lumio</div>
</body></html>`
      let ok = (await sendAsCoach(coachId, { to: r.to, subject, html }).catch(() => ({ ok: false }))).ok
      if (!ok) {
        const fb = await sendEmail({ from: 'Lumio Tennis <noreply@lumiosports.com>', to: [r.to], subject, html, replyTo: profile?.contact_email || undefined, context: 'coach/camps/form-send' }).catch(() => null)
        ok = !!fb && !fb.error
      }
      if (ok) { sent++; await db.from('coach_camp_attendees').update({ form_sent_at: new Date().toISOString() }).eq('id', a.id) } else failed++
    }
    return NextResponse.json({ ok: true, sent, failed, noAddress })
  } catch (e) {
    console.error('[coach/camps/form-send]', e)
    return NextResponse.json({ error: 'Could not send the form' }, { status: 500 })
  }
}
