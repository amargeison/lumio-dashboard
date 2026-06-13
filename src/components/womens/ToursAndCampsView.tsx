'use client'

import { useState, type ReactNode } from 'react'
import { Plane, Calendar, Globe2, Truck, Briefcase, Users, Plus, X } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
}

type Tab = 'preseason' | 'midseason' | 'tours' | 'logistics' | 'commercial' | 'squad'

type Camp = { window: string; dates: string; location: string; focus: string; squad: string; cost: string }
type Tour = { name: string; when: string; status: string; squad: string; sponsor: string; visa: string }

const INITIAL_CAMPS: Camp[] = [
  { window: 'Lionesses Sep international break', dates: '23 Sep – 06 Oct', location: 'Hartfield (training base)', focus: 'Maintenance + injury recovery for non-internationals · academy minutes', squad: '20 (4 with Lionesses)', cost: '£24,800' },
  { window: 'Champions League window',           dates: '04–18 Nov',       location: 'Hartfield + away fixture support', focus: 'Continental travel prep · sleep / jet-lag protocols', squad: 'Full + 2 academy', cost: '£36,400' },
  { window: 'Lionesses spring camp',             dates: '17 Feb – 03 Mar', location: 'Hartfield', focus: 'Phased load · cycle-aware training · ACL screening', squad: '22 (2 with Lionesses)', cost: '£18,200' },
  { window: 'WSL Cup competition window',         dates: '08–22 Apr',       location: 'Hartfield + cup-fixture support', focus: 'Cup rotation · academy first-team minutes', squad: 'Full + 4 academy', cost: '£14,600' },
]

const INITIAL_TOURS: Tour[] = [
  { name: 'Pre-season Spain camp + friendly',  when: 'Aug 2026',  status: 'Active',     squad: '22 (incl. 4 academy + maternity-return planning)', sponsor: 'Vanta Sports — kit launch tied to opening fixture', visa: 'EU — none required' },
  { name: 'USA pre-season tour + invitational',when: 'Jul 2026',  status: 'Planned',    squad: '24 + 2 dual-reg', sponsor: 'Crown Wagers — content brief in draft · brand-storytelling weight', visa: 'ESTAs in flight' },
  { name: 'Mid-season Asia branding tour',     when: 'Jan 2027',  status: 'Negotiating', squad: 'TBC',          sponsor: 'TBC',                                  visa: 'Pending squad lock' },
]

const LOGISTICS_BUDGET = [
  { line: 'Flights',          amount: '£72,400', pct: 36 },
  { line: 'Hotels',           amount: '£54,800', pct: 27 },
  { line: 'Ground transport', amount: '£14,200', pct: 7  },
  { line: 'Kit + equipment freight', amount: '£11,400', pct: 6 },
  { line: 'Catering',         amount: '£18,200', pct: 9  },
  { line: 'Insurance + repatriation', amount: '£12,400', pct: 6 },
  { line: 'Per diem',         amount: '£14,600', pct: 7  },
  { line: 'Childcare / family travel', amount: '£3,200', pct: 2 },
]

const COMMERCIAL_OBLIGATIONS = [
  { sponsor: 'Vanta Sports',     trip: 'Spain pre-season', obligation: 'Kit launch event + 4 player content posts',          status: 'On track', deadline: '12 Aug' },
  { sponsor: 'Crown Wagers',     trip: 'USA tour',         obligation: '2 brand video days + lifestyle/family-day content',  status: 'Brief in draft', deadline: '04 Jul' },
  { sponsor: 'Meridian Watches', trip: 'Spain pre-season', obligation: 'Hospitality activation in Marbella',                  status: 'Confirmed', deadline: '15 Aug' },
  { sponsor: 'Apex Performance', trip: 'USA tour',         obligation: 'Medical kit launch + Q&A on injury research',         status: 'Pending', deadline: '02 Jul' },
]

const SQUAD_AVAILABILITY = [
  { player: 'Emily Zhang',     role: 'Centre back', conflicts: 'Lionesses friendly window',          tour: 'Spain', status: 'Released to Lionesses' },
  { player: 'Lucy Whitmore',   role: 'Midfielder',  conflicts: 'Cycle phase 3 — load adjustment',    tour: 'USA',   status: 'Modified load' },
  { player: 'Ava Mitchell',    role: 'Forward',     conflicts: 'Maternity return — Phase 2 RTP',     tour: '—',     status: 'Rehab — not travelling' },
  { player: 'Freya Johansson', role: 'Centre mid',  conflicts: 'None',                               tour: 'Spain', status: 'Available' },
  { player: 'Amara Diallo',    role: 'Forward',     conflicts: 'Dual-reg fixture clash (loan club)', tour: 'USA',   status: 'Liaison required' },
  { player: 'Niamh Gallagher', role: 'CB',          conflicts: 'ACL screening due',                  tour: 'Spain', status: 'Screened — cleared' },
]

