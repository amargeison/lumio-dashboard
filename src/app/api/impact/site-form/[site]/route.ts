import { NextRequest, NextResponse } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { parseSiteForm, siteFormBot, siteFormConfig, siteFormEmail, type SiteFormConfig } from '@/lib/impact/site-form'

export const runtime = 'nodejs'

// POST /api/impact/site-form/<site>: the contact form on a static website we host. No
// session. The site must be set up in IMPACT_SITE_FORMS (see site-form.ts), which fixes the
// inbox, the sending address and the name shown. Nothing the visitor types decides where
// the email goes; their address is only the reply-to. Nothing is stored.
//
// Spam: a hidden field and a minimum fill time (a suspected bot gets the same { ok: true }
// and nothing is sent), rate limits per IP and per site, and a size cap.

const MAX_BODY = 20_000
const log = (stage: string, extra: Record<string, unknown> = {}) => console.info('[site-form]', stage, extra)

function cors(req: NextRequest, site: SiteFormConfig | null): Record<string, string> {
  const origin = req.headers.get('origin')
  return origin && site?.origins.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {}
}

export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ site: string }> }) {
  const { site } = await params
  return new NextResponse(null, { status: 204, headers: cors(req, siteFormConfig(site, process.env.IMPACT_SITE_FORMS)) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ site: string }> }) {
  const { site: slug } = await params
  const site = siteFormConfig(slug, process.env.IMPACT_SITE_FORMS)
  const headers = cors(req, site)
  const reply = (body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...headers, ...extra } })
  if (!site) return reply({ error: 'This form isn’t available. Please email us instead.' }, 404)

  const ip = clientIp(req.headers)
  for (const [key, limit, ms] of [[`site-form:${ip}`, 5, 10 * 60_000], [`site-form-day:${ip}`, 20, 24 * 60 * 60_000], [`site-form-site:${slug}`, 100, 60 * 60_000]] as const) {
    const gate = rateLimit(key, limit, ms)
    if (!gate.ok) { log('rate limited', { site: slug }); return reply({ error: 'Too many messages from here just now. Please try again later, or email us.' }, 429, { 'Retry-After': String(gate.retryAfterSeconds) }) }
  }
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return reply({ error: 'That message is too long.' }, 413)
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return reply({ error: 'Please fill in the form and try again.' }, 400)
  if (siteFormBot(body, Date.now())) { log('bot', { site: slug }); return reply({ ok: true }) }
  const parsed = parseSiteForm(body)
  if (!parsed.ok) return reply({ error: parsed.error, field: parsed.field }, 400)

  if (!process.env.RESEND_API_KEY) { log('not sent: no Resend key', { site: slug }); return reply({ error: 'The message couldn’t be sent. Please email us instead.' }, 503) }
  const page = req.headers.get('referer')
  const mail = siteFormEmail(site, parsed.value, page && /^https:\/\//.test(page) ? page.split('?')[0].slice(0, 300) : undefined)
  try {
    const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: `${site.name} <${site.from}>`, to: site.to, replyTo: parsed.value.email, subject: mail.subject, html: mail.html, text: mail.text })
    if (error) { log('send failed', { site: slug, error: error.message }); return reply({ error: 'The message couldn’t be sent. Please try again, or email us.' }, 502) }
  } catch (e) {
    log('send failed', { site: slug, error: e instanceof Error ? e.message : String(e) })
    return reply({ error: 'The message couldn’t be sent. Please try again, or email us.' }, 502)
  }
  log('sent', { site: slug, to: `@${site.to.split('@')[1]}` })
  return reply({ ok: true })
}
