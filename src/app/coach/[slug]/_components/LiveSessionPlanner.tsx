'use client'

// Live Session Planner — mirrors the demo's New Session creator (player from
// roster, type/court/time/duration, racket + standard, session focus, AI assist
// to draft focus points & drills) and the auto-generated timed run-sheet, wired
// to coach_session_plans.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbRemove, RACKET_STAGES } from '../_lib/coach-db'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const TYPES = ['Private', 'Group', 'Cardio', 'Match play', 'Mini / red ball'] as const
type SType = typeof TYPES[number]

// ── Run-sheet generator (ported from the demo) ──────────────────────────────
const TEMPLATES: Record<SType, { phase: string; pct: number; d: (f: string) => string }[]> = {
  'Private': [
    { phase: 'Warm-up & movement', pct: 0.15, d: () => 'Dynamic prep, split-step reactions, mini-tennis to find the timing.' },
    { phase: 'Technical block', pct: 0.30, d: f => `Re-groove ${f} with controlled feeds and one clear cue.` },
    { phase: 'Constraint drill', pct: 0.25, d: () => 'Targeted drill with a success target before progressing.' },
    { phase: 'Live points', pct: 0.20, d: f => `Carry ${f} into live points and patterns.` },
    { phase: 'Review & homework', pct: 0.10, d: () => 'Score-based game, quick video review, set the homework.' },
  ],
  'Group': [
    { phase: 'Warm-up & dynamic games', pct: 0.15, d: () => 'Movement games to raise the pulse and get them sharp.' },
    { phase: 'Skill stations', pct: 0.35, d: f => `Rotate stations on ${f} — short reps, lots of balls.` },
    { phase: 'Match games', pct: 0.30, d: () => 'Cooperative-to-competitive games applying the skill.' },
    { phase: 'Mini-tournament', pct: 0.15, d: () => 'Round-robin points — keep it fun and competitive.' },
    { phase: 'Cool-down & feedback', pct: 0.05, d: () => 'Stretch, one win each, quick group feedback.' },
  ],
  'Cardio': [
    { phase: 'Warm-up & pulse-raiser', pct: 0.15, d: () => 'Footwork ladder, dynamic stretch, easy rally.' },
    { phase: 'High-tempo feeds', pct: 0.40, d: () => 'Continuous feeding circuits — heart rate up, technique honest.' },
    { phase: 'Live rally games', pct: 0.35, d: f => `Fast live games built around ${f}.` },
    { phase: 'Cool-down & stretch', pct: 0.10, d: () => 'Bring the heart rate down, mobility work.' },
  ],
  'Match play': [
    { phase: 'Warm-up & serve routine', pct: 0.15, d: () => 'Full warm-up incl. serves; settle the routine.' },
    { phase: 'Pattern rehearsal', pct: 0.20, d: f => `Rehearse ${f} before competing.` },
    { phase: 'Competitive sets', pct: 0.55, d: () => 'Play out sets; coach observes, minimal interruption.' },
    { phase: 'Debrief & notes', pct: 0.10, d: () => 'What worked, what to adjust, log for the report.' },
  ],
  'Mini / red ball': [
    { phase: 'Warm-up games', pct: 0.20, d: () => 'Fun coordination and ball-skill games.' },
    { phase: 'Skill of the day', pct: 0.30, d: f => `Introduce / build ${f} through play.` },
    { phase: 'Challenge games', pct: 0.35, d: () => 'Target and team games applying the skill.' },
    { phase: 'Rewards & racket check', pct: 0.15, d: () => 'Stickers, racket-skill check, celebrate the wins.' },
  ],
}
const KIT_BY_TYPE: Record<SType, string[]> = {
  'Private': ['Ball basket', 'Target cones', 'Video tripod'],
  'Group': ['2 ball baskets', 'Cones ×12', 'Throwdown lines', 'Bibs'],
  'Cardio': ['Ball machine', 'Heart-rate band', 'Cones'],
  'Match play': ['Match balls', 'Scorecards', 'Net gauge'],
  'Mini / red ball': ['Red balls', 'Mini nets', 'Stickers', 'Throwdowns'],
}
function runSheet(type: SType, focus: string, mins: number) {
  const tpl = TEMPLATES[type] || TEMPLATES.Private
  const f = (focus || 'the focus').toLowerCase()
  let used = 0
  return tpl.map((p, i) => { const m = i === tpl.length - 1 ? mins - used : Math.round(mins * p.pct); used += m; return { phase: p.phase, mins: m, detail: p.d(f) } })
}

