'use client'

// Camp designer — six questions, then Lumio Coach builds the whole camp.
//
// Two design decisions worth keeping:
//
//  1. NOTHING IS SAVED UNTIL THE COACH ACCEPTS. The previous "Re-design with AI"
//     button wrote straight over the existing camp with no preview and no undo —
//     one click could destroy a plan a coach had spent an evening editing. The
//     plan is now previewed in full and only written on Accept.
//  2. THE FORM IS SHORT ON PURPOSE. Most of what Boris needs is already on the
//     camp record, so the wizard prefills and asks only for what genuinely
//     changes the plan: who it is for, how many, and what they should leave with.
//     A coach should finish this between lessons, on a phone.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'

type Session = { slot?: string; time?: string; title?: string; type?: string; where?: string; detail?: string; cue?: string }
type Day = { day: number; theme?: string; rest?: boolean; coachFocus?: string; sessions?: Session[] }
type Brief = { intro?: string; whatTheyWorkOn?: string[]; whatToBring?: string[]; dailyShape?: string; whatTheyLeaveWith?: string[] }
export type CampPlan = { daily_rhythm?: string; objectives?: string[]; equipment?: string[]; itinerary?: Day[]; parent_brief?: Brief }

const SESSION_COLOUR: Record<string, string> = {
  Technical: '#3A8EE0', Tactical: '#a855f7', Physical: '#e0483f', 'Match play': '#3fbf6a',
  Video: '#d9a91f', Recovery: '#5bc0be', Social: '#f08a24', Briefing: '#8b93a7', Logistics: '#8b93a7',
}
const LEVELS = ['Beginner', 'Improver', 'Club / intermediate', 'County', 'Performance']

