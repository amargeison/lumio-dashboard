// Contact forms on the static websites we host (e.g. a charity's site on our server).
// Generic: which sites exist, which inbox each one's messages go to, the address they're
// sent from and the name they show are all server config (IMPACT_SITE_FORMS), not code,
// so a site moving to its own domain or sending address is a config change only.
//
//   IMPACT_SITE_FORMS='{"<site>":{"to":"inbox@example.org","from":"impact@lumiosports.com",
//                       "name":"Example Charity","origins":["https://www.example.org"]}}'
//
// "origins" lists the other web addresses the site's pages may post from (cross-origin).
// Pages served from our own domains post same-origin and need no entry.

export interface SiteFormConfig { to: string; from: string; name: string; origins: string[] }

const SITE_RE = /^[a-z0-9][a-z0-9-]{0,62}$/
const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/

/** The config for one site, or null if it isn't set up (or the config is broken). */
export function siteFormConfig(site: string, raw: string | undefined): SiteFormConfig | null {
  if (!SITE_RE.test(site)) return null
  try {
    const c = (JSON.parse(raw || '{}') as Record<string, unknown>)[site] as Record<string, unknown> | undefined
    if (!c || typeof c !== 'object') return null
    const to = typeof c.to === 'string' ? c.to.trim() : '', from = typeof c.from === 'string' ? c.from.trim() : ''
    const name = typeof c.name === 'string' ? c.name.replace(/["<>\\\r\n]/g, '').trim().slice(0, 80) : ''
    if (!EMAIL_RE.test(to) || !EMAIL_RE.test(from) || !name) return null
    const origins = Array.isArray(c.origins) ? c.origins.filter((o): o is string => typeof o === 'string' && /^https:\/\/[a-z0-9.-]+$/i.test(o)) : []
    return { to, from, name, origins }
  } catch {
    return null
  }
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '').slice(0, max)
const oneLine = (v: unknown, max: number) => clean(v, max).replace(/\s+/g, ' ')

export interface SiteFormMessage { name: string; email: string; org: string; message: string }

/** A bot fills the hidden "website" field, or submits faster than a person could (or without the page's timer). */
export const siteFormBot = (body: Record<string, unknown>, now: number) =>
  !!clean(body.website, 200) || !(Number(body.startedAt) > 0) || now - Number(body.startedAt) < 3000

export function parseSiteForm(body: Record<string, unknown>): { ok: true; value: SiteFormMessage } | { ok: false; error: string; field: string } {
  const name = oneLine(body.name, 100), email = oneLine(body.email, 200).toLowerCase(), org = oneLine(body.org, 150)
  const message = clean(body.message, 5000)
  if (!name) return { ok: false, error: 'Please tell us your name.', field: 'name' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please check your email address.', field: 'email' }
  if (message.length < 2) return { ok: false, error: 'Please write a message.', field: 'message' }
  return { ok: true, value: { name, email, org, message } }
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** The email to the site's inbox. Reply goes straight to the person who wrote. */
export function siteFormEmail(site: SiteFormConfig, m: SiteFormMessage, pageUrl?: string) {
  const subject = `Website message from ${m.name}`.slice(0, 150)
  const rows: [string, string][] = [['Name', m.name], ['Email', m.email], ...(m.org ? [['Organisation', m.org] as [string, string]] : [])]
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${m.message}\n\n— Sent from the contact form on the ${site.name} website${pageUrl ? ` (${pageUrl})` : ''}. Reply to this email to answer ${m.name}.`
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;">`
    + `<table style="border-collapse:collapse;margin-bottom:14px;">${rows.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7280;">${k}</td><td style="padding:2px 0;">${esc(v)}</td></tr>`).join('')}</table>`
    + `<div style="white-space:pre-wrap;border-left:3px solid #e5e7eb;padding-left:12px;">${esc(m.message)}</div>`
    + `<p style="color:#6b7280;font-size:12px;margin-top:18px;">Sent from the contact form on the ${esc(site.name)} website. Reply to this email to answer ${esc(m.name)}.</p></div>`
  return { subject, text, html }
}
