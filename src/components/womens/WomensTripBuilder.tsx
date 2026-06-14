'use client'

import React, { useState } from 'react'
import {
  X, Sparkles, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Info, Target, CalendarDays, Users, Plane, BedDouble, PoundSterling,
  Briefcase, HeartPulse, ClipboardCheck,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// Women's — full Camp / Tour builder. Mirrors the depth of the pre-season
// module: a sectioned, full-screen builder with an AI auto-draft, a live
// budget total and a review step. DEMO-SAFE (canned AI, no real calls).
// ─────────────────────────────────────────────────────────────────────────

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
}

export type BudgetLine = { line: string; amount: number }
export type ItineraryDay = { day: string; am: string; pm: string; eve: string }
export type Trip = {
  id: string
  kind: 'camp' | 'tour'
  name: string
  dates: string
  location: string
  status: 'Active' | 'Planned' | 'Negotiating' | 'Completed'
  squad: string
  focus: string
  summary: string
  objectives: string[]
  itinerary: ItineraryDay[]
  logistics: { travel: string; accommodation: string; transport: string; insurance: string }
  budget: BudgetLine[]
  commercial: string[]
  medical: string[]
  staff: string[]
  past?: boolean
  outcome?: string
}

export const fmtGBP = (n: number): string => '£' + Math.round(n).toLocaleString('en-GB')
export const tripCost = (t: Trip): number => t.budget.reduce((s, b) => s + (b.amount || 0), 0)

