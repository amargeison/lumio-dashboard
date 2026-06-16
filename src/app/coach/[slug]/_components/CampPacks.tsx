'use client'

// Training-camp extras: Equipment / kit list, and the printable Player Camp
// Pack (daily summaries + a premium end-of-camp pack with a certificate).
// Self-contained (its own small UI primitives) so it can't create import
// cycles with CoachModules.

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  CAMP_EQUIPMENT, buildPlayerCampLog, playerCampStats, BELTS, COACH_ORG,
  type Camp, type CampAttendee,
} from '../_lib/coach-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── local primitives ───────────────────────────────────────────────────────
function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div></div>
}
function Pill({ T, children, color, bg }: { T: ThemeTokens; children: ReactNode; color?: string; bg?: string }) {
  return <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: bg ?? T.hover, color: color ?? T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</span>
}
function Avatar({ accent, initials, size = 30 }: { accent: AccentTokens; initials: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.34, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}
function BeltChip({ beltIndex, size = 16 }: { beltIndex: number; size?: number }) {
  const b = BELTS[beltIndex]
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: size, height: size * 0.62, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</span></span>
}

// ════════════════════════════════════════════════════════════════════════════
// EQUIPMENT
// ════════════════════════════════════════════════════════════════════════════
export function CampEquipment({ T, accent, density, camp }: Common & { camp: Camp }) {
  const tone = (s: string) => s === 'ready' ? T.good : s === 'order' ? T.warn : '#3A8EE0'
  const label = (s: string) => s === 'ready' ? 'Ready' : s === 'order' ? 'To order' : 'Check'
  const all = CAMP_EQUIPMENT.flatMap(c => c.items)
  const ready = all.filter(i => i.status === 'ready').length
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: density.gap, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, color: T.text2 }}>
          Kit checklist for <strong style={{ color: T.text }}>{camp.name}</strong> — <span className="tnum">{ready}/{all.length}</span> ready
        </div>
        <button onClick={() => openPrint(equipmentListHTML(camp))} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="note" size={14} stroke={2} /> Print kit list
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: density.gap }} className="cm-eq">
        {CAMP_EQUIPMENT.map(cat => (
          <Card key={cat.category} T={T} density={density}>
            <SectionHead T={T} title={<><Icon name={cat.icon} size={13} stroke={1.7} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />{cat.category}</>} right={<span style={{ fontFamily: FONT_MONO }}>{cat.items.length}</span>} />
            {cat.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: tone(it.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text }}>{it.name}</div>
                  {it.note && <div style={{ fontSize: 10.5, color: T.text3 }}>{it.note}</div>}
                </div>
                <span className="tnum" style={{ fontSize: 11, color: T.text2, fontFamily: FONT_MONO }}>{it.qty}</span>
                <Pill T={T} color={tone(it.status)} bg={`${tone(it.status)}1f`}>{label(it.status)}</Pill>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYER CAMP PACKS
// ════════════════════════════════════════════════════════════════════════════
export function CampPlayerPacks({ T, accent, density, camp, attendees }: Common & { camp: Camp; attendees: CampAttendee[] }) {
  const [selName, setSelName] = useState(attendees[0]?.name ?? '')
  const a = attendees.find(x => x.name === selName) ?? attendees[0]
  if (!a) return <Card T={T} density={density}><div style={{ fontSize: 12, color: T.text3 }}>No attendees on this camp yet.</div></Card>
  const log = buildPlayerCampLog(a, camp)
  const stats = playerCampStats(a, camp)
  const serveGain = stats.serveEnd - stats.serveStart
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: density.gap }} className="cm-md">
      {/* player list */}
      <Card T={T} density={density} style={{ padding: 8, alignSelf: 'start' }}>
        {attendees.map(p => {
          const on = p.name === a.name
          return (
            <div key={p.name} onClick={() => setSelName(p.name)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: on ? accent.dim : 'transparent', border: `1px solid ${on ? accent.border : 'transparent'}`, marginBottom: 2 }}>
              <Avatar accent={accent} initials={p.initials} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: T.text3 }}>{BELTS[p.beltIndex].name} · age {p.age}</div>
              </div>
            </div>
          )
        })}
      </Card>

      {/* pack preview + print */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
        <Card T={T} density={density}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Avatar accent={accent} initials={a.initials} size={44} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.text }}>{a.name}</div>
              <div style={{ fontSize: 12, color: T.text3 }}>{camp.name} · {camp.start}–{camp.end}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openPrint(dailySummaryHTML(a, camp, log))} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <Icon name="note" size={14} stroke={1.8} /> Print daily summary
              </button>
              <button onClick={() => openPrint(certificateDoc(a, camp))} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <Icon name="trophy" size={14} stroke={1.8} /> Certificate
              </button>
              <button onClick={() => openPrint(campPackHTML(a, camp))} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon name="trophy" size={14} stroke={2} /> Print camp pack
              </button>
            </div>
          </div>

          {/* stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 14 }}>
            {[
              { l: 'Attendance', v: `${stats.attendancePct}%`, s: `${stats.sessionsAttended}/${stats.totalSessions} sessions` },
              { l: 'Court hours', v: stats.hours, s: 'over 14 days' },
              { l: 'Sets played', v: stats.sets, s: `${stats.setsWon} won` },
              { l: '1st serve %', v: `${stats.serveEnd}%`, s: `▲ ${serveGain} pts`, good: true },
              { l: 'Racket', v: BELTS[stats.beltEnd].name, s: stats.beltEnd > stats.beltStart ? 'promoted!' : 'progressing' },
            ].map((m, i) => (
              <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.l}</div>
                <div className="tnum" style={{ fontSize: 18, fontWeight: 600, color: T.text, marginTop: 2 }}>{m.v}</div>
                <div style={{ fontSize: 10, color: m.good ? T.good : T.text3 }}>{m.s}</div>
              </div>
            ))}
          </div>

          {/* improvements */}
          <div style={{ marginTop: 14 }}>
            <SectionHead T={T} title="Biggest improvements" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.improvements.map((im, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 7, padding: '5px 10px' }}>
                  <span style={{ color: T.good, fontWeight: 700 }}>▲</span>{im}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12.5, color: T.text2, fontStyle: 'italic' }}>“{stats.highlight}”</div>
          </div>
        </Card>

        {/* daily log preview */}
        <Card T={T} density={density}>
          <SectionHead T={T} title="Daily log" right={<span style={{ fontFamily: FONT_MONO }}>14 days</span>} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead><tr style={{ textAlign: 'left' }}>{['Day', 'Focus', 'What they did', 'Next action', 'Effort'].map(h => <th key={h} style={{ fontSize: 10, color: T.text3, fontWeight: 600, padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}</tr></thead>
              <tbody>
                {log.map(d => (
                  <tr key={d.day} style={{ borderTop: `1px solid ${T.border}`, opacity: d.rest ? 0.7 : 1 }}>
                    <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}><span className="tnum" style={{ fontWeight: 700, color: accent.hex }}>D{d.day}</span> <span style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO }}>{d.date}</span></td>
                    <td style={{ padding: '7px 8px', fontSize: 11.5, color: T.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{d.theme}</td>
                    <td style={{ padding: '7px 8px', fontSize: 11.5, color: T.text2, minWidth: 220 }}>{d.am}</td>
                    <td style={{ padding: '7px 8px', fontSize: 11.5, color: T.text2, minWidth: 180 }}>{d.nextAction}</td>
                    <td style={{ padding: '7px 8px', color: accent.hex, fontSize: 11 }}>{'★'.repeat(d.effort)}<span style={{ color: T.text4 }}>{'★'.repeat(5 - d.effort)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PRINT BUILDERS
// ════════════════════════════════════════════════════════════════════════════
function openPrint(html: string) {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the pack.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* user can print manually */ } }, 350)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

const BASE_CSS = `
  *{box-sizing:border-box}
  body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;page-break-after:always;position:relative}
  .page:last-child{page-break-after:auto}
  h1,h2,h3{margin:0}
  .accent{color:#a855f7}
  .muted{color:#6b7280}
  .band{background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:22px 26px}
  .stat{border:1px solid #ecedf2;border-radius:12px;padding:14px 16px;background:#faf9ff}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#9099ad;padding:8px 8px;border-bottom:2px solid #ecedf2}
  td{font-size:11px;padding:8px 8px;border-bottom:1px solid #f0f1f6;vertical-align:top}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
  @page{size:A4;margin:0}
  @media print{.noprint{display:none}}
`

function beltColour(i: number) { return BELTS[i]?.colour ?? '#a855f7' }

function certificateInner(a: CampAttendee, camp: Camp) {
  const stats = playerCampStats(a, camp)
  const beltName = BELTS[stats.beltEnd].name
  return `
  <section class="page" style="display:flex;align-items:center;justify-content:center;padding:0">
    <div style="position:absolute;inset:10mm;border:2px solid #C9A227;border-radius:8px"></div>
    <div style="position:absolute;inset:13mm;border:1px solid #e3c97a;border-radius:6px"></div>
    <div style="position:absolute;font-size:340px;opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%)">🎾</div>
    <div style="text-align:center;padding:30mm 24mm;position:relative;max-width:170mm">
      <div style="font-size:12px;letter-spacing:.5em;color:#a855f7;font-weight:700;text-transform:uppercase">Lumio Tennis Academy</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;letter-spacing:.04em;margin-top:14px;color:#1a1d29">Certificate of Achievement</div>
      <div style="width:70px;height:3px;background:#C9A227;margin:16px auto 22px"></div>
      <div style="font-size:13px;color:#6b7280">This is proudly presented to</div>
      <div style="font-family:Georgia,serif;font-size:46px;color:#7c3aed;margin:10px 0 6px;font-weight:600">${esc(a.name)}</div>
      <div style="font-size:14px;color:#374151;max-width:130mm;margin:8px auto 0;line-height:1.6">
        for outstanding commitment and progress at the <strong>${esc(camp.name)}</strong>,
        ${esc(camp.location)}, ${esc(camp.country) }, ${esc(camp.start)} – ${esc(camp.end)}.
      </div>
      <div style="display:inline-flex;align-items:center;gap:10px;margin-top:22px;background:#faf7ff;border:1px solid #ead9ff;border-radius:30px;padding:8px 18px">
        <span style="width:22px;height:14px;border-radius:3px;background:${beltColour(stats.beltEnd)};border:1px solid rgba(0,0,0,.2)"></span>
        <span style="font-weight:700;color:#1a1d29">${esc(beltName)} racket achieved</span>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:34px;padding:0 6mm">
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#1a1d29">${esc(COACH_ORG.coach)}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Head Coach · ${esc(COACH_ORG.cert)}</div>
        </div>
        <div style="width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#F4D77B,#C9A227);box-shadow:0 5px 16px rgba(201,162,39,.45);display:flex;align-items:center;justify-content:center;color:#5a4710;font-weight:800;font-size:11px;text-align:center;line-height:1.1;border:3px solid #fff;outline:2px solid #C9A227">CAMP<br/>2026</div>
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-size:18px;color:#1a1d29">${esc(camp.end)}</div>
          <div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Date awarded</div>
        </div>
      </div>
      <div style="margin-top:26px;font-size:10px;color:#aab;letter-spacing:.1em">LUMIO COACH · lumiosports.com</div>
    </div>
  </section>`
}

function certificateDoc(a: CampAttendee, camp: Camp) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate — ${esc(a.name)}</title><style>${BASE_CSS}</style></head><body>${certificateInner(a, camp)}</body></html>`
}

function campPackHTML(a: CampAttendee, camp: Camp) {
  const stats = playerCampStats(a, camp)
  const log = buildPlayerCampLog(a, camp)
  const serveGain = stats.serveEnd - stats.serveStart
  const beltMove = stats.beltEnd > stats.beltStart
    ? `${BELTS[stats.beltStart].name} → <strong>${BELTS[stats.beltEnd].name}</strong> 🎉`
    : `${BELTS[stats.beltStart].name} (progressing)`
  const statCards = [
    ['Attendance', `${stats.attendancePct}%`, `${stats.sessionsAttended} of ${stats.totalSessions} sessions`],
    ['Court hours', `${stats.hours}`, 'over the fortnight'],
    ['Sets played', `${stats.sets}`, `${stats.setsWon} won`],
    ['1st serve', `${stats.serveEnd}%`, `up ${serveGain} points`],
  ].map(([l, v, s]) => `<div class="stat"><div style="font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#9099ad">${l}</div><div style="font-size:26px;font-weight:700;margin-top:4px">${v}</div><div style="font-size:10px;color:#6b7280">${s}</div></div>`).join('')
  const improveRows = stats.improvements.map(im => `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0f1f6"><span style="color:#16a34a;font-weight:800">▲</span><span style="font-size:13px">${esc(im)}</span><span style="margin-left:auto;font-size:10px;color:#16a34a;font-weight:700">improved</span></div>`).join('')
  const logRows = log.map(d => `<tr><td style="white-space:nowrap"><strong style="color:#7c3aed">Day ${d.day}</strong><br/><span style="color:#9099ad;font-size:9px">${esc(d.date)}</span></td><td style="white-space:nowrap"><strong>${esc(d.theme)}</strong></td><td>${esc(d.am)}</td><td>${esc(d.nextAction)}</td><td style="color:#C9A227;white-space:nowrap">${stars(d.effort)}</td></tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(a.name)} — Camp Pack</title><style>${BASE_CSS}</style></head><body>
  ${certificateInner(a, camp)}

  <section class="page">
    <div class="band">
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Personal Camp Pack</div>
      <div style="font-size:34px;font-weight:800;margin-top:6px">${esc(a.name)}</div>
      <div style="opacity:.9;margin-top:4px">${esc(camp.name)} · ${esc(camp.location)}, ${esc(camp.country)} · ${esc(camp.start)} – ${esc(camp.end)}</div>
    </div>
    <h3 style="margin:22px 0 12px;font-size:14px">Your fortnight by the numbers</h3>
    <div class="grid4">${statCards}</div>
    <div style="margin-top:18px;border:1px solid #ecedf2;border-radius:12px;padding:16px 18px;background:#faf9ff">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9099ad">Racket progression</div>
      <div style="font-size:20px;margin-top:6px">${beltMove}</div>
    </div>
    <div class="grid2" style="margin-top:18px">
      <div>
        <h3 style="font-size:14px;margin-bottom:8px">Biggest improvements</h3>
        ${improveRows}
      </div>
      <div>
        <h3 style="font-size:14px;margin-bottom:8px">Coach's message</h3>
        <div style="background:#f7f4ff;border-left:3px solid #a855f7;border-radius:0 8px 8px 0;padding:14px 16px;font-size:12.5px;line-height:1.7;color:#374151">
          ${esc(a.name.split(' ')[0])}, what a fortnight. ${esc(stats.highlight)} You showed up, worked hard and your tennis is in a genuinely better place than when you arrived. Keep the off-season plan ticking over and you'll keep climbing.
          <div style="margin-top:10px;font-family:Georgia,serif;font-style:italic;font-size:15px;color:#1a1d29">— ${esc(COACH_ORG.coach)}</div>
        </div>
      </div>
    </div>
    <div class="foot"><span>Lumio Coach · ${esc(COACH_ORG.academy)}</span><span>Personal pack for ${esc(a.name)}</span></div>
  </section>

  <section class="page">
    <h2 style="font-size:20px;margin-bottom:4px">Day-by-day at camp</h2>
    <div class="muted" style="font-size:12px;margin-bottom:14px">Everything you worked on, and the next action you took into each day.</div>
    <table>
      <thead><tr><th>Day</th><th>Focus</th><th>What you did</th><th>Next action</th><th>Effort</th></tr></thead>
      <tbody>${logRows}</tbody>
    </table>
    <div class="foot"><span>Lumio Coach · ${esc(COACH_ORG.academy)}</span><span>See you on court 🎾</span></div>
  </section>
  </body></html>`
}

function dailySummaryHTML(a: CampAttendee, camp: Camp, log: ReturnType<typeof buildPlayerCampLog>) {
  const rows = log.map(d => `<tr><td style="white-space:nowrap"><strong style="color:#7c3aed">Day ${d.day}</strong> <span style="color:#9099ad;font-size:9px">${esc(d.date)}</span></td><td style="white-space:nowrap"><strong>${esc(d.theme)}</strong></td><td>${esc(d.am)}</td><td>${esc(d.pm)}</td><td style="font-weight:600">${esc(d.nextAction)}</td></tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(a.name)} — Daily Summary</title><style>${BASE_CSS}</style></head><body>
  <section class="page">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #a855f7;padding-bottom:10px;margin-bottom:16px">
      <div><div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a855f7;font-weight:700">Daily Session Summary</div>
      <div style="font-size:24px;font-weight:800;margin-top:4px">${esc(a.name)}</div></div>
      <div style="text-align:right;font-size:11px;color:#6b7280">${esc(camp.name)}<br/>${esc(camp.start)} – ${esc(camp.end)}</div>
    </div>
    <table>
      <thead><tr><th>Day</th><th>Focus</th><th>Morning</th><th>Afternoon</th><th>Next action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="foot"><span>Lumio Coach · ${esc(COACH_ORG.academy)}</span><span>${esc(COACH_ORG.coach)}</span></div>
  </section></body></html>`
}

function equipmentListHTML(camp: Camp) {
  const cats = CAMP_EQUIPMENT.map(c => {
    const rows = c.items.map(it => `<tr><td style="width:24px"><span style="display:inline-block;width:13px;height:13px;border:1.5px solid #9099ad;border-radius:3px"></span></td><td><strong>${esc(it.name)}</strong>${it.note ? `<br/><span style="font-size:9px;color:#9099ad">${esc(it.note)}</span>` : ''}</td><td style="white-space:nowrap;text-align:right">${esc(it.qty)}</td><td style="white-space:nowrap;text-transform:capitalize;color:${it.status === 'ready' ? '#16a34a' : it.status === 'order' ? '#b45309' : '#2563eb'}">${it.status === 'order' ? 'to order' : it.status}</td></tr>`).join('')
    return `<div style="break-inside:avoid;margin-bottom:14px"><div style="font-size:13px;font-weight:700;color:#7c3aed;border-bottom:2px solid #ecedf2;padding-bottom:5px;margin-bottom:4px">${esc(c.category)}</div><table>${rows}</table></div>`
  }).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(camp.name)} — Kit List</title><style>${BASE_CSS}</style></head><body>
  <section class="page">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #a855f7;padding-bottom:10px;margin-bottom:16px">
      <div><div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a855f7;font-weight:700">Camp Equipment Checklist</div>
      <div style="font-size:24px;font-weight:800;margin-top:4px">${esc(camp.name)}</div></div>
      <div style="text-align:right;font-size:11px;color:#6b7280">${esc(camp.resort)}<br/>${esc(camp.start)} – ${esc(camp.end)}</div>
    </div>
    <div style="columns:2;column-gap:18px">${cats}</div>
    <div class="foot"><span>Lumio Coach · ${esc(COACH_ORG.academy)}</span><span>Packed by ____________________</span></div>
  </section></body></html>`
}
