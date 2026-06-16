'use client'

// Generates a printable / saveable A4 drill sheet for any drill in the
// DRILL_LIBRARY: branded band, set-up, a court diagram, four progressive
// levels, a coaching cue and belt/level/tags. Mirrors the ResourceDocs look.

import { BELTS, COACH_ORG, drillLevel, type Drill, type DrillCourt } from '../_lib/coach-data'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const belt = (id: string) => BELTS.find(b => b.id === id)
const beltName = (id: string) => belt(id)?.name ?? ''

const DRILL_CSS = `
  *{box-sizing:border-box}
  body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
  .band{background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:20px 24px}
  .band .meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;font-size:11px;opacity:.92}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  p{font-size:12.5px;line-height:1.6;color:#374151}
  ol{margin:0;padding-left:22px}ol li{font-size:12.5px;line-height:1.6;color:#374151;margin-bottom:7px}
  .lvl{display:inline-block;font-weight:700;color:#5b21b6}
  .accentbox{border:1px solid #ead9ff;border-left:4px solid #a855f7;border-radius:0 10px 10px 0;background:#f7f4ff;padding:12px 16px;margin-top:12px;font-size:12.5px;color:#374151}
  .chip{display:inline-block;font-size:10.5px;background:#faf7ff;border:1px solid #ead9ff;color:#5b21b6;border-radius:7px;padding:3px 9px;margin:0 6px 6px 0}
  .courtwrap{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
  .courtwrap .col{flex:1;min-width:240px}
  .diagram{text-align:center;background:#f6f7f9;border:1px solid #ecedf2;border-radius:12px;padding:12px}
  .legend{font-size:10px;color:#6b7280;margin-top:6px}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
  @page{size:A4;margin:0}
`

// Shared court outline (horizontal orientation; net is the centre vertical).
const baseCourt = `
  <rect x="20" y="15" width="240" height="120" fill="none" stroke="#6b7280" stroke-width="1.5"/>
  <line x1="20" y1="30" x2="260" y2="30" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="120" x2="260" y2="120" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="80" y1="30" x2="80" y2="120" stroke="#9ca3af" stroke-width="1"/>
  <line x1="200" y1="30" x2="200" y2="120" stroke="#9ca3af" stroke-width="1"/>
  <line x1="80" y1="75" x2="200" y2="75" stroke="#9ca3af" stroke-width="1"/>
  <line x1="140" y1="10" x2="140" y2="140" stroke="#4b5563" stroke-width="2"/>
`
const fill = '#a855f7'
const zone = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="0.26"/>`
const dot = (x: number, y: number, r = 4, c = fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`
const lbl = (x: number, y: number, t: string) => `<text x="${x}" y="${y}" font-size="8.5" fill="#5b21b6" text-anchor="middle">${t}</text>`

const OVERLAYS: Record<DrillCourt, { svg: string; legend: string }> = {
  rally: {
    svg: zone(22, 17, 52, 42) + zone(206, 91, 52, 42) + lbl(48, 41, 'Target') + lbl(232, 116, 'Target'),
    legend: 'Shaded = deep cross-court target zones',
  },
  baseline: {
    svg: zone(22, 17, 34, 116) + zone(224, 17, 34, 116) + lbl(39, 78, 'Depth') + lbl(241, 78, 'Depth'),
    legend: 'Shaded = back-third depth zones',
  },
  serve: {
    svg: dot(150, 40) + dot(150, 75) + dot(150, 112) + lbl(165, 43, 'Wide') + lbl(165, 78, 'Body') + lbl(160, 115, 'T'),
    legend: 'Dots = wide / body / T serve targets',
  },
  net: {
    svg: dot(110, 75, 5, '#4b5563') + lbl(110, 92, 'Net') + zone(206, 17, 52, 42) + zone(206, 91, 52, 42) + lbl(232, 41, 'Volley') + lbl(232, 116, 'Volley'),
    legend: 'Dot = closing position · shaded = deep volley targets',
  },
  movement: {
    svg: dot(40, 35) + dot(40, 115) + dot(240, 35) + dot(240, 115) + dot(140, 75, 6, '#7c3aed') + lbl(140, 95, 'Recover'),
    legend: 'Cones = movement points · centre = recovery cone',
  },
  target: {
    svg: zone(146, 30, 28, 90) + lbl(160, 78, 'Drop') + zone(232, 17, 26, 116) + lbl(245, 78, 'Lob'),
    legend: 'Short zone = drop target · deep zone = lob target',
  },
  fullcourt: {
    svg: dot(60, 75, 4, '#7c3aed') + dot(220, 75, 4, '#7c3aed') + lbl(60, 95, 'You') + lbl(220, 95, 'Opp.'),
    legend: 'Full court — construct and finish the point',
  },
}

function diagram(court: DrillCourt): string {
  const o = OVERLAYS[court]
  return `
    <div class="diagram">
      <svg width="300" height="160" viewBox="0 0 280 150" xmlns="http://www.w3.org/2000/svg">
        ${baseCourt}
        ${o.svg}
      </svg>
      <div class="legend">${o.legend}</div>
    </div>`
}

export function openDrill(d: Drill) {
  if (typeof window === 'undefined') return
  const b = belt(d.belt)
  const levels = d.levels.map((l, i) => `<li><span class="lvl">Level ${i + 1}:</span> ${esc(l)}</li>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(d.focus)} — drill</title><style>${DRILL_CSS}</style></head><body>
  <div class="page">
    <div class="band">
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Drill · ${esc(d.category)}</div>
      <div style="font-size:25px;font-weight:800;margin-top:4px">${esc(d.focus)}</div>
      <div class="meta">
        <span>${esc(drillLevel(d.belt))}</span>
        <span>${esc(beltName(d.belt))} racket${b ? ' — ' + esc(b.theme) : ''}</span>
        <span>${esc(COACH_ORG.academy)}</span>
      </div>
    </div>

    <div class="courtwrap" style="margin-top:18px">
      <div class="col">
        <h2 style="margin-top:0">Set-up</h2>
        <p>${esc(d.setup)}</p>
      </div>
      <div class="col" style="max-width:320px">${diagram(d.court)}</div>
    </div>

    <h2>Progressions</h2>
    <ol>${levels}</ol>

    <div class="accentbox"><strong>Coaching cue:</strong> ${esc(d.cue)}</div>

    <div style="margin-top:16px">${d.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
    <div class="foot"><span>${esc(COACH_ORG.academy)} · ${esc(COACH_ORG.cert)}</span><span>Lumio Coach · Drill Library</span></div>
  </div>
  </body></html>`

  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to open this drill.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
}
