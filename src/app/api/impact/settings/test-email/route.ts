import { NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb, senderFor, isDryRun } from '@/lib/impact/invite-send'
import { brandFor } from '@/lib/impact/org'
import { brandVoice } from '@/lib/impact/comms-settings'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Settings → Messaging → "Send me a test": one short email from the org's sender to the
// signed-in user's own sign-in address (never one typed in), to see how mail arrives.

export async function POST() {
  const who = await impactHq('send a test email')
  if (who instanceof NextResponse) return who
  const to = (who.user.email ?? '').trim()
  if (!to) return NextResponse.json({ error: 'Your login has no email address.' }, { status: 400 })
  if (!rateLimit(`impact-test-email:${who.hqId}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: 'That’s 5 test emails this hour. Please try again later.' }, { status: 429 })
  const { data: org } = await serviceDb().from('impact_orgs').select('slug, settings').eq('hq_id', who.hqId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  const sender = senderFor(org.slug as string)
  if (!sender.ok) return NextResponse.json({ error: sender.error }, { status: sender.status })
  const brand = brandFor(org.slug as string, org.settings ?? {})
  const voice = brandVoice(org.settings?.messaging, brand.org)
  const masked = `${to.slice(0, 1)}…${to.slice(to.indexOf('@'))}`
  if (isDryRun()) return NextResponse.json({ ok: true, dry: true, sentTo: masked })
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
  try {
    const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `${brand.org.replace(/["<>\\]/g, '')} <${sender.address}>`, to,
      replyTo: `reply+${org.slug}@inbound.lumiosports.com`,
      subject: `Test email from ${brand.org}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;"><p>This is a test from Settings → Messaging. If you can read this, emails from ${esc(brand.org)} are reaching you.</p><p>Replying to it lands in your Inbox in the portal.</p><p>${esc(voice.signOff || brand.org)}</p></div>`,
    })
    if (error) return NextResponse.json({ error: `The test couldn’t be sent: ${error.message}` }, { status: 502 })
    return NextResponse.json({ ok: true, sentTo: masked })
  } catch (e) {
    return NextResponse.json({ error: `The test couldn’t be sent: ${e instanceof Error ? e.message : 'unknown error'}` }, { status: 502 })
  }
}
