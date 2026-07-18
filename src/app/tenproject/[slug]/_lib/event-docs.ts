'use client'

// Live fundraising-event resource packs. Every event gets a pack; every
// resource opens as a print-ready branded document (checklists, poster copy,
// parent letters, risk-assessment prompts, sponsor asks, run sheets).
// Production version stores these in tp_fundraising_events.ai_pack (jsonb).

import { shell, brandHeader, esc, openDocWindow } from './funder-docs'
import type { FundraisingEvent } from '@/data/tenproject/demo-data'

export interface EventResource {
  id: string
  title: string
  desc: string
}

const BALL_HIT_PACK: EventResource[] = [
  { id: 'checklist', title: 'Step-by-step checklist', desc: '6 weeks out to event day — booking, pledge forms, tally sheets' },
  { id: 'poster', title: 'Poster + newsletter copy', desc: 'Ready to print (A4/A5) and paste into the school newsletter' },
  { id: 'parent-letter', title: 'Letter to parents', desc: 'Explains the pledge — per-ball or flat, online collection link' },
  { id: 'risk', title: 'Risk-assessment prompts', desc: 'Complete with the school office before the day' },
  { id: 'sponsor-ask', title: 'Local-business sponsorship ask', desc: 'Three tiers — £50 / £150 / £350 — with what each funds' },
  { id: 'run-sheet', title: 'On-the-day run sheet', desc: 'Warm-up, 10-minute hit windows per class, live tally in the app' },
]

const GENERIC_PACKS: Record<string, EventResource[]> = {
  'Sponsored ball hit': BALL_HIT_PACK,
  'Cake sale': [
    { id: 'checklist', title: 'Step-by-step checklist', desc: '3 weeks out to sale day — permissions, bakers, float, pricing' },
    { id: 'poster', title: 'Poster + newsletter copy', desc: 'Ready to print and paste into the newsletter' },
    { id: 'risk', title: 'Food safety & allergen prompts', desc: 'Labelling, allergen list, hygiene — complete with the office' },
    { id: 'run-sheet', title: 'On-the-day run sheet', desc: 'Setup, pricing, float, cash handling and logging the total' },
  ],
  'School fair': [
    { id: 'checklist', title: 'Step-by-step checklist', desc: '4 weeks out to fair day — pitch booking, kit, volunteers' },
    { id: 'poster', title: 'Stall signage + newsletter copy', desc: 'Signage text and a newsletter mention' },
    { id: 'stall-games', title: 'Stall games & pricing', desc: 'Three tennis games that earn — target hit, speed serve, rally count' },
    { id: 'run-sheet', title: 'On-the-day run sheet', desc: 'Rota, float, cash handling and logging the total' },
  ],
  'Quiz night': [
    { id: 'checklist', title: 'Step-by-step checklist', desc: '5 weeks out to quiz night — venue, tickets, quizmaster, raffle' },
    { id: 'poster', title: 'Poster + ticket copy', desc: 'Poster, ticket wording and newsletter blurb' },
    { id: 'risk', title: 'Licensing & raffle prompts', desc: 'Small-lottery raffle rules, alcohol/venue checks' },
    { id: 'run-sheet', title: 'On-the-night run sheet', desc: 'Doors, rounds, raffle draw, totals announcement' },
  ],
}

export function eventResources(ev: FundraisingEvent): EventResource[] {
  return GENERIC_PACKS[ev.type] ?? BALL_HIT_PACK.slice(0, 3)
}

// ─── Document builders ──────────────────────────────────────────────────────

const list = (items: string[]) => `<ul>${items.map(i => `<li style="margin-bottom:6px">${esc(i)}</li>`).join('')}</ul>`
const checks = (items: string[]) => `<ul style="list-style:none;padding-left:2px">${items.map(i => `<li style="margin-bottom:7px">☐&nbsp; ${esc(i)}</li>`).join('')}</ul>`