const parseGBP = (s: string): number => Number(String(s).replace(/[^0-9.]/g, '')) || 0
const fmtGBP = (n: number): string => '£' + Math.round(n).toLocaleString('en-GB')

interface Props {
  preSeasonContent?: ReactNode
  defaultTab?: Tab
}

export default function WomensToursAndCampsView({ preSeasonContent, defaultTab = 'preseason' }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [camps, setCamps] = useState<Camp[]>(INITIAL_CAMPS)
  const [tours, setTours] = useState<Tour[]>(INITIAL_TOURS)
  const [modal, setModal] = useState<null | 'camp' | 'tour'>(null)

  const campsTotal = camps.reduce((s, c) => s + parseGBP(c.cost), 0)

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'preseason',  label: 'Pre-Season',           icon: Calendar },
    { id: 'midseason',  label: 'Mid-Season Camps',     icon: Globe2 },
    { id: 'tours',      label: 'Tours',                icon: Plane },
    { id: 'logistics',  label: 'Logistics & Costs',    icon: Truck },
    { id: 'commercial', label: 'Commercial Activation', icon: Briefcase },
    { id: 'squad',      label: 'Squad Planning',       icon: Users },
  ]

  const addBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: C.accent }}>
      <Plus size={14} /> {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Plane size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Tours &amp; Camps</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Pre-Season · mid-season camps · tours · logistics · commercial · squad planning (cycle / maternity / dual-reg aware)</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const TabIcon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : C.text3,
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'color .12s, border-color .12s',
              }}>
              <TabIcon size={13} strokeWidth={1.75} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'preseason' && (
          preSeasonContent ?? (
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>
              Pre-season content not wired.
            </div>
          )
        )}

        {tab === 'midseason' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: C.text4 }}>{camps.length} camps · combined budget <span style={{ color: C.accent, fontWeight: 700 }}>{fmtGBP(campsTotal)}</span></p>
              {addBtn('Add camp', () => setModal('camp'))}
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Window','Dates','Location','Focus','Squad','Cost'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {camps.map((c, i) => (
                    <tr key={c.window + i} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{c.window}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{c.dates}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text2 }}>{c.location}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text2 }}>{c.focus}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text3 }}>{c.squad}</td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.accent }}>{c.cost}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `1px solid ${C.borderHi}`, background: C.panel2 }}>
                    <td className="px-3 py-2.5 font-bold" style={{ color: C.text }} colSpan={5}>Combined camp budget</td>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.accent }}>{fmtGBP(campsTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'tours' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: C.text4 }}>{tours.length} tours planned</p>
              {addBtn('Add tour', () => setModal('tour'))}
            </div>
            {tours.map((t, i) => (
              <div key={t.name + i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold" style={{ color: C.text }}>{t.name}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.status === 'Active' ? `${C.good}26` : t.status === 'Planned' ? `${C.warn}26` : `${C.text4}40`, color: t.status === 'Active' ? C.good : t.status === 'Planned' ? C.warn : C.text3 }}>{t.status.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div><span style={{ color: C.text4 }}>When</span><div style={{ color: C.text2 }}>{t.when}</div></div>
                  <div><span style={{ color: C.text4 }}>Squad</span><div style={{ color: C.text2 }}>{t.squad}</div></div>
                  <div><span style={{ color: C.text4 }}>Sponsor brief</span><div style={{ color: C.text2 }}>{t.sponsor}</div></div>
                  <div><span style={{ color: C.text4 }}>Visa status</span><div style={{ color: C.text2 }}>{t.visa}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'logistics' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.accent}55` }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: C.text }}>Season camp commitments</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: C.text4 }}>Rolls up the Mid-Season Camps tab · {tours.length} tours in planning</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono" style={{ color: C.accent }}>{fmtGBP(campsTotal)}</div>
                  <div className="text-[10px]" style={{ color: C.text4 }}>across {camps.length} camps</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Per-trip budget breakdown — Spain pre-season camp</h3>
              <div className="space-y-2">
                {LOGISTICS_BUDGET.map(b => (
                  <div key={b.line} className="flex items-center gap-3">
                    <div className="text-xs flex-1" style={{ color: C.text2 }}>{b.line}</div>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: C.borderHi }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${b.pct * 2.6}%`, background: C.accent }} />
                    </div>
                    <div className="text-xs font-mono w-20 text-right" style={{ color: C.text }}>{b.amount}</div>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 mt-2 text-sm font-bold" style={{ borderColor: C.border, color: C.text }}>
                  <span>Total</span><span className="font-mono">£201,200</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Hotel block</div>
                <div style={{ color: C.text3 }}>Marbella Beach Resort — 26 rooms, 10 nights · childcare-friendly suites for staff with families.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Travel partner</div>
                <div style={{ color: C.text3 }}>Westmoor Sports Travel · contracted 2024-2027 · team-specific dietary list workflow.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Sustainability</div>
                <div style={{ color: C.text3 }}>Avg 1,820kg CO₂ per trip (offset · partner Aspen Carbon). Train-vs-coach decisions logged.</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'commercial' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['Sponsor','Trip','Obligation','Status','Deadline'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {COMMERCIAL_OBLIGATIONS.map((o, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{o.sponsor}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text3 }}>{o.trip}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{o.obligation}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.good}26`, color: C.good }}>{o.status.toUpperCase()}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{o.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'squad' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['Player','Role','Conflicts (international / cycle / maternity / dual-reg)','Tour','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {SQUAD_AVAILABILITY.map(s => (
                  <tr key={s.player} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{s.player}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text3 }}>{s.role}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{s.conflicts}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{s.tour}</td>
                    <td className="px-3 py-2.5" style={{ color: s.status === 'Available' || s.status.includes('cleared') ? C.good : s.status.includes('Modified') || s.status.includes('Liaison') ? C.warn : C.text3 }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'camp' && (
        <AddCampModal onClose={() => setModal(null)} onAdd={(c) => { setCamps(prev => [...prev, c]); setModal(null); setTab('midseason') }} />
      )}
      {modal === 'tour' && (
        <AddTourModal onClose={() => setModal(null)} onAdd={(t) => { setTours(prev => [...prev, t]); setModal(null); setTab('tours') }} />
      )}
    </div>
  )
}

function Shell({ title, onClose, children, onSubmit, submitLabel, valid }: { title: string; onClose: () => void; children: ReactNode; onSubmit: () => void; submitLabel: string; valid: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-base font-bold" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.text4 }}><X size={18} /></button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm" style={{ color: C.text4 }}>Cancel</button>
          <button onClick={onSubmit} disabled={!valid} className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: C.accent }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, full }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-[11px] mb-1" style={{ color: C.text4 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
        style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} />
    </div>
  )
}

function AddCampModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Camp) => void }) {
  const [campWindow, setCampWindow] = useState('')
  const [dates, setDates] = useState('')
  const [location, setLocation] = useState('Hartfield (training base)')
  const [focus, setFocus] = useState('')
  const [squad, setSquad] = useState('Full squad')
  const [cost, setCost] = useState('')
  const valid = campWindow.trim().length > 0
  const submit = () => onAdd({
    window: campWindow.trim(), dates: dates.trim() || 'TBC', location: location.trim() || 'Hartfield',
    focus: focus.trim() || '—', squad: squad.trim() || 'TBC',
    cost: cost.trim() ? fmtGBP(parseGBP(cost)) : '£0',
  })
  return (
    <Shell title="Add mid-season camp" onClose={onClose} onSubmit={submit} submitLabel="Add camp" valid={valid}>
      <Field label="Window / name *" value={campWindow} onChange={setCampWindow} placeholder="e.g. October international break" full />
      <Field label="Dates" value={dates} onChange={setDates} placeholder="e.g. 12–24 Oct" />
      <Field label="Location" value={location} onChange={setLocation} />
      <Field label="Focus" value={focus} onChange={setFocus} placeholder="Phased load · cycle-aware training" full />
      <Field label="Squad" value={squad} onChange={setSquad} placeholder="22 (2 with Lionesses)" />
      <Field label="Cost (£)" value={cost} onChange={setCost} placeholder="e.g. 18000" />
    </Shell>
  )
}

function AddTourModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Tour) => void }) {
  const [name, setName] = useState('')
  const [when, setWhen] = useState('')
  const [status, setStatus] = useState('Planned')
  const [squad, setSquad] = useState('Full squad')
  const [sponsor, setSponsor] = useState('')
  const [visa, setVisa] = useState('')
  const valid = name.trim().length > 0
  const submit = () => onAdd({
    name: name.trim(), when: when.trim() || 'TBC', status,
    squad: squad.trim() || 'TBC', sponsor: sponsor.trim() || 'TBC', visa: visa.trim() || 'TBC',
  })
  return (
    <Shell title="Add tour" onClose={onClose} onSubmit={submit} submitLabel="Add tour" valid={valid}>
      <Field label="Tour name *" value={name} onChange={setName} placeholder="e.g. Portugal mid-season tour" full />
      <Field label="When" value={when} onChange={setWhen} placeholder="e.g. Jan 2027" />
      <div>
        <label className="block text-[11px] mb-1" style={{ color: C.text4 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }}>
          <option>Active</option><option>Planned</option><option>Negotiating</option>
        </select>
      </div>
      <Field label="Squad" value={squad} onChange={setSquad} placeholder="24 + 2 dual-reg" />
      <Field label="Sponsor brief" value={sponsor} onChange={setSponsor} placeholder="Sponsor — activation note" full />
      <Field label="Visa status" value={visa} onChange={setVisa} placeholder="ESTAs in flight" full />
    </Shell>
  )
}

