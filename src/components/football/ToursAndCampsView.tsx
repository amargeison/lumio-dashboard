'use client'

import { useState } from 'react'
import { Plane, Activity, Calendar, DollarSign, Briefcase, Users } from 'lucide-react'
import PreSeasonCampMode from '@/components/sports/PreSeasonCampMode'
import WomensTripBuilder, { type Trip, fmtGBP, tripCost } from '@/components/womens/WomensTripBuilder'
import WomensTripDetail from '@/components/womens/WomensTripDetail'

const C = {
  card: '#0D1017', cardAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', muted: '#6B7280', dim: '#4B5563',
  primary: '#003DA5', gold: '#F1C40F',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6', teal: '#0D9488',
} as const

type Tab = 'pre-season' | 'mid-season' | 'tours' | 'logistics' | 'commercial' | 'squad-planning'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'pre-season',     label: 'Pre-Season',           icon: Activity },
  { id: 'mid-season',     label: 'Mid-Season Camps',     icon: Calendar },
  { id: 'tours',          label: 'Tours',                icon: Plane },
  { id: 'logistics',      label: 'Logistics & Costs',    icon: DollarSign },
  { id: 'commercial',     label: 'Commercial Activation', icon: Briefcase },
  { id: 'squad-planning', label: 'Squad Planning',       icon: Users },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>{children}</h3>
}

