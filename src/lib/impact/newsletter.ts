// Newsletters: the sections an HQ builds, checked, and the email they turn into. Pure, so
// the builder's preview, "Send me a test" and the real send render exactly the same HTML.
//
// A section is a headline, a body (blank lines make paragraphs), an optional image and an
// optional button. Links and images must be https. The footer is always added and can't
// be edited away: the org's postal address, who sent it, and the family's own
// unsubscribe link (or, in the preview and the test, a placeholder that goes nowhere).

export interface NewsletterSection {
  headline: string
  body: string
  image?: { url: string; alt: string } | null
  button?: { label: string; url: string } | null
}

export interface NewsletterDraft { subject: string; preheader: string; sections: NewsletterSection[] }

export const LIMITS = { subject: 150, preheader: 150, headline: 120, body: 2500, sections: 8, label: 40, url: 500, alt: 120 }

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const line = (v: unknown, max: number) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max)
const httpsUrl = (v: unknown) => { const s = String(v ?? '').trim(); try { return new URL(s).protocol === 'https:' && s.length <= LIMITS.url ? s : null } catch { return null } }

/** Sections as saved: trimmed, capped, https only. Anything unusable is dropped, never guessed. */
export function cleanSections(raw: unknown): NewsletterSection[] {
  return (Array.isArray(raw) ? raw : []).slice(0, LIMITS.sections).map(r => {
    const s = (r ?? {}) as Record<string, unknown>
    const img = (s.image ?? null) as Record<string, unknown> | null
    const btn = (s.button ?? null) as Record<string, unknown> | null
    const imageUrl = img ? httpsUrl(img.url) : null
    const buttonUrl = btn ? httpsUrl(btn.url) : null
    return {
      headline: line(s.headline, LIMITS.headline),
      body: String(s.body ?? '').replace(/\r/g, '').trim().slice(0, LIMITS.body),
      image: imageUrl ? { url: imageUrl, alt: line(img!.alt, LIMITS.alt) } : null,
      button: buttonUrl && line(btn!.label, LIMITS.label) ? { label: line(btn!.label, LIMITS.label), url: buttonUrl } : null,
    }
  }).filter(s => s.headline || s.body || s.image)
}

/** What stops this newsletter being sent, in plain words, or null. */
export function draftProblem(d: { subject?: string | null; sections: NewsletterSection[] }): string | null {
  if (!line(d.subject, LIMITS.subject)) return 'Add a subject line.'
  if (!d.sections.length) return 'Add at least one section.'
  if (!d.sections.some(s => s.body.trim())) return 'Write something in at least one section.'
  return null
}

export interface NewsletterFooter { org: string; address: string | null; sender: string | null }

const paragraphs = (body: string) => body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p style="margin:0 0 12px;">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')

export function renderNewsletter(d: NewsletterDraft, footer: NewsletterFooter, unsubscribeUrl: string | null): { html: string; text: string } {
  const sections = d.sections.map(s => [
    s.image ? `<img src="${esc(s.image.url)}" alt="${esc(s.image.alt)}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:8px;margin:0 0 12px;">` : '',
    s.headline ? `<h2 style="font-size:19px;line-height:1.3;margin:0 0 8px;color:#111;">${esc(s.headline)}</h2>` : '',
    paragraphs(s.body),
    s.button ? `<p style="margin:4px 0 0;"><a href="${esc(s.button.url)}" style="display:inline-block;background:#111;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">${esc(s.button.label)}</a></p>` : '',
  ].join('')).map(inner => `<tr><td style="padding:18px 22px;border-bottom:1px solid #eee;">${inner}</td></tr>`).join('')

  const unsub = unsubscribeUrl
    ? `<a href="${esc(unsubscribeUrl)}" style="color:#6b7280;">Unsubscribe</a>`
    : `<span style="text-decoration:underline;">Unsubscribe</span> (each family gets its own link)`
  const foot = [
    `Sent by ${esc(footer.org)}${footer.sender ? ` from ${esc(footer.sender)}` : ''}.`,
    footer.address ? esc(footer.address) : '',
    `You’re getting this because you’re a family with ${esc(footer.org)}. ${unsub}`,
  ].filter(Boolean).map(t => `<p style="margin:0 0 6px;">${t}</p>`).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.subject)}</title></head>`
    + `<body style="margin:0;padding:0;background:#f4f2ef;">`
    + `<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(d.preheader)}</span>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;"><tr><td align="center" style="padding:16px 8px;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:564px;background:#fff;border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;">`
    + sections
    + `<tr><td style="padding:16px 22px;font-size:12px;line-height:1.5;color:#6b7280;">${foot}</td></tr>`
    + `</table></td></tr></table></body></html>`

  const text = [
    ...d.sections.map(s => [s.headline, s.body, s.button ? `${s.button.label}: ${s.button.url}` : ''].filter(Boolean).join('\n\n')),
    `—\nSent by ${footer.org}${footer.sender ? ` from ${footer.sender}` : ''}.${footer.address ? `\n${footer.address}` : ''}\nUnsubscribe: ${unsubscribeUrl ?? '(each family gets its own link)'}`,
  ].join('\n\n')
  return { html, text }
}

/** The org's postal address for the footer, from Settings → Organisation. */
export const footerAddress = (s: { legal?: string; address?: string; town?: string }) =>
  [s.address, s.town].map(x => (x ?? '').trim()).filter(Boolean).join(', ') || null
