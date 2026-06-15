'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

// Women's — Stadium & Facilities: live/editable Facility Status table and
// Upcoming Maintenance & Projects (mirrors the men's Pro Facilities page).
// Demo-safe — edits live in component state only.

const C = {
  panel:   '#0D1117',
  panel2:  '#0a0c14',
  border:  '#1F2937',
  borderHi:'#374151',
  text:    '#F9FAFB',
  text2:   '#D1D5DB',
  text3:   '#9CA3AF',
  text4:   '#6B7280',
  green:   '#22C55E',
  amber:   '#F59E0B',
  red:     '#EF4444',
}

type Facility = { id: string; facility: string; condition: string; inspected: string; next: string; notes: string }
type Project = { id: string; name: string; when: string; cost: string; priority: string }

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Operational']
const PRIORITIES = ['Urgent', 'Planned', 'Low']

const condColor = (c: string) => c === 'Excellent' || c === 'Good' || c === 'Operational' ? C.green : c === 'Fair' ? C.amber : C.red
const prioColor = (p: string) => p === 'Urgent' ? C.red : p === 'Planned' ? '#3B82F6' : C.text4

const SEED_FACILITIES: Facility[] = [
  { id: 'f1', facility: 'Main Stadium Pitch', condition: 'Excellent', inspected: '26 Mar', next: 'Thu 3 Apr', notes: 'Re-seeded Tuesday' },
  { id: 'f2', facility: 'Training Pitch 1', condition: 'Good', inspected: '25 Mar', next: 'Mon 31 Mar', notes: 'Normal use' },
  { id: 'f3', facility: 'Training Pitch 2 (3G)', condition: 'Excellent', inspected: '20 Mar', next: 'Apr', notes: 'All-weather — no issues' },
  { id: 'f4', facility: 'Gym & Strength Suite', condition: 'Good', inspected: '24 Mar', next: 'Weekly', notes: 'New equipment arriving Mon' },
  { id: 'f5', facility: 'Hydrotherapy / Recovery', condition: 'Good', inspected: '23 Mar', next: 'Bi-weekly', notes: 'Used for rehab daily' },
  { id: 'f6', facility: 'Floodlights (800 lux)', condition: 'Operational', inspected: '25 Mar', next: 'Monthly', notes: 'Broadcast standard — inspection passed' },
  { id: 'f7', facility: 'Medical / Treatment Room', condition: 'Excellent', inspected: '22 Mar', next: 'Quarterly', notes: 'Defib on site' },
  { id: 'f8', facility: 'Accessibility / Changing Places', condition: 'Good', inspected: '18 Mar', next: 'Apr', notes: '24 WAV spaces' },
]

const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Pitch drainage top-up', when: 'Immediate · Est £6,500', cost: '', priority: 'Urgent' },
  { id: 'p2', name: 'Hospitality boxes refurbishment', when: '28–30 Apr · Est £18,000', cost: '', priority: 'Planned' },
  { id: 'p3', name: 'Big screen upgrade (24m²)', when: 'May · Est £42,000', cost: '', priority: 'Planned' },
  { id: 'p4', name: 'East Terrace safe-standing rail', when: 'Jun · Est £24,000', cost: '', priority: 'Planned' },
  { id: 'p5', name: 'Family fan zone canopy', when: 'Apr · Est £3,800', cost: '', priority: 'Low' },
]

const inputCls = 'w-full rounded-md px-2 py-1 text-xs outline-none'
const inputSty = { backgroundColor: C.panel2, border: `1px solid ${C.borderHi}`, color: C.text }

