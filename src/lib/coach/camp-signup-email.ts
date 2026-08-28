// Emails for a public camp sign-up.
//
// Two go out, and they are not the same email. The parent gets a receipt they can
// show at the gate; the coach gets the operational detail — medical notes,
// emergency contact, consents — because that is what he needs before the child
// walks on court, and he should never have to log in to find out someone signed up.
//
// Both are sent AS THE COACH where a mailbox is connected, same as booking
// confirmations, so a parent recognises the sender.

import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const money = (p: number) => '£' + (p / 100).toFixed(p % 100 ? 2 : 0)
const longDate = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(d + 'T00:00:00')
  return isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export type SignupMailInput = {
  academy: string; logoUrl?: string | null; coachName?: string | null; coachEmail?: string | null
  campName: string; startDate?: string | null; endDate?: string | null; location?: string | null
  playerName: string; parentName?: string | null; parentEmail: string; parentPhone?: string | null
  playerAge?: number | null; medicalNotes?: string | null; emergencyContact?: string | null
  consentPhoto?: boolean; consentMedical?: boolean
  amountPennies?: number; paymentMode?: string; paid: boolean
  // 'junior' | 'adult' | 'mixed'. On an adult camp the person reading this IS
  // the player, so the whole email flips from third person to second.
  audience?: string | null
  toParent?: boolean
  // Set ONLY for a late sign-up — someone who booked after the "everything you
  // need" email had already gone out to everyone else. Rather than send them a
  // burst of countdown emails whose dates have passed, that email's contents are
  // folded into this one. See foldedIntoConfirmation() in camp-lifecycle.ts.
  essentials?: {
    dailyShape?: string | null
    whatToBring?: string[] | null
    whatTheyWorkOn?: string[] | null
    note?: string | null
    overseas?: boolean
  } | null
}

function shell(logoUrl: string | null | undefined, academy: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
  <div style="background:linear-gradient(135deg,#3A8EE0,#3A8EE0bb);padding:24px 22px;text-align:center;color:#fff">
    ${logoUrl ? `<img src="${esc(logoUrl)}" alt="" style="height:44px;max-width:150px;background:#fff;border-radius:10px;padding:7px;margin-bottom:10px">` : ''}
    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.9">${esc(academy)}</div>
  </div>
  <div style="padding:24px 22px">${body}</div>
</div>
<div style="max-width:560px;margin:14px auto 0;text-align:center;font-size:11px;color:#9aa1b1">Powered by Lumio</div>
</body></html>`
}

function detailRows(rows: [string, string][]) {
  return rows.filter(r => !!r[1]).map(([l, v]) =>
    `<tr><td style="padding:7px 0;font-size:13px;color:#6b7280;width:150px;vertical-align:top">${esc(l)}</td>
         <td style="padding:7px 0;font-size:14px;color:#1a1d29">${esc(v)}</td></tr>`).join('')
}

// The details email, folded in. Built from the camp record only — nothing here
// is generated, because a confirmation is a receipt and a receipt that invents a
// detail is worse than one that omits it.
function essentialsBlock(i: SignupMailInput): string {
  const e = i.essentials
  if (!e) return ''
  const bring = (e.whatToBring || []).filter(Boolean)
  const work = (e.whatTheyWorkOn || []).filter(Boolean)
  const parts = [
    e.dailyShape ? `<p style="margin:0 0 12px;font-size:14.5px;line-height:1.65;color:#374151">${esc(e.dailyShape)}</p>` : '',
    work.length ? `<div style="font-size:13px;color:#6b7280;margin:0 0 5px">What they&rsquo;ll work on</div>
        <ul style="margin:0 0 13px;padding-left:19px">${work.map(x => `<li style="font-size:14px;line-height:1.6;color:#374151;margin-bottom:4px">${esc(x)}</li>`).join('')}</ul>` : '',
    bring.length ? `<div style="font-size:13px;color:#6b7280;margin:0 0 5px">What to bring</div>
        <ul style="margin:0 0 13px;padding-left:19px">${bring.map(x => `<li style="font-size:14px;line-height:1.6;color:#374151;margin-bottom:4px">${esc(x)}</li>`).join('')}</ul>` : '',
    e.overseas ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151">This one is abroad, so check the passport is in date and that travel insurance is sorted before you travel.</p>` : '',
    e.note ? `<p style="margin:0;font-size:14px;line-height:1.65;color:#374151">${esc(e.note)}</p>` : '',
  ].filter(Boolean).join('')
  if (!parts) return ''
  return `<div style="margin:18px 0 0;padding:16px 16px 14px;background:#f7f9fc;border:1px solid #e6ebf3;border-radius:12px">
    <div style="font-size:15px;font-weight:700;color:#1a1d29;margin:0 0 4px">Everything you need</div>
    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.55">You&rsquo;ve booked close to the start, so here it all is now rather than in a separate email.</p>
    ${parts}
  </div>`
}

