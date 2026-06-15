'use client'

import { useState, type ReactNode } from 'react'
import { Plane, Calendar, Globe2, Truck, Briefcase, Users, Plus, ChevronRight, History, MapPin, PoundSterling } from 'lucide-react'
import WomensTripBuilder, { type Trip, fmtGBP, tripCost } from './WomensTripBuilder'
import WomensTripDetail from './WomensTripDetail'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
}

type Tab = 'preseason' | 'midseason' | 'tours' | 'logistics' | 'commercial' | 'squad'
const statusColor = (s: string) => s === 'Active' ? C.good : s === 'Planned' ? C.warn : s === 'Completed' ? C.text3 : C.text4

// ─── Seed data (rich) ────────────────────────────────────────────────────
const UPCOMING_CAMPS: Trip[] = [
  {
    id: 'c1', kind: 'camp', name: 'Lionesses Sep international break', dates: '23 Sep – 06 Oct', location: 'Hartfield (training base)',
    status: 'Planned', squad: '20 (4 with Lionesses)', focus: 'Maintenance + injury recovery for non-internationals · academy minutes',
    summary: 'A maintenance and development block during the September window. Non-internationals hold fitness and sharpen patterns while four players are released to the Lionesses; academy players integrate for first-team minutes.',
    objectives: ['Maintain match fitness for non-internationals', 'Cycle-aware load management', 'Integrate 4 academy players', 'ACL screening + RTP progressions'],
    itinerary: [
      { day: 'Week 1', am: 'Testing & screening', pm: 'Possession + pressing', eve: 'Welfare check-ins' },
      { day: 'Week 2', am: 'Set-piece block', pm: 'In-house friendly', eve: 'Analysis review' },
    ],
    logistics: { travel: 'No travel — home base', accommodation: 'Players resident · staff on site', transport: 'Club minibus for recovery sessions', insurance: 'Standard squad cover' },
    budget: [{ line: 'Pitch & facility hire', amount: 8200 }, { line: 'Catering & nutrition', amount: 6400 }, { line: 'Sports science / screening', amount: 5600 }, { line: 'Recovery', amount: 2600 }, { line: 'Contingency', amount: 2000 }],
    commercial: ['Apex Performance — recovery science content day'], medical: ['Cycle phase mapped — loads individualised', '2 maternity-return players Phase 2 RTP', 'ACL screening for previous-injury group'],
    staff: ['Head Coach', 'Head of Performance', 'Club Doctor', 'Physio ×2', 'Welfare Lead'],
  },
  {
    id: 'c2', kind: 'camp', name: 'Champions League window', dates: '04–18 Nov', location: 'Hartfield + away fixture support',
    status: 'Planned', squad: 'Full + 2 academy', focus: 'Continental travel prep · sleep / jet-lag protocols',
    summary: 'Preparation block around the continental fixture window — travel recovery, sleep and nutrition protocols, plus tactical work for European opposition.',
    objectives: ['Embed travel-recovery & sleep protocols', 'Tactical prep for continental opposition', 'Rotation planning across a congested block'],
    itinerary: [{ day: 'Block 1', am: 'Travel-recovery education', pm: 'Tactical units', eve: 'Sleep workshop' }],
    logistics: { travel: 'Scheduled flights for away leg', accommodation: 'Team hotel (away leg)', transport: 'Coach transfers', insurance: 'European travel cover' },
    budget: [{ line: 'Flights', amount: 18400 }, { line: 'Hotels', amount: 9600 }, { line: 'Catering / per diem', amount: 5400 }, { line: 'Ground transport', amount: 3000 }],
    commercial: ['Crown Broadcasting — European matchday content'], medical: ['Jet-lag / sleep protocols', 'Hydration on travel days', 'Cycle-aware rotation'],
    staff: ['Head Coach', 'Analyst', 'Club Doctor', 'Physio', 'Kit Manager'],
  },
  {
    id: 'c3', kind: 'camp', name: 'Lionesses spring camp', dates: '17 Feb – 03 Mar', location: 'Hartfield',
    status: 'Planned', squad: '22 (2 with Lionesses)', focus: 'Phased load · cycle-aware training · ACL screening',
    summary: 'A mid-season phased-load block to refresh the squad and run the spring ACL screening cycle, with cycle-aware individualised plans.',
    objectives: ['Phased load to manage a long season', 'Spring ACL screening', 'Individual development plans review'],
    itinerary: [{ day: 'Week 1', am: 'Phased load', pm: 'Individual dev', eve: 'Recovery' }],
    logistics: { travel: 'No travel', accommodation: 'On site', transport: 'N/A', insurance: 'Standard cover' },
    budget: [{ line: 'Facility hire', amount: 6800 }, { line: 'Screening', amount: 5200 }, { line: 'Catering', amount: 4200 }, { line: 'Contingency', amount: 2000 }],
    commercial: [], medical: ['ACL screening — full squad', 'Cycle-aware load', 'RTP progression group'],
    staff: ['Head of Performance', 'Club Doctor', 'Physio ×2'],
  },
  {
    id: 'c4', kind: 'camp', name: 'WSL Cup competition window', dates: '08–22 Apr', location: 'Hartfield + cup-fixture support',
    status: 'Planned', squad: 'Full + 4 academy', focus: 'Cup rotation · academy first-team minutes',
    summary: 'Cup-window block focused on rotation and giving academy players competitive first-team minutes while protecting key players.',
    objectives: ['Rotation to protect key players', 'Academy first-team minutes', 'Cup-specific set-piece work'],
    itinerary: [{ day: 'Block', am: 'Rotation prep', pm: 'Set-pieces', eve: 'Analysis' }],
    logistics: { travel: 'Local — cup venues', accommodation: 'Home', transport: 'Coach to away cup ties', insurance: 'Standard cover' },
    budget: [{ line: 'Facility hire', amount: 5800 }, { line: 'Travel (cup ties)', amount: 4200 }, { line: 'Catering', amount: 2600 }, { line: 'Contingency', amount: 2000 }],
    commercial: ['Academy pathway social series'], medical: ['Load monitoring across congested block', 'Cycle-aware rotation'],
    staff: ['Head Coach', 'Academy Lead', 'Physio'],
  },
]