function Pill({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>{children}</span>
}

// ─── PRE-SEASON ──────────────────────────────────────────────────────────────

function PreSeasonTab() {
  const friendlies = [
    { date: '06 Jul 2026', opponent: 'Ashbourne Athletic',  venue: 'Algarve Stadium · Portugal',    ko: '18:00 local', tickets: 'Closed-doors' },
    { date: '12 Jul 2026', opponent: 'Crown Park Galaxy',   venue: 'Estádio Faro · Portugal',       ko: '20:00 local', tickets: 'Local fans only' },
    { date: '19 Jul 2026', opponent: 'Northgate City',      venue: 'Lumio Park · Home',             ko: '15:00',       tickets: 'On sale 24 Jun' },
    { date: '23 Jul 2026', opponent: 'Hartwell Borough',    venue: 'Hartwell Riverside · Away',     ko: '19:45',       tickets: 'Away end allocated' },
    { date: '27 Jul 2026', opponent: 'Meridian Rovers',     venue: 'Lumio Park · Home',             ko: '15:00',       tickets: 'Season ticket priority' },
  ]
  const fitnessBaseline = [
    { metric: 'Yo-Yo IR2',        target: '≥ 22.0 (st 6)',        squad: '20.6 avg',   color: C.amber },
    { metric: '30-15 IFT',        target: '≥ 19.5 km/h',          squad: '19.2 km/h',  color: C.amber },
    { metric: 'Body fat (DEXA)',  target: '< 12% outfield',       squad: '11.4% avg',  color: C.green },
    { metric: 'Max HR (lab)',     target: 'Profiled day 1',       squad: '194 bpm avg', color: C.green },
    { metric: 'Lactate threshold', target: '≥ 14 km/h @ 4 mmol',  squad: '13.6 km/h',  color: C.amber },
  ]
  const periodisation = [
    { wk: 'Week 1', phase: 'Aerobic base + screening', load: 30 },
    { wk: 'Week 2', phase: 'Volume + GPS familiarisation', load: 55 },
    { wk: 'Week 3', phase: 'Algarve camp · double sessions', load: 85 },
    { wk: 'Week 4', phase: 'Tactical block + first friendlies', load: 70 },
    { wk: 'Week 5', phase: 'Intensity peak · contact load', load: 95 },
    { wk: 'Week 6', phase: 'Taper to opener', load: 60 },
  ]

  return (
    <PreSeasonCampMode
      accent="#003DA5"
      storageKey="lumio_football_preseason"
      aiRoute="/api/ai/football"
      sportEmoji="⚽"
      sportLabel="pre-season"
      emptyTagline="Build the foundation. Drill the system. Hit opening day flying."
      defaultSquad="25"
      defaultFormation="4-3-3"
      readinessFactors={[
        { label: 'Fitness Base',     score: 78 },
        { label: 'Tactical Shape',   score: 71 },
        { label: 'Set Pieces',       score: 64 },
        { label: 'Squad Depth',      score: 76 },
        { label: 'Match Sharpness',  score: 52 },
        { label: 'Injury Status',    score: 84 },
      ]}
      overallReadiness={71}
      checklistItems={[
        'Morning fitness/GPS session',
        'Technical drills',
        'Tactical shape work',
        'Set piece practice',
        'Small-sided games',
        'Recovery/cool down',
        'Video analysis session',
        'Nutrition & hydration logged',
      ]}
      gpsTarget={65}
      fitnessTests={[
        { label: 'Yo-Yo IR2',          target: '≥ 22.0 (st 6)' },
        { label: '30-15 IFT',          target: '≥ 19.5 km/h' },
        { label: 'Body fat (DEXA)',    target: '< 12% outfield' },
        { label: 'Max HR (lab)',       target: 'Profiled day 1' },
        { label: 'Lactate threshold',  target: '≥ 14 km/h @ 4 mmol' },
      ]}
      formationCheckItems={[
        'Defensive shape drilled',
        'Pressing triggers agreed',
        'Attacking patterns rehearsed',
        'Set piece routines locked',
        'Transition play drilled',
      ]}
      defaultFriendlies={[
        { opp: 'Ashbourne Athletic (Algarve)', score: '2-1', notes: 'Transitions tested in Algarve heat', result: 'W' },
      ]}
      friendliesTarget={5}
      demoSummary={'Squad reporting back from break has shown strong baseline fitness — average Yo-Yo IR2 across the squad is 20.6, exceeding pre-season target. Tactical shape work in Algarve covered defensive triggers and pressing patterns; first friendly vs Ashbourne tested transitions. Focus shifts this week to set-piece drilling ahead of double-session block. Injury status: 2 minor flags (hamstring, soft tissue) — managed through reduced load, no major concerns.'}
      demoHighlights={'1. Set piece readiness flagged amber (64/100) — drill defensive corners and free-kick routines this week.\n2. Match sharpness score 52/100 reflects only 1 friendly played — schedule double-session blocks before the Northgate fixture.\n3. Algarve camp completed clean — no injuries from contact load, GPS data clean across the squad.\n4. Crown Park Galaxy friendly (12 Jul) is the first real test of the 4-3-3 — expect press-resistance work to dominate the week before.\n5. Hartwell away (23 Jul) should be the dress rehearsal — full first XI minutes for the spine.'}
      aiSummaryPrompt={(camp, daysTo, phase) => `You are advising a Championship football club Director of Football on pre-season camp progress. Opening fixture vs ${camp.opposition} in ${daysTo} days, currently in ${phase}, squad of ${camp.squad}, target formation ${camp.formation}. Write a 4-sentence summary covering: overall squad fitness from pre-season testing, tactical shape progress and friendly match observations, focus areas this week, and current injury concerns. Specific, coaching-focused, no intro.`}
      aiHighlightsPrompt={(camp, daysTo, phase) => `Generate 5 numbered key highlights for a Championship football club's pre-season AI brief. Opening fixture vs ${camp.opposition} in ${daysTo} days, ${phase} phase, squad of ${camp.squad}, formation ${camp.formation}. Each line specific and coaching-focused. Cover: set piece readiness, match sharpness, fitness camp outcomes, friendly fixture build-up, dress-rehearsal plan. No intro.`}
    >
    <div className="space-y-5">
      <Card>
        <SectionTitle>Pre-Season Friendlies</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Date</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Opponent</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Venue</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">KO</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {friendlies.map((f, i) => (
              <tr key={i} style={{ borderBottom: i < friendlies.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.gold }}>{f.date}</td>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{f.opponent}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{f.venue}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{f.ko}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{f.tickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Fitness Baseline (Day 1 Testing)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fitnessBaseline.map((m, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: C.text }}>{m.metric}</div>
              <div className="text-[10px]" style={{ color: C.muted }}>Target: {m.target}</div>
              <div className="text-sm font-bold mt-1" style={{ color: m.color }}>{m.squad}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Periodisation Schedule (6-Week Block)</SectionTitle>
        <div className="space-y-2">
          {periodisation.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-bold w-16 shrink-0" style={{ color: C.gold }}>{p.wk}</span>
              <span className="text-xs flex-1" style={{ color: C.text }}>{p.phase}</span>
              <div className="w-40 h-1.5 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: `${p.load}%`, backgroundColor: p.load > 80 ? C.red : p.load > 60 ? C.amber : C.green }} />
              </div>
              <span className="text-[10px] font-mono w-10 text-right" style={{ color: C.muted }}>{p.load}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Camp Locations</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Algarve · Quinta do Sol Resort', dates: '11–18 Jul 2026', focus: 'Aerobic base + tactical block', cost: '£148,000' },
            { name: 'Andalucia · Cortijo Performance Centre', dates: '04–10 Aug 2026', focus: 'Match-sharpness + media days', cost: '£112,000' },
          ].map((c, i) => (
            <div key={i} className="rounded-lg p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold" style={{ color: C.text }}>{c.name}</div>
              <div className="text-xs mt-1" style={{ color: C.gold }}>{c.dates}</div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>{c.focus}</div>
              <div className="text-xs mt-2 font-mono" style={{ color: C.green }}>{c.cost}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3" style={{ color: C.dim }}>See Tours sub-tab for any tour-style fixtures embedded in pre-season.</p>
      </Card>
      <Card>
        <SectionTitle>Previous Pre-Seasons</SectionTitle>
        <div className="space-y-2">
          {([['Pre-season 2025 · Algarve', '14-day base + 4 friendlies — squad hit aerobic targets, zero soft-tissue injuries in the block. W3 D1 in friendlies.'], ['Pre-season 2024 · Austria', 'Altitude block + invitational tournament — strong base; two academy graduates earned first-team squad places.'], ['Pre-season 2023 · Home + Netherlands', 'Reduced-budget year — home base with a short Netherlands trip; a promotion-winning season followed.']] as [string, string][]).map(([t, d], i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-bold" style={{ color: C.text }}>{t}</div>
              <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{d}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </PreSeasonCampMode>
  )
}

// ─── MID-SEASON CAMPS ────────────────────────────────────────────────────────

function MidSeasonTab() {
  const camps = [
    { name: 'Marbella Warm-Weather Break',  window: '13–18 Nov 2026 (Int’l break)', squad: '24 + 4 academy', focus: 'Recovery + tactical reset', hotel: 'Costa Marina Resort', training: 'Marbella Football Centre', friendly: 'Closed-doors vs Ashbourne XI · 16 Nov' },
    { name: 'Dubai Mid-Season Camp',         window: '08–14 Jan 2027 (FA Cup R3+)',  squad: '22 + 2 keepers', focus: 'Heat acclimatisation + sponsor activation', hotel: 'Al Marsa Sports Hotel', training: 'Lumio Sports City, Dubai', friendly: 'Crown Wagers Cup vs Hartwell · 11 Jan' },
  ]
  const fifaWindows = [
    { date: '03–11 Sep 2026', note: 'September int’l break — 6 senior call-ups expected' },
    { date: '08–18 Oct 2026', note: 'October double-header — 7 call-ups (incl. 2 U21)' },
    { date: '11–19 Nov 2026', note: 'Marbella camp lands inside this window' },
    { date: '23–31 Mar 2027', note: 'WC qualifier window — 8 call-ups projected' },
  ]
  const friendliesDuringCamps = [
    { date: '16 Nov 2026', match: 'Oakridge FC vs Ashbourne XI (closed-doors)',           location: 'Marbella' },
    { date: '11 Jan 2027', match: 'Crown Wagers Cup · Oakridge FC vs Hartwell Borough',    location: 'Dubai · Sevens Stadium' },
    { date: '13 Jan 2027', match: 'Triangular friendly · Oakridge / Meridian / Vanta',      location: 'Dubai · Lumio Sports City' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Camp Calendar</SectionTitle>
        <div className="space-y-3">
          {camps.map((c, i) => (
            <div key={i} className="rounded-lg p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.gold }}>{c.window}</div>
                </div>
                <Pill color={C.purple}>{c.squad}</Pill>
              </div>
              <div className="text-xs mt-2" style={{ color: C.muted }}>Focus: <span style={{ color: C.text }}>{c.focus}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-[11px]">
                <div><span style={{ color: C.dim }}>Hotel:</span> <span style={{ color: C.muted }}>{c.hotel}</span></div>
                <div><span style={{ color: C.dim }}>Training:</span> <span style={{ color: C.muted }}>{c.training}</span></div>
                <div><span style={{ color: C.dim }}>Friendly:</span> <span style={{ color: C.muted }}>{c.friendly}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>FIFA International Window Alignment</SectionTitle>
        <div className="space-y-2">
          {fifaWindows.map((w, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < fifaWindows.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-mono w-32 shrink-0" style={{ color: C.gold }}>{w.date}</span>
              <span className="text-xs" style={{ color: C.muted }}>{w.note}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Travelling Squad Availability per Camp</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { camp: 'Marbella · Nov 2026', avail: 24, unavail: 4, reason: '2 int’l call-ups, 1 ACL rehab, 1 personal leave' },
            { camp: 'Dubai · Jan 2027',     avail: 22, unavail: 6, reason: '4 int’l (AFCON), 1 hamstring grade 2, 1 paternity' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-bold" style={{ color: C.text }}>{s.camp}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <div><span className="text-lg font-black" style={{ color: C.green }}>{s.avail}</span><span className="text-[10px] ml-1" style={{ color: C.muted }}>travelling</span></div>
                <div><span className="text-lg font-black" style={{ color: C.amber }}>{s.unavail}</span><span className="text-[10px] ml-1" style={{ color: C.muted }}>staying behind</span></div>
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.muted }}>{s.reason}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Friendlies During Camps</SectionTitle>
        <div className="space-y-2">
          {friendliesDuringCamps.map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < friendliesDuringCamps.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-mono w-24 shrink-0" style={{ color: C.gold }}>{f.date}</span>
              <span className="text-xs flex-1" style={{ color: C.text }}>{f.match}</span>
              <span className="text-[11px]" style={{ color: C.muted }}>{f.location}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── TOURS ───────────────────────────────────────────────────────────────────

function ToursTab() {
  const tours = [
    { tour: 'US Summer Tour 2026', status: 'Confirmed', cities: 'New York · Chicago · Atlanta · LA', fixtures: 4, dates: '23 Jul – 06 Aug 2026', sponsor: 'Apex Performance + Crown Wagers' },
    { tour: 'Asia Pre-Season Tour 2027', status: 'Planned', cities: 'Singapore · Tokyo · Seoul', fixtures: 3, dates: 'TBC · Jul 2027', sponsor: 'Discussion w/ Meridian Pacific' },
  ]
  const itinerary2026 = [
    { day: 'Mon 27 Jul', city: 'New York',  events: 'Travel day · sponsor reception @ Crown Wagers HQ' },
    { day: 'Tue 28 Jul', city: 'New York',  events: 'AM training (Randall’s Island) · school visit · evening media' },
    { day: 'Wed 29 Jul', city: 'New York',  events: 'Match: Oakridge FC vs Atlantic City Stars · MetLife Stadium · 19:30 ET' },
    { day: 'Thu 30 Jul', city: 'Chicago',   events: 'Travel · light recovery session · Apex retail activation' },
    { day: 'Sat 01 Aug', city: 'Chicago',   events: 'Match: Oakridge FC vs Lakeshore United · Soldier Field · 20:00 CT' },
    { day: 'Mon 03 Aug', city: 'Atlanta',   events: 'Sponsor day · Hartwell Foundation joint clinic with local kids' },
    { day: 'Tue 04 Aug', city: 'Atlanta',   events: 'Match: Oakridge FC vs Peachtree FC · Mercedes-Benz Stadium · 20:00 ET' },
    { day: 'Thu 06 Aug', city: 'Los Angeles', events: 'Match: Oakridge FC vs Pacific Galaxy · Rose Bowl · 19:30 PT · tour close' },
  ]
  const opponentPipeline = [
    { opponent: 'Atlantic City Stars (USL)', status: 'Confirmed',     fee: '$420,000 + 50/50 gate' },
    { opponent: 'Lakeshore United (MLS)',     status: 'Confirmed',     fee: '$650,000' },
    { opponent: 'Peachtree FC (MLS)',         status: 'Confirmed',     fee: '$580,000' },
    { opponent: 'Pacific Galaxy (MLS)',       status: 'Confirmed',     fee: '$725,000' },
    { opponent: 'TBC · Singapore (S.League)', status: 'In discussion', fee: 'TBC — 2027 tour' },
    { opponent: 'TBC · Tokyo (J.League)',     status: 'In discussion', fee: 'TBC — 2027 tour' },
  ]
  const visa = [
    { player: 'Jordan Hayes',     destination: 'USA', status: 'B-1 visa active',        expiry: '14 Mar 2028' },
    { player: 'Tom Fletcher',      destination: 'USA', status: 'B-1 visa active',        expiry: '02 Sep 2027' },
    { player: 'Daniel Webb',       destination: 'USA', status: 'B-1 application filed',  expiry: '—' },
    { player: 'Marcus Reid',      destination: 'USA', status: 'ESTA only — needs B-1',  expiry: '—' },
    { player: 'Kyle Osei',     destination: 'USA', status: 'Awaiting embassy slot',   expiry: '—' },
    { player: 'Myles Okafor',    destination: 'USA', status: 'B-1 visa active',        expiry: '21 Jan 2029' },
    { player: 'Chris Nwosu',        destination: 'USA', status: 'B-1 application filed',  expiry: '—' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Active & Planned Tours</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Tour</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Cities</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Fixtures</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Dates</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Title Partners</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t, i) => (
              <tr key={i} style={{ borderBottom: i < tours.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{t.tour}</td>
                <td className="px-3 py-2.5"><Pill color={t.status === 'Confirmed' ? C.green : C.amber}>{t.status}</Pill></td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{t.cities}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.gold }}>{t.fixtures}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{t.dates}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{t.sponsor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Itinerary — US Summer Tour 2026</SectionTitle>
        <div className="space-y-2">
          {itinerary2026.map((d, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < itinerary2026.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-mono w-24 shrink-0" style={{ color: C.gold }}>{d.day}</span>
              <span className="text-xs font-semibold w-28 shrink-0" style={{ color: C.text }}>{d.city}</span>
              <span className="text-xs" style={{ color: C.muted }}>{d.events}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Friendly Opponent Pipeline</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Opponent</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Match Fee</th>
            </tr>
          </thead>
          <tbody>
            {opponentPipeline.map((o, i) => (
              <tr key={i} style={{ borderBottom: i < opponentPipeline.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{o.opponent}</td>
                <td className="px-3 py-2.5"><Pill color={o.status === 'Confirmed' ? C.green : C.amber}>{o.status}</Pill></td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.green }}>{o.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Visa & Immigration Tracker — US Tour 2026</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Destination</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {visa.map((v, i) => {
              const ok = v.status.includes('active')
              return (
                <tr key={i} style={{ borderBottom: i < visa.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{v.player}</td>
                  <td className="px-3 py-2.5" style={{ color: C.muted }}>{v.destination}</td>
                  <td className="px-3 py-2.5"><Pill color={ok ? C.green : C.amber}>{v.status}</Pill></td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{v.expiry}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── LOGISTICS & COSTS ───────────────────────────────────────────────────────

function LogisticsTab() {
  const budget = [
    { line: 'Charter flights (LON · NYC · CHI · ATL · LAX · LON)', cost: '£640,000' },
    { line: 'Hotels (4 cities · 11 nights · 32 rooms)',            cost: '£385,000' },
    { line: 'Ground transport (coaches + airside transfers)',       cost: '£72,000'  },
    { line: 'Kit & equipment freight',                              cost: '£48,000'  },
    { line: 'F&B + per diems',                                      cost: '£94,000'  },
    { line: 'Insurance (incl. abandonment cover)',                  cost: '£68,000'  },
    { line: 'Medical kit + portable ICU rental',                    cost: '£22,000'  },
    { line: 'Security & risk advisory',                              cost: '£35,000'  },
  ]
  const hotels = [
    { city: 'New York',  hotel: 'Crown Plaza Times Square', rooms: 32, nights: 3, cost: '£128,000' },
    { city: 'Chicago',   hotel: 'Apex Riverside Hotel',     rooms: 30, nights: 2, cost: '£74,000' },
    { city: 'Atlanta',   hotel: 'Meridian Buckhead',        rooms: 30, nights: 2, cost: '£68,000' },
    { city: 'Los Angeles', hotel: 'Pacific Pier Hotel',     rooms: 32, nights: 4, cost: '£115,000' },
    { city: 'Marbella',  hotel: 'Costa Marina Resort',      rooms: 28, nights: 5, cost: '£74,000 (Nov 2026)' },
  ]
  const partners = [
    { type: 'Charter airline',  partner: 'Crown Skyways',       contact: 'Jenna Holt · jenna@crownskyways.co' },
    { type: 'Domestic coach',   partner: 'Apex Coachways',      contact: 'Phil Reece · phil@apexcoach.co.uk' },
    { type: 'Hotel block',      partner: 'Meridian Hospitality', contact: 'Anna Voss · groups@meridianhotels.com' },
    { type: 'Kit freight',      partner: 'Hartwell Logistics',   contact: 'Ben Carver · ben@hartwell-log.com' },
    { type: 'Travel insurance', partner: 'Vanta Underwriting',   contact: 'Sarah Pell · spell@vanta-uw.com' },
  ]
  const perDiem = [
    { tier: 'First-team players',   uk: '£45/day', away: '£90/day', notes: 'Topped up on tour to cover incidentals' },
    { tier: 'Coaching staff',       uk: '£40/day', away: '£85/day', notes: '' },
    { tier: 'Medical & performance', uk: '£40/day', away: '£75/day', notes: 'Receipts required > £30' },
    { tier: 'Operations & media',   uk: '£35/day', away: '£70/day', notes: '' },
  ]
  const sustainability = [
    { metric: 'Total tour mileage',         value: '14,820 mi (one-way distances)' },
    { metric: 'Carbon (charter equiv.)',     value: '~480 tCO₂e' },
    { metric: 'Domestic legs · train share', value: '0% (US tour) · 22% (UK pre-season)' },
    { metric: 'Coach vs charter (UK)',       value: '88% coach for sub-200mi away days' },
    { metric: 'Carbon offsets purchased',    value: 'Via Crown Carbon · £14,400' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>US Tour 2026 — Budget Breakdown</SectionTitle>
        <div className="space-y-1.5">
          {budget.map((b, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < budget.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs" style={{ color: C.text }}>{b.line}</span>
              <span className="text-xs font-mono font-bold" style={{ color: C.green }}>{b.cost}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: `2px solid ${C.gold}` }}>
            <span className="text-sm font-bold" style={{ color: C.text }}>Tour total</span>
            <span className="text-sm font-mono font-black" style={{ color: C.gold }}>£1,364,000</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Hotel Block Bookings</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">City</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Hotel</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Rooms</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Nights</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Cost</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h, i) => (
              <tr key={i} style={{ borderBottom: i < hotels.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5" style={{ color: C.text }}>{h.city}</td>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{h.hotel}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{h.rooms}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{h.nights}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.green }}>{h.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Travel Partner CRM</SectionTitle>
        <div className="space-y-1.5">
          {partners.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < partners.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-[10px] font-bold uppercase tracking-wider w-32 shrink-0" style={{ color: C.gold }}>{p.type}</span>
              <span className="text-xs font-semibold w-48 shrink-0" style={{ color: C.text }}>{p.partner}</span>
              <span className="text-[11px]" style={{ color: C.muted }}>{p.contact}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Per Diem Schedule</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Tier</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">UK</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Away / Tour</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {perDiem.map((p, i) => (
              <tr key={i} style={{ borderBottom: i < perDiem.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.tier}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{p.uk}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.green }}>{p.away}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{p.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Sustainability Metrics</SectionTitle>
        <div className="space-y-1.5">
          {sustainability.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < sustainability.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs" style={{ color: C.muted }}>{s.metric}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: C.text }}>{s.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── COMMERCIAL ACTIVATION ───────────────────────────────────────────────────

function CommercialTab() {
  const obligations = [
    { sponsor: 'Apex Performance',  obligation: 'Open training session w/ media',         when: 'Day 2 NYC', owner: 'Comms', status: 'Scheduled', color: C.green },
    { sponsor: 'Crown Wagers',      obligation: 'VIP hospitality event · 40 guests',      when: 'Day 3 NYC', owner: 'Hospitality', status: 'Scheduled', color: C.green },
    { sponsor: 'Meridian Pacific',  obligation: 'School clinic + photo opportunity',       when: 'Day 7 ATL', owner: 'Foundation', status: 'In planning', color: C.amber },
    { sponsor: 'Vanta Underwriting', obligation: 'Travel-insurance content shoot',         when: 'Day 9 LAX', owner: 'Content', status: 'Scheduled', color: C.green },
    { sponsor: 'Hartwell Logistics', obligation: 'Behind-the-scenes freight feature',      when: 'Pre-tour',   owner: 'Content', status: 'Delivered', color: C.green },
  ]
  const hospitality = [
    { tier: 'Diamond',  guests: 12, price: '$8,500/seat', allocation: 'NYC + LAX',          status: 'Sold' },
    { tier: 'Platinum', guests: 32, price: '$4,200/seat', allocation: '4 cities, 1 match each', status: '24 sold · 8 remaining' },
    { tier: 'Gold',     guests: 80, price: '$1,800/seat', allocation: '4 cities, 1 match each', status: '52 sold · 28 remaining' },
    { tier: 'Open',     guests: 220, price: '$650/seat',  allocation: 'Across all matches',  status: 'Public on-sale 1 May' },
  ]
  const contentBrief = [
    { capture: 'Behind-the-scenes flight + arrival',  format: 'Vertical · 60s',           channel: 'TikTok + IG Reels', owner: 'Filmer A' },
    { capture: 'Open training drone footage',          format: 'Cinematic · 3min',         channel: 'YouTube + LinkedIn', owner: 'Filmer B' },
    { capture: 'Player Q&A · sponsor activation',      format: 'Interview · 5min',          channel: 'YouTube + sponsor channels', owner: 'Comms team' },
    { capture: 'School clinic kid-perspective',        format: 'Heartwarming · 90s',        channel: 'TikTok + sponsor co-post', owner: 'Foundation team' },
    { capture: 'Tunnel walk + first-touch slow-mo',    format: 'Short-form · 30s',          channel: 'IG Reels + X', owner: 'Filmer A' },
  ]
  const mediaPlan = [
    { city: 'New York',    media: 'Press conference · NYT + The Athletic + ESPN FC' },
    { city: 'Chicago',     media: 'Chicago Sun-Times feature · sponsor-led roundtable' },
    { city: 'Atlanta',     media: 'AJC + foundation joint piece (community angle)' },
    { city: 'Los Angeles', media: 'LA Times tunnel access · pacific-time coast media' },
  ]
  const retail = [
    { product: 'Tour-special away kit (US tour 2026)',          price: '£89.99', launch: '15 Jul 2026', allocation: '4,500 units · split US-only / UK online' },
    { product: 'Limited tour scarf (4 cities · numbered 1-2000)', price: '£24.99', launch: '01 Jul 2026', allocation: '2,000 units' },
    { product: 'Signed match-worn shirt (auctioned per fixture)', price: 'Auction', launch: 'Per match', allocation: '4 shirts (Foundation auction)' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Sponsor Obligation Checklist — US Tour 2026</SectionTitle>
        <div className="space-y-1.5">
          {obligations.map((o, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < obligations.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-bold w-32 shrink-0" style={{ color: C.gold }}>{o.sponsor}</span>
              <span className="text-xs flex-1" style={{ color: C.text }}>{o.obligation}</span>
              <span className="text-[11px] w-20 shrink-0" style={{ color: C.muted }}>{o.when}</span>
              <span className="text-[11px] w-24 shrink-0" style={{ color: C.dim }}>{o.owner}</span>
              <Pill color={o.color}>{o.status}</Pill>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Hospitality Opportunities</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Tier</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Capacity</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Price</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Allocation</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {hospitality.map((h, i) => (
              <tr key={i} style={{ borderBottom: i < hospitality.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{h.tier}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{h.guests}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.green }}>{h.price}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{h.allocation}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{h.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Content Capture Brief</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Capture</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Format</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Channel</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Owner</th>
            </tr>
          </thead>
          <tbody>
            {contentBrief.map((c, i) => (
              <tr key={i} style={{ borderBottom: i < contentBrief.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5" style={{ color: C.text }}>{c.capture}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{c.format}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{c.channel}</td>
                <td className="px-3 py-2.5" style={{ color: C.dim }}>{c.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Media / PR Plan</SectionTitle>
        <div className="space-y-1.5">
          {mediaPlan.map((m, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < mediaPlan.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-bold w-28 shrink-0" style={{ color: C.gold }}>{m.city}</span>
              <span className="text-xs" style={{ color: C.muted }}>{m.media}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Retail Tie-Ins</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Product</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Price</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Launch</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {retail.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < retail.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.product}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.green }}>{r.price}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{r.launch}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{r.allocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── SQUAD PLANNING ──────────────────────────────────────────────────────────

function SquadPlanningTab() {
  type Avail = 'travelling' | 'rest' | 'rehab' | 'int’l-call-up'
  const squad: { name: string; pos: string; status: Avail; note: string }[] = [
    { name: 'Jordan Hayes',     pos: 'GK',  status: 'travelling', note: 'Visa active' },
    { name: 'Joe McDonnell',     pos: 'GK',  status: 'rest',        note: 'Rotation' },
    { name: 'Tom Fletcher',      pos: 'LB',  status: 'travelling', note: '' },
    { name: 'Daniel Webb',       pos: 'CB',  status: 'travelling', note: 'Visa filed' },
    { name: 'Marcus Reid',      pos: 'CB',  status: 'travelling', note: 'B-1 needed' },
    { name: 'Isaac Kemp',     pos: 'CB',  status: 'rest',        note: 'Wedding 04 Aug' },
    { name: 'Brodi Chen',      pos: 'CB',  status: 'rehab',       note: 'Hamstring G1' },
    { name: 'Liam Barker',     pos: 'CM',  status: 'travelling', note: '' },
    { name: 'Connor Walsh',         pos: 'CM',  status: 'travelling', note: '' },
    { name: 'Ryan Cole',     pos: 'CM',  status: 'travelling', note: '' },
    { name: 'Paul Granger',     pos: 'CDM', status: 'rest',        note: 'Veteran rest week' },
    { name: 'Myles Okafor',    pos: 'LW',  status: 'travelling', note: 'Sponsor anchor' },
    { name: 'James Tilley',       pos: 'RW',  status: 'travelling', note: '' },
    { name: 'Dean Morris',      pos: 'LW',  status: 'travelling', note: 'Top scorer' },
    { name: 'Sam Porter',     pos: 'ST',  status: 'travelling', note: '' },
    { name: 'Chris Nwosu',        pos: 'ST',  status: 'rehab',       note: 'Calf — return TBC' },
    { name: 'Antwoine Rowe',  pos: 'CF',  status: 'travelling', note: '' },
  ]
  const academy = [
    { name: 'Owen Hartley',  age: 19, pos: 'CM',  pathway: 'U21 captain · Pro contract Aug 2026' },
    { name: 'Levi Adeyemi',  age: 18, pos: 'RW',  pathway: 'U18 player of year · Tour debut likely' },
    { name: 'Cameron Bull',  age: 17, pos: 'CB',  pathway: 'Scholar · spot in tour squad pending'  },
  ]
  const conflicts = [
    { player: 'Myles Okafor',  window: 'Sep 2026 (CONCACAF qualifiers)', clash: 'Travel day cuts into FIFA window — agreed early release' },
    { player: 'Chris Nwosu',     window: 'Oct 2026 (AFCON qualifiers)',     clash: 'Currently on calf rehab — will miss call-up' },
    { player: 'Daniel Webb',      window: 'Nov 2026 (Marbella camp)',        clash: 'Senior call-up overlaps · staying behind for camp' },
    { player: 'Owen Hartley (U21)', window: 'Mar 2027 (UEFA U21)',           clash: 'Camp clash — releasing for international' },
  ]
  const statusColor = (s: Avail) => s === 'travelling' ? C.green : s === 'rest' ? C.blue : s === 'rehab' ? C.red : C.amber

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Travelling Squad Selector — US Tour 2026</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Pos</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Note</th>
            </tr>
          </thead>
          <tbody>
            {squad.map((p, i) => (
              <tr key={i} style={{ borderBottom: i < squad.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{p.pos}</td>
                <td className="px-3 py-2.5"><Pill color={statusColor(p.status)}>{p.status}</Pill></td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Leave & Rest Schedule (Non-Travelling)</SectionTitle>
        <div className="space-y-1.5">
          {squad.filter(p => p.status === 'rest').map((p, i, arr) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-semibold w-40 shrink-0" style={{ color: C.text }}>{p.name}</span>
              <span className="text-xs font-mono w-12 shrink-0" style={{ color: C.muted }}>{p.pos}</span>
              <span className="text-xs" style={{ color: C.muted }}>{p.note || 'Rotation rest week'}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Rehab Players Staying Behind</SectionTitle>
        <div className="space-y-1.5">
          {squad.filter(p => p.status === 'rehab').map((p, i, arr) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xs font-semibold w-40 shrink-0" style={{ color: C.text }}>{p.name}</span>
              <span className="text-xs font-mono w-12 shrink-0" style={{ color: C.muted }}>{p.pos}</span>
              <span className="text-xs" style={{ color: C.red }}>{p.note}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>U21 / Academy Travelling Player Nominations</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Age</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Pos</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Pathway Note</th>
            </tr>
          </thead>
          <tbody>
            {academy.map((a, i) => (
              <tr key={i} style={{ borderBottom: i < academy.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{a.name}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{a.age}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{a.pos}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{a.pathway}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>International Call-Up Conflicts</SectionTitle>
        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold" style={{ color: C.text }}>{c.player}</span>
                <Pill color={C.amber}>{c.window}</Pill>
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.muted }}>{c.clash}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

// ─── Clickable trip builder (mirrors the women's flagship) ───────────────────

const MENS_CAMPS: Trip[] = [
  {
    id: 'camp-oct', kind: 'camp', name: 'October international break camp',
    dates: '12–18 Oct 2026', location: 'Oakridge Training Complex', status: 'Planned',
    squad: '22 (3 on international duty)', focus: 'Maintenance load · academy minutes · set-piece work',
    summary: 'A maintenance and development block during the October international window. Non-internationals hold fitness and sharpen patterns while three players are released; selected academy players integrate for first-team minutes.',
    objectives: ['Maintain match fitness for non-internationals', 'Integrate 3 academy players into first-team sessions', 'Return-to-play progressions for the rehab group', 'Set-piece and pressing pattern refinement'],
    itinerary: [
      { day: 'Day 1 · Mon', am: 'Testing & screening', pm: 'Light activation + meeting', eve: 'Team dinner' },
      { day: 'Day 2 · Tue', am: 'Strength & conditioning', pm: 'Possession + pressing units', eve: 'Recovery' },
      { day: 'Day 3 · Wed', am: 'Set-piece block', pm: 'Small-sided games', eve: 'Analysis review' },
      { day: 'Day 4 · Thu', am: 'Recovery + rehab', pm: 'Tactical shape (academy integrated)', eve: 'Downtime' },
      { day: 'Day 5 · Fri', am: 'High-intensity day', pm: 'In-house friendly', eve: 'Team social' },
    ],
    logistics: { travel: 'No travel — home base', accommodation: 'Players resident · staff on site', transport: 'Club minibus for off-site recovery', insurance: 'Standard squad cover' },
    budget: [{ line: 'Pitch & facility hire', amount: 6800 }, { line: 'Catering & nutrition', amount: 5200 }, { line: 'Sports science / screening', amount: 4800 }, { line: 'Recovery (pool / physio)', amount: 3600 }, { line: 'Academy integration', amount: 2400 }, { line: 'Contingency', amount: 2000 }],
    commercial: ['Sponsor content day (Meridian Group) — recovery science feature', 'Academy “pathway” social series'],
    medical: ['Load individualised across the squad', '2 players on late-stage return-to-play', 'Screening for previous-injury group'],
    staff: ['Head Coach', 'Head of Sports Science', 'Club Doctor', 'Physio ×2', 'Analyst'],
  },
  {
    id: 'camp-feb', kind: 'camp', name: 'February warm-weather camp',
    dates: '9–15 Feb 2027', location: 'Estepona, Spain', status: 'Negotiating',
    squad: 'Full squad (24)', focus: 'Mid-season reset · warm-weather conditioning · 1 friendly',
    summary: 'A mid-season warm-weather training camp to reset physically during a winter break in fixtures, with a single friendly against continental opposition.',
    objectives: ['Physical reset and reconditioning block', 'Warm-weather aerobic top-up', 'One friendly for squad-rotation minutes', 'Tactical refresh ahead of the run-in'],
    itinerary: [
      { day: 'Day 1', am: 'Travel — flight to Málaga', pm: 'Settle + light walk', eve: 'Team dinner' },
      { day: 'Day 3', am: 'Double session', pm: 'Recovery + pool', eve: 'Analysis' },
      { day: 'Day 5', am: 'Friendly prep', pm: 'Friendly vs CD Estepona', eve: 'Recovery' },
    ],
    logistics: { travel: 'Scheduled flights (Northbridge Sport Travel)', accommodation: 'Estepona resort — 26 rooms, 6 nights', transport: 'Local coach on arrival', insurance: 'Tour insurance + repatriation' },
    budget: [{ line: 'Flights', amount: 24800 }, { line: 'Hotels', amount: 28600 }, { line: 'Ground transport', amount: 6400 }, { line: 'Catering / per diem', amount: 9800 }, { line: 'Friendly / facility hire', amount: 5200 }, { line: 'Insurance', amount: 4600 }],
    commercial: ['Vanta Sports — winter training-kit content', 'Crown Broadcasting — 1 content day'],
    medical: ['Warm-weather hydration plan', 'Reconditioning block for high-minutes players', 'Travel-recovery protocols'],
    staff: ['Head Coach', 'Assistant Manager', 'Head of Sports Science', 'Club Doctor', 'Physio ×2', 'Analyst', 'Kit Manager'],
  },
]

const MENS_TOURS: Trip[] = [
  {
    id: 'tour-por', kind: 'tour', name: 'Portugal pre-season tour',
    dates: '6–19 Jul 2026', location: 'Algarve, Portugal', status: 'Active',
    squad: '26 (incl. 4 academy)', focus: 'Pre-season base · heat adaptation · 2 friendlies · sponsor activation',
    summary: 'A two-week pre-season tour combining a warm-weather training base with two friendlies against continental opposition, doubling as a commercial activation window with the principal sponsor.',
    objectives: ['Build the aerobic base in warm-weather conditions', 'Two friendlies — minutes for the full squad', 'Integrate new signings into patterns of play', 'Heat & hydration protocols', 'Sponsor activation + content capture'],
    itinerary: [
      { day: 'Day 1', am: 'Travel — charter to Faro', pm: 'Arrival, light walk', eve: 'Team dinner' },
      { day: 'Day 2', am: 'Aerobic base', pm: 'Recovery + pool', eve: 'Sponsor welcome' },
      { day: 'Day 5', am: 'Friendly #1 prep', pm: 'Friendly vs Ashbourne Athletic', eve: 'Recovery' },
      { day: 'Day 10', am: 'Content day', pm: 'Set-piece block', eve: 'Downtime' },
      { day: 'Day 13', am: 'Friendly #2', pm: 'Travel home', eve: '—' },
    ],
    logistics: { travel: 'Charter coach + scheduled flights (Northbridge Sport Travel)', accommodation: 'Algarve Stadium resort — 30 rooms, 13 nights', transport: 'Local coach contracted on arrival', insurance: 'Tour insurance + repatriation cover' },
    budget: [{ line: 'Flights', amount: 42400 }, { line: 'Hotels', amount: 48200 }, { line: 'Ground transport', amount: 11800 }, { line: 'Kit & equipment freight', amount: 8400 }, { line: 'Catering / per diem', amount: 16600 }, { line: 'Insurance + repatriation', amount: 9200 }, { line: 'Friendlies / facility hire', amount: 7400 }],
    commercial: ['Vanta Sports — kit launch tied to friendly #1', 'Crown Broadcasting — 2 content days', 'Meridian Group — hospitality activation'],
    medical: ['Heat-adaptation & hydration plan', 'Travel-recovery / sleep protocols', 'Load ramp across the tour'],
    staff: ['Head Coach', 'Assistant Manager', 'Head of Sports Science', 'Club Doctor', 'Physio ×2', 'Analyst', 'Kit Manager', 'Media Officer'],
  },
  {
    id: 'tour-usa', kind: 'tour', name: 'USA summer tour',
    dates: '18–30 Jul 2026', location: 'Orlando & Charlotte, USA', status: 'Negotiating',
    squad: '26', focus: 'Commercial growth · 2 friendlies · brand exposure',
    summary: 'A commercial-led summer tour across two US cities with two friendlies against MLS opposition, targeting brand growth in a key market.',
    objectives: ['Two friendlies vs MLS opposition', 'Commercial and broadcast exposure in the US market', 'Squad minutes and tactical work', 'Fan engagement events in both cities'],
    itinerary: [
      { day: 'Day 1', am: 'Travel — flight to Orlando', pm: 'Arrival + recovery', eve: '—' },
      { day: 'Day 4', am: 'Friendly #1 prep', pm: 'Friendly vs Crown Park Galaxy', eve: 'Recovery' },
      { day: 'Day 8', am: 'Travel to Charlotte', pm: 'Light session', eve: 'Sponsor event' },
      { day: 'Day 11', am: 'Friendly #2', pm: 'Travel home', eve: '—' },
    ],
    logistics: { travel: 'Long-haul charter (Northbridge Sport Travel)', accommodation: 'City-centre hotels — Orlando 4 nights, Charlotte 5 nights', transport: 'Coach + internal flight', insurance: 'Long-haul tour insurance + repatriation' },
    budget: [{ line: 'Flights (long-haul + internal)', amount: 138000 }, { line: 'Hotels', amount: 96000 }, { line: 'Ground transport', amount: 24000 }, { line: 'Freight', amount: 18000 }, { line: 'Catering / per diem', amount: 32000 }, { line: 'Insurance', amount: 16000 }, { line: 'Events / activation', amount: 22000 }],
    commercial: ['Meridian Group — US market activation', 'Crown Broadcasting — live US broadcast', 'Apex Performance — fan-zone tour'],
    medical: ['Long-haul travel-recovery & jet-lag plan', 'Hydration in heat / humidity', 'Load management across two friendlies'],
    staff: ['Head Coach', 'Assistant Manager', 'Head of Sports Science', 'Club Doctor', 'Physio ×2', 'Analyst', 'Kit Manager', 'Media Officer', 'Commercial Lead'],
  },
]

const PAST_CAMPS: Trip[] = [
  {
    id: 'past-camp-1', kind: 'camp', name: 'February camp 2025 · Spain', dates: 'Feb 2025', location: 'Marbella, Spain',
    status: 'Completed', squad: '24', focus: 'Mid-season reset', summary: 'Warm-weather mid-season reset with one friendly.',
    objectives: ['Physical reset', 'Tactical refresh'], itinerary: [],
    logistics: { travel: 'Scheduled flights', accommodation: 'Marbella resort', transport: 'Local coach', insurance: 'Tour insurance' },
    budget: [{ line: 'Flights', amount: 23000 }, { line: 'Hotels', amount: 26000 }, { line: 'Other', amount: 18000 }],
    commercial: ['Winter kit content'], medical: ['Reconditioning block'], staff: ['Head Coach', 'Sports Science', 'Physio ×2'],
    past: true, outcome: 'Squad returned at +6% high-speed running average; unbeaten in the following 5 league games.',
  },
]

const PAST_TOURS: Trip[] = [
  {
    id: 'past-tour-1', kind: 'tour', name: 'Pre-season 2024 · Austria', dates: 'Jul 2024', location: 'Tyrol, Austria',
    status: 'Completed', squad: '25', focus: 'Altitude base + 3 friendlies', summary: 'Alpine pre-season base with three friendlies.',
    objectives: ['Aerobic base at altitude', 'Three friendlies'], itinerary: [],
    logistics: { travel: 'Charter coach', accommodation: 'Alpine training hotel', transport: 'Local coach', insurance: 'Tour insurance' },
    budget: [{ line: 'Travel', amount: 34000 }, { line: 'Hotels', amount: 38000 }, { line: 'Other', amount: 20000 }],
    commercial: ['Sponsor content week'], medical: ['Altitude adaptation'], staff: ['Head Coach', 'Sports Science', 'Club Doctor', 'Physio ×2'],
    past: true, outcome: 'Completed the full pre-season load plan injury-free; opened the season with a win.',
  },
  {
    id: 'past-tour-2', kind: 'tour', name: 'Asia tour 2023', dates: 'Jul 2023', location: 'Singapore & Kuala Lumpur',
    status: 'Completed', squad: '26', focus: 'Commercial tour + 2 friendlies', summary: 'Commercial-led Asia tour with two friendlies.',
    objectives: ['Brand growth in Asia', 'Two friendlies'], itinerary: [],
    logistics: { travel: 'Long-haul charter', accommodation: 'City hotels', transport: 'Coach + flight', insurance: 'Long-haul insurance' },
    budget: [{ line: 'Flights', amount: 120000 }, { line: 'Hotels', amount: 88000 }, { line: 'Other', amount: 60000 }],
    commercial: ['Asia market activation', 'Live broadcast'], medical: ['Long-haul recovery'], staff: ['Head Coach', 'Sports Science', 'Club Doctor', 'Physio ×2', 'Media'],
    past: true, outcome: '2.1m social impressions; new regional partnership signed post-tour.',
  },
]

const PAST_PRESEASONS: Trip[] = [
  {
    id: 'past-ps-1', kind: 'tour', name: 'Portugal pre-season 2025', dates: 'Jul 2025', location: 'Faro, Portugal',
    status: 'Completed', squad: '26', focus: 'Pre-season base · 3 friendlies', summary: 'Warm-weather pre-season base in the Algarve with three friendlies.',
    objectives: ['Build the aerobic base', 'Three friendlies', 'Integrate new signings'], itinerary: [],
    logistics: { travel: 'Charter coach + scheduled flights', accommodation: 'Algarve resort — 13 nights', transport: 'Local coach', insurance: 'Tour insurance + repatriation' },
    budget: [{ line: 'Flights', amount: 39000 }, { line: 'Hotels', amount: 44000 }, { line: 'Other', amount: 28000 }],
    commercial: ['Kit launch content'], medical: ['Heat adaptation & hydration'], staff: ['Head Coach', 'Head of Sports Science', 'Club Doctor', 'Physio ×2', 'Analyst'],
    past: true, outcome: 'Won all three friendlies; squad hit aerobic targets with zero soft-tissue injuries in the block.',
  },
  {
    id: 'past-ps-2', kind: 'tour', name: 'Austria pre-season 2024', dates: 'Jul 2024', location: 'Tyrol, Austria',
    status: 'Completed', squad: '25', focus: 'Altitude base + 3 friendlies', summary: 'Alpine pre-season base with three friendlies.',
    objectives: ['Aerobic base at altitude', 'Three friendlies'], itinerary: [],
    logistics: { travel: 'Charter coach', accommodation: 'Alpine training hotel', transport: 'Local coach', insurance: 'Tour insurance' },
    budget: [{ line: 'Travel', amount: 34000 }, { line: 'Hotels', amount: 38000 }, { line: 'Other', amount: 20000 }],
    commercial: ['Sponsor content week'], medical: ['Altitude adaptation'], staff: ['Head Coach', 'Head of Sports Science', 'Club Doctor', 'Physio ×2'],
    past: true, outcome: 'Completed the full pre-season load plan injury-free; opened the season with a win.',
  },
]

const MENS_DRAFTS: { camp: Partial<Trip>; tour: Partial<Trip> } = {
  camp: MENS_CAMPS[0],
  tour: MENS_TOURS[0],
}

function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const total = tripCost(trip)
  const sc = trip.status === 'Active' ? C.green : trip.status === 'Planned' ? C.amber : trip.status === 'Negotiating' ? C.blue : C.muted
  return (
    <button onClick={onOpen} className="text-left rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-bold" style={{ color: C.text }}>{trip.name}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${sc}22`, color: sc }}>{trip.status.toUpperCase()}</span>
      </div>
      <div className="text-[11px] mb-2" style={{ color: C.muted }}>{trip.dates} · {trip.location}</div>
      <div className="text-[11px]" style={{ color: C.dim }}>{trip.focus}</div>
      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <span className="text-[11px]" style={{ color: C.muted }}>{trip.squad}</span>
        <span className="text-[12px] font-bold" style={{ color: C.primary }}>{fmtGBP(total)}</span>
      </div>
    </button>
  )
}

function HistorySection({ title, trips, onOpen }: { title: string; trips: Trip[]; onOpen: (t: Trip) => void }) {
  if (!trips.length) return null
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-2">
        {trips.map(t => (
          <button key={t.id} onClick={() => onOpen(t)} className="w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]" style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}>
            <span className="text-[11px] font-bold shrink-0" style={{ color: C.primary }}>{t.dates}</span>
            <span className="text-xs font-semibold flex-1" style={{ color: C.text }}>{t.name}</span>
            <span className="text-[11px] truncate" style={{ color: C.muted, maxWidth: 180 }}>{t.location}</span>
            <span className="text-[11px]" style={{ color: C.dim }}>›</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

function BuilderStrip({ kind, trips, past, onOpen, onBuild }: { kind: 'camp' | 'tour'; trips: Trip[]; past: Trip[]; onOpen: (t: Trip) => void; onBuild: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>{kind === 'camp' ? 'Camps' : 'Tours'}</SectionTitle>
        <button onClick={onBuild} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: C.primary }}>
          + {kind === 'camp' ? 'Build a camp' : 'Plan a tour'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {trips.map(t => <TripCard key={t.id} trip={t} onOpen={() => onOpen(t)} />)}
      </div>
      <HistorySection title={kind === 'camp' ? 'Previous camps' : 'Previous tours'} trips={past} onOpen={onOpen} />
    </div>
  )
}

export default function ToursAndCampsView() {
  const [tab, setTab] = useState<Tab>('pre-season')
  const [camps, setCamps] = useState<Trip[]>(MENS_CAMPS)
  const [tours, setTours] = useState<Trip[]>(MENS_TOURS)
  const [builder, setBuilder] = useState<null | 'camp' | 'tour'>(null)
  const [detail, setDetail] = useState<Trip | null>(null)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}>
          <Plane size={20} style={{ color: C.gold }} /> Tours & Camps
        </h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Year-round trip planning — pre-season blocks, mid-season camps, full international tours.</p>
      </div>

      <div className="flex gap-1 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            style={{ background: 'transparent', borderRadius: 0, color: tab === t.id ? C.gold : C.muted, borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent' }}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pre-season'     && <PreSeasonTab />}
      {tab === 'pre-season'     && <HistorySection title="Previous pre-seasons" trips={PAST_PRESEASONS} onOpen={setDetail} />}
      {tab === 'mid-season'     && <BuilderStrip kind="camp" trips={camps} past={PAST_CAMPS} onOpen={setDetail} onBuild={() => setBuilder('camp')} />}
      {tab === 'mid-season'     && <MidSeasonTab />}
      {tab === 'tours'          && <BuilderStrip kind="tour" trips={tours} past={PAST_TOURS} onOpen={setDetail} onBuild={() => setBuilder('tour')} />}
      {tab === 'tours'          && <ToursTab />}
      {tab === 'logistics'      && <LogisticsTab />}
      {tab === 'commercial'     && <CommercialTab />}
      {tab === 'squad-planning' && <SquadPlanningTab />}

      {builder === 'camp' && <WomensTripBuilder kind="camp" accent={C.primary} drafts={MENS_DRAFTS} medicalHint="Load · injury · availability aware" campLocationDefault="Oakridge Training Complex" onClose={() => setBuilder(null)} onCreate={(c) => { setCamps(prev => [...prev, c]); setBuilder(null); setTab('mid-season'); setDetail(c) }} />}
      {builder === 'tour' && <WomensTripBuilder kind="tour" accent={C.primary} drafts={MENS_DRAFTS} medicalHint="Load · injury · availability aware" campLocationDefault="Oakridge Training Complex" onClose={() => setBuilder(null)} onCreate={(t) => { setTours(prev => [...prev, t]); setBuilder(null); setTab('tours'); setDetail(t) }} />}
      {detail && <WomensTripDetail trip={detail} accent={C.primary} onClose={() => setDetail(null)} />}
    </div>
  )
}