export function CampDesigner({
  T, accent, camp, days, onClose, onAccept,
}: {
  T: ThemeTokens; accent: AccentTokens
  camp: { name: string; region?: string | null; surface?: string | null; courts?: number | null; board?: string | null; description?: string | null; start_date?: string | null; ages?: string | null; group_size?: number | null; intent?: string | null; capacity?: number | null }
  days: number
  onClose: () => void
  onAccept: (plan: CampPlan, inputs: { ages: string; group_size: number | null; intent: string; board: string }) => Promise<void>
}) {
  // Prefilled from the camp — the coach confirms rather than retypes.
  const [ages, setAges] = useState(camp.ages || '')
  const [level, setLevel] = useState('Improver')
  const [board, setBoard] = useState(camp.board || 'Day camp')
  const [groupSize, setGroupSize] = useState(String(camp.group_size ?? camp.capacity ?? ''))
  const [courts, setCourts] = useState(String(camp.courts ?? ''))
  const [intent, setIntent] = useState(camp.intent || camp.description || '')

  const [stage, setStage] = useState<'form' | 'busy' | 'preview'>('form')
  const [plan, setPlan] = useState<CampPlan | null>(null)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const generate = async () => {
    setStage('busy'); setErr('')
    try {
      const res = await fetch('/api/coach/camp-design', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: camp.name, days, startDate: camp.start_date, region: camp.region,
          surface: camp.surface, courts: Number(courts) || camp.courts,
          board, ages, level, groupSize: Number(groupSize) || null, intent,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Design failed')
      setPlan(d); setStage('preview')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Design failed'); setStage('form') }
  }

  const accept = async () => {
    if (!plan || saving) return
    setSaving(true)
    try {
      await onAccept(plan, { ages, group_size: Number(groupSize) || null, intent, board })
      onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save'); setSaving(false) }
  }

  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' }
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 6px' }
  const btn = (bg: string, fg: string): CSSProperties => ({ appearance: 'none', border: 0, padding: '10px 16px', borderRadius: 10, background: bg, color: fg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, width: stage === 'preview' ? 720 : 480, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, background: T.panel, zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{stage === 'preview' ? 'Your camp plan' : 'Design this camp'}</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>
              {stage === 'preview' ? `${plan?.itinerary?.length || 0} days · nothing is saved until you accept` : `${days} days · answer six questions and Lumio Coach builds the rest`}
            </div>
          </div>
          <button onClick={onClose} style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, width: 30, height: 30, fontSize: 17, cursor: 'pointer' }}>×</button>
        </div>

        {/* ── FORM ── */}
        {stage !== 'preview' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13, opacity: stage === 'busy' ? 0.5 : 1, pointerEvents: stage === 'busy' ? 'none' : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Ages</label><input value={ages} onChange={e => setAges(e.target.value)} placeholder="e.g. 9–12" style={field} /></div>
              <div><label style={lbl}>Standard</label>
                <select value={level} onChange={e => setLevel(e.target.value)} style={{ ...field, cursor: 'pointer' }}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
              </div>
            </div>
            <div>
              <label style={lbl}>Day camp or residential</label>
              <select value={board} onChange={e => setBoard(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                <option value="Day camp">Day camp — players go home each afternoon</option>
                <option value="Residential — full board">Residential — full board</option>
                <option value="Residential — half board">Residential — half board</option>
              </select>
              {/* This single answer changes half the plan, which is why it is not
                  buried in an advanced section. */}
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 5 }}>A day camp gets no evening sessions — this is the one answer that changes the whole shape.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Players expected</label><input type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="e.g. 16" style={field} /></div>
              <div><label style={lbl}>Courts available</label><input type="number" value={courts} onChange={e => setCourts(e.target.value)} placeholder="e.g. 2" style={field} /></div>
            </div>
            <div>
              <label style={lbl}>What should they leave with?</label>
              <textarea value={intent} onChange={e => setIntent(e.target.value)} rows={3} placeholder="e.g. Confident serving underarm and overarm, and able to play a scored match without help" style={{ ...field, resize: 'vertical' }} />
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 5 }}>The more specific this is, the better the plan. One sentence is plenty.</div>
            </div>

            {err && <div style={{ fontSize: 12, color: T.bad }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={generate} disabled={stage === 'busy'} style={{ ...btn(accent.hex, T.btnText), flex: 1, opacity: stage === 'busy' ? 0.6 : 1 }}>
                {stage === 'busy' ? '✦ Lumio Coach is designing your camp…' : '✦ Design my camp'}
              </button>
            </div>
            {stage === 'busy' && <div style={{ fontSize: 11.5, color: T.text3, textAlign: 'center' }}>This takes 20–40 seconds — he is planning every day, not filling a template.</div>}
          </div>
        )}

        {/* ── PREVIEW ── */}
        {stage === 'preview' && plan && (
          <div style={{ padding: 20 }}>
            {plan.daily_rhythm && (
              <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: accent.hex, marginBottom: 4 }}>Daily rhythm</div>
                <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>{plan.daily_rhythm}</div>
              </div>
            )}

            {!!plan.objectives?.length && (
              <Block T={T} title="Camp objectives">
                <ul style={{ margin: 0, paddingLeft: 18 }}>{plan.objectives.map((o, i) => <li key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4, lineHeight: 1.5 }}>{o}</li>)}</ul>
              </Block>
            )}

            <Block T={T} title={`Itinerary · ${plan.itinerary?.length || 0} days`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(plan.itinerary || []).map(d => (
                  <div key={d.day} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: accent.hex }}>D{d.day}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{d.theme}</span>
                      {d.rest && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: '#5bc0be' }}>Lighter day</span>}
                    </div>
                    {d.coachFocus && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4, lineHeight: 1.5 }}>{d.coachFocus}</div>}
                    <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(d.sessions || []).map((ss, si) => {
                        const c = SESSION_COLOUR[ss.type || ''] || T.text3
                        return (
                          <div key={si} style={{ display: 'flex', gap: 9, fontSize: 11.5, alignItems: 'baseline' }}>
                            <span style={{ width: 62, flexShrink: 0, color: T.text3, fontFamily: FONT_MONO, fontSize: 10.5 }}>{ss.slot} {ss.time}</span>
                            <span style={{ flex: 1, color: T.text2 }}><span style={{ color: T.text, fontWeight: 600 }}>{ss.title}</span>{ss.where ? ` · ${ss.where}` : ''}</span>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: c, flexShrink: 0 }}>{ss.type}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            {!!plan.equipment?.length && (
              <Block T={T} title="Kit needed">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plan.equipment.map((e, i) => <span key={i} style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 10px' }}>{e}</span>)}
                </div>
              </Block>
            )}

            {plan.parent_brief?.intro && (
              <Block T={T} title="Parent brief">
                <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>{plan.parent_brief.intro}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>Full brief — including what to bring and what they leave with — is printable from the Player Packs tab once you accept.</div>
              </Block>
            )}

            {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.border}`, position: 'sticky', bottom: 0, background: T.panel, paddingBottom: 4 }}>
              <button onClick={accept} disabled={saving} style={{ ...btn(accent.hex, T.btnText), opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Accept this plan'}</button>
              <button onClick={() => { setPlan(null); setStage('form') }} disabled={saving} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}` }}>Change answers</button>
              <button onClick={generate} disabled={saving} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}`, marginLeft: 'auto' }}>✦ Regenerate</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Block({ T, title, children }: { T: ThemeTokens; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.text3, marginBottom: 7, paddingBottom: 5, borderBottom: `1px solid ${T.border}` }}>{title}</div>
      {children}
    </div>
  )
}