function checklistDoc(ev: FundraisingEvent) {
  const isBallHit = ev.type === 'Sponsored ball hit'
  const body = `
    ${brandHeader(`EVENT CHECKLIST · ${ev.name.toUpperCase()}`)}
    <h1>${esc(ev.name)} — checklist</h1>
    <div class="sub">${esc(ev.type)} · ${esc(ev.date)} · target £${ev.target.toLocaleString()} · tick items off as you go</div>
    ${isBallHit ? `
    <h2>6 WEEKS OUT</h2>
    ${checks(['Book the hall / playground courts with the school office', 'Agree the date with your Ten Project coach (they bring equipment)', 'Set the pledge options: per-ball (10p/25p/50p) and flat amounts', 'Create the event in the portal so the online collection link is live'])}
    <h2>4 WEEKS OUT</h2>
    ${checks(['Pledge forms + parent letter home in book bags (pack includes both)', 'Poster up at the gate and office; newsletter blurb in this week’s send', 'Send the sponsorship ask to 5–10 local businesses (pack includes the letter)'])}
    <h2>2 WEEKS OUT</h2>
    ${checks(['Chase pledge forms — aim for every child with at least one pledge', 'Confirm class time slots with teachers (10-minute hit windows)', 'Print tally sheets per class (or use the app tally on the day)', 'Complete the risk assessment with the school office (pack includes prompts)'])}
    <h2>EVENT WEEK</h2>
    ${checks(['Reminder in the newsletter + parent app', 'Charge the tablet/phone for the live tally', 'Float and cash tin for on-the-day donations', 'Brief the helpers: one feeder, one counter, one runner per court'])}
    <h2>AFTER</h2>
    ${checks(['Enter final ball counts in the portal — pledge amounts calculate automatically', 'Online collection links go out same day (automatic chase-ups after 5 days)', 'Log any cash against the event; thermometer updates', 'Thank-you note in the newsletter with the total raised'])}
    ` : `
    <h2>PLANNING</h2>
    ${checks(['Confirm date and venue/pitch with the school office', 'Create the event in the portal so totals log against the thermometer', 'Recruit volunteers (aim for 4–6) and agree a rota', 'Poster up + newsletter blurb (pack includes copy)'])}
    <h2>THE WEEK BEFORE</h2>
    ${checks(['Reminder in the newsletter + parent app', 'Sort the float and a cash tin', 'Print price/signage sheets', 'Run through the risk/safety prompts with the office'])}
    <h2>AFTER</h2>
    ${checks(['Count and log the total against the event in the portal', 'Bank the cash per school policy', 'Thank-you note in the newsletter with the total raised'])}
    `}
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal · The live version saves your ticks per event</div>
  `
  return shell(`${ev.name} — Checklist`, body)
}

function posterDoc(ev: FundraisingEvent) {
  const posterLines = ev.type === 'Sponsored ball hit'
    ? ['THE BIG SPONSORED BALL HIT! 🎾', `${ev.date} · at school`, 'Every child. Every ball counts.', 'Sponsor per ball or any amount —', 'help bring Ten Project back to our school!', 'LEARN. PLAY. TOGETHER.']
    : ev.type === 'Quiz night'
      ? [`${ev.name.toUpperCase()} 🎾`, `${ev.date} · school hall · teams of 6`, 'Tickets from the office — includes nibbles!', 'Raffle on the night.', 'All proceeds bring Ten Project back to our school.']
      : [`${ev.name.toUpperCase()} 🎾`, `${ev.date}`, 'All proceeds bring Ten Project back to our school!', 'LEARN. PLAY. TOGETHER.']
  const newsletter = `${ev.name} — ${ev.date}. We're fundraising to bring Ten Project back for 2026/27 (we're at £2,150 of £3,200!). ${ev.type === 'Sponsored ball hit' ? 'Pledge forms are coming home this week — sponsor your child per ball or with any amount, and pay online after the big day.' : 'Come along, join in, and every pound goes straight to the programme.'} Thank you for your support — LEARN. PLAY. TOGETHER.`
  const copyText = `POSTER\n\n${posterLines.join('\n')}\n\nNEWSLETTER COPY\n\n${newsletter}`
  const body = `
    ${brandHeader(`POSTER & NEWSLETTER · ${ev.name.toUpperCase()}`)}
    <h1>${esc(ev.name)} — poster & newsletter copy</h1>
    <div class="sub">Print the poster panel below at A4 or A5 · use Copy text for the newsletter blurb</div>
    <div style="border:3px solid #D7262C;border-radius:14px;padding:34px 24px;text-align:center;margin:14px 0">
      ${posterLines.map((l, i) => `<div style="font-weight:${i === 0 ? 900 : 700};font-size:${i === 0 ? 30 : i === 1 ? 18 : 15}px;margin-bottom:10px;color:${i === 0 ? '#D7262C' : '#1B1B21'}">${esc(l)}</div>`).join('')}
      <div style="font-size:12px;color:#6B6560;margin-top:14px">Ask the school office or scan the QR in the newsletter to pledge online</div>
    </div>
    <h2>NEWSLETTER COPY</h2>
    <p>${esc(newsletter)}</p>
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Poster & Newsletter`, body, copyText)
}

