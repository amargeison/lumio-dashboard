'use client'

// Printable resources for the Resource Centre.
//
// A resource whose url is `lumio:<slug>` has real printable content — an A4 page
// a coach prints and takes on court, not a "preview coming soon" placeholder.
// Written to the Lumio Coach standard (src/lib/coach/agent-persona.ts): every
// page LEADS WITH THE DIAGNOSIS (the fault, why it matters, what it costs) and
// ends with a SUCCESS CRITERION the player can measure themselves against.
//
// Engine only — the content lives in resource-printable-content.ts so the library
// can grow without touching any rendering code.
//
// Anything without authored content still prints: renderFallback() builds a real
// page from the resource row itself. That is deliberate — it means the library is
// never broken while content is being written, and a coach never clicks into a
// dead end.

import { getSettings } from './settings-store'
import { PRINTABLE_CONTENT } from './resource-printable-content'

export const PRINT_PREFIX = 'lumio:'
export const isPrintable = (url?: string | null): boolean => !!url && url.startsWith(PRINT_PREFIX)
export const printSlug = (url?: string | null): string => (url || '').slice(PRINT_PREFIX.length)

export type Progression = { name: string; detail: string; reps?: string }
export type Fault = { fault: string; why: string; fix: string }
export type CourtZone = { x: number; y: number; w: number; h: number; label?: string; colour: string }

export type Printable = {
  kind?: 'drill' | 'plan' | 'worksheet'
  diagnosis: string           // the fault, why it matters, what it costs — always first
  objective?: string
  goal?: string
  setup?: string[]
  progressions?: Progression[]
  weeks?: { w: number | string; focus: string; main: string; measure: string }[]
  rows?: { label: string; detail: string; blank?: boolean }[]
  prompts?: { heading: string; hint?: string; lines?: number }[]
  cues?: string[]
  faults?: Fault[]
  success: string             // how the player knows they have got it
  progress?: string
  court?: { zones?: CourtZone[]; note?: string }
  notesLines?: number
}

