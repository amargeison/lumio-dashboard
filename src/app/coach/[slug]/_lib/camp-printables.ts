'use client'

// Printable camp documents: the parent brief, the coach run-sheet, and the
// end-of-camp player report.
//
// These are the things a camp actually needs on paper. A coach carries the
// run-sheet on court; a parent reads the brief before deciding to book; the
// player takes the report home. All three come from the same camp plan Lumio
// Coach designed, so nothing is written twice and nothing can drift out of step.

import { getSettings } from './settings-store'
import { esc, dashLines, printPage, openPrintDoc, SESSION_COLOUR, type PrintOrg } from './print-kit'

export type CampSession = { slot?: string; time?: string; title?: string; type?: string; where?: string; detail?: string; cue?: string }
export type CampDay = { day: number; date?: string; theme?: string; rest?: boolean; coachFocus?: string; sessions?: CampSession[]; focus?: string; did?: string; nextAction?: string }
export type ParentBrief = { intro?: string; whatTheyWorkOn?: string[]; whatToBring?: string[]; dailyShape?: string; whatTheyLeaveWith?: string[] }
export type CampLike = {
  name: string; start_date?: string | null; end_date?: string | null; location?: string | null; region?: string | null
  surface?: string | null; courts?: number | null; board?: string | null; ages?: string | null; price?: number | null
  daily_rhythm?: string | null; description?: string | null; audience?: string | null
  itinerary?: CampDay[] | null; equipment?: string[] | null; objectives?: string[] | null; parent_brief?: ParentBrief | null
}
export type PlayerReport = {
  headline?: string; assessment?: string; progress?: string[]; nextSteps?: string[]; homework?: string; coachNote?: string
}

export function campOrg(profile?: { brand_name?: string | null; display_name?: string | null; brand_logo_url?: string | null }): PrintOrg {
  const s = getSettings()
  return {
    academy: profile?.brand_name || s.academy || 'Lumio Tennis',
    coach: [profile?.display_name || s.coach, s.cert].filter(Boolean).join(' · ') || '',
    logoUrl: profile?.brand_logo_url || s.brandLogo || null,
  }
}