function parentLetterDoc(ev: FundraisingEvent) {
  const text = `Dear parents and carers,

On ${ev.date} every child will take part in our SPONSORED BALL HIT — a fun tennis challenge where each class gets a ten-minute window to hit as many balls as they can, with all equipment provided by Ten Project.

Why? Ten Project ran at our school last year — 62 children learnt to play, attendance was 93%, and the children loved every week. School sports funding has changed, so this year we're raising the programme cost ourselves to bring it back for 2026/27.

How to sponsor: fill in the pledge form in your child's book bag — either an amount per ball (most children hit 30–60 balls!) or a single flat amount. After the event you'll receive a link to pay online in a few taps; you can also send cash in a named envelope.

Every pound goes to the programme. Thank you for helping our children LEARN. PLAY. TOGETHER.

With thanks,
[Headteacher name]
St Clement's Primary, with Ten Project`
  const body = `
    ${brandHeader(`PARENT LETTER · ${ev.name.toUpperCase()}`)}
    <h1>Letter to parents</h1>
    <div class="sub">Use Copy text, paste onto school letterhead, and edit the bracketed details</div>
    ${text.split('\n\n').map(p2 => `<p style="margin-bottom:12px;white-space:pre-line">${esc(p2)}</p>`).join('')}
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Parent Letter`, body, text)
}

function riskDoc(ev: FundraisingEvent) {
  const rows: [string, string][] = ev.type === 'Cake sale'
    ? [
      ['Allergens', 'Every item labelled by the baker; allergen list displayed; no nut products'],
      ['Food hygiene', 'Cling-wrapped/covered items only; gloves/tongs for serving; wipe-down between rushes'],
      ['Cash handling', 'Two adults on the tin at all times; counted and logged by two people'],
      ['Crowding', 'Queue line marked; sale after pick-up time to avoid gate congestion'],
    ]
    : ev.type === 'Quiz night'
      ? [
        ['Raffle', 'Run as an incidental (small society) lottery — tickets sold on the night only, no cash prizes over limits'],
        ['Alcohol / venue', 'Follow the venue’s licence; school events default to no alcohol unless licensed'],
        ['Cash handling', 'Two adults on the door/till; counted and logged by two people'],
        ['Fire & capacity', 'Confirm hall capacity and clear exits with the site manager'],
      ]
      : [
        ['Space & surfaces', 'Court/hall swept; wet-weather plan agreed; hitting direction away from spectators'],
        ['Equipment', 'Ten Project coach checks rackets/balls; damaged kit withdrawn'],
        ['Supervision', 'Class teacher present per slot; one adult feeder, one counter per court'],
        ['Children’s welfare', 'Water available; photo consent flags checked in the register before any photography'],
        ['Cash & pledges', 'On-day cash in a tin with two adults; online pledges through the portal only'],
      ]
  const body = `
    ${brandHeader(`RISK ASSESSMENT PROMPTS · ${ev.name.toUpperCase()}`)}
    <h1>${esc(ev.name)} — risk-assessment prompts</h1>
    <div class="sub">Not a completed assessment — the prompt list to work through with the school office, on the school’s own template</div>
    <table><tr><th>Area</th><th>Prompt / suggested control</th></tr>
    ${rows.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('')}
    </table>
    <p>Add site-specific hazards, name the responsible adult for each control, and file the completed assessment with the office before the event.</p>
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Risk Prompts`, body)
}

function sponsorAskDoc(ev: FundraisingEvent) {
  const text = `Dear [Business name],

St Clement's Primary is raising £3,200 to bring Ten Project — 10 weeks of free tennis for every child, plus free weekend family sessions — back to our school for 2026/27. Our headline event is a Sponsored Ball Hit on ${ev.date}, involving every child in the school.

We're inviting local businesses to back it:

• COURTSIDE — £50: your name on the event poster and in the school newsletter (450 families).
• RALLY — £150: the above, plus your logo on the pledge forms home in every book bag and a thank-you on the school's Ten Project fundraising page.
• CHAMPION — £350: all of the above, plus headline billing on the day, a photo opportunity at the event (consent-checked), and a feature in the term newsletter.

Every pound goes directly to the programme. To take part, reply to this email or call the school office.

Thank you for supporting our children to LEARN. PLAY. TOGETHER.

[Headteacher name], St Clement's Primary`
  const body = `
    ${brandHeader(`SPONSORSHIP ASK · ${ev.name.toUpperCase()}`)}
    <h1>Local-business sponsorship ask</h1>
    <div class="sub">Three tiers · use Copy text, personalise the brackets, send to 5–10 local businesses</div>
    ${text.split('\n\n').map(p2 => `<p style="margin-bottom:12px;white-space:pre-line">${esc(p2)}</p>`).join('')}
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Sponsor Ask`, body, text)
}

