'use client'

// Live Resource Centre — the demo over real data. Tabs by category, cards with
// format / level / racket / tags and a live action (Watch video / Open pdf…),
// plus Add resource. The Lumio starter library is loaded via onboarding or
// Settings; an empty library still shows the tabs.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, RACKET_STAGES } from '../_lib/coach-db'
import { DrillLibrary } from './DrillLibrary'

type Res = { id: string; title: string; category?: string | null; format?: string | null; level?: string | null; duration?: string | null; racket?: string | null; tags?: string | null; url?: string | null; notes?: string | null }
const TABS: [string, string][] = [['all', 'All'], ['Drill Library', 'Drill Library'], ['Drill', 'Drill'], ['Technique', 'Technique'], ['Training plan', 'Training plan'], ['Fitness', 'Fitness'], ['Mental', 'Mental'], ['Books', 'Books']]
const fmtIcon = (f?: string | null) => f === 'Video' ? '▶' : f === 'Plan' ? '📅' : f === 'Worksheet' ? '📝' : '📄'
const actionLabel = (f?: string | null) => f === 'Video' ? 'Watch video' : f === 'Plan' ? 'Open plan' : f === 'Worksheet' ? 'Open worksheet' : 'Open pdf'

export function LiveResources({ T, accent, density }: { T: ThemeTokens; accent: AccentTokens; density: Density }) {
  const resources = useCoachTable<Res>('coach_resources')
  const [tab, setTab] = useState('all')
  const [edit, setEdit] = useState<Res | 'new' | null>(null)
  const [q, setQ] = useState('')
  const [racket, setRacket] = useState('all')

  const levelColour = (l?: string | null) => l === 'Beginner' ? T.good : l === 'Intermediate' ? '#3A8EE0' : l === 'Advanced' ? T.bad : T.text3
  const needle = q.trim().toLowerCase()
  const filtered = resources.rows.filter(r => {
    if (!(tab === 'all' ? true : r.category === tab)) return false
    if (racket !== 'all' && r.racket !== racket) return false
    if (needle) {
      const hay = [r.title, r.category, r.format, r.level, r.tags, r.notes, RACKET_STAGES.find(s => s.id === r.racket)?.name].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  const input: CSSProperties = { appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 13, padding: '9px 12px 9px 34px', fontFamily: FONT, outline: 'none', width: '100%' }
  const Chip = ({ id, label, colour }: { id: string; label: string; colour?: string }) => {
    const on = racket === id
    return (
      <button onClick={() => setRacket(id)} style={{ appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: FONT }}>
        {colour && <span style={{ width: 11, height: 8, borderRadius: 2, background: colour, border: '1px solid rgba(128,128,128,0.4)' }} />}
        {label}
      </button>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Resource Centre</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Your drill library, technique videos, training plans, worksheets and reading — tagged to the racket system.</p>
        </div>
        <button onClick={() => setEdit('new')} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add resource</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: `1px solid ${tab === id ? accent.border : T.border}`, padding: '6px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: FONT, background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>{id === 'Drill Library' ? '🎾 ' : ''}{label}</button>)}
      </div>

      {tab === 'Drill Library' ? (
        // The flagship Lumio drill library — search, racket filter, grouped sections, printable drill sheets.
        <DrillLibrary T={T} accent={accent} density={density} />
      ) : (
      <>
      {/* Search + racket filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Icon name="search" size={15} stroke={1.7} style={{ position: 'absolute', left: 11, top: 10, color: T.text3 }} />
          <input style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search resources — title, tag or racket…" />
        </div>
        {filtered.length > 0 && <div style={{ fontSize: 11.5, color: T.text3 }}>{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Chip id="all" label="All rackets" />
        {RACKET_STAGES.map(s => <Chip key={s.id} id={s.id} label={s.name} colour={s.colour} />)}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{resources.rows.length === 0 ? 'No resources yet' : 'Nothing in this category yet'}</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>{resources.rows.length === 0 ? 'Add your own, or load the Lumio starter library in Settings → Resource Centre.' : 'Add a resource to this category.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const st = RACKET_STAGES.find(s => s.id === r.racket)
            const tags = (r.tags || '').split(',').map(s => s.trim()).filter(Boolean)
            return (
              <div key={r.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{fmtIcon(r.format)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, cursor: 'pointer' }} onClick={() => setEdit(r)}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{[r.category, r.format, r.duration].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
                {r.notes && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.45, flex: 1 }}>{r.notes}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {r.level && <span style={{ fontSize: 8.5, fontWeight: 700, color: levelColour(r.level), background: `${levelColour(r.level)}22`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{r.level}</span>}
                  {st && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: st.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{st.name}</span>}
                  {tags.map(t => <span key={t} style={{ fontSize: 10, color: T.text3 }}>#{t}</span>)}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: accent.hex, textDecoration: 'none' }}>▸ {actionLabel(r.format)} →</a>
                    : <span style={{ fontSize: 11.5, color: T.text3 }}>▸ {r.format || 'Resource'} · preview coming soon</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {edit && <ResourceForm T={T} accent={accent} res={edit === 'new' ? null : edit}
        onClose={() => setEdit(null)}
        onDelete={edit !== 'new' ? async () => { await resources.remove(edit.id); setEdit(null) } : undefined}
        onSave={async v => { if (edit === 'new') await resources.add(v); else await resources.edit(edit.id, v); setEdit(null) }} />}
    </div>
  )
}

function ResourceForm({ T, accent, res, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; res: Res | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ title: res?.title || '', category: res?.category || 'Drill', format: res?.format || 'Video', level: res?.level || 'All levels', racket: res?.racket || '', duration: res?.duration || '', tags: res?.tags || '', url: res?.url || '', notes: res?.notes || '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => { if (!String(d.title).trim() || saving) return; setSaving(true); try { await onSave({ title: d.title, category: d.category, format: d.format, level: d.level, racket: d.racket || null, duration: d.duration, tags: d.tags, url: d.url, notes: d.notes }) } finally { setSaving(false) } }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{res ? 'Edit resource' : 'Add resource'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Title *</label><input value={d.title} onChange={e => set('title', e.target.value)} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Category</label><select value={d.category} onChange={e => set('category', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Drill', 'Technique', 'Training plan', 'Fitness', 'Mental', 'Books'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={lab}>Format</label><select value={d.format} onChange={e => set('format', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Video', 'PDF', 'Plan', 'Worksheet'].map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Level</label><select value={d.level} onChange={e => set('level', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label style={lab}>Racket</label><select value={d.racket} onChange={e => set('racket', e.target.value)} style={{ ...field, cursor: 'pointer' }}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label style={lab}>Duration</label><input value={d.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 6 min" style={field} /></div>
          </div>
          <div><label style={lab}>Tags (comma separated)</label><input value={d.tags} onChange={e => set('tags', e.target.value)} placeholder="volley, net" style={field} /></div>
          <div><label style={lab}>Link / URL</label><input value={d.url} onChange={e => set('url', e.target.value)} placeholder="https://…" style={field} /></div>
          <div><label style={lab}>Description</label><textarea value={d.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...field, resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {onDelete && <button onClick={async () => { if (confirm('Delete this resource?')) await onDelete() }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!String(d.title).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.title).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