const fmtDate = (d?: string | null) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const dateRange = (c: CampLike) => [fmtDate(c.start_date), fmtDate(c.end_date)].filter(Boolean).join(' – ')
const ul = (xs?: string[]) => xs?.length ? `<ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''

// ── 1. Camp brief ───────────────────────────────────────────────────────────
// The thing that actually sells a camp. Most coaches send a paragraph and a bank
// transfer request; this is deliberately written for whoever decides — a parent
// on a junior camp, the player themselves on an adult one.
//
// The function keeps its name, and the data keeps the column name `parent_brief`,
// because both are load-bearing elsewhere. What is IN it is not always for a
// parent, which is what `audience` settles.
export function printParentBrief(camp: CampLike, org: PrintOrg): boolean {
  const b = camp.parent_brief || {}
  const adultBrief = String((camp as { audience?: string | null }).audience || '') === 'adult'
  const days = camp.itinerary || []
  const body = `
    ${b.intro ? `<div class="diag" style="border-color:#3A8EE0;background:#3A8EE00e">
      <div class="lbl" style="color:#3A8EE0">About this camp</div><p style="margin:0">${esc(b.intro)}</p></div>` : ''}

    <div class="two" style="margin-top:6px">
      <div class="col">
        <h2 style="color:#3A8EE0">${adultBrief ? 'What you will work on' : 'What your child will work on'}</h2>
        ${ul(b.whatTheyWorkOn) || `<p>${esc(camp.description || 'A full programme of technical, tactical and match-play work.')}</p>`}
        ${b.dailyShape ? `<h2 style="color:#3A8EE0">A typical day</h2><p>${esc(b.dailyShape)}</p>` : ''}
      </div>
      <div class="col">
        <h2 style="color:#3A8EE0">What to bring</h2>
        ${ul(b.whatToBring) || '<p>Racket, water bottle, sun cream, hat, spare shirt and trainers with non-marking soles.</p>'}
      </div>
    </div>

    ${days.length ? `<h2 style="color:#3A8EE0">Day by day</h2>
      <table><tr><th style="width:12%">Day</th><th>Focus</th></tr>
      ${days.map(d => `<tr><td><strong>${d.day}</strong>${d.date ? `<br><span style="color:#9aa1b1;font-size:10px">${esc(d.date)}</span>` : ''}</td><td>${esc(d.theme || d.focus || '')}${d.rest ? ' <span style="color:#5bc0be;font-size:10px;font-weight:700">· LIGHTER DAY</span>' : ''}</td></tr>`).join('')}
      </table>` : ''}

    ${b.whatTheyLeaveWith?.length ? `<div class="succ"><div class="lbl">What they leave with</div>${ul(b.whatTheyLeaveWith)}</div>` : ''}

    <h2 style="color:#3A8EE0">Questions?</h2>
    <p>Reply to the email this came with, or speak to us at the club. We would rather answer a question now than ${adultBrief ? 'arrive unsure about anything' : 'have your child arrive unsure about anything'}.</p>`

  return openPrintDoc(`${camp.name} — camp brief`, printPage({
    org, kicker: adultBrief ? 'Camp brief' : 'Camp brief for parents', title: camp.name, accent: '#3A8EE0',
    chips: [dateRange(camp), camp.ages ? `Ages ${camp.ages}` : '', camp.location || camp.region || '', camp.board || ''].filter(Boolean),
    body, footNote: 'Camp brief',
  }))
}

// ── 2. Coach run-sheet ──────────────────────────────────────────────────────
// One page per day, for the coaching team. This is what a head coach would
// otherwise write out by hand the night before.
export function printRunSheet(camp: CampLike, org: PrintOrg, attendees?: string[]): boolean {
  const days = camp.itinerary || []
  if (!days.length) return false

  const pages = days.map(d => {
    const sessions = (d.sessions || []).map(s => {
      const c = SESSION_COLOUR[s.type || ''] || '#8b93a7'
      return `<tr>
        <td style="width:14%;white-space:nowrap"><strong style="color:${c}">${esc(s.slot || '')}</strong><br><span style="font-size:10.5px;color:#6b7280">${esc(s.time || '')}</span></td>
        <td style="width:30%"><strong>${esc(s.title || '')}</strong>${s.where ? `<br><span style="font-size:10.5px;color:#6b7280">${esc(s.where)}</span>` : ''}</td>
        <td>${esc(s.detail || '')}${s.cue ? `<br><span style="font-size:11px;color:#6b7280;font-style:italic">“${esc(s.cue)}”</span>` : ''}</td>
        <td style="width:14%"><span style="font-size:10px;font-weight:700;color:${c}">${esc(s.type || '')}</span></td>
      </tr>`
    }).join('')

    const body = `
      ${d.coachFocus ? `<div class="diag" style="border-color:#1f6fd6;background:#1f6fd60e">
        <div class="lbl" style="color:#1f6fd6">What today is really for</div><p style="margin:0">${esc(d.coachFocus)}</p></div>` : ''}

      <h2 style="color:#1f6fd6">Running order</h2>
      ${sessions ? `<table><tr><th>Slot</th><th>Session</th><th>What happens</th><th>Type</th></tr>${sessions}</table>`
        : `<p>${esc(d.did || d.focus || 'No sessions recorded for this day.')}</p>`}

      ${camp.equipment?.length ? `<h2 style="color:#1f6fd6">Kit for today</h2>
        <div style="font-size:11.5px;color:#374151;line-height:1.9">${camp.equipment.map(e => `<span style="display:inline-block;border:1px solid #e5e9f0;border-radius:999px;padding:2px 10px;margin:0 5px 5px 0">☐ ${esc(e)}</span>`).join('')}</div>` : ''}

      ${attendees?.length ? `<h2 style="color:#1f6fd6">Register</h2>
        <table><tr><th style="width:55%">Player</th><th style="width:12%">In</th><th>Notes</th></tr>
        ${attendees.map(a => `<tr><td>${esc(a)}</td><td style="text-align:center">☐</td><td></td></tr>`).join('')}</table>` : ''}

      <h2 style="color:#1f6fd6">Coach notes</h2>${dashLines(4)}`

    return printPage({
      org, kicker: `Run-sheet · Day ${d.day} of ${days.length}`, title: d.theme || d.focus || `Day ${d.day}`, accent: '#1f6fd6',
      chips: [d.date || '', d.rest ? 'Lighter day' : '', camp.name].filter(Boolean),
      body, footNote: `${camp.name} · Day ${d.day}`,
    })
  }).join('')

  return openPrintDoc(`${camp.name} — coach run-sheet`, pages)
}

// ── 3. End-of-camp player report ────────────────────────────────────────────
// Written by Lumio Coach in his diagnosis-first voice — the player's own
// assessment, what moved, and what to do next. Closes the loop and is the
// natural bridge into ongoing coaching.
// The certificate. Ported from the demo, which has always had one while the live
// portal never did — so a demo promised a child something the real product did not
// deliver. It matters more here than it looks: the whole racket-reward system is
// built on physical rewards plus a certificate, and this is the one page a parent
// photographs and a child puts on a wall.
// `noun` is what this coach calls the ladder — "racket" on the reward system,
// "colour" without it. A certificate that awards a "Purple racket" to a player
// whose coach hands out no rackets is a promise nobody can keep.
export function certificatePage(camp: CampLike, org: PrintOrg, playerName: string, stage?: string | null, stageColour?: string | null, achievement?: string | null, noun = 'racket'): string {
  const awarded = camp.end_date ? fmtDate(camp.end_date) : fmtDate(camp.start_date)
  const year = (camp.end_date || camp.start_date || '').slice(0, 4) || ''
  const place = [camp.location, camp.region].filter(Boolean).join(', ')
  return `
  <div class="page" style="display:flex;align-items:center;justify-content:center;padding:0">
    <div style="position:absolute;inset:10mm;border:2px solid #C9A227;border-radius:8px"></div>
    <div style="position:absolute;inset:13mm;border:1px solid #e3c97a;border-radius:6px"></div>
    <div style="position:absolute;font-size:340px;opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%)">🎾</div>
    <div style="text-align:center;padding:28mm 22mm;position:relative;max-width:170mm">
      ${org.logoUrl ? `<img src="${esc(org.logoUrl)}" alt="" style="height:58px;max-width:180px;object-fit:contain;display:block;margin:0 auto 14px">` : ''}
      <div style="font-size:12px;letter-spacing:.5em;color:#7c3aed;font-weight:700;text-transform:uppercase">${esc(org.academy)}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;letter-spacing:.04em;margin-top:14px;color:#1a1d29">Certificate of Achievement</div>
      <div style="width:70px;height:3px;background:#C9A227;margin:16px auto 22px"></div>
      <div style="font-size:13px;color:#6b7280">This is proudly presented to</div>
      <div style="font-family:Georgia,serif;font-size:46px;color:#7c3aed;margin:10px 0 6px;font-weight:600">${esc(playerName)}</div>
      <div style="font-size:14px;color:#374151;max-width:130mm;margin:8px auto 0;line-height:1.6">
        for outstanding commitment and progress at the <strong>${esc(camp.name)}</strong>${place ? `, ${esc(place)}` : ''}${dateRange(camp) ? `, ${esc(dateRange(camp))}` : ''}.
      </div>
      ${(achievement || stage) ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-top:22px;background:${achievement ? '#fffaf0' : '#faf7ff'};border:1px solid ${achievement ? '#e8d9a8' : '#ead9ff'};border-radius:30px;padding:8px 18px">
        <span style="width:22px;height:14px;border-radius:3px;background:${esc(stageColour || '#7c3aed')};border:1px solid rgba(0,0,0,.2)"></span>
        <span style="font-weight:700;color:#1a1d29">${esc(achievement || (noun === 'racket' ? `${stage} racket` : String(stage)))}</span>
      </div>` : ''}
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:32px;padding:0 6mm">
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#1a1d29">${esc((org.coach || '').split(' · ')[0])}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">${esc((org.coach || '').split(' · ')[1] || 'Head Coach')}</div>
        </div>
        <div style="width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#F4D77B,#C9A227);box-shadow:0 5px 16px rgba(201,162,39,.45);display:flex;align-items:center;justify-content:center;color:#5a4710;font-weight:800;font-size:11px;text-align:center;line-height:1.1;border:3px solid #fff;outline:2px solid #C9A227">CAMP<br>${esc(year)}</div>
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-size:18px;color:#1a1d29">${esc(awarded)}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Date awarded</div>
        </div>
      </div>
    </div>
  </div>`
}

