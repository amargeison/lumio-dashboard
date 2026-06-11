'use client'

// Generates real, printable/saveable documents for non-video Resource Centre
// items (PDFs, training plans, worksheets). Each known resource has authored
// content; anything else gets a sensible generic document.

import { BELTS, COACH_ORG, type Resource } from '../_lib/coach-data'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const beltName = (id?: string) => id ? (BELTS.find(b => b.id === id)?.name ?? '') : ''

const DOC_CSS = `
  *{box-sizing:border-box}
  body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
  .band{background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:20px 24px}
  .band .meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;font-size:11px;opacity:.92}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  p{font-size:12.5px;line-height:1.6;color:#374151}
  ul,ol{margin:0;padding-left:20px}li{font-size:12.5px;line-height:1.65;color:#374151;margin-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:#9099ad;padding:7px 8px;border-bottom:2px solid #ecedf2;vertical-align:top}
  td{font-size:11.5px;padding:7px 8px;border-bottom:1px solid #f0f1f6;vertical-align:top;color:#374151}
  .box{border:1px solid #ecedf2;border-radius:10px;padding:12px 16px;background:#fafafe;font-size:12.5px;color:#374151;margin-top:8px}
  .accentbox{border:1px solid #ead9ff;border-left:4px solid #a855f7;border-radius:0 10px 10px 0;background:#f7f4ff;padding:12px 16px;margin-top:10px}
  .chip{display:inline-block;font-size:10.5px;background:#faf7ff;border:1px solid #ead9ff;color:#5b21b6;border-radius:7px;padding:3px 9px;margin:0 6px 6px 0}
  .fill{border-bottom:1px dashed #c9cdd9;min-height:18px;margin:6px 0}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
  @page{size:A4;margin:0}
`

function generic(r: Resource): string {
  return `
    <h2>About this resource</h2>
    <p>${esc(r.desc)}</p>
    <h2>How to use it</h2>
    <ul>
      <li>Set up before the player arrives so court time is spent on the activity, not admin.</li>
      <li>Explain the goal in one sentence, demonstrate once, then let them try.</li>
      <li>Use a clear success target before progressing to the next level.</li>
      <li>Finish with one thing to keep and one thing to improve.</li>
    </ul>
    <div class="accentbox"><strong>Belt focus:</strong> ${r.belt ? esc(beltName(r.belt)) + ' belt — ' : ''}${esc(r.tags.join(', '))}</div>
    <h2>Coach notes</h2>
    <div class="fill"></div><div class="fill"></div><div class="fill"></div>`
}