export function LiveSessionPlanner({ T, accent, density }: Common) {
  const plans = useCoachTable<any>('coach_session_plans')
  const players = useCoachTable<any>('coach_players')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<any | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Session Planner</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Plan a session and get a timed run-sheet and kit list automatically.</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Icon name="plus" size={14} /> New session
        </button>
      </div>

      {plans.loading ? <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      : plans.rows.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No sessions planned yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Create a session and we&apos;ll build the run-sheet for you.</p>
          <button onClick={() => setOpen(true)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Plan your first session</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: density.gap }}>
          {plans.rows.map(p => (
            <button key={p.id} onClick={() => setSel(p)} style={{ textAlign: 'left', appearance: 'none', cursor: 'pointer', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                {p.session_type && <span style={{ fontSize: 9.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 5 }}>{p.session_type}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: T.text3, marginTop: 4 }}>{[p.session_date && new Date(p.session_date).toLocaleDateString('en-GB'), p.start_time, p.court, p.group_name].filter(Boolean).join(' · ')}</div>
              {p.focus && <div style={{ fontSize: 12, color: T.text2, marginTop: 8 }}>🎯 {p.focus}</div>}
            </button>
          ))}
        </div>
      )}

      {open && <NewSession T={T} accent={accent} density={density} players={players.rows} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); plans.reload() }} />}
      {sel && <SessionRunSheet T={T} accent={accent} density={density} plan={sel} onClose={() => setSel(null)} onDelete={async () => { if (confirm('Delete this session?')) { await dbRemove('coach_session_plans', sel.id); setSel(null); plans.reload() } }} />}
    </div>
  )
}

