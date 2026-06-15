'use client'

import { useState } from 'react'
import {
  Globe2, Home, Wallet, BookOpen, Car, Users, Stethoscope, Phone,
  Truck, Scroll, Heart,
} from 'lucide-react'

// Men's Pro — Player Integration (standalone). Onboarding for international /
// relocating players: live draggable welfare board, recent activity, and an
// expandable per-player stage checklist. Blue accent. Demo only.

const C = {
  panel: '#0D1117', panelAlt: '#111318', panel2: '#0D0F14', border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#2563EB', blueDeep: '#003DA5', blueLt: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const rag = (s: string): { background: string; color: string } =>
  /complete|done|approved|registered|granted|valid|settled|signed|active|low|fluent|native|received|opened|confirmed|connected|up to date|drives|held|translated/i.test(s) ? { background: 'rgba(34,197,94,0.18)', color: '#4ADE80' } :
  /progress|pending|searching|applied|scheduled|medium|review|conversion|shuttle/i.test(s) ? { background: 'rgba(245,158,11,0.18)', color: '#FBBF24' } :
  /not started|none|high|n\/a|—/i.test(s) ? { background: 'rgba(107,114,128,0.25)', color: '#9CA3AF' } :
  { background: 'rgba(37,99,235,0.18)', color: '#60A5FA' }
const isDone = (s: string) => /complete|approved|registered|granted|valid|settled|signed|active|fluent|native|intermediate|received|opened|confirmed|connected|up to date|drives|held|translated|low|none/i.test(s)

type Stage = 'NEW ARRIVAL' | 'SETTLING IN' | 'ESTABLISHED' | 'MONITORING'

type P = {
  id: string; name: string; flag: string; nat: string; pos: string; arrival: string; pct: number; buddy: string
  imm: { gbe: string; visa: string; visaExp: string; itc: string; permit: string }
  setup: { housing: string; banking: string; ni: string; tax: string; gp: string; phone: string; driving: string; transport: string }
  family: { partner: string; children: string; schools: string; childcare: string }
  lang: { level: string; provider: string; interpreter: string; liaison: string; community: string }
  welfare: { lastCheckin: string; homesickness: string; pfa: string; concerns: string }
}
const PLAYERS: P[] = [
  { id: 'diallo', name: 'Amadou Diallo', flag: '🇸🇳', nat: 'Senegal', pos: 'FW', arrival: 'Aug 2024', pct: 100, buddy: 'Sam Porter',
    imm: { gbe: 'Approved', visa: 'ISP granted', visaExp: 'Sep 2026', itc: 'Received', permit: 'Up to date' },
    setup: { housing: 'Lease signed · moved in', banking: 'Account opened', ni: 'Received', tax: '1257L confirmed', gp: 'Registered', phone: 'Active', driving: 'UK licence held', transport: 'Drives · Bay 14' },
    family: { partner: 'Settled', children: '2 · school places secured', schools: 'Riverside Primary (EAL)', childcare: 'Arranged' },
    lang: { level: 'Fluent', provider: 'N/A', interpreter: 'N/A', liaison: 'Ousmane Ba (community)', community: 'Connected' },
    welfare: { lastCheckin: '3 days ago', homesickness: 'Low', pfa: 'Shared at signing', concerns: 'None' } },
  { id: 'tanaka', name: 'Kenji Tanaka', flag: '🇯🇵', nat: 'Japan', pos: 'MF', arrival: 'Feb 2026', pct: 67, buddy: 'Liam Barker',
    imm: { gbe: 'Approved', visa: 'ISP granted', visaExp: 'Feb 2029', itc: 'Received', permit: 'Up to date' },
    setup: { housing: 'Moved in', banking: 'Account opened', ni: 'Received', tax: '1257L confirmed', gp: 'Registered', phone: 'Active', driving: 'Conversion in progress', transport: 'Club shuttle' },
    family: { partner: 'Relocated', children: 'N/A', schools: 'N/A', childcare: 'N/A' },
    lang: { level: 'Intermediate', provider: 'ESOL · Surrey College', interpreter: 'Hiroshi Sato', liaison: 'Hiroshi Sato', community: 'Connected' },
    welfare: { lastCheckin: 'This week', homesickness: 'Low', pfa: 'Shared at signing', concerns: 'None' } },
  { id: 'rossi', name: 'Matteo Rossi', flag: '🇮🇹', nat: 'Italy', pos: 'DF', arrival: 'Jan 2026', pct: 50, buddy: 'Daniel Webb',
    imm: { gbe: 'N/A (settled status)', visa: 'Settled status', visaExp: '—', itc: 'Received', permit: 'N/A' },
    setup: { housing: 'Lease signed', banking: 'Account opened', ni: 'Received', tax: 'Confirmed', gp: 'Registered', phone: 'Active', driving: 'EU licence valid', transport: 'Drives' },
    family: { partner: 'Relocated · job lead', children: '1 · Italian school place', schools: 'St Anne’s (place secured)', childcare: 'In progress' },
    lang: { level: 'Elementary', provider: 'ESOL · Surrey College', interpreter: 'Agency (Italian)', liaison: 'Assigned', community: 'Connected' },
    welfare: { lastCheckin: 'This week', homesickness: 'Medium', pfa: 'Shared at signing', concerns: 'English lessons starting' } },
  { id: 'fernandez', name: 'Lucas Fernandez', flag: '🇧🇷', nat: 'Brazil', pos: 'GK', arrival: 'Apr 2026', pct: 25, buddy: 'Jordan Hayes',
    imm: { gbe: 'Approved', visa: 'ISP granted', visaExp: 'Apr 2029', itc: 'Received', permit: 'Up to date' },
    setup: { housing: 'Searching', banking: 'In progress', ni: 'Applied', tax: 'Pending', gp: 'Registered', phone: 'Active', driving: 'Conversion pending', transport: 'Club shuttle' },
    family: { partner: 'Relocating', children: 'N/A', schools: 'N/A', childcare: 'N/A' },
    lang: { level: 'Beginner', provider: 'ESOL · Surrey College', interpreter: 'Agency (Portuguese)', liaison: 'Pending match', community: 'In progress' },
    welfare: { lastCheckin: 'This week', homesickness: 'High', pfa: 'Shared at signing', concerns: 'Bank account appointment' } },
  { id: 'novak', name: 'Pavel Novak', flag: '🇨🇿', nat: 'Czech', pos: 'MF', arrival: 'Apr 2026', pct: 10, buddy: 'Connor Walsh',
    imm: { gbe: 'N/A (settled status)', visa: 'Settled status', visaExp: '—', itc: 'Received', permit: 'N/A' },
    setup: { housing: 'Viewing scheduled', banking: 'In progress', ni: 'Applied', tax: 'Pending', gp: 'Pending', phone: 'Active', driving: 'EU licence valid', transport: 'Club shuttle' },
    family: { partner: 'Arriving later', children: 'N/A', schools: 'N/A', childcare: 'N/A' },
    lang: { level: 'Elementary', provider: 'ESOL · Surrey College', interpreter: 'Agency (Czech)', liaison: 'Pending match', community: 'In progress' },
    welfare: { lastCheckin: 'This week', homesickness: 'High', pfa: 'Shared at signing', concerns: 'Housing viewing tomorrow' } },
]

const DEADLINES = [
  { date: 'Tomorrow', who: 'Pavel Novak', what: 'Housing viewing — 3-bed flat, Kingston', tone: C.red },
  { date: '30 Apr', who: 'Lucas Fernandez', what: 'Bank account appointment — Barclays', tone: C.amber },
  { date: '28 Apr', who: 'Matteo Rossi', what: 'English lessons start — ESOL Level 2', tone: C.amber },
  { date: '15 May', who: 'Kenji Tanaka', what: 'UK driving test — Mitcham Test Centre', tone: C.text3 },
  { date: 'Sep 2026', who: 'Amadou Diallo', what: 'Visa renewal window', tone: C.text3 },
]
const AREAS = ['Immigration', 'Housing', 'Banking & tax', 'Healthcare', 'Driving', 'Language', 'Family', 'Cultural liaison', 'Wellbeing', 'Buddy / mentor', 'Contract translated', 'Transport']
const STAGES: Stage[] = ['NEW ARRIVAL', 'SETTLING IN', 'ESTABLISHED', 'MONITORING']
const INITIAL_STAGE: Record<string, Stage> = { fernandez: 'NEW ARRIVAL', novak: 'NEW ARRIVAL', rossi: 'SETTLING IN', tanaka: 'SETTLING IN', diallo: 'ESTABLISHED' }
const ragTone = (pct: number) => pct >= 80 ? C.good : pct >= 50 ? C.amber : C.red

const ACTIVITY = [
  { t: '10:14', txt: 'Fernandez: bank account application submitted — Barclays' },
  { t: '09:42', txt: 'Tanaka: driving test booked — 15 May, Mitcham Test Centre' },
  { t: '09:18', txt: 'Rossi: English lessons arranged — ESOL Level 2, Mon/Wed 10am' },
  { t: 'Yest', txt: 'Novak: housing viewing — 3-bed flat, Kingston, tomorrow 14:00' },
  { t: 'Yest', txt: 'Diallo: visa renewal reminder set — September 2026' },
  { t: '2d', txt: 'Fernandez: GP surgery registration confirmed — Riverside Practice' },
  { t: '2d', txt: 'Rossi: family relocation — partner job lead, Italian school place' },
  { t: '3d', txt: 'Tanaka: cultural liaison assigned — Hiroshi Sato (Japanese community)' },
  { t: '4d', txt: 'Quarterly wellbeing survey closed — 23/25 responses, 8.4/10 satisfaction' },
]

type StageItem = { id: string; title: string; icon: React.ElementType; status: string; details: { label: string; value: string }[] }
const buildStages = (p: P): StageItem[] => [
  { id: 'visa', title: 'Visa & Work Permit', icon: Globe2, status: p.imm.visa, details: [
    { label: 'GBE status', value: p.imm.gbe }, { label: 'Visa / route', value: p.imm.visa }, { label: 'Expiry', value: p.imm.visaExp }, { label: 'ITC registration', value: p.imm.itc }, { label: 'Sponsor licence', value: p.imm.permit } ] },
  { id: 'housing', title: 'Housing & Accommodation', icon: Home, status: p.setup.housing, details: [
    { label: 'Status', value: p.setup.housing }, { label: 'Search radius', value: 'Within 8 miles of training' }, { label: 'Utilities', value: isDone(p.setup.housing) ? 'Connected' : 'Pending' }, { label: 'Furnishing', value: isDone(p.setup.housing) ? 'Complete' : 'Not started' } ] },
  { id: 'banking', title: 'Banking & Finance', icon: Wallet, status: p.setup.banking, details: [
    { label: 'UK bank account', value: p.setup.banking }, { label: 'NI number', value: p.setup.ni }, { label: 'Tax code', value: p.setup.tax }, { label: 'PAYE registration', value: 'Complete' } ] },
  { id: 'language', title: 'English Language', icon: BookOpen, status: p.lang.level, details: [
    { label: 'Level', value: p.lang.level }, { label: 'Provider', value: p.lang.provider }, { label: 'Interpreter', value: p.lang.interpreter }, { label: 'Schedule', value: p.lang.provider === 'N/A' ? 'N/A' : 'Mon/Wed 10:00–12:00' } ] },
  { id: 'driving', title: 'Driving', icon: Car, status: p.setup.driving, details: [
    { label: 'Licence', value: p.setup.driving }, { label: 'UK conversion', value: /held|valid/i.test(p.setup.driving) ? 'Not required' : 'In progress' }, { label: 'Club car', value: isDone(p.setup.driving) ? 'Lease — allocated' : 'Pending' } ] },
  { id: 'family', title: 'Family & Education', icon: Users, status: p.family.partner, details: [
    { label: 'Partner', value: p.family.partner }, { label: 'Children', value: p.family.children }, { label: 'Schools', value: p.family.schools }, { label: 'Childcare', value: p.family.childcare } ] },
  { id: 'healthcare', title: 'Healthcare', icon: Stethoscope, status: p.setup.gp, details: [
    { label: 'GP', value: `${p.setup.gp} · Riverside Practice` }, { label: 'Dental', value: isDone(p.setup.gp) ? 'Registered' : 'Pending' }, { label: 'Private medical', value: 'Active · club scheme' } ] },
  { id: 'phone', title: 'Phone & Connectivity', icon: Phone, status: p.setup.phone, details: [
    { label: 'UK phone number', value: p.setup.phone }, { label: 'Home broadband', value: isDone(p.setup.housing) ? 'Connected' : 'Pending' }, { label: 'Club IT access', value: 'Provisioned' } ] },
  { id: 'cultural', title: 'Cultural Integration', icon: Globe2, status: p.lang.liaison, details: [
    { label: 'Cultural liaison', value: p.lang.liaison }, { label: 'Community groups', value: p.lang.community }, { label: 'Local area guide', value: 'Provided' } ] },
  { id: 'transport', title: 'Transport to Training', icon: Truck, status: p.setup.transport, details: [
    { label: 'Method', value: p.setup.transport }, { label: 'Parking', value: /drives/i.test(p.setup.transport) ? 'Allocated' : 'N/A' }, { label: 'Travel time', value: '~22 min' } ] },
  { id: 'contract', title: 'Contract & Legal', icon: Scroll, status: 'Translated', details: [
    { label: 'Contract translated', value: 'Yes · countersigned' }, { label: 'Legal advisor', value: 'D. Pemberton, Sportshelm' }, { label: 'Player handbook', value: 'Provided · translated' } ] },
  { id: 'wellbeing', title: 'Wellbeing Check-ins', icon: Heart, status: `Last: ${p.welfare.lastCheckin}`, details: [
    { label: 'Last check-in', value: p.welfare.lastCheckin }, { label: 'Buddy / mentor', value: p.buddy }, { label: 'Homesickness', value: p.welfare.homesickness }, { label: 'PFA line', value: p.welfare.pfa }, { label: 'Open concerns', value: p.welfare.concerns } ] },
]

const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
)
const Tbl = ({ head, rows }: { head: string[]; rows: (string | { v: string; rag?: boolean })[][] }) => (
  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>{head.map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}>{r.map((c, j) => (
        <td key={j} className="px-3 py-2.5" style={{ color: j === 0 ? C.text2 : C.text3 }}>{typeof c === 'string' ? c : (c.rag ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={rag(c.v)}>{c.v}</span> : c.v)}</td>
      ))}</tr>))}</tbody>
    </table>
  </div>
)

