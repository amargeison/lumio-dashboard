// Files a coach attaches to their own resources — a PDF drill sheet, a
// worksheet, a slide deck.
//
// A resource's `url` column holds one of:
//   https://…      an external link (YouTube, a Google Doc…)
//   lumio:<slug>   one of Lumio's own printables
//   file:<path>    a file the coach uploaded, in the private coach-media bucket
//                  under <academyId>/resources/…
// Anything else — typically "handbook.pdf" typed into an import spreadsheet —
// is not a link at all, and used to render as a link that 404'd. Such a
// resource is treated as "no file yet" so the card offers to add one.
//
// No imports: used by the portal, the player app and the server routes alike.

export const RESOURCE_FILE_PREFIX = 'file:'

export const RESOURCE_FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt'
export const RESOURCE_FILE_MAX_MB = 25

export const isResourceFile = (url?: string | null) => !!url && url.startsWith(RESOURCE_FILE_PREFIX)

// A bare filename ("handbook.pdf") looks like a domain to a pattern, so it is
// ruled out first: it names a file that was never uploaded, not a website.
const BARE_FILE = /^[^/]+\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|gif|txt|csv)$/i
const DOMAIN_LIKE = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i

/**
 * A web link as people actually type it, made into one a browser can follow.
 * "riverside.co.uk/handbook" has no https://, so a browser treats it as a page
 * on OUR site and it 404s — the commonest reason an imported link "broke".
 * Returns null for anything that is not a web address at all.
 */
export function normaliseWebLink(url?: string | null): string | null {
  const u = (url || '').trim()
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  if (BARE_FILE.test(u)) return null
  if (DOMAIN_LIKE.test(u)) return `https://${u}`
  return null
}

/** Where a resource opens, or null when it has nothing to open yet. */
export function resourceHref(url?: string | null): string | null {
  const u = (url || '').trim()
  if (!u) return null
  if (u.startsWith(RESOURCE_FILE_PREFIX)) return `/api/coach/resources/file?path=${encodeURIComponent(u.slice(RESOURCE_FILE_PREFIX.length))}`
  return normaliseWebLink(u)
}

/** The file's own name, for "✓ drill-sheet.pdf attached". */
export function resourceFileName(url?: string | null): string {
  if (!isResourceFile(url)) return ''
  const last = String(url).split('/').pop() || ''
  // Stored as <uuid8>-<original name>; show the original.
  return decodeURIComponent(last.replace(/^[0-9a-f]{8}-/, ''))
}