// Certificate on its own — for a coach who wants to hand one out without the
// written report (a younger group, or a parents' evening).
export function printCertificate(camp: CampLike, org: PrintOrg, playerName: string, stage?: string | null, stageColour?: string | null, achievement?: string | null, noun = 'racket'): boolean {
  return openPrintDoc(`${playerName} — certificate`, certificatePage(camp, org, playerName, stage, stageColour, achievement, noun))
}

export function printPlayerReport(camp: CampLike, org: PrintOrg, playerName: string, rep: PlayerReport, stage?: string | null, stageColour?: string | null, achievement?: string | null, noun = 'racket'): boolean {
  const body = `
    ${rep.headline ? `<div class="diag" style="border-color:#7c3aed;background:#7c3aed0e">
      <div class="lbl" style="color:#7c3aed">The headline</div><p style="margin:0;font-weight:600;color:#1a1d29">${esc(rep.headline)}</p></div>` : ''}

    ${rep.assessment ? `<h2 style="color:#7c3aed">How the week went</h2><p>${esc(rep.assessment)}</p>` : ''}
    ${rep.progress?.length ? `<h2 style="color:#7c3aed">What moved</h2>${ul(rep.progress)}` : ''}
    ${rep.nextSteps?.length ? `<h2 style="color:#7c3aed">What to work on next</h2>${ul(rep.nextSteps)}` : ''}

    ${rep.homework ? `<div style="background:#fff8e6;border-left:4px solid #e0a52a;border-radius:0 10px 10px 0;padding:12px 16px;margin-top:14px">
      <div style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a97a10;font-weight:700;margin-bottom:5px">Between now and your next session</div>
      <div style="font-size:12.5px;color:#5c4708;line-height:1.6">${esc(rep.homework)}</div></div>` : ''}

    ${rep.coachNote ? `<h2 style="color:#7c3aed">From your coach</h2><p style="font-style:italic">${esc(rep.coachNote)}</p>` : ''}

    <h2 style="color:#7c3aed">Your notes</h2>${dashLines(3)}`

  // Two pages, printed together: the report for the parent, the certificate for
  // the child. One print job, because a coach handing these out at the end of a
  // camp should not have to run two.
  return openPrintDoc(`${playerName} — ${camp.name} report`,
    printPage({
      org, kicker: 'End-of-camp report', title: playerName, accent: '#7c3aed',
      chips: [camp.name, dateRange(camp), stage ? (noun === 'racket' ? `${stage} racket` : String(stage)) : ''].filter(Boolean),
      body, footNote: `${camp.name} · report`,
    }) + certificatePage(camp, org, playerName, stage, stageColour, achievement, noun))
}