const UPCOMING_TOURS: Trip[] = [
  {
    id: 't1', kind: 'tour', name: 'Pre-season Spain camp + friendly', dates: 'Aug 2026', location: 'Marbella, Spain',
    status: 'Active', squad: '22 (incl. 4 academy + maternity-return planning)', focus: 'Warm-weather base · kit launch · 2 friendlies',
    summary: 'A warm-weather pre-season base in Marbella tied to the season kit launch, with two friendlies and a full sponsor activation programme.',
    objectives: ['Build the aerobic base in heat', 'Two friendlies — full-squad minutes', 'Kit launch activation', 'Integrate new signings'],
    itinerary: [
      { day: 'Day 1', am: 'Travel to Marbella', pm: 'Settle + light walk', eve: 'Team dinner' },
      { day: 'Day 2', am: 'Aerobic base', pm: 'Recovery + pool', eve: 'Sponsor welcome (Vanta)' },
      { day: 'Day 5', am: 'Friendly prep', pm: 'Friendly #1', eve: 'Recovery' },
    ],
    logistics: { travel: 'Scheduled flights (Westmoor Sports Travel) · EU — no visa', accommodation: 'Marbella Beach Resort — 26 rooms, 10 nights · childcare-friendly suites', transport: 'Contracted local coach', insurance: 'Tour insurance + repatriation' },
    budget: [{ line: 'Flights', amount: 32400 }, { line: 'Hotels', amount: 38800 }, { line: 'Ground transport', amount: 8200 }, { line: 'Catering / per diem', amount: 12600 }, { line: 'Friendlies / facility', amount: 6400 }, { line: 'Family travel / childcare', amount: 3200 }],
    commercial: ['Vanta Sports — kit launch tied to opening fixture', 'Meridian Watches — hospitality activation in Marbella'], medical: ['Heat & hydration plan', 'Maternity-return player — modified travel + load', 'Cycle-aware load across the tour'],
    staff: ['Head Coach', 'Assistant Coach', 'Head of Performance', 'Club Doctor', 'Physio ×2', 'Analyst', 'Kit Manager', 'Media Officer'],
  },
  {
    id: 't2', kind: 'tour', name: 'USA pre-season tour + invitational', dates: 'Jul 2026', location: 'USA (East Coast)',
    status: 'Planned', squad: '24 + 2 dual-reg', focus: 'Invitational tournament · brand-storytelling · content',
    summary: 'A content-heavy invitational tour on the US East Coast with the principal betting-content partner, balancing competitive minutes with a strong commercial and fan-growth agenda.',
    objectives: ['Compete in the invitational', 'Brand-storytelling content for the season', 'Grow the US fan base', 'Manage long-haul travel recovery'],
    itinerary: [{ day: 'Days 1-2', am: 'Travel + adapt', pm: 'Light sessions', eve: 'Content day' }, { day: 'Days 3-6', am: 'Tournament', pm: 'Recovery', eve: 'Sponsor events' }],
    logistics: { travel: 'Long-haul flights · ESTAs in flight', accommodation: 'Tournament partner hotels', transport: 'Tournament shuttle + private coach', insurance: 'Tour insurance + repatriation + US medical cover' },
    budget: [{ line: 'Flights (long-haul)', amount: 64800 }, { line: 'Hotels', amount: 42400 }, { line: 'Ground transport', amount: 12200 }, { line: 'US medical cover', amount: 9800 }, { line: 'Per diem', amount: 16400 }, { line: 'Content production', amount: 11000 }],
    commercial: ['Crown Wagers — 2 brand video days + family-day content (brief in draft)', 'Apex Performance — injury research Q&A'], medical: ['Long-haul jet-lag protocol (−5h)', 'Hydration & sleep on travel days', 'Dual-reg fixture liaison with loan clubs'],
    staff: ['Head Coach', 'Head of Performance', 'Club Doctor', 'Physio ×2', 'Analyst', 'Media Officer', 'Commercial Lead'],
  },
  {
    id: 't3', kind: 'tour', name: 'Mid-season Asia branding tour', dates: 'Jan 2027', location: 'Asia (TBC)',
    status: 'Negotiating', squad: 'TBC', focus: 'Brand-building · partner market entry',
    summary: 'An exploratory mid-season branding tour into a key Asian growth market, dependent on squad availability and fixture-calendar clearance.',
    objectives: ['Enter a priority growth market', 'Partner & broadcast relationships', 'Assess feasibility vs fixture calendar'],
    itinerary: [],
    logistics: { travel: 'Long-haul · visas pending squad lock', accommodation: 'TBC', transport: 'TBC', insurance: 'TBC' },
    budget: [{ line: 'Indicative travel', amount: 70000 }, { line: 'Indicative accommodation', amount: 40000 }],
    commercial: ['Market-entry partner — terms in negotiation'], medical: ['Feasibility vs cycle / congested calendar under review'],
    staff: ['Commercial Director', 'Head Coach (TBC)'],
  },
]

