// The printed booklet's PDF: the rules both ends share. The bucket is private and the
// path comes from the org, never from a stored or submitted value. No database here.

import { stockLines, type PackData } from './packs'

export const BOOKLET_BUCKET = 'impact-booklets'
export const MAX_BOOKLET_PDF_BYTES = 10 * 1024 * 1024
/** How long a link works. Long enough to open it, not long enough to pass around. */
export const SIGNED_URL_SECONDS = 300

export const bookletPath = (hqId: string) => `${hqId}/booklet.pdf`
export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

/** Why this file can't be the booklet, or null if it can. The bytes decide, not the name. */
export function pdfProblem(size: number, type: string, head: Uint8Array): string | null {
  if (size === 0) return 'That file is empty.'
  if (size > MAX_BOOKLET_PDF_BYTES) return 'That PDF is over the 10 MB limit.'
  const isPdf = String.fromCharCode(...head.slice(0, 5)) === '%PDF-'
  return type === 'application/pdf' && isPdf ? null : 'That file isn’t a PDF.'
}

/** "3.3 MB" */
export const pdfSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

/** The booklet stock line for Equipment. Booklets are an ordinary pack item. */
export function printKitLine(p: PackData): { text: string; low: boolean } {
  const lines = stockLines(p).filter(l => l.item.active && /booklet/i.test(l.item.name))
  if (!lines.length) return { text: 'Print kit: no booklet in your welcome pack items yet', low: false }
  const qty = lines.reduce((n, l) => n + l.qty, 0)
  return { text: `Print kit: ${qty} ${qty === 1 ? 'booklet' : 'booklets'} in stock`, low: lines.some(l => l.low) }
}
