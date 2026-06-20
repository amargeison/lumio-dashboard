'use client'

// Live Player Roster — mirrors the demo roster (cards, filters, Welcome pack)
// and the player detail modal (stat tiles, goal, Development / Contact / Lessons
// tabs, racket journey) but wired to the coach's own data. Fields not yet
// captured show a clear placeholder.

import { useState, useEffect, useCallback } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, dbList, RACKET_STAGES } from '../_lib/coach-db'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const CATEGORIES = ['Junior', 'Performance', 'Adult'] as const

const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
function stageOf(id?: string | null) {
  const idx = RACKET_STAGES.findIndex(s => s.id === id)
  return { idx, stage: idx >= 0 ? RACKET_STAGES[idx] : null, pct: idx >= 0 ? Math.round(((idx + 1) / RACKET_STAGES.length) * 100) : 0 }
}

function Avatar({ accent, name, size = 40 }: { accent: AccentTokens; name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700 }}>
      {initials(name)}
    </div>
  )
}
function RacketChip({ stage, T }: { stage: { name: string; colour: string } | null; T: ThemeTokens }) {
  if (!stage) return <span style={{ fontSize: 11, color: T.text3 }}>No stage</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text }}>
      <span style={{ width: 18, height: 11, borderRadius: 3, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
      {stage.name}
    </span>
  )
}

export function LiveRoster({ T, accent, density }: Common) {
  const players = useCoachTable<any>('coach_players')
  const [group, setGroup] = useState<'All' | typeof CATEGORIES[number]>('All')
  const [sel, setSel] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null | undefined>(undefined) // undefined = closed

  const list = group === 'All' ? players.rows : players.rows.filter(p => p.category === group)
  const tabs = ['All', ...CATEGORIES] as const

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Player Roster</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Everyone you coach, at a glance.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', padding: 2, background: T.hover, borderRadius: 8 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setGroup(t)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: group === t ? T.panel : 'transparent', color: group === t ? T.text : T.text2, fontWeight: group === t ? 600 : 400 }}>{t}</button>
            ))}
          </div>
          <button onClick={() => setEditing(null)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <Icon name="plus" size={14} stroke={2} /> Add player
          </button>
        </div>
      </div>

      {players.loading ? (
        <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : list.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Add the players you coach and they appear here as cards.</p>
          <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add your first player</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: density.gap }}>
          {list.map(p => {
            const s = stageOf(p.racket_stage)
            return (
              <div key={p.id} onClick={() => setSel(p)} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar accent={accent} name={p.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.text3 }}>{p.category || p.level || 'Player'}{p.age ? ` · Age ${p.age}` : ''}</div>
                  </div>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <RacketChip stage={s.stage} T={T} />
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{s.idx >= 0 ? `Stage ${s.idx + 1}/${RACKET_STAGES.length}` : '—'}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: T.hover, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: T.text2 }}>
                  <span><span style={{ color: T.text3 }}>Email</span> {p.email ? '✓' : '—'}</span>
                  <span><span style={{ color: T.text3 }}>Phone</span> {p.phone ? '✓' : '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.text3, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal || 'No goal set'}</span>
                  <span style={{ color: accent.hex, fontWeight: 600, whiteSpace: 'nowrap' }}>View →</span>
                </div>
                <button onClick={e => { e.stopPropagation(); printWelcomePack(p) }} style={{ width: '100%', marginTop: 8, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="note" size={13} stroke={1.8} style={{ color: accent.hex }} /> Welcome pack
                </button>
              </div>
            )
          })}
        </div>
      )}

      {sel && (
        <PlayerDetail T={T} accent={accent} density={density} player={sel}
          onClose={() => setSel(null)}
          onEdit={() => { setEditing(sel); setSel(null) }}
          onDelete={async () => { if (confirm(`Delete ${sel.name}?`)) { await dbRemove('coach_players', sel.id); setSel(null); players.reload() } }} />
      )}
      {editing !== undefined && (
        <PlayerForm T={T} accent={accent} initial={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); players.reload() }} />
      )}
    </div>
  )
}