type Tab = 'overview' | 'players' | 'immigration' | 'setup' | 'family' | 'language' | 'welfare'

export default function FootballPlayerIntegrationView() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stageMap, setStageMap] = useState<Record<string, Stage>>(INITIAL_STAGE)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<Stage | null>(null)
  const [openPlayer, setOpenPlayer] = useState<string | null>(null)
  const [openStage, setOpenStage] = useState<string | null>(null)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'players', label: 'Players' }, { id: 'immigration', label: 'Immigration' },
    { id: 'setup', label: 'Relocation & Setup' }, { id: 'family', label: 'Family & Education' }, { id: 'language', label: 'Language & Culture' }, { id: 'welfare', label: 'Wellbeing & Welfare' },
  ]
  const avg = Math.round(PLAYERS.reduce((s, p) => s + p.pct, 0) / PLAYERS.length)
  const drop = (s: Stage) => { if (dragId) setStageMap(m => ({ ...m, [dragId]: s })); setDragId(null); setOverStage(null) }

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Globe2 size={18} style={{ color: C.blueDeep }} /> Player Integration</h2><p className="text-sm mt-1" style={{ color: C.text3 }}>End-to-end onboarding for international &amp; relocating players — immigration, relocation, family, language, culture and welfare.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="International players" value={String(PLAYERS.length)} sub="of 25 squad" color={C.text} />
        <Stat label="Avg integration" value={`${avg}%`} sub="across all areas" color={C.blueLt} />
        <Stat label="Visas / permits valid" value="5 / 5" sub="all in date" color={C.good} />
        <Stat label="Open actions" value={String(DEADLINES.length)} sub="next 30 days" color={C.amber} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === t.id ? C.blueDeep : 'transparent'}`, color: tab === t.id ? C.blueLt : C.text4 }}>{t.label}</button>))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Player Welfare Board</h3>
              <span className="text-[11px]" style={{ color: C.text4 }}>Drag cards between stages</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {STAGES.map(s => {
                const inStage = PLAYERS.filter(p => (stageMap[p.id] || 'NEW ARRIVAL') === s)
                const isOver = overStage === s
                return (
                  <div key={s} onDragOver={e => { e.preventDefault(); setOverStage(s) }} onDragLeave={() => setOverStage(o => o === s ? null : o)} onDrop={() => drop(s)}
                    className="rounded-xl p-3 flex flex-col gap-2 min-h-[200px] transition-colors"
                    style={{ backgroundColor: isOver ? 'rgba(37,99,235,0.06)' : C.panel2, border: `1px solid ${isOver ? C.blue : C.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.text3 }}>{s}</div>
                      <div className="text-[10px] font-bold" style={{ color: C.text4 }}>{inStage.length}</div>
                    </div>
                    {inStage.map(p => {
                      const dl = DEADLINES.find(d => d.who === p.name)
                      return (
                        <div key={p.id} draggable onDragStart={() => setDragId(p.id)} onDragEnd={() => { setDragId(null); setOverStage(null) }}
                          className="rounded-lg p-3 cursor-grab active:cursor-grabbing" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, opacity: dragId === p.id ? 0.4 : 1 }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0"><span className="text-base">{p.flag}</span><div className="text-xs font-bold truncate" style={{ color: C.text }}>{p.name}</div></div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${ragTone(p.pct)}26`, color: ragTone(p.pct) }}>{p.pos}</span>
                          </div>
                          <div className="text-[10px] mb-2" style={{ color: C.text4 }}>Arrived {p.arrival}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: C.borderHi }}><div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: C.blue }} /></div>
                            <span className="text-[10px] font-bold" style={{ color: C.text2 }}>{p.pct}%</span>
                          </div>
                          <div className="text-[10px]" style={{ color: C.text3 }}><span className="font-semibold" style={{ color: C.text2 }}>Next:</span> {dl ? dl.what : 'On track · routine check-ins'}</div>
                          {dl && <div className="text-[10px] mt-0.5" style={{ color: C.amber }}>· {dl.date}</div>}
                        </div>
                      )
                    })}
                    {inStage.length === 0 && <div className="text-[10px] text-center mt-4" style={{ color: C.text4 }}>Drop here</div>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: C.text }}>Integration progress</h3><span className="text-[11px]" style={{ color: C.text4 }}>Click a player to see all stages</span></div>
            <div className="space-y-2">{PLAYERS.map(p => {
              const open = openPlayer === p.id
              const stages = buildStages(p)
              const doneCount = stages.filter(st => isDone(st.status)).length
              return (
                <div key={p.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${open ? C.blueDeep + '66' : C.border}`, background: open ? C.panelAlt : 'transparent' }}>
                  <button onClick={() => { setOpenPlayer(open ? null : p.id); setOpenStage(null) }} className="w-full text-left px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: C.text2 }}>{p.flag} {p.name} <span style={{ color: C.text4 }}>· {p.nat} · {p.pos} · since {p.arrival}</span></span>
                      <span className="flex items-center gap-2"><span className="text-[10px]" style={{ color: C.text4 }}>{doneCount}/{stages.length} stages</span><span className="text-xs font-bold" style={{ color: C.blueLt }}>{p.pct}%</span><span style={{ color: C.text4, fontSize: 11 }}>{open ? '▾' : '▸'}</span></span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: ragTone(p.pct) }} /></div>
                  </button>
                  {open && (
                    <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="pt-3" />
                      {stages.map((st, idx) => {
                        const ItemIcon = st.icon
                        const sk = `${p.id}:${st.id}`
                        const so = openStage === sk
                        const done = isDone(st.status)
                        return (
                          <div key={st.id} className="rounded-lg" style={{ backgroundColor: done ? `${C.good}0a` : C.panel, border: `1px solid ${done ? C.good + '30' : C.border}` }}>
                            <div className="flex items-center gap-3 p-2.5 cursor-pointer" onClick={() => setOpenStage(so ? null : sk)}>
                              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: done ? `${C.good}33` : C.panel2, border: `1px solid ${done ? C.good + '80' : C.borderHi}` }}>{done ? <span style={{ color: C.good, fontSize: 11 }}>✓</span> : <span style={{ color: C.text4, fontSize: 10 }}>{idx + 1}</span>}</span>
                              <ItemIcon size={14} style={{ color: done ? C.good : C.blue }} className="flex-shrink-0" />
                              <div className="flex-1 min-w-0"><div className="text-xs font-semibold" style={{ color: done ? C.text2 : C.text }}>{st.title}</div></div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={rag(st.status)}>{st.status}</span>
                              <span style={{ color: C.text4, fontSize: 10 }}>{so ? '▾' : '▸'}</span>
                            </div>
                            {so && (
                              <div className="px-3 pb-3 pt-0" style={{ borderTop: `1px solid ${C.border}` }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 pt-2.5">
                                  {st.details.map((d, i) => (<div key={i} className="flex justify-between text-[11px]"><span style={{ color: C.text4 }}>{d.label}</span><span style={{ color: C.text2 }} className="font-medium text-right ml-3">{d.value}</span></div>))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Upcoming actions</h3>
              {DEADLINES.map((d, i) => (<div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < DEADLINES.length - 1 ? `1px solid ${C.border}80` : undefined }}><span className="text-[11px] font-bold w-16 shrink-0" style={{ color: d.tone }}>{d.date}</span><div><div className="text-xs font-medium" style={{ color: C.text2 }}>{d.who}</div><div className="text-[11px]" style={{ color: C.text4 }}>{d.what}</div></div></div>))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Areas covered — no stone unturned</h3>
              <div className="grid grid-cols-2 gap-2">{AREAS.map(a => (<div key={a} className="flex items-center gap-2 text-xs" style={{ color: C.text3 }}><span style={{ color: C.good }}>✓</span>{a}</div>))}</div>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Recent Activity</h3>
            <div className="space-y-2">{ACTIVITY.map((a, i) => (<div key={i} className="flex gap-3 text-xs"><span className="font-mono w-12 flex-shrink-0" style={{ color: C.text4 }}>{a.t}</span><span style={{ color: C.text2 }}>{a.txt}</span></div>))}</div>
          </div>
        </div>
      )}

      {tab === 'players' && (
        <Tbl head={['Player', 'Nationality', 'Pos', 'Arrived', 'Integration', 'Visa / status', 'Buddy']} rows={PLAYERS.map(p => [
          `${p.flag} ${p.name}`, p.nat, p.pos, p.arrival, { v: `${p.pct}%` }, { v: p.imm.visa, rag: true }, p.buddy,
        ])} />
      )}

      {tab === 'immigration' && (
        <div className="space-y-3">
          <Tbl head={['Player', 'GBE', 'Visa / route', 'Expiry', 'ITC registration', 'Sponsor licence']} rows={PLAYERS.map(p => [
            `${p.flag} ${p.name}`, { v: p.imm.gbe, rag: true }, { v: p.imm.visa, rag: true }, p.imm.visaExp, { v: p.imm.itc, rag: true }, { v: p.imm.permit, rag: true },
          ])} />
          <div className="rounded-xl p-4 text-[11px]" style={{ background: 'rgba(0,61,165,0.10)', borderLeft: `3px solid ${C.blueDeep}`, color: C.text2 }}>
            Workflow: GBE points assessment → ISP visa application → biometrics → FA international clearance (ITC) → EFL/PL registration. Immigration solicitor: M. Carter, Stowe &amp; Hart LLP. Sponsor-licence audit tracked centrally; renewal windows flagged 6 months out.
          </div>
        </div>
      )}

      {tab === 'setup' && (
        <div className="space-y-3">
          <Tbl head={['Player', 'Housing', 'Banking', 'NI no.', 'Tax', 'GP', 'Phone / broadband', 'Driving', 'Transport']} rows={PLAYERS.map(p => [
            `${p.flag} ${p.name}`, { v: p.setup.housing, rag: true }, { v: p.setup.banking, rag: true }, { v: p.setup.ni, rag: true }, { v: p.setup.tax, rag: true }, { v: p.setup.gp, rag: true }, { v: p.setup.phone, rag: true }, { v: p.setup.driving, rag: true }, p.setup.transport,
          ])} />
          <div className="rounded-xl p-4 text-[11px]" style={{ background: 'rgba(0,61,165,0.10)', borderLeft: `3px solid ${C.blueDeep}`, color: C.text2 }}>
            Relocation concierge handles housing search (within 8 miles of training), utilities, bank account, NI number, PAYE/tax code, GP &amp; dental registration, phone &amp; broadband, and UK driving-licence conversion.
          </div>
        </div>
      )}

      {tab === 'family' && (
        <Tbl head={['Player', 'Partner', 'Children', 'Schools', 'Childcare']} rows={PLAYERS.map(p => [
          `${p.flag} ${p.name}`, { v: p.family.partner, rag: true }, p.family.children, p.family.schools, { v: p.family.childcare, rag: true },
        ])} />
      )}

      {tab === 'language' && (
        <div className="space-y-3">
          <Tbl head={['Player', 'English level', 'Provider', 'Interpreter', 'Cultural liaison', 'Community']} rows={PLAYERS.map(p => [
            `${p.flag} ${p.name}`, p.lang.level, p.lang.provider, p.lang.interpreter, p.lang.liaison, { v: p.lang.community, rag: true },
          ])} />
          <div className="rounded-xl p-4 text-[11px]" style={{ background: 'rgba(0,61,165,0.10)', borderLeft: `3px solid ${C.blueDeep}`, color: C.text2 }}>
            ESOL lessons (Surrey College, weekday mornings), matchday &amp; meeting interpreters by language, a cultural liaison per player, local-area guide and connections to community groups. Player handbook and contract provided translated.
          </div>
        </div>
      )}

      {tab === 'welfare' && (
        <div className="space-y-3">
          <Tbl head={['Player', 'Last check-in', 'Homesickness', 'Buddy / mentor', 'PFA line', 'Open concerns']} rows={PLAYERS.map(p => [
            `${p.flag} ${p.name}`, p.welfare.lastCheckin, { v: p.welfare.homesickness, rag: true }, p.buddy, { v: p.welfare.pfa, rag: true }, p.welfare.concerns,
          ])} />
          <div className="rounded-xl p-4 text-[11px]" style={{ background: 'rgba(0,61,165,0.10)', borderLeft: `3px solid ${C.blueDeep}`, color: C.text2 }}>
            Buddy / mentor system pairs each new arrival with a settled team-mate. Wellbeing check-ins (weekly early on, then fortnightly) track homesickness, training adjustment, language confidence and sleep. PFA wellbeing line shared at signing; independent player-care officer available.
          </div>
        </div>
      )}
    </div>
  )
}
