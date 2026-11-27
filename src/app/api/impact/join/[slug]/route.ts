import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import QRCode from 'qrcode'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { serviceDb, senderFor, createInvite, invitesOn, isDryRun } from '@/lib/impact/invite-send'
import { parseJoin, looksLikeABot, venueFull, consentVersionFor } from '@/lib/impact/community'
import { welcomeEmail, alreadyEmail } from '@/lib/impact/community-email'
import { brandFor, moduleOn, privacyUrlOf, type ImpactOrgSettings } from '@/lib/impact/org'

export const runtime = 'nodejs'

// The public weekend sign-up: POST /api/impact/join/<slug> from /impact/<slug>/join.
//
// No session: the slug names the org, the service key stays here, and every write is
// pinned to that org's hq_id. It refuses unless the org has a privacy policy URL in
// its settings and the Community module is on. It never returns anything about
// existing data. Every accepted sign-up gets the same reply, { ok: true } — a new
// family, an address that is already a family here, and a suspected bot alike — so the
// reply never says whether an address was known. What happened goes by email only: a
// new family gets the welcome (with the waiting list if the venue is full), a known
// address gets its app link again and nothing is created, a bot gets nothing. The demo
// writes nothing.
//
// Writes: the family (source community, venue, consents, signed up now, waiting list
// if the venue is full), its children (no school; "anything the coach should know" in
// medical_notes, only with the health tick), the sign-up audit row (channel form, or qr
// when the venue's poster was scanned; consent text version, +health when ticked; hashed
// IP), and a parent invite whose link goes in the welcome email — with the family QR
// unless the org has QR check-in switched off.

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/
const MAX_BODY = 20_000
const log = (stage: string, extra: Record<string, unknown> = {}) => console.info('[impact-join]', stage, extra)
const SITE = 'https://www.lumiosports.com'

const ipHash = (ip: string) => createHmac('sha256', `impact-join:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`).update(ip).digest('hex')
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

// Every accepted submission answers no sooner than this, so a known address (which skips
// the writes) can't be told apart from a new one by how fast the reply comes back.
const REPLY_FLOOR_MS = 900

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const started = Date.now()
  const res = await join(req, ctx)
  if (res.status === 200) {
    const wait = REPLY_FLOOR_MS - (Date.now() - started)
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
  }
  return res
}

