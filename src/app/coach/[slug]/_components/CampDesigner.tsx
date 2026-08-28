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

import { useState, type CSSProperties, useRef } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { UPLOAD_ACCEPT } from '@/lib/coach/file-to-content'

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
  camp: { id: string; name: string; audience?: string | null; region?: string | null; surface?: string | null; courts?: number | null; board?: string | null; description?: string | null; start_date?: string | null; ages?: string | null; group_size?: number | null; intent?: string | null; capacity?: number | null }
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
  // Importing an existing document. Most coaches have already written this camp
  // down somewhere; retyping it into six questions so the AI can design what
  // they already designed is the product wasting their afternoon.
  const fileRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [imported, setImported] = useState('')
  const [saving, setSaving] = useState(false)
  const [prog, setProg] = useState({ day: 0, days: 0 })

  const onFile = async (f: File) => {
    setReading(true); setErr(''); setImported('')
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('campId', camp.id)
      const res = await fetch('/api/coach/camp-import', { method: 'POST', body: fd })
      // Read as text first: a 413 from nginx or a proxy error page is HTML, and
      // "Unexpected token <" helps nobody.
      const raw = await res.text()
      let d: any = {}
      try { d = raw ? JSON.parse(raw) : {} } catch { /* not JSON */ }
      if (!res.ok) {
        throw new Error(d.error || (res.status === 413
          ? 'That file is too large for the server to accept.'
          : `Could not read that file (HTTP ${res.status})`))
      }

      // Fill in the questions from whatever the document actually said. Only
      // overwrite a box the coach has not already filled in himself.
      const g = d.design || {}
      if (g.ages) setAges(String(g.ages))
      if (g.level && LEVELS.includes(String(g.level))) setLevel(String(g.level))
      if (g.groupSize) setGroupSize(String(g.groupSize))
      if (g.intent && !intent.trim()) setIntent(String(g.intent))
      if (d.camp?.board) setBoard(String(d.camp.board))
      if (d.camp?.courts) setCourts(String(d.camp.courts))

      if (d.found === 'plan' && Array.isArray(d.itinerary) && d.itinerary.length) {
        // Their plan, digitised. Straight to the preview — there is nothing for
        // Lumio Coach to design, and offering to redesign it would be insulting.
        setPlan({
          itinerary: d.itinerary,
          equipment: d.equipment || [],
          objectives: d.objectives || [],
          daily_rhythm: d.parent_brief?.dailyShape || '',
          parent_brief: d.parent_brief || undefined,
        } as CampPlan)
        setStage('preview')
        setImported(`Read ${d.itinerary.length} day${d.itinerary.length === 1 ? '' : 's'} straight out of your document. Check it over — nothing is saved until you accept.`)
      } else {
        setImported(d.notes
          ? `Filled in what the file told us. ${d.notes}`
          : 'Filled in what the file told us — check it, then let Lumio Coach plan the days.')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // The design arrives as a stream of newline-delimited JSON, so the coach sees
  // days appear rather than a spinner, and so the connection is never idle long
  // enough for nginx or Cloudflare to kill it. The abort is the backstop: this
  // used to hang with no error at all, which is the worst possible failure.
  const generate = async () => {
    setStage('busy'); setErr(''); setProg({ day: 0, days })
    const ctrl = new AbortController()
    const bail = setTimeout(() => ctrl.abort(), 4 * 60_000)
    try {
      const res = await fetch('/api/coach/camp-design', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          name: camp.name, days, startDate: camp.start_date, region: camp.region,
          surface: camp.surface, courts: Number(courts) || camp.courts,
          board, ages, level, groupSize: Number(groupSize) || null, intent,
          // Juniors or adults. Set on the camp itself so every AI call for this
          // camp agrees about who it is for.
          audience: camp.audience || 'junior',
        }),
      })
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Design failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let finished = false

      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        // The last piece may be half a line; keep it for the next chunk.
        buf = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          let m: { t?: string; day?: number; days?: number; plan?: CampPlan; error?: string }
          try { m = JSON.parse(line) } catch { continue }
          if (m.t === 'tick') setProg({ day: Math.min(m.day || 0, m.days || days), days: m.days || days })
          else if (m.t === 'error') throw new Error(m.error || 'Design failed')
          else if (m.t === 'done' && m.plan) { setPlan(m.plan); setStage('preview'); finished = true }
        }
      }
      if (!finished) throw new Error('The connection dropped before the plan finished. Try again.')
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError'
      setErr(aborted ? 'That took too long and was stopped. Try again, or design a shorter camp first.' : (e instanceof Error ? e.message : 'Design failed'))
      setStage('form')
    } finally {
      clearTimeout(bail)
    }
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
            {/* Already written down? Read it rather than ask for it again. */}
            <div
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1px dashed ${T.border}`, borderRadius: 10, padding: '13px 14px',
                cursor: reading ? 'wait' : 'pointer', background: T.panel2, textAlign: 'center',
              }}>
              <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f) }} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>
                {reading ? 'Reading your document…' : 'Already have this written down?'}
              </div>
              <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>
                Drop in a PDF, spreadsheet, Word doc or a photo of it. If it has a day-by-day plan we&rsquo;ll
                use yours; if not we&rsquo;ll fill in the questions below.
              </div>
            </div>

            {imported && (
              <div style={{ background: `${accent.hex}14`, border: `1px solid ${accent.border}`, borderRadius: 9, padding: '9px 12px', fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
                {imported}
              </div>
            )}

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
                {stage === 'busy'
                  ? (prog.day > 0 ? `✦ Designing day ${prog.day} of ${prog.days}…` : '✦ Lumio Coach is designing your camp…')
                  : '✦ Design my camp'}
              </button>
            </div>
            {stage === 'busy' && (
              <div style={{ fontSize: 11.5, color: T.text3, textAlign: 'center', lineHeight: 1.5 }}>
                Around ten seconds a day — he is planning every session, not filling a template.
                {prog.days > 0 && (
                  <div style={{ height: 4, borderRadius: 2, background: T.hover, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round(Math.min(1, prog.day / Math.max(1, prog.days)) * 100)}%`, height: '100%', background: accent.hex, transition: 'width .4s ease' }} />
                  </div>
                )}
              </div>
            )}
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
