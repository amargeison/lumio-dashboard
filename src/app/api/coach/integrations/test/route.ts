import { NextRequest, NextResponse } from 'next/server'
import { getConnection, sessionCoachId, type Provider } from '@/lib/coach/oauth'
import { sendAsCoach } from '@/lib/coach/mail'

// "Send test email" from Settings → Connected accounts.
//
// Connecting a mailbox looks identical whether it works or not: the consent
// screen closes, a tick appears, and the coach finds out weeks later — from a
// parent — that confirmations have been arriving from the Lumio address all
// along. This proves it end to end, now, with the coach watching their own inbox.
//
// It only ever sends to the connected account's OWN address, so it cannot be
// turned into a way of mailing anyone else.
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { provider } = (await req.json().catch(() => ({}))) as { provider?: Provider }
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })

  const conn = await getConnection(coachId, provider)
  if (!conn) return NextResponse.json({ error: 'That account is not connected.' }, { status: 400 })
  if (!conn.email_address) return NextResponse.json({ error: 'No address on that connection — disconnect and connect it again.' }, { status: 400 })
  if (!conn.capabilities?.includes('send_email')) {
    return NextResponse.json({ error: 'This connection can write to your calendar but was not given permission to send email. Reconnect it and leave every box ticked.' }, { status: 400 })
  }

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111">
    <p>This is a test from Lumio.</p>
    <p>If it is sitting in your inbox and the <strong>From</strong> line shows your own address, your players and parents will see the same thing on booking confirmations, camp emails and lesson summaries.</p>
    <p style="color:#666;font-size:12px">Sent ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
  </div>`

  const sent = await sendAsCoach(coachId, {
    to: conn.email_address,
    subject: 'Lumio test — sending as you',
    html,
  })

  // sendAsCoach walks the connected mailboxes in a fixed order — Google, then
  // Outlook, then iCloud — and stops at the first that accepts. So the answer
  // the coach needs is not "did it work" but "which address did it leave from",
  // because that is the one every player will see. With two mailboxes connected
  // this is how they find out which one wins.
  if (!sent.ok) {
    return NextResponse.json({ error: 'The send was refused. Reconnect the account and try again.' }, { status: 502 })
  }
  if (sent.provider !== provider) {
    const name = (p: string) => p === 'google' ? 'Gmail' : p === 'microsoft' ? 'Outlook' : 'iCloud'
    return NextResponse.json({
      ok: true, provider: sent.provider, from: sent.from,
      warning: `Sent — but from your ${name(sent.provider || '')} account (${sent.from}), which Lumio uses first. That is the address your players will see. Disconnect it if you want ${name(provider)} to send instead.`,
    })
  }
  return NextResponse.json({ ok: true, provider: sent.provider, from: sent.from })
}