const PAST_CAMPS: Trip[] = [
  { id: 'pc1', kind: 'camp', name: 'Summer base camp 2025', dates: 'Jul 2025', location: 'Hartfield', status: 'Completed', squad: 'Full + 6 academy', focus: 'Pre-season aerobic base', summary: 'Three-week pre-season base at Hartfield building the aerobic platform for the 25/26 season.', objectives: ['Aerobic base', 'Integrate signings'], itinerary: [], logistics: { travel: 'Home', accommodation: 'On site', transport: 'N/A', insurance: 'Standard' }, budget: [{ line: 'Facility hire', amount: 9200 }, { line: 'Catering', amount: 6800 }, { line: 'Sports science', amount: 5400 }], commercial: [], medical: ['ACL screening completed'], staff: ['Head Coach', 'Head of Performance'], past: true, outcome: 'Squad hit aerobic targets; zero soft-tissue injuries in the block. Two academy players earned first-team squad places.' },
  { id: 'pc2', kind: 'camp', name: 'Feb international break 2025', dates: 'Feb 2025', location: 'Hartfield', status: 'Completed', squad: '21 (3 with Lionesses)', focus: 'Phased load + screening', summary: 'Mid-season refresh during the February window.', objectives: ['Phased load', 'Screening'], itinerary: [], logistics: { travel: 'Home', accommodation: 'On site', transport: 'N/A', insurance: 'Standard' }, budget: [{ line: 'Facility hire', amount: 6400 }, { line: 'Screening', amount: 4800 }], commercial: [], medical: ['Spring ACL screening'], staff: ['Club Doctor', 'Physio'], past: true, outcome: 'Form improved post-camp (4 wins in 5). Screening flagged one player for a modified-load plan that prevented a recurrence.' },
]

