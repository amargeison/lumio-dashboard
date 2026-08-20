'use client'

// Shared print styling for everything Lumio prints — resource cards, camp briefs,
// run-sheets, player reports.
//
// Extracted because the welcome pack, the resource printables and the camp
// printables were each about to carry their own copy of the same 40 lines of CSS.
// That duplication is precisely how the live welcome pack lost its logo for
// months without anyone noticing: two copies of one document, one of which
// quietly drifted. One kit, one house style.

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const dashLine = (h = 20) => `<div style="border-bottom:1px dashed #b9bdca;height:${h}px;margin:6px 0"></div>`
export const dashLines = (n = 3) => Array.from({ length: n }).map(() => dashLine()).join('')

export const PRINT_CSS = `*{box-sizing:border-box}
body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#eceef3}
.page{width:210mm;min-height:296mm;padding:16mm 15mm;margin:0 auto 14px;position:relative;background:#fff;page-break-after:always}
.page:last-child{page-break-after:auto}
.band{color:#fff;border-radius:14px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.kicker{font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;opacity:.85}
h1{font-size:26px;font-weight:800;margin:6px 0 0;line-height:1.15}
.meta{opacity:.92;margin-top:6px;font-size:12px}
.chip{display:inline-block;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:3px 10px;font-size:10.5px;font-weight:600;margin-right:5px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.07em;margin:20px 0 7px;padding-bottom:5px;border-bottom:2px solid #ecedf2}
p{font-size:12.5px;line-height:1.65;color:#374151;margin:0 0 8px}
ul,ol{margin:0;padding-left:19px}li{font-size:12px;line-height:1.6;color:#374151;margin-bottom:5px}
.diag{border-left:4px solid;border-radius:0 10px 10px 0;padding:12px 16px;margin-top:12px}
.diag .lbl{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:5px}
.two{display:flex;gap:20px;align-items:flex-start}.two .col{flex:1;min-width:0}
table{width:100%;border-collapse:collapse;margin-top:6px}
td,th{font-size:11.5px;padding:7px 9px;border-bottom:1px solid #f0f1f6;text-align:left;vertical-align:top}
th{color:#8b93a7;font-size:9px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.succ{background:#f1faf4;border:1px solid #cdebd8;border-left:4px solid #3fbf6a;border-radius:0 10px 10px 0;padding:12px 16px;margin-top:12px}
.succ .lbl{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#2f9d57;margin-bottom:5px}
.foot{position:absolute;bottom:11mm;left:15mm;right:15mm;display:flex;justify-content:space-between;font-size:8.5px;color:#aab;border-top:1px solid #eee;padding-top:7px}
@page{size:A4;margin:0}
@media print{body{background:#fff}.page{margin:0}}`

// Session-type colours, shared between the on-screen itinerary and every printed
// version of it — so a coach reading a run-sheet on paper sees the same colour
// coding they saw on screen.
export const SESSION_COLOUR: Record<string, string> = {
  Technical: '#3A8EE0', Tactical: '#a855f7', Physical: '#e0483f', 'Match play': '#3fbf6a',
  Video: '#d9a91f', Recovery: '#5bc0be', Social: '#f08a24', Briefing: '#8b93a7', Logistics: '#8b93a7',
}

export type PrintOrg = { academy: string; coach: string; logoUrl?: string | null; accent?: string }

// One page wrapper — coloured band, title, chips, footer. Every Lumio printable
// uses this so they read as one family rather than as separate documents.
export function printPage(o: {
  org: PrintOrg; kicker: string; title: string; chips?: string[]; accent?: string; body: string; footNote?: string
}): string {
  const c = o.accent || o.org.accent || '#3A8EE0'
  return `<div class="page">
    <div class="band" style="background:linear-gradient(120deg, ${c}, ${c}bb)">
      <div>
        <div class="kicker">${esc(o.kicker)}</div>
        <h1>${esc(o.title)}</h1>
        ${o.chips?.length ? `<div class="meta">${o.chips.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
      </div>
      ${o.org.logoUrl ? `<img src="${esc(o.org.logoUrl)}" alt="" width="58" style="max-width:58px;background:#fff;border-radius:10px;padding:8px;flex-shrink:0">` : ''}
    </div>
    ${o.body}
    <div class="foot"><span>${esc(o.org.academy)}${o.org.coach ? ` · ${esc(o.org.coach)}` : ''}</span><span>${esc(o.footNote || o.title)}</span></div>
  </div>`
}

// Open a print window with one or more pages. Returns false if the popup was
// blocked, so the caller can tell the coach rather than appearing to do nothing.
export function openPrintDoc(title: string, pagesHtml: string): boolean {
  if (typeof window === 'undefined') return false
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${pagesHtml}</body></html>`)
  w.document.close()
  return true
}