// ─── canned AI drafts ────────────────────────────────────────────────────
const draftFor = (kind: 'camp' | 'tour'): Partial<Trip> => kind === 'camp' ? {
  name: 'October international break camp',
  dates: '12–24 Oct 2026',
  location: 'Hartfield (training base)',
  status: 'Planned',
  squad: '20 (4 with Lionesses)',
  focus: 'Maintenance load · cycle-aware training · academy minutes',
  summary: 'A maintenance and development block during the international window. Non-internationals hold fitness and sharpen patterns while four players are released to the Lionesses; selected academy players integrate for first-team minutes.',
  objectives: [
    'Maintain match fitness for non-internationals (avoid de-training)',
    'Cycle-aware load management — individualised plans for phase 3/4 players',
    'Integrate 4 academy players into first-team sessions',
    'ACL screening + return-to-play progressions for rehab group',
    'Set-piece and pressing pattern refinement',
  ],
  itinerary: [
    { day: 'Day 1 · Mon', am: 'Arrival, testing & screening', pm: 'Light activation + team meeting', eve: 'Welcome dinner' },
    { day: 'Day 2 · Tue', am: 'Strength & conditioning', pm: 'Possession + pressing units', eve: 'Recovery / pool' },
    { day: 'Day 3 · Wed', am: 'Set-piece block', pm: 'Small-sided games', eve: 'Analysis review' },
    { day: 'Day 4 · Thu', am: 'Recovery + individual rehab', pm: 'Tactical shape (academy integrated)', eve: 'Welfare check-ins' },
    { day: 'Day 5 · Fri', am: 'High-intensity day', pm: 'In-house friendly', eve: 'Team social' },
  ],
  logistics: { travel: 'No travel — home base', accommodation: 'Players resident · staff on site', transport: 'Club minibus for off-site recovery', insurance: 'Standard squad cover' },
  budget: [
    { line: 'Pitch & facility hire', amount: 6800 },
    { line: 'Catering & nutrition', amount: 5200 },
    { line: 'Sports science / screening', amount: 4800 },
    { line: 'Recovery (pool / physio)', amount: 3600 },
    { line: 'Academy integration costs', amount: 2400 },
    { line: 'Contingency', amount: 2000 },
  ],
  commercial: ['Sponsor content day (Apex Performance) — recovery science feature', 'Academy “pathway” social series'],
  medical: ['Cycle phase mapped for full squad — loads individualised', '2 maternity-return players on Phase 2 RTP', '1 dual-reg player — loan-club fixture liaison required', 'ACL screening for previous-injury group'],
  staff: ['Head Coach', 'Head of Performance', 'Club Doctor', 'Physio ×2', 'Analyst', 'Welfare Lead'],
} : {
  name: 'Portugal pre-season tour + friendly',
  dates: '20–31 Jul 2026',
  location: 'Faro, Portugal',
  status: 'Planned',
  squad: '24 (incl. 4 academy + maternity-return planning)',
  focus: 'Pre-season base · heat adaptation · 2 friendlies · sponsor activation',
  summary: 'A 10-day pre-season tour combining a warm-weather training base with two friendlies against continental opposition. Doubles as a commercial activation window with the principal sponsor and a content-rich week for fan engagement.',
  objectives: [
    'Build the aerobic base in warm-weather conditions',
    'Two friendlies vs continental opposition — minutes for the full squad',
    'Integrate new signings into patterns of play',
    'Heat & hydration protocols; sleep / travel-recovery routines',
    'Sponsor activation + content capture for the season launch',
  ],
  itinerary: [
    { day: 'Day 1', am: 'Travel — coach + flight to Faro', pm: 'Arrival, settle, light walk', eve: 'Team dinner' },
    { day: 'Day 2', am: 'AM session — aerobic base', pm: 'Recovery + pool', eve: 'Sponsor welcome event' },
    { day: 'Day 3', am: 'Double session', pm: 'Tactical units', eve: 'Analysis' },
    { day: 'Day 5', am: 'Friendly #1 — prep', pm: 'Friendly #1 vs SC Faro Women', eve: 'Recovery' },
    { day: 'Day 8', am: 'Content day (sponsor)', pm: 'Set-piece block', eve: 'Family / downtime' },
    { day: 'Day 10', am: 'Friendly #2', pm: 'Travel home', eve: '—' },
  ],
  logistics: { travel: 'Charter coach + scheduled flights (Westmoor Sports Travel)', accommodation: 'Faro Beach Resort — 26 rooms, 11 nights', transport: 'Local coach contracted on arrival', insurance: 'Tour insurance + repatriation cover' },
  budget: [
    { line: 'Flights', amount: 38400 },
    { line: 'Hotels', amount: 41200 },
    { line: 'Ground transport', amount: 9800 },
    { line: 'Kit & equipment freight', amount: 7400 },
    { line: 'Catering / per diem', amount: 14600 },
    { line: 'Insurance + repatriation', amount: 8200 },
    { line: 'Friendlies / facility hire', amount: 6400 },
    { line: 'Family travel / childcare', amount: 3200 },
  ],
  commercial: ['Vanta Sports — kit launch tied to friendly #1', 'Crown Broadcasting — 2 content days', 'Meridian Watches — hospitality activation'],
  medical: ['Heat-adaptation & hydration plan', 'Maternity-return player — modified travel + load', 'Cycle-aware load across the tour', 'Travel-recovery / sleep protocols (jet-lag minimal, time-zone +0)'],
  staff: ['Head Coach', 'Assistant Coach', 'Head of Performance', 'Club Doctor', 'Physio ×2', 'Analyst', 'Kit Manager', 'Media Officer', 'Welfare Lead'],
}

const blankTrip = (kind: 'camp' | 'tour'): Trip => ({
  id: 'new', kind, name: '', dates: '', location: kind === 'camp' ? 'Hartfield (training base)' : '',
  status: 'Planned', squad: 'Full squad', focus: '', summary: '',
  objectives: [], itinerary: [], logistics: { travel: '', accommodation: '', transport: '', insurance: '' },
  budget: [], commercial: [], medical: [], staff: [],
})

const SECTIONS = [
  { id: 'basics',     label: 'Basics',            icon: Info },
  { id: 'objectives', label: 'Objectives',        icon: Target },
  { id: 'itinerary',  label: 'Itinerary',         icon: CalendarDays },
  { id: 'squad',      label: 'Squad',             icon: Users },
  { id: 'logistics',  label: 'Travel & stay',     icon: Plane },
  { id: 'budget',     label: 'Budget',            icon: PoundSterling },
  { id: 'commercial', label: 'Commercial',        icon: Briefcase },
  { id: 'medical',    label: 'Medical & welfare', icon: HeartPulse },
  { id: 'review',     label: 'Review & create',   icon: ClipboardCheck },
]

function Input({ label, value, onChange, placeholder, area }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] mb-1" style={{ color: C.text4 }}>{label}</label>
      {area
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full rounded-md px-2.5 py-2 text-sm outline-none resize-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md px-2.5 py-2 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} />}
    </div>
  )
}

