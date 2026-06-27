'use client'

// Live (founder portal) Racket Progression — the full demo Racket Progression
// System rendered over real data. LTA-aligned ladder, the Racket Reward System,
// an expandable stage detail and the Squad racket matrix. Player progress per
// stage is computed from coach_player_skills (a skill counts once it's Consistent
// = 4). "Award reward" advances the player to the next racket (coach_players
// .racket_stage) and prints a certificate — so marking a level complete really
// does move the player up the ladder.

import { useState, useMemo, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, RACKET_STAGES, SKILLS_BY_STAGE } from '../_lib/coach-db'

type Player = { id: string; name: string; level?: string | null; racket_stage?: string | null }
type SkillRow = { player_id: string; skill: string; score: number }

// Per-stage presentation + LTA-pathway alignment (matches the demo ladder).
const STAGE_META: Record<string, { theme: string; age: string; ball: string }> = {
  white:  { theme: 'Foundations',     age: 'Ages 5–7 · first racket',  ball: 'Red' },
  yellow: { theme: 'Rallying',        age: 'Ages 6–8 · red ball',      ball: 'Red' },
  orange: { theme: 'Net & Touch',     age: 'Ages 8–9 · orange ball',   ball: 'Orange' },
  green:  { theme: 'The Serve',       age: 'Ages 9–10 · green ball',   ball: 'Green' },
  blue:   { theme: 'Spin & Shape',    age: 'Ages 10–12 · yellow ball', ball: 'Yellow' },
  purple: { theme: 'Specialty Shots', age: 'Ages 11–14 · developing',  ball: 'Yellow' },
  brown:  { theme: 'Weapons',         age: 'Ages 13+ · competitive',   ball: 'Yellow' },
  red:    { theme: 'Tactics',         age: 'Tournament player',        ball: 'Yellow' },
  black:  { theme: 'Mastery',         age: 'Performance / elite',      ball: 'Yellow' },
}
const LTA_MAP: Record<string, { stage: string; colour: string; ages: string; focus: string }> = {
  white:  { stage: 'LTA Youth · Blue',              colour: '#3A8EE0', ages: '4–6',    focus: 'Balance, coordination, agility, racket & ball skills' },
  yellow: { stage: 'LTA Youth · Red',               colour: '#C75A5A', ages: '6–8',    focus: 'Serve, rally and score on red courts' },
  orange: { stage: 'LTA Youth · Orange',            colour: '#E08A3C', ages: '8–9',    focus: 'A rounded game — develop the different shots' },
  green:  { stage: 'LTA Youth · Green',             colour: '#4FAE72', ages: '9–10',   focus: 'Full court — refine and test technique' },
  blue:   { stage: 'LTA Youth · Yellow',            colour: '#E5C76B', ages: '10–16',  focus: 'Real balls, full court — game styles & spin' },
  purple: { stage: 'LTA Youth Compete',             colour: '#7c5cbf', ages: '11–14',  focus: 'Start & build competing — Youth Grades' },
  brown:  { stage: 'LTA Youth Compete · County',    colour: '#9A6B4F', ages: '13+',    focus: 'County-level competition & match weapons' },
  red:    { stage: 'Performance · County–Regional', colour: '#C75A5A', ages: 'Junior', focus: 'Tactical match-play on the performance pathway' },
  black:  { stage: 'Performance · Regional–National', colour: '#2A3142', ages: 'Elite', focus: 'National-level performance & mastery' },
}
const BALL_COLOUR: Record<string, string> = { Red: '#C75A5A', Orange: '#E08A3C', Green: '#4FAE72', Yellow: '#E5C76B' }
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const LAST = RACKET_STAGES.length - 1
const TOTAL_SKILLS = RACKET_STAGES.reduce((n, s) => n + (SKILLS_BY_STAGE[s.id]?.length || 0), 0)