function runSheetDoc(ev: FundraisingEvent) {
  const rows: [string, string][] = ev.type === 'Sponsored ball hit'
    ? [
      ['08.45', 'Coach + helpers set up: 4 hitting stations, feeder buckets, tally station, signage'],
      ['09.15', 'Whole-school assembly moment — how it works, biggest cheer wins'],
      ['09.30', 'Class slots begin — 10-minute windows: 2 min warm-up, 6 min hitting, 2 min changeover'],
      ['09.30–12.00', 'Reception → Y2 slots (soft balls, shorter distance)'],
      ['13.00–14.45', 'Y3 → Y6 slots · live tally updated in the app after each class'],
      ['14.50', 'Totals announced over the tannoy — school-record drumroll'],
      ['15.00', 'Gate: thank-you flyer + “pay your pledge online” QR for parents'],
      ['Same day', 'Final counts entered → pledge collection links sent automatically'],
    ]
    : ev.type === 'Quiz night'
      ? [
        ['18.30', 'Doors + team registration; float ready; raffle tickets on sale'],
        ['19.00', 'Round 1–3 · drinks break · Round 4–6'],
        ['20.30', 'Raffle draw'],
        ['20.45', 'Scores, prizes, total-raised announcement'],
        ['21.00', 'Pack down; two-person cash count; log total in the portal'],
      ]
      : [
        ['Setup −45 min', 'Table/pitch, signage, float, price list up'],
        ['During', 'Two adults minimum; one on cash at all times'],
        ['Close', 'Two-person cash count; log the total against the event in the portal'],
      ]
  const body = `
    ${brandHeader(`RUN SHEET · ${ev.name.toUpperCase()}`)}
    <h1>${esc(ev.name)} — run sheet</h1>
    <div class="sub">${esc(ev.date)} · print one per helper</div>
    <table><tr><th>Time</th><th>What happens</th></tr>
    ${rows.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('')}
    </table>
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Run Sheet`, body)
}

function stallGamesDoc(ev: FundraisingEvent) {
  const body = `
    ${brandHeader(`STALL GAMES · ${ev.name.toUpperCase()}`)}
    <h1>Stall games & pricing</h1>
    <div class="sub">Three tennis games that earn — equipment provided by your Ten Project coach</div>
    <table><tr><th>Game</th><th>How it works</th><th>Price</th></tr>
    <tr><td><b>Target Hit</b></td><td>3 balls to hit the hoop targets — every hit wins a sticker</td><td>£1 for 3</td></tr>
    <tr><td><b>Speed Serve</b></td><td>Radar (coach’s phone app) clocks your fastest serve — beat the teacher’s score for a prize</td><td>£1.50 for 3</td></tr>
    <tr><td><b>Family Rally</b></td><td>Parent + child rally count in 60 seconds — top 3 of the day win</td><td>£2 per pair</td></tr>
    </table>
    ${list(['Price board up front; queue line chalked', 'Two helpers per game — one feeds, one takes payment', 'Log the stall total against the event in the portal at close'])}
    <div class="foot">Ten Project Ltd · Generated by the Ten Project Portal</div>
  `
  return shell(`${ev.name} — Stall Games`, body)
}

export function openEventDoc(ev: FundraisingEvent, resourceId: string) {
  const html =
    resourceId === 'checklist' ? checklistDoc(ev)
    : resourceId === 'poster' ? posterDoc(ev)
    : resourceId === 'parent-letter' ? parentLetterDoc(ev)
    : resourceId === 'risk' ? riskDoc(ev)
    : resourceId === 'sponsor-ask' ? sponsorAskDoc(ev)
    : resourceId === 'stall-games' ? stallGamesDoc(ev)
    : runSheetDoc(ev)
  openDocWindow(html)
}
