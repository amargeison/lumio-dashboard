'use client'

import React, { useMemo, useState } from 'react'
import {
  LayoutGrid, Shield, MapPin, Utensils, Radio, Flag, Ticket, HeartPulse,
  ClipboardCheck, Clock, Phone, AlertTriangle, CheckCircle2, Circle,
  Sparkles, Cloud, Users, Megaphone, ChevronRight, BookOpen,
} from 'lucide-react'
import FootballMatchdayProgramme from './FootballMatchdayProgramme'

// ─────────────────────────────────────────────────────────────────────────
// Men's (Pro) — Matchday Operations command centre.
//
// Flagship Operations feature. Pulled out of Club Operations into its own
// top-level page (everything in a club revolves around match day). Nine
// tabs, each a full operational area with checklists, named contacts,
// timings, capacities, costs and risk flags. DEMO-SAFE — no real calls;
// the "Generate matchday plan" AI button reveals a canned plan only.
//
// Fixture: Lumio Sports FC vs Greyfield Town · Sat 12 Apr 2026 · KO 15:00
//          Lumio Park (Home) · EFL League One · MD-39 · Forecast attendance 7,800.
// ─────────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#0B0D12',
  card:      '#0D1117',
  cardAlt:   '#111318',
  border:    '#1F2937',
  borderHi:  '#374151',
  text:      '#F9FAFB',
  text2:     '#D1D5DB',
  text3:     '#9CA3AF',
  text4:     '#6B7280',
  green:     '#22C55E',
  amber:     '#F59E0B',
  red:       '#EF4444',
  blue:      '#0EA5E9',
}

type Tone = 'good' | 'warn' | 'bad' | 'info'
const toneColor = (t: Tone, accent: string) =>
  t === 'good' ? C.green : t === 'warn' ? C.amber : t === 'bad' ? C.red : accent

// ─── Item type for checklists ────────────────────────────────────────────
type Item = { id: string; label: string; done?: boolean; owner?: string; meta?: string; tone?: Tone }