// ── Add / edit form ─────────────────────────────────────────────────────────
function PlayerForm({ T, accent, initial, onClose, onSaved }: { T: ThemeTokens; accent: AccentTokens; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Record<string, any>>(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!String(d.name ?? '').trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const row = { name: d.name, category: d.category || null, age: d.age || null, parent_name: d.parent_name || null, racket_stage: d.racket_stage || null, goal: d.goal || null, level: d.level || null, email: d.email || null, phone: d.phone || null, notes: d.notes || null }
      if (initial?.id) await dbUpdate('coach_players', initial.id, row); else await dbInsert('coach_players', row)
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const field = (k: string, label: string, type = 'text', ph?: string) => (
    <div><label style={lbl}>{label}</label><input type={type} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={input} /></div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>{initial?.id ? 'Edit player' : 'Add player'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('name', 'Name', 'text', 'Player name')}
          <div><label style={lbl}>Category</label><select value={d.category ?? ''} onChange={e => set('category', e.target.value)} style={input}><option value="">—</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          {field('age', 'Age', 'number')}
          {field('parent_name', 'Parent / guardian')}
          <div><label style={lbl}>Racket stage</label><select value={d.racket_stage ?? ''} onChange={e => set('racket_stage', e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          {field('level', 'Level', 'text', 'e.g. Red ball')}
          {field('email', 'Email')}
          {field('phone', 'Phone')}
        </div>
        <div style={{ marginTop: 12 }}>{field('goal', 'Goal', 'text', 'e.g. First serve over the net consistently')}</div>
        <div style={{ marginTop: 12 }}><label style={lbl}>Notes</label><textarea value={d.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Player detail modal ──────────────────────────────────────────────────────
function PlayerDetail({ T, accent, density, player, onClose, onEdit, onDelete }: Common & { player: any; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const [tab, setTab] = useState<'dev' | 'contact' | 'lessons'>('dev')
  const [lessons, setLessons] = useState<any[]>([])
  const [development, setDevelopment] = useState<any[]>([])
  const [nextSession, setNextSession] = useState<string>('—')
  const s = stageOf(player.racket_stage)

  const load = useCallback(async () => {
    const [sess, dev, books] = await Promise.all([dbList('coach_sessions'), dbList('coach_development'), dbList('coach_bookings')])
    const mine = (rows: any[]) => rows.filter(r => (r.player_name || '').trim().toLowerCase() === (player.name || '').trim().toLowerCase())
    const ls = mine(sess).sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? '')))
    setLessons(ls)
    setDevelopment(mine(dev))
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = mine(books).filter(b => (b.booking_date ?? '') >= today).sort((a, b) => String(a.booking_date).localeCompare(String(b.booking_date)))[0]
    setNextSession(upcoming ? `${new Date(upcoming.booking_date).toLocaleDateString('en-GB')}${upcoming.start_time ? ' ' + upcoming.start_time : ''}` : '—')
  }, [player.name])
  useEffect(() => { load() }, [load])

  const tile = (label: string, value: React.ReactNode, color?: string, small?: boolean) => (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
      <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: small ? 12.5 : 15, fontWeight: 600, color: color ?? T.text, marginTop: 3 }}>{value}</div>
    </div>
  )

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 780, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `${density.pad + 2}px ${density.pad + 4}px`, borderBottom: `1px solid ${T.border}` }}>
          <Avatar accent={accent} name={player.name} size={50} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{player.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{player.category || player.level || 'Player'}{player.age ? ` · Age ${player.age}` : ''}{player.parent_name ? ` · Parent: ${player.parent_name}` : ''}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>Edit</button>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 32, height: 32, fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: `${density.pad}px ${density.pad + 4}px ${density.pad + 4}px` }}>
          {/* stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
            {tile('Current racket', <RacketChip stage={s.stage} T={T} />)}
            {tile('Racket stage', s.idx >= 0 ? `${s.idx + 1} of ${RACKET_STAGES.length}` : '—', accent.hex)}
            {tile('Attendance', '—', T.text3, true)}
            {tile('Lessons', String(lessons.length))}
            {tile('Next session', nextSession, undefined, true)}
          </div>

          {/* goal */}
          <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="flag" size={13} stroke={1.8} style={{ color: accent.hex }} />
            <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Goal</span>
            <span style={{ fontSize: 12.5, color: T.text }}>{player.goal || 'No goal set yet — add one when you edit this player.'}</span>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 2, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
            {([['dev', 'Development'], ['contact', 'Contact'], ['lessons', `Lessons · ${lessons.length}`]] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? T.panel : 'transparent', color: tab === id ? T.text : T.text2, fontWeight: tab === id ? 600 : 400 }}>{l}</button>
            ))}
          </div>

          {tab === 'dev' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Development notes</div>
                {development.length === 0 ? (
                  <p style={{ fontSize: 12, color: T.text3 }}>No development notes yet. Add them in the Player Development module.</p>
                ) : development.map((dv, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.text, textTransform: 'capitalize' }}>{dv.area || 'Note'}</span>
                      {dv.target && <span style={{ fontSize: 10.5, color: T.text3 }}>· {dv.target}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(lv => <div key={lv} style={{ flex: 1, height: 5, borderRadius: 3, background: lv <= (dv.rating || 0) ? accent.hex : T.hover }} />)}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Racket journey</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {RACKET_STAGES.map((b, bi) => {
                    const state = s.idx < 0 ? 'locked' : bi < s.idx ? 'done' : bi === s.idx ? 'current' : 'locked'
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.4 : 1 }}>
                        <span style={{ width: 20, height: 12, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                        <span style={{ fontSize: 11.5, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{b.name}</span>
                        {state === 'done' && <Icon name="check" size={12} stroke={2.2} style={{ color: T.good }} />}
                        {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Email', player.email], ['Phone', player.phone], ['Parent / guardian', player.parent_name], ['Level', player.level]].map(([l, v]) => (
                <div key={l as string} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                  <div style={{ fontSize: 13, color: v ? T.text : T.text3, marginTop: 3 }}>{v || '—'}</div>
                </div>
              ))}
              {player.notes && <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{player.notes}</div>}
              <div style={{ gridColumn: '1 / -1' }}>
                <button onClick={onDelete} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.4)`, color: '#EF4444', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete player</button>
              </div>
            </div>
          )}

          {tab === 'lessons' && (
            <div>
              {lessons.length === 0 ? (
                <p style={{ fontSize: 12.5, color: T.text3 }}>No lessons logged for this player yet. Log them in the Lesson Summaries module.</p>
              ) : lessons.map((l, i) => (
                <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize: 10.5, color: T.text3, width: 86, flexShrink: 0, paddingTop: 2 }}>{l.session_date ? new Date(l.session_date).toLocaleDateString('en-GB') : '—'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus || 'Session'}{l.rating ? ` · ${l.rating}/5` : ''}</div>
                    {l.summary && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3 }}>{l.summary}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Welcome pack (printable) ─────────────────────────────────────────────────
function printWelcomePack(p: any) {
  const s = stageOf(p.racket_stage)
  const journey = RACKET_STAGES.map((b, bi) => `<li style="${s.idx >= 0 && bi <= s.idx ? '' : 'opacity:.4'}">${b.name}${s.idx === bi ? ' — current' : ''}</li>`).join('')
  const w = window.open('', '_blank', 'width=720,height=900')
  if (!w) return
  w.document.write(`<!doctype html><html><head><title>Welcome pack — ${p.name}</title>
    <style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#111;line-height:1.6;padding:0 20px}h1{margin-bottom:4px}.muted{color:#666;font-size:14px}ul{padding-left:18px}</style></head>
    <body><h1>Welcome, ${p.name}</h1><p class="muted">${[p.category, p.age ? 'Age ' + p.age : '', p.level].filter(Boolean).join(' · ')}</p>
    ${p.goal ? `<p><strong>Goal:</strong> ${p.goal}</p>` : ''}
    <p><strong>Current racket stage:</strong> ${s.stage ? s.stage.name : 'Not set'}</p>
    <h3>Your racket journey</h3><ul>${journey}</ul>
    ${p.parent_name ? `<p class="muted">Parent / guardian: ${p.parent_name}</p>` : ''}
    <p class="muted">Welcome to the academy — we're glad to have you on court.</p>
    </body></html>`)
  w.document.close(); w.focus(); w.print()
}