// editable string list
function EditList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <span className="flex-1 text-[12.5px]" style={{ color: C.text2 }}>{it}</span>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ color: C.text4 }}><Trash2 size={13} /></button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { onChange([...items, draft.trim()]); setDraft('') } }}
          className="flex-1 rounded-md px-2.5 py-2 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} />
        <button onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft('') } }}
          className="rounded-md px-2.5 py-2 text-xs font-semibold text-white" style={{ background: C.accent }}><Plus size={14} /></button>
      </div>
    </div>
  )
}

export default function WomensTripBuilder({ kind, accent = '#BE185D', onClose, onCreate }: { kind: 'camp' | 'tour'; accent?: string; onClose: () => void; onCreate: (t: Trip) => void }) {
  const [sec, setSec] = useState(0)
  const [t, setT] = useState<Trip>(() => blankTrip(kind))
  const set = (patch: Partial<Trip>) => setT(prev => ({ ...prev, ...patch }))
  const total = tripCost(t)
  const valid = t.name.trim().length > 0

  const aiDraft = () => setT(prev => ({ ...prev, ...draftFor(kind), id: 'new', kind } as Trip))

  const activeId = SECTIONS[sec].id
  const go = (d: number) => setSec(s => Math.max(0, Math.min(SECTIONS.length - 1, s + d)))

  return (
    <div className="fixed inset-0 z-[120] flex flex-col" style={{ background: C.bg }}>
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          {kind === 'camp' ? <CalendarDays size={17} style={{ color: accent }} /> : <Plane size={17} style={{ color: accent }} />}
          <span className="text-sm font-bold" style={{ color: C.text }}>{kind === 'camp' ? 'Build a camp' : 'Build a tour'}</span>
          {t.name && <span className="text-[12px]" style={{ color: C.text4 }}>· {t.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={aiDraft} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}55` }}>
            <Sparkles size={13} /> AI draft
          </button>
          <button onClick={() => valid && onCreate({ ...t, id: `t-${Date.now()}` })} disabled={!valid}
            className="text-[12px] font-bold px-4 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: accent }}>
            Create {kind}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: C.text3, border: `1px solid ${C.border}` }}><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* section rail */}
        <div className="w-56 flex-shrink-0 overflow-y-auto py-3" style={{ borderRight: `1px solid ${C.border}` }}>
          {SECTIONS.map((s, i) => {
            const Icon = s.icon
            const active = i === sec
            const filled = sectionFilled(s.id, t)
            return (
              <button key={s.id} onClick={() => setSec(i)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-left"
                style={{ color: active ? C.text : C.text3, background: active ? `${accent}14` : 'transparent', borderLeft: `2px solid ${active ? accent : 'transparent'}` }}>
                <Icon size={14} />
                <span className="flex-1">{s.label}</span>
                {filled && <Check size={13} style={{ color: C.good }} />}
              </button>
            )
          })}
        </div>

        {/* section body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {activeId === 'basics' && (
              <Section title="Basics" accent={accent}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Input label={kind === 'camp' ? 'Camp window / name *' : 'Tour name *'} value={t.name} onChange={v => set({ name: v })} placeholder={kind === 'camp' ? 'October international break camp' : 'Portugal pre-season tour'} /></div>
                  <Input label="Dates" value={t.dates} onChange={v => set({ dates: v })} placeholder="12–24 Oct 2026" />
                  <Input label="Location" value={t.location} onChange={v => set({ location: v })} />
                  <div>
                    <label className="block text-[11px] mb-1" style={{ color: C.text4 }}>Status</label>
                    <select value={t.status} onChange={e => set({ status: e.target.value as Trip['status'] })} className="w-full rounded-md px-2.5 py-2 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }}>
                      <option>Active</option><option>Planned</option><option>Negotiating</option>
                    </select>
                  </div>
                  <Input label="Squad" value={t.squad} onChange={v => set({ squad: v })} placeholder="24 + 2 dual-reg" />
                  <div className="col-span-2"><Input label="Focus (one line)" value={t.focus} onChange={v => set({ focus: v })} placeholder="Pre-season base · heat adaptation · 2 friendlies" /></div>
                  <div className="col-span-2"><Input label="Summary" value={t.summary} onChange={v => set({ summary: v })} area placeholder="A short description of the trip, its purpose and shape." /></div>
                </div>
              </Section>
            )}
            {activeId === 'objectives' && (
              <Section title="Objectives" accent={accent} hint="What does this trip need to achieve?">
                <EditList items={t.objectives} onChange={v => set({ objectives: v })} placeholder="Add an objective and press Enter…" />
              </Section>
            )}
            {activeId === 'itinerary' && (
              <Section title="Itinerary" accent={accent} hint="Day-by-day plan">
                <ItineraryEditor days={t.itinerary} onChange={v => set({ itinerary: v })} accent={accent} />
              </Section>
            )}
            {activeId === 'squad' && (
              <Section title="Squad & staff" accent={accent}>
                <Input label="Squad note" value={t.squad} onChange={v => set({ squad: v })} placeholder="24 (incl. 4 academy + maternity-return planning)" />
                <div className="mt-4 text-[11px] mb-1" style={{ color: C.text4 }}>Travelling staff</div>
                <EditList items={t.staff} onChange={v => set({ staff: v })} placeholder="Add staff role and press Enter…" />
              </Section>
            )}
            {activeId === 'logistics' && (
              <Section title="Travel & accommodation" accent={accent}>
                <div className="space-y-3">
                  <Input label="Travel" value={t.logistics.travel} onChange={v => set({ logistics: { ...t.logistics, travel: v } })} placeholder="Charter coach + scheduled flights" />
                  <Input label="Accommodation" value={t.logistics.accommodation} onChange={v => set({ logistics: { ...t.logistics, accommodation: v } })} placeholder="Faro Beach Resort — 26 rooms" />
                  <Input label="Ground transport" value={t.logistics.transport} onChange={v => set({ logistics: { ...t.logistics, transport: v } })} placeholder="Local coach contracted on arrival" />
                  <Input label="Insurance" value={t.logistics.insurance} onChange={v => set({ logistics: { ...t.logistics, insurance: v } })} placeholder="Tour insurance + repatriation" />
                </div>
              </Section>
            )}
            {activeId === 'budget' && (
              <Section title="Budget" accent={accent} hint={`Live total: ${fmtGBP(total)}`}>
                <BudgetEditor lines={t.budget} onChange={v => set({ budget: v })} accent={accent} />
              </Section>
            )}
            {activeId === 'commercial' && (
              <Section title="Commercial activation" accent={accent} hint="Sponsor obligations & content">
                <EditList items={t.commercial} onChange={v => set({ commercial: v })} placeholder="Add a commercial obligation…" />
              </Section>
            )}
            {activeId === 'medical' && (
              <Section title="Medical & welfare" accent={accent} hint="Cycle / maternity / dual-reg aware">
                <EditList items={t.medical} onChange={v => set({ medical: v })} placeholder="Add a medical / welfare consideration…" />
              </Section>
            )}
            {activeId === 'review' && <Review t={t} accent={accent} total={total} />}

            {/* nav */}
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => go(-1)} disabled={sec === 0} className="flex items-center gap-1.5 text-[12.5px] px-3 py-2 rounded-lg disabled:opacity-30" style={{ color: C.text2, border: `1px solid ${C.border}` }}><ChevronLeft size={15} /> Back</button>
              {sec < SECTIONS.length - 1
                ? <button onClick={() => go(1)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg text-white" style={{ background: accent }}>Next <ChevronRight size={15} /></button>
                : <button onClick={() => valid && onCreate({ ...t, id: `t-${Date.now()}` })} disabled={!valid} className="flex items-center gap-1.5 text-[12.5px] font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{ background: accent }}>Create {kind}</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function sectionFilled(id: string, t: Trip): boolean {
  switch (id) {
    case 'basics': return t.name.trim().length > 0
    case 'objectives': return t.objectives.length > 0
    case 'itinerary': return t.itinerary.length > 0
    case 'squad': return t.staff.length > 0
    case 'logistics': return !!t.logistics.travel || !!t.logistics.accommodation
    case 'budget': return t.budget.length > 0
    case 'commercial': return t.commercial.length > 0
    case 'medical': return t.medical.length > 0
    default: return false
  }
}

function Section({ title, hint, accent, children }: { title: string; hint?: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: C.text }}>{title}</h2>
        {hint && <span className="text-[11.5px]" style={{ color: accent }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function ItineraryEditor({ days, onChange, accent }: { days: ItineraryDay[]; onChange: (v: ItineraryDay[]) => void; accent: string }) {
  const add = () => onChange([...days, { day: `Day ${days.length + 1}`, am: '', pm: '', eve: '' }])
  const upd = (i: number, patch: Partial<ItineraryDay>) => onChange(days.map((d, j) => j === i ? { ...d, ...patch } : d))
  return (
    <div className="space-y-3">
      {days.map((d, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-2">
            <input value={d.day} onChange={e => upd(i, { day: e.target.value })} className="text-[12.5px] font-bold bg-transparent outline-none" style={{ color: C.text }} />
            <button onClick={() => onChange(days.filter((_, j) => j !== i))} className="ml-auto" style={{ color: C.text4 }}><Trash2 size={13} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['am', 'pm', 'eve'] as const).map(slot => (
              <input key={slot} value={d[slot]} onChange={e => upd(i, { [slot]: e.target.value })} placeholder={slot.toUpperCase()}
                className="rounded-md px-2 py-1.5 text-[11.5px] outline-none" style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text2 }} />
            ))}
          </div>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg" style={{ color: accent, border: `1px dashed ${accent}66` }}><Plus size={14} /> Add day</button>
    </div>
  )
}

function BudgetEditor({ lines, onChange, accent }: { lines: BudgetLine[]; onChange: (v: BudgetLine[]) => void; accent: string }) {
  const total = lines.reduce((s, b) => s + (b.amount || 0), 0)
  const upd = (i: number, patch: Partial<BudgetLine>) => onChange(lines.map((b, j) => j === i ? { ...b, ...patch } : b))
  return (
    <div className="space-y-2">
      {lines.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={b.line} onChange={e => upd(i, { line: e.target.value })} placeholder="Line item"
            className="flex-1 rounded-md px-2.5 py-2 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} />
          <div className="flex items-center rounded-md px-2" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <span className="text-[12px]" style={{ color: C.text4 }}>£</span>
            <input value={b.amount || ''} onChange={e => upd(i, { amount: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" inputMode="numeric"
              className="w-24 rounded-md px-1 py-2 text-sm outline-none bg-transparent text-right" style={{ color: C.text }} />
          </div>
          <button onClick={() => onChange(lines.filter((_, j) => j !== i))} style={{ color: C.text4 }}><Trash2 size={13} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => onChange([...lines, { line: '', amount: 0 }])} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg" style={{ color: accent, border: `1px dashed ${accent}66` }}><Plus size={14} /> Add line</button>
        <div className="text-sm font-bold" style={{ color: C.text }}>Total <span className="font-mono ml-2" style={{ color: accent }}>{fmtGBP(total)}</span></div>
      </div>
    </div>
  )
}

function Review({ t, accent, total }: { t: Trip; accent: string; total: number }) {
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex gap-3 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="w-28 flex-shrink-0 text-[11px] uppercase tracking-wider" style={{ color: C.text4 }}>{k}</span>
      <span className="flex-1 text-[12.5px]" style={{ color: C.text2 }}>{v}</span>
    </div>
  )
  return (
    <Section title="Review & create" accent={accent} hint={fmtGBP(total)}>
      <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <Row k="Name" v={t.name || '—'} />
        <Row k="Dates" v={t.dates || '—'} />
        <Row k="Location" v={t.location || '—'} />
        <Row k="Status" v={t.status} />
        <Row k="Squad" v={t.squad || '—'} />
        <Row k="Objectives" v={t.objectives.length ? `${t.objectives.length} set` : '—'} />
        <Row k="Itinerary" v={t.itinerary.length ? `${t.itinerary.length} days` : '—'} />
        <Row k="Budget" v={`${t.budget.length} lines · ${fmtGBP(total)}`} />
        <Row k="Commercial" v={t.commercial.length ? `${t.commercial.length} obligations` : '—'} />
        <Row k="Medical" v={t.medical.length ? `${t.medical.length} considerations` : '—'} />
      </div>
      {!t.name && <div className="text-[12px] mt-3" style={{ color: C.warn }}>Add a name in Basics to create this {t.kind}.</div>}
    </Section>
  )
}