// ── 4. The camp pack ────────────────────────────────────────────────────────
// Everything from the week, in the player's hands, on the day they leave.
//
// The old version was a page of white with a name, two numbers and a list of
// day numbers — and because it read `focus`/`did` while an AI-designed camp
// writes `theme`/`sessions`, the day list printed empty. A player would not keep
// that; a parent would not photograph it. This one is built from the same plan
// the coach ran, in the same house style as the report and the certificate, and
// it ends with the certificate so the whole thing prints as one job.
export type CampPackInput = {
  playerName: string
  attendancePct?: number | null
  stage?: string | null
  stageColour?: string | null
  /** Skills mastered at the current stage, by name. */
  mastered?: string[]
  achievement?: string | null
  /** "Racket" / "Colour" — whatever this coach calls the ladder. */
  stageNoun?: string
  campDays?: number | null
  coachNote?: string | null
}

export function campPackPages(camp: CampLike, org: PrintOrg, p: CampPackInput): string {
  const ACC = '#7c3aed'
  const noun = p.stageNoun || 'Racket'
  const days = (camp.itinerary || []).filter(d => d && typeof d.day === 'number')
  const onCourt = days.reduce((n, d) => n + (d.sessions?.length || 0), 0)
  const place = [camp.location, camp.region].filter(Boolean).join(', ')

  const tile = (label: string, value: string, sub?: string) => `
    <div style="flex:1;min-width:0;background:#faf9ff;border:1px solid #ece7fb;border-radius:12px;padding:12px 14px">
      <div style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#8b93a7;font-weight:700">${esc(label)}</div>
      <div style="font-size:21px;font-weight:800;color:#1a1d29;margin-top:3px;line-height:1.1">${esc(value)}</div>
      ${sub ? `<div style="font-size:10px;color:#8b93a7;margin-top:2px">${esc(sub)}</div>` : ''}
    </div>`

  const tiles = [
    tile('Attendance', p.attendancePct === null || p.attendancePct === undefined ? '—' : `${p.attendancePct}%`, 'of camp sessions'),
    tile('Days on camp', String(p.campDays ?? days.length ?? '—'), place || camp.name),
    tile('Sessions', onCourt ? String(onCourt) : '—', 'on the plan'),
    tile(noun, p.stage || '—', p.mastered?.length ? `${p.mastered.length} skill${p.mastered.length === 1 ? '' : 's'} mastered` : 'where they are now'),
  ].join('')

  const chips = (xs: string[]) => xs.map(x =>
    `<span style="display:inline-block;border:1px solid #e3d9fb;background:#f7f3ff;color:#5b21b6;border-radius:999px;padding:4px 12px;margin:0 6px 7px 0;font-size:11.5px;font-weight:600">${esc(x)}</span>`).join('')

  // Page 1 — the week at a glance.
  const cover = printPage({
    org, kicker: 'Camp pack', title: p.playerName, accent: ACC,
    chips: [camp.name, dateRange(camp), p.stage ? `${p.stage}${noun === 'Racket' ? ' racket' : ''}` : ''].filter(Boolean),
    footNote: `${camp.name} · camp pack`,
    body: `
      <div style="display:flex;gap:10px;margin-top:16px">${tiles}</div>

      ${p.achievement ? `<div class="succ"><div class="lbl">Achieved this week</div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:22px;height:14px;border-radius:3px;background:${esc(p.stageColour || ACC)};border:1px solid rgba(0,0,0,.2);flex-shrink:0"></span>
          <span style="font-size:13px;font-weight:700;color:#1a1d29">${esc(p.achievement)}</span>
        </div></div>` : ''}

      ${p.mastered?.length ? `<h2 style="color:${ACC}">Mastered on this ${esc(noun.toLowerCase())}</h2><div>${chips(p.mastered)}</div>` : ''}

      ${camp.objectives?.length ? `<h2 style="color:${ACC}">What the week was built around</h2>${ul(camp.objectives)}` : ''}

      ${camp.parent_brief?.whatTheyLeaveWith?.length
        ? `<h2 style="color:${ACC}">What they leave with</h2>${ul(camp.parent_brief.whatTheyLeaveWith)}`
        : ''}

      ${p.coachNote ? `<div class="diag" style="border-color:${ACC};background:${ACC}0e">
        <div class="lbl" style="color:${ACC}">From your coach</div>
        <p style="margin:0;font-style:italic">${esc(p.coachNote)}</p></div>` : ''}
    `,
  })

  // Page 2 — the week itself, from the plan that was actually run.
  const dayBlock = (d: CampDay) => {
    const sessions = (d.sessions || []).map(sn => {
      const c = SESSION_COLOUR[String(sn.type || '')] || '#8b93a7'
      return `<tr>
        <td style="width:58px;color:#8b93a7;font-size:10.5px;white-space:nowrap">${esc(sn.time || sn.slot || '')}</td>
        <td>
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:7px"></span>
          <strong style="font-size:12px">${esc(sn.title || sn.type || 'Session')}</strong>
          ${sn.where ? `<span style="color:#8b93a7;font-size:10.5px"> · ${esc(sn.where)}</span>` : ''}
          ${sn.detail ? `<div style="color:#5b6172;font-size:11px;margin-top:2px">${esc(sn.detail)}</div>` : ''}
        </td></tr>`
    }).join('')
    const line = d.did || d.focus || d.coachFocus || ''
    return `
      <div style="margin-top:14px;page-break-inside:avoid">
        <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #ecedf2;padding-bottom:5px">
          <span style="font-size:11px;font-weight:800;color:${ACC};letter-spacing:.08em">DAY ${d.day}</span>
          <span style="font-size:13px;font-weight:700;color:#1a1d29">${esc(d.theme || d.focus || (d.rest ? 'Lighter day' : `Day ${d.day}`))}</span>
          <span style="margin-left:auto;font-size:10px;color:#8b93a7">${esc(d.date || '')}${d.rest ? ' · lighter day' : ''}</span>
        </div>
        ${line && line !== d.theme ? `<p style="margin:6px 0 0;font-size:11.5px">${esc(line)}</p>` : ''}
        ${sessions ? `<table>${sessions}</table>` : ''}
      </div>`
  }

  const week = days.length ? printPage({
    org, kicker: 'Camp pack', title: 'Your week, day by day', accent: ACC,
    chips: [camp.name, dateRange(camp)].filter(Boolean),
    footNote: `${camp.name} · the week`,
    body: `
      ${camp.daily_rhythm ? `<p style="margin-top:14px">${esc(camp.daily_rhythm)}</p>` : ''}
      ${days.map(dayBlock).join('')}
      <h2 style="color:${ACC}">Your notes</h2>${dashLines(4)}
    `,
  }) : ''

  return cover + week + certificatePage(camp, org, p.playerName, p.stage, p.stageColour, p.achievement, noun.toLowerCase())
}

export function printCampPack(camp: CampLike, org: PrintOrg, p: CampPackInput): boolean {
  return openPrintDoc(`${p.playerName} — ${camp.name} camp pack`, campPackPages(camp, org, p))
}
