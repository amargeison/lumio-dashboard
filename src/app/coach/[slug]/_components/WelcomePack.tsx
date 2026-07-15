'use client'

// Printable new-player Welcome Pack: a welcome letter, a starting action plan,
// and an onboarding questionnaire (tennis history, level, goals) the player/
// parent fills in so the coach can place them at the right belt.

import { BELTS, COACH_ORG, type Player } from '../_lib/coach-data'
import { getSettings } from '../_lib/settings-store'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fill = (w = '100%') => `<span style="display:inline-block;border-bottom:1px dashed #b9bdca;min-width:${w};height:15px"></span>`
const line = '<div style="border-bottom:1px dashed #b9bdca;height:22px;margin:6px 0"></div>'

export function printWelcomePack(player: Player) {
  if (typeof window === 'undefined') return
  const first = player.name.split(' ')[0]
  const brandLogo = getSettings().brandLogo || (typeof window !== 'undefined' ? `${window.location.origin}/tennis_transparent_logo.png` : '')
  const logoChip = brandLogo ? `<img src="${brandLogo}" alt="" style="height:58px;max-width:150px;object-fit:contain;background:#fff;border-radius:10px;padding:8px;flex-shrink:0" />` : ''
  const belt = BELTS[player.beltIndex]
  const next = BELTS[Math.min(player.beltIndex + 1, BELTS.length - 1)]
  const skills = belt.skills.map(s => `<li>${esc(s.name)} — <span style="color:#6b7280">${esc(s.note)}</span></li>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome Pack — ${esc(player.name)}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative;page-break-after:always}
    .page:last-child{page-break-after:auto}
    .band{background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:22px 26px}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
    p{font-size:12.5px;line-height:1.7;color:#374151}
    ul,ol{margin:0;padding-left:20px}li{font-size:12px;line-height:1.6;color:#374151;margin-bottom:4px}
    .accentbox{border:1px solid #ead9ff;border-left:4px solid #a855f7;border-radius:0 10px 10px 0;background:#f7f4ff;padding:12px 16px;margin-top:10px}
    .q{margin:0 0 12px}.q .lbl{font-size:12px;font-weight:600;color:#1a1d29;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:6px}td,th{font-size:12px;padding:6px 8px;border-bottom:1px solid #f0f1f6;text-align:left;vertical-align:top}th{color:#9099ad;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}
    .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
    @page{size:A4;margin:0}
  </style></head><body>

  <!-- 1. Welcome -->
  <div class="page">
    <div class="band" style="display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Welcome Pack</div>
        <div style="font-size:30px;font-weight:800;margin-top:6px">Welcome, ${esc(first)}! 🎾</div>
        <div style="opacity:.9;margin-top:4px">${esc(COACH_ORG.academy)}</div>
      </div>
      ${logoChip}
    </div>
    <p style="margin-top:18px">Hi ${esc(first)},</p>
    <p>A warm welcome to ${esc(COACH_ORG.academy)} — we're really pleased to have you on board. Whether you're brand new to tennis or coming back to it, our job is to help you improve, enjoy your tennis and hit some clear goals along the way.</p>
    <p>We coach using a <strong>racket progression system</strong> (like martial arts) — you'll work through clear skills at each racket, earn certificates as you progress, and always know what you're working towards. Aligned to the LTA Youth pathway, it keeps things fun, structured and motivating.</p>
    <h2>What happens next</h2>
    <ol>
      <li><strong>Complete the onboarding questions</strong> (page 3) and bring them to your first session — this helps us place you at exactly the right racket.</li>
      <li><strong>First session = assessment & a hit</strong> — relaxed, no pressure, just so we can see your game.</li>
      <li><strong>We agree your goals</strong> and set your starting racket and a simple plan.</li>
    </ol>
    <h2>Handy to know</h2>
    <ul>
      <li>Bring: trainers/tennis shoes, water, and a racket if you have one (we can lend one).</li>
      <li>Wear comfortable sports clothing for the weather.</li>
      <li>Lessons, progress and homework are shared through the Lumio Coach app.</li>
    </ul>
    <p style="margin-top:14px">See you on court,<br/><strong style="font-family:Georgia,serif;font-style:italic;font-size:15px">${esc(COACH_ORG.coach)}</strong><br/><span style="color:#6b7280;font-size:11px">${esc(COACH_ORG.cert)}</span></p>
    <div class="foot"><span>${esc(COACH_ORG.academy)}</span><span>Welcome pack for ${esc(player.name)}</span></div>
  </div>

  <!-- 2. Action plan -->
  <div class="page">
    <h2 style="margin-top:0">Your starting action plan</h2>
    <div class="accentbox" style="display:flex;align-items:center;gap:12px">
      <span style="width:40px;height:25px;border-radius:5px;background:${belt.colour};border:1px solid rgba(0,0,0,.25)"></span>
      <div><div style="font-size:16px;font-weight:700">${esc(belt.name)} racket — ${esc(belt.theme)}</div><div style="font-size:11px;color:#6b7280">Your suggested starting point — confirmed after your first session</div></div>
    </div>
    <h2>Skills you'll work on first</h2>
    <ul>${skills}</ul>
    <h2>Your goal</h2>
    <p>${esc(player.goal)}</p>
    <h2>First four weeks</h2>
    <table>
      <thead><tr><th style="width:70px">Week</th><th>Focus</th></tr></thead>
      <tbody>
        <tr><td>Week 1</td><td>Assessment &amp; getting to know your game — set your racket and goal</td></tr>
        <tr><td>Week 2</td><td>Foundations of the ${esc(belt.theme.toLowerCase())}</td></tr>
        <tr><td>Week 3</td><td>Build &amp; repeat — take the new skills into rallies and games</td></tr>
        <tr><td>Week 4</td><td>First progress check — celebrate the wins and set the next target (${esc(next.name)})</td></tr>
      </tbody>
    </table>
    <div class="foot"><span>${esc(COACH_ORG.academy)} · ${esc(COACH_ORG.cert)}</span><span>${esc(COACH_ORG.coach)}</span></div>
  </div>

  <!-- 3. Onboarding questionnaire -->
  <div class="page">
    <h2 style="margin-top:0">Onboarding — tell us about your tennis</h2>
    <p style="margin-top:0">Please complete and bring to your first session. This helps us place you at the right racket from day one.</p>

    <table>
      <tbody>
        <tr><td style="width:50%">Player name: ${fill('120px')}</td><td>Date of birth: ${fill('110px')}</td></tr>
        <tr><td>Parent/guardian (if junior): ${fill('100px')}</td><td>Best contact number: ${fill('110px')}</td></tr>
      </tbody>
    </table>

    <h2>Your tennis history</h2>
    <div class="q"><div class="lbl">How long have you been playing tennis?</div>${fill('200px')} years / months</div>
    <div class="q"><div class="lbl">Have you had coaching before? Where, and for how long?</div>${line}${line}</div>
    <div class="q"><div class="lbl">What level have you played at? (club, school, county, leagues, ratings — LTA/WTN/UTR if known)</div>${line}${line}</div>
    <div class="q"><div class="lbl">Do you compete, or would you like to? (tournaments, matches, ladders)</div>${line}</div>

    <h2>Your goals</h2>
    <div class="q"><div class="lbl">What are you looking to achieve from these sessions?</div>${line}${line}${line}</div>
    <div class="q"><div class="lbl">Which parts of your game do you most want to improve?</div>${line}${line}</div>

    <h2>Practical</h2>
    <div class="q"><div class="lbl">Which days / times generally suit you?</div>${line}</div>
    <div class="q"><div class="lbl">Any injuries, medical conditions or things we should know? (allergies, etc.)</div>${line}${line}</div>

    <div class="accentbox" style="margin-top:14px"><strong>For the coach:</strong> suggested starting racket after review: ${fill('150px')} &nbsp; Date: ${fill('90px')}</div>
    <div class="foot"><span>${esc(COACH_ORG.academy)}</span><span>Onboarding · ${esc(player.name)}</span></div>
  </div>

  </body></html>`

  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to open the welcome pack.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual print */ } }, 350)
}