export function LiveRacketProgression({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows: players, edit } = useCoachTable<Player>('coach_players')
  const { rows: skillRows } = useCoachTable<SkillRow>('coach_player_skills')
  const [open, setOpen] = useState('white')

  // playerId → { skill: score }
  const skillMap = useMemo(() => {
    const m: Record<string, Record<string, number>> = {}
    for (const r of skillRows) { (m[r.player_id] ||= {})[r.skill] = r.score }
    return m
  }, [skillRows])

  const counts = RACKET_STAGES.map(s => players.filter(p => p.racket_stage === s.id).length)
  const rawIdxOf = (p: Player) => RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
  const progressAt = (p: Player, idx: number) => {
    const skills = SKILLS_BY_STAGE[RACKET_STAGES[idx].id] || []
    if (!skills.length) return 0
    const sm = skillMap[p.id] || {}
    return Math.round(skills.filter(sk => (sm[sk] || 0) >= 4).length / skills.length * 100)
  }

  const award = (p: Player) => {
    const raw = rawIdxOf(p)
    if (raw < 0) { edit(p.id, { racket_stage: 'white' }); return }   // start them on White
    const completed = RACKET_STAGES[raw]
    printRacketCertificate(p.name, completed, SKILLS_BY_STAGE[completed.id] || [])
    if (raw < LAST) edit(p.id, { racket_stage: RACKET_STAGES[raw + 1].id })
  }

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }
  const sectionHead = (title: string, right?: ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>
      {right && <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{right}</div>}
    </div>
  )
  const openStage = RACKET_STAGES.find(s => s.id === open) || RACKET_STAGES[0]

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Racket Progression System</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>A Kyu-Dan style ranking adapted for tennis. Nine rackets, each unlocking a cluster of skills — earn a racket when every skill is Consistent or better.</p>
      </div>

      {/* LTA alignment */}
      <div style={{ ...card, borderColor: accent.border, background: accent.dim }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: accent.hex, flexShrink: 0 }}>🛡️</span>
          <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5 }}>
            <strong>Aligned to the LTA Youth pathway.</strong> Each racket maps to a stage of the LTA Youth programme — the five official ball-colour stages <span style={{ color: T.text2 }}>Blue → Red → Orange → Green → Yellow</span>, then the LTA Youth Compete grades and the performance pathway. The racket is your academy ladder; the LTA stage is the national-framework equivalent shown on every racket below.
          </div>
        </div>
      </div>

      {/* Racket Reward System */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, flexShrink: 0, fontSize: 17 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>Racket Reward System — earn the racket, collect the reward</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3, lineHeight: 1.5, maxWidth: 640 }}>
              Every level is a milestone players keep. When a student masters every skill in their racket (Consistent or better), you award them the <strong style={{ color: T.text }}>coloured racket keyring and matching dampener</strong> for that level plus a <strong style={{ color: T.text }}>certificate</strong> — with a <strong style={{ color: T.text }}>full trophy at Black</strong>. A tangible reward that drives motivation and retention.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { icon: '✓', t: 'Complete the level', d: 'Every skill Consistent or better' },
            { icon: '🏆', t: 'Award the reward', d: 'Hand over the keyring, dampener & certificate' },
            { icon: '✦', t: 'Celebrate', d: 'A milestone the player keeps' },
            { icon: '⚑', t: 'On to the next', d: 'New racket, new skills to earn' },
          ].map((s, i, arr) => (
            <div key={s.t} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}>
              <div style={{ flex: 1, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ color: accent.hex }}>{s.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.t}</span>
                </div>
                <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>{s.d}</div>
              </div>
              {i < arr.length - 1 && <span style={{ color: T.text4, flexShrink: 0 }}>›</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {RACKET_STAGES.map(s => <span key={s.id} title={`${s.name} keyring + dampener`} style={{ display: 'inline-block', width: 13, height: 13, borderRadius: 3, background: s.colour, border: '1px solid rgba(128,128,128,0.4)' }} />)}
            <span style={{ fontSize: 11, color: T.text3, marginLeft: 4 }}>9 keyring + dampener sets · one per level</span>
          </div>
        </div>
      </div>

      {/* The ladder */}
      <div style={card}>
        {sectionHead('The ladder', `White → Black · ${TOTAL_SKILLS} skills`)}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RACKET_STAGES.map((s, bi) => {
            const meta = STAGE_META[s.id]; const lta = LTA_MAP[s.id]
            return (
              <div key={s.id} onClick={() => setOpen(s.id)} style={{ flex: '1 1 90px', cursor: 'pointer', padding: '10px 8px', borderRadius: 8, background: open === s.id ? accent.dim : T.panel2, border: `1px solid ${open === s.id ? accent.border : T.border}`, textAlign: 'center' }}>
                <div style={{ height: 22, borderRadius: 4, background: s.colour, border: '1px solid rgba(128,128,128,0.4)', marginBottom: 6 }} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>{bi + 1}. {s.name}</div>
                <div style={{ fontSize: 9.5, color: T.text3 }}>{meta?.theme}</div>
                <div style={{ marginTop: 4, display: 'inline-block', fontSize: 9, fontWeight: 700, color: BALL_COLOUR[meta?.ball], background: `${BALL_COLOUR[meta?.ball]}1f`, padding: '2px 7px', borderRadius: 999 }}>{meta?.ball} ball</div>
                <div style={{ fontSize: 8.5, color: lta?.colour ?? T.text3, marginTop: 4, fontWeight: 600 }}>{lta?.stage.replace(/LTA Youth ?· ?/, '').replace('LTA Youth ', '')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded stage detail */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ width: 40, height: 26, borderRadius: 5, background: openStage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{openStage.name} racket — {STAGE_META[openStage.id]?.theme}</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{STAGE_META[openStage.id]?.age} · {STAGE_META[openStage.id]?.ball} ball stage</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '4px 10px' }}>{(SKILLS_BY_STAGE[openStage.id] || []).length} skills to master</div>
        </div>
        {LTA_MAP[openStage.id] && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${LTA_MAP[openStage.id].colour}`, borderRadius: 8, padding: '9px 12px', marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: LTA_MAP[openStage.id].colour, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LTA alignment</span>
            <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{LTA_MAP[openStage.id].stage}</span>
            <span style={{ fontSize: 11, color: T.text3 }}>· ages {LTA_MAP[openStage.id].ages}</span>
            <span style={{ fontSize: 11.5, color: T.text2, flexBasis: '100%' }}>{LTA_MAP[openStage.id].focus}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(SKILLS_BY_STAGE[openStage.id] || []).map(sk => (
            <div key={sk} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text }}>{sk}</div>
          ))}
        </div>
      </div>

      {/* Squad racket matrix */}
      <div style={card}>
        {sectionHead('Squad racket matrix', `${players.length} players`)}
        {players.length === 0 ? (
          <p style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No players yet — add players in the Player Roster, then set their racket and grade skills to see progress here.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player</th>
                  {RACKET_STAGES.map(s => <th key={s.id} style={{ padding: '6px 4px' }}><div title={s.name} style={{ width: 20, height: 12, borderRadius: 2, background: s.colour, border: '1px solid rgba(128,128,128,0.4)', margin: '0 auto' }} /></th>)}
                  <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase' }}>Now</th>
                  <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 8px', textTransform: 'uppercase', textAlign: 'right' }}>Award</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => {
                  const raw = rawIdxOf(p)
                  const hasStage = raw >= 0
                  const curIdx = hasStage ? raw : 0
                  const curProg = hasStage ? progressAt(p, curIdx) : 0
                  const ready = curProg >= 100
                  const curStage = RACKET_STAGES[curIdx]
                  return (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, border: `1px solid ${accent.border}` }}>{initials(p.name)}</span>
                          <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p.name}</span>
                        </div>
                      </td>
                      {RACKET_STAGES.map((s, bi) => {
                        let cell: ReactNode = null
                        if (hasStage && bi < curIdx) cell = <span style={{ color: T.good, fontWeight: 800 }}>✓</span>
                        else if (hasStage && bi === curIdx) cell = <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, color: accent.hex, fontWeight: 700 }}>{curProg}%</span>
                        return <td key={s.id} style={{ textAlign: 'center', padding: '8px 4px' }}>{cell}</td>
                      })}
                      <td style={{ padding: '8px 10px' }}>
                        {hasStage ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text, fontWeight: 600 }}>
                            <span style={{ width: 14, height: 14, borderRadius: 4, background: curStage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{curStage.name}
                          </span>
                        ) : <span style={{ fontSize: 11.5, color: T.text3 }}>Not started</span>}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                        <button onClick={() => award(p)}
                          title={!hasStage ? `Start ${p.name} on the White racket` : ready ? `Award the ${curStage.name} keyring + dampener + certificate, and advance ${p.name} to the next racket` : `${p.name} is ${curProg}% through this racket — awarding gives the reward and moves them up`}
                          style={{ appearance: 'none', border: `1px solid ${ready ? accent.hex : T.border}`, background: ready ? accent.hex : 'transparent', color: ready ? T.btnText : accent.hex, borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontFamily: FONT }}>
                          {!hasStage ? '▶ Start on White' : curIdx === LAST ? '🏆 Award reward' : '🏆 Award reward'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: T.good, fontWeight: 800 }}>✓</span> racket earned</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700 }}>%</span> progress on current racket (skills graded Consistent in the Player Roster)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>🏆 award = keyring + dampener + certificate, then advance to the next racket</span>
        </div>
      </div>
    </div>
  )
}

// Printable racket-award certificate (live equivalent of the demo's).
function printRacketCertificate(playerName: string, stage: { name: string; colour: string }, skills: string[]) {
  if (typeof window === 'undefined') return
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const chips = skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(stage.name)} Racket — ${esc(playerName)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center}
  .chip{display:inline-block;font-size:11px;background:#f5f7fb;border:1px solid #dfe4ee;color:#33415c;border-radius:20px;padding:4px 12px;margin:0 5px 8px}
  @page{size:A4;margin:0}</style></head><body>
  <div class="page">
    <div style="position:absolute;inset:10mm;border:2px solid ${stage.colour};border-radius:8px;opacity:.9"></div>
    <div style="position:absolute;inset:13mm;border:1px solid #e3c97a;border-radius:6px"></div>
    <div style="position:absolute;font-size:340px;opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%)">🎾</div>
    <div style="text-align:center;padding:28mm 24mm;position:relative;max-width:170mm">
      <div style="font-size:12px;letter-spacing:.5em;color:#3A8EE0;font-weight:700;text-transform:uppercase">Lumio Tennis Academy</div>
      <div style="font-family:Georgia,serif;font-size:40px;letter-spacing:.04em;margin-top:14px">Racket Award</div>
      <div style="width:70px;height:3px;background:${stage.colour};margin:14px auto 20px;border:1px solid rgba(0,0,0,.15)"></div>
      <div style="font-size:13px;color:#6b7280">This certifies that</div>
      <div style="font-family:Georgia,serif;font-size:44px;color:#1f6fd6;margin:8px 0 4px;font-weight:600">${esc(playerName)}</div>
      <div style="font-size:14px;color:#374151;margin-top:8px">has been awarded the</div>
      <div style="display:inline-flex;align-items:center;gap:14px;margin:16px 0 6px">
        <span style="width:54px;height:34px;border-radius:5px;background:${stage.colour};border:1px solid rgba(0,0,0,.25);box-shadow:0 3px 10px rgba(0,0,0,.18)"></span>
        <span style="font-family:Georgia,serif;font-size:34px;font-weight:700">${esc(stage.name)} Racket</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-top:8px">Awarded with the coloured racket keyring &amp; matching dampener</div>
      <div style="margin:20px auto 0;max-width:150mm">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9099ad;margin-bottom:8px">Skills mastered</div>${chips}
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:34px;padding:0 6mm">
        <div style="text-align:center"><div style="font-family:Georgia,serif;font-style:italic;font-size:21px">Lumio Coach</div><div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Head Coach</div></div>
        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#F4D77B,#C9A227);box-shadow:0 5px 16px rgba(201,162,39,.45);display:flex;align-items:center;justify-content:center;color:#5a4710;font-weight:800;font-size:11px;text-align:center;line-height:1.1;border:3px solid #fff;outline:2px solid #C9A227">RACKET<br/>EARNED</div>
        <div style="text-align:center"><div style="font-family:Georgia,serif;font-size:17px">${esc(today)}</div><div style="border-top:1px solid #cfd3df;margin-top:4px;padding-top:5px;font-size:10px;color:#6b7280">Date awarded</div></div>
      </div>
      <div style="margin-top:24px;font-size:10px;color:#aab;letter-spacing:.1em">LUMIO COACH · lumiosports.com</div>
    </div>
  </div></body></html>`
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the certificate.'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
