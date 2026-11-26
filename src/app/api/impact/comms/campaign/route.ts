import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'
import { claimCampaign, continueSend, mailerFor, type CampaignRow, type OrgRow } from '@/lib/impact/comms-server'
import { cleanSections, draftProblem, footerAddress, renderNewsletter } from '@/lib/impact/newsletter'
import { parseAudience } from '@/lib/impact/audiences'
import { brandFor } from '@/lib/impact/org'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 300

// A newsletter, from the HQ:
//   { action: 'test', id }  "Send me a test": one email to the signed-in HQ's own
//                           address, marked [Test], with a placeholder unsubscribe link.
//                           Nothing is recorded against families.
//   { action: 'send', id }  "Send now": a human pressed Send. Claims the draft (or a
//                           scheduled one) for sending, works out the audience now,
//                           and sends up to 1,000; anything left is finished by the
//                           scheduler on its next run.
// The browser saves drafts and schedules them itself (RLS + the impact_campaign_guard
// trigger stop it marking anything sending or sent). Only this route and the scheduler,
// with the service role, can.

export async function POST(req: NextRequest) {
  const auth = await impactHq('send newsletters')
  if (auth instanceof NextResponse) return auth
  const { user, db, hqId } = auth
  const raw = (await req.json().catch(() => ({}))) as { action?: unknown; id?: unknown }
  const id = typeof raw.id === 'string' && /^[0-9a-f-]{36}$/i.test(raw.id) ? raw.id : null
  if (!id) return NextResponse.json({ error: 'Save the newsletter first.' }, { status: 400 })

  // Read as the HQ: RLS proves the newsletter is theirs.
  const { data: c } = await db.from('impact_campaigns').select('id, hq_id, status, subject, preheader, sections, audience, scheduled_at').eq('id', id).eq('hq_id', hqId).maybeSingle()
  if (!c) return NextResponse.json({ error: 'That newsletter couldn’t be found.' }, { status: 404 })
  const service = serviceDb()
  const { data: orgRow } = await service.from('impact_orgs').select('hq_id, slug, settings').eq('hq_id', hqId).maybeSingle()
  if (!orgRow) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  const org = orgRow as OrgRow
  const sections = cleanSections(c.sections)
  const problem = draftProblem({ subject: c.subject as string | null, sections })
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  if (raw.action === 'test') {
    if (!rateLimit(`impact-newsletter-test:${hqId}`, 10, 60 * 60_000).ok) return NextResponse.json({ error: 'That’s a lot of tests this hour. Try again later.' }, { status: 429 })
    const to = user.email
    if (!to) return NextResponse.json({ error: 'Your login has no email address to send a test to.' }, { status: 400 })
    const mailer = await mailerFor(org)
    if ('error' in mailer) return NextResponse.json({ error: mailer.error }, { status: 503 })
    const brand = brandFor(org.slug, org.settings)
    const draft = { subject: `[Test] ${c.subject}`, preheader: (c.preheader as string) ?? '', sections }
    const { html, text } = renderNewsletter(draft, { org: brand.org, address: footerAddress(org.settings ?? {}), sender: mailer.from.replace(/^.*<|>$/g, '') }, null)
    const res = await mailer.send([{ to, subject: draft.subject, html, text, headers: {} }])
    if ('error' in res || !res.ids[0]) return NextResponse.json({ error: `The test couldn’t be sent: ${'error' in res ? res.error : 'no id came back'}` }, { status: 502 })
    console.log('[impact/comms/campaign] test sent', JSON.stringify({ hq: hqId, campaign: id }))
    return NextResponse.json({ ok: true, to })
  }

  if (raw.action !== 'send') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  if (!parseAudience(c.audience)) return NextResponse.json({ error: 'Choose who this is for.' }, { status: 400 })
  if (!rateLimit(`impact-newsletter-send:${hqId}`, 10, 60 * 60_000).ok) return NextResponse.json({ error: 'That’s a lot of newsletters this hour. Try again later.' }, { status: 429 })
  const claimed = await claimCampaign(service, hqId, id, ['draft', 'scheduled'])
  if (!claimed) return NextResponse.json({ error: 'This newsletter is already sending or sent.' }, { status: 409 })
  const result = await continueSend(service, org, claimed as CampaignRow)
  console.log('[impact/comms/campaign] send', JSON.stringify({ hq: hqId, campaign: id, ...result }))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, ...result })
}
