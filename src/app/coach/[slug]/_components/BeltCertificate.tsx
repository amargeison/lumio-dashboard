'use client'

// Printable belt-award certificate — the belt equivalent of the camp
// certificate. Award the player's current belt and list the skills mastered.

import { BELTS, COACH_ORG, type Player } from '../_lib/coach-data'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function printBeltCertificate(player: Player, beltIndex: number) {
  if (typeof window === 'undefined') return
  const belt = BELTS[beltIndex]
  const skills = belt.skills.map(s => `<span class="chip">${esc(s.name)}</span>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(belt.name)} Racket — ${esc(player.name)}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:210mm;min-height:296mm;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center}
    .chip{display:inline-block;font-size:11px;background:#faf7ff;border:1px solid #ead9ff;color:#5b21b6;border-radius:20px;padding:4px 12px;margin:0 5px 8px}
    @page{size:A4;margin:0}
  </style></head><body>
  <div class="page">
    <div style="position:absolute;inset:10mm;border:2px solid ${belt.colour};border-radius:8px;opacity:.9"></div>
    <div style="position:absolute;inset:13mm;border:1px solid #e3c97a;border-radius:6px"></div>
    <div style="position:absolute;font-size:340px;opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%)">🎾</div>
    <div style="text-align:center;padding:28mm 24mm;position:relative;max-width:170mm">
      <div style="font-size:12px;letter-spacing:.5em;color:#a855f7;font-weight:700;text-transform:uppercase">Lumio Tennis Academy</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:40px;letter-spacing:.04em;margin-top:14px;color:#1a1d29">Racket Award</div>
      <div style="width:70px;height:3px;background:${belt.colour};margin:14px auto 20px;border:1px solid rgba(0,0,0,.15)"></div>
      <div style="font-size:13px;color:#6b7280">This certifies that</div>
      <div style="font-family:Georgia,serif;font-size:44px;color:#7c3aed;margin:8px 0 4px;font-weight:600">${esc(player.name)}</div>
      <div style="font-size:14px;color:#374151;margin-top:8px">has been awarded the</div>

      <div style="display:inline-flex;align-items:center;gap:14px;margin:16px 0 6px">
        <span style="width:54px;height:34px;border-radius:5px;background:${belt.colour};border:1px solid rgba(0,0,0,.25);box-shadow:0 3px 10px rgba(0,0,0,.18)"></span>
        <span style="font-family:Georgia,serif;font-size:34px;font-weight:700;color:#1a1d29">${esc(belt.name)} Racket</span>
      </div>
      <div style="font-size:13px;color:#6b7280;font-style:italic">${esc(belt.theme)}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:8px">Awarded with the coloured racket keyring &amp; matching dampener</div>

      <div style="margin:20px auto 0;max-width:150mm">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9099ad;margin-bottom:8px">Skills mastered</div>
        ${skills}
      </div>

      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:30px;padding:0 6mm">
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:21px;color:#1a1d29">${esc(COACH_ORG.coach)}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Head Coach · ${esc(COACH_ORG.cert)}</div>
        </div>
        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#F4D77B,#C9A227);box-shadow:0 5px 16px rgba(201,162,39,.45);display:flex;align-items:center;justify-content:center;color:#5a4710;font-weight:800;font-size:11px;text-align:center;line-height:1.1;border:3px solid #fff;outline:2px solid #C9A227">RACKET<br/>EARNED</div>
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-size:17px;color:#1a1d29">${esc(COACH_ORG.date.replace(/^\w+,\s*/, ''))}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Date awarded</div>
        </div>
      </div>
      <div style="margin-top:24px;font-size:10px;color:#aab;letter-spacing:.1em">LUMIO COACH · lumiosports.com</div>
    </div>
  </div>
  </body></html>`

  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the certificate.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual print */ } }, 350)
}