// ── New Session modal ────────────────────────────────────────────────────────
function NewSession({ T, accent, density, players, onClose, onSaved }: Common & { players: any[]; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'roster' | 'new'>('roster')
  const [player, setPlayer] = useState('')
  const [type, setType] = useState<SType>('Private')
  const [court, setCourt] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [racket, setRacket] = useState('')
  const [standard, setStandard] = useState('')
  const [focus, setFocus] = useState('')
  const [note, setNote] = useState('')
  const [focusPoints, setFocusPoints] = useState('')
  const [drills, setDrills] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Prefill racket from the chosen roster player.
  const onPickPlayer = (name: string) => { setPlayer(name); const p = players.find(x => x.name === name); if (p?.racket_stage) setRacket(p.racket_stage) }

  const draft = async () => {
    if (!focus.trim()) { setErr('Add a session focus first'); return }
    setDrafting(true); setErr('')
    try {
      const res = await fetch('/api/coach/session-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, focus, racket: RACKET_STAGES.find(s => s.id === racket)?.name, standard, duration, note, player }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Draft failed')
      setFocusPoints((data.focus_points || []).join('\n'))
      setDrills((data.drills || []).join('\n'))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Draft failed') }
    setDrafting(false)
  }

  const save = async () => {
    if (!focus.trim()) { setErr('Session focus is required'); return }
    setSaving(true); setErr('')
    try {
      await dbInsert('coach_session_plans', {
        title: `${player || type}${focus ? ' — ' + focus : ''}`.slice(0, 120),
        session_date: date || null, start_time: time || null, session_type: type, court: court || null,
        group_name: player || null, focus, duration_min: duration || null, racket_stage: racket || null,
        standard: standard || null, focus_points: focusPoints || null, drills: drills || null, notes: note || null,
      })
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const sheet = runSheet(type, focus, duration || 60)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Icon name="flag" size={16} style={{ color: accent.hex }} />
          <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>New session</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17 }}>×</button>
        </div>

        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
          <div>
            {/* Player */}
            <label style={lbl}>Player</label>
            <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
              {(['roster', 'new'] as const).map(m => <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${mode === m ? accent.hex : T.border}`, background: mode === m ? accent.dim : 'transparent', color: mode === m ? accent.hex : T.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m === 'roster' ? 'From roster' : 'New player'}</button>)}
            </div>
            {mode === 'roster' ? (
              <select value={player} onChange={e => onPickPlayer(e.target.value)} style={{ ...input, marginTop: 0 }}>
                <option value="">Select a player…</option>
                {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            ) : (
              <input value={player} onChange={e => setPlayer(e.target.value)} placeholder="Player or group name" style={{ ...input, marginTop: 0 }} />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div><label style={lbl}>Type</label><select value={type} onChange={e => setType(e.target.value as SType)} style={input}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Court</label><input value={court} onChange={e => setCourt(e.target.value)} placeholder="e.g. Court 1" style={input} /></div>
              <div><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} /></div>
              <div><label style={lbl}>Start time</label><input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 16:00" style={input} /></div>
              <div><label style={lbl}>Duration (mins)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} style={input} /></div>
              <div><label style={lbl}>Racket</label><select value={racket} onChange={e => setRacket(e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Standard</label><input value={standard} onChange={e => setStandard(e.target.value)} placeholder="e.g. LTA Youth · Orange" style={input} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Session focus *</label><input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Forehand volley — punch & firm wrist" style={input} /></div>

            {/* AI assist */}
            <div style={{ marginTop: 14, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: accent.hex, marginBottom: 6 }}>✨ AI assist — draft the focus points &amp; drills</div>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note — what do you want from this session?" style={{ ...input, marginTop: 0 }} />
              <button onClick={draft} disabled={drafting} style={{ marginTop: 8, padding: '8px 14px', borderRadius: 9, border: 'none', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: drafting ? 0.6 : 1 }}>{drafting ? 'Drafting…' : 'Draft with AI'}</button>
            </div>

            <div style={{ marginTop: 12 }}><label style={lbl}>Focus points (one per line)</label><textarea value={focusPoints} onChange={e => setFocusPoints(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Drills (one per line)</label><textarea value={drills} onChange={e => setDrills(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
          </div>

          {/* Run-sheet preview */}
          <div>
            <label style={lbl}>Run-sheet ({duration || 60} mins)</label>
            <div style={{ marginTop: 6, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
              {sheet.map((ph, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < sheet.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 11, color: accent.hex, fontWeight: 700, width: 34, flexShrink: 0 }}>{ph.mins}m</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{ph.phase}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, lineHeight: 1.4 }}>{ph.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <label style={{ ...lbl, marginTop: 14, display: 'block' }}>Kit list</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {KIT_BY_TYPE[type].map(k => <span key={k} style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 10px' }}>{k}</span>)}
            </div>
            <p style={{ fontSize: 10.5, color: T.text3, marginTop: 10 }}>The run-sheet and kit list are generated automatically for the session type.</p>
          </div>
        </div>

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : '✓ Add session'}</button>
          <button onClick={onClose} style={{ padding: '12px 18px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Saved session run-sheet ──────────────────────────────────────────────────
function SessionRunSheet({ T, accent, density, plan, onClose, onDelete }: Common & { plan: any; onClose: () => void; onDelete: () => void }) {
  const sheet = runSheet((plan.session_type as SType) || 'Private', plan.focus || '', plan.duration_min || 60)
  const fp = (plan.focus_points || '').split('\n').filter(Boolean)
  const dr = (plan.drills || '').split('\n').filter(Boolean)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{plan.title}</h3>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{[plan.session_type, plan.session_date && new Date(plan.session_date).toLocaleDateString('en-GB'), plan.start_time, plan.court, `${plan.duration_min || 60} mins`].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17 }}>×</button>
        </div>
        {plan.focus && <div style={{ background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 8, padding: '8px 12px', marginTop: 14, fontSize: 12.5, color: T.text }}>🎯 {plan.focus}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: fp.length || dr.length ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Run-sheet</div>
            {sheet.map((ph, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < sheet.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ fontSize: 11, color: accent.hex, fontWeight: 700, width: 34, flexShrink: 0 }}>{ph.mins}m</span>
                <div><div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{ph.phase}</div><div style={{ fontSize: 10.5, color: T.text3 }}>{ph.detail}</div></div>
              </div>
            ))}
          </div>
          {(fp.length > 0 || dr.length > 0) && (
            <div>
              {fp.length > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Focus points</div><ul style={{ margin: '0 0 14px', paddingLeft: 16 }}>{fp.map((x: string, i: number) => <li key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{x}</li>)}</ul></>}
              {dr.length > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Drills</div><ul style={{ margin: 0, paddingLeft: 16 }}>{dr.map((x: string, i: number) => <li key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{x}</li>)}</ul></>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {KIT_BY_TYPE[(plan.session_type as SType) || 'Private'].map(k => <span key={k} style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 10px' }}>{k}</span>)}
        </div>
        <div style={{ marginTop: 18 }}>
          <button onClick={onDelete} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete session</button>
        </div>
      </div>
    </div>
  )
}