// ─── Reusable: a checklist card with interactive toggles ─────────────────
function Checklist({ title, icon: Icon, items, accent }: { title: string; icon?: React.ElementType; items: Item[]; accent: string }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.id, !!i.done])))
  const total = items.length
  const complete = items.filter(i => done[i.id]).length
  const pct = total ? Math.round((complete / total) * 100) : 0
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} style={{ color: accent }} />}
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text3 }}>{title}</span>
        </div>
        <span className="text-[11px] font-semibold tnum" style={{ color: pct === 100 ? C.green : C.text3 }}>{complete}/{total}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map(it => {
          const isDone = done[it.id]
          return (
            <button key={it.id} onClick={() => setDone(d => ({ ...d, [it.id]: !d[it.id] }))}
              className="flex items-start gap-2.5 text-left rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
              {isDone
                ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                : <Circle size={15} className="flex-shrink-0 mt-0.5" style={{ color: it.tone === 'bad' ? C.red : it.tone === 'warn' ? C.amber : C.text4 }} />}
              <span className="flex-1 min-w-0">
                <span className="text-[12.5px]" style={{ color: isDone ? C.text4 : C.text, textDecoration: isDone ? 'line-through' : 'none' }}>{it.label}</span>
                {(it.owner || it.meta) && (
                  <span className="block text-[10.5px] mt-0.5" style={{ color: C.text4 }}>
                    {it.owner && <span>{it.owner}</span>}{it.owner && it.meta && ' · '}{it.meta && <span>{it.meta}</span>}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, tone = 'info', accent }: { label: string; value: string; sub?: string; tone?: Tone; accent: string }) {
  const col = toneColor(tone, accent)
  return (
    <div className="rounded-xl p-3.5 relative" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }} />
      <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div>
      <div className="text-xl font-bold mt-1 tnum" style={{ color: C.text }}>{value}</div>
      {sub && <div className="text-[10.5px] mt-0.5" style={{ color: C.text3 }}>{sub}</div>}
    </div>
  )
}

function Contact({ role, name, phone, note }: { role: string; name: string; phone: string; note?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold truncate" style={{ color: C.text }}>{name}</div>
        <div className="text-[10.5px]" style={{ color: C.text4 }}>{role}{note ? ` · ${note}` : ''}</div>
      </div>
      <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
        style={{ color: C.text2, backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <Phone size={11} /> {phone}
      </a>
    </div>
  )
}

function Panel({ title, icon: Icon, accent, children, right }: { title: string; icon?: React.ElementType; accent: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} style={{ color: accent }} />}
          <span className="text-sm font-bold" style={{ color: C.text }}>{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────
const RUN_OF_DAY: { t: string; label: string; detail: string; tone?: Tone }[] = [
  { t: '07:00', label: 'Ground manager on site · gates check', detail: 'Perimeter, locks, signage, weather assessment' },
  { t: '08:00', label: 'Pitch inspection — referee not required', detail: 'Surface firm, lines re-marked Fri 16:00', tone: 'good' },
  { t: '09:00', label: 'Catering & bar deliveries', detail: 'Pinkertons food order + Greene King cellar drop' },
  { t: '10:00', label: 'Stewards & safety briefing', detail: 'Boardroom · 20 stewards · SAG points covered', tone: 'warn' },
  { t: '11:00', label: 'Hospitality suite set-up', detail: '14 covers · 3-course · sponsor table plan' },
  { t: '11:30', label: 'Officials arrive', detail: 'Changing room + match-ball check + hospitality' },
  { t: '12:00', label: 'Media & broadcast set-up', detail: 'Press box, camera gantry, LED test' },
  { t: '12:30', label: 'Turnstiles & ticket office open', detail: 'Counting system live · floats issued', tone: 'warn' },
  { t: '13:00', label: 'Players arrive · team sheets exchanged', detail: 'Team sheets to officials by 13:00' },
  { t: '13:15', label: 'Warm-ups begin', detail: 'Pitch handover from grounds team' },
  { t: '14:00', label: 'KICK-OFF', detail: 'vs Greyfield Town · League One', tone: 'bad' },
  { t: '14:45', label: 'Half-time', detail: 'Concourse surge · PA sponsor reads' },
  { t: '16:00', label: 'Full-time', detail: 'Mixed zone, post-match interviews' },
  { t: '16:30', label: 'Stewarding stand-down', detail: 'Stand sweep, lost property, ejection log' },
  { t: '17:30', label: 'Cash reconciliation & debrief', detail: 'Gate report, incident log, FA result submission' },
]

const KEY_CONTACTS = [
  { role: 'Safety Officer (NVQ L4)', name: 'Derek Mason', phone: '07700 900 118', note: 'Match commander' },
  { role: 'Ground Manager', name: 'Tony Beale', phone: '07700 900 204', note: 'Pitch & facilities' },
  { role: 'Head Steward (SIA)', name: 'Karen Pryce', phone: '07700 900 337', note: '20-steward team' },
  { role: 'Police / SAG Liaison', name: 'PS Imran Khalid', phone: '07700 900 451', note: 'Category C — no police deployment' },
  { role: 'Crowd Doctor', name: 'Dr Naomi Field', phone: '07700 900 562', note: 'Pitchside + medical room' },
  { role: 'Media Officer', name: 'Holly Pearce', phone: '07700 900 673', note: 'Press & broadcast' },
  { role: 'Catering Manager', name: 'Sue Pinkerton', phone: '07700 900 784', note: 'Kiosks + hospitality' },
  { role: 'Referee', name: 'Laura Whitfield', phone: '—', note: 'League One panel' },
]

export default function FootballMatchdayOps({ accent = '#003DA5' }: { accent?: string }) {
  const [tab, setTab] = useState('overview')
  const [planOpen, setPlanOpen] = useState(false)

  const TABS = [
    { id: 'overview',    label: 'Overview',               icon: LayoutGrid },
    { id: 'safety',      label: 'Safety & Stewarding',    icon: Shield },
    { id: 'pitch',       label: 'Pitch & Facilities',     icon: MapPin },
    { id: 'catering',    label: 'Catering & Hospitality', icon: Utensils },
    { id: 'media',       label: 'Media & Broadcast',      icon: Radio },
    { id: 'programme',   label: 'Programme',              icon: BookOpen },
    { id: 'officials',   label: 'Officials',              icon: Flag },
    { id: 'ticketing',   label: 'Ticketing & Turnstiles', icon: Ticket },
    { id: 'emergency',   label: 'Emergency / EAP',        icon: HeartPulse },
    { id: 'postmatch',   label: 'Post-match',             icon: ClipboardCheck },
  ]

  // Per-area readiness (drives the overview ring + mini-cards).
  const READINESS = useMemo(() => ([
    { id: 'safety',    label: 'Safety & Stewarding',    pct: 75, tone: 'warn' as Tone },
    { id: 'pitch',     label: 'Pitch & Facilities',     pct: 86, tone: 'good' as Tone },
    { id: 'catering',  label: 'Catering & Hospitality', pct: 62, tone: 'warn' as Tone },
    { id: 'media',     label: 'Media & Broadcast',      pct: 70, tone: 'warn' as Tone },
    { id: 'officials', label: 'Officials',              pct: 100, tone: 'good' as Tone },
    { id: 'ticketing', label: 'Ticketing & Turnstiles', pct: 80, tone: 'good' as Tone },
    { id: 'emergency', label: 'Emergency / EAP',        pct: 92, tone: 'good' as Tone },
    { id: 'postmatch', label: 'Post-match',             pct: 0,  tone: 'info' as Tone },
  ]), [])
  const overall = Math.round(READINESS.filter(r => r.id !== 'postmatch').reduce((a, r) => a + r.pct, 0) / (READINESS.length - 1))

  return (
    <div style={{ color: C.text }}>
      {/* Page header */}
      <div className="flex items-center gap-2 mb-1">
        <Goalish accent={accent} />
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Matchday Operations</h1>
      </div>
      <p className="text-xs mb-5" style={{ color: C.text3 }}>
        Everything that has to be right before kick-off — one command centre. Safety, pitch, catering, media, officials, ticketing, emergency cover and the post-match wrap.
      </p>

      {/* Fixture / readiness banner */}
      <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: accent }}>Match day · EFL League One · MD-39</div>
            <div className="text-lg font-bold" style={{ color: C.text }}>Lumio Sports FC <span style={{ color: C.text3, fontWeight: 400 }}>vs</span> Greyfield Town</div>
            <div className="text-[11.5px] mt-1" style={{ color: C.text3 }}>Sat 12 Apr 2026 · KO 15:00 · Lumio Park (Home) · Forecast attendance 7,800 / 9,215</div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Overall readiness</div>
              <div className="text-3xl font-bold tnum" style={{ color: overall >= 85 ? C.green : overall >= 70 ? C.amber : C.red }}>{overall}%</div>
            </div>
            <button onClick={() => setPlanOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: accent, color: '#fff' }}>
              <Sparkles size={15} /> Generate matchday plan
            </button>
          </div>
        </div>
        {/* readiness bar */}
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.cardAlt }}>
          <div className="h-2 rounded-full" style={{ width: `${overall}%`, backgroundColor: accent }} />
        </div>
        {planOpen && (
          <div className="mt-4 rounded-xl p-4 text-[12.5px] leading-relaxed" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}40`, color: C.text2 }}>
            <div className="font-bold mb-1.5" style={{ color: C.text }}>🤖 AI matchday plan — vs Greyfield Town (demo)</div>
            Category C fixture, 7,800 expected. Priority gaps before KO: confirm the <b>ambulance booking</b> (Safety), close out the <b>concourse food order</b> and <b>hospitality menu sign-off</b> (Catering), and confirm the <b>match photographer</b> + <b>social plan</b> (Media). Stewarding is 2 short of plan — pull two from the float list. Everything else is green or on track. Suggested next action: chase St John Ambulance and Pinkertons by 12:00 Friday.
            <div className="text-[10px] mt-2" style={{ color: C.text4 }}>Demo — canned plan, no AI call made.</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => {
          const active = tab === t.id
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-semibold whitespace-nowrap"
              style={{ color: active ? C.text : C.text3, borderBottom: `2px solid ${active ? accent : 'transparent'}`, marginBottom: -1 }}>
              <Icon size={13} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab accent={accent} readiness={READINESS} onJump={setTab} />}
      {tab === 'safety'    && <SafetyTab accent={accent} />}
      {tab === 'pitch'     && <PitchTab accent={accent} />}
      {tab === 'catering'  && <CateringTab accent={accent} />}
      {tab === 'media'     && <MediaTab accent={accent} />}
      {tab === 'programme'  && <FootballMatchdayProgramme accent={accent} />}
      {tab === 'officials' && <OfficialsTab accent={accent} />}
      {tab === 'ticketing' && <TicketingTab accent={accent} />}
      {tab === 'emergency' && <EmergencyTab accent={accent} />}
      {tab === 'postmatch' && <PostMatchTab accent={accent} />}
    </div>
  )
}

function Goalish({ accent }: { accent: string }) {
  return <span style={{ color: accent, display: 'inline-flex' }}><Flag size={20} /></span>
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────
function OverviewTab({ accent, readiness, onJump }: { accent: string; readiness: { id: string; label: string; pct: number; tone: Tone }[]; onJump: (t: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Expected attendance" value="7,800" sub="85% of 9,215 capacity" tone="info" />
        <StatTile accent={accent} label="Stewards confirmed" value="18 / 20" sub="2 from float list to fill" tone="warn" />
        <StatTile accent={accent} label="Hospitality covers" value="14 / 20" sub="12 sponsors · 2 board" tone="warn" />
        <StatTile accent={accent} label="Weather" value="13° cloud" sub="9 mph SW · low risk" tone="good" />
      </div>

      {/* readiness by area */}
      <Panel title="Readiness by area" icon={LayoutGrid} accent={accent} right={<span className="text-[11px]" style={{ color: C.text4 }}>click an area to open</span>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {readiness.map(r => (
            <button key={r.id} onClick={() => onJump(r.id)} className="rounded-xl p-3 text-left transition-colors hover:bg-white/[0.03]"
              style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium truncate" style={{ color: C.text2 }}>{r.label}</span>
                <ChevronRight size={13} style={{ color: C.text4 }} />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold tnum" style={{ color: toneColor(r.tone, accent) }}>{r.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.card }}>
                <div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: toneColor(r.tone, accent) }} />
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* run of day */}
        <div className="lg:col-span-2">
          <Panel title="Run of day" icon={Clock} accent={accent} right={<span className="text-[11px]" style={{ color: C.text4 }}>Sat 03 May</span>}>
            <div className="relative">
              <div className="absolute top-1 bottom-1 w-px" style={{ left: 52, backgroundColor: C.border }} />
              {RUN_OF_DAY.map((r, i) => (
                <div key={i} className="relative flex gap-4 py-2">
                  <div className="w-12 flex-shrink-0 text-[11px] font-mono tnum pt-0.5" style={{ color: r.tone === 'bad' ? accent : C.text3 }}>{r.t}</div>
                  <div className="absolute w-2 h-2 rounded-full" style={{ left: 48, top: 9, backgroundColor: r.tone ? toneColor(r.tone, accent) : C.borderHi, border: `2px solid ${C.card}` }} />
                  <div className="flex-1 pl-3">
                    <div className="text-[12.5px] font-medium" style={{ color: C.text, fontWeight: r.tone === 'bad' ? 700 : 500 }}>{r.label}</div>
                    <div className="text-[10.5px]" style={{ color: C.text4 }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* key contacts + critical */}
        <div className="space-y-5">
          <Panel title="Critical — outstanding" icon={AlertTriangle} accent={accent}>
            <div className="flex flex-col gap-2">
              {[
                { l: 'Ambulance / paramedic cover not confirmed', t: 'bad' as Tone },
                { l: 'Concourse food order not placed (Pinkertons)', t: 'bad' as Tone },
                { l: 'Hospitality menu — dietary notes outstanding', t: 'warn' as Tone },
                { l: 'Match photographer unconfirmed', t: 'warn' as Tone },
                { l: 'Stewarding 2 short of plan', t: 'warn' as Tone },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: C.text2 }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: x.t === 'bad' ? C.red : C.amber }} />
                  <span>{x.l}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Key contacts" icon={Phone} accent={accent}>
            <div className="flex flex-col gap-2">
              {KEY_CONTACTS.slice(0, 5).map((c, i) => <Contact key={i} {...c} />)}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ─── SAFETY & STEWARDING ─────────────────────────────────────────────────
function SafetyTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Safety certificate" value="9,215" sub="General safety cert · valid" tone="good" />
        <StatTile accent={accent} label="Stewards required" value="20" sub="18 confirmed · 2 TBC" tone="warn" />
        <StatTile accent={accent} label="Category" value="C" sub="No police deployment" tone="good" />
        <StatTile accent={accent} label="Last SAG meeting" value="14 Apr" sub="No conditions outstanding" tone="good" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Stewarding plan" icon={Users} items={[
          { id: 's1', label: 'Stewards confirmed — 18 of 20', done: true, owner: 'Karen Pryce', meta: '2 TBC from float list', tone: 'warn' },
          { id: 's2', label: 'Turnstile stewards (×4) briefed', done: true },
          { id: 's3', label: 'Stand & gangway stewards (×8)', done: true },
          { id: 's4', label: 'Pitchside / technical area stewards (×4)', done: true },
          { id: 's5', label: 'Segregation / away end (×2)', meta: 'Greyfield ~120 travelling' },
          { id: 's6', label: 'Response / float stewards (×2)' },
          { id: 's7', label: 'All SIA badges checked & logged', done: true },
          { id: 's8', label: 'Safety officer briefing — 10:00 boardroom', tone: 'warn' },
        ]} />
        <Checklist accent={accent} title="Safety systems" icon={Shield} items={[
          { id: 'sy1', label: 'Radios issued & channel test (×24)', done: true, owner: 'Control room' },
          { id: 'sy2', label: 'CCTV control room manned', done: true },
          { id: 'sy3', label: 'Counting / occupancy system live', meta: 'Turnstile clickers + manual backup' },
          { id: 'sy4', label: 'PA system tested', done: true },
          { id: 'sy5', label: 'Ejection & re-admission policy briefed', done: true },
          { id: 'sy6', label: 'Lost / found child procedure briefed', done: true },
          { id: 'sy7', label: 'Pyrotechnics / banned items search plan' },
          { id: 'sy8', label: 'Adverse weather contingency reviewed', done: true, tone: 'good' },
        ]} />
      </div>
      <Panel title="Safety contacts" icon={Phone} accent={accent}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Contact role="Safety Officer (NVQ L4)" name="Derek Mason" phone="07700 900 118" note="Match commander" />
          <Contact role="Head Steward (SIA)" name="Karen Pryce" phone="07700 900 337" />
          <Contact role="Police / SAG Liaison" name="PS Imran Khalid" phone="07700 900 451" />
          <Contact role="Control Room" name="CCTV / Comms" phone="Ext 200" />
        </div>
      </Panel>
    </div>
  )
}

// ─── PITCH & FACILITIES ──────────────────────────────────────────────────
function PitchTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Pitch status" value="Firm" sub="Inspection passed Fri 16:00" tone="good" />
        <StatTile accent={accent} label="Floodlights" value="N/A" sub="14:00 KO — daylight" tone="good" />
        <StatTile accent={accent} label="Changing rooms" value="3 ready" sub="Home · away · officials" tone="good" />
        <StatTile accent={accent} label="Accessibility" value="12 bays" sub="Wheelchair + ambulant" tone="good" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Pitch & playing area" icon={MapPin} items={[
          { id: 'p1', label: 'Pitch inspection — Fri 16:00', done: true, owner: 'Tony Beale' },
          { id: 'p2', label: 'Lines re-marked', done: true },
          { id: 'p3', label: 'Goals, nets & pegs secured', done: true },
          { id: 'p4', label: 'Corner flags & assistant flags', done: true },
          { id: 'p5', label: 'Technical areas & dugouts prepared' },
          { id: 'p6', label: 'Match balls — 6 checked & inflated' },
          { id: 'p7', label: 'Warm-up area / mannequins laid out' },
          { id: 'p8', label: 'Substitute boards & water bottles' },
        ]} />
        <Checklist accent={accent} title="Facilities & stadium" icon={Shield} items={[
          { id: 'f1', label: 'Home changing room prepared', done: true },
          { id: 'f2', label: 'Away changing room prepared', done: true },
          { id: 'f3', label: 'Officials changing room prepared', done: true },
          { id: 'f4', label: 'Toilets cleaned & stocked (all stands)', done: true },
          { id: 'f5', label: 'Accessible viewing platform checked', done: true },
          { id: 'f6', label: 'Car parking & signage in place' },
          { id: 'f7', label: 'Concourse & turnstile cleaning', done: true },
          { id: 'f8', label: 'Heating / power / water checks', done: true },
        ]} />
      </div>
    </div>
  )
}

// ─── CATERING & HOSPITALITY ──────────────────────────────────────────────
function CateringTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Concourse kiosks" value="4 open" sub="2 staff each · 8 total" tone="good" />
        <StatTile accent={accent} label="Hospitality covers" value="14 / 20" sub="12 sponsors · 2 board" tone="warn" />
        <StatTile accent={accent} label="Matchday F&B revenue" value="£6,800" sub="Forecast at 7,800 gate" tone="info" />
        <StatTile accent={accent} label="Allergen matrix" value="Filed" sub="14 allergens · Natasha's Law" tone="good" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Concourse & kiosks" icon={Utensils} items={[
          { id: 'c1', label: 'Matchday food order — Pinkertons', meta: 'Burgers, hot dogs, pies', tone: 'bad' },
          { id: 'c2', label: 'Bar stock checked — beer, soft, hot drinks', done: true, owner: 'Greene King' },
          { id: 'c3', label: 'Kiosk staff confirmed (×8)', done: true },
          { id: 'c4', label: 'Card readers & floats issued' },
          { id: 'c5', label: 'Allergen / Natasha\'s Law labelling', done: true },
          { id: 'c6', label: 'Matchday programme — 500 printed', done: true },
          { id: 'c7', label: 'Waste & recycling plan' },
        ]} />
        <Checklist accent={accent} title="Hospitality suite" icon={Users} items={[
          { id: 'h1', label: 'Hospitality suite — 14 of 20 confirmed', done: true, meta: '12 sponsors · 2 board', tone: 'warn' },
          { id: 'h2', label: 'Hospitality menu — 3-course sign-off', tone: 'warn' },
          { id: 'h3', label: 'Dietary requirements collected' },
          { id: 'h4', label: 'Table plan & place cards' },
          { id: 'h5', label: 'Sponsor welcome packs & gifts' },
          { id: 'h6', label: 'Suite staff & host briefed', done: true },
          { id: 'h7', label: 'Pitch-view balcony access checked', done: true },
        ]} />
      </div>
    </div>
  )
}

// ─── MEDIA & BROADCAST ───────────────────────────────────────────────────
function MediaTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Broadcast" value="Stream" sub="Club YouTube + WSL app" tone="good" />
        <StatTile accent={accent} label="Press passes" value="4 issued" sub="Northbridge + 3 locals" tone="good" />
        <StatTile accent={accent} label="Photographer" value="TBC" sub="Awaiting confirmation" tone="warn" />
        <StatTile accent={accent} label="Social posts" value="6 planned" sub="Pre / during / post" tone="warn" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Press & broadcast" icon={Radio} items={[
          { id: 'm1', label: 'Press passes issued — 4', done: true, owner: 'Holly Pearce' },
          { id: 'm2', label: 'Camera gantry / position confirmed', done: true },
          { id: 'm3', label: 'Live stream test — YouTube + WSL app', done: true },
          { id: 'm4', label: 'Press box wifi & power checked', done: true },
          { id: 'm5', label: 'Photographer confirmed', tone: 'warn' },
          { id: 'm6', label: 'Mixed zone & interview area set up', done: true },
          { id: 'm7', label: 'Post-match presser room ready' },
        ]} />
        <Checklist accent={accent} title="In-stadium & social" icon={Megaphone} items={[
          { id: 'sm1', label: 'PA announcer scripts & sponsor reads', done: true },
          { id: 'sm2', label: 'LED / big-screen content loaded', done: true },
          { id: 'sm3', label: 'Team news graphic — pre-match', tone: 'warn' },
          { id: 'sm4', label: 'Live match updates plan (X / Insta)', tone: 'warn' },
          { id: 'sm5', label: 'Goal / highlight clipping workflow' },
          { id: 'sm6', label: 'Full-time result + report scheduled' },
          { id: 'sm7', label: 'Sponsor tags & rights respected', done: true },
        ]} />
      </div>
    </div>
  )
}

// ─── OFFICIALS ───────────────────────────────────────────────────────────
function OfficialsTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Officials" value="4 / 4" sub="Ref + 2 AR + 4th" tone="good" />
        <StatTile accent={accent} label="Match fees" value="£225" sub="Petty cash ready" tone="good" />
        <StatTile accent={accent} label="Team sheets" value="13:00" sub="Exchange deadline" tone="good" />
        <StatTile accent={accent} label="Arrival" value="11:30" sub="Hospitality + parking" tone="good" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Officials checklist" icon={Flag} items={[
          { id: 'o1', label: 'Referee confirmed — L. Whitfield', done: true },
          { id: 'o2', label: 'Assistant referees ×2 confirmed', done: true },
          { id: 'o3', label: 'Fourth official confirmed', done: true },
          { id: 'o4', label: 'Match fees — £225 petty cash', done: true },
          { id: 'o5', label: 'Officials changing room prepared', done: true },
          { id: 'o6', label: 'Reserved parking allocated', done: true },
          { id: 'o7', label: 'Pre-match meal / hospitality', done: true },
          { id: 'o8', label: 'Team sheets exchanged by 13:00', done: true },
        ]} />
        <Panel title="Officials — appointed" icon={Users} accent={accent}>
          <div className="flex flex-col gap-2">
            <Contact role="Referee · League One panel" name="Laura Whitfield" phone="—" />
            <Contact role="Assistant Referee 1" name="Megan Doyle" phone="—" />
            <Contact role="Assistant Referee 2" name="Sophie Adeyemi" phone="—" />
            <Contact role="Fourth Official" name="Rachel Quinn" phone="—" />
          </div>
          <div className="mt-3 text-[11px] rounded-lg p-3" style={{ backgroundColor: C.cardAlt, color: C.text3 }}>
            Captain&apos;s meeting 13:40 · match ball + spares to 4th official · anti-doping suite available if selected.
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ─── TICKETING & TURNSTILES ──────────────────────────────────────────────
function TicketingTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Advance sales" value="3,100" sub="Incl. 1,850 season tickets" tone="good" />
        <StatTile accent={accent} label="Forecast gate" value="7,800" sub="~1,100 on the day" tone="info" />
        <StatTile accent={accent} label="Away allocation" value="300" sub="~120 sold to Greyfield" tone="good" />
        <StatTile accent={accent} label="Turnstiles" value="6 live" sub="2 card-only · 4 mixed" tone="good" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Ticket office & sales" icon={Ticket} items={[
          { id: 't1', label: 'Ticket office opens 12:30', done: true },
          { id: 't2', label: 'Card readers & cash floats issued' },
          { id: 't3', label: 'Comp / guest list reconciled', meta: 'Sponsors + player guests' },
          { id: 't4', label: 'Accessible / carer tickets allocated', done: true },
          { id: 't5', label: 'Away allocation & segregation set', done: true },
          { id: 't6', label: 'Season-ticket scanning live', done: true },
        ]} />
        <Checklist accent={accent} title="Turnstiles & counting" icon={Users} items={[
          { id: 'tt1', label: 'Turnstiles open 12:30 (T-1:30)', done: true },
          { id: 'tt2', label: 'Counting clickers + manual backup' },
          { id: 'tt3', label: 'Turnstile operators briefed (×6)', done: true },
          { id: 'tt4', label: 'Occupancy capped at 9,215', done: true, tone: 'good' },
          { id: 'tt5', label: 'Half-time gate-open (free entry) plan' },
          { id: 'tt6', label: 'Live attendance to control room' },
        ]} />
      </div>
    </div>
  )
}

// ─── EMERGENCY / EAP ─────────────────────────────────────────────────────
function EmergencyTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: `${C.red}12`, border: `1px solid ${C.red}40` }}>
        <AlertTriangle size={18} style={{ color: C.red }} className="flex-shrink-0 mt-0.5" />
        <div className="text-[12.5px]" style={{ color: C.text2 }}>
          <b style={{ color: C.text }}>Ambulance cover not yet confirmed.</b> A home fixture cannot proceed without agreed medical provision — chase St John Ambulance and confirm pitchside paramedic before gates open.
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile accent={accent} label="Ambulance" value="TBC" sub="St John — chasing" tone="bad" />
        <StatTile accent={accent} label="Defibrillators" value="3 on site" sub="Tunnel · main stand · gym" tone="good" />
        <StatTile accent={accent} label="First aiders" value="6" sub="2 pitchside · 4 stands" tone="good" />
        <StatTile accent={accent} label="Nearest A&E" value="6.2 mi" sub="St Catherine's Hospital" tone="info" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Emergency Action Plan (EAP)" icon={HeartPulse} items={[
          { id: 'e1', label: 'Ambulance / paramedic confirmed', tone: 'bad' },
          { id: 'e2', label: 'Crowd doctor on site — Dr N. Field', done: true },
          { id: 'e3', label: 'Medical room stocked & checked', done: true },
          { id: 'e4', label: 'Pitchside trauma bag + spinal board', done: true },
          { id: 'e5', label: 'Defibrillators checked (×3)', done: true },
          { id: 'e6', label: 'First aiders briefed & positioned', done: true },
          { id: 'e7', label: 'EAP briefed to all stewards', done: true },
          { id: 'e8', label: 'Ambulance access route kept clear' },
        ]} />
        <Checklist accent={accent} title="Evacuation & major incident" icon={Shield} items={[
          { id: 'ev1', label: 'Evacuation routes & exits unobstructed', done: true },
          { id: 'ev2', label: 'Assembly points signed & briefed', done: true },
          { id: 'ev3', label: 'Fire points / extinguishers checked', done: true },
          { id: 'ev4', label: 'Emergency PA scripts to control room', done: true },
          { id: 'ev5', label: 'Major incident / bomb threat plan' },
          { id: 'ev6', label: 'Emergency services contact list posted', done: true },
        ]} />
      </div>
      <Panel title="Emergency contacts" icon={Phone} accent={accent}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Contact role="Crowd Doctor" name="Dr Naomi Field" phone="07700 900 562" note="Pitchside" />
          <Contact role="Safety Officer" name="Derek Mason" phone="07700 900 118" note="Incident command" />
          <Contact role="St John Ambulance" name="Regional booking" phone="0344 770 4800" note="Chasing" />
          <Contact role="Nearest A&E" name="St Catherine's Hospital" phone="999 / 6.2 mi" />
        </div>
      </Panel>
    </div>
  )
}

// ─── POST-MATCH ──────────────────────────────────────────────────────────
function PostMatchTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-5">
      <p className="text-xs" style={{ color: C.text3 }}>Activated at full-time — the wrap that protects the club and feeds Monday&apos;s review.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Checklist accent={accent} title="Stand-down & security" icon={Shield} items={[
          { id: 'pm1', label: 'Stewarding stand-down & sweep' },
          { id: 'pm2', label: 'Stand & concourse litter pick' },
          { id: 'pm3', label: 'Lost property logged & stored' },
          { id: 'pm4', label: 'Ejection / incident log completed' },
          { id: 'pm5', label: 'Building secured & alarmed' },
          { id: 'pm6', label: 'Floodlight / power down (if used)' },
        ]} />
        <Checklist accent={accent} title="Reporting & finance" icon={ClipboardCheck} items={[
          { id: 'pr1', label: 'Cash reconciliation — gate + F&B' },
          { id: 'pr2', label: 'Attendance / gate report filed' },
          { id: 'pr3', label: 'Result submitted to FA / league' },
          { id: 'pr4', label: 'Officials marks submitted' },
          { id: 'pr5', label: 'Hospitality breakdown to commercial' },
          { id: 'pr6', label: 'Match report + social wrap published' },
          { id: 'pr7', label: 'Pitch divot repair / aftercare booked' },
          { id: 'pr8', label: 'Ops debrief — actions for next home game' },
        ]} />
      </div>
    </div>
  )
}
