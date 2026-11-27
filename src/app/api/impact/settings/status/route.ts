import { NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'
import { verifiedSender } from '@/lib/impact/comms-rules'
import { smsOn, type ImpactOrgSettings } from '@/lib/impact/org'

export const runtime = 'nodejs'

// Settings → Messaging and Integrations: what is really connected for this org. Each line
// is 'connected', 'not_connected' or 'attention', with a plain reason. Nothing secret
// comes back: the sender address, whether keys exist, and the Resend domain state.

type State = 'connected' | 'not_connected' | 'attention'
let domainCache: { at: number; domains: { name: string; status: string }[] } | null = null

async function resendDomains(): Promise<{ name: string; status: string }[] | null> {
  if (!process.env.RESEND_API_KEY) return null
  if (domainCache && Date.now() - domainCache.at < 10 * 60_000) return domainCache.domains
  try {
    const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(6000) })
    if (!r.ok) return null
    const j = (await r.json()) as { data?: { name: string; status: string }[] }
    domainCache = { at: Date.now(), domains: (j.data ?? []).map(d => ({ name: String(d.name).toLowerCase(), status: String(d.status) })) }
    return domainCache.domains
  } catch { return null }
}

export async function GET() {
  const who = await impactHq('see your connections')
  if (who instanceof NextResponse) return who
  const db = serviceDb()
  const [{ data: org }, { data: hook }] = await Promise.all([
    db.from('impact_orgs').select('slug, settings').eq('hq_id', who.hqId).maybeSingle(),
    db.from('impact_lead_hooks').select('last_used_at').eq('hq_id', who.hqId).maybeSingle(),
  ])
  if (!org) return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  const settings = (org.settings ?? {}) as ImpactOrgSettings

  const sender = verifiedSender(org.slug as string, process.env.IMPACT_EMAIL_SENDERS)
  let email: { state: State; sender: string | null; detail: string }
  if (!sender) email = { state: 'not_connected', sender: null, detail: 'No sending address yet. Lumio sets this up for you once your domain is verified.' }
  else if (!process.env.RESEND_API_KEY) email = { state: 'attention', sender, detail: 'Email isn’t set up on the server. Lumio has been told.' }
  else {
    const domains = await resendDomains()
    const d = domains?.find(x => x.name === sender.split('@')[1]?.toLowerCase())
    email = !domains ? { state: 'attention', sender, detail: 'The domain check couldn’t run just now; emails are still sending.' }
      : d?.status === 'verified' ? { state: 'connected', sender, detail: `Verified with Resend: ${d.name}.` }
      : { state: 'attention', sender, detail: d ? `The domain ${d.name} is ${d.status.replace(/_/g, ' ')} with Resend.` : 'The sending domain isn’t verified with Resend.' }
  }

  const twilioKeys = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER))
  const smsLive = process.env.IMPACT_SMS_LIVE === 'on'
  const available = twilioKeys && smsLive
  const sms: { state: State; on: boolean; available: boolean; detail: string } = !available
    ? { state: 'not_connected', on: smsOn(settings), available, detail: 'Texting isn’t available yet: Lumio switches it on once Twilio is set up.' }
    : smsOn(settings) ? { state: 'connected', on: true, available, detail: 'Texts go out through Twilio to families who said yes to texts.' }
    : { state: 'not_connected', on: false, available, detail: 'Switched off in Settings → Messaging: your organisation sends no texts.' }

  const meta: { state: State; detail: string; lastUsedAt: string | null } = hook
    ? { state: 'connected', detail: hook.last_used_at ? 'Your leads address is set up and has received leads.' : 'Your leads address is set up; no leads have arrived yet.', lastUsedAt: (hook.last_used_at as string | null) ?? null }
    : { state: 'not_connected', detail: 'No leads address yet. Make one in Leads, then paste it into Zapier or Make.', lastUsedAt: null }

  return NextResponse.json({
    email, sms, meta,
    replyTo: `reply+${org.slug}@inbound.lumiosports.com`,
    erase: process.env.IMPACT_ERASE === 'on',
  })
}