export const RACKET_HEX: Record<string, string> = {
  white: '#9aa1b1', yellow: '#d9a91f', orange: '#f08a24', green: '#3fbf6a', blue: '#3A8EE0',
  purple: '#a855f7', brown: '#a06a3c', red: '#e0483f', black: '#2b2f3a',
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const line = (h = 20) => `<div style="border-bottom:1px dashed #b9bdca;height:${h}px;margin:6px 0"></div>`
const blanks = (n = 3) => Array.from({ length: n }).map(() => line()).join('')

// A tennis court drawn to scale, with optional shaded target zones. SVG rather
// than an image so it prints crisply and weighs nothing. Zone coords are
// fractions of the full court.
function court(c: { zones?: CourtZone[]; note?: string }): string {
  const W = 360, H = 560, m = 18, cw = W - m * 2, ch = H - m * 2
  const sx = (x: number) => m + x * cw, sy = (y: number) => m + y * ch
  const zones = (c.zones || []).map(k => `
    <rect x="${sx(k.x)}" y="${sy(k.y)}" width="${k.w * cw}" height="${k.h * ch}" fill="${k.colour}" fill-opacity="0.22" stroke="${k.colour}" stroke-width="1.5" stroke-dasharray="4 3" rx="3"/>
    ${k.label ? `<text x="${sx(k.x) + k.w * cw / 2}" y="${sy(k.y) + k.h * ch / 2 + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="${k.colour}">${esc(k.label)}</text>` : ''}`).join('')
  return `<svg viewBox="0 0 ${W} ${H}" width="240" style="display:block">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#f4f7f4" rx="6"/>
    <rect x="${m}" y="${m}" width="${cw}" height="${ch}" fill="#6ea77d" stroke="#fff" stroke-width="2.5"/>
    <line x1="${m}" y1="${m + ch / 2}" x2="${m + cw}" y2="${m + ch / 2}" stroke="#fff" stroke-width="3"/>
    <rect x="${m + cw * 0.115}" y="${m}" width="${cw * 0.77}" height="${ch}" fill="none" stroke="#fff" stroke-width="1.6"/>
    <rect x="${m + cw * 0.115}" y="${m + ch * 0.26}" width="${cw * 0.77}" height="${ch * 0.48}" fill="none" stroke="#fff" stroke-width="1.6"/>
    <line x1="${m + cw / 2}" y1="${m + ch * 0.26}" x2="${m + cw / 2}" y2="${m + ch * 0.74}" stroke="#fff" stroke-width="1.6"/>
    ${zones}
  </svg>${c.note ? `<div style="font-size:9.5px;color:#6b7280;margin-top:5px;max-width:240px">${esc(c.note)}</div>` : ''}`
}

const CSS = `*{box-sizing:border-box}
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

export type ResourceRow = {
  title?: string | null; category?: string | null; level?: string | null
  duration?: string | null; racket?: string | null; notes?: string | null; url?: string | null
}

function shell(r: ResourceRow, org: { academy: string; coach: string }, inner: string): string {
  const c = RACKET_HEX[(r.racket || '').toLowerCase()] || '#3A8EE0'
  const racket = r.racket ? `${r.racket.charAt(0).toUpperCase()}${r.racket.slice(1)} racket` : 'All rackets'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(r.title)} — ${esc(org.academy)}</title><style>${CSS}</style></head><body>
  <div class="page">
    <div class="band" style="background:linear-gradient(120deg, ${c}, ${c}bb)">
      <div>
        <div class="kicker">${esc(r.category || 'Resource')} · ${esc(org.academy)}</div>
        <h1>${esc(r.title)}</h1>
        <div class="meta">
          <span class="chip">${esc(racket)}</span>
          ${r.level ? `<span class="chip">${esc(r.level)}</span>` : ''}
          ${r.duration ? `<span class="chip">${esc(r.duration)}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;font-size:10px;opacity:.85;line-height:1.5">${esc(org.academy)}<br>${esc(org.coach)}</div>
    </div>
    ${inner}
    <div class="foot"><span>${esc(org.academy)} · ${esc(r.category || 'Resource')}</span><span>${esc(r.title)}</span></div>
  </div></body></html>`
}

function body(r: ResourceRow, d: Printable): string {
  const c = RACKET_HEX[(r.racket || '').toLowerCase()] || '#3A8EE0'
  const h = (t: string) => `<h2 style="color:${c}">${t}</h2>`
  const out: string[] = []

  out.push(`<div class="diag" style="border-color:${c};background:${c}0e">
    <div class="lbl" style="color:${c}">${d.kind === 'plan' ? 'The diagnosis — why this block is sequenced this way' : d.kind === 'worksheet' ? 'Why this matters' : 'The diagnosis — why this drill exists'}</div>
    <p style="margin:0">${esc(d.diagnosis)}</p></div>`)

  if (d.objective || d.goal) out.push(h(d.goal ? 'Goal for the block' : 'Objective') + `<p>${esc(d.goal || d.objective)}</p>`)

  if (d.setup?.length || d.progressions?.length) {
    const col = [
      d.setup?.length ? h('Set-up') + `<ul>${d.setup.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '',
      d.progressions?.length ? h('How it runs') + `<ol>${d.progressions.map(s => `<li><strong>${esc(s.name)}</strong> — ${esc(s.detail)}${s.reps ? ` <span style="color:#8b93a7">(${esc(s.reps)})</span>` : ''}</li>`).join('')}</ol>` : '',
    ].join('')
    out.push(d.court
      ? `<div class="two" style="margin-top:6px"><div class="col">${col}</div><div style="flex-shrink:0;padding-top:26px">${court(d.court)}</div></div>`
      : col)
  }

  if (d.weeks?.length) out.push(h('Week by week') + `<table><tr><th style="width:8%">Week</th><th style="width:22%">Focus</th><th>Main work</th><th style="width:26%">How we measure it</th></tr>${d.weeks.map(w => `<tr><td><strong>${esc(w.w)}</strong></td><td><strong>${esc(w.focus)}</strong></td><td>${esc(w.main)}</td><td style="color:#6b7280">${esc(w.measure)}</td></tr>`).join('')}</table>`)

  if (d.rows?.length) out.push(`<table><tr><th style="width:26%">Step</th><th>What it does</th><th style="width:30%">Your cue (write your own)</th></tr>${d.rows.map(x => `<tr><td><strong>${esc(x.label)}</strong></td><td>${esc(x.detail)}</td><td>&nbsp;</td></tr>`).join('')}</table>`)

  if (d.cues?.length) out.push(h('Coaching cues — what to say') + `<ul>${d.cues.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`)

  if (d.faults?.length) out.push(h('Common faults &amp; the fix') + `<table><tr><th style="width:32%">What you'll see</th><th style="width:28%">Why it matters</th><th>The correction</th></tr>${d.faults.map(f => `<tr><td><strong>${esc(f.fault)}</strong></td><td style="color:#6b7280">${esc(f.why)}</td><td>${esc(f.fix)}</td></tr>`).join('')}</table>`)

  for (const q of d.prompts || []) {
    out.push(h(esc(q.heading)) + (q.hint ? `<p style="font-size:11.5px;color:#6b7280;margin-bottom:2px">${esc(q.hint)}</p>` : '') + blanks(q.lines ?? 2))
  }

  out.push(`<div class="succ"><div class="lbl">${d.kind === 'plan' ? 'Exit test — the block is complete when' : "Success criterion — how the player knows they've got it"}</div><p style="margin:0">${esc(d.success)}</p></div>`)

  if (d.progress) out.push(h('Make it harder / easier') + `<p>${esc(d.progress)}</p>`)
  if (d.notesLines) out.push(h(d.kind === 'plan' ? "Coach's running notes" : 'Session notes') + blanks(d.notesLines))
  return out.join('')
}

// No authored content yet: still print something real and useful, built from the
// resource row. Better than a dead link, and it degrades to this automatically as
// the library grows faster than the content behind it.
function fallback(r: ResourceRow): Printable {
  return {
    diagnosis: r.notes || 'Use this resource alongside the session it was set for.',
    success: 'Agree the measure with your coach at the start of the session and write it at the top of this sheet.',
    prompts: [
      { heading: 'What we are working on', hint: 'The one thing that matters most this session.', lines: 2 },
      { heading: 'Drills and reps', lines: 4 },
      { heading: 'What to take away', hint: 'The cue to remember, and what to practise before next time.', lines: 3 },
    ],
  }
}

// Build the full HTML for a resource. Exported so it can be tested without a DOM.
export function renderPrintable(r: ResourceRow, org?: { academy?: string; coach?: string }): string {
  const s = getSettings()
  const o = {
    academy: org?.academy || s.academy || 'Lumio Tennis',
    coach: [org?.coach || s.coach, s.cert].filter(Boolean).join(' · ') || 'Your coach',
  }
  const content = PRINTABLE_CONTENT[printSlug(r.url)] || fallback(r)
  return shell(r, o, body(r, content))
}

// Open the printable in a new tab. Same approach as the welcome pack: write the
// document and let the coach print or save as PDF from the browser.
export function openPrintable(r: ResourceRow, org?: { academy?: string; coach?: string }): void {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank')
  if (!w) return                       // popup blocked — caller shows a message
  w.document.write(renderPrintable(r, org))
  w.document.close()
}
