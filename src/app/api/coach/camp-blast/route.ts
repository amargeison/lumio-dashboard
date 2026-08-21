import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { publicSiteOrigin } from '@/lib/public-origin'

export const maxDuration = 300

// Email the camp announcement to the coach's own roster.
//
// THE RULE THIS ROUTE EXISTS TO ENFORCE: the browser does not choose who gets
// emailed. It sends a list of addresses, and this route intersects that list
// with the parent and player emails actually on THIS coach's roster. Anything
// not on it is dropped silently. Without that intersection an authenticated
// coach could use Lumio's sending reputation to mail arbitrary strangers, which
// is how a product ends up on a blocklist.
//
// One message per family, never a shared To or Cc — a class list of parent
// addresses leaking to every other parent is a data breach, not a mailing.

const MAX_RECIPIENTS = 300
const CONCURRENCY = 4

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()

type Body = {
  campId?: string
  subject?: string
  paragraphs?: string[]
  cta?: string
  recipients?: string[]
  testOnly?: boolean      // send only to the coach, so they can see it land
}

function buildHtml(o: {
  academy: string; logoUrl?: string | null; coachName?: string | null
  greeting: string; paragraphs: string[]; cta?: string; signupUrl?: string | null
}) {
  const body = o.paragraphs.filter(Boolean).map(p =>
    `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.65;color:#374151">${esc(p)}</p>`).join('')
  const button = o.signupUrl
    ? `<div style="margin:22px 0 6px">
         ${o.cta ? `<p style="margin:0 0 12px;font-size:15.5px;line-height:1.6;color:#374151">${esc(o.cta)}</p>` : ''}
         <a href="${esc(o.signupUrl)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:11px">Sign up for the camp</a>
       </div>`
    : (o.cta ? `<p style="margin:18px 0 0;font-size:15.5px;line-height:1.6;color:#374151">${esc(o.cta)}</p>` : '')

  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
  <div style="background:linear-gradient(135deg,#3A8EE0,#3A8EE0bb);padding:24px 22px;text-align:center;color:#fff">
    ${o.logoUrl ? `<img src="${esc(o.logoUrl)}" alt="" style="height:44px;max-width:150px;background:#fff;border-radius:10px;padding:7px;margin-bottom:10px">` : ''}
    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.9">${esc(o.academy)}</div>
  </div>
  <div style="padding:24px 22px">
    <p style="margin:0 0 14px;font-size:15.5px;color:#374151">${esc(o.greeting)}</p>
    ${body}
    ${button}
    <p style="margin:22px 0 0;font-size:15px;color:#374151">${esc(o.coachName || '')}</p>
  </div>
</div>
<div style="max-width:560px;margin:14px auto 0;text-align:center;font-size:11px;color:#9aa1b1;line-height:1.6">
  You&rsquo;re getting this because your child trains with ${esc(o.academy)}.<br>
  If you&rsquo;d rather not hear about camps, just reply and say so — you&rsquo;ll be taken off the list.
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as Body
  const subject = String(b.subject ?? '').trim().slice(0, 160)
  const paragraphs = (Array.isArray(b.paragraphs) ? b.paragraphs : []).map(p => String(p).slice(0, 2000)).filter(Boolean)
  if (!b.campId || !subject || paragraphs.length === 0) {
    return NextResponse.json({ error: 'Nothing to send — generate the copy first.' }, { status: 400 })
  }

  try {
    const db = serviceClient()
    const { data: camp } = await db.from('coach_camps')
      .select('id, name, signup_slug, signup_open').eq('id', b.campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const { data: profile } = await db.from('sports_profiles')
      .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', coachId).maybeSingle()
    const academy = profile?.brand_name || 'Your academy'
    const coachName = profile?.display_name || ''
    const origin = publicSiteOrigin(new URL(req.url).origin)
    const signupUrl = camp.signup_slug && camp.signup_open ? `${origin}/camp/${camp.signup_slug}` : null

    // A test send goes to the coach and nowhere near a parent.
    if (b.testOnly) {
      const to = profile?.contact_email
      if (!to) return NextResponse.json({ error: 'Add a contact email in Settings first — that is where the test goes.' }, { status: 400 })
      const html = buildHtml({
        academy, logoUrl: profile?.brand_logo_url, coachName,
        greeting: 'Hi there,', paragraphs, cta: b.cta, signupUrl,
      })
      const sent = await sendAsCoach(coachId, { to, subject: `[TEST] ${subject}`, html })
      if (!sent.ok) await sendEmail({ from: 'Lumio Tennis <noreply@lumiosports.com>', to: [to], subject: `[TEST] ${subject}`, html, replyTo: to })
      return NextResponse.json({ ok: true, test: true, to })
    }

    // ── The intersection. This is the security boundary. ──────────────────
    const { data: roster } = await db.from('coach_players')
      .select('id, name, parent_name, parent_email, email, age').eq('coach_id', coachId)
    const allowed = new Map<string, { name: string; greetName: string }>()
    for (const p of roster ?? []) {
      // Under-16s are reached through the parent, same rule as booking
      // confirmations. An unknown age is treated as a minor.
      const minor = p.age == null || Number(p.age) < 16
      const addr = norm(minor ? p.parent_email : (p.email || p.parent_email))
      if (!addr || !addr.includes('@')) continue
      if (!allowed.has(addr)) {
        allowed.set(addr, {
          name: p.name,
          greetName: (minor ? (p.parent_name || '') : p.name).split(/\s+/)[0] || 'there',
        })
      }
    }

    const asked = (Array.isArray(b.recipients) ? b.recipients : []).map(norm).filter(Boolean)
    const targets = [...new Set(asked)].filter(a => allowed.has(a)).slice(0, MAX_RECIPIENTS)
    const dropped = new Set(asked).size - targets.length
    if (targets.length === 0) {
      return NextResponse.json({ error: 'None of those addresses are on your roster.' }, { status: 400 })
    }

    let sent = 0, failed = 0
    const queue = [...targets]
    const worker = async () => {
      for (;;) {
        const to = queue.shift()
        if (!to) return
        const who = allowed.get(to)!
        const html = buildHtml({
          academy, logoUrl: profile?.brand_logo_url, coachName,
          greeting: `Hi ${who.greetName},`, paragraphs, cta: b.cta, signupUrl,
        })
        try {
          const r = await sendAsCoach(coachId, { to, subject, html })
          if (r.ok) { sent++; continue }
          const fb = await sendEmail({
            from: 'Lumio Tennis <noreply@lumiosports.com>', to: [to], subject, html,
            replyTo: profile?.contact_email || undefined,
          }).catch(() => null)
          if (fb) sent++; else failed++
        } catch { failed++ }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker))

    // Logged so the coach can see what went out and does not send it twice.
    // Isolated on purpose: the emails have ALREADY gone. If the log table is
    // missing because migration 156 has not been run, the coach must still be
    // told the send succeeded — reporting a failure here would invite them to
    // press send again and mail every family twice.
    try {
      await db.from('coach_camp_blasts').insert({
        coach_id: coachId, camp_id: camp.id, subject, sent_count: sent, failed_count: failed,
      })
    } catch (e) { console.error('[coach/camp-blast] log', e) }

    return NextResponse.json({ ok: true, sent, failed, dropped })
  } catch (err) {
    console.error('[coach/camp-blast]', err)
    return NextResponse.json({ error: 'Could not send the announcement.' }, { status: 500 })
  }
}