export function parentHtml(i: SignupMailInput) {
  const when = [longDate(i.startDate), i.endDate && i.endDate !== i.startDate ? longDate(i.endDate) : ''].filter(Boolean).join(' – ')
  const mapLink = i.location
    ? `<div style="margin-top:4px"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.location)}" style="font-size:13px;color:#3A8EE0">Get directions</a></div>` : ''
  const payLine = !i.amountPennies ? ''
    : i.paid
      ? `<div style="background:#f1faf4;border:1px solid #cdebd8;border-radius:10px;padding:11px 13px;margin:16px 0;font-size:14px;color:#31543f">
           <strong>${money(i.amountPennies)} received.</strong> ${i.paymentMode === 'deposit' ? 'That secures the place — the balance is due before the camp starts.' : 'Paid in full.'}
         </div>`
      : `<div style="background:#fff7ed;border:1px solid #fcd9a8;border-radius:10px;padding:11px 13px;margin:16px 0;font-size:14px;color:#7c4a03">
           <strong>${money(i.amountPennies)} still to pay.</strong> The place is held for now — ${esc(i.coachName || 'your coach')} will be in touch with a payment link.
         </div>`
  // An adult booked this for themselves. "Sarah is signed up. Thanks, Sarah —
  // we've got Sarah down for..." is the tell that software is writing to you.
  const direct = i.toParent === false
  const first = esc(i.playerName.split(' ')[0])
  const head = direct
    ? `<h1 style="margin:0 0 6px;font-size:21px;color:#1a1d29">You&rsquo;re in</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
      Thanks, ${first} — your place on <strong>${esc(i.campName)}</strong> is booked. Here&rsquo;s everything in one place.
    </p>`
    : `<h1 style="margin:0 0 6px;font-size:21px;color:#1a1d29">${first} is signed up</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
      Thanks${i.parentName ? ', ' + esc(i.parentName.split(' ')[0]) : ''} — we&rsquo;ve got ${esc(i.playerName)} down for <strong>${esc(i.campName)}</strong>. Here&rsquo;s everything in one place.
    </p>`
  return shell(i.logoUrl, i.academy, `
    ${head}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eef0f5">
      ${detailRows([['Camp', i.campName], ['When', when], ['Where', i.location || '']])}
    </table>
    ${mapLink}
    ${payLine}
    ${essentialsBlock(i)}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280">
      Anything we should know before the first morning — ${direct ? 'a niggle, a late arrival, a dietary requirement' : 'a change of collection arrangements, a new injury'} — just reply to this email and it comes straight to ${esc(i.coachName || 'the coaching team')}.
    </p>
    <p style="margin:14px 0 0;font-size:14px;color:#374151">See you on court.</p>`)
}

export function coachHtml(i: SignupMailInput) {
  const flag = i.medicalNotes
    ? `<div style="background:#fdf1f0;border:1px solid #f3c9c5;border-radius:10px;padding:11px 13px;margin:0 0 14px;font-size:14px;color:#8c2f26">
         <strong>Medical note:</strong> ${esc(i.medicalNotes)}
       </div>` : ''
  return shell(i.logoUrl, i.academy, `
    <h1 style="margin:0 0 4px;font-size:20px;color:#1a1d29">New camp sign-up</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280">${esc(i.playerName)} — ${esc(i.campName)}</p>
    ${flag}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eef0f5">
      ${detailRows([
        ['Player', i.playerName],
        ['Age', i.playerAge ? String(i.playerAge) : ''],
        [i.toParent === false ? 'Booked by' : 'Parent / guardian', i.parentName || ''],
        ['Email', i.parentEmail],
        ['Phone', i.parentPhone || ''],
        ['Emergency contact', i.emergencyContact || ''],
        ['Photo consent', i.consentPhoto ? 'Given' : 'NOT given'],
        ['Medical consent', i.consentMedical ? 'Given' : 'NOT given'],
        ['Payment', !i.amountPennies ? 'No payment taken' : (i.paid ? money(i.amountPennies) + ' paid' : money(i.amountPennies) + ' outstanding')],
      ])}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280">They&rsquo;re already on the attendee list in Lumio — Training Camps → ${esc(i.campName)} → Attendees.</p>`)
}

// Fire-and-forget. A sign-up must never fail because an email did.
export async function sendCampSignupEmails(coachId: string, i: SignupMailInput) {
  const subjectParent = i.toParent === false
    ? `You're in — ${i.campName}`
    : `${i.playerName} is signed up — ${i.campName}`
  const subjectCoach = `New camp sign-up — ${i.playerName} · ${i.campName}`
  try {
    const sent = await sendAsCoach(coachId, { to: i.parentEmail, subject: subjectParent, html: parentHtml(i) })
    if (!sent.ok) {
      await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [i.parentEmail],
        subject: subjectParent, html: parentHtml(i),
        // So a parent replying reaches the coach, not a noreply address.
        replyTo: i.coachEmail || undefined,
      })
    }
  } catch (e) { console.error('[camp-signup-email] parent', e) }

  if (!i.coachEmail) return
  try {
    const sent = await sendAsCoach(coachId, { to: i.coachEmail, subject: subjectCoach, html: coachHtml(i), replyTo: i.parentEmail })
    if (!sent.ok) {
      await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [i.coachEmail],
        subject: subjectCoach, html: coachHtml(i), replyTo: i.parentEmail,
      })
    }
  } catch (e) { console.error('[camp-signup-email] coach', e) }
}