const PAST_TOURS: Trip[] = [
  { id: 'pt1', kind: 'tour', name: 'Portugal pre-season tour 2025', dates: 'Aug 2025', location: 'Faro, Portugal', status: 'Completed', squad: '23', focus: 'Warm-weather base + 2 friendlies', summary: 'A 10-day warm-weather base in Faro with two friendlies and a kit-launch activation.', objectives: ['Aerobic base', 'Friendlies', 'Kit launch'], itinerary: [], logistics: { travel: 'Flights (Westmoor)', accommodation: 'Faro Beach Resort', transport: 'Local coach', insurance: 'Tour + repatriation' }, budget: [{ line: 'Flights', amount: 31200 }, { line: 'Hotels', amount: 36800 }, { line: 'Catering', amount: 12200 }], commercial: ['Vanta — kit launch'], medical: ['Heat adaptation', 'Maternity-return modified load'], staff: ['Head Coach', 'Performance', 'Doctor', 'Physio'], past: true, outcome: 'Won both friendlies (2-0, 3-1). Kit launch reel hit 240k views — best-performing club content of 2025. No injuries.' },
  { id: 'pt2', kind: 'tour', name: 'Netherlands invitational 2024', dates: 'Jul 2024', location: 'Eindhoven, NL', status: 'Completed', squad: '22', focus: '4-team invitational', summary: 'A four-team invitational tournament in Eindhoven.', objectives: ['Competitive minutes', 'European exposure'], itinerary: [], logistics: { travel: 'Flights', accommodation: 'Tournament hotel', transport: 'Shuttle', insurance: 'Tour cover' }, budget: [{ line: 'Flights', amount: 24600 }, { line: 'Hotels', amount: 21200 }], commercial: ['Meridian — hospitality'], medical: ['Travel recovery'], staff: ['Head Coach', 'Physio'], past: true, outcome: 'Runners-up; valuable minutes for returning-from-injury players. Strong groundwork for the continental window.' },
]

const PAST_PRESEASONS: Trip[] = [PAST_TOURS[0], PAST_CAMPS[0]]

const LOGISTICS_BUDGET = [
  { line: 'Flights', amount: '£72,400', pct: 36 }, { line: 'Hotels', amount: '£54,800', pct: 27 },
  { line: 'Ground transport', amount: '£14,200', pct: 7 }, { line: 'Kit + equipment freight', amount: '£11,400', pct: 6 },
  { line: 'Catering', amount: '£18,200', pct: 9 }, { line: 'Insurance + repatriation', amount: '£12,400', pct: 6 },
  { line: 'Per diem', amount: '£14,600', pct: 7 }, { line: 'Childcare / family travel', amount: '£3,200', pct: 2 },
]
const COMMERCIAL_OBLIGATIONS = [
  { sponsor: 'Vanta Sports', trip: 'Spain pre-season', obligation: 'Kit launch event + 4 player content posts', status: 'On track', deadline: '12 Aug' },
  { sponsor: 'Crown Wagers', trip: 'USA tour', obligation: '2 brand video days + lifestyle/family-day content', status: 'Brief in draft', deadline: '04 Jul' },
  { sponsor: 'Meridian Watches', trip: 'Spain pre-season', obligation: 'Hospitality activation in Marbella', status: 'Confirmed', deadline: '15 Aug' },
  { sponsor: 'Apex Performance', trip: 'USA tour', obligation: 'Medical kit launch + Q&A on injury research', status: 'Pending', deadline: '02 Jul' },
]
const SQUAD_AVAILABILITY = [
  { player: 'Emily Zhang', role: 'Centre back', conflicts: 'Lionesses friendly window', tour: 'Spain', status: 'Released to Lionesses' },
  { player: 'Lucy Whitmore', role: 'Midfielder', conflicts: 'Cycle phase 3 — load adjustment', tour: 'USA', status: 'Modified load' },
  { player: 'Ava Mitchell', role: 'Forward', conflicts: 'Maternity return — Phase 2 RTP', tour: '—', status: 'Rehab — not travelling' },
  { player: 'Freya Johansson', role: 'Centre mid', conflicts: 'None', tour: 'Spain', status: 'Available' },
  { player: 'Amara Diallo', role: 'Forward', conflicts: 'Dual-reg fixture clash (loan club)', tour: 'USA', status: 'Liaison required' },
  { player: 'Niamh Gallagher', role: 'CB', conflicts: 'ACL screening due', tour: 'Spain', status: 'Screened — cleared' },
]