export default function WomensFacilityStatus({ accent = '#EC4899', seedFacilities = SEED_FACILITIES, seedProjects = SEED_PROJECTS }: { accent?: string; seedFacilities?: Facility[]; seedProjects?: Project[] }) {
  const [facilities, setFacilities] = useState<Facility[]>(seedFacilities)
  const [projects, setProjects] = useState<Project[]>(seedProjects)
  const [editF, setEditF] = useState<string | null>(null)
  const [draftF, setDraftF] = useState<Facility | null>(null)
  const [editP, setEditP] = useState<string | null>(null)
  const [draftP, setDraftP] = useState<Project | null>(null)

  const startF = (f: Facility) => { setEditF(f.id); setDraftF({ ...f }) }
  const saveF = () => {
    if (!draftF) return
    setFacilities(prev => prev.some(x => x.id === draftF.id) ? prev.map(x => x.id === draftF.id ? draftF : x) : [...prev, draftF])
    setEditF(null); setDraftF(null)
  }
  const addF = () => { const id = `f-${Date.now()}`; const blank = { id, facility: '', condition: 'Good', inspected: '', next: '', notes: '' }; setFacilities(prev => [...prev, blank]); startF(blank) }
  const delF = (id: string) => { setFacilities(prev => prev.filter(x => x.id !== id)); if (editF === id) { setEditF(null); setDraftF(null) } }

  const startP = (p: Project) => { setEditP(p.id); setDraftP({ ...p }) }
  const saveP = () => {
    if (!draftP) return
    setProjects(prev => prev.some(x => x.id === draftP.id) ? prev.map(x => x.id === draftP.id ? draftP : x) : [...prev, draftP])
    setEditP(null); setDraftP(null)
  }
  const addP = () => { const id = `p-${Date.now()}`; const blank = { id, name: '', when: '', cost: '', priority: 'Planned' }; setProjects(prev => [...prev, blank]); startP(blank) }
  const delP = (id: string) => { setProjects(prev => prev.filter(x => x.id !== id)); if (editP === id) { setEditP(null); setDraftP(null) } }

  const IconBtn = ({ onClick, children, color }: { onClick: () => void; children: React.ReactNode; color?: string }) => (
    <button onClick={onClick} className="p-1 rounded transition-colors hover:bg-white/5" style={{ color: color ?? C.text4 }}>{children}</button>
  )

  return (
    <div className="space-y-6">
      {/* ── Facility Status ── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Facility Status</h3>
          <button onClick={addF} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}><Plus size={13} /> Add facility</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs" style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
            <th className="text-left p-3 font-semibold">Facility</th><th className="text-left p-3 font-semibold">Condition</th><th className="text-left p-3 font-semibold">Last Inspected</th><th className="text-left p-3 font-semibold">Next Maintenance</th><th className="text-left p-3 font-semibold">Notes</th><th className="p-3 w-16"></th>
          </tr></thead>
          <tbody>
            {facilities.map(r => {
              const editing = editF === r.id && draftF
              if (editing) return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: `${accent}0c` }}>
                  <td className="p-2"><input className={inputCls} style={inputSty} value={draftF!.facility} placeholder="Facility" onChange={e => setDraftF({ ...draftF!, facility: e.target.value })} /></td>
                  <td className="p-2"><select className={inputCls} style={inputSty} value={draftF!.condition} onChange={e => setDraftF({ ...draftF!, condition: e.target.value })}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></td>
                  <td className="p-2"><input className={inputCls} style={inputSty} value={draftF!.inspected} placeholder="26 Mar" onChange={e => setDraftF({ ...draftF!, inspected: e.target.value })} /></td>
                  <td className="p-2"><input className={inputCls} style={inputSty} value={draftF!.next} placeholder="Thu 3 Apr" onChange={e => setDraftF({ ...draftF!, next: e.target.value })} /></td>
                  <td className="p-2"><input className={inputCls} style={inputSty} value={draftF!.notes} placeholder="Notes" onChange={e => setDraftF({ ...draftF!, notes: e.target.value })} /></td>
                  <td className="p-2"><div className="flex items-center gap-0.5"><IconBtn onClick={saveF} color={C.green}><Check size={15} /></IconBtn><IconBtn onClick={() => { setEditF(null); setDraftF(null); if (!r.facility) delF(r.id) }}><X size={15} /></IconBtn></div></td>
                </tr>
              )
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="p-3 font-medium" style={{ color: C.text2 }}>{r.facility || <span style={{ color: C.text4 }}>—</span>}</td>
                  <td className="p-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${condColor(r.condition)}22`, color: condColor(r.condition) }}>{r.condition}</span></td>
                  <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.inspected}</td>
                  <td className="p-3 text-xs" style={{ color: r.next === 'Immediate' ? C.red : C.text3 }}>{r.next}</td>
                  <td className="p-3 text-xs" style={{ color: C.text4 }}>{r.notes}</td>
                  <td className="p-3"><div className="flex items-center gap-0.5"><IconBtn onClick={() => startF(r)}><Pencil size={13} /></IconBtn><IconBtn onClick={() => delF(r.id)}><Trash2 size={13} /></IconBtn></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Upcoming Maintenance & Projects ── */}
      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Upcoming Maintenance &amp; Projects</h3>
          <button onClick={addP} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}><Plus size={13} /> Add project</button>
        </div>
        <div className="space-y-1">
          {projects.map(p => {
            const editing = editP === p.id && draftP
            if (editing) return (
              <div key={p.id} className="rounded-lg p-3 flex flex-wrap items-center gap-2" style={{ background: `${accent}0c`, border: `1px solid ${C.border}` }}>
                <input className="rounded-md px-2 py-1 text-xs outline-none flex-1 min-w-[160px]" style={inputSty} value={draftP!.name} placeholder="Project name" onChange={e => setDraftP({ ...draftP!, name: e.target.value })} />
                <input className="rounded-md px-2 py-1 text-xs outline-none flex-1 min-w-[160px]" style={inputSty} value={draftP!.when} placeholder="Dates · Est £0,000" onChange={e => setDraftP({ ...draftP!, when: e.target.value })} />
                <select className="rounded-md px-2 py-1 text-xs outline-none" style={inputSty} value={draftP!.priority} onChange={e => setDraftP({ ...draftP!, priority: e.target.value })}>{PRIORITIES.map(c => <option key={c}>{c}</option>)}</select>
                <IconBtn onClick={saveP} color={C.green}><Check size={15} /></IconBtn>
                <IconBtn onClick={() => { setEditP(null); setDraftP(null); if (!p.name) delP(p.id) }}><X size={15} /></IconBtn>
              </div>
            )
            return (
              <div key={p.id} className="rounded-lg px-3 py-2.5 flex items-center gap-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: C.text }}>{p.name || <span style={{ color: C.text4 }}>—</span>}</div>
                  <div className="text-[11px]" style={{ color: C.text4 }}>{p.when}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${prioColor(p.priority)}22`, color: prioColor(p.priority) }}>{p.priority}</span>
                <IconBtn onClick={() => startP(p)}><Pencil size={13} /></IconBtn>
                <IconBtn onClick={() => delP(p.id)}><Trash2 size={13} /></IconBtn>
              </div>
            )
          })}
          {projects.length === 0 && <div className="text-xs text-center py-6" style={{ color: C.text4 }}>No projects yet — add one to get started.</div>}
        </div>
      </div>
    </div>
  )
}