async function join(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'This sign-up page doesn’t exist.' }, { status: 404 })
  const ip = clientIp(req.headers)
  for (const [key, limit, ms] of [[`impact-join:${ip}`, 5, 10 * 60_000], [`impact-join-day:${ip}`, 20, 24 * 60 * 60_000], [`impact-join-org:${slug}`, 200, 60 * 60_000]] as const) {
    const gate = rateLimit(key, limit, ms)
    if (!gate.ok) return NextResponse.json({ error: 'Too many sign-ups from here just now — please try again in a few minutes.' }, { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } })
  }
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return NextResponse.json({ error: 'That’s too much for one sign-up.' }, { status: 413 })
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Please fill in the form and try again.' }, { status: 400 })

  // The demo is a mock: nothing is ever written for it.
  if (slug === 'demo') return NextResponse.json({ ok: true, demo: true })

  const db = serviceDb()
  const { data: org } = await db.from('impact_orgs').select('hq_id, settings').eq('slug', slug).maybeSingle()
  if (!org) return NextResponse.json({ error: 'This sign-up page doesn’t exist.' }, { status: 404 })
  const settings = (org.settings ?? {}) as ImpactOrgSettings
  const hqId = org.hq_id as string
  if (!privacyUrlOf(settings) || !moduleOn(settings, 'community')) {
    log('refused: not open', { slug, privacy: !!privacyUrlOf(settings) })
    return NextResponse.json({ error: 'Sign-up isn’t open yet. Please check back soon.' }, { status: 403 })
  }
  if (looksLikeABot(body, Date.now())) { log('bot', { slug }); return NextResponse.json({ ok: true }) }

  const { data: venues } = await db.from('tp_venues').select('id, name, address, postcode, session_day, session_time, capacity').eq('hq_id', hqId)
  const parsed = parseJoin(body, (venues ?? []).map(v => v.id as string), today())
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 })
  const j = parsed.value
  const venue = venues!.find(v => v.id === j.venueId)!
  const hash = ipHash(ip)
  const brand = brandFor(slug, settings)

  // A second, lasting limit: sign-ups from this address to this org in the last hour.
  const since = new Date(Date.now() - 60 * 60_000).toISOString()
  const { count: recent } = await db.from('tp_community_signups').select('id', { count: 'exact', head: true }).eq('hq_id', hqId).eq('ip_hash', hash).gt('created_at', since)
  if ((recent ?? 0) >= 5) return NextResponse.json({ error: 'Too many sign-ups from here just now — please try again later.' }, { status: 429 })

  const sender = senderFor(slug)
  const sendMail = async (to: string, mail: { subject: string; html: string }, attachments?: { filename: string; content: Buffer; contentId: string }[]) => {
    if (!sender.ok || isDryRun()) { log('email not sent', { slug, why: sender.ok ? 'dry run' : sender.error }); return false }
    try {
      const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({ from: `${brand.org.replace(/["<>\\]/g, '')} <${sender.address}>`, to, subject: mail.subject, html: mail.html, ...(attachments ? { attachments } : {}) })
      if (error) { log('email failed', { slug, error: error.message }); return false }
      return true
    } catch (e) { log('email failed', { slug, error: e instanceof Error ? e.message : String(e) }); return false }
  }

  // Already a family here: a link to sign in, and nothing created.
  const { data: existing } = await db.from('tp_families').select('id').eq('hq_id', hqId).ilike('email', j.email.replace(/[%_\\]/g, c => `\\${c}`)).limit(1)
  if (existing?.length) {
    const familyId = existing[0].id as string
    const { data: login } = await db.from('impact_members').select('id').eq('hq_id', hqId).eq('role', 'parent').eq('family_id', familyId).not('accepted_at', 'is', null).is('revoked_at', null).limit(1)
    let link = `${SITE}/sports-login?email=${encodeURIComponent(j.email)}`, isInvite = false
    if (!login?.length && invitesOn()) {
      const inv = await createInvite(db, { hqId, userId: hqId, slug, name: brand.org }, { role: 'parent', familyId, email: j.email })
      if (inv.ok) { link = inv.link; isInvite = true }
    }
    const sent = await sendMail(j.email, alreadyEmail({ org: brand.org, link, isInvite }))
    log('already a family', { slug, sent, isInvite })
    return NextResponse.json({ ok: true })
  }

  const { count: placed } = await db.from('tp_families').select('id', { count: 'exact', head: true }).eq('hq_id', hqId).eq('community_venue_id', venue.id).is('waitlisted_at', null)
  const waitlisted = venueFull(venue.capacity as number | null, placed ?? 0)
  const now = new Date().toISOString()
  const { data: fam, error: famErr } = await db.from('tp_families').insert({
    hq_id: hqId, guardian_name: j.guardian, email: j.email, phone: j.phone, consent_data: true, consent_photo: j.consentPhoto, consent_at: now,
    opt_in_email: j.optInEmail, opt_in_sms: j.optInSms, opt_in_app: true, source: 'community', community_venue_id: venue.id, signed_up_at: now,
    waitlisted_at: waitlisted ? now : null,
  }).select('id, checkin_code').single()
  if (famErr || !fam) { log('family not saved', { slug, error: famErr?.message }); return NextResponse.json({ error: 'Something went wrong saving your details. Please try again.' }, { status: 500 }) }
  const undo = async (why: string) => { log('rolled back', { slug, why }); await db.from('tp_families').delete().eq('id', fam.id).eq('hq_id', hqId) }
  const kids = await db.from('tp_children').insert(j.children.map(c => ({ hq_id: hqId, family_id: fam.id, name: c.name, date_of_birth: c.dob, medical_notes: j.consentHealth ? c.notes : null, photo_consent: j.consentPhoto, fee_status: 'unknown' })))
  if (kids.error) { await undo(kids.error.message); return NextResponse.json({ error: 'Something went wrong saving your details. Please try again.' }, { status: 500 }) }
  const audit = await db.from('tp_community_signups').insert({ hq_id: hqId, family_id: fam.id, venue_id: venue.id, channel: body.channel === 'qr' ? 'qr' : 'form', consent_text_version: consentVersionFor(j), ip_hash: hash })
  if (audit.error) { await undo(audit.error.message); return NextResponse.json({ error: 'Something went wrong saving your details. Please try again.' }, { status: 500 }) }

  let appLink: string | null = null
  if (invitesOn()) {
    const inv = await createInvite(db, { hqId, userId: hqId, slug, name: brand.org }, { role: 'parent', familyId: fam.id as string, email: j.email })
    if (inv.ok) appLink = inv.link; else log('invite not made', { slug, error: inv.error })
  }
  // Settings → Modules → QR check-in. Off: the welcome email carries no family QR.
  const qrOn = moduleOn(settings, 'qr_checkin')
  const qr = qrOn ? await QRCode.toBuffer(fam.checkin_code as string, { type: 'png', width: 360, margin: 2, errorCorrectionLevel: 'M' }) : null
  const mail = welcomeEmail({ org: brand.org, guardian: j.guardian, children: j.children.map(c => c.name), venue, waitlisted, appLink, qrCid: qr ? 'family-qr' : null })
  const sent = await sendMail(j.email, mail, qr ? [{ filename: 'family-qr.png', content: qr, contentId: 'family-qr' }] : undefined)
  log('joined', { slug, children: j.children.length, waitlisted, emailed: sent, invite: !!appLink, qr: !!qr, health: j.consentHealth })
  return NextResponse.json({ ok: true })
}