interface Props { preSeasonContent?: ReactNode; defaultTab?: Tab }

export default function WomensToursAndCampsView({ preSeasonContent, defaultTab = 'preseason' }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [camps, setCamps] = useState<Trip[]>(UPCOMING_CAMPS)
  const [tours, setTours] = useState<Trip[]>(UPCOMING_TOURS)
  const [builder, setBuilder] = useState<null | 'camp' | 'tour'>(null)
  const [detail, setDetail] = useState<Trip | null>(null)

  const campsTotal = camps.reduce((s, c) => s + tripCost(c), 0)

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'preseason', label: 'Pre-Season', icon: Calendar },
    { id: 'midseason', label: 'Mid-Season Camps', icon: Globe2 },
    { id: 'tours', label: 'Tours', icon: Plane },
    { id: 'logistics', label: 'Logistics & Costs', icon: Truck },
    { id: 'commercial', label: 'Commercial Activation', icon: Briefcase },
    { id: 'squad', label: 'Squad Planning', icon: Users },
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
              style={{ appearance: 'none', border: 0, background: 'transparent', padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? '#fff' : C.text3, borderBottom: `2px solid ${active ? C.accent : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'color .12s, border-color .12s' }}>
              <TabIcon size={13} strokeWidth={1.75} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'preseason' && (
          <div className="space-y-5">
            {preSeasonContent ?? <div className="rounded-xl p-6 text-center" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>Pre-season content not wired.</div>}
            <HistorySection title="Previous pre-seasons" trips={PAST_PRESEASONS} onOpen={setDetail} />
          </div>
        )}

        {tab === 'midseason' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: C.text4 }}>{camps.length} camps · combined budget <span style={{ color: C.accent, fontWeight: 700 }}>{fmtGBP(campsTotal)}</span></p>
              {addBtn('Add camp', () => setBuilder('camp'))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {camps.map(c => <TripCard key={c.id} trip={c} onOpen={() => setDetail(c)} />)}
            </div>
            <HistorySection title="Previous camps" trips={PAST_CAMPS} onOpen={setDetail} />
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Lionesses / International Window Alignment</h3>
              <div className="space-y-2">
                {([['03–11 Sep 2026', 'September int’l break — camp runs for non-internationals'], ['08–18 Oct 2026', 'October double-header — 4 Lionesses call-ups expected'], ['17 Feb – 03 Mar 2027', 'Spring camp lands inside the window'], ['06–14 Apr 2027', 'Euro qualifier window — 3 call-ups projected']] as [string, string][]).map(([d, note], i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}><span className="text-xs font-mono w-36 flex-shrink-0" style={{ color: C.accent }}>{d}</span><span className="text-xs" style={{ color: C.text3 }}>{note}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Travelling Squad Availability per Camp</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[{ camp: 'Lionesses Sep break · Sep–Oct', avail: 20, unavail: 6, reason: '4 with Lionesses, 1 ACL rehab, 1 cycle-managed rest' }, { camp: 'Spring camp · Feb–Mar', avail: 22, unavail: 4, reason: '2 with Lionesses, 1 maternity-return (modified), 1 personal leave' }].map((x, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
                    <div className="text-xs font-bold" style={{ color: C.text }}>{x.camp}</div>
                    <div className="flex items-center gap-3 mt-1.5"><div><span className="text-lg font-black" style={{ color: C.good }}>{x.avail}</span><span className="text-[10px] ml-1" style={{ color: C.text4 }}>travelling</span></div><div><span className="text-lg font-black" style={{ color: C.warn }}>{x.unavail}</span><span className="text-[10px] ml-1" style={{ color: C.text4 }}>staying behind</span></div></div>
                    <div className="text-[11px] mt-1" style={{ color: C.text3 }}>{x.reason}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Friendlies During Camps</h3>
              <div className="space-y-2">
                {([['28 Sep 2026', 'Closed-doors vs Castleton Women XI', 'Hartfield'], ['24 Feb 2027', 'Behind-closed-doors vs Penmarric Women', 'Hartfield'], ['01 Mar 2027', 'Academy integration friendly · U21 + first team', 'Oakridge Training Centre']] as [string, string, string][]).map(([d, match, loc], i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}><span className="text-xs font-mono w-24 flex-shrink-0" style={{ color: C.accent }}>{d}</span><span className="text-xs flex-1" style={{ color: C.text }}>{match}</span><span className="text-[11px]" style={{ color: C.text3 }}>{loc}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tours' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: C.text4 }}>{tours.length} tours planned</p>
              {addBtn('Add tour', () => setBuilder('tour'))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tours.map(t => <TripCard key={t.id} trip={t} onOpen={() => setDetail(t)} />)}
            </div>
            <HistorySection title="Previous tours" trips={PAST_TOURS} onOpen={setDetail} />
            <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Itinerary — Pre-season Spain camp 2026</h3>
              <div className="space-y-2">
                {([['Mon 03 Aug', 'Marbella', 'Travel day · settle · sponsor welcome (Vanta)'], ['Tue 04 Aug', 'Marbella', 'AM aerobic base · PM recovery + pool · welfare check-ins'], ['Wed 05 Aug', 'Marbella', 'Double session · tactical units · analysis'], ['Fri 07 Aug', 'Marbella', 'Friendly #1 vs SC Faro Women · 19:00 local'], ['Sun 09 Aug', 'Marbella', 'Content day (kit launch) · set-piece block · family day'], ['Tue 11 Aug', 'Marbella', 'Friendly #2 vs Atlético Femenino · travel home']] as [string, string, string][]).map(([d, city, events], i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}><span className="text-xs font-mono w-24 flex-shrink-0" style={{ color: C.accent }}>{d}</span><span className="text-xs font-semibold w-24 flex-shrink-0" style={{ color: C.text }}>{city}</span><span className="text-xs" style={{ color: C.text3 }}>{events}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Friendly Opponent Pipeline</h3></div>
              <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Opponent', 'Status', 'Match fee'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
                {([['SC Faro Women (Liga BPI)', 'Confirmed', '€18,000 + 50/50 gate'], ['Atlético Femenino (Liga F)', 'Confirmed', '€26,000'], ['Castleton Women (WSL)', 'Confirmed', '£12,000'], ['TBC · USA invitational', 'In discussion', 'TBC — 2027 tour'], ['TBC · Eintracht Women', 'In discussion', 'TBC']] as [string, string, string][]).map((o, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{o[0]}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${o[1] === 'Confirmed' ? C.good : C.warn}26`, color: o[1] === 'Confirmed' ? C.good : C.warn }}>{o[1]}</span></td><td className="px-4 py-2.5 font-mono" style={{ color: C.good }}>{o[2]}</td></tr>
                ))}
              </tbody></table>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Visa &amp; Immigration Tracker — USA tour 2027</h3></div>
              <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Destination', 'Status', 'Expiry'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
                {([['Emma Clarke', 'USA', 'ESTA active', '14 Mar 2028'], ['Jade Osei', 'USA', 'B-1 visa active', '02 Sep 2027'], ['Priya Nair', 'USA', 'B-1 application filed', '—'], ['Lucy Whitmore', 'USA', 'ESTA only — needs B-1', '—'], ['Amara Diallo', 'USA', 'Awaiting embassy slot', '—'], ['Freya Johansson', 'USA', 'B-1 visa active', '21 Jan 2029']] as [string, string, string, string][]).map((v, i) => { const ok = v[2].includes('active'); return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{v[0]}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{v[1]}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ok ? C.good : C.warn}26`, color: ok ? C.good : C.warn }}>{v[2]}</span></td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{v[3]}</td></tr>
                ) })}
              </tbody></table>
            </div>
          </div>
        )}

        {tab === 'logistics' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.accent}55` }}>
              <div className="flex items-center justify-between">
                <div><h3 className="text-sm font-bold" style={{ color: C.text }}>Season camp commitments</h3><p className="text-[11px] mt-0.5" style={{ color: C.text4 }}>Rolls up the Mid-Season Camps tab · {tours.length} tours in planning</p></div>
                <div className="text-right"><div className="text-lg font-black font-mono" style={{ color: C.accent }}>{fmtGBP(campsTotal)}</div><div className="text-[10px]" style={{ color: C.text4 }}>across {camps.length} camps</div></div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Per-trip budget breakdown — Spain pre-season camp</h3>
              <div className="space-y-2">
                {LOGISTICS_BUDGET.map(b => (
                  <div key={b.line} className="flex items-center gap-3">
                    <div className="text-xs flex-1" style={{ color: C.text2 }}>{b.line}</div>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: C.borderHi }}><div className="h-1.5 rounded-full" style={{ width: `${b.pct * 2.6}%`, background: C.accent }} /></div>
                    <div className="text-xs font-mono w-20 text-right" style={{ color: C.text }}>{b.amount}</div>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 mt-2 text-sm font-bold" style={{ borderColor: C.border, color: C.text }}><span>Total</span><span className="font-mono">£201,200</span></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="font-bold mb-1" style={{ color: C.text }}>Hotel block</div><div style={{ color: C.text3 }}>Marbella Beach Resort — 26 rooms, 10 nights · childcare-friendly suites for staff with families.</div></div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="font-bold mb-1" style={{ color: C.text }}>Travel partner</div><div style={{ color: C.text3 }}>Westmoor Sports Travel · contracted 2024-2027 · team-specific dietary list workflow.</div></div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="font-bold mb-1" style={{ color: C.text }}>Sustainability</div><div style={{ color: C.text3 }}>Avg 1,820kg CO₂ per trip (offset · partner Aspen Carbon). Train-vs-coach decisions logged.</div></div>
            </div>
          </div>
        )}

        {tab === 'commercial' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>{['Sponsor', 'Trip', 'Obligation', 'Status', 'Deadline'].map(h => <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
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
              <thead><tr style={{ background: C.panel2 }}>{['Player', 'Role', 'Conflicts (international / cycle / maternity / dual-reg)', 'Tour', 'Status'].map(h => <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
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

      {builder === 'camp' && <WomensTripBuilder kind="camp" accent={C.accent} onClose={() => setBuilder(null)} onCreate={(c) => { setCamps(prev => [...prev, c]); setBuilder(null); setTab('midseason'); setDetail(c) }} />}
      {builder === 'tour' && <WomensTripBuilder kind="tour" accent={C.accent} onClose={() => setBuilder(null)} onCreate={(t) => { setTours(prev => [...prev, t]); setBuilder(null); setTab('tours'); setDetail(t) }} />}
      {detail && <WomensTripDetail trip={detail} accent={C.accent} onClose={() => setDetail(null)} />}
    </div>
  )
}

// Trip card (clickable)
function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const cost = tripCost(trip)
  return (
    <button onClick={onOpen} className="text-left rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-bold" style={{ color: C.text }}>{trip.name}</div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${statusColor(trip.status)}26`, color: statusColor(trip.status) }}>{trip.status.toUpperCase()}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mb-2">
        <span style={{ color: C.text3 }}><Calendar size={11} className="inline mr-1" />{trip.dates}</span>
        <span style={{ color: C.text3 }}><MapPin size={11} className="inline mr-1" />{trip.location}</span>
        <span style={{ color: C.text3 }}><Users size={11} className="inline mr-1" />{trip.squad}</span>
      </div>
      <div className="text-[11.5px] mb-3" style={{ color: C.text2 }}>{trip.focus}</div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <span className="text-[12px] font-bold font-mono" style={{ color: C.accent }}><PoundSterling size={11} className="inline" />{cost > 0 ? fmtGBP(cost).replace('£', '') : 'TBC'}</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.text3 }}>View full plan <ChevronRight size={13} /></span>
      </div>
    </button>
  )
}

// History section
function HistorySection({ title, trips, onOpen }: { title: string; trips: Trip[]; onOpen: (t: Trip) => void }) {
  if (!trips.length) return null
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 mb-3"><History size={14} style={{ color: C.text4 }} /><span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text3 }}>{title}</span></div>
      <div className="space-y-2">
        {trips.map(t => (
          <button key={t.id} onClick={() => onOpen(t)} className="w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold truncate" style={{ color: C.text }}>{t.name}</div>
              <div className="text-[10.5px] truncate" style={{ color: C.text4 }}>{t.dates} · {t.location}{t.outcome ? ` — ${t.outcome.split('.')[0]}.` : ''}</div>
            </div>
            <ChevronRight size={14} style={{ color: C.text4 }} className="flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