const BODY: Record<string, string> = {
  // 8-week Green-belt block (training plan)
  r4: `
    <h2>Overview</h2>
    <p>An 8-week block to take a player to the Green-belt serve criteria: a repeatable service motion, the ball in the box from the baseline 7/10, and three placements on demand (wide, body, T).</p>
    <h2>Weekly plan</h2>
    <table>
      <thead><tr><th style="width:60px">Week</th><th>Focus</th><th>Key session</th><th>Success measure</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Toss &amp; trophy</td><td>Toss-and-catch, shadow serves, serve from service line</td><td>Consistent toss to a wall mark 8/10</td></tr>
        <tr><td>2</td><td>Continental grip</td><td>Edge-of-racket feeds, throw drills</td><td>Holds continental through contact</td></tr>
        <tr><td>3</td><td>Contact &amp; reach</td><td>Serve from service line to baseline progression</td><td>In the box from baseline 5/10</td></tr>
        <tr><td>4</td><td>Rhythm</td><td>Smooth motion, no pauses, count rhythm</td><td>In the box from baseline 6/10</td></tr>
        <tr><td>5</td><td>Targets — wide</td><td>Cones in the wide corner, deuce &amp; ad</td><td>Hits wide target 4/10</td></tr>
        <tr><td>6</td><td>Targets — body / T</td><td>Cone ladder to body and T</td><td>Two placements on demand</td></tr>
        <tr><td>7</td><td>Serve + rally</td><td>Serve then play out the point</td><td>In the box 7/10 under rally pressure</td></tr>
        <tr><td>8</td><td>Belt assessment</td><td>Criteria test + first-serve game</td><td>Meets Green-belt serve criteria ✓</td></tr>
      </tbody>
    </table>
    <div class="accentbox"><strong>Green-belt serve criteria:</strong> repeatable motion · continental grip · 7/10 in from the baseline · wide / body / T on demand.</div>`,

  // Cross-court rally targets (printable PDF + court)
  r5: `
    <h2>Set-up</h2>
    <p>Place throw-down lines or cones to mark the two deep cross-court target zones (shaded below). Rally cooperatively, aiming every ball into the opposite target. This builds depth, direction and rally tolerance.</p>
    <div style="text-align:center;margin:14px 0">
      <svg width="280" height="150" viewBox="0 0 280 150" style="border:1px solid #e5e7eb;border-radius:6px;background:#eef3ee">
        <rect x="20" y="10" width="240" height="130" fill="none" stroke="#6b7280" stroke-width="1.5"/>
        <line x1="140" y1="10" x2="140" y2="140" stroke="#6b7280" stroke-width="1.5"/>
        <line x1="20" y1="75" x2="260" y2="75" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 3"/>
        <rect x="22" y="12" width="56" height="48" fill="#a855f7" opacity="0.28"/>
        <rect x="202" y="90" width="56" height="48" fill="#a855f7" opacity="0.28"/>
        <text x="50" y="40" font-size="9" fill="#5b21b6" text-anchor="middle">Target</text>
        <text x="230" y="118" font-size="9" fill="#5b21b6" text-anchor="middle">Target</text>
      </svg>
    </div>
    <h2>Progressions</h2>
    <ol>
      <li><strong>Level 1:</strong> Rally 10 balls into the zone with a feed to start.</li>
      <li><strong>Level 2:</strong> Live from a serve, first to land 6 in the zone wins.</li>
      <li><strong>Level 3:</strong> Cross-court only points — ball outside the tramlines loses.</li>
      <li><strong>Level 4:</strong> Add one change of direction down the line on a short ball.</li>
    </ol>
    <div class="accentbox"><strong>Coaching cue:</strong> aim a metre over the net with shape — depth beats pace at this level.</div>`,

  // Footwork agility ladder set (PDF, fitness)
  r7: `
    <h2>15-minute ladder routine</h2>
    <p>Off-court warm-up to build split-step speed and first-step quickness. Two rounds, 30–40 seconds work per drill with walk-back recovery.</p>
    <table>
      <thead><tr><th>Drill</th><th>Reps</th><th>Coaching cue</th></tr></thead>
      <tbody>
        <tr><td>Two feet in each rung</td><td>2 lengths</td><td>Light, fast, on the balls of the feet</td></tr>
        <tr><td>In-in-out-out</td><td>2 lengths</td><td>Low hips, quick feet, eyes up</td></tr>
        <tr><td>Lateral shuffle</td><td>2 each way</td><td>Don’t cross the feet</td></tr>
        <tr><td>Icky shuffle</td><td>2 lengths</td><td>Rhythm — 1-2-3 count</td></tr>
        <tr><td>Single-leg hops</td><td>1 each leg</td><td>Stick the landing, stay balanced</td></tr>
        <tr><td>Split-step + sprint out</td><td>4 reps</td><td>React to a call, explode 3 steps</td></tr>
      </tbody>
    </table>
    <div class="accentbox"><strong>Finish:</strong> 2 minutes easy jog + dynamic stretches before hitting.</div>`,

  // Reset routine card (worksheet, mental)
  r8: `
    <h2>The between-points reset</h2>
    <p>A simple routine to use after every point — especially after a mistake. Same routine, every time, so the body knows what to do under pressure.</p>
    <table>
      <thead><tr><th style="width:90px">Step</th><th>What to do</th></tr></thead>
      <tbody>
        <tr><td><strong>Respond</strong></td><td>React to the point, then let it go — turn to the back fence.</td></tr>
        <tr><td><strong>Relax</strong></td><td>One slow breath. Loosen the strings with the off-hand.</td></tr>
        <tr><td><strong>Refocus</strong></td><td>Decide the plan for the next point (serve target / first move).</td></tr>
        <tr><td><strong>Ready</strong></td><td>Walk to the line with intent. Trigger word, then play.</td></tr>
      </tbody>
    </table>
    <h2>Make it yours</h2>
    <div class="box">
      My trigger word: <span class="fill" style="display:inline-block;width:160px"></span><br/><br/>
      My breathing count (in/out): <span class="fill" style="display:inline-block;width:120px"></span><br/><br/>
      What I do with my racket / strings: <span class="fill" style="display:inline-block;width:180px"></span>
    </div>`,

  // Parent guide: ball stages (PDF)
  r10: `
    <h2>The LTA Youth ball stages — a quick guide for parents</h2>
    <p>Younger players use slower, lower-bouncing balls on smaller courts so they can rally, play points and develop good technique from day one. Here’s the pathway.</p>
    <table>
      <thead><tr><th>Stage</th><th>Age guide</th><th>Court &amp; ball</th><th>What to expect</th></tr></thead>
      <tbody>
        <tr><td><strong style="color:#3A8EE0">Blue</strong></td><td>4–6</td><td>Mini court · foam/blue ball</td><td>Balance, coordination, racket &amp; ball skills through games</td></tr>
        <tr><td><strong style="color:#C75A5A">Red</strong></td><td>6–8</td><td>Small court · red ball</td><td>Serve, rally and score — first real matches</td></tr>
        <tr><td><strong style="color:#E08A3C">Orange</strong></td><td>8–9</td><td>3/4 court · orange ball</td><td>A rounded game — developing all the shots</td></tr>
        <tr><td><strong style="color:#4FAE72">Green</strong></td><td>9–10</td><td>Full court · green ball</td><td>Refining technique on a full-size court</td></tr>
        <tr><td><strong style="color:#C9A227">Yellow</strong></td><td>10+</td><td>Full court · standard ball</td><td>Game styles, tactics and competing</td></tr>
      </tbody>
    </table>
    <h2>How you can help</h2>
    <ul>
      <li>Celebrate effort and problem-solving, not just winning.</li>
      <li>Let the coaching happen on court — your job is encouragement and lifts to sessions!</li>
      <li>Progression is about readiness, not age — trust the stage your child is in.</li>
    </ul>`,

  // Match-play tactics worksheet
  r12: `
    <h2>Pre-match plan</h2>
    <p>Fill this in before you walk on. A clear plan beats a perfect plan — keep it simple and commit.</p>
    <div class="grid2">
      <div>
        <h2 style="margin-top:6px">Opponent</h2>
        <div class="box">Strengths:<div class="fill"></div><div class="fill"></div>Weaknesses to attack:<div class="fill"></div><div class="fill"></div></div>
      </div>
      <div>
        <h2 style="margin-top:6px">My A-game</h2>
        <div class="box">When I’m playing well I…<div class="fill"></div><div class="fill"></div>My go-to under pressure:<div class="fill"></div></div>
      </div>
    </div>
    <h2>Patterns</h2>
    <div class="box">Serve plan (1st / 2nd targets):<div class="fill"></div>Return plan:<div class="fill"></div>My favourite rally pattern:<div class="fill"></div></div>
    <h2>If it’s not working</h2>
    <div class="accentbox">If I’m losing, I will change: <div class="fill"></div><div class="fill"></div></div>`,
}

export function openResource(r: Resource) {
  if (typeof window === 'undefined') return
  const body = BODY[r.id] ?? generic(r)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(r.title)}</title><style>${DOC_CSS}</style></head><body>
  <div class="page">
    <div class="band">
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">${esc(r.category)} · ${esc(r.format)}</div>
      <div style="font-size:26px;font-weight:800;margin-top:4px">${esc(r.title)}</div>
      <div class="meta">
        <span>${esc(r.level)}</span>
        ${r.belt ? `<span>${esc(beltName(r.belt))} belt</span>` : ''}
        ${r.duration && r.duration !== '—' ? `<span>${esc(r.duration)}</span>` : ''}
        <span>${esc(COACH_ORG.academy)}</span>
      </div>
    </div>
    ${body}
    <div style="margin-top:18px">${r.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
    <div class="foot"><span>${esc(COACH_ORG.academy)} · ${esc(COACH_ORG.cert)}</span><span>Lumio Coach · ${esc(beltName(r.belt) || 'Resource Centre')}</span></div>
  </div>
  </body></html>`

  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to open this resource.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  // Opens for reading; the coach can print or "Save as PDF" from the browser.
}
