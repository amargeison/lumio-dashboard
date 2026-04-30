'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
// ─── Rugby v2 dashboard imports ───────────────────────────────────────────
import { THEMES, DENSITY, FONT, getGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  CommandPalette as V2CommandPalette,
  AskLumio as V2AskLumio,
  FixtureDrawer as V2FixtureDrawer,
  Toast as V2Toast,
  useToast as useV2Toast,
  useKey as useV2Key,
} from '@/app/cricket/[slug]/v2/_components/Overlays'
import {
  HeroToday as RugbyHeroToday,
  TodaySchedule as RugbyTodaySchedule,
  StatTiles as RugbyStatTiles,
  AIBrief as RugbyAIBrief,
  Inbox as RugbyInbox,
  Squad as RugbySquadModule,
  Fixtures as RugbyFixturesModule,
  Perf as RugbyPerf,
  Recents as RugbyRecents,
  Season as RugbySeason,
} from './_components/RugbyDashboardModules'
import { RugbySidebar } from './_components/RugbyShell'
import { Icon as V2Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { RUGBY_NAV_GROUPS, RUGBY_ACCENT, RUGBY_INBOX, RUGBY_ORG } from './_lib/rugby-dashboard-data'
import type { RugbyFixture } from './_lib/rugby-dashboard-data'

type RugbyCode = 'union'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface RugbyClub {
  name: string;
  league: string;
  stadium: string;
  capacity: number;
  headCoach: string;
  dor: string;
  ceo: string;
  headMedical: string;
  headWomens: string;
  squadSize: number;
  leaguePosition: number;
  capCeiling: number;
  capFloor: number;
  currentSpend: number;
  franchiseScore: number;
  nextFixture: string;
  nextFixtureDate: string;
  plan: string;
}

// ─── RUGBY ROLES ──────────────────────────────────────────────────────────────
const RUGBY_ROLES = [
  { id: 'player',  label: 'Player',            icon: '🏉', description: 'Full access — your complete rugby OS' },
  { id: 'agent',   label: 'Agent / Manager',   icon: '💼', description: 'Commercial, contracts and schedule' },
  { id: 'coach',   label: 'Coach',             icon: '📋', description: 'Performance, tactics and training' },
  { id: 'physio',  label: 'Physiotherapist',    icon: '⚕️', description: 'Medical, GPS load and recovery' },
  { id: 'sponsor', label: 'Sponsor / Partner',  icon: '🤝', description: 'Brand presence and ROI' },
]

// ─── SIDEBAR ITEMS — replaced by RUGBY_NAV_GROUPS in _lib/rugby-dashboard-data.ts ───

// ─── DEMO CLUB ────────────────────────────────────────────────────────────────
const DEMO_CLUB: RugbyClub = {
  name: 'Hartfield RFC',
  league: 'Champ Rugby',
  stadium: 'The Grange',
  capacity: 4800,
  headCoach: 'Mark Ellison',
  dor: 'Steve Whitfield',
  ceo: 'Caroline Hughes',
  headMedical: 'Dr. James Marsh',
  headWomens: 'Rachel Turner',
  squadSize: 38,
  leaguePosition: 4,
  capCeiling: 2800000,
  capFloor: 1900000,
  currentSpend: 2340000,
  franchiseScore: 71,
  nextFixture: 'vs Jersey Reds (Home)',
  nextFixtureDate: 'Saturday 11 April',
  plan: 'Club Pro+ · £599/mo',
};

// ─── SQUAD DATA ───────────────────────────────────────────────────────────────
const SQUAD: Array<{id:number;name:string;pos:string;status:'available'|'doubtful'|'unavailable';reason:string;readiness:number;returnDate:string;weeklyWage:number;contractEnd:string;intl:boolean;loan:string}> = [
  {id:1,name:'Tom Harrison',pos:'Prop',status:'available',reason:'',readiness:94,returnDate:'',weeklyWage:1800,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:2,name:'James Briggs',pos:'Hooker',status:'available',reason:'',readiness:100,returnDate:'',weeklyWage:2100,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:3,name:'Phil Dowd',pos:'Prop',status:'available',reason:'',readiness:88,returnDate:'',weeklyWage:1200,contractEnd:'Jun 2026',intl:false,loan:'out-Coventry'},
  {id:4,name:'Marcus Webb',pos:'Lock',status:'available',reason:'',readiness:87,returnDate:'',weeklyWage:2500,contractEnd:'Jun 2028',intl:true,loan:''},
  {id:5,name:'Chris Palmer',pos:'Lock',status:'available',reason:'',readiness:91,returnDate:'',weeklyWage:1600,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:6,name:'Danny Foster',pos:'No.8',status:'unavailable',reason:'HIA Protocol — Day 8',readiness:0,returnDate:'19 Apr',weeklyWage:2200,contractEnd:'Jun 2028',intl:true,loan:''},
  {id:7,name:'Karl Foster',pos:'Flanker',status:'available',reason:'',readiness:82,returnDate:'',weeklyWage:1900,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:8,name:'Sam Ellis',pos:'Scrum Half',status:'available',reason:'',readiness:90,returnDate:'',weeklyWage:1400,contractEnd:'Jun 2026',intl:false,loan:'out-Doncaster'},
  {id:9,name:'Danny Cole',pos:'Fly Half',status:'doubtful',reason:'71% readiness — monitoring',readiness:71,returnDate:'',weeklyWage:2300,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:10,name:'Ryan Patel',pos:'Wing',status:'doubtful',reason:'Hamstring Grade 2',readiness:45,returnDate:'18 Apr',weeklyWage:1700,contractEnd:'Jun 2026',intl:false,loan:''},
  {id:11,name:'Jake Rawlings',pos:'Prop',status:'available',reason:'',readiness:86,returnDate:'',weeklyWage:1200,contractEnd:'30 Apr (loan)',intl:false,loan:'in-Bath'},
  {id:12,name:'Connor Walsh',pos:'Fly Half',status:'available',reason:'',readiness:92,returnDate:'',weeklyWage:900,contractEnd:'Season end (loan)',intl:false,loan:'in-Bristol'},
  {id:13,name:'Ben Taylor',pos:'Wing',status:'available',reason:'',readiness:89,returnDate:'',weeklyWage:800,contractEnd:'Season end (loan)',intl:false,loan:'in-Exeter'},
  {id:14,name:'Karl Briggs',pos:'Hooker',status:'unavailable',reason:'Shoulder — post-op',readiness:0,returnDate:'2 May',weeklyWage:1500,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:15,name:'Matt Jones',pos:'Centre',status:'available',reason:'',readiness:93,returnDate:'',weeklyWage:1800,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:16,name:'Luke Barnes',pos:'Fullback',status:'available',reason:'',readiness:95,returnDate:'',weeklyWage:2000,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:17,name:'Josh White',pos:'Flanker',status:'available',reason:'',readiness:88,returnDate:'',weeklyWage:1600,contractEnd:'Jun 2026',intl:false,loan:''},
  {id:18,name:'David Obi',pos:'Centre',status:'available',reason:'',readiness:91,returnDate:'',weeklyWage:1700,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:19,name:'Callum Reeves',pos:'Wing',status:'available',reason:'',readiness:87,returnDate:'',weeklyWage:1300,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:20,name:'Oliver Grant',pos:'Scrum Half',status:'available',reason:'',readiness:90,returnDate:'',weeklyWage:1500,contractEnd:'Jun 2027',intl:false,loan:''},
];

const FRANCHISE_CRITERIA = [
  {name:'Rugby Excellence',score:88,status:'GREEN' as const,details:'League position: 4th ✓ | International players: 3 ✓ | Academy graduates: 4 ✓ | Quality index: 81 ✓'},
  {name:'Operating Standards',score:65,status:'AMBER' as const,details:'Compliance: ✓ | Stadium: ✓ (4,800) | Matchday assessment: ⚠ Due Jun 2026 | Digital: ⚠ Refresh needed'},
  {name:'Financial Sustainability',score:82,status:'GREEN' as const,details:'Break-even ✓ | Wage ratio: 71% (below 75%) ✓ | 3-year projection ✓ | Revenue diversified ✓'},
  {name:'Investment Capacity',score:48,status:'RED' as const,details:'Investment evidence: ✗ Incomplete | Due diligence pack: ✗ Not prepared | Board governance: ✓'},
  {name:'Community Impact',score:79,status:'GREEN' as const,details:'Grassroots: £28k (25.4%) ✓ | Schools: 12 (840 participants) ✓ | Events: 8 ✓'},
  {name:'Women\'s Game',score:42,status:'RED' as const,details:'PWR team: ✗ Not registered | Regional plan: ✗ Not submitted | Community women\'s: ✓'},
];

const SPONSORS = [
  {name:'Hartfield Building Society',type:'Shirt sponsor',value:85000,renewal:'June 2026',status:'active' as const,obligations:'Logo on shirt, 4 hospitality boxes, monthly newsletter'},
  {name:'Hartfield Motors',type:'Training kit',value:22000,renewal:'December 2026',status:'active' as const,obligations:'Logo on training kit, 1 player appearance/month'},
  {name:'County Council',type:'Community sponsor',value:18000,renewal:'March 2027',status:'active' as const,obligations:'Community match programme, annual report'},
  {name:'Smith & Sons Construction',type:'Ground naming',value:35000,renewal:'Year 2 of 3',status:'active' as const,obligations:'"The Grange — Smith & Sons Arena"'},
  {name:'Regional Law',type:'Stand naming',value:12000,renewal:'Year 2 of 3',status:'active' as const,obligations:'Stand naming rights'},
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const fmt = (n: number): string => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);

const StatCard = ({label,value,sub,color='purple'}:{label:string;value:string|number;sub?:string;color?:string}) => {
  const colorMap: Record<string,string> = {
    purple:'from-purple-600/20 to-purple-900/10 border-purple-600/20',
    teal:'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange:'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:'from-green-600/20 to-green-900/10 border-green-600/20',
    red:'from-red-600/20 to-red-900/10 border-red-600/20',
    yellow:'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]||colorMap.purple} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub&&<div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

const SectionHeader = ({title,subtitle,icon}:{title:string;subtitle?:string;icon?:string}) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon&&<span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {subtitle&&<p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

const StatusPill = ({status}:{status:'GREEN'|'AMBER'|'RED'|string}) => {
  const c = status==='GREEN'?'bg-green-600/20 text-green-400 border-green-600/30':status==='AMBER'?'bg-amber-600/20 text-amber-400 border-amber-600/30':'bg-red-600/20 text-red-400 border-red-600/30';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${c}`}>{status}</span>;
};

const Card = ({children,className=''}:{children:React.ReactNode;className?:string}) => (
  <div className={`bg-[#0d1117] border border-gray-800 rounded-xl p-5 ${className}`}>{children}</div>
);

const QuickActionsBar = () => {
  const actions = ['Log Training','Match Report','Cap Check','Medical Review','Sponsor Post','Selection','Scouting','Travel','AI Briefing','Compliance'];
  return (
    <div className="mb-6 overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 px-1 min-w-max">
        {actions.map((a:string,i:number)=>(
          <button key={i} className="bg-[#0d1117] border border-gray-800 hover:border-purple-500/50 rounded-full px-4 py-2 text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">{a}</button>
        ))}
      </div>
    </div>
  );
};

// ─── CLUB DASHBOARD VIEW (v2 modular grid + polish) ──────────────────────────
// Quick Actions row (8 modal-opening buttons + Ask Lumio) · v2 grid (HeroToday ·
// TodaySchedule · StatTiles · Morning brief · Interactive Inbox · Squad 15+8 ·
// Fixtures · Perf signals · Recents · Season) · Match Brief overlay from
// HeroToday. No tab bar — rugby v1 didn't have tabs.

type RugbyInboxBody = { body: string }
const RUGBY_INBOX_BODIES: Record<string, RugbyInboxBody> = {
  'SMS · Coaches':     { body: 'Evans: confirm Saturday XV please — need to submit team sheet to Cherry Rugby by 12:00 Friday. Henderson cleared, Williams still on protocol. Bench spots TBC. Ring me after the unit session.' },
  'WhatsApp · Squad':  { body: 'Karan: pitch looks firm, studs 13mm should be fine. Groundsman confirmed no covers needed overnight. Bus leaves Friday 17:30 from the Grange — usual.' },
  'Email · Selectors': { body: 'Henderson completed full contact session Tuesday — moved well, no reaction. Recommend start at 12. Open question on whether Cole goes to bench or carries into 22 vs Bath next week.' },
  'Agent messages':    { body: 'Patel contract renewal — wants 2-year extension, +£200/wk, performance bonus restructured. Current terms expire June. Board needs decision this month — competing offer reportedly on the table.' },
  'Board messages':    { body: 'Caroline: Q3 financials filed. Cap return due 10 May. Investment pack signed off legally — ready for distribution. Quick chat re: PWR registration budget Wednesday morning?' },
  'Medical Hub':       { body: 'Dr Marsh: Williams concussion Day 4 of 6 — symptom-free, baseline test scheduled Thursday AM. Earliest contact return Friday if cleared. Still need scan results from Trescott (ankle).' },
  'Media & Press':     { body: 'Northbridge Sport — pre-match feature requested with you + captain Friday 14:00, runs in Saturday matchday programme. 12 minutes max. Talking points coming through this afternoon.' },
  'Academy':           { body: 'Okonkwo — England U20 confirmed call-up for Six Nations summer camp. Need release from us by Wednesday. Replacement pathway: Foley already up training with seniors, ready to step in.' },
  'Slack · Coaches':   { body: 'Forwards group: new lineout call (Echo-2) — front ball to 4, dummy peel from 6. Working well in unit session. Suggest we run it twice in warm-up before deciding to deploy.' },
}

function RugbyMatchBriefPanel({ T, accent, open, onClose }: { T: typeof THEMES.dark; accent: typeof RUGBY_ACCENT; open: boolean; onClose: () => void }) {
  if (!open) return null
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, fontFamily: FONT, color: T.text }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>Match Brief</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Hartfield RFC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> Jersey Reds</h2>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4 }}>Cherry Rugby · Round 22</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>Sat 11 Apr 2026 · The Grange · Kick-off 15:00</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>Close</button>
        </div>

        <Section title="01 · Conditions">
          <div><strong style={{ color: T.text }}>Weather:</strong> 12°C partly cloudy, 14 mph SW wind.</div>
          <div><strong style={{ color: T.text }}>Pitch:</strong> Natural grass, well-drained, firm underfoot.</div>
          <div><strong style={{ color: T.text }}>Wind factor:</strong> Kicking to the north end first half recommended (wind advantage).</div>
          <div><strong style={{ color: T.text }}>Referee:</strong> J. Hawthorne — strict on breakdown penalties, average 14 penalties/match.</div>
        </Section>

        <Section title="02 · Opposition Analysis · Jersey Reds">
          <div><strong style={{ color: T.text }}>Position:</strong> 7th in Cherry Rugby. <strong style={{ color: T.text }}>Last 5:</strong> W L W L L — inconsistent form.</div>
          <div style={{ marginTop: 8, color: T.text }}>Key threats:</div>
          <ul style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Fly-half <strong>M. Torres</strong> — kicks at 82%, controls tempo, dangerous from hand in broken play.</li>
            <li>Openside flanker <strong>D. Kamara</strong> — 14 turnovers last 3 matches, targets the breakdown aggressively.</li>
            <li>Tighthead prop <strong>V. Moala</strong> — dominant scrummager, concedes few penalties at set piece.</li>
          </ul>
          <div style={{ marginTop: 8 }}><strong style={{ color: T.text }}>Weakness:</strong> Lineout defence 64% steal rate — worst in league. Target lineout as primary attacking platform.</div>
        </Section>

        <Section title="03 · Our Team News">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li><strong style={{ color: T.text }}>Henderson:</strong> cleared by physio, available for selection — start or bench?</li>
            <li><strong style={{ color: T.text }}>Williams:</strong> concussion protocol Day 4 of 6 — cannot train contact until Thursday. Unavailable Saturday.</li>
            <li><strong style={{ color: T.text }}>Okonkwo:</strong> called to England U20 camp — confirm release by Wed.</li>
            <li><strong style={{ color: T.text }}>Front row rotation:</strong> Forwards coach recommends starting Clarke at loosehead, Fischer off the bench at 55 mins.</li>
          </ul>
        </Section>

        <Section title="04 · Tactical Priorities">
          <ol style={{ paddingLeft: 22, margin: 0, listStyle: 'decimal' }}>
            <li>Target Jersey lineout (64% steal rate) — throw to tail, drive or peel.</li>
            <li>Kicking strategy: territorial in first half with wind, counter-attack second half.</li>
            <li>Breakdown speed: commit minimum bodies, Kamara hunts slow ball — ruck in under 2 seconds.</li>
            <li>Scrum: bind tight on engagement, referee strict on timing.</li>
            <li>Set piece try target: 2 lineout drives in opposition 22.</li>
          </ol>
        </Section>

        <Section title="05 · Logistics">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li>Kit van: confirmed 08:00, all GPS vests charged.</li>
            <li>Warm-up: 14:15 on main pitch.</li>
            <li>Media: Northbridge Sport cameras from 14:00, post-match interview with captain + DoR.</li>
            <li>Medical: Dr Patel pitchside, ambulance confirmed.</li>
          </ul>
        </Section>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text3, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
          Generated by Lumio · Match intelligence · Confidential
        </div>
      </div>
    </div>
  )
}

function InteractiveRugbyInbox({ T, accent, density }: { T: typeof THEMES.dark; accent: typeof RUGBY_ACCENT; density: typeof DENSITY.regular }) {
  type RowState = { expanded: boolean; mode: 'idle' | 'replying' | 'forwarding'; reply: string; forwardTo: string; sentLabel: string | null; dismissed: boolean }
  const init = (): Record<string, RowState> => Object.fromEntries(RUGBY_INBOX.map(c => [c.ch, { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }]))
  const [state, setState] = useState<Record<string, RowState>>(init)
  const update = (ch: string, patch: Partial<RowState>) => setState(s => ({ ...s, [ch]: { ...s[ch], ...patch } }))

  const items = RUGBY_INBOX.filter(c => !state[c.ch]?.dismissed)
  return (
    <div style={{ gridColumn: '6 / span 4', position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inbox</div>
        <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: 'monospace' }}>{items.length} · click to expand</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflow: 'auto' }}>
        {items.map((c, i) => {
          const s = state[c.ch] ?? { expanded: false, mode: 'idle', reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }
          const body = RUGBY_INBOX_BODIES[c.ch]?.body ?? c.last
          return (
            <div key={c.ch} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              {/* Row */}
              <div onClick={() => update(c.ch, { expanded: !s.expanded, mode: 'idle' })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{c.ch}</div>
                  <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                </div>
                <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace' }}>{c.time}</div>
                <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
              </div>
              {/* Expanded */}
              {s.expanded && (
                <div style={{ padding: '6px 6px 12px 22px' }}>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, padding: 10, background: T.panel2, borderRadius: 6, border: `1px solid ${T.border}` }}>
                    {body}
                  </div>
                  {s.sentLabel && (
                    <div style={{ marginTop: 6, fontSize: 11, color: T.good, fontFamily: 'monospace' }}>{s.sentLabel}</div>
                  )}
                  {s.mode === 'idle' && !s.sentLabel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => update(c.ch, { mode: 'replying' })}   style={btnGhost(T, accent)}>Reply</button>
                      <button onClick={() => update(c.ch, { mode: 'forwarding' })} style={btnGhost(T, accent)}>Forward</button>
                      <button onClick={() => update(c.ch, { dismissed: true })}    style={btnGhost(T, accent)}>Dismiss</button>
                    </div>
                  )}
                  {s.mode === 'replying' && (
                    <div style={{ marginTop: 8 }}>
                      <textarea value={s.reply} onChange={e => update(c.ch, { reply: e.target.value })}
                        placeholder="Type your reply…"
                        rows={3}
                        style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12, fontFamily: FONT, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '', sentLabel: 'Sent ✓' })} style={btnPrimary(accent, T)}>Send</button>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '' })}                       style={btnGhost(T, accent)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {s.mode === 'forwarding' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>Forward to:</span>
                      <select value={s.forwardTo} onChange={e => update(c.ch, { forwardTo: e.target.value })}
                        style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontFamily: FONT }}>
                        <option>Head Coach</option>
                        <option>Forwards Coach</option>
                        <option>Backs Coach</option>
                        <option>Medical Lead</option>
                        <option>CEO</option>
                        <option>Performance Analyst</option>
                      </select>
                      <button onClick={() => update(c.ch, { mode: 'idle', sentLabel: `Forwarded to ${s.forwardTo} ✓` })} style={btnPrimary(accent, T)}>Forward</button>
                      <button onClick={() => update(c.ch, { mode: 'idle' })} style={btnGhost(T, accent)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>Inbox cleared.</div>}
      </div>
    </div>
  )
}
function btnGhost(T: typeof THEMES.dark, accent: typeof RUGBY_ACCENT): React.CSSProperties {
  return { fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#9CA3AF', border: '1px solid #2d3139', borderRadius: 6, cursor: 'pointer', transition: 'border-color .12s, color .12s' }
}
function btnPrimary(accent: typeof RUGBY_ACCENT, T: typeof THEMES.dark): React.CSSProperties {
  return { fontSize: 11.5, padding: '5px 12px', background: accent.hex, color: T.btnText, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }
}


type RugbyDashTab = 'gettingstarted' | 'today' | 'quickwins' | 'dailytasks' | 'insights' | 'dontmiss' | 'team'

// Club leadership panel for the Team tab — values match the demo club
// (Hartfield RFC) defined at the top of this file so the names line up
// with everything else the user sees in the portal.
function TeamLeadershipPanel() {
  const leadership = [
    { name: 'Steve Whitfield',  role: 'Director of Rugby',          icon: '🏉' },
    { name: 'Mark Ellison',     role: 'Head Coach',                 icon: '🎽' },
    { name: 'Caroline Hughes',  role: 'CEO',                        icon: '🏛️' },
    { name: 'Dr. James Marsh',  role: 'Head of Medical',            icon: '🏥' },
    { name: 'Rachel Turner',    role: "Head of Women's Rugby",       icon: '⭐' },
  ]
  return (
    <Card>
      <div className="text-sm font-semibold text-white mb-3">Club Leadership</div>
      <div className="space-y-2">
        {leadership.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
            <span className="text-lg">{p.icon}</span>
            <div>
              <div className="text-xs text-white font-medium">{p.name}</div>
              <div className="text-[10px] text-gray-500">{p.role}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

const RUGBY_GETTING_STARTED: { id: string; label: string; desc: string }[] = [
  { id: 'gs1',  label: 'Upload your club badge',                                            desc: 'Personalise your portal' },
  { id: 'gs2',  label: 'Set your club name and league',                                     desc: 'Appears throughout the portal' },
  { id: 'gs3',  label: 'Enter salary cap figures',                                          desc: 'Enables cap dashboard and compliance tracking' },
  { id: 'gs4',  label: 'Add your squad (player list)',                                      desc: 'Unlocks availability, GPS, medical and selection views' },
  { id: 'gs5',  label: 'Connect GPS provider (Lumio GPS)',                                   desc: 'Live load data feed' },
  { id: 'gs6',  label: 'Enter franchise readiness data',                                    desc: 'Tracks your progress against governing body criteria' },
  { id: 'gs7',  label: 'Add sponsor details',                                               desc: 'Commercial CRM and obligation tracking' },
  { id: 'gs8',  label: 'Set up AI briefing preferences',                                    desc: 'Configure role-specific daily intelligence' },
  { id: 'gs9',  label: 'Add international duty players',                                    desc: 'Club-to-country data handoff' },
  { id: 'gs10', label: 'Invite your coaching and medical staff',                             desc: 'Role-based access control' },
]

function ClubDashboardView({ onOpenModal, onNavigate }: { onOpenModal: (id: string) => void; onNavigate?: (section: string) => void }) {
  const T       = THEMES.dark
  const accent  = RUGBY_ACCENT
  const density = DENSITY.regular
  const greeting = getGreeting('matchday')

  const [openFixture, setOpenFixture] = useState<RugbyFixture | null>(null)
  const [cmdOpen,     setCmdOpen]     = useState(false)
  const [askOpen,     setAskOpen]     = useState(false)
  const [briefOpen,   setBriefOpen]   = useState(false)
  const [dashToast,   showDashToast]  = useV2Toast()

  // Tab system restored from rugby v1 — same pattern across all Lumio
  // sport portals (cricket / tennis / darts / etc). 'today' renders the
  // v2 dashboard grid; other tabs render their v1 content recovered from
  // commit 43c7eadb. The rich role-based <InsightsView /> is reached via
  // the sidebar nav, NOT this dashboard tab — these two namespaces both
  // existed in v1 and we keep them separate.
  const [dashTab, setDashTab] = useState<RugbyDashTab>('today')
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_rugby_checklist') : null; return s ? JSON.parse(s) as Record<string, boolean> : {} } catch { return {} }
  })
  const toggleCheck = (id: string) => setChecklist(prev => {
    const next = { ...prev, [id]: !prev[id] }
    try { localStorage.setItem('lumio_rugby_checklist', JSON.stringify(next)) } catch { /* private mode etc */ }
    return next
  })
  const completedCount  = RUGBY_GETTING_STARTED.filter(g => checklist[g.id]).length
  const remainingCount  = RUGBY_GETTING_STARTED.length - completedCount

  useV2Key('cmdk', () => setCmdOpen(o => !o))

  // ── Quick Actions — full v1 set (8 buttons) plus team-sport extensions
  // wired into existing sidebar destinations. "Match brief" intentionally
  // NOT here — it lives in the hero panel. Removed: Flights and Visa Check
  // (individual-athlete actions; the club has logistics + ops staff). Each
  // button either opens an existing modal renderer (defined further down
  // in this file) or navigates to an existing sidebar section.
  const QUICK_ACTIONS: { icon: string; label: string; ai?: boolean; onClick: () => void }[] = [
    { icon: '🎯', label: 'Match Prep',     ai: true, onClick: () => onOpenModal('matchprep') },
    { icon: '🏉', label: 'Selection',                onClick: () => onNavigate?.('selection') },
    { icon: '📱', label: 'Sponsor Post',   ai: true, onClick: () => onOpenModal('sponsorpost') },
    { icon: '⚕️', label: 'Log Injury',               onClick: () => onOpenModal('injury') },
    { icon: '🏋️', label: 'Log Training',             onClick: () => onNavigate?.('training-planner') },
    { icon: '🏥', label: 'Medical Review',           onClick: () => onNavigate?.('medical') },
    { icon: '💰', label: 'Cap Check',                onClick: () => onNavigate?.('capdashboard') },
    { icon: '🔍', label: 'Scouting',                 onClick: () => onNavigate?.('scouting') },
    { icon: '🌅', label: 'AI Briefing',    ai: true, onClick: () => onNavigate?.('dorbriefing') },
    { icon: '🤖', label: 'Halftime Brief', ai: true, onClick: () => onNavigate?.('halftime') },
    { icon: '🎬', label: 'Video',                    onClick: () => onOpenModal('video') },
    { icon: '📋', label: 'Contracts',                onClick: () => onOpenModal('contracts') },
    { icon: '💼', label: 'Agent Brief',    ai: true, onClick: () => onNavigate?.('agents') },
    { icon: '🧾', label: 'Expense',                  onClick: () => onOpenModal('expense') },
    { icon: '✨', label: 'Ask Lumio',      ai: true, onClick: () => setAskOpen(true) },
  ]

  return (
    <>
      <style jsx global>{`
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes cricketV2PulseDim   { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
        @keyframes cricketV2FadeUp     { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideLeft  { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideUp    { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translate(-50%, 0) } }
      `}</style>
      {/* Hero banner — match-day context, persistent across tabs.
          Mirrors cricket v1's hero wrapper exactly: own padded block with
          marginBottom: density.gap, NOT inside a flex-column container.
          Previously the hero was inside a single flex-column wrapper which
          stacked outer padding (14) + flex gap (14) + inner Card padding
          (16) creating extra vertical space the cricket layout doesn't have. */}
      <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, marginBottom: density.gap }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <RugbyHeroToday
            T={T} accent={accent} density={density} greeting={greeting}
            onConfirm={() => showDashToast('Starting XV confirmed · squad notified')}
            onAsk={() => setAskOpen(true)}
            onMatchBrief={() => setBriefOpen(true)}
          />
          <RugbyTodaySchedule T={T} accent={accent} density={density} />
        </div>
      </div>

      <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: density.gap }}>

        {/* Tab bar — restored from rugby v1, styled to match v2 aesthetic
            (clean text labels + monochrome Lucide icons + accent underline). */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          borderBottom: `1px solid ${T.border}`, overflowX: 'auto',
        }}>
          {([
            { id: 'gettingstarted', label: 'Getting Started', icon: 'sparkles', badge: remainingCount > 0 ? remainingCount : undefined },
            { id: 'today',          label: 'Today',           icon: 'home' },
            { id: 'quickwins',      label: 'Quick Wins',      icon: 'lightning' },
            { id: 'dailytasks',     label: 'Daily Tasks',     icon: 'check' },
            { id: 'insights',       label: 'Insights',        icon: 'bars' },
            { id: 'dontmiss',       label: "Don't Miss",      icon: 'flag' },
            { id: 'team',           label: 'Team',            icon: 'people' },
          ] as { id: RugbyDashTab; label: string; icon: string; badge?: number }[]).map(t => {
            const active = dashTab === t.id
            return (
              <button key={t.id} onClick={() => setDashTab(t.id)}
                style={{
                  appearance: 'none', border: 0, background: 'transparent',
                  padding: '10px 14px',
                  fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
                  color: active ? '#fff' : T.text3,
                  borderBottom: `2px solid ${active ? accent.hex : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  transition: 'color .12s, border-color .12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text2 }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.text3 }}>
                <V2Icon name={t.icon} size={12} stroke={1.6} />
                {t.label}
                {t.badge !== undefined && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 9,
                    background: T.hover, color: T.text3,
                    border: `1px solid ${T.border}`,
                    fontFamily: 'var(--font-geist-mono, monospace)',
                  }}>{t.badge}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Quick Actions — desaturated row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((qa, i) => (
            <button key={i} onClick={qa.onClick}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2d3139'; e.currentTarget.style.color = '#9CA3AF' }}
              style={{
                appearance: 'none', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid #2d3139',
                color: '#9CA3AF', fontSize: 12, fontFamily: FONT, cursor: 'pointer',
                transition: 'border-color .12s, color .12s',
              }}>
              <span style={{ fontSize: 13 }}>{qa.icon}</span>
              <span>{qa.label}</span>
              {qa.ai && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#1F2937', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>AI</span>
              )}
            </button>
          ))}
        </div>

        {/* TODAY tab — full v2 dashboard grid (hero is rendered above for
            all tabs; this block holds the rest of the today layout). */}
        {dashTab === 'today' && (
          <>
            {/* Row 2 — Stat tiles */}
            <RugbyStatTiles T={T} accent={accent} density={density} />

            {/* Row 3 — Morning brief + Inbox + Squad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <RugbyAIBrief T={T} accent={accent} density={density} onAsk={() => setAskOpen(true)} />
              <InteractiveRugbyInbox T={T} accent={accent} density={density} />
              <RugbySquadModule T={T} accent={accent} density={density} />
            </div>

            {/* Row 4 — Fixtures + Performance signals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <RugbyFixturesModule T={T} accent={accent} density={density} onPick={f => setOpenFixture(f)} />
              <RugbyPerf           T={T} accent={accent} density={density} />
            </div>

            {/* Row 5 — Recents + Season */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <RugbyRecents T={T} accent={accent} density={density} />
              <RugbySeason  T={T} accent={accent} density={density} />
            </div>
          </>
        )}

        {/* GETTING STARTED tab — 10-step onboarding checklist */}
        {dashTab === 'gettingstarted' && (
          <Card>
            <div className="text-sm font-semibold text-white mb-1">Getting Started — {completedCount}/{RUGBY_GETTING_STARTED.length} complete</div>
            <div className="text-xs text-gray-500 mb-4">Set up your portal · 10 steps</div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${(completedCount / RUGBY_GETTING_STARTED.length) * 100}%` }} />
            </div>
            <div className="space-y-2">
              {RUGBY_GETTING_STARTED.map(g => (
                <button key={g.id} onClick={() => toggleCheck(g.id)}
                  className={`w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all ${checklist[g.id] ? 'border-green-600/30 bg-green-600/5' : 'border-gray-800 hover:border-gray-700'}`}>
                  <span className={`text-xs ${checklist[g.id] ? 'text-green-400' : 'text-gray-600'}`}>{checklist[g.id] ? '✓' : '○'}</span>
                  <div>
                    <div className={`text-xs font-medium ${checklist[g.id] ? 'text-gray-500 line-through' : 'text-white'}`}>{g.label}</div>
                    <div className="text-[10px] text-gray-600">{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* QUICK WINS tab — high-impact short-effort tasks */}
        {dashTab === 'quickwins' && (
          <div className="space-y-3">
            {[
              { icon: '📋', title: 'Complete franchise documentation for Investment Capacity criterion', action: 'Start', impact: 'high'   as const, effort: '15min', category: 'Franchise',   description: 'Investment Capacity criterion needs documentation — Caroline Hughes waiting.' },
              { icon: '🤝', title: 'Schedule Hartfield Building Society renewal meeting',              action: 'Book',  impact: 'high'   as const, effort: '5min',  category: 'Sponsor',     description: 'Renewal due June 2026. Early meeting secures better terms.' },
              { icon: '📡', title: 'Review GPS overload flags before Thursday session',                action: 'View',  impact: 'medium' as const, effort: '5min',  category: 'Performance', description: '3 players flagged with high ACWR — review before training.' },
            ].map((w, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: w.impact === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: w.impact === 'high' ? '#EF4444' : '#F59E0B' }}>{w.impact === 'high' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#7C3AED1a', color: '#c084fc' }}>⏱ {w.effort}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{w.category}</span>
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{w.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{w.description}</p>
                    <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: Club systems</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#7C3AED' }}>{w.action} →</button>
                    <button className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DAILY TASKS tab — today's schedule with priority tags */}
        {dashTab === 'dailytasks' && (
          <div className="space-y-3">
            {[
              { time: '10:00', task: 'Team meeting — game plan finalised',     cat: 'Coaching',   priority: 'high'   as const },
              { time: '11:00', task: 'Pre-match press conference',              cat: 'Media',      priority: 'medium' as const },
              { time: '14:00', task: 'Medical reviews — Foster, Patel, Cole',  cat: 'Medical',    priority: 'high'   as const },
              { time: '16:00', task: 'Sponsor call — Hartfield Building Society', cat: 'Commercial', priority: 'medium' as const },
            ].map((t, i) => (
              <div key={i} className="rounded-xl p-4 flex items-start gap-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <button className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ borderColor: '#4B5563' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: t.priority === 'high' ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)', color: t.priority === 'high' ? '#F97316' : '#F59E0B' }}>{t.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.cat}</span>
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{t.time}</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: '#E5E7EB' }}>{t.task}</h4>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#7C3AED' }}>Open →</button>
                  <button className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INSIGHTS tab — quick-glance bullets (NOT the rich role InsightsView,
            which is a separate sidebar destination) */}
        {dashTab === 'insights' && (
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Key Insights</div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2 py-1.5 border-b border-gray-800/50"><span className="text-green-400">↑</span><span className="text-gray-300">Tackle success rate improved 4% over last 3 games</span></div>
              <div className="flex gap-2 py-1.5 border-b border-gray-800/50"><span className="text-red-400">↓</span><span className="text-gray-300">Scrum penalty rate increasing — 3 in last match</span></div>
              <div className="flex gap-2 py-1.5 border-b border-gray-800/50"><span className="text-green-400">↑</span><span className="text-gray-300">Matchday revenue up 8% vs same fixture last season</span></div>
              <div className="flex gap-2 py-1.5"><span className="text-amber-400">→</span><span className="text-gray-300">Franchise score static at 71% — needs Investment Capacity action</span></div>
            </div>
            <div className="text-[10px] text-gray-600 mt-4">For role-based deep-dive intelligence, open the Insights item in the sidebar.</div>
          </Card>
        )}

        {/* DON'T MISS tab — urgent deadlines */}
        {dashTab === 'dontmiss' && (
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Don&apos;t Miss</div>
            <div className="space-y-2 text-xs">
              <div className="bg-red-600/5 border border-red-600/30 rounded-lg p-3"><span className="text-red-400 font-bold">URGENT:</span> Women&apos;s PWR registration deadline — 30 April (24 days)</div>
              <div className="bg-amber-600/5 border border-amber-600/30 rounded-lg p-3"><span className="text-amber-400 font-bold">DUE SOON:</span> Salary cap return — 10 May (34 days)</div>
              <div className="bg-amber-600/5 border border-amber-600/30 rounded-lg p-3"><span className="text-amber-400 font-bold">RENEWAL:</span> Hartfield Building Society sponsorship — June 2026</div>
            </div>
          </Card>
        )}

        {/* TEAM tab — club leadership */}
        {dashTab === 'team' && <TeamLeadershipPanel />}

        <div style={{ padding: '6px 0 8px', display: 'flex', gap: 14, fontSize: 10.5, color: T.text3, justifyContent: 'center' }}>
          <span>⌘K command palette</span><span>·</span><span>esc close overlays</span>
        </div>
      </div>

      <V2CommandPalette T={T} accent={accent} open={cmdOpen} onClose={() => setCmdOpen(false)} onAskLumio={() => { setCmdOpen(false); setAskOpen(true) }} />
      <V2AskLumio       T={T} accent={accent} open={askOpen} onClose={() => setAskOpen(false)} />
      <V2FixtureDrawer  T={T} accent={accent} fixture={openFixture as unknown as never} onClose={() => setOpenFixture(null)} />
      <V2Toast          T={T} accent={accent} msg={dashToast} />
      <RugbyMatchBriefPanel T={T} accent={accent} open={briefOpen} onClose={() => setBriefOpen(false)} />
    </>
  )
}

// ─── INSIGHTS VIEW ──────────────────────────────────────────────────────────
// ─── Insights helpers — small SVG charts + status helpers ───────────────────
// All inline SVG, dark-theme, deterministic. Used only inside InsightsView.

const INSIGHTS_ACCENT = '#7C3AED'
type RAG = 'GREEN' | 'AMBER' | 'RED'
const ragHex = (s: RAG) => s === 'GREEN' ? '#22C55E' : s === 'AMBER' ? '#F59E0B' : '#EF4444'
const ragBg  = (s: RAG) => s === 'GREEN' ? 'bg-green-600/15 text-green-400 border-green-600/30'
                          : s === 'AMBER' ? 'bg-amber-600/15 text-amber-400 border-amber-600/30'
                          : 'bg-red-600/15 text-red-400 border-red-600/30'
const trendArrow = (t: 'up' | 'down' | 'flat') =>
  t === 'up' ? <span className="text-green-400">↑</span>
  : t === 'down' ? <span className="text-red-400">↓</span>
  : <span className="text-gray-500">→</span>

function ProgressBar({ value, max = 100, color = INSIGHTS_ACCENT, height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .3s' }} />
    </div>
  )
}

function BarChart({ values, labels, max, height = 120, color = INSIGHTS_ACCENT, target }: {
  values: number[]; labels?: string[]; max?: number; height?: number; color?: string; target?: number
}) {
  const m = max ?? Math.max(...values, 1)
  const w = 600, padL = 28, padB = 22
  const innerW = w - padL - 12, innerH = height - padB - 8
  const barW = innerW / values.length - 4
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" style={{ maxHeight: height + 8 }}>
      {target !== undefined && (() => {
        const ty = 8 + innerH - (target / m) * innerH
        return <line x1={padL} y1={ty} x2={padL + innerW} y2={ty} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" />
      })()}
      {values.map((v, i) => {
        const x = padL + i * (barW + 4) + 2
        const h = (v / m) * innerH
        const y = 8 + innerH - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="#F9FAFB">{v}</text>
            {labels && <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="#6B7280">{labels[i]}</text>}
          </g>
        )
      })}
      {[0, 0.5, 1].map(p => {
        const y = 8 + innerH - p * innerH
        return <line key={p} x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="rgba(255,255,255,0.04)" />
      })}
    </svg>
  )
}

function Sparkline({ values, color = INSIGHTS_ACCENT, height = 36, width = 120 }: { values: number[]; color?: string; height?: number; width?: number }) {
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const path = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 4) + 2
    const y = height - 4 - ((v - min) / range) * (height - 8)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </svg>
  )
}

function LineChart({ values, labels, max, min = 0, color = INSIGHTS_ACCENT, height = 160, width = 600 }: {
  values: number[]; labels?: string[]; max?: number; min?: number; color?: string; height?: number; width?: number
}) {
  const m = max ?? Math.max(...values, 1)
  const padX = 32, padB = 22
  const innerW = width - padX - 12, innerH = height - padB - 14
  const path = values.map((v, i) => {
    const x = padX + (i / (values.length - 1 || 1)) * innerW
    const y = 12 + innerH - ((v - min) / (m - min)) * innerH
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: height + 4 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = 12 + innerH - p * innerH
        return (
          <g key={p}>
            <line x1={padX} y1={y} x2={padX + innerW} y2={y} stroke="rgba(255,255,255,0.04)" />
            <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#6B7280">{Math.round((m - min) * p + min)}</text>
          </g>
        )
      })}
      <path d={path} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {values.map((v, i) => {
        const x = padX + (i / (values.length - 1 || 1)) * innerW
        const y = 12 + innerH - ((v - min) / (m - min)) * innerH
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={color} />
            <text x={x} y={y - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#F9FAFB">{v}</text>
            {labels && <text x={x} y={height - 6} textAnchor="middle" fontSize={9} fill="#6B7280">{labels[i]}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function Donut({ data, size = 120 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  const r = size / 2 - 10
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14} />
        {data.map((d, i) => {
          const len = (d.value / total) * circ
          const dash = `${len} ${circ - len}`
          const dashOffset = -offset
          offset += len
          return (
            <circle key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={d.color} strokeWidth={14}
              strokeDasharray={dash} strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          )
        })}
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize={14} fontWeight={800} fill="#F9FAFB">{total}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize={9} fill="#9CA3AF">total</text>
      </svg>
      <div className="space-y-1.5 text-xs">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-gray-300">{d.label}</span>
            <span className="text-gray-500 ml-auto font-mono">{d.value}</span>
            <span className="text-gray-600 text-[10px] w-10 text-right font-mono">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0d1117] border border-gray-800/60 rounded-xl p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <div className="text-sm font-bold text-white">{title}</div>}
          {subtitle && <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function KpiCard({ label, value, sub, accent = INSIGHTS_ACCENT, trend, trendValue }: {
  label: string; value: string | number; sub?: string; accent?: string
  trend?: 'up' | 'down' | 'flat'; trendValue?: string
}) {
  return (
    <div className="bg-[#0d1117] border border-gray-800/60 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
        {trend && (
          <span className="text-[10px] font-mono">
            {trendArrow(trend)} <span className="text-gray-500">{trendValue}</span>
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Insights View — 8 role dashboards, each rich with charts/tables ──────

function InsightsView({club, activeRole: activeRoleProp = 'dor'}:{club:RugbyClub; activeRole?: string}) {
  const [localRole, setLocalRole] = useState(activeRoleProp);
  const activeRole = localRole;
  const setActiveRole = setLocalRole;
  const roles = [
    { id: 'dor',         label: 'Director of Rugby', icon: '🏉' },
    { id: 'coach',       label: 'Head Coach',        icon: '🎽' },
    { id: 'medical',     label: 'Head of Medical',   icon: '🏥' },
    { id: 'recruitment', label: 'Recruitment',       icon: '🔍' },
    { id: 'academy',     label: 'Academy',           icon: '🎓' },
    { id: 'analysis',    label: 'Analysis',          icon: '🎬' },
    { id: 'commercial',  label: 'Commercial',        icon: '💼' },
    { id: 'ceo',         label: 'CEO / Chairman',    icon: '🏛️' },
  ]

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Insights" subtitle="Role-specific dashboards — 8 views" />
      <div className="flex gap-1 border-b border-gray-800 pb-0 overflow-x-auto">
        {roles.map(r => (
          <button key={r.id} onClick={() => setActiveRole(r.id)}
            className="px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{
              borderBottomColor: activeRole === r.id ? INSIGHTS_ACCENT : 'transparent',
              color: activeRole === r.id ? '#c084fc' : '#6B7280',
              backgroundColor: activeRole === r.id ? '#7C3AED0d' : 'transparent',
            }}>
            <span className="text-base">{r.icon}</span>{r.label}
          </button>
        ))}
      </div>

      {activeRole === 'dor'         && <DoRInsights club={club} />}
      {activeRole === 'coach'       && <CoachInsights />}
      {activeRole === 'medical'     && <MedicalInsights />}
      {activeRole === 'recruitment' && <RecruitmentInsights />}
      {activeRole === 'academy'     && <AcademyInsights />}
      {activeRole === 'analysis'    && <AnalysisInsights />}
      {activeRole === 'commercial'  && <CommercialInsights />}
      {activeRole === 'ceo'         && <CeoInsights club={club} />}
    </div>
  );
}

// ─── 1 · DIRECTOR OF RUGBY ────────────────────────────────────────────────

function DoRInsights({ club }: { club: RugbyClub }) {
  const headroom = club.capCeiling - club.currentSpend
  const compliance: { criteria: string; score: number; status: RAG; deadline: string; action: string }[] = [
    { criteria: "Women's Game",     score: 42, status: 'RED',   deadline: '30 Apr', action: 'Submit PWR registration plan' },
    { criteria: 'Investment',       score: 48, status: 'RED',   deadline: '15 May', action: 'Complete investor pack' },
    { criteria: 'Operating',        score: 86, status: 'GREEN', deadline: '30 Jun', action: 'Book matchday assessment' },
    { criteria: 'Community',        score: 91, status: 'GREEN', deadline: '—',      action: '2 events remaining' },
    { criteria: 'Academy',          score: 78, status: 'AMBER', deadline: '20 May', action: 'Pathway review outstanding' },
    { criteria: 'Facilities',       score: 65, status: 'AMBER', deadline: '12 May', action: 'Pitch inspection due' },
    { criteria: 'Governance',       score: 95, status: 'GREEN', deadline: '—',      action: 'Board minutes up to date' },
    { criteria: 'Commercial',       score: 72, status: 'AMBER', deadline: '25 May', action: '2 sponsor activations needed' },
  ]
  const complianceDonut = [
    { label: 'Green', value: compliance.filter(c => c.status === 'GREEN').length, color: '#22C55E' },
    { label: 'Amber', value: compliance.filter(c => c.status === 'AMBER').length, color: '#F59E0B' },
    { label: 'Red',   value: compliance.filter(c => c.status === 'RED').length,   color: '#EF4444' },
  ]
  const monthlyRevenue   = [142, 168, 184, 156, 198, 215, 192, 178, 165, 188, 172, 145]
  const monthlyBudget    = [160, 170, 180, 165, 195, 210, 200, 185, 175, 195, 180, 160]
  const monthLabels      = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
  const matchdayTrend    = [3210, 3890, 2940, 4100, 3520, 3680, 3210, 2890, 3410, 3720, 4050, 3210]
  const capBreakdown = [
    { label: 'Forwards', value: 920000, color: '#7C3AED' },
    { label: 'Backs',    value: 740000, color: '#A855F7' },
    { label: 'Bench',    value: 180000, color: '#C084FC' },
    { label: 'Academy',  value: 100000, color: '#E9D5FF' },
  ]
  const targets: { target: string; progress: string; deadline: string; owner: string; status: RAG }[] = [
    { target: 'Top 4 finish',                     progress: '4th',      deadline: 'May 2026', owner: 'Head Coach',   status: 'GREEN' },
    { target: 'Average attendance 3,500',         progress: '3,210',    deadline: 'May 2026', owner: 'Commercial',   status: 'AMBER' },
    { target: 'Academy → 2 first-team players',   progress: '1 so far', deadline: 'Jun 2026', owner: 'Academy',      status: 'GREEN' },
    { target: 'Commercial revenue +15%',          progress: '+11%',     deadline: 'Jun 2026', owner: 'Commercial',   status: 'AMBER' },
    { target: 'Franchise score 80%+',             progress: '71%',      deadline: 'Aug 2026', owner: 'DoR',          status: 'RED'   },
    { target: "Women's PWR registration",         progress: 'Plan due', deadline: '30 Apr',   owner: 'DoR',          status: 'RED'   },
  ]
  const priorityActions: { a: string; o: string; d: string; u: 'RED' | 'AMBER' | 'BLUE' }[] = [
    { a: 'Confirm No.8 — Foster HIA Day 8',                    o: 'Medical',  d: 'Today',  u: 'RED'   },
    { a: 'LHP contract — external interest from Championship', o: 'DoR',      d: 'Fri',    u: 'RED'   },
    { a: "Women's Game plan — submit by 30 Apr",                o: 'DoR',      d: '30 Apr', u: 'RED'   },
    { a: 'Investment Capacity pack — CEO sign-off',            o: 'CEO',      d: '15 May', u: 'AMBER' },
    { a: 'Salary cap return — RFU due 10 May',                 o: 'Finance',  d: '10 May', u: 'AMBER' },
    { a: 'Pitch inspection — facilities scoring',              o: 'Ops',      d: '12 May', u: 'AMBER' },
    { a: 'Pathway review — academy compliance',                o: 'Academy',  d: '20 May', u: 'AMBER' },
    { a: 'Hartfield Building Society renewal call',            o: 'Comm.',    d: '3 May',  u: 'BLUE'  },
    { a: 'Pre-season schedule sign-off',                       o: 'Coach',    d: '30 May', u: 'BLUE'  },
    { a: 'Shareholder update memo',                            o: 'CEO',      d: '5 Jun',  u: 'BLUE'  },
  ]
  const expiry: { name: string; pos: string; current: number; market: number; rec: 'Renew' | 'Release' | 'Loan'; month: string }[] = [
    { name: 'Tom Harrison',  pos: 'LHP',   current: 95000, market: 110000, rec: 'Renew',   month: 'Jun' },
    { name: 'Karl Briggs',   pos: 'Hooker', current: 78000, market: 65000,  rec: 'Renew',   month: 'Jun' },
    { name: 'Marcus Webb',   pos: 'Lock',   current: 82000, market: 80000,  rec: 'Renew',   month: 'Jul' },
    { name: 'Danny Cole',    pos: 'FH',     current: 110000, market: 95000, rec: 'Renew',   month: 'Jul' },
    { name: 'Ryan Patel',    pos: 'Wing',   current: 68000, market: 45000,  rec: 'Release', month: 'Aug' },
    { name: 'Ali Rashid',    pos: 'Wing',   current: 32000, market: 35000,  rec: 'Loan',    month: 'Aug' },
    { name: 'Joe Lewis',     pos: 'CB',     current: 58000, market: 60000,  rec: 'Renew',   month: 'Sep' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Cap Headroom"     value={fmt(headroom)} sub={`of ${fmt(club.capCeiling)}`} trend="flat" trendValue="compliant" accent="#22C55E" />
        <KpiCard label="Franchise Score"  value={`${club.franchiseScore}%`} sub="2 RED criteria" trend="up" trendValue="+3" accent="#F59E0B" />
        <KpiCard label="Squad"            value="38" sub="28 fit · 2 inj · 2 rehab" trend="flat" trendValue="stable" />
        <KpiCard label="League Position"  value="4th" sub="of 12" trend="up" trendValue="↑1 vs Mar" />
        <KpiCard label="Renewals Due"     value="7" sub="3 priority · by Jun" trend="flat" trendValue="" accent="#EF4444" />
      </div>

      <InsightCard title="Franchise Compliance" subtitle="Live RFU framework score · per criteria">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5 items-start">
          <table className="w-full text-xs">
            <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left py-2">Criteria</th>
              <th className="text-left py-2">Score</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Deadline</th>
              <th className="text-left py-2">Action</th>
            </tr></thead>
            <tbody>
              {compliance.map((c, i) => (
                <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="py-2.5 text-white font-medium">{c.criteria}</td>
                  <td className="py-2.5 w-32">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.score} color={ragHex(c.status)} />
                      <span className="text-gray-300 font-mono w-8">{c.score}%</span>
                    </div>
                  </td>
                  <td className="py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded border ${ragBg(c.status)}`}>{c.status}</span></td>
                  <td className="py-2.5 text-gray-400 font-mono">{c.deadline}</td>
                  <td className="py-2.5 text-gray-300">{c.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Distribution</div>
            <Donut data={complianceDonut} size={140} />
          </div>
        </div>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Revenue vs Budget" subtitle="Monthly · season Apr → Mar (£k)">
          <BarChart values={monthlyRevenue} labels={monthLabels} max={250} height={160} />
          <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
            <span>Total YTD: <span className="text-white font-bold">£2.10M</span></span>
            <span>Budget YTD: <span className="text-gray-300 font-bold">£2.18M</span></span>
            <span>Variance: <span className="text-amber-400 font-bold">−3.7%</span></span>
          </div>
        </InsightCard>
        <InsightCard title="Salary Cap Breakdown" subtitle={`Total ${fmt(club.currentSpend)}`}>
          <Donut data={capBreakdown} size={140} />
        </InsightCard>
      </div>

      <InsightCard title="Matchday Income Trend" subtitle="Last 12 home matches (£)">
        <BarChart values={matchdayTrend.map(v => Math.round(v / 100))} max={50} height={120} color="#3B82F6" />
        <div className="text-[10px] text-gray-500 mt-2">Hundreds of pounds per fixture · best 4,100 · worst 2,890</div>
      </InsightCard>

      <InsightCard title="Strategic Targets" subtitle="2025/26 board-level KPIs">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Target</th>
            <th className="text-left py-2">Progress</th>
            <th className="text-left py-2">Deadline</th>
            <th className="text-left py-2">Owner</th>
            <th className="text-left py-2">Status</th>
          </tr></thead>
          <tbody>
            {targets.map((t, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2.5 text-white">{t.target}</td>
                <td className="py-2.5 text-gray-300 font-mono">{t.progress}</td>
                <td className="py-2.5 text-gray-400 font-mono">{t.deadline}</td>
                <td className="py-2.5 text-gray-400">{t.owner}</td>
                <td className="py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded border ${ragBg(t.status)}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Priority Actions" subtitle="Top 10 — sequenced by urgency + deadline">
          <ol className="space-y-2">
            {priorityActions.map((a, i) => (
              <li key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${a.u === 'RED' ? 'border-red-600/30 bg-red-600/5' : a.u === 'AMBER' ? 'border-amber-600/30 bg-amber-600/5' : 'border-gray-800 bg-gray-800/20'}`}>
                <span className="text-[10px] font-mono font-bold w-5 text-gray-500">{(i + 1).toString().padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200">{a.a}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{a.o} · {a.d}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${a.u === 'RED' ? 'bg-red-600/20 text-red-400' : a.u === 'AMBER' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>{a.u}</span>
              </li>
            ))}
          </ol>
        </InsightCard>

        <InsightCard title="Contract Expiry Timeline" subtitle="Next 4 months · 7 contracts ending">
          <div className="space-y-3">
            {['Jun', 'Jul', 'Aug', 'Sep'].map(month => {
              const rows = expiry.filter(e => e.month === month)
              return (
                <div key={month}>
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1.5 font-bold">{month} 2026</div>
                  <div className="space-y-1.5">
                    {rows.map((p, i) => {
                      const recColor = p.rec === 'Renew' ? 'text-green-400' : p.rec === 'Loan' ? 'text-blue-400' : 'text-red-400'
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a0c14] border border-gray-800/60">
                          <span className="text-xs text-white font-medium w-32 truncate">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">{p.pos}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{fmt(p.current)} → est. {fmt(p.market)}</span>
                          <span className={`text-[10px] font-bold ml-auto ${recColor}`}>{p.rec}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </InsightCard>
      </div>
    </div>
  )
}

// ─── 2 · HEAD COACH ───────────────────────────────────────────────────────

function CoachInsights() {
  const last10: { res: 'W' | 'L' | 'D'; opp: string; score: string; pf: number; pa: number }[] = [
    { res: 'W', opp: 'Bath',         score: '24-19', pf: 24, pa: 19 },
    { res: 'L', opp: 'Coventry',     score: '12-31', pf: 12, pa: 31 },
    { res: 'W', opp: 'Doncaster',    score: '38-14', pf: 38, pa: 14 },
    { res: 'W', opp: 'Caldy',        score: '27-18', pf: 27, pa: 18 },
    { res: 'L', opp: 'Ealing',       score: '15-22', pf: 15, pa: 22 },
    { res: 'W', opp: 'Hartpury',     score: '31-21', pf: 31, pa: 21 },
    { res: 'W', opp: 'Cornish All',  score: '22-18', pf: 22, pa: 18 },
    { res: 'L', opp: 'Bedford',      score: '14-23', pf: 14, pa: 23 },
    { res: 'W', opp: 'London Scot.', score: '26-19', pf: 26, pa: 19 },
    { res: 'L', opp: 'Nott. CC',     score: '16-24', pf: 16, pa: 24 },
  ]
  const lineoutLast6 = [82, 75, 88, 70, 65, 68]
  const scrumLast6 = [80, 76, 82, 79, 74, 78]
  const trySources = [
    { label: 'Set piece',  value: 14, color: '#7C3AED' },
    { label: 'Phase play', value: 22, color: '#A855F7' },
    { label: 'Turnover',   value: 6,  color: '#22C55E' },
    { label: 'Penalty',    value: 4,  color: '#F59E0B' },
  ]
  const trainingLoad = [580, 720, 840, 920, 410, 220]
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const acwr: { name: string; acute: number; chronic: number; ratio: number; status: RAG }[] = [
    { name: 'Luke Barnes',   acute: 1240, chronic: 815, ratio: 1.52, status: 'RED' },
    { name: 'Karl Foster',   acute: 1110, chronic: 802, ratio: 1.38, status: 'AMBER' },
    { name: 'Tom Harrison',  acute: 980,  chronic: 770, ratio: 1.27, status: 'GREEN' },
    { name: 'Marcus Webb',   acute: 940,  chronic: 745, ratio: 1.26, status: 'GREEN' },
    { name: 'Oliver Grant',  acute: 920,  chronic: 740, ratio: 1.24, status: 'GREEN' },
    { name: 'Danny Cole',    acute: 870,  chronic: 720, ratio: 1.21, status: 'GREEN' },
    { name: 'Matt Jones',    acute: 850,  chronic: 720, ratio: 1.18, status: 'GREEN' },
    { name: 'David Obi',     acute: 820,  chronic: 715, ratio: 1.15, status: 'GREEN' },
    { name: 'Ben Taylor',    acute: 740,  chronic: 660, ratio: 1.12, status: 'GREEN' },
    { name: 'Josh White',    acute: 700,  chronic: 720, ratio: 0.97, status: 'GREEN' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Available"      value="28/38" sub="2 HIA · 2 inj · 6 academy" />
        <KpiCard label="GPS Overloads"  value="2" sub="Barnes · K. Foster" accent="#EF4444" trend="up" trendValue="+1" />
        <KpiCard label="Team ACWR"      value="1.22" sub="Amber zone (0.8-1.3 optimal)" accent="#F59E0B" />
        <KpiCard label="Win Rate"       value="58%" sub="W11 L8 D0" trend="up" trendValue="+5%" />
        <KpiCard label="Next Match"     value="Sat" sub="vs Jersey Reds · 4d" />
      </div>

      <InsightCard title="Set Piece Performance" subtitle="Last 6 matches">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-white">Lineout</div>
              <div className="text-xs text-green-400 font-mono">68% · own throw</div>
            </div>
            <BarChart values={lineoutLast6} labels={['M-5','M-4','M-3','M-2','M-1','Now']} max={100} height={120} color="#22C55E" target={75} />
            <div className="mt-3 space-y-1 text-[11px] text-gray-400">
              <div className="flex justify-between"><span>Own throw win %</span><span className="text-white font-bold">68%</span></div>
              <div className="flex justify-between"><span>Opposition steal %</span><span className="text-red-400 font-bold">32% (worst in div.)</span></div>
              <div className="flex justify-between"><span>Best call · Utah (tail)</span><span className="text-green-400 font-bold">89%</span></div>
              <div className="flex justify-between"><span>Worst call · Arrow (mid)</span><span className="text-red-400 font-bold">43%</span></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-white">Scrum</div>
              <div className="text-xs text-amber-400 font-mono">77.8% · own put-in</div>
            </div>
            <BarChart values={scrumLast6} labels={['M-5','M-4','M-3','M-2','M-1','Now']} max={100} height={120} color="#F59E0B" target={80} />
            <div className="mt-3 space-y-1 text-[11px] text-gray-400">
              <div className="flex justify-between"><span>Own put-in win %</span><span className="text-white font-bold">91%</span></div>
              <div className="flex justify-between"><span>Penalty conceded /match</span><span className="text-red-400 font-bold">4.2 (above 3.0 ⚠)</span></div>
              <div className="flex justify-between"><span>Best side · tighthead</span><span className="text-green-400 font-bold">82%</span></div>
              <div className="flex justify-between"><span>Loosehead struggles</span><span className="text-amber-400 font-bold">68%</span></div>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-white mb-2">Gameday averages</div>
            <Donut size={120} data={[
              { label: 'Possession', value: 53, color: '#7C3AED' },
              { label: 'Opp poss',   value: 47, color: '#374151' },
            ]} />
            <Donut size={120} data={[
              { label: 'Territory',  value: 56, color: '#22C55E' },
              { label: 'Opp terr.',  value: 44, color: '#374151' },
            ]} />
          </div>
        </div>
      </InsightCard>

      <InsightCard title="Opposition Intel · Next match" subtitle="Jersey Reds · Sat · 6th in Champ Rugby (W L W W L)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Key threats</div>
            <div className="space-y-2 text-xs">
              <div><span className="text-white font-bold">J. Hawkins (10)</span><div className="text-gray-400 text-[11px]">Goal kicker · 78% conversion · kicks left 60%</div></div>
              <div><span className="text-white font-bold">C. Morris (7)</span><div className="text-gray-400 text-[11px]">9 turnovers L3 · plays high in defensive line</div></div>
              <div><span className="text-white font-bold">B. Knight (12)</span><div className="text-gray-400 text-[11px]">Crash-ball merchant · lateral defender · dummy runs</div></div>
            </div>
          </div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Set piece weaknesses</div>
            <div className="space-y-2 text-xs text-gray-300">
              <div>• Scrum: 4 penalties conceded last 3 — target tighthead</div>
              <div>• Lineout: 88% retention but only 6% steal rate</div>
              <div>• Restart receipt: drops on 14% of high balls</div>
              <div>• 5m line-out defence: 3 tries conceded L4</div>
            </div>
          </div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Tactical opportunities</div>
            <div className="space-y-2 text-xs text-gray-300">
              <div>• Kick chase to left wing — poor under high ball</div>
              <div>• Driving maul — concede 1.4 maul tries/match</div>
              <div>• Tempo at the breakdown — slow ruck speed (+0.4s)</div>
              <div>• Bench drops off — last 20 min defence weakest</div>
            </div>
          </div>
        </div>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Training Load · This week" subtitle="Squad average AU per session">
          <BarChart values={trainingLoad} labels={dayLabels} max={1000} height={140} color="#7C3AED" target={700} />
          <div className="mt-3 text-[11px] text-gray-400">
            Wed peak 920 AU · Fri taper 410 · MD-1 captain&apos;s run 220. Yellow line = recommended ceiling.
          </div>
        </InsightCard>
        <InsightCard title="ACWR · Squad distribution" subtitle="Top 10 by acute load · 7d / 28d ratio">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="text-left py-1.5">Player</th>
                <th className="text-right py-1.5">Acute</th>
                <th className="text-right py-1.5">Chronic</th>
                <th className="text-right py-1.5">ACWR</th>
                <th className="text-left py-1.5 pl-3">Status</th>
              </tr></thead>
              <tbody>
                {acwr.map((p, i) => (
                  <tr key={i} className="border-b border-gray-800/40">
                    <td className="py-1.5 text-white">{p.name}</td>
                    <td className="py-1.5 text-right text-gray-300 font-mono">{p.acute}</td>
                    <td className="py-1.5 text-right text-gray-400 font-mono">{p.chronic}</td>
                    <td className="py-1.5 text-right font-mono font-bold" style={{ color: ragHex(p.status) }}>{p.ratio.toFixed(2)}</td>
                    <td className="py-1.5 pl-3"><span className={`text-[9px] px-1.5 py-0.5 rounded border ${ragBg(p.status)}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InsightCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Form & Results" subtitle="Last 10 matches · points trend">
          <div className="flex gap-1 mb-3">
            {last10.map((m, i) => (
              <div key={i} className={`flex-1 text-center py-1.5 rounded text-[10px] font-bold ${m.res === 'W' ? 'bg-green-600/20 text-green-400' : m.res === 'L' ? 'bg-red-600/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                <div>{m.res}</div>
                <div className="text-[8px] font-mono text-gray-500 mt-0.5">{m.score}</div>
              </div>
            ))}
          </div>
          <LineChart values={last10.map(m => m.pf)} labels={last10.map(m => m.opp.slice(0, 4))} max={45} height={150} color="#22C55E" />
          <div className="text-[10px] text-gray-500 mt-1 text-center">Points for · trend</div>
        </InsightCard>
        <InsightCard title="Try Sources" subtitle={`46 tries scored · season`}>
          <Donut data={trySources} size={140} />
        </InsightCard>
      </div>

      <InsightCard title="Selection Dilemmas" subtitle="Decisions for this weekend">
        <div className="space-y-2">
          {[
            { q: 'Henderson cleared — start or bench?',                                 ctx: 'Returns from 4-week shoulder. 1 full session. Bench more conservative; start if Foster fails HIA.' },
            { q: 'Williams on concussion protocol — replacement at 12?',                  ctx: 'Day 4/6 of HIA. Jones available, Owens (academy) on standby. Match-day decision.' },
            { q: 'Okonkwo U20 camp release — weaken back row depth?',                    ctx: 'England U20 want him for 3 days mid-week. Foster on HIA, White carrying knock — risk to depth.' },
            { q: 'Clarke vs Hughes at loosehead — scrummaging vs carrying?',              ctx: 'Clarke: scrum dominance, low carry stats. Hughes: 4.2m/carry but conceded 2 scrum pen L2.' },
          ].map((d, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#0a0c14] border border-gray-800/60">
              <div className="text-xs font-bold text-white">{d.q}</div>
              <div className="text-[11px] text-gray-400 mt-1 leading-relaxed">{d.ctx}</div>
            </div>
          ))}
        </div>
      </InsightCard>
    </div>
  )
}

// ─── 3 · HEAD OF MEDICAL ──────────────────────────────────────────────────

function MedicalInsights() {
  const register: { player: string; injury: string; date: string; phase: string; ret: string; status: RAG; notes: string }[] = [
    { player: 'Danny Foster',   injury: 'HIA Day 8 (concussion)',     date: '11 Apr', phase: 'Day 8 of 14', ret: '19 Apr',     status: 'RED',   notes: 'Returns to running Day 10. Final clearance scan Day 12.' },
    { player: 'Karl Briggs',    injury: 'Shoulder post-op (AC repair)', date: '12 Mar', phase: 'RTP Phase 4', ret: '2 May',     status: 'AMBER', notes: 'Contact training cleared. Match exposure 12 May.' },
    { player: 'Ryan Patel',     injury: 'Hamstring Gr 2',              date: '4 Apr',  phase: 'Rehab',       ret: '18 Apr',     status: 'AMBER', notes: 'Outdoor running cleared, await straight-line sprints.' },
    { player: 'Sam Ellis',      injury: 'Ankle sprain Gr 1',           date: '14 Apr', phase: 'Acute',       ret: '23 Apr',     status: 'AMBER', notes: 'Ice + compression. Pool rehab Day 4.' },
    { player: 'Luke Barnes',    injury: 'ACWR 1.52 (load)',            date: '14 Apr', phase: 'Load mgmt',   ret: 'Managed',     status: 'AMBER', notes: 'No injury · pre-emptive deload week.' },
    { player: 'Joe Lewis',      injury: 'Calf strain Gr 1 (history)',  date: '5 Apr',  phase: 'RTP Phase 5', ret: 'Cleared',     status: 'GREEN', notes: 'Full training. Monitor on match day.' },
    { player: 'Tom Foley',      injury: 'Quad contusion',              date: '15 Apr', phase: 'Acute',       ret: '21 Apr',     status: 'AMBER', notes: 'Bruise + scan negative. 5-day plan.' },
  ]
  const bodyArea = [
    { label: 'Shoulder',   value: 6, color: '#7C3AED' },
    { label: 'Knee',       value: 4, color: '#A855F7' },
    { label: 'Hamstring',  value: 7, color: '#22C55E' },
    { label: 'Ankle',      value: 5, color: '#F59E0B' },
    { label: 'Concussion', value: 4, color: '#EF4444' },
    { label: 'Other',      value: 3, color: '#6B7280' },
  ]
  const positionGroup = [
    { label: 'Forwards', value: 17, color: '#7C3AED' },
    { label: 'Backs',    value: 12, color: '#A855F7' },
  ]
  const contactSplit = [
    { label: 'Contact',     value: 22, color: '#EF4444' },
    { label: 'Non-contact', value: 7,  color: '#22C55E' },
  ]
  const monthly = [3, 2, 4, 5, 3, 2, 5, 6]
  const monthLabels = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
  const wellness: { player: string; sleep: number; fatigue: number; mood: number; soreness: number }[] = [
    { player: 'Tom Harrison',  sleep: 8, fatigue: 7, mood: 8, soreness: 7 },
    { player: 'Karl Foster',   sleep: 5, fatigue: 5, mood: 6, soreness: 5 },
    { player: 'Marcus Webb',   sleep: 8, fatigue: 8, mood: 9, soreness: 8 },
    { player: 'Luke Barnes',   sleep: 4, fatigue: 4, mood: 6, soreness: 4 },
    { player: 'Oliver Grant',  sleep: 8, fatigue: 8, mood: 8, soreness: 8 },
    { player: 'Danny Cole',    sleep: 7, fatigue: 7, mood: 7, soreness: 7 },
    { player: 'Matt Jones',    sleep: 9, fatigue: 8, mood: 9, soreness: 9 },
    { player: 'David Obi',     sleep: 7, fatigue: 7, mood: 8, soreness: 8 },
    { player: 'Ben Taylor',    sleep: 6, fatigue: 6, mood: 7, soreness: 6 },
    { player: 'Josh White',    sleep: 8, fatigue: 8, mood: 9, soreness: 8 },
  ]
  const screening: { player: string; cardiac: string; musculoskeletal: string; dental: string; blood: string; flag: 'ok' | 'overdue' }[] = [
    { player: 'Tom Harrison',  cardiac: 'Aug 2025', musculoskeletal: 'Jan 2026', dental: 'Sep 2025', blood: 'Feb 2026', flag: 'ok' },
    { player: 'Karl Briggs',   cardiac: 'Aug 2024', musculoskeletal: 'Mar 2026', dental: 'Sep 2025', blood: 'Feb 2026', flag: 'overdue' },
    { player: 'Marcus Webb',   cardiac: 'Sep 2025', musculoskeletal: 'Feb 2026', dental: 'Oct 2024', blood: 'Mar 2026', flag: 'overdue' },
    { player: 'Luke Barnes',   cardiac: 'Aug 2025', musculoskeletal: 'Jan 2026', dental: 'Aug 2025', blood: 'Feb 2026', flag: 'ok' },
    { player: 'Danny Cole',    cardiac: 'Sep 2025', musculoskeletal: 'Feb 2026', dental: 'Sep 2025', blood: 'Feb 2026', flag: 'ok' },
  ]
  const wellnessColor = (v: number) => v >= 7 ? '#22C55E' : v >= 5 ? '#F59E0B' : '#EF4444'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Injured"          value="4" sub="2 short · 1 long · 1 HIA" accent="#EF4444" />
        <KpiCard label="Days Lost"         value="47" sub="this month" trend="down" trendValue="−12 vs Mar" />
        <KpiCard label="ACWR Alerts"       value="3" sub=">1.5 threshold" accent="#F59E0B" trend="up" trendValue="+1" />
        <KpiCard label="Concussion"        value="1" sub="Williams · Day 4/6" accent="#EF4444" />
        <KpiCard label="RTP Phases"        value="2" sub="Briggs · Patel" />
      </div>

      <InsightCard title="Current Injury Register" subtitle="Active cases · 7">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Player</th>
            <th className="text-left py-2">Injury</th>
            <th className="text-left py-2">Date</th>
            <th className="text-left py-2">Phase</th>
            <th className="text-left py-2">Expected return</th>
            <th className="text-left py-2 w-3">Status</th>
            <th className="text-left py-2">Notes</th>
          </tr></thead>
          <tbody>
            {register.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                <td className="py-2 text-white font-medium">{r.player}</td>
                <td className="py-2 text-gray-300">{r.injury}</td>
                <td className="py-2 text-gray-500 font-mono">{r.date}</td>
                <td className="py-2 text-gray-300">{r.phase}</td>
                <td className="py-2 text-gray-300 font-mono">{r.ret}</td>
                <td className="py-2"><span className="w-2 h-2 rounded-full inline-block" style={{ background: ragHex(r.status) }} /></td>
                <td className="py-2 text-[11px] text-gray-400">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <InsightCard title="Injuries by Body Area" subtitle="Season total · 29">
          <Donut data={bodyArea} size={140} />
        </InsightCard>
        <InsightCard title="Forwards vs Backs" subtitle="Position group split">
          <Donut data={positionGroup} size={140} />
        </InsightCard>
        <InsightCard title="Contact vs Non-contact" subtitle="Mechanism">
          <Donut data={contactSplit} size={140} />
        </InsightCard>
      </div>

      <InsightCard title="Monthly Injury Count" subtitle="Sep — Apr">
        <BarChart values={monthly} labels={monthLabels} max={8} height={140} color="#EF4444" target={4} />
        <div className="text-[10px] text-gray-500 mt-2">Yellow line = season average (3.75/month). Apr trending up — review training load.</div>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Concussion Tracker" subtitle="Active protocols + season summary">
          <div className="bg-red-600/5 border border-red-600/20 rounded-lg p-3 mb-4">
            <div className="text-xs font-bold text-red-400 mb-2">Active · Williams (12) — Day 4/6</div>
            <div className="space-y-1 text-[11px] text-gray-300">
              <div>✓ 24h symptom-free</div>
              <div>✓ Light aerobic exercise (Day 3)</div>
              <div>○ Sport-specific exercise (Day 5)</div>
              <div>○ Non-contact training (Day 6)</div>
              <div>○ Full contact (Day 7)</div>
              <div>○ Return to play (Day 8)</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-white">4</div>
              <div className="text-[10px] text-gray-500">Season total</div>
            </div>
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-amber-400">3.2</div>
              <div className="text-[10px] text-gray-500">League avg</div>
            </div>
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-green-400">3/4</div>
              <div className="text-[10px] text-gray-500">HIA passed</div>
            </div>
          </div>
        </InsightCard>

        <InsightCard title="Squad Wellness" subtitle="Daily questionnaire · 0-10 scale">
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left py-1.5">Player</th>
              <th className="text-center py-1.5">Sleep</th>
              <th className="text-center py-1.5">Fatigue</th>
              <th className="text-center py-1.5">Mood</th>
              <th className="text-center py-1.5">Soreness</th>
            </tr></thead>
            <tbody>
              {wellness.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/40">
                  <td className="py-1.5 text-white">{p.player}</td>
                  <td className="py-1.5 text-center font-mono font-bold" style={{ color: wellnessColor(p.sleep) }}>{p.sleep}</td>
                  <td className="py-1.5 text-center font-mono font-bold" style={{ color: wellnessColor(p.fatigue) }}>{p.fatigue}</td>
                  <td className="py-1.5 text-center font-mono font-bold" style={{ color: wellnessColor(p.mood) }}>{p.mood}</td>
                  <td className="py-1.5 text-center font-mono font-bold" style={{ color: wellnessColor(p.soreness) }}>{p.soreness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InsightCard>
      </div>

      <InsightCard title="Screening & Compliance" subtitle="RFU mandatory + club discretionary screens">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Player</th>
            <th className="text-left py-2">Cardiac</th>
            <th className="text-left py-2">Musculoskeletal</th>
            <th className="text-left py-2">Dental</th>
            <th className="text-left py-2">Blood panel</th>
          </tr></thead>
          <tbody>
            {screening.map((s, i) => (
              <tr key={i} className={`border-b border-gray-800/40 ${s.flag === 'overdue' ? 'bg-red-600/5' : ''}`}>
                <td className="py-2 text-white">{s.player}</td>
                <td className={`py-2 font-mono ${s.cardiac.includes('2024') ? 'text-red-400' : 'text-gray-300'}`}>{s.cardiac}</td>
                <td className="py-2 text-gray-300 font-mono">{s.musculoskeletal}</td>
                <td className={`py-2 font-mono ${s.dental.includes('2024') ? 'text-red-400' : 'text-gray-300'}`}>{s.dental}</td>
                <td className="py-2 text-gray-300 font-mono">{s.blood}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-[10px] text-gray-500">Red = overdue (more than 12 months since last screen). 2 players need cardiac re-screening.</div>
      </InsightCard>
    </div>
  )
}

// ─── 4 · RECRUITMENT ──────────────────────────────────────────────────────

function RecruitmentInsights() {
  const positionMatrix: { pos: string; depth: string; quality: number; priority: RAG; target: string }[] = [
    { pos: 'Loosehead Prop', depth: '2 (1 ageing)',  quality: 6.8, priority: 'RED',   target: 'Mike Donovan (Richmond)' },
    { pos: 'Hooker',         depth: '3',             quality: 8.1, priority: 'GREEN', target: '—' },
    { pos: 'Tighthead Prop', depth: '2',             quality: 7.4, priority: 'AMBER', target: 'Watching list' },
    { pos: 'Lock',           depth: '4',             quality: 8.4, priority: 'GREEN', target: '—' },
    { pos: 'Back row',       depth: '6',             quality: 7.9, priority: 'GREEN', target: '—' },
    { pos: 'Scrum half',     depth: '3',             quality: 7.6, priority: 'GREEN', target: '—' },
    { pos: 'Fly half',       depth: '2 (1 academy)', quality: 7.2, priority: 'RED',   target: 'Rory Flynn (FA)' },
    { pos: 'Centre',         depth: '4',             quality: 8.0, priority: 'GREEN', target: '—' },
    { pos: 'Wing',           depth: '3',             quality: 6.9, priority: 'AMBER', target: 'Chris Lawton (Notts)' },
    { pos: 'Fullback',       depth: '2',             quality: 7.8, priority: 'AMBER', target: 'Watching' },
  ]
  const pipeline: { stage: string; players: { name: string; pos: string; club: string; salary: number; note: string }[] }[] = [
    { stage: 'Long list',  players: [
      { name: 'Sam Ridley',    pos: 'Wing',  club: 'Bath Acad.',  salary: 28000, note: '20 · pace · raw' },
      { name: 'Jack Thurston', pos: 'Lock',  club: 'Hartpury',    salary: 35000, note: '21 · physical' },
    ] },
    { stage: 'Watching',   players: [
      { name: 'Chris Lawton',  pos: 'CB',    club: 'Nottingham', salary: 58000, note: '24 · scout 2 visits' },
      { name: 'Tom Vance',     pos: 'OF',    club: 'Yorkshire',  salary: 62000, note: '23 · breakdown specialist' },
    ] },
    { stage: 'Priority',   players: [
      { name: 'Mike Donovan',  pos: 'LHP',   club: 'Richmond',   salary: 78000, note: '25 · SCRUM ANCHOR' },
    ] },
    { stage: 'Contacted',  players: [
      { name: 'Jake Morton',   pos: 'DM',    club: 'Coventry',   salary: 65000, note: 'Approach made' },
    ] },
    { stage: 'Negotiating', players: [
      { name: 'Rory Flynn',    pos: 'FH',    club: 'Free agent', salary: 72000, note: 'Meeting Thu' },
    ] },
    { stage: 'Offer',      players: [
      { name: 'Mike Donovan',  pos: 'LHP',   club: 'Richmond',   salary: 78000, note: 'Counter expected' },
    ] },
    { stage: 'Signed',     players: [] },
  ]
  const top3: { name: string; age: number; pos: string; club: string; status: string; salary: number; strengths: string[]; weaknesses: string[]; videos: number; rating: number }[] = [
    { name: 'Mike Donovan', age: 25, pos: 'LHP', club: 'Richmond',   status: 'Out of contract Jun', salary: 78000,
      strengths:  ['Dominant scrum (SCRA 1.84)', 'High work rate (12 tackles/match)', 'Set-piece leader'],
      weaknesses: ['Carry stats below average', 'Yellow card history (3 this season)'],
      videos: 8, rating: 8.4,
    },
    { name: 'Jake Morton',  age: 23, pos: 'DM',  club: 'Coventry',   status: 'Year left on deal',     salary: 65000,
      strengths:  ['Box-kick accuracy 91%', 'Pace from base', 'Tactical kicking game'],
      weaknesses: ['Physical at the breakdown', 'Yellow card aggression'],
      videos: 6, rating: 7.9,
    },
    { name: 'Rory Flynn',   age: 27, pos: 'FH',  club: 'Free agent', status: 'Available immediately', salary: 72000,
      strengths:  ['Goal kicking 81%', 'Game management', '3 caps Italy'],
      weaknesses: ['Defensive line speed', 'Recent shoulder surgery'],
      videos: 12, rating: 8.1,
    },
  ]
  const renewals: { player: string; pos: string; expiry: string; current: number; rec: 'Renew' | 'Release' | 'Loan' | 'Negotiate' }[] = [
    { player: 'Tom Harrison',  pos: 'LHP',    expiry: 'Jun 2026', current: 95000,  rec: 'Renew' },
    { player: 'Karl Briggs',   pos: 'Hooker', expiry: 'Jun 2026', current: 78000,  rec: 'Renew' },
    { player: 'Marcus Webb',   pos: 'Lock',   expiry: 'Jul 2026', current: 82000,  rec: 'Renew' },
    { player: 'Danny Cole',    pos: 'FH',     expiry: 'Jul 2026', current: 110000, rec: 'Negotiate' },
    { player: 'Ryan Patel',    pos: 'Wing',   expiry: 'Aug 2026', current: 68000,  rec: 'Release' },
    { player: 'Ali Rashid',    pos: 'Wing',   expiry: 'Aug 2026', current: 32000,  rec: 'Loan' },
    { player: 'Joe Lewis',     pos: 'CB',     expiry: 'Sep 2026', current: 58000,  rec: 'Renew' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Pipeline"           value="14" sub="3 priority · 5 watching" />
        <KpiCard label="Budget Available"   value="£180k" sub="of £350k · 51%" accent="#22C55E" />
        <KpiCard label="Positions Needed"   value="3" sub="LHP · 10 · Wing" accent="#EF4444" />
        <KpiCard label="Contracts Ending"   value="7" sub="3 priority renewals" accent="#F59E0B" />
        <KpiCard label="Agents Contacted"   value="8" sub="this month" trend="up" trendValue="+3" />
      </div>

      <InsightCard title="Recruitment Pipeline" subtitle="Kanban view · 14 active players">
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {pipeline.map((col, i) => (
              <div key={i} className="w-44 flex-shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-bold flex items-center justify-between">
                  <span>{col.stage}</span>
                  <span className="text-purple-400">{col.players.length}</span>
                </div>
                <div className="space-y-2">
                  {col.players.length === 0 && <div className="text-[10px] text-gray-700 text-center py-2">—</div>}
                  {col.players.map((p, j) => (
                    <div key={j} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-purple-400">{p.pos} · {p.club}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{fmt(p.salary)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{p.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </InsightCard>

      <InsightCard title="Position Priority Matrix" subtitle="Depth + quality assessment per position group">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Position</th>
            <th className="text-left py-2">Current depth</th>
            <th className="text-left py-2">Quality</th>
            <th className="text-left py-2">Priority</th>
            <th className="text-left py-2">Active target</th>
          </tr></thead>
          <tbody>
            {positionMatrix.map((p, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white font-medium">{p.pos}</td>
                <td className="py-2 text-gray-300">{p.depth}</td>
                <td className="py-2 w-32">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.quality} max={10} color={p.quality >= 8 ? '#22C55E' : p.quality >= 7 ? '#F59E0B' : '#EF4444'} />
                    <span className="text-gray-300 font-mono w-8">{p.quality}</span>
                  </div>
                </td>
                <td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded border ${ragBg(p.priority)}`}>{p.priority}</span></td>
                <td className="py-2 text-gray-300">{p.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <InsightCard title="Target Profiles" subtitle="Top 3 priority targets · scout-rated">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {top3.map((t, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-[11px] text-gray-400">{t.age} · {t.pos} · {t.club}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-purple-400">{t.rating}</div>
                  <div className="text-[9px] text-gray-500">scout</div>
                </div>
              </div>
              <div className="text-[10px] text-amber-400 mb-2">{t.status}</div>
              <div className="text-[11px] text-gray-300 mb-2">Est. {fmt(t.salary)}</div>
              <div className="space-y-1 mb-2">
                <div className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Strengths</div>
                {t.strengths.map((s, j) => <div key={j} className="text-[10px] text-gray-300">• {s}</div>)}
              </div>
              <div className="space-y-1 mb-2">
                <div className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Weaknesses</div>
                {t.weaknesses.map((s, j) => <div key={j} className="text-[10px] text-gray-300">• {s}</div>)}
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800 text-[10px] text-gray-500">
                <span>📹 {t.videos} sessions</span>
                <span>Rating {t.rating}/10</span>
              </div>
            </div>
          ))}
        </div>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Contract Renewals" subtitle="Due before Sep 2026 · 7 contracts">
          <table className="w-full text-xs">
            <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left py-2">Player</th>
              <th className="text-left py-2">Pos</th>
              <th className="text-left py-2">Expiry</th>
              <th className="text-right py-2">Salary</th>
              <th className="text-left py-2 pl-3">Recommendation</th>
            </tr></thead>
            <tbody>
              {renewals.map((r, i) => {
                const recColor = r.rec === 'Renew' ? 'text-green-400' : r.rec === 'Loan' ? 'text-blue-400' : r.rec === 'Negotiate' ? 'text-amber-400' : 'text-red-400'
                return (
                  <tr key={i} className="border-b border-gray-800/40">
                    <td className="py-2 text-white">{r.player}</td>
                    <td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">{r.pos}</span></td>
                    <td className="py-2 text-gray-400 font-mono">{r.expiry}</td>
                    <td className="py-2 text-right text-gray-300 font-mono">{fmt(r.current)}</td>
                    <td className={`py-2 pl-3 font-bold ${recColor}`}>{r.rec}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </InsightCard>

        <InsightCard title="Budget Tracker" subtitle="Recruitment spend · summer window 2026">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Spent</span>
                <span className="text-white font-bold">{fmt(95000)}</span>
              </div>
              <ProgressBar value={95} max={350} color="#7C3AED" height={8} />
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Committed (offers out)</span>
                <span className="text-amber-400 font-bold">{fmt(75000)}</span>
              </div>
              <ProgressBar value={75} max={350} color="#F59E0B" height={8} />
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Remaining</span>
                <span className="text-green-400 font-bold">{fmt(180000)}</span>
              </div>
              <ProgressBar value={180} max={350} color="#22C55E" height={8} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Breakdown by category</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-400">New signings</span><span className="text-white font-bold">£170k (49%)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Renewals</span><span className="text-white font-bold">£140k (40%)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Loan fees</span><span className="text-white font-bold">£25k (7%)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Agent fees</span><span className="text-white font-bold">£15k (4%)</span></div>
            </div>
          </div>
        </InsightCard>
      </div>
    </div>
  )
}

// ─── 5 · ACADEMY ──────────────────────────────────────────────────────────

function AcademyInsights() {
  const pathway = [
    { stage: 'U16',              count: 22, color: '#6B7280' },
    { stage: 'U18',              count: 12, color: '#A855F7' },
    { stage: 'U20',              count: 8,  color: '#7C3AED' },
    { stage: 'Senior Academy',   count: 4,  color: '#22C55E' },
    { stage: 'First XV bridge',  count: 2,  color: '#F59E0B' },
  ]
  const ageGrades: { team: string; p: number; w: number; l: number; d: number; pf: number; pa: number; pos: string }[] = [
    { team: 'U18',             p: 14, w: 9, l: 4, d: 1, pf: 312, pa: 224, pos: '3rd / 12' },
    { team: 'U20',             p: 12, w: 7, l: 5, d: 0, pf: 286, pa: 261, pos: '5th / 10' },
    { team: 'Development XV',  p: 10, w: 8, l: 2, d: 0, pf: 294, pa: 168, pos: '2nd / 8' },
  ]
  const prospects: { name: string; age: number; pos: string; level: string; targets: string[]; coachNote: string; pathway: string }[] = [
    { name: 'Tom Foley',  age: 20, pos: 'No.8',  level: 'U20 captain · senior camp',
      targets: ['Lift max strength +12kg', 'Improve 40m sprint to 4.7s', 'Lead U20 line-out calls'],
      coachNote: '6 first-team training sessions. Carry stats projecting at senior level. Game management 18 months ahead of age.',
      pathway: 'Senior contract Jun 2026 (likely)' },
    { name: 'Ali Rashid', age: 19, pos: 'Wing',  level: 'Dual reg Coventry',
      targets: ['Add 6kg muscle mass', 'Reduce missed tackles to <5%', '20 senior-level minutes'],
      coachNote: 'Pace 6.32 over 40m (top 5% in age). Decision-making the hold-back. Sharp aerial game.',
      pathway: 'Loan + 2-year senior offer' },
    { name: 'Sam Clarke', age: 21, pos: 'Hooker', level: 'Senior academy',
      targets: ['Improve lineout throw to 88%', 'Double scrum dominance score'],
      coachNote: 'Ready physically. Throwing under pressure inconsistent. 3 starts in second half of season expected.',
      pathway: 'First XV breakthrough Sep 2026' },
    { name: 'Marcus Hill', age: 18, pos: 'Lock',  level: 'U18 / U20 stretch',
      targets: ['First U20 starts', 'Strength gains across the squad block'],
      coachNote: 'Played U18 captain · 6 ft 8 in · works hard in contact areas. Still raw with ball in hand.',
      pathway: 'Academy contract Jul 2026' },
  ]
  const dualReg: { player: string; loanClub: string; pos: string; apps: number; perf: string }[] = [
    { player: 'Ali Rashid',   loanClub: 'Coventry',     pos: 'Wing',   apps: 8,  perf: '4 tries · MoTM x1' },
    { player: 'James Pearce', loanClub: 'Cinderford',   pos: 'CB',     apps: 11, perf: '76 carries · captained 4' },
    { player: 'Ben Reid',     loanClub: 'Birmingham', pos: 'Lock',   apps: 6,  perf: 'Solid · 3 starts' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Academy Players"   value="24" sub="U18:12 · U20:8 · Dev:4" />
        <KpiCard label="Promoted to 1st XV" value="1" sub="target: 2" trend="flat" trendValue="on track" accent="#22C55E" />
        <KpiCard label="Dual Registered"    value="3" sub="players on loan" />
        <KpiCard label="Rep Honours"        value="4" sub="Eng U20 · County · etc." accent="#F59E0B" />
        <KpiCard label="EPAS Score"         value="78%" sub="academy accreditation" trend="up" trendValue="+4%" />
      </div>

      <InsightCard title="Pathway Tracker" subtitle="U16 → First XV · 48 players in pathway">
        <div className="grid grid-cols-5 gap-2">
          {pathway.map((s, i) => {
            const max = Math.max(...pathway.map(p => p.count))
            return (
              <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-white" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{s.stage}</div>
                <div className="mt-2"><ProgressBar value={s.count} max={max} color={s.color} height={4} /></div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 text-[10px] text-gray-500">Funnel narrows as expected. 2 players at first-XV bridge currently — both U20 graduates.</div>
      </InsightCard>

      <InsightCard title="Age Grade Results" subtitle="Season summary · 3 teams">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2">P</th>
            <th className="text-center py-2">W</th>
            <th className="text-center py-2">L</th>
            <th className="text-center py-2">D</th>
            <th className="text-center py-2">PF</th>
            <th className="text-center py-2">PA</th>
            <th className="text-center py-2">PD</th>
            <th className="text-left py-2 pl-3">Position</th>
          </tr></thead>
          <tbody>
            {ageGrades.map((t, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white font-medium">{t.team}</td>
                <td className="py-2 text-center text-gray-300 font-mono">{t.p}</td>
                <td className="py-2 text-center text-green-400 font-mono font-bold">{t.w}</td>
                <td className="py-2 text-center text-red-400 font-mono font-bold">{t.l}</td>
                <td className="py-2 text-center text-gray-400 font-mono">{t.d}</td>
                <td className="py-2 text-center text-gray-300 font-mono">{t.pf}</td>
                <td className="py-2 text-center text-gray-300 font-mono">{t.pa}</td>
                <td className={`py-2 text-center font-mono font-bold ${t.pf - t.pa > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pf - t.pa > 0 ? '+' : ''}{t.pf - t.pa}</td>
                <td className="py-2 pl-3 text-purple-400 font-bold">{t.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <InsightCard title="Player Development Plans" subtitle="4 highlighted prospects">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prospects.map((p, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-white">{p.name}</div>
                  <div className="text-[11px] text-gray-400">{p.age} · {p.pos}</div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">{p.level}</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 mt-2 font-bold">Development targets</div>
              <ul className="space-y-1 text-[11px] text-gray-300 mb-2">
                {p.targets.map((t, j) => <li key={j}>• {t}</li>)}
              </ul>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 mt-2 font-bold">Coach note</div>
              <div className="text-[11px] text-gray-300 leading-relaxed">{p.coachNote}</div>
              <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-amber-400">→ {p.pathway}</div>
            </div>
          ))}
        </div>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Dual Registration" subtitle="3 players on loan · lower-league exposure">
          <table className="w-full text-xs">
            <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left py-2">Player</th>
              <th className="text-left py-2">On loan to</th>
              <th className="text-left py-2">Pos</th>
              <th className="text-center py-2">Apps</th>
              <th className="text-left py-2 pl-3">Performance</th>
            </tr></thead>
            <tbody>
              {dualReg.map((d, i) => (
                <tr key={i} className="border-b border-gray-800/40">
                  <td className="py-2 text-white">{d.player}</td>
                  <td className="py-2 text-gray-300">{d.loanClub}</td>
                  <td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">{d.pos}</span></td>
                  <td className="py-2 text-center text-gray-300 font-mono">{d.apps}</td>
                  <td className="py-2 pl-3 text-[11px] text-gray-400">{d.perf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InsightCard>

        <InsightCard title="Schools & Community" subtitle="Talent ID + community engagement">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-purple-400">6</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Partner schools</div>
              <div className="text-[10px] text-gray-400 mt-2 leading-tight">3 grammar · 2 state · 1 independent. Total 1,420 boys in programme.</div>
            </div>
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-green-400">14</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Community sessions</div>
              <div className="text-[10px] text-gray-400 mt-2 leading-tight">This term · 3 talent ID events held. Next: Hartfield primary tournament 2 May.</div>
            </div>
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-amber-400">3</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Talent ID events</div>
              <div className="text-[10px] text-gray-400 mt-2 leading-tight">Attended this term. Coaches present at U14/U16/U18 trials.</div>
            </div>
            <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-blue-400">8</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Prospects ID&apos;d</div>
              <div className="text-[10px] text-gray-400 mt-2 leading-tight">New names added to the long list this term. 2 invited to development trial.</div>
            </div>
          </div>
        </InsightCard>
      </div>
    </div>
  )
}

// ─── 6 · ANALYSIS ─────────────────────────────────────────────────────────

function AnalysisInsights() {
  const kpis: { kpi: string; target: string; actual: string; trend: 'up' | 'down' | 'flat'; status: RAG }[] = [
    { kpi: 'Tackle %',                  target: '>85%',   actual: '87%',  trend: 'up',   status: 'GREEN' },
    { kpi: 'Lineout retention',          target: '>85%',   actual: '68%',  trend: 'down', status: 'RED'   },
    { kpi: 'Scrum success',              target: '>80%',   actual: '78%',  trend: 'flat', status: 'AMBER' },
    { kpi: 'Ruck speed (sec)',           target: '<3.0',   actual: '3.1',  trend: 'flat', status: 'AMBER' },
    { kpi: 'Carries / match',            target: '>110',   actual: '124',  trend: 'up',   status: 'GREEN' },
    { kpi: 'Offloads / match',           target: '>10',    actual: '14',   trend: 'up',   status: 'GREEN' },
    { kpi: 'Turnovers won',              target: '>8',     actual: '11',   trend: 'up',   status: 'GREEN' },
    { kpi: 'Penalties conceded',         target: '<10',    actual: '12',   trend: 'down', status: 'AMBER' },
    { kpi: 'Territory %',                target: '>52%',   actual: '56%',  trend: 'up',   status: 'GREEN' },
    { kpi: 'Possession %',               target: '>50%',   actual: '53%',  trend: 'flat', status: 'GREEN' },
    { kpi: 'Metres gained',              target: '>500',   actual: '482',  trend: 'down', status: 'AMBER' },
    { kpi: 'Clean breaks',               target: '>6',     actual: '8',    trend: 'up',   status: 'GREEN' },
  ]
  const triesByPhase = [
    { label: '1-3 phases', value: 18, color: '#22C55E' },
    { label: '4-6 phases', value: 16, color: '#7C3AED' },
    { label: '7+ phases',  value: 12, color: '#F59E0B' },
  ]
  const trySources = [
    { label: 'Set piece', value: 14, color: '#7C3AED' },
    { label: 'Turnover',  value: 8,  color: '#22C55E' },
    { label: 'Counter',   value: 14, color: '#A855F7' },
    { label: 'Penalty',   value: 10, color: '#F59E0B' },
  ]
  const pointsByQuarter = [108, 134, 88, 112]
  const concededByQuarter = [82, 96, 124, 105]
  const channels = [
    { label: '1-2 (close)',  value: 168, color: '#7C3AED' },
    { label: '3-4 (mid)',    value: 142, color: '#A855F7' },
    { label: '5+ (wide)',    value: 96,  color: '#22C55E' },
  ]
  const tackleTrend = [82, 88, 91, 78, 86, 89, 84, 90]
  const tackleLabels = ['M-7','M-6','M-5','M-4','M-3','M-2','M-1','Now']
  const missedByPosition: { pos: string; missed: number; total: number; rate: string }[] = [
    { pos: '1 LHP',   missed: 12, total: 142, rate: '8.5%' },
    { pos: '2 H',     missed: 8,  total: 156, rate: '5.1%' },
    { pos: '3 THP',   missed: 11, total: 138, rate: '8.0%' },
    { pos: '4-5 Lock', missed: 18, total: 268, rate: '6.7%' },
    { pos: '6-8 BR',  missed: 26, total: 312, rate: '8.3%' },
    { pos: '9 SH',    missed: 14, total: 98,  rate: '14.3%' },
    { pos: '10 FH',   missed: 19, total: 124, rate: '15.3%' },
    { pos: '12-13 C', missed: 24, total: 224, rate: '10.7%' },
    { pos: '11-14 W', missed: 16, total: 156, rate: '10.3%' },
    { pos: '15 FB',   missed: 9,  total: 88,  rate: '10.2%' },
  ]
  const lineoutCalls: { call: string; success: number; attempts: number; pct: number }[] = [
    { call: 'Utah (tail)',   success: 16, attempts: 18, pct: 89 },
    { call: 'Apple (front)', success: 12, attempts: 15, pct: 80 },
    { call: 'Bravo (front)', success: 10, attempts: 13, pct: 77 },
    { call: 'Echo (mid)',    success: 8,  attempts: 11, pct: 73 },
    { call: 'Delta (peel)',  success: 7,  attempts: 10, pct: 70 },
    { call: 'Charlie (mid)', success: 5,  attempts: 8,  pct: 63 },
    { call: 'Foxtrot (move)', success: 4, attempts: 7,  pct: 57 },
    { call: 'Arrow (mid)',   success: 6,  attempts: 14, pct: 43 },
  ]
  const oppDb: { team: string; scouted: 'Y' | 'N'; report: 'Complete' | 'In progress' | 'Not started'; threats: string; video: number }[] = [
    { team: 'Jersey Reds',     scouted: 'Y', report: 'Complete',     threats: 'Lineout 88% · 9 turnovers Morris', video: 12 },
    { team: 'Caldy',           scouted: 'Y', report: 'In progress',  threats: 'Pack power · maul tries x6 L4',     video: 8 },
    { team: 'Cornish All',     scouted: 'Y', report: 'Complete',     threats: 'Counter-attack · backs pace',         video: 10 },
    { team: 'Coventry',        scouted: 'N', report: 'Not started',  threats: '—',                                    video: 0 },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Matches Coded"      value="18/19" sub="1 outstanding · Hartpury" />
        <KpiCard label="Video Sessions"     value="42" sub="this season" trend="up" trendValue="+6 this month" />
        <KpiCard label="Opposition Reports" value="6" sub="completed for next block" />
        <KpiCard label="KPI Targets Met"    value="7/12" sub="this month" accent="#F59E0B" />
        <KpiCard label="Data Points"        value="14.2K" sub="this season" trend="up" trendValue="+1.8K" />
      </div>

      <InsightCard title="Team KPIs" subtitle="12 metrics · target / actual / trend / RAG">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">KPI</th>
            <th className="text-center py-2">Target</th>
            <th className="text-center py-2">Actual</th>
            <th className="text-center py-2">Trend</th>
            <th className="text-left py-2 pl-3">Status</th>
          </tr></thead>
          <tbody>
            {kpis.map((k, i) => (
              <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                <td className="py-2 text-white">{k.kpi}</td>
                <td className="py-2 text-center text-gray-400 font-mono">{k.target}</td>
                <td className="py-2 text-center text-white font-mono font-bold" style={{ color: ragHex(k.status) }}>{k.actual}</td>
                <td className="py-2 text-center text-base">{trendArrow(k.trend)}</td>
                <td className="py-2 pl-3"><span className={`text-[10px] px-2 py-0.5 rounded border ${ragBg(k.status)}`}>{k.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Tries by Phase" subtitle="46 total · how the team scores">
          <Donut data={triesByPhase} size={140} />
        </InsightCard>
        <InsightCard title="Try Sources" subtitle="46 total · attack origin">
          <Donut data={trySources} size={140} />
        </InsightCard>
      </div>

      <InsightCard title="Points by Quarter" subtitle="When the team scores · concedes (season aggregate)">
        <div className="grid grid-cols-4 gap-3">
          {pointsByQuarter.map((p, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Q{i + 1}</div>
              <div className="text-xl font-black text-green-400 mt-1">+{p}</div>
              <div className="text-xs text-red-400 font-mono">−{concededByQuarter[i]}</div>
              <div className={`text-[10px] mt-1 font-bold ${p - concededByQuarter[i] > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p - concededByQuarter[i] > 0 ? '+' : ''}{p - concededByQuarter[i]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-gray-500">Q3 problem area — 36-point negative differential. Possible bench drop-off / fitness pattern.</div>
      </InsightCard>

      <InsightCard title="Metres Gained by Channel" subtitle="Where the attack goes · season">
        <Donut data={channels} size={140} />
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Tackles · Last 8" subtitle="Made vs missed · trend">
          <LineChart values={tackleTrend} labels={tackleLabels} max={100} min={70} color="#22C55E" />
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Dominant tackle %: <span className="text-white font-bold">38%</span></span>
            <span>Red zone tries conceded: <span className="text-red-400 font-bold">14</span></span>
          </div>
        </InsightCard>
        <InsightCard title="Missed Tackles by Position" subtitle="Season-to-date · % of attempts">
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left py-1.5">Position</th>
              <th className="text-right py-1.5">Missed</th>
              <th className="text-right py-1.5">Attempted</th>
              <th className="text-right py-1.5">Rate</th>
            </tr></thead>
            <tbody>
              {missedByPosition.map((p, i) => {
                const rateNum = parseFloat(p.rate)
                return (
                  <tr key={i} className="border-b border-gray-800/40">
                    <td className="py-1.5 text-white">{p.pos}</td>
                    <td className="py-1.5 text-right text-gray-300 font-mono">{p.missed}</td>
                    <td className="py-1.5 text-right text-gray-400 font-mono">{p.total}</td>
                    <td className="py-1.5 text-right font-mono font-bold" style={{ color: rateNum > 12 ? '#EF4444' : rateNum > 8 ? '#F59E0B' : '#22C55E' }}>{p.rate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </InsightCard>
      </div>

      <InsightCard title="Lineout Calls · Deep Dive" subtitle="8 calls · success rates · season">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Call</th>
            <th className="text-center py-2">Success</th>
            <th className="text-center py-2">Attempts</th>
            <th className="text-left py-2 pl-3 w-1/2">Success rate</th>
          </tr></thead>
          <tbody>
            {lineoutCalls.map((c, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white font-medium">{c.call}</td>
                <td className="py-2 text-center text-gray-300 font-mono">{c.success}</td>
                <td className="py-2 text-center text-gray-400 font-mono">{c.attempts}</td>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-3">
                    <ProgressBar value={c.pct} color={c.pct >= 80 ? '#22C55E' : c.pct >= 65 ? '#F59E0B' : '#EF4444'} />
                    <span className="font-mono font-bold w-12 text-right" style={{ color: c.pct >= 80 ? '#22C55E' : c.pct >= 65 ? '#F59E0B' : '#EF4444' }}>{c.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <InsightCard title="Opposition Database" subtitle="Next 4 opponents">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2">Scouted</th>
            <th className="text-left py-2">Report status</th>
            <th className="text-left py-2">Key threats</th>
            <th className="text-center py-2">Video</th>
          </tr></thead>
          <tbody>
            {oppDb.map((o, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white font-medium">{o.team}</td>
                <td className="py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded ${o.scouted === 'Y' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{o.scouted}</span></td>
                <td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${o.report === 'Complete' ? 'bg-green-600/20 text-green-400' : o.report === 'In progress' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-800 text-gray-500'}`}>{o.report}</span></td>
                <td className="py-2 text-[11px] text-gray-300">{o.threats}</td>
                <td className="py-2 text-center text-gray-400 font-mono">{o.video}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>
    </div>
  )
}

// ─── 7 · COMMERCIAL ───────────────────────────────────────────────────────

function CommercialInsights() {
  const revenueBreakdown: { cat: string; budget: number; actual: number; color: string }[] = [
    { cat: 'Matchday',     budget: 720, actual: 684, color: '#7C3AED' },
    { cat: 'Sponsorship',  budget: 540, actual: 520, color: '#A855F7' },
    { cat: 'Hospitality',  budget: 320, actual: 296, color: '#22C55E' },
    { cat: 'Merchandise',  budget: 110, actual: 142, color: '#F59E0B' },
    { cat: 'Broadcasting', budget: 180, actual: 168, color: '#3B82F6' },
    { cat: 'Other',        budget: 80,  actual: 92,  color: '#6B7280' },
  ]
  const attendance = [3210, 3890, 2940, 4100, 3520, 3680, 3210, 2890, 3410, 3720]
  const attendanceLabels = ['M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1','Now']
  const ticketMix = [
    { label: 'Season',       value: 1840, color: '#7C3AED' },
    { label: 'Walk-up',      value: 980,  color: '#A855F7' },
    { label: 'Hospitality',  value: 280,  color: '#F59E0B' },
    { label: 'Comp',         value: 110,  color: '#6B7280' },
  ]
  const sponsors: { name: string; value: number; status: 'Active' | 'Renewal' | 'Pipeline'; renewal: string; contact: string }[] = [
    { name: 'Hartfield Building Society',  value: 85000, status: 'Renewal',  renewal: 'May 2026', contact: 'Dan Mason' },
    { name: 'West Country Energy',         value: 28000, status: 'Active',   renewal: 'Jul 2026', contact: 'Sara Khan' },
    { name: 'Smith & Sons Builders',       value: 35000, status: 'Active',   renewal: 'Aug 2026', contact: 'M. Smith' },
    { name: 'Lexington Motors',            value: 24000, status: 'Active',   renewal: 'Aug 2026', contact: 'L. Reed' },
    { name: 'Riverbend Insurance',         value: 18000, status: 'Active',   renewal: 'Sep 2026', contact: 'P. Tate' },
    { name: 'Hartfield Estates',           value: 15000, status: 'Active',   renewal: 'Sep 2026', contact: 'A. Ozawa' },
    { name: 'Bridge Brewery',              value: 12000, status: 'Active',   renewal: 'Oct 2026', contact: 'C. White' },
    { name: 'Northgate Logistics',         value: 22000, status: 'Active',   renewal: 'Nov 2026', contact: 'R. Drury' },
    { name: 'Linton Plumbing',             value: 8000,  status: 'Active',   renewal: 'Dec 2026', contact: 'L. Fox' },
    { name: 'Westside Print',              value: 6500,  status: 'Active',   renewal: 'Dec 2026', contact: 'J. Weir' },
    { name: 'Caldwell Foods',              value: 14000, status: 'Renewal',  renewal: 'Jun 2026', contact: 'S. Caldwell' },
    { name: 'Alderfield Solutions',        value: 11000, status: 'Active',   renewal: 'Mar 2027', contact: 'B. Park' },
    { name: 'Pinedale Tools',              value: 18000, status: 'Pipeline', renewal: '—',         contact: 'pending' },
    { name: 'Westvale Health',             value: 25000, status: 'Pipeline', renewal: '—',         contact: 'pending' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Revenue YTD"     value="£1.82M" sub="vs £1.95M budget · 93%" accent="#F59E0B" />
        <KpiCard label="Matchday Avg"    value="3,210" sub="target 3,500" trend="up" trendValue="+4%" />
        <KpiCard label="Sponsors"        value="12" sub="active · 2 renewals due" />
        <KpiCard label="Hospitality"     value="78%" sub="sold · next home match" trend="up" trendValue="+12%" accent="#22C55E" />
        <KpiCard label="Social"          value="14.2K" sub="followers · +8% Q" trend="up" trendValue="+8%" />
      </div>

      <InsightCard title="Revenue Breakdown" subtitle="Budget vs actual by category · £k YTD">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Category</th>
            <th className="text-right py-2">Budget</th>
            <th className="text-right py-2">Actual</th>
            <th className="text-right py-2">Variance</th>
            <th className="text-left py-2 pl-3 w-2/5">Progress</th>
          </tr></thead>
          <tbody>
            {revenueBreakdown.map((r, i) => {
              const variance = r.actual - r.budget
              const pct = (r.actual / r.budget) * 100
              return (
                <tr key={i} className="border-b border-gray-800/40">
                  <td className="py-2 text-white font-medium">{r.cat}</td>
                  <td className="py-2 text-right text-gray-400 font-mono">£{r.budget}k</td>
                  <td className="py-2 text-right text-white font-mono font-bold">£{r.actual}k</td>
                  <td className={`py-2 text-right font-mono font-bold ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{variance >= 0 ? '+' : ''}£{variance}k</td>
                  <td className="py-2 pl-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.actual} max={r.budget * 1.2} color={r.color} />
                      <span className="font-mono w-12 text-right" style={{ color: pct >= 100 ? '#22C55E' : '#F59E0B' }}>{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Attendance · Last 10" subtitle="Home matches · paying">
          <BarChart values={attendance.map(v => Math.round(v / 100))} labels={attendanceLabels} max={45} height={140} color="#7C3AED" target={35} />
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Best: <span className="text-white font-bold">vs Cornish All (4,100)</span></span>
            <span>Worst: <span className="text-white font-bold">vs Bedford (2,890)</span></span>
          </div>
        </InsightCard>
        <InsightCard title="Ticket Mix" subtitle="Season-to-date · 3,210 ticket holders">
          <Donut data={ticketMix} size={140} />
          <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-3 text-[11px]">
            <div><span className="text-gray-400">Avg spend per head</span><div className="text-white font-bold">£22.40</div></div>
            <div><span className="text-gray-400">Food + drink + merch</span><div className="text-white font-bold">£71.9k / month</div></div>
          </div>
        </InsightCard>
      </div>

      <InsightCard title="Sponsorship Pipeline" subtitle="12 active + 2 in pipeline · total live value £296k">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Sponsor</th>
            <th className="text-right py-2">Value</th>
            <th className="text-left py-2 pl-3">Status</th>
            <th className="text-left py-2">Renewal</th>
            <th className="text-left py-2">Contact</th>
          </tr></thead>
          <tbody>
            {sponsors.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white">{s.name}</td>
                <td className="py-2 text-right text-gray-300 font-mono font-bold">{fmt(s.value)}</td>
                <td className="py-2 pl-3"><span className={`text-[10px] px-2 py-0.5 rounded ${s.status === 'Active' ? 'bg-green-600/20 text-green-400' : s.status === 'Renewal' ? 'bg-amber-600/20 text-amber-400' : 'bg-purple-600/20 text-purple-400'}`}>{s.status}</span></td>
                <td className="py-2 text-gray-400 font-mono">{s.renewal}</td>
                <td className="py-2 text-gray-400">{s.contact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Social & Digital" subtitle="14,200 followers across 4 platforms">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { p: 'Instagram', n: 6800, c: '#E1306C' },
              { p: 'X',         n: 3200, c: '#1DA1F2' },
              { p: 'Facebook',  n: 2700, c: '#1877F2' },
              { p: 'TikTok',    n: 1500, c: '#69C9D0' },
            ].map((x, i) => (
              <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{x.p}</div>
                <div className="text-lg font-black text-white">{x.n.toLocaleString()}</div>
                <div className="mt-1"><ProgressBar value={x.n} max={7000} color={x.c} height={3} /></div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-gray-400 space-y-1.5">
            <div className="flex justify-between border-t border-gray-800 pt-2"><span>Engagement rate</span><span className="text-green-400 font-bold">4.2% (vs 2.8% industry)</span></div>
            <div className="flex justify-between"><span>Top post this month</span><span className="text-white font-bold">Foster try clip · 12K reach</span></div>
            <div className="flex justify-between"><span>Content calendar</span><span className="text-white font-bold">5 posts queued · next Sat AM</span></div>
          </div>
        </InsightCard>

        <InsightCard title="Merchandise" subtitle="Top sellers + stock alerts">
          <div className="space-y-2 mb-4">
            {[
              { item: 'Replica home shirt',     sold: 218, color: '#7C3AED' },
              { item: 'Bobble hat',             sold: 142, color: '#A855F7' },
              { item: 'Training top',           sold: 86,  color: '#22C55E' },
              { item: 'Scarf · classic',         sold: 64,  color: '#F59E0B' },
              { item: 'Stadium pin badge',      sold: 92,  color: '#3B82F6' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-32">{m.item}</span>
                <div className="flex-1"><ProgressBar value={m.sold} max={250} color={m.color} /></div>
                <span className="text-xs text-white font-mono font-bold w-12 text-right">{m.sold}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
            <div className="text-[11px]">
              <div className="text-gray-400">Revenue this month</div>
              <div className="text-white font-bold text-base">£18,420</div>
              <div className="text-green-400 text-[10px]">+12% vs last month</div>
            </div>
            <div className="text-[11px]">
              <div className="text-gray-400">Stock alerts</div>
              <div className="text-amber-400 font-bold">2 items low stock</div>
              <div className="text-[10px] text-gray-500">Bobble hats · scarves</div>
            </div>
          </div>
        </InsightCard>
      </div>
    </div>
  )
}

// ─── 8 · CEO / CHAIRMAN ───────────────────────────────────────────────────

function CeoInsights({ club }: { club: RugbyClub }) {
  const headroom = club.capCeiling - club.currentSpend
  const pl: { line: string; ytd: number; budget: number; lastYear: number; status: RAG; bold?: boolean; isTotal?: boolean }[] = [
    { line: 'Matchday',         ytd: 684,  budget: 720,  lastYear: 642,  status: 'AMBER' },
    { line: 'Commercial',       ytd: 520,  budget: 540,  lastYear: 480,  status: 'AMBER' },
    { line: 'Broadcasting',     ytd: 168,  budget: 180,  lastYear: 165,  status: 'AMBER' },
    { line: 'Other',            ytd: 92,   budget: 80,   lastYear: 78,   status: 'GREEN' },
    { line: 'Total revenue',    ytd: 1820, budget: 1950, lastYear: 1730, status: 'AMBER', bold: true, isTotal: true },
    { line: 'Playing costs',    ytd: 1240, budget: 1200, lastYear: 1180, status: 'RED'   },
    { line: 'Non-playing',      ytd: 320,  budget: 340,  lastYear: 310,  status: 'GREEN' },
    { line: 'Operations',       ytd: 145,  budget: 150,  lastYear: 142,  status: 'GREEN' },
    { line: 'Facilities',       ytd: 78,   budget: 90,   lastYear: 82,   status: 'GREEN' },
    { line: 'Total costs',      ytd: 1783, budget: 1780, lastYear: 1714, status: 'AMBER', bold: true, isTotal: true },
    { line: 'Operating surplus', ytd: 42,  budget: 65,   lastYear: 16,   status: 'AMBER', bold: true, isTotal: true },
  ]
  const strategic: { priority: string; kpi: string; target: string; actual: string; status: RAG }[] = [
    { priority: 'Top 4 finish',                kpi: 'League position',           target: 'Top 4',     actual: '4th',      status: 'GREEN' },
    { priority: 'Franchise compliance',         kpi: 'RFU score',                 target: '80%+',      actual: '71%',      status: 'AMBER' },
    { priority: 'Attendance growth',            kpi: 'Avg attendance',            target: '3,500',     actual: '3,210',    status: 'AMBER' },
    { priority: 'Academy pathway',              kpi: '1st-team graduates',        target: '2/season',  actual: '1',        status: 'GREEN' },
    { priority: 'Commercial revenue',           kpi: 'Sponsor + matchday growth', target: '+15%',      actual: '+11%',     status: 'AMBER' },
    { priority: 'Facilities investment',        kpi: 'Capex deployed',            target: '£250k',     actual: '£185k',    status: 'AMBER' },
    { priority: 'Community engagement',         kpi: 'Hours donated',             target: '1,000',     actual: '1,180',    status: 'GREEN' },
    { priority: "Women's programme",             kpi: 'PWR registration',          target: 'Submitted', actual: 'In draft', status: 'RED' },
  ]
  const risks: { risk: string; likelihood: 'L' | 'M' | 'H'; impact: 'L' | 'M' | 'H'; mitigation: string; owner: string }[] = [
    { risk: 'Franchise non-compliance',          likelihood: 'M', impact: 'H', mitigation: 'PWR plan + facilities works prioritised', owner: 'DoR'      },
    { risk: 'Key player season-ending injury',   likelihood: 'M', impact: 'H', mitigation: 'Squad depth review · loan options open',  owner: 'Medical'  },
    { risk: 'Budget overrun (playing costs)',     likelihood: 'M', impact: 'M', mitigation: 'Contract review board · cap ceiling',     owner: 'Finance'  },
    { risk: 'Sponsor non-renewal (Hartfield)',   likelihood: 'M', impact: 'M', mitigation: 'Renewal meetings + activation review',     owner: 'Comm.'    },
    { risk: 'Pitch condition (winter games)',    likelihood: 'L', impact: 'H', mitigation: 'Drainage works + cover schedule',          owner: 'Ops'      },
    { risk: 'Safeguarding incident',             likelihood: 'L', impact: 'H', mitigation: 'DBS audit current · training quarterly',    owner: 'CEO'      },
  ]
  const board: { date: string; event: string; type: string }[] = [
    { date: '12 May', event: 'Board meeting · Q4 review',           type: 'board' },
    { date: '15 May', event: 'Investment pack — legal due diligence', type: 'compliance' },
    { date: '30 May', event: 'AGM prep · 2026/27 budget tabled',     type: 'agm' },
    { date: '14 Jun', event: 'Sponsor & supplier dinner',             type: 'commercial' },
    { date: '28 Jun', event: 'AGM',                                   type: 'agm' },
    { date: '15 Jul', event: 'Pre-season strategy day',               type: 'board' },
  ]
  const npsTrend = [62, 68, 70, 72]
  const npsLabels = ['Q1', 'Q2', 'Q3', 'Q4']
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Operating Surplus" value="£42k" sub="vs £65k budget" accent="#F59E0B" trend="up" trendValue="+£26k vs LY" />
        <KpiCard label="Franchise Score"   value={`${club.franchiseScore}%`} sub="target 80%" accent="#F59E0B" />
        <KpiCard label="League Position"   value="4th" sub="target: top 4" accent="#22C55E" />
        <KpiCard label="Headcount"         value="86" sub="52 playing · 34 non-playing" />
        <KpiCard label="NPS"               value="72" sub="fan satisfaction" trend="up" trendValue="+10 YoY" accent="#22C55E" />
      </div>

      <InsightCard title="P&L Summary" subtitle="YTD vs budget vs prior year (£k)">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2"></th>
            <th className="text-right py-2">YTD</th>
            <th className="text-right py-2">Budget</th>
            <th className="text-right py-2">Var.</th>
            <th className="text-right py-2">Last year</th>
            <th className="text-right py-2">YoY</th>
            <th className="text-left py-2 pl-3">Status</th>
          </tr></thead>
          <tbody>
            {pl.map((r, i) => {
              const varBudget = r.ytd - r.budget
              const varLY     = r.ytd - r.lastYear
              return (
                <tr key={i} className={`border-b border-gray-800/40 ${r.bold ? 'bg-gray-800/20' : ''}`}>
                  <td className={`py-2 ${r.bold ? 'text-white font-bold' : 'text-gray-300'}`}>{r.line}</td>
                  <td className={`py-2 text-right font-mono ${r.bold ? 'text-white font-bold' : 'text-gray-300'}`}>£{r.ytd}k</td>
                  <td className="py-2 text-right text-gray-400 font-mono">£{r.budget}k</td>
                  <td className={`py-2 text-right font-mono font-bold ${varBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>{varBudget >= 0 ? '+' : ''}£{varBudget}k</td>
                  <td className="py-2 text-right text-gray-500 font-mono">£{r.lastYear}k</td>
                  <td className={`py-2 text-right font-mono ${varLY >= 0 ? 'text-green-400' : 'text-red-400'}`}>{varLY >= 0 ? '+' : ''}£{varLY}k</td>
                  <td className="py-2 pl-3"><span className="w-2 h-2 rounded-full inline-block" style={{ background: ragHex(r.status) }} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </InsightCard>

      <InsightCard title="Strategic Dashboard" subtitle="Board-level priorities · 8 KPIs">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Priority</th>
            <th className="text-left py-2">KPI</th>
            <th className="text-center py-2">Target</th>
            <th className="text-center py-2">Actual</th>
            <th className="text-left py-2 pl-3">Status</th>
          </tr></thead>
          <tbody>
            {strategic.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white">{s.priority}</td>
                <td className="py-2 text-gray-400">{s.kpi}</td>
                <td className="py-2 text-center text-gray-400 font-mono">{s.target}</td>
                <td className="py-2 text-center text-white font-mono font-bold" style={{ color: ragHex(s.status) }}>{s.actual}</td>
                <td className="py-2 pl-3"><span className={`text-[10px] px-2 py-0.5 rounded border ${ragBg(s.status)}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <InsightCard title="Risk Register" subtitle="6 board-tracked risks">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2">Risk</th>
            <th className="text-center py-2">Likelihood</th>
            <th className="text-center py-2">Impact</th>
            <th className="text-left py-2">Mitigation</th>
            <th className="text-left py-2">Owner</th>
          </tr></thead>
          <tbody>
            {risks.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/40">
                <td className="py-2 text-white font-medium">{r.risk}</td>
                <td className="py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.likelihood === 'H' ? 'bg-red-600/20 text-red-400' : r.likelihood === 'M' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>{r.likelihood}</span></td>
                <td className="py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.impact === 'H' ? 'bg-red-600/20 text-red-400' : r.impact === 'M' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>{r.impact}</span></td>
                <td className="py-2 text-[11px] text-gray-300">{r.mitigation}</td>
                <td className="py-2 text-gray-400">{r.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InsightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard title="Board Calendar" subtitle="Next 90 days · 6 entries">
          <div className="space-y-2">
            {board.map((b, i) => (
              <div key={i} className="flex items-baseline gap-3 py-2 border-b border-gray-800/40">
                <span className="text-[11px] text-purple-400 font-mono font-bold w-16">{b.date}</span>
                <span className="text-xs text-white flex-1">{b.event}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${b.type === 'agm' ? 'bg-red-600/20 text-red-400' : b.type === 'compliance' ? 'bg-amber-600/20 text-amber-400' : b.type === 'commercial' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>{b.type}</span>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Stakeholder Summary" subtitle="Fan · player · staff · community">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">Fan satisfaction (NPS)</span>
                <span className="text-green-400 font-bold">72 · trending up</span>
              </div>
              <LineChart values={npsTrend} labels={npsLabels} max={80} min={50} color="#22C55E" height={80} width={300} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-purple-400">8.4</div>
                <div className="text-[10px] text-gray-500">Player satisfaction</div>
                <div className="text-[10px] text-gray-400 mt-1">/10 anon. survey</div>
              </div>
              <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-green-400">12%</div>
                <div className="text-[10px] text-gray-500">Staff turnover</div>
                <div className="text-[10px] text-gray-400 mt-1">vs 18% industry</div>
              </div>
              <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-amber-400">1,180</div>
                <div className="text-[10px] text-gray-500">Hours donated</div>
                <div className="text-[10px] text-gray-400 mt-1">community impact</div>
              </div>
            </div>
          </div>
        </InsightCard>
      </div>
    </div>
  )
}

// ─── DIRECTOR OF RUGBY BRIEFING VIEW ──────────────────────────────────────────
function DoRBriefingView({club}:{club:RugbyClub}) {
  const [brief,setBrief]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [autoMode,setAutoMode]=useState(false);
  const CONTEXT={date:'Thursday 9 April 2026',matchWeek:`vs Jersey Reds — Saturday 11 April — Home`,cap:{headroom:club.capCeiling-club.currentSpend,spend:club.currentSpend,ceiling:club.capCeiling},franchise:{score:club.franchiseScore,criticalGaps:['Investment Capacity (48%)',"Women's Game (42%)"]},gps:{avgACWR:1.22,overloaded:['Luke Barnes (1.52)','Danny Foster (1.38)'],managing:['Karl Foster (1.44)']},welfare:{hiaActive:'Danny Foster — Day 8',doubtful:['Danny Cole (hamstring)','Ryan Patel (hamstring)']},recruitment:{targets:6,priorityAction:'LHP closing — Championship clubs circling',capImpact:'Signing at £95k → headroom: £365k'},commercial:{nextMeeting:'Hartfield Building Society — 3 May',renewalDue:'Local Energy Co — May 2026'}};
  const generate = async () => {
    setLoading(true);setBrief(null);
    try {
      const res = await fetch('/api/ai/rugby',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are the Club Intelligence AI for ${club.name}. Generate a 400-word DoR morning briefing for ${club.dor}. Today: ${CONTEXT.date} — ${CONTEXT.matchWeek}. Cap: ceiling £${(CONTEXT.cap.ceiling/1e6).toFixed(2)}M, spend £${(CONTEXT.cap.spend/1e6).toFixed(2)}M, headroom £${(CONTEXT.cap.headroom/1000).toFixed(0)}k. Franchise: ${CONTEXT.franchise.score}% (target 85%), gaps: ${CONTEXT.franchise.criticalGaps.join(', ')}. GPS: avg ACWR ${CONTEXT.gps.avgACWR}, overload: ${CONTEXT.gps.overloaded.join(', ')}, manage: ${CONTEXT.gps.managing.join(', ')}. Welfare: HIA ${CONTEXT.welfare.hiaActive}, doubtful: ${CONTEXT.welfare.doubtful.join(', ')}. Recruitment: ${CONTEXT.recruitment.targets} targets, priority: ${CONTEXT.recruitment.priorityAction}. Commercial: next event ${CONTEXT.commercial.nextMeeting}, renewal ${CONTEXT.commercial.renewalDue}. Format: ## Good morning, ${club.dor} | ## 🏟️ MATCH WEEK | ## 📡 SQUAD HEALTH | ## ⚖️ CAP | ## 🏆 FRANCHISE | ## 💼 COMMERCIAL | ## ✅ YOUR 3 PRIORITIES TODAY. Under 400 words.`}]})});
      const data=await res.json();setBrief(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error.');
    } catch { setBrief('Connection error.'); }
    setLoading(false);
  };
  const renderBrief=(text:string)=>text.split('\n').map((line,i)=>{if(line.startsWith('## Good morning'))return<h2 key={i} className="text-base font-bold text-white mb-4">{line.replace('## ','')}</h2>;if(line.startsWith('## '))return<h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;if(line.match(/^\d\./))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1.5 ml-2"><span className="text-purple-400 font-bold flex-shrink-0">{line[0]}.</span><span>{line.slice(2)}</span></div>;if(line.startsWith('- '))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1 ml-2"><span className="text-purple-500 flex-shrink-0 mt-0.5">•</span><span>{line.slice(2)}</span></div>;if(line.trim()==='')return<div key={i} className="h-1.5"/>;return<p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;});
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="🌅" title="DoR Morning Briefing" subtitle={`${club.dor} · ${CONTEXT.date} · ${CONTEXT.matchWeek}`}/>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><StatCard label="Cap Headroom" value={`£${(CONTEXT.cap.headroom/1000).toFixed(0)}k`} sub="Compliant" color="green"/><StatCard label="Franchise" value={`${CONTEXT.franchise.score}%`} sub="Target: 85%" color="orange"/><StatCard label="Squad ACWR" value={CONTEXT.gps.avgACWR} sub="2 overloaded" color={CONTEXT.gps.avgACWR>1.3?'red':'green'}/><StatCard label="HIA Active" value="1" sub={CONTEXT.welfare.hiaActive} color="red"/><StatCard label="Recruits" value={CONTEXT.recruitment.targets} sub="6 targets" color="purple"/></div>
      <div className="flex items-center gap-4"><button onClick={generate} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">{loading?<><span className="animate-spin inline-block">⟳</span> Generating...</>:<><span>🤖</span> Generate Today&apos;s Brief</>}</button><div className="flex items-center gap-2"><button onClick={()=>setAutoMode(!autoMode)} className={`w-10 h-5 rounded-full relative transition-colors ${autoMode?'bg-purple-600':'bg-gray-700'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${autoMode?'right-0.5':'left-0.5'}`}/></button><span className="text-xs text-gray-400">Auto 07:30</span></div></div>
      {brief&&<Card className="border-purple-600/30"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 Lumio AI · DoR Brief</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">CONFIDENTIAL</span></div><button onClick={generate} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button></div><div className="divide-y divide-gray-800/30">{renderBrief(brief)}</div><div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-[10px] text-gray-600">Powered by Claude · {CONTEXT.date}</span><button className="text-xs text-purple-400 hover:text-purple-300">Forward to Head Coach →</button></div></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{source:'Lumio Health',status:'Live · 07:24',dot:'green'},{source:'Lumio GPS GPS',status:'Live · last session',dot:'green'},{source:'Cap system',status:'Live',dot:'green'},{source:'Franchise tracker',status:'Updated 8 Apr',dot:'amber'}].map((s,i)=><div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="flex items-center gap-1.5 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${s.dot==='green'?'bg-green-400':'bg-amber-400'}`}/><span className="text-xs text-white font-medium">{s.source}</span></div><div className="text-[10px] text-gray-500">{s.status}</div></div>)}</div>
    </div>
  );
}

// ─── MATCH DAY CENTRE VIEW ────────────────────────────────────────────────────
function MatchDayCentreView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏟️" title="Match Day Centre" subtitle={`${club.name} vs Jersey Reds — ${club.nextFixtureDate} — KO 3:00pm — The Grange`} />

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[{l:'Competition',v:'Champ Rugby — Round 18'},{l:'Referee',v:'Martin Walsh (RFU ✓)'},{l:'Commissioner',v:'TBC'},{l:'Venue',v:'The Grange, Hartfield'}].map((d:{l:string;v:string},i:number)=>(
            <div key={i}><div className="text-gray-500">{d.l}</div><div className="text-white font-medium mt-0.5">{d.v}</div></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Starting XV */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Starting XV</div>
          <div className="space-y-1">
            {[{n:1,name:'Tom Harrison',pos:'Loosehead Prop',r:94},{n:2,name:'James Briggs',pos:'Hooker',r:100},{n:3,name:'Jake Rawlings',pos:'Tighthead Prop',r:86},
              {n:4,name:'Marcus Webb',pos:'Lock',r:87},{n:5,name:'Chris Palmer',pos:'Lock',r:91},{n:6,name:'Josh White',pos:'Blindside',r:88},
              {n:7,name:'Karl Foster',pos:'Openside',r:82},{n:8,name:'TBC',pos:'No.8 (Foster HIA)',r:0},
              {n:9,name:'Oliver Grant',pos:'Scrum Half',r:90},{n:10,name:'Danny Cole',pos:'Fly Half',r:71},
              {n:11,name:'Ryan Patel',pos:'Left Wing',r:45},{n:12,name:'Matt Jones',pos:'Inside Centre',r:93},
              {n:13,name:'David Obi',pos:'Outside Centre',r:91},{n:14,name:'Ben Taylor',pos:'Right Wing',r:89},{n:15,name:'Luke Barnes',pos:'Fullback',r:95},
            ].map((p:{n:number;name:string;pos:string;r:number},i:number)=>(
              <div key={i} className={`flex items-center gap-3 py-1.5 border-b border-gray-800/50 ${p.r<60&&p.r>0?'opacity-60':''}`}>
                <span className="text-xs text-purple-400 font-bold w-6 text-right">{p.n}</span>
                <span className={`text-sm flex-1 ${p.r===0?'text-red-400 italic':'text-white'}`}>{p.name}</span>
                <span className="text-xs text-gray-500">{p.pos}</span>
                {p.r>0&&<span className={`text-xs font-medium ${p.r>=80?'text-green-400':p.r>=60?'text-amber-400':'text-red-400'}`}>{p.r}%</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* Match Week Timeline */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Match Week Timeline</div>
          <div className="space-y-3">
            {[
              {day:'Mon',items:['Analysis of Jersey Reds — set piece review ✓']},
              {day:'Tue',items:['Team run — 29 players ✓']},
              {day:'Wed',items:['Media — post-training press call 1pm']},
              {day:'Thu',items:['Team meeting 10am — game plan finalised']},
              {day:'Fri',items:['Captain\'s Run 11am','Pre-match dinner 7pm']},
              {day:'Sat',items:['Arrive The Grange 12pm','KO 3pm','Post-match function 5:30pm']},
            ].map((d:{day:string;items:string[]},i:number)=>(
              <div key={i} className="py-1.5 border-b border-gray-800/50">
                <span className="text-xs text-purple-400 font-bold">{d.day}</span>
                {d.items.map((item:string,j:number)=>(<div key={j} className="text-sm text-gray-300 ml-8">{item}</div>))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Opposition Intel */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Opposition Intel — Jersey Reds</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[{l:'Position',v:'6th'},{l:'Form (L5)',v:'W L W W L'},{l:'Lineout',v:'88% retention'},{l:'Scrum',v:'62% success'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold text-sm">{s.v}</div><div className="text-xs text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
        <div className="text-xs text-gray-400 leading-relaxed">
          <span className="text-amber-400 font-medium">Coach note:</span> &quot;Attack their scrum early — 4 scrum penalties in last 3 games. Wingers compete for high ball — Hawkins kicks long to left channel 60% of the time. Neutralise Charlie Morris at breakdown.&quot;
        </div>
      </Card>
    </div>
  );
}

// ─── CLUB CALENDAR VIEW ──────────────────────────────────────────────────────
function ClubCalendarView() {
  const events: Array<{date:string;event:string;type:string}> = [
    {date:'11 Apr',event:'vs Jersey Reds (Home) KO 3pm',type:'fixture'},
    {date:'15 Apr',event:'Corporate conference — 80 delegates',type:'commercial'},
    {date:'18 Apr',event:'School rugby festival — 240 children',type:'community'},
    {date:'25 Apr',event:'Business networking evening',type:'commercial'},
    {date:'27 Apr–10 May',event:'International window (6 players)',type:'intl'},
    {date:'30 Apr',event:'Women\'s PWR registration deadline',type:'compliance'},
    {date:'3 May',event:'Hartfield Building Society hospitality',type:'commercial'},
    {date:'10 May',event:'Salary cap return deadline',type:'compliance'},
  ];
  const typeColors: Record<string,string> = {fixture:'text-purple-400',commercial:'text-blue-400',community:'text-green-400',intl:'text-amber-400',compliance:'text-red-400'};
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📅" title="Club Calendar" subtitle="Fixtures, training, commercial events, and compliance deadlines." />
      <Card>
        <div className="space-y-2">
          {events.map((e:{date:string;event:string;type:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-28 flex-shrink-0">{e.date}</span>
              <span className={`text-sm ${typeColors[e.type]||'text-gray-300'}`}>{e.event}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded ml-auto">{e.type}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex gap-4">
        {Object.entries(typeColors).map(([type,color]:[string,string],i:number)=>(
          <div key={i} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${color.replace('text-','bg-')}`}></div><span className="text-[10px] text-gray-500 capitalize">{type}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── CAP DASHBOARD VIEW ──────────────────────────────────────────────────────
function CapDashboardView({club}:{club:RugbyClub}) {
  const headroom = club.capCeiling - club.currentSpend;
  const academyCredits = 48000;
  const centralDiscounts = 35000;
  const effectiveCharge = club.currentSpend - academyCredits - centralDiscounts;
  const effectiveHeadroom = club.capCeiling - effectiveCharge;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⚖️" title="Salary Cap Dashboard" subtitle="Live salary cap management — Champ Rugby 2025/26 season." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Cap Ceiling" value={fmt(club.capCeiling)} color="purple" />
        <StatCard label="Current Spend" value={fmt(club.currentSpend)} color="teal" />
        <StatCard label="Headroom" value={fmt(headroom)} sub="GREEN — Compliant" color="green" />
        <StatCard label="Effective Charge" value={fmt(effectiveCharge)} sub="After credits" color="blue" />
      </div>

      {/* Cap Bar */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Three-Zone Cap Indicator</div>
        <div className="relative h-10 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div className="absolute inset-0 flex">
            <div style={{width:`${(club.capFloor/club.capCeiling)*100}%`}} className="bg-red-600/20 border-r border-red-500/50"></div>
            <div style={{width:`${((club.currentSpend-club.capFloor)/club.capCeiling)*100}%`}} className="bg-green-600/30"></div>
            <div style={{width:`${((club.capCeiling-club.currentSpend)/club.capCeiling)*100}%`}} className="bg-green-600/10"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{fmt(club.currentSpend)} — COMPLIANT</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Floor: {fmt(club.capFloor)}</span><span>Ceiling: {fmt(club.capCeiling)}</span>
        </div>
      </Card>

      {/* Squad Cap Breakdown */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Squad Cap Breakdown (Top 20 by charge)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">Contract</th><th className="text-left p-3">Weekly</th><th className="text-left p-3">Annual Cap</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {[...SQUAD].sort((a:{weeklyWage:number},b:{weeklyWage:number})=>b.weeklyWage-a.weeklyWage).slice(0,20).map((p:{name:string;pos:string;contractEnd:string;weeklyWage:number;loan:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className="p-3 text-gray-400 text-xs">{p.contractEnd}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage)}</td>
                  <td className="p-3 text-purple-400 font-medium">{fmt(p.weeklyWage*52)}</td>
                  <td className="p-3">{p.loan?<span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">Loan</span>:<span className="text-xs text-gray-500">Club</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Exclusions & Credits</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Academy credits (4 players)</span><span className="text-teal-400">−{fmt(academyCredits)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Central contract discounts (2 England)</span><span className="text-teal-400">−{fmt(centralDiscounts)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Excluded players (1): Marcus Webb</span><span className="text-gray-500">Designated</span></div>
            <div className="flex justify-between py-2 text-white font-bold"><span>Effective Cap Charge</span><span className="text-purple-400">{fmt(effectiveCharge)}</span></div>
            <div className="flex justify-between py-1"><span className="text-white font-bold">Effective Headroom</span><span className="text-green-400 font-bold">{fmt(effectiveHeadroom)}</span></div>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Audit Status</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="py-1.5 border-b border-gray-800/50">Last return submitted: January 2026 ✓</div>
            <div className="py-1.5 border-b border-gray-800/50 text-amber-400">Next return due: May 10, 2026 (34 days)</div>
            <div className="py-1.5 border-b border-gray-800/50">Annual Salary Cap Director audit: July 2026</div>
            <div className="py-1.5 text-green-400 font-medium">Status: NO BREACHES IDENTIFIED</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PLAYER CONTRACTS VIEW ────────────────────────────────────────────────────
function PlayerContractsView() {
  const expiring = SQUAD.filter((p:{contractEnd:string})=>p.contractEnd.includes('2026'));
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Player Contracts" subtitle="Full contract database — 38 contracted players." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Expiring This Season" value={expiring.length} sub="Before June 2026" color="red" />
        <StatCard label="Loan Players" value="5" sub="3 in, 2 out" color="blue" />
        <StatCard label="2+ Years Remaining" value="12" color="green" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">Contract End</th><th className="text-left p-3">Weekly</th><th className="text-left p-3">Annual</th><th className="text-left p-3">Type</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {SQUAD.map((p:{id:number;name:string;pos:string;contractEnd:string;weeklyWage:number;loan:string;intl:boolean},i:number)=>(
                <tr key={p.id} className={`border-b border-gray-800/50 ${p.contractEnd.includes('2026')?'bg-red-600/5':''}`}>
                  <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className={`p-3 text-xs ${p.contractEnd.includes('2026')?'text-red-400 font-medium':'text-gray-400'}`}>{p.contractEnd}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage)}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage*52)}</td>
                  <td className="p-3">{p.loan?<span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">{p.loan.startsWith('in')?'Loan In':'Loan Out'}</span>:p.intl?<span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">Dual</span>:<span className="text-xs text-gray-500">Club</span>}</td>
                  <td className="p-3">{p.contractEnd.includes('2026')?<span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400">Expiring</span>:<span className="text-xs text-green-400">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SCENARIO MODELLER VIEW ───────────────────────────────────────────────────
function ScenarioModellerView({club}:{club:RugbyClub}) {
  const [wage,setWage]=useState(1500);
  const [signingOn,setSigningOn]=useState(0);
  const [contractYears,setContractYears]=useState(2);
  const annualCharge = (wage*52) + (signingOn/contractYears);
  const newTotal = club.currentSpend + annualCharge;
  const newHeadroom = club.capCeiling - newTotal;
  const newFloorBuffer = newTotal - club.capFloor;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🧮" title="Scenario Modeller" subtitle="Interactive salary cap scenario planning." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-4">Add a Signing</div>
          <div className="space-y-4">
            <div><label className="text-xs text-gray-500 block mb-1">Weekly Wage</label>
              <input type="range" min={500} max={3000} step={50} value={wage} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setWage(Number(e.target.value))} className="w-full" />
              <div className="text-sm text-purple-400 font-bold mt-1">{fmt(wage)}/week</div>
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">Signing On Fee</label>
              <input type="number" value={signingOn} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSigningOn(Number(e.target.value))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" />
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">Contract Length: {contractYears} years</label>
              <input type="range" min={1} max={3} value={contractYears} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setContractYears(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white mb-4">Impact Analysis</div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">Annual cap charge</span><span className="text-white font-bold">{fmt(annualCharge)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New total spend</span><span className="text-white font-bold">{fmt(newTotal)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New headroom to ceiling</span><span className={`font-bold ${newHeadroom>=0?'text-green-400':'text-red-400'}`}>{fmt(newHeadroom)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New buffer above floor</span><span className={`font-bold ${newFloorBuffer>=0?'text-green-400':'text-red-400'}`}>{fmt(newFloorBuffer)}</span></div>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-400">Status</span><span className={`font-bold ${newHeadroom>=0&&newFloorBuffer>=0?'text-green-400':'text-red-400'}`}>{newHeadroom>=0&&newFloorBuffer>=0?'COMPLIANT':'BREACH'}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── AUDIT TRAIL VIEW ─────────────────────────────────────────────────────────
function AuditTrailView() {
  const entries: Array<{date:string;type:string;player:string;detail:string;before:string;after:string;by:string}> = [
    {date:'2 Apr',type:'Contract amended',player:'Danny Cole',detail:'Bonus clause added',before:'£2,300/wk',after:'£2,300/wk + £200/win',by:'Caroline Hughes'},
    {date:'28 Mar',type:'Loan in',player:'Jake Rawlings',detail:'Bath Rugby, until 30 Apr',before:'—',after:'£1,200/wk',by:'Steve Whitfield'},
    {date:'15 Mar',type:'New contract',player:'David Obi',detail:'2-year extension',before:'£1,400/wk',after:'£1,700/wk',by:'Steve Whitfield'},
    {date:'1 Mar',type:'Academy credit',player:'Josh White',detail:'U23 academy designation',before:'Full charge',after:'−£12,000 credit',by:'Mark Ellison'},
    {date:'15 Feb',type:'Exclusion applied',player:'Marcus Webb',detail:'Excluded player designation',before:'Full charge',after:'Excluded',by:'RFU Salary Cap Director'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📜" title="Audit Trail" subtitle="Complete salary cap change log for RFU compliance." />
      <div className="flex justify-end"><button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Export CSV (RFU format)</button></div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Player</th><th className="text-left p-3">Detail</th><th className="text-left p-3">Before</th><th className="text-left p-3">After</th><th className="text-left p-3">Approved by</th>
            </tr></thead>
            <tbody>
              {entries.map((e:{date:string;type:string;player:string;detail:string;before:string;after:string;by:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-400 text-xs">{e.date}</td><td className="p-3 text-gray-300">{e.type}</td><td className="p-3 text-gray-200">{e.player}</td>
                  <td className="p-3 text-gray-400 text-xs">{e.detail}</td><td className="p-3 text-gray-500 text-xs">{e.before}</td><td className="p-3 text-purple-400 text-xs">{e.after}</td><td className="p-3 text-gray-500 text-xs">{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="text-xs text-gray-600">This export is formatted for submission to the RFU Salary Cap Director annual review. Last exported: January 2026.</div>
    </div>
  );
}

// ─── READINESS SCORE VIEW ─────────────────────────────────────────────────────
function ReadinessScoreView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏆" title="Franchise Readiness Score" subtitle="Target: 85% by December 2026 to support 2029/30 Expression of Interest." />

      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 160 160" className="w-40 h-40">
          <circle cx="80" cy="80" r="65" fill="none" stroke="#1f2937" strokeWidth="10"/>
          <circle cx="80" cy="80" r="65" fill="none" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(club.franchiseScore/100)*408} 408`} transform="rotate(-90 80 80)"/>
          <text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">{club.franchiseScore}%</text>
          <text x="80" y="92" textAnchor="middle" fill="#6b7280" fontSize="10">Franchise Score</text>
        </svg>
      </div>

      <div className="space-y-4">
        {FRANCHISE_CRITERIA.map((c:{name:string;score:number;status:string;details:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3"><div className="text-sm text-white font-semibold">{i+1}. {c.name}</div><StatusPill status={c.status}/></div>
              <div className="text-sm text-purple-400 font-bold">{c.score}%</div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2"><div className={`h-2 rounded-full ${c.status==='GREEN'?'bg-green-500':c.status==='AMBER'?'bg-amber-500':'bg-red-500'}`} style={{width:`${c.score}%`}}></div></div>
            <div className="text-xs text-gray-400">{c.details}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Progress Tracker</div>
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div><div className="text-gray-500">6 months ago</div><div className="text-lg font-bold text-gray-400">61%</div></div>
          <div><div className="text-gray-500">Today</div><div className="text-lg font-bold text-purple-400">{club.franchiseScore}%</div></div>
          <div><div className="text-gray-500">Target (Dec 2026)</div><div className="text-lg font-bold text-teal-400">85%</div></div>
        </div>
      </Card>
    </div>
  );
}

// ─── CRITERIA TRACKER VIEW ────────────────────────────────────────────────────
function CriteriaTrackerView() {
  const actions: Array<{action:string;criterion:string;owner:string;due:string;status:string}> = [
    {action:'Complete investor documentation pack',criterion:'Investment Capacity',owner:'Caroline Hughes',due:'15 May',status:'IN PROGRESS'},
    {action:'Register Women\'s PWR team',criterion:'Women\'s Game',owner:'Rachel Turner',due:'30 April',status:'NOT STARTED — URGENT'},
    {action:'Commission matchday experience assessment',criterion:'Operating Standards',owner:'Steve Whitfield',due:'30 June',status:'NOT STARTED'},
    {action:'Refresh club website to modern standard',criterion:'Operating Standards',owner:'Commercial team',due:'30 June',status:'PLANNED'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="✅" title="Criteria Tracker" subtitle="Detailed task tracker for each franchise readiness criterion." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Outstanding Actions</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Action</th><th className="text-left p-3">Criterion</th><th className="text-left p-3">Owner</th><th className="text-left p-3">Due</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {actions.map((a:{action:string;criterion:string;owner:string;due:string;status:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{a.action}</td><td className="p-3 text-gray-400 text-xs">{a.criterion}</td><td className="p-3 text-gray-400 text-xs">{a.owner}</td>
                  <td className={`p-3 text-xs ${a.status.includes('URGENT')?'text-red-400 font-medium':'text-gray-400'}`}>{a.due}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${a.status.includes('URGENT')?'bg-red-600/20 text-red-400':a.status==='IN PROGRESS'?'bg-amber-600/20 text-amber-400':'bg-gray-600/20 text-gray-400'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Evidence Vault</div>
        <div className="text-xs text-gray-400">Documents uploaded: 12 | Documents outstanding: 4</div>
      </Card>
    </div>
  );
}

// ─── EXPRESSION OF INTEREST VIEW ──────────────────────────────────────────────
function ExpressionOfInterestView() {
  const sections = ['Club overview and history','Rugby excellence','Operating standards','Financial sustainability','Investment capacity','Community impact','Women\'s game'];
  const complete = [true,true,true,true,false,true,false];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📄" title="Expression of Interest" subtitle="RFU Expansion Review Group — document builder." />
      <Card>
        <div className="text-xs text-gray-400 mb-4">The RFU&apos;s Expansion Review Group will assess clubs against mandatory criteria when expansion to 12 Premiership teams opens in 2029/30. Lumio Rugby builds your Expression of Interest document automatically from your club data.</div>
        <div className="text-sm text-purple-400 font-bold mb-4">{complete.filter(Boolean).length} of {sections.length} sections complete ({Math.round((complete.filter(Boolean).length/sections.length)*100)}%)</div>
        <div className="space-y-2">
          {sections.map((s:string,i:number)=>(
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-gray-800/50 ${!complete[i]?'opacity-60':''}`}>
              <span className={`text-xs ${complete[i]?'text-green-400':'text-red-400'}`}>{complete[i]?'✓':'✗'}</span>
              <span className="text-sm text-gray-300">{i+1}. {s}</span>
              {!complete[i]&&<span className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400 ml-auto">Incomplete</span>}
            </div>
          ))}
        </div>
      </Card>
      <button className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30">Generate Draft Document</button>
      <div className="text-xs text-gray-600">Last generated: 3 March 2026</div>
    </div>
  );
}

// ─── GAP ANALYSIS VIEW ────────────────────────────────────────────────────────
function GapAnalysisView() {
  const gaps: Array<{criterion:string;requirement:string;current:string;gap:string;priority:string}> = [
    {criterion:'Rugby Excellence',requirement:'Top 6 + academy output',current:'4th, 4 graduates',gap:'None',priority:'LOW'},
    {criterion:'Operating Standards',requirement:'Full compliance + assessment',current:'Compliant, assessment due',gap:'Matchday assessment',priority:'MEDIUM'},
    {criterion:'Financial Sustainability',requirement:'Break-even + projections',current:'Break-even, 3yr submitted',gap:'None',priority:'LOW'},
    {criterion:'Investment Capacity',requirement:'Full documentation',current:'Incomplete',gap:'Investor pack + due diligence',priority:'HIGH'},
    {criterion:'Community Impact',requirement:'25%+ to grassroots',current:'25.4%',gap:'None',priority:'LOW'},
    {criterion:'Women\'s Game',requirement:'PWR team OR regional plan',current:'Neither submitted',gap:'Registration or plan',priority:'CRITICAL'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Gap Analysis" subtitle="Hartfield RFC today vs RFU threshold requirements." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Criterion</th><th className="text-left p-3">RFU Requirement</th><th className="text-left p-3">Hartfield Today</th><th className="text-left p-3">Gap</th><th className="text-left p-3">Priority</th>
            </tr></thead>
            <tbody>
              {gaps.map((g:{criterion:string;requirement:string;current:string;gap:string;priority:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{g.criterion}</td><td className="p-3 text-gray-400 text-xs">{g.requirement}</td><td className="p-3 text-gray-300 text-xs">{g.current}</td><td className="p-3 text-gray-400 text-xs">{g.gap}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${g.priority==='CRITICAL'?'bg-red-600/20 text-red-400':g.priority==='HIGH'?'bg-amber-600/20 text-amber-400':g.priority==='MEDIUM'?'bg-blue-600/20 text-blue-400':'bg-green-600/20 text-green-400'}`}>{g.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SQUAD AVAILABILITY VIEW ──────────────────────────────────────────────────
function SquadAvailabilityView() {
  const avail = SQUAD.filter((p:{status:string})=>p.status==='available');
  const doubt = SQUAD.filter((p:{status:string})=>p.status==='doubtful');
  const unavail = SQUAD.filter((p:{status:string})=>p.status==='unavailable');
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="👥" title="Squad Availability" subtitle={`${avail.length} available, ${doubt.length} doubtful, ${unavail.length} unavailable`} />

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        Next international window: April 27 – May 10. 6 players eligible for call-up.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{title:'Available',players:avail,color:'green'},{title:'Doubtful',players:doubt,color:'amber'},{title:'Unavailable',players:unavail,color:'red'}].map((col:{title:string;players:typeof SQUAD;color:string},ci:number)=>(
          <Card key={ci}>
            <div className={`text-sm font-semibold mb-3 text-${col.color}-400`}>{col.title} ({col.players.length})</div>
            <div className="space-y-2">
              {col.players.map((p:{id:number;name:string;pos:string;reason:string;readiness:number;returnDate:string},i:number)=>(
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                  <div><div className="text-sm text-white">{p.name}</div><div className="text-xs text-gray-500">{p.pos}{p.reason?` — ${p.reason}`:''}</div></div>
                  <div className="text-right">
                    {p.readiness>0&&<div className={`text-xs font-medium ${p.readiness>=80?'text-green-400':p.readiness>=60?'text-amber-400':'text-red-400'}`}>{p.readiness}%</div>}
                    {p.returnDate&&<div className="text-[10px] text-gray-500">Return: {p.returnDate}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── SELECTION PLANNER VIEW ───────────────────────────────────────────────────
function SelectionPlannerView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📝" title="Selection Planner" subtitle="Visual 15-man selection tool with bench." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Starting XV — vs Jersey Reds (Saturday)</div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[{n:1,name:'Harrison',pos:'LH'},{n:2,name:'Briggs',pos:'HK'},{n:3,name:'Rawlings',pos:'TH'},{n:4,name:'Webb',pos:'LK'},{n:5,name:'Palmer',pos:'LK'},
            {n:6,name:'White',pos:'BF'},{n:7,name:'Foster K.',pos:'OF'},{n:8,name:'TBC',pos:'N8'},{n:9,name:'Grant',pos:'SH'},{n:10,name:'Cole',pos:'FH'},
            {n:11,name:'Patel',pos:'LW'},{n:12,name:'Jones',pos:'IC'},{n:13,name:'Obi',pos:'OC'},{n:14,name:'Taylor',pos:'RW'},{n:15,name:'Barnes',pos:'FB'},
          ].map((p:{n:number;name:string;pos:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-purple-400 font-bold">{p.n}</div>
              <div className="text-sm text-white font-medium">{p.name}</div>
              <div className="text-[10px] text-gray-500">{p.pos}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Replacements (16-23)</div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[{n:16,name:'Sub HK'},{n:17,name:'Sub LH'},{n:18,name:'Sub TH'},{n:19,name:'Sub LK'},{n:20,name:'Sub BF'},{n:21,name:'Sub SH'},{n:22,name:'Sub FH'},{n:23,name:'Sub BK'}].map((p:{n:number;name:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-xs text-purple-400 font-bold">{p.n}</div><div className="text-[10px] text-gray-400">{p.name}</div></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── INTERNATIONAL DUTY VIEW ──────────────────────────────────────────────────
function InternationalDutyView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🌍" title="International Duty" subtitle="Club-to-country data handoff and return protocols." />
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">Next international window: April 27 – May 10 — 6 players eligible</div>

      <div className="space-y-3">
        {[
          {name:'Danny Foster',team:'England A',status:'Called up ✓',capDiscount:'£17,500',dataSent:true,medicalShared:true},
          {name:'Marcus Webb',team:'England (Senior)',status:'Called up ✓',capDiscount:'£17,500',dataSent:true,medicalShared:true},
          {name:'Tom Harrison',team:'England U23',status:'Standby',capDiscount:'—',dataSent:false,medicalShared:false},
        ].map((p:{name:string;team:string;status:string;capDiscount:string;dataSent:boolean;medicalShared:boolean},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.team}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${p.status.includes('✓')?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{p.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-gray-500">Cap discount: <span className="text-teal-400">{p.capDiscount}</span></div>
              <div className="text-gray-500">Data sent: <span className={p.dataSent?'text-green-400':'text-red-400'}>{p.dataSent?'✓':'✗'}</span></div>
              <div className="text-gray-500">Medical shared: <span className={p.medicalShared?'text-green-400':'text-red-400'}>{p.medicalShared?'✓':'✗'}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Return Protocol</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Expected return: May 10</div>
          <div>Post-camp load data requested: ✓</div>
          <div>Post-camp medical clearance required: ✓</div>
          <div className="text-amber-400">Reintegration plan: Not yet drafted — flag to Head Coach</div>
        </div>
      </Card>
    </div>
  );
}

// ─── LOAN MANAGEMENT VIEW ─────────────────────────────────────────────────────
function LoanManagementView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔄" title="Loan Management" subtitle="Incoming and outgoing loan players." />

      <div className="text-sm font-semibold text-white mb-2">Incoming Loans (3)</div>
      <div className="space-y-3">
        {[
          {name:'Jake Rawlings',pos:'Prop',parent:'Bath Rugby',until:'30 April',cap:'£1,200/wk',recall:'7 days notice'},
          {name:'Connor Walsh',pos:'Fly Half',parent:'Bristol Bears',until:'Season end',cap:'£900/wk',recall:'No recall'},
          {name:'Ben Taylor',pos:'Wing',parent:'Exeter Chiefs',until:'Season end',cap:'£800/wk',recall:'No recall'},
        ].map((p:{name:string;pos:string;parent:string;until:string;cap:string;recall:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-white font-medium">{p.name} — {p.pos}</div><div className="text-xs text-gray-500">From: {p.parent} | Until: {p.until} | Cap: {p.cap}</div></div>
              <span className="text-xs text-gray-500">{p.recall}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-sm font-semibold text-white mb-2 mt-6">Outgoing Loans (2)</div>
      <div className="space-y-3">
        {[
          {name:'Phil Dowd',pos:'Prop',to:'Coventry RFC',league:'National League 1',cap:'Retained by Hartfield'},
          {name:'Sam Ellis',pos:'Scrum Half',to:'Doncaster Knights',league:'Champ Rugby',cap:'Split 50/50'},
        ].map((p:{name:string;pos:string;to:string;league:string;cap:string},i:number)=>(
          <Card key={i}>
            <div className="text-sm text-white font-medium">{p.name} — {p.pos}</div>
            <div className="text-xs text-gray-500">To: {p.to} ({p.league}) | Cap charge: {p.cap}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Recall Tracker</div>
        <div className="text-xs text-amber-400">Jake Rawlings — Bath have option to recall with 7 days notice. Last recall threat: January (not exercised). Risk: MEDIUM — Bath injury-hit at prop.</div>
      </Card>
    </div>
  );
}

// ─── SCOUTING PIPELINE VIEW ──────────────────────────────────────────────────
function ScoutingPipelineView() {
  const targets: Array<{name:string;club:string;pos:string;age:number;contractEnds:string;estCap:string;stage:string;agent:string}> = [
    {name:'Marcus Jennings',club:'Jersey Reds',pos:'Openside',age:26,contractEnds:'June 2026',estCap:'£65,000/yr',stage:'In Talks',agent:'Dan Hooper, DHR Sports'},
    {name:'Tom Clarke',club:'Doncaster Knights',pos:'Fly Half',age:24,contractEnds:'June 2026',estCap:'£48,000/yr',stage:'Approached',agent:'Mike Carroll'},
    {name:'Jake Forster',club:'Sale Sharks',pos:'Prop',age:22,contractEnds:'Dual reg available',estCap:'£25,000/yr',stage:'Watching',agent:'—'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔍" title="Scouting Pipeline" subtitle="Full recruitment pipeline with cap integration." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pipeline Total" value="12" sub="Across all stages" color="purple" />
        <StatCard label="In Talks" value="1" sub="Marcus Jennings" color="orange" />
        <StatCard label="Position Gaps" value="2" sub="Openside, Cover FH" color="red" />
      </div>

      <div className="space-y-3">
        {targets.map((t:{name:string;club:string;pos:string;age:number;contractEnds:string;estCap:string;stage:string;agent:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{t.name}</div><div className="text-xs text-gray-500">{t.club} | {t.pos} | Age {t.age} | Contract: {t.contractEnds}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.stage==='In Talks'?'bg-green-600/20 text-green-400':t.stage==='Approached'?'bg-amber-600/20 text-amber-400':'bg-gray-600/20 text-gray-400'}`}>{t.stage}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Est. cap: {t.estCap}</span><span>Agent: {t.agent}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── CAP IMPACT MODELLER VIEW ─────────────────────────────────────────────────
function CapImpactModellerView({club}:{club:RugbyClub}) {
  const [selectedTarget]=useState('Marcus Jennings');
  const proposedCap = 71500;
  const newSpend = club.currentSpend + proposedCap;
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💷" title="Cap Impact Modeller" subtitle="Sign a candidate and see cap impact immediately." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Modelling: {selectedTarget}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Weekly wage</div><div className="text-white font-bold">£1,250</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Contract</div><div className="text-white font-bold">2 years</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Signing on</div><div className="text-white font-bold">£5,000</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Est. bonuses</div><div className="text-white font-bold">£4,000/yr</div></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">Annual cap charge</span><span className="text-white font-bold">{fmt(proposedCap)}</span></div>
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New total spend</span><span className="text-white font-bold">{fmt(newSpend)}</span></div>
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New headroom</span><span className="text-green-400 font-bold">{fmt(club.capCeiling - newSpend)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-400">Status</span><span className="text-green-400 font-bold">COMPLIANT — GREEN</span></div>
        </div>
      </Card>
    </div>
  );
}

// ─── AGENT CONTACTS VIEW ──────────────────────────────────────────────────────
function AgentContactsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📞" title="Agent Contacts" subtitle="Agent database and active negotiations." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Active Negotiations</div>
        <div className="space-y-3">
          {[
            {agent:'Dan Hooper',agency:'DHR Sports',player:'Marcus Jennings',lastContact:'2 April',note:'Jennings interested, wants contract offer by April 15'},
            {agent:'Mike Carroll',agency:'Carroll Sports',player:'Tom Clarke',lastContact:'28 March',note:'Exploring options, not committed'},
          ].map((a:{agent:string;agency:string;player:string;lastContact:string;note:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1"><div className="text-sm text-white font-medium">{a.agent} — {a.agency}</div><span className="text-xs text-gray-500">Last: {a.lastContact}</span></div>
              <div className="text-xs text-gray-400">Player: {a.player} — &quot;{a.note}&quot;</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TARGETS SHORTLIST VIEW ───────────────────────────────────────────────────
function TargetsShortlistView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎯" title="Targets Shortlist" subtitle="Director of Rugby priority target board." />
      {[
        {pos:'Openside Flanker',priority:'URGENT',reason:'Only 1 specialist in squad',targets:['Marcus Jennings (Jersey Reds, in talks)','Jake Forster (Sale, watching)']},
        {pos:'Cover Fly Half',priority:'MEDIUM',reason:'Connor Walsh loan ends April 30',targets:['Tom Clarke (Doncaster, approached)']},
      ].map((g:{pos:string;priority:string;reason:string;targets:string[]},i:number)=>(
        <Card key={i}>
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">{g.pos}</div><span className={`text-xs px-2 py-0.5 rounded ${g.priority==='URGENT'?'bg-red-600/20 text-red-400':'bg-amber-600/20 text-amber-400'}`}>{g.priority}</span></div>
          <div className="text-xs text-gray-400 mb-2">{g.reason}</div>
          <div className="space-y-1">{g.targets.map((t:string,j:number)=>(<div key={j} className="text-xs text-gray-300">• {t}</div>))}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── CONCUSSION & HIA TRACKER VIEW ───────────────────────────────────────────
function ConcussionHIAView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🧠" title="Concussion & HIA Tracker" subtitle="Head Injury Assessment protocol management." />

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        This module is a documentation and compliance tool. It records protocols followed, not medical advice. All return-to-play decisions are made by qualified medical professionals. Lumio Rugby accepts no medical liability.
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Active Cases (1)</div>
        <div className="bg-red-600/5 border border-red-600/30 rounded-lg p-4">
          <div className="text-sm text-white font-medium mb-1">Danny Foster — HIA initiated 29 March vs Ealing (Round 15)</div>
          <div className="text-xs text-gray-400 mb-3">Stage: HIA2 — Day 8 of 21-day minimum protocol</div>
          <div className="space-y-1.5">
            {[
              {step:'HIA1 (match day assessment)',status:'COMPLETE',date:'29 March'},
              {step:'HIA2 (48-hour follow up)',status:'COMPLETE',date:'31 March'},
              {step:'Rest and symptom monitoring',status:'IN PROGRESS',date:'Day 8'},
              {step:'Light exercise introduction',status:'PENDING',date:'From Day 14'},
              {step:'Full non-contact training',status:'PENDING',date:'From Day 18'},
              {step:'Return to full contact',status:'PENDING',date:'Requires medical clearance'},
              {step:'Independent doctor clearance',status:'PENDING',date:'Required'},
            ].map((s:{step:string;status:string;date:string},i:number)=>(
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status==='COMPLETE'?'bg-green-500':s.status==='IN PROGRESS'?'bg-amber-500':'bg-gray-600'}`}></span>
                <span className={`flex-1 ${s.status==='COMPLETE'?'text-gray-500 line-through':'text-gray-300'}`}>{s.step}</span>
                <span className="text-gray-500">{s.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">Last assessment: 3 April — Dr. Marsh — &quot;progressing within protocol&quot;</div>
          <div className="text-xs text-gray-500">Next assessment: 7 April — baseline cognitive test</div>
          <div className="text-xs text-amber-400 mt-1">Estimated return: 19 April (subject to clearance)</div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Cumulative Threshold Tracker</div>
        <div className="text-xs text-green-400">Players approaching 3+ HIAs in rolling 12 months: 0</div>
      </Card>
    </div>
  );
}

// ─── RETURN TO PLAY VIEW ──────────────────────────────────────────────────────
function ReturnToPlayView() {
  const rtpPlayers: Array<{name:string;injury:string;week:string;expected:string;phase:string;cleared:boolean}> = [
    {name:'Danny Foster',injury:'Concussion protocol',week:'Day 8 of 21+',expected:'19 April',phase:'Rest and symptom monitoring',cleared:false},
    {name:'Ryan Patel',injury:'Hamstring (Grade 2)',week:'Week 3 of 5',expected:'18 April',phase:'Pool running and progressive loading',cleared:false},
    {name:'Karl Briggs',injury:'Shoulder (post-op)',week:'Week 8 of 12',expected:'2 May',phase:'Full gym, non-contact skills',cleared:false},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏥" title="Return to Play" subtitle="All players on return-to-play protocols." />
      <div className="space-y-3">
        {rtpPlayers.map((p:{name:string;injury:string;week:string;expected:string;phase:string;cleared:boolean},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.injury}</div></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.week}</span>
            </div>
            <div className="text-xs text-gray-400">Phase: {p.phase}</div>
            <div className="text-xs text-gray-500 mt-1">Expected return: {p.expected}</div>
            <div className="text-xs mt-1">{p.cleared?<span className="text-green-400">✓ Cleared for selection</span>:<span className="text-red-400">✗ Not cleared</span>}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── MEDICAL RECORDS VIEW ─────────────────────────────────────────────────────
function MedicalRecordsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📂" title="Medical Records" subtitle="Role-gated — Director of Rugby and Head of Medical only." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Player Medical History</div>
        <div className="text-xs text-gray-400 mb-4">Select a player to view full career medical log, HIA history, pre-season clearance, and baseline assessments.</div>
        <select className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none">
          <option>Select player...</option>
          {SQUAD.map((p:{id:number;name:string})=>(<option key={p.id}>{p.name}</option>))}
        </select>
      </Card>
      <div className="flex justify-end"><button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Export for RFU regulatory review</button></div>
    </div>
  );
}

// ─── WELFARE AUDIT VIEW ───────────────────────────────────────────────────────
function WelfareAuditView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🛡️" title="Welfare Audit" subtitle="Annual welfare compliance checklist for RFU requirements." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Champ Rugby Welfare Requirements</div>
        <div className="space-y-2">
          {[
            {item:'DBS checks — all staff and volunteers: 47/47',done:true},
            {item:'Welfare officer appointed and DBS cleared',done:true},
            {item:'Safeguarding policy published (Updated March 2026)',done:true},
            {item:'Concussion education programme: 38/38 players',done:true},
            {item:'Annual medical screenings: 36/38',done:false},
            {item:'Player welfare questionnaires current (Lumio Health)',done:true},
            {item:'Mental health first aider on staff',done:true},
          ].map((c:{item:string;done:boolean},i:number)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
              <span className={`text-xs ${c.done?'text-green-400':'text-amber-400'}`}>{c.done?'✓':'⚠'}</span>
              <span className={c.done?'text-gray-400':'text-amber-400'}>{c.item}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Outstanding (2)</div>
        <div className="text-xs text-amber-400">Annual medical screening outstanding for: Danny Foster, Ryan Patel (deferred — current injury). Schedule on return to full training.</div>
      </Card>
      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Download welfare audit summary (RFU)</button>
    </div>
  );
}

// ─── MENTAL PERFORMANCE VIEW ─────────────────────────────────────────────────
function MentalPerformanceView() {
  const [mpTab, setMpTab] = useState<'squad'|'individual'|'support'|'checkin'>('squad');
  const SQUAD_MOOD=[{player:'Tom Harrison',score:8.2,trend:'stable',flag:false,note:''},{player:'James Briggs',score:7.8,trend:'up',flag:false,note:''},{player:'Danny Foster',score:6.1,trend:'down',flag:true,note:'HIA + match unavailability impacting confidence. Psych session Fri.'},{player:'Karl Foster',score:7.4,trend:'stable',flag:false,note:''},{player:'Danny Cole',score:5.8,trend:'down',flag:true,note:'Form + contract anxiety. Weekly 1:1 with Dr Reid.'},{player:'Marcus Webb',score:8.6,trend:'up',flag:false,note:''},{player:'Ryan Patel',score:6.4,trend:'down',flag:true,note:'Hamstring frustration. Second opinion requested.'},{player:'Matt Jones',score:7.9,trend:'stable',flag:false,note:''},{player:'Luke Barnes',score:8.1,trend:'stable',flag:false,note:''},{player:'Sam Ellis',score:7.2,trend:'up',flag:false,note:''},{player:'Oliver Grant',score:7.6,trend:'stable',flag:false,note:''},{player:'David Obi',score:8.0,trend:'stable',flag:false,note:''}];
  const flagged=SQUAD_MOOD.filter(p=>p.flag);const avgScore=(SQUAD_MOOD.reduce((s,p)=>s+p.score,0)/SQUAD_MOOD.length).toFixed(1);
  const MONTHLY=[7.8,7.6,7.2,7.4,7.1,7.3,7.0,6.9],MONTHS=['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const mW=480,mH=120,mpL=32,mpR=12,mpT=16,mpB=28,miW=mW-mpL-mpR,miH=mH-mpT-mpB,mMin=5,mMax=10,msX=miW/(MONTHLY.length-1);
  const moodPath=MONTHLY.map((v,i)=>`${i===0?'M':'L'} ${mpL+i*msX} ${mpT+miH-((v-mMin)/(mMax-mMin))*miH}`).join(' ');
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="🧠" title="Mental Performance" subtitle="Squad mood · Individual flags · Support log · Check-in"/>
      <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-3 text-xs text-red-400">🔒 Restricted to Head of Medical and Welfare Lead only.</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Squad Avg" value={`${avgScore}/10`} sub="Down from 7.4" color={Number(avgScore)>=7?'green':'orange'}/><StatCard label="Active Flags" value={flagged.length} sub="Need attention" color="red"/><StatCard label="Check-ins" value="24/38" sub="14 outstanding" color="amber"/><StatCard label="Psych sessions" value="3" sub="Foster·Cole·Patel" color="blue"/></div>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'squad',label:'Squad',icon:'👥'},{id:'individual',label:'Flagged',icon:'🚩'},{id:'support',label:'Support Log',icon:'❤️'},{id:'checkin',label:'Check-in',icon:'📝'}] as const).map(t=><button key={t.id} onClick={()=>setMpTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${mpTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}{t.id==='individual'&&flagged.length>0&&<span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400">{flagged.length}</span>}</button>)}</div>
      {mpTab==='squad'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">Mood Trend</div><svg viewBox={`0 0 ${mW} ${mH}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={mpL} x2={mW-mpR} y1={mpT+miH-t*miH} y2={mpT+miH-t*miH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<line x1={mpL} x2={mW-mpR} y1={mpT+miH-((7.5-mMin)/(mMax-mMin))*miH} y2={mpT+miH-((7.5-mMin)/(mMax-mMin))*miH} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/><path d={moodPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{MONTHLY.map((v,i)=><g key={i}><circle cx={mpL+i*msX} cy={mpT+miH-((v-mMin)/(mMax-mMin))*miH} r="3.5" fill="#8B5CF6"/><text x={mpL+i*msX} y={mH-4} fontSize="9" fill="#6B7280" textAnchor="middle">{MONTHS[i]}</text></g>)}</svg><p className="text-[10px] text-gray-600 mt-2">Downward trend since Jan — correlates with injury run and contract uncertainty.</p></Card><Card><div className="text-sm font-semibold text-white mb-3">Check-In Scores</div><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Player</th><th className="text-center py-2">Score</th><th className="text-center py-2">Trend</th><th className="text-center py-2">Flag</th></tr></thead><tbody>{SQUAD_MOOD.map((p,i)=><tr key={i} className={`border-b border-gray-800/40 ${p.flag?'bg-red-600/5':''}`}><td className="py-2 text-white">{p.player}</td><td className="py-2 text-center"><span className={`font-bold text-sm ${p.score>=7.5?'text-green-400':p.score>=6.5?'text-amber-400':'text-red-400'}`}>{p.score}</span></td><td className="py-2 text-center text-sm">{p.trend==='up'?'↑':p.trend==='down'?'↓':'→'}</td><td className="py-2 text-center">{p.flag&&<span className="text-red-400">🚩</span>}</td></tr>)}</tbody></table></Card></div>}
      {mpTab==='individual'&&<div className="space-y-4">{flagged.map((p,i)=><Card key={i} className="border-red-600/30"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="text-red-400 font-bold text-sm">🚩</span><span className="text-sm font-bold text-white">{p.player}</span><span className={`text-lg font-bold ${p.score<6?'text-red-400':p.score<7?'text-amber-400':'text-green-400'}`}>{p.score}/10</span></div><span className="text-xs text-gray-500">Trend: {p.trend==='down'?'↓ Declining':'→ Stable'}</span></div><p className="text-xs text-gray-300 leading-relaxed mb-3">{p.note}</p><div className="flex gap-2"><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Log update</button><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30">Schedule session →</button></div></Card>)}</div>}
      {mpTab==='support'&&<div className="space-y-4"><Card><div className="text-sm font-semibold text-white mb-3">Support Services</div><div className="grid grid-cols-2 gap-3">{[{name:'Dr Anna Reid',role:'Performance Psychologist',type:'In-house',sessions:'3/wk'},{name:'PFA Wellbeing Service',role:'Player support',type:'External',sessions:'On demand'},{name:'Mind Charity',role:'Referral pathway',type:'External',sessions:'On referral'},{name:'RFU HeadSmart',role:'Concussion MH support',type:'RFU',sessions:'HIA players'}].map((s,i)=><div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-xs text-white font-medium">{s.name}</div><div className="text-[10px] text-gray-500">{s.role} · {s.type}</div><div className="text-[10px] text-purple-400 mt-1">{s.sessions}</div></div>)}</div></Card><Card><div className="text-sm font-semibold text-white mb-3">Session Log — April 2026</div>{[{date:'Fri 11 Apr',player:'Danny Foster',type:'Performance psych',provider:'Dr Reid',note:'HIA confidence + return'},{date:'Thu 10 Apr',player:'Danny Cole',type:'Performance psych',provider:'Dr Reid',note:'Form + contract anxiety'},{date:'Wed 9 Apr',player:'Ryan Patel',type:'Performance psych',provider:'Dr Reid',note:'Injury frustration + RTP'},{date:'Tue 8 Apr',player:'Group',type:'Team session',provider:'Dr Reid',note:'Pre-match resilience'}].map((s,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0 text-xs"><div><span className="text-white font-medium">{s.player}</span><span className="text-gray-500 ml-2">{s.type} · {s.provider}</span><div className="text-[10px] text-gray-600 mt-0.5">{s.note}</div></div><span className="text-gray-500 flex-shrink-0 ml-4">{s.date}</span></div>)}</Card></div>}
      {mpTab==='checkin'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">Monthly Status</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><StatCard label="Completed" value="24" sub="Of 38" color="green"/><StatCard label="Outstanding" value="14" sub="Reminder sent Mon" color="amber"/><StatCard label="Flagged" value="3" sub="Below 6.5" color="red"/><StatCard label="Avg response" value="8 min" sub="Lumio Health app" color="blue"/></div><div className="text-xs text-gray-400">Check-ins via Lumio Health app. 6 areas (Energy, Mood, Sleep, Motivation, Soreness, Wellbeing). Below 6.5 triggers auto welfare flag.</div></Card><Card><div className="text-sm font-semibold text-white mb-3">Outstanding — Action Required</div>{['Danny Foster','Ryan Patel','Phil Dowd','Karl Briggs','Jake Rawlings','Connor Walsh','Ben Taylor','Callum Reeves'].map((name,i)=><div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0 text-xs"><span className="text-amber-400">{name}</span><button className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-500 hover:text-gray-300">Send reminder</button></div>)}</Card></div>}
    </div>
  );
}

// ─── SPONSORSHIP PIPELINE VIEW ────────────────────────────────────────────────
function SponsorshipPipelineView() {
  const totalActive = SPONSORS.reduce((a:number,s:{value:number})=>a+s.value,0);
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤝" title="Sponsorship Pipeline" subtitle="Commercial CRM — Director of Commercial." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Secured" value={fmt(totalActive)} sub={`${SPONSORS.length} active sponsors`} color="green" />
        <StatCard label="Pipeline" value="£43,000" sub="2 prospects" color="orange" />
        <StatCard label="Target" value="£225,000" color="purple" />
        <StatCard label="Gap" value="£10,000" sub="5% remaining" color="red" />
      </div>

      <div className="space-y-3">
        {SPONSORS.map((s:{name:string;type:string;value:number;renewal:string;status:string;obligations:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{s.name}</div><div className="text-xs text-gray-500">{s.type} — {fmt(s.value)}/yr</div></div>
              <span className="text-xs text-gray-500">Renewal: {s.renewal}</span>
            </div>
            <div className="text-xs text-gray-400">{s.obligations}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Pipeline — Prospects</div>
        <div className="space-y-2">
          {[{name:'West Country Energy',type:'Kit sleeve',est:'£28,000',stage:'Meeting scheduled'},{name:'Hatton Recruitment',type:'Community',est:'£15,000',stage:'Proposal sent'}].map((p:{name:string;type:string;est:string;stage:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-sm">
              <div><span className="text-gray-200">{p.name}</span> <span className="text-xs text-gray-500">— {p.type} — est. {p.est}</span></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.stage}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MATCHDAY REVENUE VIEW ────────────────────────────────────────────────────
function MatchdayRevenueView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💰" title="Matchday Revenue" subtitle="Revenue tracking per fixture — 2025/26 season." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gate Receipts" value="£142,000" sub="17 home games" color="purple" />
        <StatCard label="Bar & Catering" value="£89,000" color="teal" />
        <StatCard label="Hospitality" value="£68,000" sub="12 boxes" color="orange" />
        <StatCard label="Total Matchday" value="£374,000" sub="Target: £400k" color="green" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Jersey Reds (Next Home) — Projected</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[{l:'Attendance',v:'2,800'},{l:'Gate',v:'£8,400'},{l:'Bar',v:'£4,200'},{l:'Hospitality',v:'£12,000'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold">{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
        <div className="text-xs text-purple-400 font-medium mt-3">Projected total: £24,600</div>
      </Card>
    </div>
  );
}

// ─── STADIUM & VENUE VIEW ─────────────────────────────────────────────────────
function StadiumVenueView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏟️" title="Stadium & Venue" subtitle={`${club.stadium} — Capacity ${club.capacity.toLocaleString()}`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Standing" value="1,800" color="purple" />
        <StatCard label="Seated" value="3,000" color="teal" />
        <StatCard label="Hospitality Boxes" value="12" color="orange" />
        <StatCard label="Conference" value="150" sub="Function room" color="blue" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Events — Next 30 Days</div>
        <div className="space-y-2">
          {[
            {date:'11 Apr',event:'Champ Rugby vs Jersey Reds',type:'Fixture'},
            {date:'15 Apr',event:'Corporate conference — 80 delegates — £4,500',type:'Commercial'},
            {date:'18 Apr',event:'School rugby festival — 240 children',type:'Community'},
            {date:'25 Apr',event:'Business networking — 60 guests — £1,800',type:'Commercial'},
            {date:'3 May',event:'Hartfield Building Society hospitality — 40 guests',type:'Sponsor'},
          ].map((e:{date:string;event:string;type:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-purple-400 font-medium w-14">{e.date}</span>
              <span className="text-sm text-gray-300 flex-1">{e.event}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{e.type}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Ground Grading</div>
        <div className="text-xs text-green-400">Step 2 compliant ✓ — Last inspection: Sep 2025 — Next: Sep 2026</div>
      </Card>
    </div>
  );
}

// ─── PARTNERSHIP ACTIVATION VIEW ──────────────────────────────────────────────
function PartnershipActivationView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎯" title="Partnership Activation" subtitle="Tracking sponsor obligation fulfilment." />
      <Card className="border-red-600/30">
        <div className="text-sm font-semibold text-red-400 mb-2">Overdue (1)</div>
        <div className="text-xs text-gray-300">Hartfield Building Society — Monthly player video (March) — Due: 31 March — <span className="text-red-400 font-medium">OVERDUE</span></div>
        <div className="text-xs text-gray-500 mt-1">Action: Arrange with Danny Cole this week</div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Upcoming This Month</div>
        <div className="space-y-2">
          {[
            {sponsor:'Hartfield Motors',obligation:'Player appearance (Karl Foster)',due:'20 April'},
            {sponsor:'County Council',obligation:'Community match programme Q4 report',due:'30 April'},
            {sponsor:'Smith & Sons',obligation:'Social media mention for new development',due:'15 April'},
          ].map((o:{sponsor:string;obligation:string;due:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <div><span className="text-gray-200">{o.sponsor}</span> — <span className="text-gray-400">{o.obligation}</span></div>
              <span className="text-gray-500">{o.due}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Partnership Health</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center">
          {[{l:'Met (season)',v:'34',c:'text-green-400'},{l:'Late (resolved)',v:'3',c:'text-amber-400'},{l:'Overdue',v:'1',c:'text-red-400'},{l:'Renewals initiated',v:'1/3',c:'text-purple-400'}].map((s:{l:string;v:string;c:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className={`font-bold text-lg ${s.c}`}>{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── WOMEN'S SQUAD VIEW ───────────────────────────────────────────────────────
function MediaPRRugbyView({club:_club}:{club:RugbyClub}){const[activeTab,setActiveTab]=useState<'requests'|'calendar'|'coverage'|'guidelines'>('requests');const REQUESTS=[{id:1,outlet:'Rugby World',type:'Feature',contact:'Dan Carter (ed.)',subject:'Championship clubs and franchise pathway — Hartfield RFC case study',deadline:'18 Apr 2026',urgency:'high',status:'Pending approval',notes:'National rugby magazine. Franchise readiness story is well-timed.',recommended:'Accept — franchise exposure before assessments.'},{id:2,outlet:'Crown Broadcasting Rugby',type:'Interview',contact:'Sian Hughes',subject:'Danny Foster HIA — concussion protocol best practice',deadline:'15 Apr 2026',urgency:'urgent',status:'Handle with care',notes:'Sensitive. Do NOT discuss medical details. Welfare Lead must approve.',recommended:'Decline medical specifics. Offer welfare statement.'},{id:3,outlet:'Champ Rugby Podcast',type:'Podcast',contact:'Mike Selby',subject:'DoR Steve Whitfield — season review and promotion push',deadline:'22 Apr 2026',urgency:'medium',status:'Pending approval',notes:'Championship-specific audience. Good DoR platform.',recommended:'Accept — strong fit for DoR profile.'},{id:4,outlet:'Local Gazette',type:'Preview',contact:'Rachel Moore',subject:'vs Jersey Reds Saturday — preview and ticket info',deadline:'Thu 10 Apr',urgency:'low',status:'Approved',notes:'Standard pre-match local press.',recommended:'Already approved.'}];const COVERAGE=[{date:'5 Apr',outlet:'Rugby World',headline:'Hartfield RFC among Champ clubs closest to franchise criteria',reach:'48k',sentiment:'positive'},{date:'2 Apr',outlet:'Crown Broadcasting Rugby',headline:'Championship Round 17 — Hartfield lose to Bath 18–24',reach:'180k',sentiment:'neutral'},{date:'29 Mar',outlet:'Champ Rugby Podcast',headline:'Episode 112 — Hartfield RFC season deep dive',reach:'22k',sentiment:'positive'},{date:'22 Mar',outlet:'Local Gazette',headline:'Hartfield RFC win at Doncaster — season back on track',reach:'8k',sentiment:'positive'},{date:'15 Mar',outlet:'Rugby Pass',headline:'Championship salary cap — which clubs are closest to ceiling?',reach:'31k',sentiment:'neutral'}];const urgencyStyle=(u:string)=>u==='urgent'?'bg-red-600/20 text-red-400 border border-red-600/30':u==='high'?'bg-amber-600/20 text-amber-400':u==='medium'?'bg-blue-600/20 text-blue-400':'bg-gray-800 text-gray-500';return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="📣" title="Media & PR" subtitle="Requests · Calendar · Coverage log · Guidelines"/><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Open Requests" value="3" sub="1 urgent · 2 pending" color="amber"/><StatCard label="Coverage (month)" value="5" sub="4 positive · 1 neutral" color="green"/><StatCard label="Total Reach" value="289k" sub="Cumulative this month" color="purple"/><StatCard label="Next Press Day" value="Sat" sub="vs Jersey Reds matchday" color="blue"/></div><div className="flex gap-1 border-b border-gray-800">{([{id:'requests' as const,label:'Requests',icon:'📬'},{id:'calendar' as const,label:'PR Calendar',icon:'📅'},{id:'coverage' as const,label:'Coverage',icon:'📰'},{id:'guidelines' as const,label:'Guidelines',icon:'📋'}]).map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>{activeTab==='requests'&&<div className="space-y-4">{REQUESTS.map(r=><Card key={r.id} className={r.urgency==='urgent'?'border-red-600/40':r.urgency==='high'?'border-amber-600/30':''}><div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{r.outlet}</span><span className={`text-[10px] px-2 py-0.5 rounded ${urgencyStyle(r.urgency)}`}>{r.urgency==='urgent'?'🔴 URGENT':r.urgency==='high'?'🟡 High':r.urgency==='medium'?'Medium':'Low'}</span><span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">{r.type}</span></div><p className="text-xs text-gray-300 font-medium">{r.subject}</p><p className="text-[10px] text-gray-600">Contact: {r.contact} · Deadline: {r.deadline}</p></div><span className={`text-[10px] px-2 py-1 rounded font-medium flex-shrink-0 ml-4 ${r.status==='Approved'?'bg-green-600/20 text-green-400':r.status==='Handle with care'?'bg-red-600/20 text-red-400':'bg-amber-600/20 text-amber-400'}`}>{r.status}</span></div><p className="text-xs text-gray-400 mb-2">{r.notes}</p><div className="flex items-center justify-between pt-2 border-t border-gray-800"><p className="text-[10px] text-purple-400">💡 {r.recommended}</p>{r.status!=='Approved'&&r.status!=='Handle with care'&&<div className="flex gap-2"><button className="px-3 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-white">Decline</button><button className="px-3 py-1 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white">Accept →</button></div>}</div></Card>)}</div>}{activeTab==='coverage'&&<div className="space-y-4"><div className="grid grid-cols-3 gap-4"><StatCard label="Positive" value="4/5" sub="This month" color="green"/><StatCard label="Reach" value="289k" sub="Cumulative" color="purple"/><StatCard label="Top outlet" value="Crown Broadcasting" sub="180k reach" color="blue"/></div><Card><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Date</th><th className="text-left py-2">Outlet</th><th className="text-left py-2">Headline</th><th className="text-center py-2">Reach</th><th className="text-center py-2">Sentiment</th></tr></thead><tbody>{COVERAGE.map((c,i)=><tr key={i} className="border-b border-gray-800/40"><td className="py-2 text-gray-500">{c.date}</td><td className="py-2 text-gray-300 font-medium">{c.outlet}</td><td className="py-2 text-gray-400">{c.headline}</td><td className="py-2 text-center text-purple-400 font-bold">{c.reach}</td><td className="py-2 text-center"><span className={`text-xs font-medium ${c.sentiment==='positive'?'text-green-400':'text-gray-400'}`}>{c.sentiment==='positive'?'↑ Positive':'→ Neutral'}</span></td></tr>)}</tbody></table></div></Card></div>}{activeTab==='calendar'&&<Card><div className="text-sm font-semibold text-white mb-4">PR & Media Calendar — April / May 2026</div><div className="divide-y divide-gray-800">{[{date:'Thu 10 Apr',items:[{time:'11:00',type:'Press conf',label:'Pre-match presser — Jersey Reds'},{time:'14:00',type:'Deadline',label:'Local Gazette preview copy'}]},{date:'Sat 12 Apr',items:[{time:'12:30',type:'Matchday',label:'Media accreditation — The Grange'},{time:'15:00',type:'Matchday',label:'KO vs Jersey Reds'},{time:'17:00',type:'Post-match',label:'Mixed zone + Head Coach interview'}]},{date:'Wed 16 Apr',items:[{time:'—',type:'Deadline',label:'Rugby World feature submission'}]},{date:'22 Apr',items:[{time:'TBC',type:'Podcast',label:'Champ Rugby Podcast — DoR'}]}].map((day,i)=><div key={i} className="flex gap-4 py-3"><div className="w-20 flex-shrink-0"><div className="text-xs font-bold text-white">{day.date}</div></div><div className="flex-1 space-y-1.5">{day.items.map((item,j)=><div key={j} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-900/30 border border-gray-800/30"><span className="text-[10px] text-gray-600 w-10 flex-shrink-0">{item.time}</span><span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${item.type==='Matchday'?'bg-purple-600/20 text-purple-400':item.type==='Press conf'?'bg-blue-600/20 text-blue-400':item.type==='Deadline'?'bg-red-600/20 text-red-400':item.type==='Podcast'?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{item.type}</span><span className="text-xs text-gray-300">{item.label}</span></div>)}</div></div>)}</div></Card>}{activeTab==='guidelines'&&<div className="space-y-4"><div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4"><p className="text-xs text-amber-300">All media requests must be approved by Communications lead. Restricted topics require additional department head sign-off.</p></div><Card><div className="text-sm font-semibold text-white mb-3">Media Response Guidelines</div><div className="divide-y divide-gray-800">{[{topic:'Player medical / HIA',rule:'NO comment. Refer to club medical statement template.',restricted:true},{topic:'Salary cap details',rule:'No specific figures. "We are compliant with all Championship Rugby regulations."',restricted:true},{topic:'Transfer speculation',rule:'"Hartfield RFC does not comment on player movements."',restricted:true},{topic:'Franchise readiness',rule:'CEO or DoR only. Positive messaging.',restricted:false},{topic:'Match results',rule:'Head Coach or DoR only post-match.',restricted:false},{topic:'Academy players (U21)',rule:'Parental consent required. Academy Director approves.',restricted:true}].map((g,i)=><div key={i} className={`py-3 ${g.restricted?'bg-red-600/5 px-2 -mx-2 rounded':''}`}><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-white">{g.topic}</span>{g.restricted&&<span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400">🔒 Restricted</span>}</div><p className="text-xs text-gray-400">{g.rule}</p></div>)}</div></Card></div>}</div>)}

function FanHubRugbyView({club:_club}:{club:RugbyClub}){const[activeTab,setActiveTab]=useState<'overview'|'forum'|'events'|'memberships'>('overview');const FORUM_TOPICS=[{id:1,cat:'Match Discussion',title:'Jersey Reds (H) — Match thread 🏉',posts:62,views:940,hot:true,last:'1h ago'},{id:2,cat:'Franchise',title:'Franchise readiness — how close are we really?',posts:88,views:1480,hot:true,last:'3h ago'},{id:3,cat:'Recruitment',title:'Summer window wishlist — who do we need?',posts:104,views:1820,hot:true,last:'45m ago'},{id:4,cat:'Match Discussion',title:'Bath away post-match — disappointing 2nd half',posts:44,views:680,hot:false,last:'8h ago'},{id:5,cat:'General',title:'Season tickets 2026/27 — pricing thoughts?',posts:38,views:560,hot:false,last:'1d ago'},{id:6,cat:'Academy',title:'Tom Foley — ready for first team start?',posts:31,views:490,hot:false,last:'2d ago'},{id:7,cat:'Commercial',title:'New kit launch reaction — love/hate thread',posts:72,views:1120,hot:true,last:'2h ago'}];const MEMBERS=[{name:'Supporter',price:'£20/yr',count:488,features:['Forum access','Match notifications','Monthly newsletter','Early ticket access (24h)'],color:'border-gray-700',badge:'bg-gray-800 text-gray-400'},{name:'Club Member',price:'£45/yr',count:214,features:['Everything in Supporter','Annual meet-the-players','Training ground access (1/yr)','Member kit discount (10%)','Monthly DoR Q&A'],color:'border-purple-600/40',badge:'bg-purple-600/20 text-purple-400'},{name:'Franchise',price:'£120/yr',count:48,features:['Everything in Club Member','Board room matchday hospitality','Named in franchise EOI document','Franchise progress briefing (quarterly)','Signed squad photo'],color:'border-amber-600/40',badge:'bg-amber-600/20 text-amber-400'}];const EVENTS=[{date:'Sat 11 Apr',event:'Fan Zone — Jersey Reds (H)',type:'Matchday',tickets:'Free entry'},{date:'Sun 19 Apr',event:'Club Member Q&A — DoR Steve Whitfield',type:'Members',tickets:'Members only'},{date:'Sat 26 Apr',event:'Open training — fan day',type:'All fans',tickets:'RSVP required'},{date:'Sat 3 May',event:'Hartfield Building Society hospitality',type:'Sponsor',tickets:'Invite only'},{date:'Sat 10 May',event:'Season finale — fan day vs Saracens',type:'All fans',tickets:'Free entry'},{date:'Sun 25 May',event:'End of season awards night',type:'Members',tickets:'Club Members+'},{date:'Sat 20 Jun',event:'New kit launch — Fan Hub members first',type:'All fans',tickets:'Free entry'}];const catColor=(c:string)=>c==='Match Discussion'?'bg-purple-600/20 text-purple-400':c==='Franchise'?'bg-amber-600/20 text-amber-400':c==='Recruitment'?'bg-blue-600/20 text-blue-400':c==='Academy'?'bg-teal-600/20 text-teal-400':c==='Commercial'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500';const GROWTH=[620,740,820,910,1010,1120,1240,1520,1820,2140];const G_LABELS=['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];const GW=500,GH=130,gPL=36,gPR=12,gPT=16,gPB=28;const gIW=GW-gPL-gPR,gIH=GH-gPT-gPB;const gMin=500,gMax=2500,gStepX=gIW/(GROWTH.length-1);const gPath=GROWTH.map((v,i)=>`${i===0?'M':'L'} ${gPL+i*gStepX} ${gPT+gIH-((v-gMin)/(gMax-gMin))*gIH}`).join(' ');const gArea=`${gPath} L ${gPL+(GROWTH.length-1)*gStepX} ${gPT+gIH} L ${gPL} ${gPT+gIH} Z`;const totalMembers=MEMBERS.reduce((s,m)=>s+m.count,0);return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="💜" title="Fan Hub" subtitle={`${totalMembers.toLocaleString()} members · Forum · Events · Memberships`}/><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Members" value={totalMembers.toLocaleString()} sub="+380 this season" color="purple"/><StatCard label="Forum Posts" value="359" sub="This month" color="blue"/><StatCard label="Events" value="7" sub="Apr–Jun 2026" color="teal"/><StatCard label="Membership rev" value="£28.3k" sub="YTD" color="green"/></div><div className="flex gap-1 border-b border-gray-800">{([{id:'overview' as const,label:'Overview',icon:'📊'},{id:'forum' as const,label:'Forum',icon:'💬'},{id:'events' as const,label:'Events',icon:'🎟️'},{id:'memberships' as const,label:'Memberships',icon:'🏅'}]).map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>{activeTab==='overview'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-1">Member Growth — Season</div><p className="text-xs text-gray-500 mb-4">620 → {totalMembers.toLocaleString()} (+245%)</p><svg viewBox={`0 0 ${GW} ${GH}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={gPL} x2={GW-gPR} y1={gPT+gIH-t*gIH} y2={gPT+gIH-t*gIH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<path d={gArea} fill="#8B5CF6" opacity="0.08"/><path d={gPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{GROWTH.map((v,i)=><g key={i}><circle cx={gPL+i*gStepX} cy={gPT+gIH-((v-gMin)/(gMax-gMin))*gIH} r="3.5" fill="#8B5CF6"/><text x={gPL+i*gStepX} y={GH-4} fontSize="9" fill="#6B7280" textAnchor="middle">{G_LABELS[i]}</text></g>)}</svg></Card><Card><div className="text-sm font-semibold text-white mb-3">Trending Topics</div><div className="space-y-2">{FORUM_TOPICS.filter(t=>t.hot).map((t,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"><div className="flex items-center gap-3"><span className="text-orange-400 text-xs">🔥</span><div><div className="text-xs text-gray-200">{t.title}</div><div className="flex items-center gap-2 mt-0.5"><span className={`text-[9px] px-1.5 py-0.5 rounded ${catColor(t.cat)}`}>{t.cat}</span><span className="text-[10px] text-gray-600">{t.last}</span></div></div></div><div className="text-right flex-shrink-0 ml-4"><div className="text-xs text-purple-400 font-bold">{t.posts} posts</div><div className="text-[10px] text-gray-600">{t.views.toLocaleString()} views</div></div></div>)}</div></Card></div>}{activeTab==='forum'&&<Card><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Topic</th><th className="text-left py-2">Category</th><th className="text-center py-2">Posts</th><th className="text-center py-2">Views</th><th className="text-center py-2">Last</th></tr></thead><tbody>{FORUM_TOPICS.map((t,i)=><tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]"><td className="py-2"><div className="flex items-center gap-2">{t.hot&&<span className="text-orange-400">🔥</span>}<span className="text-gray-200">{t.title}</span></div></td><td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${catColor(t.cat)}`}>{t.cat}</span></td><td className="py-2 text-center text-purple-400 font-bold">{t.posts}</td><td className="py-2 text-center text-gray-400">{t.views.toLocaleString()}</td><td className="py-2 text-center text-gray-500 text-[10px]">{t.last}</td></tr>)}</tbody></table></Card>}{activeTab==='events'&&<div className="space-y-3">{EVENTS.map((e,i)=><Card key={i}><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{e.event}</span><span className={`text-[10px] px-2 py-0.5 rounded ${e.type==='Matchday'?'bg-purple-600/20 text-purple-400':e.type==='Members'?'bg-blue-600/20 text-blue-400':e.type==='Sponsor'?'bg-amber-600/20 text-amber-400':'bg-green-600/20 text-green-400'}`}>{e.type}</span></div><div className="flex items-center gap-3 text-[10px] text-gray-500"><span>📅 {e.date}</span><span>🎟️ {e.tickets}</span></div></div></div></Card>)}</div>}{activeTab==='memberships'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-3 gap-5">{MEMBERS.map((m,i)=><div key={i} className={`bg-[#0D1117] border-2 rounded-xl p-5 ${m.color}`}><div className="flex items-center justify-between mb-3"><div><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${m.badge}`}>{m.name}</span><div className="text-xl font-bold text-white mt-2">{m.price}</div></div><div className="text-right"><div className="text-lg font-bold text-purple-400">{m.count}</div><div className="text-[10px] text-gray-600">members</div></div></div><div className="space-y-1.5">{m.features.map((f,j)=><div key={j} className="flex items-start gap-1.5 text-xs text-gray-300"><span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{f}</div>)}</div></div>)}</div><Card><div className="text-sm font-semibold text-white mb-4">Revenue — YTD</div><div className="space-y-3">{[{tier:'Supporter',count:488,annual:20,color:'#6B7280'},{tier:'Club Member',count:214,annual:45,color:'#8B5CF6'},{tier:'Franchise',count:48,annual:120,color:'#F59E0B'}].map((r,i)=>{const rev=r.count*r.annual;return(<div key={i}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{r.tier} ({r.count} × £{r.annual})</span><span className="text-white font-bold">£{rev.toLocaleString()}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${(rev/9630)*100}%`,backgroundColor:r.color}}/></div></div>)})}<div className="pt-3 border-t border-gray-800 flex justify-between text-sm"><span className="text-gray-400 font-medium">Total YTD</span><span className="text-purple-400 font-bold">£{(488*20+214*45+48*120).toLocaleString()}</span></div></div></Card></div>}</div>)}

function WomensSquadView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⭐" title="Women's Squad" subtitle="Women's programme management — Rachel Turner." />
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-sm text-red-400">
        <span className="font-bold">PWR REGISTRATION OUTSTANDING</span> — Required for franchise readiness. Alternative: regional development plan must be submitted by 30 April.
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Current Women&apos;s Programme</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[{l:'Players',v:'28'},{l:'League',v:'South West'},{l:'Record',v:'7W 3L (4th)'},{l:'Training',v:'Tue & Thu'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold">{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">PWR Registration Options</div>
        <div className="space-y-3">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-sm text-white font-medium">Option A: Register for PWR</div>
            <div className="text-xs text-gray-400">Est. cost £120,000/yr — requires full-time head coach, physio, enhanced facilities</div>
          </div>
          <div className="bg-[#0a0c14] border border-purple-600/30 rounded-lg p-3">
            <div className="text-sm text-purple-400 font-medium">Option B: Regional Development Plan ← Being pursued</div>
            <div className="text-xs text-gray-400">Min investment £30,000, programme targets, report schedule. Plan being drafted — Rachel Turner.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── PWR COMPLIANCE VIEW ──────────────────────────────────────────────────────
function PWRComplianceView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="PWR Compliance" subtitle="Regional Development Plan — Option B." />
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 text-xs text-red-400 font-medium">Deadline: 30 April 2026 (24 days)</div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Plan Requirements (RFU Checklist)</div>
        <div className="space-y-2">
          {[
            {item:'Written plan submitted to RFU Women\'s Game department',status:'NOT SUBMITTED'},
            {item:'Minimum investment commitment documented',status:'IN PROGRESS'},
            {item:'Annual programme targets defined',status:'IN PROGRESS'},
            {item:'Reporting schedule confirmed',status:'NOT STARTED'},
            {item:'Named lead contact at club',status:'COMPLETE'},
          ].map((c:{item:string;status:string},i:number)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
              <span className={`text-xs ${c.status==='COMPLETE'?'text-green-400':c.status.includes('PROGRESS')?'text-amber-400':'text-red-400'}`}>{c.status==='COMPLETE'?'✓':c.status.includes('PROGRESS')?'◐':'☐'}</span>
              <span className="text-gray-300 flex-1">{c.item}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${c.status==='COMPLETE'?'bg-green-600/20 text-green-400':c.status.includes('PROGRESS')?'bg-amber-600/20 text-amber-400':'bg-red-600/20 text-red-400'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Actions</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Rachel Turner to complete development plan draft by 15 April</div>
          <div>Caroline Hughes to review and approve budget commitment by 18 April</div>
          <div>Submit to RFU Women&apos;s Game by 30 April</div>
        </div>
      </Card>
    </div>
  );
}

// ─── SHARED FACILITIES VIEW ───────────────────────────────────────────────────
function SharedFacilitiesView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏢" title="Shared Facilities" subtitle="Men's and women's programme facility schedule." />
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        Conflict detected: Thursday 9 April — Women&apos;s training (6pm) and Men&apos;s pre-match walkthrough (6pm) — BOTH on Pitch 1 — RESOLVE
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Weekly Facility Timetable</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-2">Time</th><th className="p-2">Mon</th><th className="p-2">Tue</th><th className="p-2">Wed</th><th className="p-2">Thu</th><th className="p-2">Fri</th><th className="p-2">Sat</th>
            </tr></thead>
            <tbody>
              {[
                {time:'9am–12pm',mon:'Men\'s 1st XV',tue:'Men\'s 1st XV',wed:'REST',thu:'Men\'s walkthrough',fri:'Captain\'s Run',sat:'MATCH DAY'},
                {time:'2pm–4pm',mon:'Academy',tue:'Academy',wed:'—',thu:'Academy',fri:'—',sat:'—'},
                {time:'6pm–8pm',mon:'Women\'s',tue:'Women\'s',wed:'—',thu:'Women\'s ⚠',fri:'—',sat:'—'},
              ].map((r:{time:string;mon:string;tue:string;wed:string;thu:string;fri:string;sat:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-2 text-gray-400 font-medium">{r.time}</td>
                  <td className="p-2 text-purple-400">{r.mon}</td><td className="p-2 text-purple-400">{r.tue}</td><td className="p-2 text-gray-600">{r.wed}</td>
                  <td className={`p-2 ${r.thu.includes('⚠')?'text-amber-400':'text-purple-400'}`}>{r.thu}</td>
                  <td className="p-2 text-purple-400">{r.fri}</td><td className="p-2 text-purple-400">{r.sat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── WOMEN'S COMMERCIAL VIEW ──────────────────────────────────────────────────
function WomensCommercialView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💼" title="Women's Commercial" subtitle="Target: build to self-sustaining by Year 2." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Current Income" value="£0" sub="Costs shared with men's" color="red" />
        <StatCard label="Budget Allocation" value="£30,000" sub="Board approved" color="purple" />
        <StatCard label="Pipeline" value="£10,000" sub="2 prospects" color="orange" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Pipeline</div>
        <div className="space-y-2">
          {[{name:'West Country Energy',type:'Women\'s shirt sponsor',est:'£8,000',stage:'Meeting arranged'},{name:'Local solicitor',type:'Matchday programme',est:'£2,000',stage:'Approached'}].map((p:{name:string;type:string;est:string;stage:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <div><span className="text-gray-200">{p.name}</span> — <span className="text-gray-400">{p.type} — est. {p.est}</span></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.stage}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── AI MORNING BRIEFING VIEW ─────────────────────────────────────────────────
function AIBriefingView({club}:{club:RugbyClub}) {
  const [briefing,setBriefing]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [role,setRole]=useState<'dor'|'coach'|'ceo'|'medical'>('dor');

  const generate = async () => {
    setLoading(true);
    const rolePrompts: Record<string,string> = {
      dor:'Director of Rugby briefing — full overview including squad, cap, franchise, recruitment, compliance',
      coach:'Head Coach briefing — squad readiness focus, no commercial or financial detail',
      ceo:'CEO briefing — financial, franchise readiness, commercial obligations only',
      medical:'Head of Medical briefing — welfare, HIA, RTP, medical screening focus',
    };
    try {
      const res = await fetch('/api/ai/rugby',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,messages:[{role:'user',content:`Generate a ${rolePrompts[role]} for ${club.name} (${club.league}). Squad: 31/38 available, 1 HIA active, next match vs Jersey Reds Saturday. Cap: £2.34M of £2.8M. Franchise: 71%. Be concise and professional.`}]}),
      });
      const data = await res.json();
      setBriefing(data.content?.[0]?.text||'Generation failed.');
    } catch { setBriefing('Error connecting to AI service.'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤖" title="AI Morning Briefing" subtitle="Role-specific daily intelligence." />
      <div className="flex gap-1 bg-[#0d1117] border border-gray-800 rounded-lg p-1 w-fit">
        {([['dor','Director of Rugby'],['coach','Head Coach'],['ceo','CEO'],['medical','Head of Medical']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>{setRole(id as typeof role);setBriefing(null);}} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${role===id?'bg-purple-600/20 text-purple-400 border border-purple-600/30':'text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>
      <button onClick={generate} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 disabled:opacity-50">
        {loading?'Generating...':'Generate Briefing'}
      </button>
      {loading&&<Card><div className="flex items-center gap-2 text-xs text-purple-400"><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>Generating...</div></Card>}
      {briefing&&!loading&&<Card><div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{briefing}</div></Card>}
    </div>
  );
}

// ─── CLUB-TO-COUNTRY VIEW ─────────────────────────────────────────────────────
function ClubToCountryView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏴󠁧󠁢󠁥󠁮󠁧󠁿" title="Club-to-Country" subtitle="International data interface and return protocols." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Current Call-Ups</div>
        <div className="space-y-3">
          {[
            {name:'Danny Foster',team:'England Saxons',dataSent:true,medicalSent:true,returnExp:'May 11',capDiscount:'£17,500'},
            {name:'Marcus Webb',team:'England (Senior)',dataSent:true,medicalSent:true,returnExp:'May 10',capDiscount:'£17,500'},
          ].map((p:{name:string;team:string;dataSent:boolean;medicalSent:boolean;returnExp:string;capDiscount:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2"><div className="text-sm text-white font-medium">{p.name} — {p.team}</div><span className="text-xs text-teal-400">Cap discount: {p.capDiscount}</span></div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div>Data sent: <span className="text-green-400">✓ AUTO-SYNC</span></div>
                <div>Medical shared: <span className="text-green-400">✓</span></div>
                <div>Return expected: {p.returnExp}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── OPPOSITION ANALYSIS VIEW ─────────────────────────────────────────────────
function OppositionAnalysisView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔎" title="Opposition Analysis" subtitle="Jersey Reds — Champ Rugby — Position: 6th." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pts Scored (avg)" value="22.4" sub="League avg: 26.1" color="orange" />
        <StatCard label="Pts Conceded" value="19.6" color="teal" />
        <StatCard label="Lineout" value="88%" sub="Strong" color="green" />
        <StatCard label="Scrum" value="62%" sub="Weak" color="red" />
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Key Threats</div>
        <div className="space-y-2">
          {[
            {name:'Charlie Morris',pos:'Openside',stat:'9 turnovers last 3 games, 8.2km/game'},
            {name:'Ben Hawkins',pos:'Fly Half',stat:'81% territory exit success, kicking game'},
            {name:'Josh Fairley',pos:'Hooker',stat:'95% lineout accuracy from his throws'},
          ].map((p:{name:string;pos:string;stat:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-400">{p.name.split(' ').map((w:string)=>w[0]).join('')}</div>
              <div><div className="text-sm text-white">{p.name} — {p.pos}</div><div className="text-xs text-gray-400">{p.stat}</div></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Tactical Notes (Head Coach)</div>
        <div className="text-xs text-gray-400 leading-relaxed">
          &quot;Attack their scrum early — 4 scrum penalties in last 3 games. Wingers compete for high ball — Hawkins kicks long to left channel 60% of the time. Charlie Morris must be neutralised at breakdown — Danny Cole to direct traffic away from his side.&quot;
        </div>
      </Card>
    </div>
  );
}

// ─── INDUSTRY NEWS VIEW ───────────────────────────────────────────────────────
function IndustryNewsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📰" title="Industry News" subtitle="Rugby news relevant to Hartfield RFC." />
      <div className="space-y-3">
        {[
          {headline:'Premiership franchise readiness criteria published in full',body:'The RFU\'s Expansion Review Group has released the formal assessment framework for the 2029/30 expansion to 12 Premiership teams.',note:'Franchise readiness tracker showing 71% — action needed'},
          {headline:'Salary cap floor enforced from 2026/27 — two clubs warned',body:'Premiership Rugby has formally notified two clubs that their current squad spend is below the new £5.4M minimum spend floor.',note:'Cap floor indicator: Hartfield £440,000 above floor — compliant'},
          {headline:'Lumio Health expands Championship partnership',body:'Lumio Health has confirmed its expansion of the RFU partnership to include all Championship clubs from 2025/26.',note:'Lumio Rugby integration: Lumio Health data feed active ✓'},
          {headline:'World Rugby updates HIA protocol for 2026/27',body:'World Rugby has announced updates to the Head Injury Assessment protocol effective from July 2026.',note:'HIA tracker: 1 active case — Danny Foster, Day 8 of protocol'},
        ].map((n:{headline:string;body:string;note:string},i:number)=>(
          <Card key={i}>
            <div className="text-sm text-white font-semibold mb-1">{n.headline}</div>
            <div className="text-xs text-gray-400 mb-2">{n.body}</div>
            <div className="text-xs text-purple-400 bg-purple-600/10 border border-purple-600/20 rounded-lg p-2">{n.note}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── GPS & LOAD VIEW ──────────────────────────────────────────────────────────
const GPS_DATA = [
  { name: 'Danny Foley',  pos: 'No.8',       dist: 12.4, hi: 1240, sprints: 28, maxSpeed: 32.1, acwr: 1.38, status: 'overload' as const },
  { name: 'Tom Harrison', pos: 'Prop',       dist: 10.8, hi:  720, sprints: 14, maxSpeed: 27.8, acwr: 0.94, status: 'optimal'  as const },
  { name: 'Marcus Webb',  pos: 'Lock',       dist: 11.6, hi:  880, sprints: 18, maxSpeed: 29.2, acwr: 1.12, status: 'optimal'  as const },
  { name: 'Karl Foster',  pos: 'Flanker',    dist: 12.1, hi: 1080, sprints: 24, maxSpeed: 30.5, acwr: 1.44, status: 'manage'   as const },
  { name: 'Sam Ellis',    pos: 'Scrum Half', dist: 11.2, hi:  940, sprints: 22, maxSpeed: 31.4, acwr: 1.08, status: 'optimal'  as const },
  { name: 'Danny Cole',   pos: 'Fly Half',   dist:  9.8, hi:  680, sprints: 16, maxSpeed: 29.6, acwr: 0.78, status: 'underload' as const },
  { name: 'Matt Jones',   pos: 'Centre',     dist: 11.9, hi:  960, sprints: 21, maxSpeed: 30.8, acwr: 1.16, status: 'optimal'  as const },
  { name: 'Luke Barnes',  pos: 'Fullback',   dist: 12.3, hi: 1120, sprints: 26, maxSpeed: 31.9, acwr: 1.52, status: 'overload' as const },
]

function SetPieceAnalyticsView() {
  const [spTab, setSpTab] = useState<'lineout'|'scrum'|'restart'|'goalkicking'>('lineout');
  const LINEOUT={season:{won:68,lost:12,stolen:4,total:80,successPct:85,oppWon:72,oppStolen:8},byZone:[{zone:'Own 22',won:18,lost:2,pct:90,note:'Strong — reliable ball'},{zone:'Midfield',won:28,lost:6,pct:82,note:'Occasional steal risk'},{zone:'Opp 22',won:22,lost:4,pct:85,note:'Good — clean platform'}],calls:[{call:'Front ball (#2)',used:28,success:25,pct:89,note:'Most reliable'},{call:'Middle lift (#4)',used:22,success:18,pct:82,note:'Good in midfield'},{call:'Back peel (#6)',used:18,success:14,pct:78,note:'Opposition learning'},{call:'Dummy front',used:12,success:11,pct:92,note:'Use more — highest %'}],weeklyWon:[82,79,88,85,90,83,85,87],weeklyLabels:['W8','W9','W10','W11','W12','W13','W14','W15']};
  const SCRUM={season:{won:44,lost:18,penFor:12,penAgainst:8,total:62,successPct:71},byOutcome:[{outcome:'Clean ball',n:36,pct:58},{outcome:'Pen won',n:12,pct:19},{outcome:'Reset',n:6,pct:10},{outcome:'Pen conceded',n:8,pct:13}],weeklyPct:[68,72,65,74,71,69,73,71],weeklyLabels:['W8','W9','W10','W11','W12','W13','W14','W15']};
  const RESTART={kickoffs:{retained:14,total:18,retentionPct:78},dropouts:{retained:6,total:8,retentionPct:75},opposition:{ourSteal:32}};
  const KICKING={season:{attempts:42,converted:34,successPct:81},byZone:[{zone:'Central (<25m)',attempts:8,converted:8,pct:100},{zone:'Central (25–40m)',attempts:14,converted:13,pct:93},{zone:'Left angle',attempts:10,converted:7,pct:70},{zone:'Right angle',attempts:10,converted:6,pct:60}],kicker:'Danny Cole',pressureConversion:72};
  const spBar = (data:number[],labels:string[],color:string,max=100) => {const W=520,H=120,pL=24,pR=8,pT=12,pB=28,iW=W-pL-pR,iH=H-pT-pB,bw=(iW/data.length)*0.55,bg=iW/data.length;return<svg viewBox={`0 0 ${W} ${H}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={pL} x2={W-pR} y1={pT+iH-t*iH} y2={pT+iH-t*iH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}{data.map((v,i)=>{const bh=(v/max)*iH;const x=pL+i*bg+(bg-bw)/2;const bc=v>=85?'#22C55E':v>=75?color:v>=65?'#F59E0B':'#EF4444';return<g key={i}><rect x={x} y={pT+iH-bh} width={bw} height={bh} fill={bc} opacity="0.8" rx="2"/><text x={x+bw/2} y={pT+iH-bh-3} fontSize="8" fill={bc} textAnchor="middle" fontWeight="bold">{v}%</text><text x={x+bw/2} y={H-4} fontSize="8" fill="#6B7280" textAnchor="middle">{labels[i]}</text></g>;})}</svg>;};
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="📐" title="Set Piece Analytics" subtitle="FrameSports auto-tagged · Lineout · Scrum · Restarts · Goal-kicking"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Lineout Win%" value={`${LINEOUT.season.successPct}%`} sub={`${LINEOUT.season.won}/${LINEOUT.season.total}`} color="green"/><StatCard label="Scrum Win%" value={`${SCRUM.season.successPct}%`} sub={`${SCRUM.season.won}/${SCRUM.season.total}`} color="orange"/><StatCard label="Restart Retention" value={`${RESTART.kickoffs.retentionPct}%`} sub={`${RESTART.kickoffs.retained}/${RESTART.kickoffs.total}`} color="purple"/><StatCard label="Goal Kicking" value={`${KICKING.season.successPct}%`} sub={`${KICKING.season.converted}/${KICKING.season.attempts}`} color="green"/></div>
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">{([{id:'lineout',label:'Lineout',icon:'🤲'},{id:'scrum',label:'Scrum',icon:'💪'},{id:'restart',label:'Restarts',icon:'🏉'},{id:'goalkicking',label:'Goal-Kicking',icon:'🎯'}] as const).map(t=><button key={t.id} onClick={()=>setSpTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${spTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {spTab==='lineout'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><div className="text-sm font-semibold text-white mb-3">Win % by Zone</div>{LINEOUT.byZone.map((z,i)=><div key={i} className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{z.zone}</span><span className={`font-bold ${z.pct>=85?'text-green-400':'text-amber-400'}`}>{z.pct}%</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-purple-500" style={{width:`${z.pct}%`}}/></div><div className="text-[10px] text-gray-600 mt-0.5">{z.note}</div></div>)}</Card><Card><div className="text-sm font-semibold text-white mb-3">Call Success</div>{LINEOUT.calls.map((c,i)=><div key={i} className="py-2 border-b border-gray-800/50 last:border-0"><div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{c.call}</span><span className={`font-bold ${c.pct>=88?'text-green-400':c.pct>=80?'text-amber-400':'text-red-400'}`}>{c.pct}%</span></div><div className="flex items-center gap-3"><div className="flex-1 bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-purple-500" style={{width:`${c.pct}%`}}/></div><span className="text-[10px] text-gray-500">{c.used} used</span></div><div className="text-[10px] text-gray-600 mt-0.5">{c.note}</div></div>)}</Card></div><Card><div className="text-sm font-semibold text-white mb-3">Last 8 Matches</div>{spBar(LINEOUT.weeklyWon,LINEOUT.weeklyLabels,'#8B5CF6')}</Card><Card><div className="text-sm font-semibold text-white mb-3">Opposition Lineout</div><div className="grid grid-cols-3 gap-4 text-center text-xs"><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-red-400">{LINEOUT.season.oppWon}</div><div className="text-gray-500 mt-1">Opp won</div></div><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-green-400">{LINEOUT.season.oppStolen}</div><div className="text-gray-500 mt-1">We stole</div></div><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-amber-400">{Math.round((LINEOUT.season.oppStolen/(LINEOUT.season.oppWon+LINEOUT.season.oppStolen))*100)}%</div><div className="text-gray-500 mt-1">Steal rate</div></div></div></Card></div>}
      {spTab==='scrum'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><div className="text-sm font-semibold text-white mb-3">Outcomes (Season)</div>{SCRUM.byOutcome.map((o,i)=><div key={i} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{o.outcome}</span><span className="text-white">{o.n} ({o.pct}%)</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${o.pct}%`,backgroundColor:i===0?'#22C55E':i===1?'#8B5CF6':i===2?'#F59E0B':'#EF4444'}}/></div></div>)}<div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-3 text-xs text-center"><div className="bg-green-600/10 rounded-lg p-2"><div className="text-green-400 font-bold text-lg">{SCRUM.season.penFor}</div><div className="text-gray-500">Pen won</div></div><div className="bg-red-600/10 rounded-lg p-2"><div className="text-red-400 font-bold text-lg">{SCRUM.season.penAgainst}</div><div className="text-gray-500">Pen against</div></div></div></Card><Card><div className="text-sm font-semibold text-white mb-3">Last 8 Matches</div>{spBar(SCRUM.weeklyPct,SCRUM.weeklyLabels,'#8B5CF6')}<div className="mt-3 text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-lg p-2">⚠ 71% — below 75% target. Jersey concede 38% scrum pen rate.</div></Card></div></div>}
      {spTab==='restart'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Kickoff Ret." value={`${RESTART.kickoffs.retentionPct}%`} sub={`${RESTART.kickoffs.retained}/${RESTART.kickoffs.total}`} color="green"/><StatCard label="Dropout Ret." value={`${RESTART.dropouts.retentionPct}%`} sub={`${RESTART.dropouts.retained}/${RESTART.dropouts.total}`} color="teal"/><StatCard label="Opp Stolen" value={`${RESTART.opposition.ourSteal}%`} sub="Of opp kickoffs" color="purple"/><StatCard label="Chase Success" value="82%" sub="Kick to challenge" color="orange"/></div><Card><div className="text-sm font-semibold text-white mb-3">Restart Patterns</div>{[{l:'Short kick (chase)',u:9,r:8,n:'Most effective'},{l:'Long to 10 channel',u:6,r:4,n:'Contested'},{l:'Long to 15',u:3,r:2,n:'Avoid until Barnes fit'}].map((r,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs"><div><div className="text-gray-300 font-medium">{r.l}</div><div className="text-[10px] text-gray-600">{r.n}</div></div><div className="text-right"><div className={`text-sm font-bold ${(r.r/r.u)>=0.8?'text-green-400':'text-amber-400'}`}>{Math.round((r.r/r.u)*100)}%</div><div className="text-[10px] text-gray-600">{r.r}/{r.u}</div></div></div>)}</Card></div>}
      {spTab==='goalkicking'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">By Zone — {KICKING.kicker}</div>{KICKING.byZone.map((z,i)=><div key={i} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{z.zone}</span><span className={`font-bold ${z.pct>=85?'text-green-400':z.pct>=70?'text-amber-400':'text-red-400'}`}>{z.pct}% ({z.converted}/{z.attempts})</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${z.pct}%`,backgroundColor:z.pct>=85?'#22C55E':z.pct>=70?'#F59E0B':'#EF4444'}}/></div></div>)}<div className="mt-4 pt-3 border-t border-gray-800 text-xs text-amber-400">⚠ Right-angle at 60% — focus Thursday.</div></Card><div className="grid grid-cols-3 gap-4"><StatCard label="Season" value={`${KICKING.season.successPct}%`} sub={`${KICKING.season.converted}/${KICKING.season.attempts}`} color="green"/><StatCard label="Pressure" value={`${KICKING.pressureConversion}%`} sub="Close games" color="amber"/><StatCard label="Points" value="102" sub="From boot" color="purple"/></div></div>}
      <div className="text-[10px] text-gray-700">FrameSports auto-tagging · Pay-per-game · Uploaded within 2h</div>
    </div>
  );
}

function CarryAnalyticsView() {
  const [caTab, setCaTab] = useState<'gainline'|'topcarriers'|'patterns'|'trends'>('gainline');
  const SEASON={totalCarries:648,gainlineWon:398,gainlineLost:186,gainlineContested:64,gainlinePct:61,defendersBeaten:184,lineBreaks:28,offloads:112,aveMetresPerCarry:4.2,bench:{gainline:56,defendersBeaten:14,lineBreaks:2.1}};
  const CARRIERS=[{name:'Danny Foster',pos:'No.8',carries:128,glWon:84,lb:8,db:32,offloads:18,avg:4.9,acwr:1.38},{name:'Luke Barnes',pos:'FB',carries:142,glWon:92,lb:7,db:28,offloads:8,avg:5.4,acwr:1.52},{name:'Matt Jones',pos:'Centre',carries:98,glWon:61,lb:5,db:24,offloads:14,avg:3.8,acwr:1.12},{name:'Marcus Webb',pos:'Lock',carries:88,glWon:52,lb:4,db:18,offloads:22,avg:3.2,acwr:1.12},{name:'Karl Foster',pos:'Flanker',carries:94,glWon:56,lb:2,db:14,offloads:28,avg:2.9,acwr:1.44},{name:'David Obi',pos:'Centre',carries:98,glWon:53,lb:2,db:22,offloads:12,avg:3.4,acwr:1.08}];
  const MATCH_TREND=[{m:'W8',g:58},{m:'W9',g:64},{m:'W10',g:55},{m:'W11',g:68},{m:'W12',g:62},{m:'W13',g:59},{m:'W14',g:66},{m:'W15',g:61}];
  const PATTERNS=[{p:'First-phase (0–2)',n:214,g:68,note:'Most effective — exploit early'},{p:'Third-phase+',n:186,g:54,note:'Defence organised — consider kick'},{p:'Short-side (blind)',n:98,g:72,note:'High success — underused'},{p:'Pick-and-go',n:112,g:58,note:'Standard — manage prop ACWR'},{p:'Ball from hands (wide)',n:38,g:61,note:'Growing — Barnes effective'}];
  const W2=560,H2=160,pL2=36,pR2=12,pT2=16,pB2=32,iW2=W2-pL2-pR2,iH2=H2-pT2-pB2;
  const glPath=MATCH_TREND.map((d,i)=>`${i===0?'M':'L'} ${pL2+(i/(MATCH_TREND.length-1))*iW2} ${pT2+iH2-((d.g-40)/40)*iH2}`).join(' ');
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="⚡" title="Carry Analytics" subtitle="Gainline · Defenders beaten · Line breaks · Offloads — FrameSports"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Gainline Win%" value={`${SEASON.gainlinePct}%`} sub={`Bench: ${SEASON.bench.gainline}%`} color="green"/><StatCard label="Def Beaten" value={SEASON.defendersBeaten} sub={`${(SEASON.defendersBeaten/16).toFixed(1)}/match`} color="purple"/><StatCard label="Line Breaks" value={SEASON.lineBreaks} sub={`${(SEASON.lineBreaks/16).toFixed(1)}/match`} color="teal"/><StatCard label="Offloads" value={SEASON.offloads} sub={`${SEASON.aveMetresPerCarry}m/carry`} color="orange"/></div>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'gainline',label:'Gainline',icon:'📈'},{id:'topcarriers',label:'Top Carriers',icon:'🏉'},{id:'patterns',label:'Patterns',icon:'🗺️'},{id:'trends',label:'Trend',icon:'📉'}] as const).map(t=><button key={t.id} onClick={()=>setCaTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${caTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {caTab==='gainline'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-4">Gainline Breakdown ({SEASON.totalCarries} carries)</div><div className="grid grid-cols-3 gap-4 text-center mb-4"><div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-green-400">{SEASON.gainlineWon}</div><div className="text-xs text-gray-400 mt-1">Won ({SEASON.gainlinePct}%)</div></div><div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-red-400">{SEASON.gainlineLost}</div><div className="text-xs text-gray-400 mt-1">Lost ({Math.round(SEASON.gainlineLost/SEASON.totalCarries*100)}%)</div></div><div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-amber-400">{SEASON.gainlineContested}</div><div className="text-xs text-gray-400 mt-1">Contested</div></div></div><div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex"><div className="h-full bg-green-500" style={{width:`${SEASON.gainlinePct}%`}}/><div className="h-full bg-amber-500" style={{width:`${Math.round(SEASON.gainlineContested/SEASON.totalCarries*100)}%`}}/><div className="h-full bg-red-500" style={{width:`${Math.round(SEASON.gainlineLost/SEASON.totalCarries*100)}%`}}/></div></Card></div>}
      {caTab==='topcarriers'&&<Card><div className="text-sm font-semibold text-white mb-3">Top Carriers — Season</div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Player</th><th className="text-right py-2">Carries</th><th className="text-right py-2">GL%</th><th className="text-right py-2">LB</th><th className="text-right py-2">DB</th><th className="text-right py-2">Off</th><th className="text-right py-2">Avg m</th><th className="text-right py-2">ACWR</th></tr></thead><tbody>{CARRIERS.map((c,i)=>{const glP=Math.round((c.glWon/c.carries)*100);return<tr key={i} className="border-b border-gray-800/40"><td className="py-2"><div className="text-white font-medium">{c.name}</div><div className="text-gray-500 text-[10px]">{c.pos}</div></td><td className="py-2 text-right text-gray-200">{c.carries}</td><td className="py-2 text-right"><span className={`font-bold ${glP>=60?'text-green-400':'text-amber-400'}`}>{glP}%</span></td><td className="py-2 text-right text-purple-400 font-bold">{c.lb}</td><td className="py-2 text-right text-gray-200">{c.db}</td><td className="py-2 text-right text-teal-400">{c.offloads}</td><td className="py-2 text-right text-gray-200">{c.avg}m</td><td className={`py-2 text-right font-bold ${c.acwr>1.5?'text-red-400':c.acwr>1.3?'text-amber-400':'text-green-400'}`}>{c.acwr}</td></tr>;})}</tbody></table></div><div className="mt-3 p-3 bg-purple-600/10 border border-purple-600/20 rounded-lg text-xs text-purple-300">💡 Foster and Barnes lead line breaks but both carry elevated ACWR. Monitor load.</div></Card>}
      {caTab==='patterns'&&<Card><div className="text-sm font-semibold text-white mb-3">Carry Patterns — Gainline by Phase/Channel</div>{PATTERNS.map((p,i)=><div key={i} className="py-2 border-b border-gray-800/50 last:border-0"><div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{p.p}</span><div className="flex gap-3"><span className="text-gray-500">{p.n} carries</span><span className={`font-bold ${p.g>=65?'text-green-400':p.g>=58?'text-amber-400':'text-red-400'}`}>{p.g}%</span></div></div><div className="w-full bg-gray-800 rounded-full h-1.5 mb-1"><div className="h-1.5 rounded-full bg-purple-500" style={{width:`${p.g}%`}}/></div><div className="text-[10px] text-gray-600">{p.note}</div></div>)}<div className="mt-4 bg-green-600/10 border border-green-600/20 rounded-lg p-3 text-xs text-green-400">✓ Short-side carries win gainline at 72% — highest — but only 15% of carries. Increase vs Jersey.</div></Card>}
      {caTab==='trends'&&<Card><div className="text-sm font-semibold text-white mb-3">Gainline % — Last 8</div><svg viewBox={`0 0 ${W2} ${H2}`} width="100%">{[0,0.25,0.5,0.75,1].map((t,i)=><line key={i} x1={pL2} x2={W2-pR2} y1={pT2+iH2-t*iH2} y2={pT2+iH2-t*iH2} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<line x1={pL2} x2={W2-pR2} y1={pT2+iH2-0.5*iH2} y2={pT2+iH2-0.5*iH2} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/><path d={glPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{MATCH_TREND.map((d,i)=><g key={i}><circle cx={pL2+(i/(MATCH_TREND.length-1))*iW2} cy={pT2+iH2-((d.g-40)/40)*iH2} r="3.5" fill="#8B5CF6"/><text x={pL2+(i/(MATCH_TREND.length-1))*iW2} y={H2-4} fontSize="9" fill="#6B7280" textAnchor="middle">{d.m}</text></g>)}</svg></Card>}
    </div>
  );
}

// ─── PERIODISATION VIEW ──────────────────────────────────────────────────────
const DEMO_CLUB_FIXTURES=[{date:'11 Apr',opponent:'Jersey Reds',venue:'H',importance:'High'},{date:'18 Apr',opponent:'Bath RFC',venue:'A',importance:'Very High'},{date:'25 Apr',opponent:'Coventry',venue:'H',importance:'Medium'},{date:'2 May',opponent:'Doncaster',venue:'A',importance:'Medium'},{date:'9 May',opponent:'Saracens',venue:'H',importance:'Very High'},{date:'16 May',opponent:'Bedford',venue:'A',importance:'High'}];
const SEASON_WEEKS=[{week:1,label:'W1',phase:'Pre',planned:3200,actual:3050,match:false},{week:2,label:'W2',phase:'Pre',planned:3600,actual:3580,match:false},{week:3,label:'W3',phase:'Pre',planned:4000,actual:4120,match:false},{week:4,label:'W4',phase:'Pre',planned:3200,actual:3180,match:true},{week:5,label:'W5',phase:'Champ',planned:4400,actual:4380,match:true},{week:6,label:'W6',phase:'Champ',planned:4200,actual:4310,match:true},{week:7,label:'W7',phase:'Champ',planned:4600,actual:4480,match:true},{week:8,label:'W8',phase:'Champ',planned:4200,actual:4190,match:true},{week:9,label:'W9',phase:'Champ',planned:4800,actual:4920,match:true},{week:10,label:'W10',phase:'Champ',planned:4200,actual:4080,match:true},{week:11,label:'W11',phase:'Champ',planned:4600,actual:4750,match:true},{week:12,label:'W12',phase:'Champ',planned:3800,actual:3820,match:true},{week:13,label:'W13',phase:'Intl',planned:3000,actual:2980,match:false},{week:14,label:'W14',phase:'Champ',planned:4800,actual:4860,match:true},{week:15,label:'W15',phase:'Champ',planned:4600,actual:4780,match:true},{week:16,label:'W16',phase:'Champ',planned:4800,actual:0,match:true},{week:17,label:'W17',phase:'Champ',planned:4600,actual:0,match:true},{week:18,label:'W18',phase:'Champ',planned:5000,actual:0,match:true},{week:19,label:'W19',phase:'Play',planned:4200,actual:0,match:true},{week:20,label:'W20',phase:'Play',planned:5200,actual:0,match:true}];

function PeriodisationView() {
  const [perTab, setPerTab] = useState<'load'|'rotation'>('load');
  const [rotation, setRotation] = useState<string|null>(null);
  const [perLoading, setPerLoading] = useState(false);
  const generateRotation = async () => {
    setPerLoading(true);setRotation(null);
    try {
      const res=await fetch('/api/ai/rugby',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are S&C coordinator for Hartfield RFC (Championship Rugby). Generate a 6-week squad rotation plan. Fixtures: ${DEMO_CLUB_FIXTURES.map(f=>`${f.date} vs ${f.opponent} (${f.venue}) — ${f.importance}`).join('; ')}. GPS flags: Barnes ACWR 1.52 (overload), Foster 1.38, K.Foster 1.44. Injured: Briggs (shoulder, returns ~2 May), Patel (hamstring, ~18 Apr), D.Foster (HIA clears ~19 Apr). Bath (18 Apr) and Saracens (9 May) are priority matches. Format: ## 6-WEEK ROTATION PLAN (per fixture: selection note, load mgmt, target ACWR, academy opportunity) | ## PEAK WEEK MANAGEMENT | ## ACWR TARGETS — 6-WEEK. Under 500 words.`}]})});
      const data=await res.json();setRotation(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error.');
    } catch { setRotation('Connection error.'); }
    setPerLoading(false);
  };
  const renderMd=(text:string)=>text.split('\n').map((line,i)=>{if(line.startsWith('## '))return<h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;if(line.startsWith('**')&&line.endsWith('**'))return<p key={i} className="text-sm font-bold text-purple-400 mt-4 mb-1">{line.replace(/\*\*/g,'')}</p>;if(line.startsWith('- '))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1 ml-2"><span className="text-purple-500 flex-shrink-0">•</span><span>{line.slice(2)}</span></div>;if(line.trim()==='')return<div key={i} className="h-1"/>;return<p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;});
  const pW=620,pH=180,ppL=36,ppR=12,ppT=20,ppB=36,piW=pW-ppL-ppR,piH=pH-ppT-ppB,pMax=5500,pSX=piW/(SEASON_WEEKS.length-1);
  const plannedPath=SEASON_WEEKS.map((d,i)=>`${i===0?'M':'L'} ${ppL+i*pSX} ${ppT+piH-(d.planned/pMax)*piH}`).join(' ');
  const actualSegs:string[]=[];let seg='';
  SEASON_WEEKS.forEach((d,i)=>{if(d.actual>0){seg+=`${seg===''?'M':'L'} ${ppL+i*pSX} ${ppT+piH-(d.actual/pMax)*piH} `;}else{if(seg){actualSegs.push(seg);seg='';}}});
  if(seg)actualSegs.push(seg);
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="📈" title="Periodisation" subtitle="40-week season load · Planned vs actual AU · AI squad rotation"/>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'load',label:'Season Load',icon:'📊'},{id:'rotation',label:'AI Rotation',icon:'🤖'}] as const).map(t=><button key={t.id} onClick={()=>setPerTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px ${perTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {perTab==='load'&&<div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Season avg" value="4,380 AU" sub="Per week" color="purple"/><StatCard label="vs plan" value="+180 AU" sub="Slightly above" color="amber"/><StatCard label="Peak week" value="W9" sub="4,920 AU" color="orange"/><StatCard label="Intl window" value="W13" sub="Load dip" color="blue"/></div>
        <Card><div className="flex items-center justify-between mb-3"><div className="text-sm font-semibold text-white">Team Load — Season (AU/week)</div><div className="flex items-center gap-4 text-[10px]"><span className="flex items-center gap-1.5"><span className="w-3 h-px inline-block border-t border-dashed border-purple-400"/>Planned</span><span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-teal-400"/>Actual</span></div></div>
          <svg viewBox={`0 0 ${pW} ${pH}`} width="100%">
            {[0,0.25,0.5,0.75,1].map((t,i)=><line key={i} x1={ppL} x2={pW-ppR} y1={ppT+piH-t*piH} y2={ppT+piH-t*piH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
            {[0,1500,3000,4500].map((v,i)=><text key={i} x={ppL-4} y={ppT+piH-(v/pMax)*piH+3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
            {SEASON_WEEKS.map((d,i)=>d.match?<rect key={i} x={ppL+i*pSX-pSX*0.3} y={ppT} width={pSX*0.6} height={piH} fill="#8B5CF6" opacity="0.06" rx="1"/>:null)}
            <path d={plannedPath} fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round"/>
            {actualSegs.map((s,i)=><path key={i} d={s} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>)}
            {SEASON_WEEKS.filter(d=>d.actual>0).map((d)=>{const idx=SEASON_WEEKS.findIndex(w=>w.week===d.week);return<circle key={d.week} cx={ppL+idx*pSX} cy={ppT+piH-(d.actual/pMax)*piH} r="2.5" fill="#0D9488"/>;})}
            {SEASON_WEEKS.filter((_,i)=>i%2===0).map(d=><text key={d.label} x={ppL+SEASON_WEEKS.indexOf(d)*pSX} y={pH-4} fontSize="8" fill="#6B7280" textAnchor="middle">{d.label}</text>)}
            <line x1={ppL+15*pSX} x2={ppL+15*pSX} y1={ppT} y2={ppT+piH} stroke="#EC4899" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8"/><text x={ppL+15*pSX+3} y={ppT+14} fontSize="8" fill="#EC4899">NOW</text>
          </svg>
          <p className="text-[10px] text-gray-600 mt-2">Shaded = match weeks. Dashed = planned. Solid = actual. W16+ = projected.</p>
        </Card>
        <Card><div className="text-sm font-semibold text-white mb-3">Fixture Load Targets</div>{DEMO_CLUB_FIXTURES.map((f,i)=>{const tACWR=f.importance==='Very High'?'0.90–1.05':f.importance==='High'?'1.05–1.15':'1.10–1.20';const tLoad=f.importance==='Very High'?4200:f.importance==='High'?4600:4800;return<div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg border mb-2 ${f.importance==='Very High'?'border-purple-600/30 bg-purple-600/5':f.importance==='High'?'border-blue-600/20 bg-blue-600/5':'border-gray-800'}`}><div><span className="text-xs font-bold text-white">vs {f.opponent}</span><span className="text-[10px] text-gray-500 ml-2">{f.date} · {f.venue}</span></div><div className="flex items-center gap-4 text-[10px]"><span className={`font-bold ${f.importance==='Very High'?'text-purple-400':f.importance==='High'?'text-blue-400':'text-gray-500'}`}>{f.importance}</span><span className="text-gray-400">{tLoad} AU</span><span className="text-teal-400">ACWR: {tACWR}</span></div></div>;})}</Card>
      </div>}
      {perTab==='rotation'&&<div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><Card className="border-red-600/30"><div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⚠ Overloads</div><div className="space-y-1 text-xs text-gray-400"><div className="text-red-400">Barnes — ACWR 1.52</div><div className="text-amber-400">D.Foster — 1.38</div><div className="text-amber-400">K.Foster — 1.44</div></div></Card><Card><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Priority Matches</div><div className="space-y-1 text-xs"><div className="text-purple-400 font-bold">18 Apr — Bath (A)</div><div className="text-purple-400 font-bold">9 May — Saracens (H)</div></div></Card><Card><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Academy Available</div><div className="space-y-1 text-xs text-gray-400"><div>Tom Foley (No.8)</div><div>Ali Rashid (Wing)</div><div>Jack Summers (Centre)</div></div></Card></div>
        <div><button onClick={generateRotation} disabled={perLoading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">{perLoading?<><span className="animate-spin inline-block">⟳</span> Generating...</>:<><span>🤖</span> Generate 6-Week Rotation Plan</>}</button>{!rotation&&!perLoading&&<p className="text-xs text-gray-600 mt-2">GPS ACWR + fixtures + availability → optimal rotation to peak for Bath and Saracens.</p>}</div>
        {rotation&&<Card className="border-purple-600/30"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 AI Rotation Model</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">S&C ONLY</span></div><button onClick={generateRotation} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button></div><div>{renderMd(rotation)}</div><div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-[10px] text-gray-600">Powered by Claude · Hartfield RFC S&C</span><button className="text-xs text-purple-400 hover:text-purple-300">Share with Head Coach →</button></div></Card>}
      </div>}
    </div>
  );
}

// ─── GPS & LOAD VIEW (multi-tab rebuild) ─────────────────────────────────────
// 8-KPI strip + 6 tabs: Session Overview · Collision & Contact Load ·
// Load Trends & ACWR · Match vs Training · Position Group Analysis · Connect GPS.
// All SVGs inline. Rugby-specific data throughout.

type GpsLoadStatus = 'optimal' | 'manage' | 'overload' | 'underload'
type ImpactBand = 'low' | 'medium' | 'high'
interface RgPlayerLoad {
  name: string
  pos: string
  group: 'Props' | 'Hooker' | 'Locks' | 'Flankers' | 'No.8' | 'Backs'
  // Today's session
  distance: number     // km
  hsr: number          // m (>5.5 m/s)
  collisions: number
  topSpeed: number     // km/h
  todayAU: number
  // Load history (28d / 7d)
  chronic: number
  acute: number
  status: GpsLoadStatus
  // Intensity zones (m)
  zones: { stand:number; walk:number; jog:number; run:number; sprint:number }
  // Contact / non-contact AU split
  contactAU: number
  nonContactAU: number
  impactBand: ImpactBand
  // Recovery score 0–100
  recovery: number
}

const RG_LOAD_SQUAD: RgPlayerLoad[] = [
  { name:'Tom Harrison',  pos:'Loosehead',     group:'Props',    distance: 6.4, hsr: 220, collisions:14, topSpeed:27.8, todayAU:380, chronic:4820, acute:1340, status:'optimal',
    zones:{stand:1840,walk:2280,jog:1640,run:560,sprint:120},  contactAU:240, nonContactAU:140, impactBand:'high',   recovery:78 },
  { name:'Phil Dowd',     pos:'Tighthead',     group:'Props',    distance: 6.1, hsr: 180, collisions:12, topSpeed:26.4, todayAU:320, chronic:4200, acute:1050, status:'underload',
    zones:{stand:2040,walk:2160,jog:1340,run:480,sprint: 80},  contactAU:200, nonContactAU:120, impactBand:'high',   recovery:84 },
  { name:'Jake Rawlings', pos:'Loosehead',     group:'Props',    distance: 6.7, hsr: 240, collisions:11, topSpeed:27.1, todayAU:360, chronic:4560, acute:1240, status:'optimal',
    zones:{stand:1820,walk:2380,jog:1720,run:620,sprint:160},  contactAU:220, nonContactAU:140, impactBand:'medium', recovery:72 },
  { name:'James Briggs',  pos:'Hooker',        group:'Hooker',   distance: 6.9, hsr: 280, collisions:13, topSpeed:28.3, todayAU:410, chronic:4910, acute:1380, status:'optimal',
    zones:{stand:1780,walk:2240,jog:1740,run:780,sprint:360},  contactAU:260, nonContactAU:150, impactBand:'high',   recovery:74 },
  { name:'Marcus Webb',   pos:'Lock',          group:'Locks',    distance: 8.2, hsr: 380, collisions:11, topSpeed:29.2, todayAU:420, chronic:5100, acute:1450, status:'optimal',
    zones:{stand:1640,walk:2380,jog:2240,run:1180,sprint:760}, contactAU:240, nonContactAU:180, impactBand:'high',   recovery:76 },
  { name:'Chris Palmer',  pos:'Lock',          group:'Locks',    distance: 7.8, hsr: 340, collisions: 9, topSpeed:28.6, todayAU:390, chronic:4780, acute:1320, status:'optimal',
    zones:{stand:1700,walk:2420,jog:2080,run:1080,sprint:520}, contactAU:200, nonContactAU:190, impactBand:'medium', recovery:80 },
  { name:'Karl Foster',   pos:'Flanker',       group:'Flankers', distance: 9.4, hsr: 720, collisions:18, topSpeed:30.5, todayAU:440, chronic:5080, acute:1620, status:'manage',
    zones:{stand:1340,walk:2180,jog:2620,run:1820,sprint:1440},contactAU:280, nonContactAU:160, impactBand:'high',   recovery:62 },
  { name:'Josh White',    pos:'Flanker',       group:'Flankers', distance: 9.1, hsr: 660, collisions:14, topSpeed:30.1, todayAU:380, chronic:4740, acute:1300, status:'optimal',
    zones:{stand:1380,walk:2200,jog:2580,run:1740,sprint:1200},contactAU:240, nonContactAU:140, impactBand:'high',   recovery:70 },
  { name:'Danny Foster',  pos:'No.8',          group:'No.8',     distance:10.2, hsr: 880, collisions:22, topSpeed:32.1, todayAU:  0, chronic:5240, acute:1820, status:'overload',
    zones:{stand:1240,walk:2040,jog:2540,run:2080,sprint:2300},contactAU:320, nonContactAU:200, impactBand:'high',   recovery:48 },
  { name:'Sam Ellis',     pos:'Scrum Half',    group:'Backs',    distance: 9.8, hsr: 880, collisions: 6, topSpeed:31.4, todayAU:360, chronic:4640, acute:1280, status:'optimal',
    zones:{stand:1240,walk:2160,jog:2540,run:1860,sprint:2000},contactAU:120, nonContactAU:240, impactBand:'low',    recovery:82 },
  { name:'Oliver Grant',  pos:'Scrum Half',    group:'Backs',    distance: 9.6, hsr: 820, collisions: 5, topSpeed:31.0, todayAU:370, chronic:4600, acute:1270, status:'optimal',
    zones:{stand:1280,walk:2240,jog:2440,run:1840,sprint:1800},contactAU:120, nonContactAU:250, impactBand:'low',    recovery:84 },
  { name:'Danny Cole',    pos:'Fly Half',      group:'Backs',    distance: 9.3, hsr: 640, collisions: 4, topSpeed:29.6, todayAU:290, chronic:4380, acute: 980, status:'underload',
    zones:{stand:1320,walk:2300,jog:2360,run:1820,sprint:1480},contactAU: 80, nonContactAU:210, impactBand:'low',    recovery:88 },
  { name:'Connor Walsh',  pos:'Fly Half',      group:'Backs',    distance: 9.5, hsr: 700, collisions: 5, topSpeed:30.2, todayAU:340, chronic:4280, acute:1180, status:'optimal',
    zones:{stand:1280,walk:2260,jog:2420,run:1820,sprint:1720},contactAU: 80, nonContactAU:260, impactBand:'low',    recovery:80 },
  { name:'Matt Jones',    pos:'Inside Centre', group:'Backs',    distance:10.1, hsr: 920, collisions:13, topSpeed:30.8, todayAU:390, chronic:4820, acute:1340, status:'optimal',
    zones:{stand:1180,walk:2120,jog:2640,run:1980,sprint:2180},contactAU:200, nonContactAU:190, impactBand:'medium', recovery:76 },
  { name:'David Obi',     pos:'Outside Centre',group:'Backs',    distance: 9.9, hsr: 880, collisions:11, topSpeed:30.4, todayAU:370, chronic:4680, acute:1290, status:'optimal',
    zones:{stand:1240,walk:2080,jog:2560,run:1880,sprint:2140},contactAU:160, nonContactAU:210, impactBand:'medium', recovery:78 },
  { name:'Ryan Patel',    pos:'Wing',          group:'Backs',    distance:10.4, hsr:1080, collisions: 4, topSpeed:32.4, todayAU:  0, chronic:4120, acute: 820, status:'underload',
    zones:{stand:1120,walk:1960,jog:2380,run:2240,sprint:2700},contactAU: 60, nonContactAU:  0, impactBand:'low',    recovery:90 },
  { name:'Ben Taylor',    pos:'Wing',          group:'Backs',    distance:10.2, hsr:1020, collisions: 6, topSpeed:32.0, todayAU:350, chronic:4450, acute:1210, status:'optimal',
    zones:{stand:1180,walk:2080,jog:2300,run:2140,sprint:2500},contactAU:100, nonContactAU:250, impactBand:'low',    recovery:82 },
  { name:'Callum Reeves', pos:'Wing',          group:'Backs',    distance:10.0, hsr: 980, collisions: 5, topSpeed:31.6, todayAU:360, chronic:4510, acute:1240, status:'optimal',
    zones:{stand:1200,walk:2080,jog:2420,run:2080,sprint:2220},contactAU:100, nonContactAU:260, impactBand:'low',    recovery:80 },
  { name:'Luke Barnes',   pos:'Fullback',      group:'Backs',    distance:10.6, hsr:1120, collisions: 9, topSpeed:31.9, todayAU:460, chronic:5160, acute:1680, status:'overload',
    zones:{stand:1080,walk:1980,jog:2440,run:2240,sprint:2860},contactAU:160, nonContactAU:300, impactBand:'medium', recovery:54 },
]

const RG_POSITION_BENCHMARKS: Record<string, { distance:number; hsr:number; collisions:number; topSpeed:number }> = {
  Props:    { distance: 6.6, hsr: 220, collisions: 13, topSpeed:27.4 },
  Hooker:   { distance: 7.0, hsr: 280, collisions: 14, topSpeed:28.0 },
  Locks:    { distance: 8.0, hsr: 360, collisions: 10, topSpeed:28.8 },
  Flankers: { distance: 9.2, hsr: 700, collisions: 16, topSpeed:30.2 },
  'No.8':   { distance:10.0, hsr: 860, collisions: 20, topSpeed:31.6 },
  Backs:    { distance: 9.8, hsr: 880, collisions:  7, topSpeed:31.0 },
}

function GPSLoadView() {
  type GpsTab = 'session' | 'collision' | 'trends' | 'matchVtraining' | 'position' | 'connect'
  const [tab, setTab] = useState<GpsTab>('session')
  const [filterStatus, setFilterStatus] = useState<'all' | GpsLoadStatus>('all')

  const acwrOf = (p: RgPlayerLoad) => p.chronic === 0 ? 0 : (p.acute / (p.chronic / 4))

  // ── KPI strip values (rolled up from the squad) ──────────────────────
  const KPI_TEAM_LOAD     = RG_LOAD_SQUAD.reduce((s, p) => s + p.todayAU, 0)
  const KPI_TOTAL_DIST    = RG_LOAD_SQUAD.reduce((s, p) => s + p.distance, 0)
  const KPI_HSR           = RG_LOAD_SQUAD.reduce((s, p) => s + p.hsr, 0)
  const KPI_TOP_SPEED     = Math.max(...RG_LOAD_SQUAD.map(p => p.topSpeed))
  const KPI_TOP_SPEED_P   = RG_LOAD_SQUAD.find(p => p.topSpeed === KPI_TOP_SPEED)
  const KPI_COLLISIONS    = RG_LOAD_SQUAD.reduce((s, p) => s + p.collisions, 0)
  const KPI_SPRINTS       = RG_LOAD_SQUAD.reduce((s, p) => s + Math.round(p.zones.sprint / 80), 0)
  const KPI_RECOVERY      = Math.round(RG_LOAD_SQUAD.reduce((s, p) => s + p.recovery, 0) / RG_LOAD_SQUAD.length)
  const KPI_HIGH_LOAD     = RG_LOAD_SQUAD.filter(p => p.status === 'overload' || p.status === 'manage').length

  // ── Status helpers ──
  const sColor = (s: GpsLoadStatus) => s === 'optimal' ? 'text-green-400' : s === 'manage' ? 'text-amber-400' : s === 'overload' ? 'text-red-400' : 'text-blue-400'
  const sBg    = (s: GpsLoadStatus) => s === 'optimal' ? 'bg-green-600/10 border-green-600/30' : s === 'manage' ? 'bg-amber-600/10 border-amber-600/30' : s === 'overload' ? 'bg-red-600/10 border-red-600/30' : 'bg-blue-600/10 border-blue-600/30'
  const sLabel = (s: GpsLoadStatus) => s === 'optimal' ? 'Ready' : s === 'manage' ? 'Manage' : s === 'overload' ? 'Rest' : 'Build'

  // ── Collision band colour helper ──
  const colCol = (c: number) => c > 10 ? '#EF4444' : c >= 5 ? '#F59E0B' : '#22C55E'

  // Filtered squad for ACWR table.
  const filtered = filterStatus === 'all' ? RG_LOAD_SQUAD : RG_LOAD_SQUAD.filter(p => p.status === filterStatus)

  // ── 30-day rolling team load + 5-week comparison data ──
  const TEAM_30D = Array.from({ length: 30 }).map((_, i) => {
    const base = 3800 + Math.sin(i / 4) * 600 + (i / 30) * 400
    const matchSpike = (i % 7 === 5) ? 800 : 0
    const wobble = ((i * 13) % 7) * 30
    return { d: i + 1, au: Math.round(base + matchSpike + wobble) }
  })
  const WEEKLY_LOAD = [
    { week: 'W-4', planned: 4200, actual: 3980 },
    { week: 'W-3', planned: 4600, actual: 4720 },
    { week: 'W-2', planned: 4400, actual: 4380 },
    { week: 'W-1', planned: 4800, actual: 5040 },
    { week: 'Now', planned: 4600, actual: 4280 },
  ]

  // ── Match vs training comparison ──
  const RG_MATCH_VS_TRAIN = RG_LOAD_SQUAD.slice(0, 10).map(p => ({
    name: p.name.split(' ')[1] ?? p.name,
    matchDist: +(p.distance * 1.05).toFixed(1),
    trainDist: +(p.distance * 0.62 + 1.2).toFixed(1),
    matchHsr:  Math.round(p.hsr * 1.1),
    trainHsr:  Math.round(p.hsr * 0.42 + 80),
    matchCol:  p.collisions,
    trainCol:  Math.max(0, Math.round(p.collisions * 0.32)),
  }))

  // ── Section components ──

  const KpiTile = ({ label, value, sub, accent, hint }: { label:string; value:string; sub?:string; accent:string; hint?:string }) => (
    <div className="rounded-xl p-3" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-xl font-black mt-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
      {hint && <div className="text-[10px] text-gray-600 mt-0.5">{hint}</div>}
    </div>
  )

  const TabButton = ({ id, icon, label }: { id: GpsTab; icon: string; label: string }) => (
    <button onClick={() => setTab(id)}
      className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${tab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
      <span>{icon}</span>{label}
    </button>
  )

  // ── 1. Session Overview ──
  const renderSession = () => {
    const SESSION_HEADER = { date: 'Tue 8 Apr 2026', type: 'Contact', phase: 'In-Season', focus: 'Tactical · pre-Jersey Reds' }
    const zoneMax = Math.max(...RG_LOAD_SQUAD.map(p => p.zones.stand + p.zones.walk + p.zones.jog + p.zones.run + p.zones.sprint))
    const zoneCol = { stand:'#475569', walk:'#3B82F6', jog:'#22C55E', run:'#F59E0B', sprint:'#EF4444' } as const
    return (
      <div className="space-y-5">
        {/* Session header */}
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Session</div>
              <div className="text-base font-bold text-white">{SESSION_HEADER.date} · {SESSION_HEADER.focus}</div>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-red-600/15 text-red-300 border border-red-600/30">{SESSION_HEADER.type}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600/15 text-purple-300 border border-purple-600/30">{SESSION_HEADER.phase}</span>
            </div>
          </div>
        </Card>

        {/* AI summary + highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-purple-600/30">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'#a855f7' }}>🤖 AI Session Summary</div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tactical contact session with team load of <span className="text-white font-semibold">{KPI_TEAM_LOAD.toLocaleString()} AU</span>. Foster (No.8) and Barnes (FB) flagged overload — both ACWR &gt;1.4. Backs averaged
              <span className="text-white font-semibold"> {(RG_LOAD_SQUAD.filter(p => p.group === 'Backs').reduce((s, p) => s + p.distance, 0) / RG_LOAD_SQUAD.filter(p => p.group === 'Backs').length).toFixed(1)} km</span> with strong sprint output. Pack distance proportional but collision count high — Foster 22, K. Foster 18 — monitor for Friday.
            </p>
          </Card>
          <Card>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Session highlights</div>
            <div className="space-y-1 text-[11px]">
              <div><span className="text-purple-400 font-bold">Top speed</span> · {KPI_TOP_SPEED_P?.name} {KPI_TOP_SPEED} km/h</div>
              <div><span className="text-amber-400 font-bold">Top collisions</span> · D. Foster (22)</div>
              <div><span className="text-green-400 font-bold">Top HSR</span> · L. Barnes 1,120 m</div>
              <div><span className="text-red-400 font-bold">Rest today</span> · {RG_LOAD_SQUAD.filter(p => p.status === 'overload').length} players</div>
            </div>
          </Card>
        </div>

        {/* Player breakdown table */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Player Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2">Position</th>
                  <th className="text-right py-2">Distance</th>
                  <th className="text-right py-2">HSR</th>
                  <th className="text-right py-2">Collisions</th>
                  <th className="text-right py-2">Top Speed</th>
                  <th className="text-right py-2">Load</th>
                  <th className="text-right py-2">ACWR</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {RG_LOAD_SQUAD.map((p, i) => {
                  const ratio = acwrOf(p)
                  return (
                    <tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]">
                      <td className="py-2 px-2 text-white font-medium">{p.name}</td>
                      <td className="py-2 text-gray-400">{p.pos}</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.distance.toFixed(1)} km</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.hsr} m</td>
                      <td className="py-2 text-right tabular-nums font-bold" style={{ color: colCol(p.collisions) }}>{p.collisions}</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.topSpeed.toFixed(1)} km/h</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.todayAU > 0 ? `${p.todayAU} AU` : '—'}</td>
                      <td className={`py-2 text-right font-bold tabular-nums ${sColor(p.status)}`}>{ratio > 0 ? ratio.toFixed(2) : '—'}</td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sBg(p.status)} ${sColor(p.status)}`}>{sLabel(p.status)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Distance by intensity zone — horizontal stacked bar per player */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Distance by Intensity Zone</div>
          <div className="flex items-center gap-3 mb-3 text-[10px]">
            {(['stand','walk','jog','run','sprint'] as const).map(k => (
              <span key={k} className="flex items-center gap-1.5 capitalize text-gray-400">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: zoneCol[k] }} />
                {k}
              </span>
            ))}
          </div>
          <svg viewBox={`0 0 600 ${RG_LOAD_SQUAD.length * 22 + 16}`} width="100%">
            {RG_LOAD_SQUAD.map((p, i) => {
              const total = p.zones.stand + p.zones.walk + p.zones.jog + p.zones.run + p.zones.sprint
              const w = (total / zoneMax) * 460
              let off = 130
              const segs: Array<[keyof typeof zoneCol, number]> = [
                ['stand',  p.zones.stand],
                ['walk',   p.zones.walk],
                ['jog',    p.zones.jog],
                ['run',    p.zones.run],
                ['sprint', p.zones.sprint],
              ]
              const y = 12 + i * 22
              return (
                <g key={i}>
                  <text x={4} y={y + 11} fontSize="10" fill="#cbd5e1">{p.name.split(' ')[1] ?? p.name}</text>
                  <text x={120} y={y + 11} fontSize="9" fill="#475569" textAnchor="end">{p.pos.slice(0, 6)}</text>
                  {segs.map(([k, v], si) => {
                    const ww = total > 0 ? (v / total) * w : 0
                    const r = <rect key={si} x={off} y={y} width={ww} height={14} fill={zoneCol[k]} opacity="0.85" />
                    off += ww
                    return r
                  })}
                  <text x={off + 4} y={y + 11} fontSize="9" fill="#94a3b8" className="tabular-nums">{(total / 1000).toFixed(2)} km</text>
                </g>
              )
            })}
          </svg>
        </Card>
      </div>
    )
  }

  // ── 2. Collision & Contact Load ──
  const renderCollision = () => {
    const groups = ['Props','Hooker','Locks','Flankers','No.8','Backs'] as const
    const groupCollisions = groups.map(g => {
      const players = RG_LOAD_SQUAD.filter(p => p.group === g)
      return { group: g, total: players.reduce((s, p) => s + p.collisions, 0), avg: players.length === 0 ? 0 : players.reduce((s, p) => s + p.collisions, 0) / players.length }
    })
    const maxGroup = Math.max(...groupCollisions.map(g => g.total))

    // 4-week sparkline data per player.
    const sparkline = (seed: number) => Array.from({ length: 28 }).map((_, i) => Math.round(8 + Math.sin((i + seed) / 3) * 4 + ((i * seed) % 3)))

    return (
      <div className="space-y-5">
        {/* Group collision bars */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Collision Count by Position Group</div>
          <svg viewBox="0 0 620 200" width="100%">
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={48} x2={600} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
            {groupCollisions.map((g, i) => {
              const x = 80 + i * 90
              const h = (g.total / maxGroup) * 140
              return (
                <g key={g.group}>
                  <rect x={x} y={160 - h} width="64" height={h} fill="#8B5CF6" opacity="0.35" rx="2" />
                  <rect x={x} y={160 - h} width="64" height={h} fill="url(#gpsBarGrad)" />
                  <text x={x + 32} y={160 - h - 6} fontSize="11" fill="#a855f7" textAnchor="middle" fontWeight="700">{g.total}</text>
                  <text x={x + 32} y={178} fontSize="10" fill="#94a3b8" textAnchor="middle">{g.group}</text>
                  <text x={x + 32} y={192} fontSize="9" fill="#475569" textAnchor="middle">avg {g.avg.toFixed(1)}</text>
                </g>
              )
            })}
            <defs>
              <linearGradient id="gpsBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#a855f7" stopOpacity="1" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </Card>

        {/* Individual collision load table + sparklines */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Individual Collision Load · 4-week trend</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2">Position</th>
                  <th className="text-right py-2">Today</th>
                  <th className="text-center py-2">Impact band</th>
                  <th className="text-right py-2">Contact AU</th>
                  <th className="text-center py-2">28-day trend</th>
                  <th className="text-right py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {RG_LOAD_SQUAD.map((p, i) => {
                  const benchmark = RG_POSITION_BENCHMARKS[p.group].collisions
                  const flag = p.collisions > benchmark * 1.15
                  const seed = (p.name.charCodeAt(0) + i)
                  const data = sparkline(seed)
                  const max = Math.max(...data)
                  const path = data.map((v, j) => `${j === 0 ? 'M' : 'L'} ${j * (110 / (data.length - 1))} ${22 - (v / max) * 18}`).join(' ')
                  const bandCol = p.impactBand === 'high' ? '#EF4444' : p.impactBand === 'medium' ? '#F59E0B' : '#22C55E'
                  return (
                    <tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]">
                      <td className="py-2 px-2 text-white font-medium">{p.name}</td>
                      <td className="py-2 text-gray-400">{p.pos}</td>
                      <td className="py-2 text-right tabular-nums font-bold" style={{ color: colCol(p.collisions) }}>{p.collisions}</td>
                      <td className="py-2 text-center"><span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background:`${bandCol}22`, color: bandCol, border:`1px solid ${bandCol}44` }}>{p.impactBand}</span></td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.contactAU} AU</td>
                      <td className="py-2 text-center">
                        <svg viewBox="0 0 110 24" width="110" height="24">
                          <path d={path} fill="none" stroke={bandCol} strokeWidth="1.5" strokeLinecap="round" />
                          {data.map((v, j) => <circle key={j} cx={j * (110 / (data.length - 1))} cy={22 - (v / max) * 18} r={j === data.length - 1 ? 1.6 : 0.8} fill={bandCol} />)}
                        </svg>
                      </td>
                      <td className="py-2 text-right">{flag ? <span className="text-red-400 font-bold">⚠ over</span> : <span className="text-gray-600">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-gray-600 mt-2">⚠ over = collisions exceed position benchmark by 15%+.</div>
        </Card>

        {/* Contact vs non-contact ratio */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Contact vs Non-Contact Load Ratio</div>
          <div className="space-y-2">
            {RG_LOAD_SQUAD.map(p => {
              const total = p.contactAU + p.nonContactAU
              const cPct = total === 0 ? 0 : (p.contactAU / total) * 100
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-300 truncate" style={{ width:130 }}>{p.name}</span>
                  <div className="flex-1 h-3 rounded-md overflow-hidden flex bg-gray-800">
                    <div style={{ width:`${cPct}%`, background:'#EF4444' }} />
                    <div style={{ width:`${100 - cPct}%`, background:'#3B82F6' }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-gray-400" style={{ width:120 }}>
                    <span className="text-red-400">{p.contactAU}</span> · <span className="text-blue-400">{p.nonContactAU}</span> AU
                  </span>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] text-gray-600 mt-3 flex gap-4">
            <span><span className="inline-block w-3 h-3 bg-red-500 rounded-sm align-middle mr-1.5" /> Contact</span>
            <span><span className="inline-block w-3 h-3 bg-blue-500 rounded-sm align-middle mr-1.5" /> Non-contact</span>
          </div>
        </Card>
      </div>
    )
  }

  // ── 3. Load Trends & ACWR ──
  const renderTrends = () => {
    const max30 = Math.max(...TEAM_30D.map(d => d.au))
    const path30 = TEAM_30D.map((d, i) => `${i === 0 ? 'M' : 'L'} ${20 + (i / (TEAM_30D.length - 1)) * 580} ${20 + 140 - (d.au / max30) * 140}`).join(' ')

    const maxLoad = 5500, W = 560, H = 160, padL = 36, padR = 12, padT = 16, padB = 32
    const innerW = W - padL - padR, innerH = H - padT - padB
    const stepX = innerW / (WEEKLY_LOAD.length - 1)

    return (
      <div className="space-y-5">
        {/* 30-day team load rolling chart */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">30-Day Team Load (AU/day)</div>
          <svg viewBox="0 0 620 180" width="100%">
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={20} x2={600} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
            {[0, 1500, 3000, 4500].map((v, i) => <text key={i} x={16} y={20 + (1 - v / max30) * 140 + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
            <defs>
              <linearGradient id="loadArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"  stopColor="#0D9488" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path30} L 600 160 L 20 160 Z`} fill="url(#loadArea)" />
            <path d={path30} fill="none" stroke="#0D9488" strokeWidth="2" />
            {TEAM_30D.filter((_, i) => i % 5 === 0).map((d) => (
              <text key={d.d} x={20 + ((d.d - 1) / (TEAM_30D.length - 1)) * 580} y={175} fontSize="9" fill="#475569" textAnchor="middle">D{d.d}</text>
            ))}
          </svg>
        </Card>

        {/* Full squad ACWR table */}
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-sm font-semibold text-white">Full Squad ACWR — {filtered.length} players{filterStatus !== 'all' ? ` (${filterStatus})` : ''}</div>
            <div className="flex gap-1">
              {(['all', 'optimal', 'manage', 'overload', 'underload'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2">Pos</th>
                  <th className="text-right py-2">Chronic</th>
                  <th className="text-right py-2">Acute</th>
                  <th className="text-right py-2">ACWR</th>
                  <th className="text-center py-2">Trend</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const ratio = acwrOf(p)
                  const trend = p.status === 'overload' ? '↑' : p.status === 'underload' ? '↓' : p.acute > p.chronic / 4 ? '↑' : '↓'
                  const tCol = trend === '↑' && (p.status === 'overload' || p.status === 'manage') ? '#EF4444' : trend === '↓' ? '#3B82F6' : '#22C55E'
                  return (
                    <tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]">
                      <td className="py-2 px-2 text-white font-medium">{p.name}</td>
                      <td className="py-2 text-gray-400">{p.pos}</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.chronic.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-200 tabular-nums">{p.acute.toLocaleString()}</td>
                      <td className={`py-2 text-right font-bold tabular-nums ${sColor(p.status)}`}>{ratio.toFixed(2)}</td>
                      <td className="py-2 text-center font-bold" style={{ color: tCol }}>{trend}</td>
                      <td className="py-2 text-center"><span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sBg(p.status)} ${sColor(p.status)}`}>{sLabel(p.status)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Injury risk matrix 2x2 */}
        <Card>
          <div className="text-sm font-semibold text-white mb-1">Injury Risk Matrix</div>
          <p className="text-[11px] text-gray-500 mb-3">ACWR (x-axis) × Collision load (y-axis). Top-right quadrant = highest risk.</p>
          <svg viewBox="0 0 600 380" width="100%">
            {/* Quadrants */}
            <rect x={40}   y={20}  width={260} height={160} fill="#F59E0B" fillOpacity="0.06" />
            <rect x={300}  y={20}  width={260} height={160} fill="#EF4444" fillOpacity="0.10" />
            <rect x={40}   y={180} width={260} height={160} fill="#22C55E" fillOpacity="0.06" />
            <rect x={300}  y={180} width={260} height={160} fill="#F59E0B" fillOpacity="0.06" />
            {/* Axes */}
            <line x1={40} y1={340} x2={560} y2={340} stroke="rgba(255,255,255,0.18)" />
            <line x1={40} y1={20}  x2={40}  y2={340} stroke="rgba(255,255,255,0.18)" />
            <line x1={300} y1={20} x2={300} y2={340} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <line x1={40} y1={180} x2={560} y2={180} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            {/* Axis labels */}
            <text x={300} y={372} fontSize="10" fill="#94a3b8" textAnchor="middle">ACWR →</text>
            <text x={290} y={358} fontSize="9"  fill="#475569" textAnchor="middle">1.3 (manage)</text>
            <text x={50}  y={358} fontSize="9"  fill="#475569" textAnchor="start">0.8</text>
            <text x={550} y={358} fontSize="9"  fill="#475569" textAnchor="end">2.0</text>
            <text x={20} y={180} fontSize="10" fill="#94a3b8" transform="rotate(-90 20 180)" textAnchor="middle">Collisions →</text>
            <text x={26} y={184} fontSize="9"  fill="#475569" textAnchor="middle">10</text>
            {/* Quadrant labels */}
            <text x={170} y={36}  fontSize="10" fill="#F59E0B" textAnchor="middle">High contact / safe ACWR</text>
            <text x={430} y={36}  fontSize="10" fill="#EF4444" textAnchor="middle" fontWeight="700">High risk</text>
            <text x={170} y={356} fontSize="10" fill="#22C55E" textAnchor="middle">Safe</text>
            <text x={430} y={356} fontSize="10" fill="#F59E0B" textAnchor="middle">High ACWR / low contact</text>
            {/* Players */}
            {RG_LOAD_SQUAD.map((p, i) => {
              const ratio = acwrOf(p)
              const x = 40 + Math.max(0, Math.min(1, (ratio - 0.5) / 1.5)) * 520
              const y = 340 - Math.max(0, Math.min(1, p.collisions / 24)) * 320
              const fill = p.status === 'overload' ? '#EF4444' : p.status === 'manage' ? '#F59E0B' : p.status === 'underload' ? '#3B82F6' : '#22C55E'
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5" fill={fill} stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />
                  <text x={x + 7} y={y + 3} fontSize="8.5" fill="#cbd5e1">{p.name.split(' ')[1] ?? p.name}</text>
                </g>
              )
            })}
          </svg>
        </Card>

        {/* Week-on-week grouped bar */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Week-on-Week Load · Planned vs Actual</div>
          <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%">
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" />)}
            {[0, 1500, 3000, 4500].map((v, i) => <text key={i} x={padL - 4} y={padT + innerH - (v / maxLoad) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
            {WEEKLY_LOAD.map((d, i) => {
              const cx = padL + i * stepX
              const ph = (d.planned / maxLoad) * innerH
              const ah = (d.actual / maxLoad) * innerH
              return (
                <g key={i}>
                  <rect x={cx - 24} y={padT + innerH - ph} width={20} height={ph} fill="#8B5CF6" opacity="0.7" rx="2" />
                  <rect x={cx + 4}  y={padT + innerH - ah} width={20} height={ah} fill="#0D9488" opacity="0.85" rx="2" />
                  <text x={cx} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{d.week}</text>
                  <text x={cx - 14} y={padT + innerH - ph - 4} fontSize="8" fill="#a855f7" textAnchor="middle">{d.planned}</text>
                  <text x={cx + 14} y={padT + innerH - ah - 4} fontSize="8" fill="#0D9488" textAnchor="middle">{d.actual}</text>
                </g>
              )
            })}
          </svg>
          <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
            <span><span className="inline-block w-3 h-3 bg-purple-500 rounded-sm align-middle mr-1.5" /> Planned</span>
            <span><span className="inline-block w-3 h-3 bg-teal-500 rounded-sm align-middle mr-1.5" /> Actual</span>
          </div>
        </Card>
      </div>
    )
  }

  // ── 4. Match vs Training ──
  const renderMatchVsTraining = () => {
    const max = Math.max(...RG_MATCH_VS_TRAIN.flatMap(r => [r.matchDist, r.trainDist])) * 1.05
    const w = 600, h = 24 * RG_MATCH_VS_TRAIN.length + 30
    return (
      <div className="space-y-5">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Match vs Training · Distance (km)</div>
          <svg viewBox={`0 0 ${w} ${h}`} width="100%">
            {RG_MATCH_VS_TRAIN.map((r, i) => {
              const y = 14 + i * 24
              const wM = (r.matchDist / max) * 440
              const wT = (r.trainDist / max) * 440
              return (
                <g key={i}>
                  <text x={4} y={y + 7} fontSize="10" fill="#cbd5e1">{r.name}</text>
                  <rect x={130} y={y - 5} width={wM} height={9} fill="#8B5CF6" opacity="0.85" rx="1.5" />
                  <text x={130 + wM + 4} y={y + 3} fontSize="8" fill="#a855f7" className="tabular-nums">{r.matchDist}</text>
                  <rect x={130} y={y + 5} width={wT} height={9} fill="#0D9488" opacity="0.85" rx="1.5" />
                  <text x={130 + wT + 4} y={y + 13} fontSize="8" fill="#0D9488" className="tabular-nums">{r.trainDist}</text>
                </g>
              )
            })}
          </svg>
          <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
            <span><span className="inline-block w-3 h-3 bg-purple-500 rounded-sm align-middle mr-1.5" /> Match day</span>
            <span><span className="inline-block w-3 h-3 bg-teal-500 rounded-sm align-middle mr-1.5" /> Training</span>
          </div>
        </Card>

        {/* Collision count vs contact drill count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Collisions · Match vs Training drills</div>
            <svg viewBox="0 0 320 280" width="100%">
              {RG_MATCH_VS_TRAIN.map((r, i) => {
                const y = 18 + i * 26
                const wM = (r.matchCol / 25) * 200
                const wT = (r.trainCol / 25) * 200
                return (
                  <g key={i}>
                    <text x={4} y={y + 6} fontSize="9.5" fill="#cbd5e1">{r.name}</text>
                    <rect x={104} y={y - 4} width={wM} height={7} fill="#EF4444" opacity="0.85" rx="1.5" />
                    <text x={104 + wM + 4} y={y + 2} fontSize="8" fill="#EF4444">{r.matchCol}</text>
                    <rect x={104} y={y + 5} width={wT} height={7} fill="#F59E0B" opacity="0.85" rx="1.5" />
                    <text x={104 + wT + 4} y={y + 11} fontSize="8" fill="#F59E0B">{r.trainCol}</text>
                  </g>
                )
              })}
            </svg>
            <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
              <span><span className="inline-block w-3 h-3 bg-red-500 rounded-sm align-middle mr-1.5" /> Match</span>
              <span><span className="inline-block w-3 h-3 bg-amber-500 rounded-sm align-middle mr-1.5" /> Training drills</span>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold text-white mb-3">High-Speed Running · Match vs Training</div>
            <svg viewBox="0 0 320 280" width="100%">
              {RG_MATCH_VS_TRAIN.map((r, i) => {
                const y = 18 + i * 26
                const max = 1300
                const wM = (r.matchHsr / max) * 200
                const wT = (r.trainHsr / max) * 200
                return (
                  <g key={i}>
                    <text x={4} y={y + 6} fontSize="9.5" fill="#cbd5e1">{r.name}</text>
                    <rect x={104} y={y - 4} width={wM} height={7} fill="#8B5CF6" opacity="0.85" rx="1.5" />
                    <text x={104 + wM + 4} y={y + 2} fontSize="8" fill="#a855f7">{r.matchHsr}</text>
                    <rect x={104} y={y + 5} width={wT} height={7} fill="#0D9488" opacity="0.85" rx="1.5" />
                    <text x={104 + wT + 4} y={y + 11} fontSize="8" fill="#0D9488">{r.trainHsr}</text>
                  </g>
                )
              })}
            </svg>
            <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
              <span><span className="inline-block w-3 h-3 bg-purple-500 rounded-sm align-middle mr-1.5" /> Match (m)</span>
              <span><span className="inline-block w-3 h-3 bg-teal-500 rounded-sm align-middle mr-1.5" /> Training (m)</span>
            </div>
          </Card>
        </div>

        {/* Fitness deficit indicator */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Fitness Deficit Indicator</div>
          <p className="text-[11px] text-gray-500 mb-3">Players whose training output significantly lags match demands — flagged for top-up sessions.</p>
          <div className="space-y-2">
            {RG_MATCH_VS_TRAIN.map(r => {
              const ratio = r.matchHsr === 0 ? 0 : r.trainHsr / r.matchHsr
              const deficit = ratio < 0.45
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-300" style={{ width:130 }}>{r.name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full rounded-full" style={{ width:`${ratio * 100}%`, background: deficit ? '#EF4444' : '#22C55E' }} />
                  </div>
                  <span className="text-[11px] tabular-nums" style={{ width:120, color: deficit ? '#EF4444' : '#94a3b8' }}>
                    {Math.round(ratio * 100)}% of match {deficit && '⚠'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    )
  }

  // ── 5. Position Group Analysis ──
  const renderPosition = () => {
    const groups = ['Props','Hooker','Locks','Flankers','No.8','Backs'] as const
    const groupSummary = groups.map(g => {
      const players = RG_LOAD_SQUAD.filter(p => p.group === g)
      const n = players.length
      if (n === 0) return { group: g, distance:0, hsr:0, collisions:0, topSpeed:0, n:0 }
      return {
        group: g,
        distance:   players.reduce((s, p) => s + p.distance,  0) / n,
        hsr:        players.reduce((s, p) => s + p.hsr,       0) / n,
        collisions: players.reduce((s, p) => s + p.collisions,0) / n,
        topSpeed:   Math.max(...players.map(p => p.topSpeed)),
        n,
      }
    })

    // Forwards vs Backs
    const forwards = RG_LOAD_SQUAD.filter(p => p.group !== 'Backs')
    const backs    = RG_LOAD_SQUAD.filter(p => p.group === 'Backs')
    const fbCmp = [
      { k: 'Distance (km)',   f: forwards.reduce((s,p) => s + p.distance, 0) / forwards.length,   b: backs.reduce((s,p) => s + p.distance, 0) / backs.length,   max: 12 },
      { k: 'HSR (m)',         f: forwards.reduce((s,p) => s + p.hsr, 0) / forwards.length,        b: backs.reduce((s,p) => s + p.hsr, 0) / backs.length,        max: 1200 },
      { k: 'Collisions',      f: forwards.reduce((s,p) => s + p.collisions, 0) / forwards.length, b: backs.reduce((s,p) => s + p.collisions, 0) / backs.length, max: 22 },
      { k: 'Top speed (km/h)',f: Math.max(...forwards.map(p => p.topSpeed)), b: Math.max(...backs.map(p => p.topSpeed)), max: 33 },
    ]

    // Pie data — share of total squad load by group.
    const pieTotal = groupSummary.reduce((s, g) => s + g.distance * g.n, 0)
    let pieAcc = 0
    const pieColors = ['#EF4444','#F59E0B','#22C55E','#0D9488','#3B82F6','#8B5CF6']
    const pieSlices = groupSummary.map((g, i) => {
      const frac = pieTotal === 0 ? 0 : (g.distance * g.n) / pieTotal
      const start = pieAcc
      const end = pieAcc + frac
      pieAcc = end
      const a0 = (start * 360 - 90) * Math.PI / 180
      const a1 = (end   * 360 - 90) * Math.PI / 180
      const x0 = 100 + 80 * Math.cos(a0), y0 = 100 + 80 * Math.sin(a0)
      const x1 = 100 + 80 * Math.cos(a1), y1 = 100 + 80 * Math.sin(a1)
      const large = frac > 0.5 ? 1 : 0
      const path = `M 100 100 L ${x0} ${y0} A 80 80 0 ${large} 1 ${x1} ${y1} Z`
      return { path, color: pieColors[i % pieColors.length], group: g.group, pct: Math.round(frac * 100) }
    })

    return (
      <div className="space-y-5">
        {/* Forwards vs Backs */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Forwards vs Backs · GPS comparison</div>
          {fbCmp.map(r => {
            const fw = (r.f / r.max) * 100
            const bw = (r.b / r.max) * 100
            return (
              <div key={r.k} className="mb-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-300">{r.k}</span>
                  <span className="tabular-nums">
                    <span className="text-amber-400">{r.f.toFixed(1)}</span>
                    <span className="text-gray-600 mx-1">vs</span>
                    <span className="text-teal-400">{r.b.toFixed(1)}</span>
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                  <div style={{ width:`${fw}%`, background:'#F59E0B' }} />
                  <div style={{ width:`${100 - fw}%`, background:'transparent' }} />
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-800 mt-1">
                  <div style={{ width:`${bw}%`, background:'#0D9488' }} />
                </div>
              </div>
            )
          })}
          <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
            <span><span className="inline-block w-3 h-3 bg-amber-500 rounded-sm align-middle mr-1.5" /> Forwards (1–8)</span>
            <span><span className="inline-block w-3 h-3 bg-teal-500 rounded-sm align-middle mr-1.5" /> Backs (9–15)</span>
          </div>
        </Card>

        {/* Group KPI table */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">By Position Group</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-2">Group</th>
                  <th className="text-right py-2">Players</th>
                  <th className="text-right py-2">Avg distance</th>
                  <th className="text-right py-2">Avg HSR</th>
                  <th className="text-right py-2">Avg collisions</th>
                  <th className="text-right py-2">Max top speed</th>
                </tr>
              </thead>
              <tbody>
                {groupSummary.map(g => (
                  <tr key={g.group} className="border-b border-gray-800/40">
                    <td className="py-2 px-2 text-white font-medium">{g.group}</td>
                    <td className="py-2 text-right text-gray-300 tabular-nums">{g.n}</td>
                    <td className="py-2 text-right text-gray-200 tabular-nums">{g.distance.toFixed(1)} km</td>
                    <td className="py-2 text-right text-gray-200 tabular-nums">{Math.round(g.hsr)} m</td>
                    <td className="py-2 text-right tabular-nums" style={{ color: colCol(Math.round(g.collisions)) }}>{g.collisions.toFixed(1)}</td>
                    <td className="py-2 text-right text-gray-200 tabular-nums">{g.topSpeed.toFixed(1)} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Position benchmark comparison */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Player vs Position Benchmark · Distance</div>
          <div className="space-y-2">
            {RG_LOAD_SQUAD.map(p => {
              const benchmark = RG_POSITION_BENCHMARKS[p.group].distance
              const delta = p.distance - benchmark
              const pct = benchmark === 0 ? 0 : (delta / benchmark) * 100
              const ahead = delta > 0
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-300" style={{ width:130 }}>{p.name}</span>
                  <span className="text-[10px] text-gray-500" style={{ width:90 }}>{p.group} · {benchmark.toFixed(1)}km</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-800 relative">
                    <div className="absolute inset-y-0" style={{ left:'50%', width:1, background:'rgba(255,255,255,0.2)' }} />
                    <div className="h-full" style={{
                      width: `${Math.min(50, Math.abs(pct))}%`,
                      marginLeft: ahead ? '50%' : `${50 - Math.min(50, Math.abs(pct))}%`,
                      background: ahead ? '#22C55E' : '#EF4444',
                    }} />
                  </div>
                  <span className="text-[11px] tabular-nums" style={{ width:80, color: ahead ? '#22C55E' : '#EF4444' }}>
                    {ahead ? '+' : ''}{pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Pie chart by position group */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Load Distribution by Position Group</div>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
            <svg viewBox="0 0 200 200" width="100%" style={{ maxWidth: 200 }}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              {pieSlices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" stroke="#0a0c14" strokeWidth="1" />)}
              <circle cx="100" cy="100" r="36" fill="#0a0c14" stroke="rgba(255,255,255,0.08)" />
              <text x="100" y="98" fontSize="11" fill="#94a3b8" textAnchor="middle">Total dist</text>
              <text x="100" y="112" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700" className="tabular-nums">{KPI_TOTAL_DIST.toFixed(1)} km</text>
            </svg>
            <div className="grid grid-cols-2 gap-2">
              {pieSlices.map(s => (
                <div key={s.group} className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-gray-300">{s.group}</span>
                  <span className="ml-auto text-gray-500 tabular-nums">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ── 6. Connect GPS ──
  const renderConnect = () => {
    const integrations = [
      { name: 'Lumio GPS Pro',     status: 'connected' as const, sub: 'Last session: Tue 8 Apr · 29 vests active' },
      { name: 'Lumio Health',      status: 'connected' as const, sub: 'Player readiness · 20/38 logged today 07:24' },
      { name: 'Johan Sports',      status: 'available' as const, sub: 'OAuth · 10Hz GPS + IMU · live session sync' },
      { name: 'CSV Upload',        status: 'available' as const, sub: 'Generic GPS export · any vendor · drag and drop' },
      { name: 'Polar Team Pro',    status: 'available' as const, sub: 'Heart rate + GPS combined · Bluetooth sync' },
      { name: 'FrameSports tags',  status: 'connected' as const, sub: 'Auto-tag tackles, rucks, set-pieces · 2h post-match' },
    ]
    return (
      <div className="space-y-5">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">GPS &amp; Telemetry Integrations</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map(it => (
              <div key={it.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-[#0a0c14]">
                <div>
                  <div className="text-sm font-semibold text-white">{it.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{it.sub}</div>
                </div>
                {it.status === 'connected'
                  ? <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-green-600/15 text-green-400 border border-green-600/30">● Connected</span>
                  : <button className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white">Connect</button>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-white mb-2">Sync Status</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-lg border border-gray-800 bg-[#0a0c14]">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Vests active</div>
              <div className="text-xl font-black text-green-400">29 / 38</div>
              <div className="text-gray-500">Last sync: 09:14 today</div>
            </div>
            <div className="p-3 rounded-lg border border-gray-800 bg-[#0a0c14]">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Battery health</div>
              <div className="text-xl font-black text-amber-400">3 vests &lt; 20%</div>
              <div className="text-gray-500">Charging dock: 4 free slots</div>
            </div>
            <div className="p-3 rounded-lg border border-gray-800 bg-[#0a0c14]">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Data backlog</div>
              <div className="text-xl font-black text-purple-400">0 MB</div>
              <div className="text-gray-500">All sessions ingested</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-white mb-2">Calibration &amp; Maintenance</div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-gray-800/50">
              <span className="text-gray-300">Vest firmware version</span><span className="text-white tabular-nums">3.4.1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800/50">
              <span className="text-gray-300">Last calibration</span><span className="text-white">Mon 7 Apr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800/50">
              <span className="text-gray-300">Next scheduled</span><span className="text-white">Mon 14 Apr</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-300">Field surveys</span><span className="text-white">The Grange · 3D mapped 2025-09</span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📡" title="GPS & Load — Squad Dashboard" subtitle="Session telemetry, collision load, ACWR trends, match-vs-training comparison and position-group analysis." />

      {/* Top KPI strip — 8 tiles in 2 rows of 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Team Load"           value={`${KPI_TEAM_LOAD.toLocaleString()} AU`}  sub="All players · today"            accent="#a855f7" />
        <KpiTile label="Total Distance"      value={`${KPI_TOTAL_DIST.toFixed(1)} km`}        sub="Squad cumulative"               accent="#0ea5e9" />
        <KpiTile label="High Speed Running"  value={`${KPI_HSR.toLocaleString()} m`}          sub=">5.5 m/s · session"             accent="#22c55e" />
        <KpiTile label="Top Speed"           value={`${KPI_TOP_SPEED} km/h`}                  sub={KPI_TOP_SPEED_P?.name ?? '—'}    accent="#facc15" />
        <KpiTile label="Collision Count"     value={`${KPI_COLLISIONS}`}                       sub={`${RG_LOAD_SQUAD.filter(p=>p.collisions>10).length} players >10`} accent="#ef4444" />
        <KpiTile label="Sprint Efforts"      value={`${KPI_SPRINTS}`}                          sub="Squad cumulative"               accent="#f59e0b" />
        <KpiTile label="Recovery Score"      value={`${KPI_RECOVERY}/100`}                     sub={KPI_RECOVERY >= 75 ? 'Squad fresh' : 'Some fatigue'} accent={KPI_RECOVERY >= 75 ? '#22c55e' : '#f59e0b'} />
        <KpiTile label="High Load Players"   value={`${KPI_HIGH_LOAD}`}                        sub="Manage or rest"                 accent="#ef4444" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        <TabButton id="session"        icon="📋" label="Session Overview" />
        <TabButton id="collision"      icon="💥" label="Collision & Contact Load" />
        <TabButton id="trends"         icon="📈" label="Load Trends & ACWR" />
        <TabButton id="matchVtraining" icon="🏟️" label="Match vs Training" />
        <TabButton id="position"       icon="👥" label="Position Group Analysis" />
        <TabButton id="connect"        icon="🔌" label="Connect GPS" />
      </div>

      {tab === 'session'        && renderSession()}
      {tab === 'collision'      && renderCollision()}
      {tab === 'trends'         && renderTrends()}
      {tab === 'matchVtraining' && renderMatchVsTraining()}
      {tab === 'position'       && renderPosition()}
      {tab === 'connect'        && renderConnect()}
    </div>
  )
}

// ─── GPS HEATMAPS VIEW (multi-section) ───────────────────────────────────────
// Hero: Pitch position. Plus tackle/contact, ruck/breakdown, set-piece,
// squad GPS load grid, training movement. Folded in the original Player
// Heatmap view — its pitch geometry + HEATMAP_ZONES live as Section 1.
// ─────────────────────────────────────────────────────────────────────────────

// Green → amber → red HSL heat scale.
function rgHeat(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  const sat = 65 + c * 15
  const lig = 48 - c * 4
  return `hsl(${hue}, ${sat}%, ${lig}%)`
}
function rgGlow(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  return `hsla(${hue}, 80%, 55%, ${0.2 + c * 0.5})`
}

// Pitch SVG factory. Used by sections 1, 2, 3, 4, 6.
function rgPitch({ id }: { id: string }) {
  const PW = 600, PH = 400
  return { PW, PH, defs: (
    <defs>
      <radialGradient id={`rg-grass-${id}`} cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#0e1f0e" />
        <stop offset="100%" stopColor="#06120a" />
      </radialGradient>
      <pattern id={`rg-stripes-${id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="rgba(255,255,255,0.012)" />
        <rect width="60" height="30" fill="rgba(255,255,255,0.025)" />
      </pattern>
      <filter id={`rg-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  ), markings: (
    <g>
      <rect width={PW} height={PH} fill={`url(#rg-grass-${id})`} rx="4" />
      <rect width={PW} height={PH} fill={`url(#rg-stripes-${id})`} rx="4" />
      <rect x={0} y={0} width={PW} height={PH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      {/* Halfway */}
      <line x1={0} y1={PH/2} x2={PW} y2={PH/2} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* Centre circle */}
      <circle cx={PW/2} cy={PH/2} r={PH*0.12} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <circle cx={PW/2} cy={PH/2} r="3" fill="rgba(255,255,255,0.18)" />
      {/* 22m lines */}
      <line x1={0} y1={PH*0.22} x2={PW} y2={PH*0.22} stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="6 4" />
      <line x1={0} y1={PH*0.78} x2={PW} y2={PH*0.78} stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="6 4" />
      {/* 10m lines (dashed shorter) */}
      <line x1={0} y1={PH*0.40} x2={PW} y2={PH*0.40} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="3 6" />
      <line x1={0} y1={PH*0.60} x2={PW} y2={PH*0.60} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="3 6" />
      {/* 5m lines */}
      <line x1={0} y1={PH*0.05} x2={PW} y2={PH*0.05} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="1 4" />
      <line x1={0} y1={PH*0.95} x2={PW} y2={PH*0.95} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="1 4" />
      {/* Try lines */}
      <line x1={0} y1={PH*0.04} x2={PW} y2={PH*0.04} stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      <line x1={0} y1={PH*0.96} x2={PW} y2={PH*0.96} stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      {/* Goalposts (simplified) */}
      <rect x={PW*0.46} y={0} width={PW*0.08} height={PH*0.04} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <rect x={PW*0.46} y={PH*0.96} width={PW*0.08} height={PH*0.04} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      {/* Zone labels */}
      <text x="8" y="14" fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">OWN TRY</text>
      <text x="8" y={PH*0.22 - 4} fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">OWN 22</text>
      <text x="8" y={PH/2 - 4} fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">HALFWAY</text>
      <text x="8" y={PH*0.78 - 4} fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">OPP 22</text>
      <text x="8" y={PH - 8} fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">OPP TRY</text>
    </g>
  )}
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const RG_PLAYERS = [
  // Forwards 1–8
  { id:'all',       name:'All squad',     group:'all',     posNum: 0  },
  { id:'forwards',  name:'Forwards',      group:'forwards',posNum: 0  },
  { id:'backs',     name:'Backs',         group:'backs',   posNum: 0  },
  { id:'tom-h',     name:'Tom Harrison',  group:'forwards',posNum: 1, pos:'Loosehead'   },
  { id:'marcus',    name:'Marcus Webb',   group:'forwards',posNum: 4, pos:'Lock'         },
  { id:'karl',      name:'Karl Foster',   group:'forwards',posNum: 7, pos:'Flanker'      },
  { id:'danny-fos', name:'Danny Foster',  group:'forwards',posNum: 8, pos:'No.8'         },
  { id:'sam',       name:'Sam Ellis',     group:'backs',   posNum: 9, pos:'Scrum Half'   },
  { id:'cole',      name:'Danny Cole',    group:'backs',   posNum:10, pos:'Fly Half'     },
  { id:'matt',      name:'Matt Jones',    group:'backs',   posNum:12, pos:'Inside Centre' },
  { id:'obi',       name:'David Obi',     group:'backs',   posNum:13, pos:'Outside Centre' },
  { id:'luke',      name:'Luke Barnes',   group:'backs',   posNum:15, pos:'Fullback'     },
] as const
type RgPlayerId = typeof RG_PLAYERS[number]['id']

const RG_SESSIONS = [
  { id:'m1', label:'Match · vs Jersey Reds (11 Apr)', kind:'match' },
  { id:'m2', label:'Match · vs Bath RFC (5 Apr)',     kind:'match' },
  { id:'m3', label:'Match · vs Saracens (29 Mar)',    kind:'match' },
  { id:'t1', label:'Training · Tue 8 Apr (Tactical)', kind:'training' },
  { id:'t2', label:'Training · Mon 7 Apr (S&C)',      kind:'training' },
] as const

// Per-player (or grouping) heat blobs on the pitch [x%, y%, intensity 0–1].
const RG_HEAT: Record<string, Array<[number, number, number]>> = {
  all: [
    [15,20,0.9],[20,35,0.8],[18,50,0.7],[22,65,0.6],[25,80,0.5],
    [50,20,0.6],[50,40,0.95],[50,60,0.85],[50,75,0.6],[50,90,0.4],
    [80,25,0.7],[75,45,0.8],[78,60,0.7],[82,75,0.5],[85,85,0.4],
    [35,30,0.8],[40,50,0.95],[38,70,0.7],[45,85,0.5],
    [60,35,0.7],[65,55,0.85],[62,70,0.6],[70,80,0.4],
    [30,15,0.5],[70,15,0.5],[50,10,0.6],[50,95,0.3],
  ],
  forwards: [
    [40,30,0.85],[50,40,1.0],[60,35,0.78],[42,52,0.92],[58,52,0.85],
    [48,18,0.62],[52,22,0.55],[40,68,0.68],[60,65,0.62],
    [30,42,0.55],[70,46,0.55],[50,12,0.42],[50,82,0.32],
  ],
  backs: [
    [20,80,0.78],[80,80,0.75],[50,85,0.92],[35,75,0.65],[65,72,0.62],
    [25,55,0.72],[75,55,0.7],[50,55,0.85],[40,42,0.55],[60,42,0.55],
    [50,90,0.45],[15,40,0.5],[85,40,0.5],
  ],
  'tom-h': [
    [30,20,0.95],[28,35,0.85],[32,45,0.72],[25,55,0.62],[30,65,0.5],
    [35,30,0.82],[40,40,0.75],[38,50,0.62],[35,60,0.5],
    [20,25,0.6],[22,40,0.7],[18,55,0.5],
  ],
  marcus: [
    [40,32,0.85],[48,45,0.95],[52,48,0.92],[58,40,0.78],[45,55,0.72],
    [42,18,0.55],[55,22,0.5],[38,62,0.55],[60,58,0.52],
  ],
  karl: [
    [40,45,0.9],[45,55,0.85],[50,50,0.95],[55,45,0.85],[50,40,0.72],
    [35,40,0.72],[60,40,0.72],[45,35,0.62],[55,35,0.62],
    [40,60,0.62],[60,60,0.55],[50,65,0.45],
  ],
  'danny-fos': [
    [45,55,0.92],[55,52,0.95],[50,62,0.88],[42,68,0.78],[58,68,0.75],
    [38,42,0.62],[60,42,0.62],[48,80,0.62],[52,80,0.6],
  ],
  sam: [
    [48,30,0.72],[50,35,0.95],[52,30,0.72],[50,40,0.85],[48,45,0.62],
    [50,50,0.92],[50,55,0.85],[50,60,0.75],[50,65,0.62],
    [45,25,0.55],[55,25,0.55],[50,20,0.45],
  ],
  cole: [
    [40,40,0.78],[50,45,0.92],[60,42,0.78],[45,35,0.7],[55,38,0.72],
    [40,55,0.62],[60,55,0.6],[50,30,0.65],[50,60,0.55],
  ],
  matt: [
    [35,55,0.8],[45,52,0.92],[55,55,0.92],[65,52,0.78],[42,42,0.65],
    [58,42,0.65],[40,68,0.55],[60,68,0.55],
  ],
  obi: [
    [60,55,0.78],[70,52,0.88],[80,55,0.7],[50,55,0.62],[68,42,0.55],
    [75,68,0.55],[55,72,0.45],
  ],
  luke: [
    [50,85,0.92],[45,80,0.85],[55,80,0.85],[50,90,0.72],[48,75,0.62],
    [30,70,0.62],[70,70,0.62],[50,65,0.55],[40,60,0.45],[60,60,0.45],
    [20,50,0.32],[80,50,0.32],[50,55,0.55],
  ],
}

// Per-player territory split.
const RG_ZONE_STATS: Record<string, { ownHalf:number; midfield:number; oppHalf:number; opp22:number }> = {
  all:        { ownHalf:28, midfield:34, oppHalf:26, opp22:12 },
  forwards:   { ownHalf:32, midfield:42, oppHalf:20, opp22:6 },
  backs:      { ownHalf:22, midfield:30, oppHalf:30, opp22:18 },
  'tom-h':    { ownHalf:52, midfield:31, oppHalf:14, opp22:3  },
  marcus:     { ownHalf:34, midfield:46, oppHalf:16, opp22:4  },
  karl:       { ownHalf:18, midfield:48, oppHalf:26, opp22:8  },
  'danny-fos':{ ownHalf:22, midfield:44, oppHalf:24, opp22:10 },
  sam:        { ownHalf:24, midfield:44, oppHalf:24, opp22:8  },
  cole:       { ownHalf:30, midfield:48, oppHalf:18, opp22:4  },
  matt:       { ownHalf:18, midfield:42, oppHalf:30, opp22:10 },
  obi:        { ownHalf:14, midfield:38, oppHalf:34, opp22:14 },
  luke:       { ownHalf:8,  midfield:22, oppHalf:42, opp22:28 },
}

// Section 2 — tackle / contact events. [x%, y%, type, dominant=intensity 0–1]
type TackleType = 'dominant' | 'normal' | 'missed'
const RG_TACKLES: Array<[number, number, TackleType, number]> = [
  [22,30,'dominant',0.95],[28,42,'dominant',0.88],[32,55,'normal',0.6],[40,38,'normal',0.55],
  [48,52,'dominant',0.92],[52,48,'dominant',0.85],[60,55,'normal',0.6],[68,52,'normal',0.55],
  [44,68,'normal',0.55],[36,72,'missed',0.3],[58,72,'normal',0.55],[72,68,'normal',0.5],
  [22,50,'normal',0.55],[78,50,'normal',0.55],[44,80,'missed',0.32],[55,82,'normal',0.5],
  [50,30,'dominant',0.78],[35,45,'dominant',0.82],[64,45,'normal',0.62],
  [32,60,'normal',0.55],[68,60,'dominant',0.78],[42,28,'normal',0.55],[58,28,'normal',0.55],
  [12,38,'missed',0.28],[88,42,'missed',0.3],
]

// Section 3 — ruck heat blobs + ruck speed by zone.
const RG_RUCKS: Array<[number, number, number]> = [
  [42,38,0.85],[48,42,0.95],[55,40,0.92],[58,48,0.85],[44,52,0.82],
  [50,58,0.95],[52,62,0.88],[42,68,0.7],[60,68,0.72],
  [38,32,0.62],[62,32,0.6],[34,75,0.5],[68,75,0.5],
  [22,45,0.45],[78,48,0.45],[50,82,0.55],
]
const RG_RUCK_SPEED = [
  { zone:'Own 22',     avg:5.4, target:4.5, wonPct:78, color:0.78 },
  { zone:'Own half',   avg:4.2, target:4.0, wonPct:88, color:0.55 },
  { zone:'Opp half',   avg:3.6, target:3.5, wonPct:92, color:0.38 },
  { zone:'Opp 22',     avg:3.2, target:3.2, wonPct:94, color:0.28 },
]
const RG_TURNOVERS: Array<[number, number, number]> = [
  [44,48,0.85],[55,52,0.92],[40,68,0.62],[60,72,0.55],[48,42,0.78],[35,32,0.45],[65,32,0.45],
]

// Section 4 — set-piece event positions.
type SetPieceEvent = { x:number; y:number; kind:'lineout-won'|'lineout-lost'|'scrum-won'|'scrum-lost' }
const RG_SETPIECES: SetPieceEvent[] = [
  // Lineouts (touchlines x≈4 / x≈96)
  { x:4,  y:28, kind:'lineout-won'  },
  { x:4,  y:42, kind:'lineout-won'  },
  { x:96, y:35, kind:'lineout-won'  },
  { x:4,  y:62, kind:'lineout-lost' },
  { x:96, y:55, kind:'lineout-won'  },
  { x:96, y:78, kind:'lineout-won'  },
  { x:4,  y:82, kind:'lineout-won'  },
  { x:96, y:88, kind:'lineout-lost' },
  // Scrums (mid-pitch)
  { x:35, y:30, kind:'scrum-won'    },
  { x:50, y:42, kind:'scrum-won'    },
  { x:55, y:55, kind:'scrum-won'    },
  { x:50, y:62, kind:'scrum-lost'   },
  { x:65, y:75, kind:'scrum-won'    },
  { x:42, y:68, kind:'scrum-won'    },
]
const RG_LINEOUT_BY_ZONE = [
  { zone:'Own 22',  won:18, lost:2,  pct:90 },
  { zone:'Midfield',won:28, lost:6,  pct:82 },
  { zone:'Opp 22',  won:22, lost:4,  pct:85 },
]

// Section 5 — squad GPS load (10 matches × players).
const RG_SQUAD_LOAD_PLAYERS = [
  { name:'Tom Harrison',  pos:'Prop',     acwr:0.94 },
  { name:'Marcus Webb',   pos:'Lock',     acwr:1.12 },
  { name:'Karl Foster',   pos:'Flanker',  acwr:1.44 },
  { name:'Danny Foster',  pos:'No.8',     acwr:1.38 },
  { name:'Sam Ellis',     pos:'Scrum',    acwr:1.08 },
  { name:'Danny Cole',    pos:'Fly',      acwr:0.78 },
  { name:'Matt Jones',    pos:'Centre',   acwr:1.16 },
  { name:'David Obi',     pos:'Centre',   acwr:1.08 },
  { name:'Luke Barnes',   pos:'Fullback', acwr:1.52 },
  { name:'Will Briggs',   pos:'Wing',     acwr:0.88 },
  { name:'Ben Patel',     pos:'Hooker',   acwr:1.05 },
]
const RG_SQUAD_LOAD_GRID: number[][] = RG_SQUAD_LOAD_PLAYERS.map((_, r) =>
  Array.from({ length: 10 }).map((__, c) => {
    const seed = (r * 31 + c * 13 + 7) % 23
    const base = 0.35 + (seed / 23) * 0.55
    const spike = (r === 8 && c === 7) || (r === 3 && c === 5) || (r === 2 && c === 6) ? 0.22 : 0
    return Math.max(0, Math.min(1, base + spike))
  })
)

// Section 6 — training movement.
const RG_TRAIN_INTENSITY_A = [0.78, 0.42, 0.92, 0.35, 0.7, 0.55, 0.28, 0.85, 0.62, 0.45]
const RG_TRAIN_INTENSITY_B = [0.5, 0.72, 0.45, 0.82, 0.48, 0.62, 0.92, 0.38, 0.7, 0.6]
const RG_DISTANCE_BANDS = [
  { label:'Stand',  a:1820, b:1620, color:0.05 },
  { label:'Walk',   a:2240, b:1980, color:0.20 },
  { label:'Jog',    a:1640, b:1880, color:0.45 },
  { label:'Run',    a: 920, b:1240, color:0.75 },
  { label:'Sprint', a: 280, b: 410, color:0.98 },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

function RugbyGpsHeatmapsView() {
  // ── Section 1 state ──
  const [pid,  setPid]  = useState<RgPlayerId>('all')
  const [sid,  setSid]  = useState<typeof RG_SESSIONS[number]['id']>('m1')
  const [view, setView] = useState<'heatmap' | 'zones' | 'lines'>('heatmap')

  const player  = RG_PLAYERS.find(p => p.id === pid) ?? RG_PLAYERS[0]
  const session = RG_SESSIONS.find(s => s.id === sid) ?? RG_SESSIONS[0]
  const heat    = RG_HEAT[pid] ?? RG_HEAT.all
  const zones   = RG_ZONE_STATS[pid] ?? RG_ZONE_STATS.all

  // ── Section 2 state ──
  const [tkType, setTkType] = useState<'all' | TackleType>('all')
  const tackles = RG_TACKLES.filter(t => tkType === 'all' ? true : t[2] === tkType)
  const tackleCounts = {
    dominant: RG_TACKLES.filter(t => t[2] === 'dominant').length,
    normal:   RG_TACKLES.filter(t => t[2] === 'normal').length,
    missed:   RG_TACKLES.filter(t => t[2] === 'missed').length,
    total:    RG_TACKLES.length,
  }
  const completionPct = Math.round((tackleCounts.total - tackleCounts.missed) / tackleCounts.total * 100)

  // ── Section 4 state ──
  const [spType, setSpType] = useState<'all' | 'lineout' | 'scrum'>('all')
  const spEvents = RG_SETPIECES.filter(e =>
    spType === 'all' ? true : e.kind.startsWith(spType)
  )

  // ── Section 6 state ──
  const totalA = RG_DISTANCE_BANDS.reduce((s, z) => s + z.a, 0)
  const totalB = RG_DISTANCE_BANDS.reduce((s, z) => s + z.b, 0)

  const heatStops = Array.from({ length: 24 }).map((_, i) => rgHeat(i / 23))

  const Pill = ({ active, onClick, children }: { active?:boolean; onClick?:()=>void; children:React.ReactNode }) => (
    <button onClick={onClick}
      className="text-[11px] font-medium px-3 py-1 rounded-full transition-colors"
      style={{
        border: `1px solid ${active ? '#8B5CF6' : '#1F2937'}`,
        background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
        color: active ? '#c4b5fd' : '#94a3b8',
        cursor: 'pointer',
      }}>{children}</button>
  )

  // ─── Section 1: Pitch SVG (hero) ────────────────────────────────────────
  const pitch1 = rgPitch({ id: 'hero' })
  const cx1 = (xPct: number) => (xPct / 100) * pitch1.PW
  const cy1 = (yPct: number) => pitch1.PH - (yPct / 100) * pitch1.PH
  const heroPrimaryZone =
    zones.opp22 > 25 ? 'Opp 22' :
    zones.oppHalf > zones.ownHalf ? 'Opp half' :
    zones.midfield > 40 ? 'Midfield' : 'Own half'

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔥" title="GPS Heatmaps" subtitle="Pitch position, tackle, ruck, set-piece, squad load and training movement — all from Lumio GPS + FrameSports tagging." />

      {/* ── 1. PITCH POSITION HEATMAP (HERO) ──────────────────────── */}
      <Card className="border-purple-600/30">
        <div className="flex items-start gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Hero · Pitch Position Heatmap</div>
            <h2 className="text-xl font-black text-white mt-1">Where {player.name} played</h2>
            <p className="text-xs mt-1 text-gray-400">
              Primary zone <span className="text-white font-semibold">{heroPrimaryZone}</span>
              <span className="text-gray-600"> · {session.label}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.06em] text-gray-600">HEAT</span>
              <span className="text-[10px] text-gray-600">rare</span>
              <div className="flex h-1.5 w-32 overflow-hidden rounded-sm border border-gray-800">
                {heatStops.map((s, i) => <div key={i} className="flex-1" style={{ background: s }} />)}
              </div>
              <span className="text-[10px] text-gray-600">primary</span>
            </div>
            <div className="text-[11px] flex gap-3 text-gray-600">
              <span>POSITIONS <span className="text-white font-semibold">{heat.length}</span></span>
              <span>·</span>
              <span>DIST <span className="text-white font-semibold">11.4 km</span></span>
            </div>
          </div>
        </div>

        {/* Position group filter */}
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Position group</div>
          <div className="flex gap-2 flex-wrap">
            <Pill active={pid === 'all'}      onClick={() => setPid('all')}>All squad</Pill>
            <Pill active={pid === 'forwards'} onClick={() => setPid('forwards')}>Forwards (1–8)</Pill>
            <Pill active={pid === 'backs'}    onClick={() => setPid('backs')}>Backs (9–15)</Pill>
          </div>
        </div>

        {/* Individual filter */}
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Player</div>
          <div className="flex gap-1 flex-wrap">
            {RG_PLAYERS.filter(p => !['all','forwards','backs'].includes(p.id)).map(p => (
              <Pill key={p.id} active={pid === p.id} onClick={() => setPid(p.id)}>
                <span className="font-mono text-[10px] mr-1.5 text-gray-500">#{p.posNum}</span>
                {p.name.split(' ')[1] || p.name}
              </Pill>
            ))}
          </div>
        </div>

        {/* Session + view toggle */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Session</label>
            <select value={sid} onChange={e => setSid(e.target.value as typeof sid)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500">
              {RG_SESSIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">View</label>
            <div className="flex gap-2">
              {(['heatmap','zones','lines'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all ${view === v ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Pitch */}
        <svg viewBox={`0 0 ${pitch1.PW} ${pitch1.PH}`} width="100%" style={{ maxHeight: 420 }}>
          {pitch1.defs}
          {pitch1.markings}

          {view === 'heatmap' && (
            <g filter="url(#rg-glow-hero)">
              {heat.map(([x, y, intensity], i) => (
                <circle key={i} cx={cx1(x)} cy={cy1(y)} r={20 + intensity * 38}
                  fill={rgHeat(intensity)} fillOpacity={0.18 + intensity * 0.4} />
              ))}
            </g>
          )}
          {view === 'heatmap' && heat.map(([x, y, intensity], i) => (
            <circle key={`m-${i}`} cx={cx1(x)} cy={cy1(y)} r={3 + intensity * 2}
              fill={rgHeat(intensity)} stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />
          ))}

          {view === 'zones' && (
            <g>
              <rect x={0} y={pitch1.PH*0.78} width={pitch1.PW} height={pitch1.PH*0.18} fill={rgHeat(zones.opp22 / 30)}    fillOpacity="0.5" rx="2" />
              <rect x={0} y={pitch1.PH*0.50} width={pitch1.PW} height={pitch1.PH*0.28} fill={rgHeat(zones.oppHalf / 50)}  fillOpacity="0.45" rx="2" />
              <rect x={0} y={pitch1.PH*0.22} width={pitch1.PW} height={pitch1.PH*0.28} fill={rgHeat(zones.midfield / 50)} fillOpacity="0.45" rx="2" />
              <rect x={0} y={0}                width={pitch1.PW} height={pitch1.PH*0.22} fill={rgHeat(zones.ownHalf / 50)}  fillOpacity="0.45" rx="2" />
              <text x={pitch1.PW/2} y={pitch1.PH*0.88} fontSize="22" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.85">{zones.opp22}%</text>
              <text x={pitch1.PW/2} y={pitch1.PH*0.66} fontSize="22" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.85">{zones.oppHalf}%</text>
              <text x={pitch1.PW/2} y={pitch1.PH*0.38} fontSize="22" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.85">{zones.midfield}%</text>
              <text x={pitch1.PW/2} y={pitch1.PH*0.13} fontSize="22" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.85">{zones.ownHalf}%</text>
            </g>
          )}

          {view === 'lines' && heat.slice(0, -1).map(([x, y], i) => {
            const next = heat[i + 1]; if (!next) return null
            return <line key={`ln-${i}`} x1={cx1(x)} y1={cy1(y)} x2={cx1(next[0])} y2={cy1(next[1])}
              stroke="#8B5CF6" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          })}
        </svg>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label="Own Half"  value={`${zones.ownHalf}%`}  sub="Defensive zone"        color="teal" />
          <StatCard label="Midfield"  value={`${zones.midfield}%`} sub="22–22 corridor"        color="blue" />
          <StatCard label="Opp Half"  value={`${zones.oppHalf}%`}  sub="Attacking territory"   color="purple" />
          <StatCard label="Opp 22"    value={`${zones.opp22}%`}    sub="Red zone time"         color="orange" />
        </div>
      </Card>

      {/* ── 2. TACKLE / CONTACT HEATMAP ──────────────────────────── */}
      <Card>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Section 02</div>
            <h3 className="text-base font-bold text-white mt-1">Tackle &amp; Contact Heatmap</h3>
            <p className="text-[11px] text-gray-500">{tackleCounts.total} tackle events · {completionPct}% completion · FrameSports auto-tagged.</p>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Pill active={tkType === 'all'}      onClick={() => setTkType('all')}>All ({tackleCounts.total})</Pill>
            <Pill active={tkType === 'dominant'} onClick={() => setTkType('dominant')}>Dominant ({tackleCounts.dominant})</Pill>
            <Pill active={tkType === 'normal'}   onClick={() => setTkType('normal')}>Normal ({tackleCounts.normal})</Pill>
            <Pill active={tkType === 'missed'}   onClick={() => setTkType('missed')}>Missed ({tackleCounts.missed})</Pill>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {(() => {
            const p = rgPitch({ id: 'tackle' })
            const cxF = (xPct: number) => (xPct / 100) * p.PW
            const cyF = (yPct: number) => p.PH - (yPct / 100) * p.PH
            return (
              <svg viewBox={`0 0 ${p.PW} ${p.PH}`} width="100%">
                {p.defs}
                {p.markings}
                {/* Heat blobs (intensity glow) */}
                <g filter="url(#rg-glow-tackle)">
                  {tackles.map(([x,y,_t,intensity], i) => (
                    <circle key={`tg-${i}`} cx={cxF(x)} cy={cyF(y)} r={14 + intensity * 14}
                      fill={rgHeat(intensity)} fillOpacity={0.22 + intensity * 0.3} />
                  ))}
                </g>
                {/* Markers per tackle type */}
                {tackles.map(([x,y,t,intensity], i) => {
                  const fill = t === 'dominant' ? rgHeat(0.95) : t === 'missed' ? '#ef4444' : rgHeat(0.55)
                  const stroke = t === 'missed' ? '#fca5a5' : 'rgba(0,0,0,0.6)'
                  return t === 'missed' ? (
                    <g key={`tk-${i}`}>
                      <circle cx={cxF(x)} cy={cyF(y)} r={5} fill="none" stroke={fill} strokeWidth="1.5" />
                      <line x1={cxF(x)-3} y1={cyF(y)-3} x2={cxF(x)+3} y2={cyF(y)+3} stroke={fill} strokeWidth="1.5" />
                      <line x1={cxF(x)-3} y1={cyF(y)+3} x2={cxF(x)+3} y2={cyF(y)-3} stroke={fill} strokeWidth="1.5" />
                    </g>
                  ) : (
                    <circle key={`tk-${i}`} cx={cxF(x)} cy={cyF(y)} r={t === 'dominant' ? 5 : 3.5}
                      fill={fill} stroke={stroke} strokeWidth="0.6"
                      opacity={t === 'dominant' ? 1 : 0.85} />
                  )
                })}
              </svg>
            )
          })()}
          <div className="space-y-3">
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Type breakdown</div>
              {[
                { k:'Dominant', v:tackleCounts.dominant, c:rgHeat(0.95) },
                { k:'Normal',   v:tackleCounts.normal,   c:rgHeat(0.55) },
                { k:'Missed',   v:tackleCounts.missed,   c:'#ef4444' },
              ].map(r => (
                <div key={r.k} className="mb-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white">{r.k}</span>
                    <span className="font-bold tabular-nums" style={{ color:r.c }}>{r.v}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full" style={{ width:`${(r.v/tackleCounts.total)*100}%`, background:r.c }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Top tacklers</div>
              {[
                { name:'Karl Foster', n:18, dom:9 },
                { name:'Marcus Webb', n:14, dom:6 },
                { name:'Danny Foster',n:12, dom:5 },
              ].map(p => (
                <div key={p.name} className="flex justify-between py-1.5 border-b border-gray-800/50 text-[11px] last:border-0">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-white">{p.n} <span className="text-gray-500">({p.dom} dom)</span></span>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 bg-purple-600/10 border border-purple-600/30 text-[11px] text-purple-300">
              💡 36% of dominant hits inside opp 22 — pressure is winning the gainline.
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3. RUCK & BREAKDOWN HEATMAP ──────────────────────────── */}
      <Card>
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Section 03</div>
          <h3 className="text-base font-bold text-white mt-1">Ruck &amp; Breakdown Heatmap</h3>
          <p className="text-[11px] text-gray-500">Ruck cluster density, ruck speed by zone, and jackal turnover map.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {(() => {
            const p = rgPitch({ id: 'ruck' })
            const cxF = (xPct: number) => (xPct / 100) * p.PW
            const cyF = (yPct: number) => p.PH - (yPct / 100) * p.PH
            return (
              <svg viewBox={`0 0 ${p.PW} ${p.PH}`} width="100%">
                {p.defs}
                {p.markings}
                <g filter="url(#rg-glow-ruck)">
                  {RG_RUCKS.map(([x, y, intensity], i) => (
                    <circle key={`r-${i}`} cx={cxF(x)} cy={cyF(y)} r={22 + intensity * 26}
                      fill={rgHeat(intensity)} fillOpacity={0.2 + intensity * 0.35} />
                  ))}
                </g>
                {RG_RUCKS.map(([x, y, intensity], i) => (
                  <circle key={`rm-${i}`} cx={cxF(x)} cy={cyF(y)} r={3 + intensity * 2}
                    fill={rgHeat(intensity)} stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />
                ))}
                {/* Turnovers — yellow stars */}
                {RG_TURNOVERS.map(([x, y, intensity], i) => (
                  <g key={`to-${i}`}>
                    <circle cx={cxF(x)} cy={cyF(y)} r="6" fill="none" stroke="#facc15" strokeWidth="1.5" opacity={0.5 + intensity * 0.5}>
                      <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <text x={cxF(x)} y={cyF(y) + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#facc15">★</text>
                  </g>
                ))}
              </svg>
            )
          })()}
          <div className="space-y-3">
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Ruck speed by zone</div>
              {RG_RUCK_SPEED.map(z => (
                <div key={z.zone} className="mb-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white">{z.zone}</span>
                    <span className="font-bold tabular-nums" style={{ color: rgHeat(z.color) }}>{z.avg.toFixed(1)}s</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full" style={{ width:`${Math.min(100, z.avg / 6 * 100)}%`, background: rgHeat(z.color), boxShadow: z.color > 0.7 ? `0 0 6px ${rgGlow(z.color)}` : 'none' }} />
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">target {z.target.toFixed(1)}s · won {z.wonPct}%</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Jackal turnovers</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-yellow-400">{RG_TURNOVERS.length}</span>
                <span className="text-[11px] text-gray-500">forced this match</span>
              </div>
              <div className="text-[11px] text-gray-400">★ markers on the pitch — most concentrated around the breakdown after carry into 22m.</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 4. SET-PIECE HEATMAP ─────────────────────────────────── */}
      <Card>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Section 04</div>
            <h3 className="text-base font-bold text-white mt-1">Set-Piece Heatmap</h3>
            <p className="text-[11px] text-gray-500">Lineout and scrum positions across the pitch, with success markers.</p>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Pill active={spType === 'all'}     onClick={() => setSpType('all')}>All</Pill>
            <Pill active={spType === 'lineout'} onClick={() => setSpType('lineout')}>Lineout ({RG_SETPIECES.filter(e => e.kind.startsWith('lineout')).length})</Pill>
            <Pill active={spType === 'scrum'}   onClick={() => setSpType('scrum')}>Scrum ({RG_SETPIECES.filter(e => e.kind.startsWith('scrum')).length})</Pill>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {(() => {
            const p = rgPitch({ id: 'setpiece' })
            const cxF = (xPct: number) => (xPct / 100) * p.PW
            const cyF = (yPct: number) => p.PH - (yPct / 100) * p.PH
            return (
              <svg viewBox={`0 0 ${p.PW} ${p.PH}`} width="100%">
                {p.defs}
                {p.markings}
                {spEvents.map((e, i) => {
                  const won = e.kind.endsWith('won')
                  const isLineout = e.kind.startsWith('lineout')
                  const fill = won ? rgHeat(0.85) : '#ef4444'
                  return (
                    <g key={i}>
                      {isLineout ? (
                        // Lineout = vertical bar (lift)
                        <g>
                          <rect x={cxF(e.x) - 1} y={cyF(e.y) - 8} width="2" height="16" fill={fill} opacity={won ? 1 : 0.85} />
                          <circle cx={cxF(e.x)} cy={cyF(e.y) - 10} r={4} fill={fill} stroke="rgba(0,0,0,0.6)" strokeWidth="0.6" />
                        </g>
                      ) : (
                        // Scrum = octagon-ish
                        <g>
                          <polygon points={`${cxF(e.x)-7},${cyF(e.y)-3} ${cxF(e.x)-3},${cyF(e.y)-7} ${cxF(e.x)+3},${cyF(e.y)-7} ${cxF(e.x)+7},${cyF(e.y)-3} ${cxF(e.x)+7},${cyF(e.y)+3} ${cxF(e.x)+3},${cyF(e.y)+7} ${cxF(e.x)-3},${cyF(e.y)+7} ${cxF(e.x)-7},${cyF(e.y)+3}`}
                            fill={fill} stroke="rgba(0,0,0,0.6)" strokeWidth="0.6" opacity={won ? 1 : 0.85} />
                          <text x={cxF(e.x)} y={cyF(e.y) + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">S</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            )
          })()}
          <div className="space-y-3">
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Lineout win % by zone</div>
              {RG_LINEOUT_BY_ZONE.map(z => {
                const c = z.pct >= 88 ? 0.25 : z.pct >= 80 ? 0.55 : 0.85
                return (
                  <div key={z.zone} className="mb-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white">{z.zone}</span>
                      <span className="font-bold tabular-nums" style={{ color: rgHeat(c) }}>{z.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
                      <div className="h-full" style={{ width:`${z.pct}%`, background: rgHeat(c) }} />
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{z.won}/{z.won + z.lost} taken cleanly</div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Markers</div>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-2"><span style={{ width:8, height:14, background:rgHeat(0.85), display:'inline-block', borderRadius:1 }} /> Lineout won</div>
                <div className="flex items-center gap-2"><span style={{ width:8, height:14, background:'#ef4444', display:'inline-block', borderRadius:1 }} /> Lineout lost</div>
                <div className="flex items-center gap-2"><span style={{ width:14, height:14, background:rgHeat(0.85), display:'inline-block', borderRadius:2 }} /> Scrum won</div>
                <div className="flex items-center gap-2"><span style={{ width:14, height:14, background:'#ef4444', display:'inline-block', borderRadius:2 }} /> Scrum lost</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5. SQUAD GPS LOAD GRID ───────────────────────────────── */}
      <Card>
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Section 05</div>
          <h3 className="text-base font-bold text-white mt-1">Squad GPS Load Grid</h3>
          <p className="text-[11px] text-gray-500">Rolling 10 matches · brightness = total session load · ring = ACWR overload.</p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 min-w-[640px]">
            <span style={{ width:130 }} />
            {Array.from({ length: 10 }).map((_, i) => <span key={i} className="flex-1 text-center font-mono">M{i + 1}</span>)}
            <span style={{ width:60 }} className="text-right">ACWR</span>
          </div>
          {RG_SQUAD_LOAD_PLAYERS.map((p, r) => (
            <div key={p.name} className="flex items-center gap-1 mb-1 min-w-[640px]">
              <span style={{ width:130 }} className="text-[11px] text-gray-300 truncate">
                {p.name} <span className="text-gray-600">· {p.pos}</span>
              </span>
              {RG_SQUAD_LOAD_GRID[r].map((v, c) => (
                <div key={c} title={`${p.name} · M${c + 1} · load ${Math.round(v * 100)}`}
                  className="flex-1 rounded-sm"
                  style={{
                    height:18,
                    background: rgHeat(v),
                    boxShadow: v > 0.85 ? `0 0 8px ${rgGlow(v)}` : 'none',
                    border: v > 0.85 ? `1px solid #ef4444` : 'none',
                  }} />
              ))}
              <span style={{ width:60 }} className="text-right">
                <span className={`text-[11px] font-bold tabular-nums ${p.acwr >= 1.5 ? 'text-red-400' : p.acwr >= 1.3 ? 'text-amber-400' : p.acwr <= 0.8 ? 'text-blue-400' : 'text-green-400'}`}>
                  {p.acwr.toFixed(2)}
                  {p.acwr >= 1.5 && <span className="ml-1">⚠</span>}
                </span>
              </span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-3 flex-wrap">
          <span>Overload (&gt;1.5):</span>
          {RG_SQUAD_LOAD_PLAYERS.filter(p => p.acwr >= 1.5).map(p =>
            <span key={p.name} className="text-red-400 font-bold">{p.name}</span>
          )}
          <span className="ml-auto">Underload (&lt;0.8):</span>
          {RG_SQUAD_LOAD_PLAYERS.filter(p => p.acwr <= 0.8).map(p =>
            <span key={p.name} className="text-blue-400 font-bold">{p.name}</span>
          )}
        </div>
      </Card>

      {/* ── 6. TRAINING MOVEMENT HEATMAP ─────────────────────────── */}
      <Card>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#a855f7' }}>Section 06</div>
            <h3 className="text-base font-bold text-white mt-1">Training Movement Heatmap</h3>
            <p className="text-[11px] text-gray-500">Side-by-side session comparison · distance by intensity zone.</p>
          </div>
          <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-wider">Tue 8 Apr · The Grange</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-4">
          {/* Session A mini pitch */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Session A · Tactical · 6.94 km</div>
            {(() => {
              const p = rgPitch({ id: 'train-a' })
              return (
                <svg viewBox={`0 0 ${p.PW} ${p.PH}`} width="100%">
                  {p.defs}
                  {p.markings}
                  <g filter="url(#rg-glow-train-a)">
                    {RG_TRAIN_INTENSITY_A.map((v, i) => {
                      const angle = (i / RG_TRAIN_INTENSITY_A.length) * Math.PI * 2
                      const cx = p.PW / 2 + Math.cos(angle) * 130
                      const cy = p.PH / 2 + Math.sin(angle) * 80
                      return <circle key={i} cx={cx} cy={cy} r={14 + v * 22} fill={rgHeat(v)} fillOpacity={0.3 + v * 0.4} />
                    })}
                  </g>
                </svg>
              )
            })()}
          </div>

          {/* Distance by zone */}
          <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Distance by intensity</div>
            {RG_DISTANCE_BANDS.map(z => {
              const tot = z.a + z.b
              const aPct = (z.a / tot) * 100
              return (
                <div key={z.label} className="mb-2.5">
                  <div className="flex justify-between text-[11px] mb-1 tabular-nums">
                    <span className="text-white">{z.label}</span>
                    <span><span style={{ color: rgHeat(z.color) }}>{z.a}</span> · <span className="text-gray-600">{z.b} m</span></span>
                  </div>
                  <div className="flex h-2 rounded-md overflow-hidden bg-gray-800">
                    <div style={{ width:`${aPct}%`,        background: rgHeat(z.color), boxShadow: z.color > 0.7 ? `0 0 6px ${rgGlow(z.color)}` : 'none' }} />
                    <div style={{ width:`${100 - aPct}%`,  background: rgHeat(z.color), opacity: 0.3 }} />
                  </div>
                </div>
              )
            })}
            <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-800/50 flex justify-between tabular-nums">
              <span>A total <span className="text-white font-bold">{totalA.toLocaleString()} m</span></span>
              <span>B total <span className="text-white font-bold">{totalB.toLocaleString()} m</span></span>
            </div>
          </div>

          {/* Session B mini pitch */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Session B · S&amp;C · 7.14 km</div>
            {(() => {
              const p = rgPitch({ id: 'train-b' })
              return (
                <svg viewBox={`0 0 ${p.PW} ${p.PH}`} width="100%">
                  {p.defs}
                  {p.markings}
                  <g filter="url(#rg-glow-train-b)">
                    {RG_TRAIN_INTENSITY_B.map((v, i) => {
                      const angle = (i / RG_TRAIN_INTENSITY_B.length) * Math.PI * 2 + 0.6
                      const cx = p.PW / 2 + Math.cos(angle) * 110
                      const cy = p.PH / 2 + Math.sin(angle) * 90
                      return <circle key={i} cx={cx} cy={cy} r={14 + v * 22} fill={rgHeat(v)} fillOpacity={0.3 + v * 0.4} />
                    })}
                  </g>
                </svg>
              )
            })()}
          </div>
        </div>
      </Card>

      <div className="text-[10px] text-gray-700 text-center">
        GPS position data: Lumio GPS · 10Hz sampling · Updated after each session sync · Tackle, ruck and set-piece events tagged by FrameSports.
      </div>
    </div>
  )
}

// ─── VIDEO ANALYSIS VIEW ──────────────────────────────────────────────────────
const VIDEO_CLIPS = [
  { id: 1, title: 'Opposition — Bath RFC (attack shapes)', category: 'Opposition',  duration: '18:42', date: '8 Apr',  tags: ['Bath', 'Attack', 'Phase play'], notes: 'Look for their 10-12 loop after 3 phases — key attacking shape.' },
  { id: 2, title: 'Training — Lineout patterns session',    category: 'Training',    duration: '24:10', date: '7 Apr',  tags: ['Lineout', 'Set piece'],        notes: 'New front-ball option for #2 — discuss Friday.' },
  { id: 3, title: 'Match review — Saracens (full)',         category: 'Match',       duration: '1:14:30', date: '5 Apr', tags: ['Saracens', 'Full match'],     notes: 'Second-half defence let us down between 60–70.' },
  { id: 4, title: 'Set piece — attacking maul drive',       category: 'Training',    duration: '11:05', date: '4 Apr',  tags: ['Maul', 'Attack'],              notes: 'Foley cleanout technique — teach to the front row.' },
  { id: 5, title: 'Individual — Foley breakdown technique', category: 'Individual',  duration: '9:22',  date: '3 Apr',  tags: ['Foley', 'Breakdown'],          notes: 'Body height is excellent — share as coaching clip.' },
]

function PlayerProfileView(){const[sid,setSid]=useState(1);const[pt,setPt]=useState<'overview'|'contract'|'medical'|'value'>('overview');const PL=[{id:1,name:'Tom Harrison',pos:'Prop',age:28,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:1800,end:'Jun 2027',intl:false,rd:94,gps:{d:10.8,hi:720,spr:14,ms:27.8,ac:0.94},st:{ap:16,tr:1,tk:82,mi:4,ca:94,me:312},inj:[{i:'Calf strain',d:'Oct 2025',o:10,ok:true}],val:{mv:'£85–95k/yr',sc:'High',rec:'Renew'}},{id:4,name:'Marcus Webb',pos:'Lock',age:26,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2500,end:'Jun 2028',intl:true,rd:87,gps:{d:11.6,hi:880,spr:18,ms:29.2,ac:1.12},st:{ap:14,tr:2,tk:104,mi:6,ca:88,me:264},inj:[],val:{mv:'£120–140k/yr',sc:'Medium',rec:'Central contract'}},{id:6,name:'Danny Foster',pos:'No.8',age:24,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2200,end:'Jun 2028',intl:true,rd:0,gps:{d:12.4,hi:1240,spr:28,ms:32.1,ac:1.38},st:{ap:15,tr:4,tk:112,mi:8,ca:128,me:498},inj:[{i:'HIA Protocol',d:'5 Apr 2026',o:null,ok:false}],val:{mv:'£110–130k/yr',sc:'High',rec:'Protect from Prem'}},{id:16,name:'Luke Barnes',pos:'Fullback',age:23,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2000,end:'Jun 2027',intl:false,rd:95,gps:{d:12.3,hi:1120,spr:26,ms:31.9,ac:1.52},st:{ap:16,tr:6,tk:88,mi:4,ca:142,me:562},inj:[],val:{mv:'£100–120k/yr',sc:'Rising star',rec:'Extend now'}}];const p=PL.find(x=>x.id===sid)??PL[0];return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="👤" title="Player Profiles" subtitle="GPS · Stats · Contract · Medical · Value"/><div className="flex gap-6"><div className="w-44 flex-shrink-0 space-y-1">{PL.map(pl=><button key={pl.id} onClick={()=>{setSid(pl.id);setPt('overview')}} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs ${sid===pl.id?'bg-purple-600/20 text-purple-300 border border-purple-600/30':'text-gray-400 hover:bg-gray-800/50'}`}><div className="font-medium truncate">{pl.name}</div><div className="text-[10px] text-gray-500 mt-0.5">{pl.pos}</div></button>)}</div><div className="flex-1 min-w-0 space-y-5"><div className="bg-gradient-to-r from-purple-900/30 to-gray-900/20 border border-purple-600/30 rounded-xl p-5"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-2xl">{p.nat}</span><h3 className="text-xl font-bold text-white">{p.name}</h3>{p.intl&&<span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">Intl</span>}</div><p className="text-sm text-gray-400">{p.pos} · Age {p.age} · {p.end}</p></div><div className="text-right"><div className={`text-3xl font-bold ${p.rd>=80?'text-green-400':p.rd===0?'text-red-400':'text-amber-400'}`}>{p.rd>0?`${p.rd}%`:'N/A'}</div><div className="text-xs text-gray-500">Readiness</div></div></div><div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800/50">{[{l:'Apps',v:p.st.ap},{l:'Tries',v:p.st.tr},{l:'Tackles',v:p.st.tk},{l:'Metres',v:p.st.me}].map((s,i)=><div key={i} className="text-center"><div className="text-lg font-bold text-white">{s.v}</div><div className="text-[10px] text-gray-500">{s.l}</div></div>)}</div></div><div className="flex gap-1 border-b border-gray-800">{([{id:'overview' as const,l:'Overview',ic:'📋'},{id:'contract' as const,l:'Contract',ic:'📄'},{id:'medical' as const,l:'Medical',ic:'🏥'},{id:'value' as const,l:'Value',ic:'💷'}]).map(t=><button key={t.id} onClick={()=>setPt(t.id)} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 border-b-2 -mb-px ${pt===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500'}`}><span>{t.ic}</span>{t.l}</button>)}</div>{pt==='overview'&&<div className="grid grid-cols-2 gap-4"><Card><div className="text-xs font-bold text-gray-400 uppercase mb-3">GPS</div>{[{l:'Dist',v:`${p.gps.d}km`},{l:'HI',v:`${p.gps.hi}m`},{l:'Sprints',v:p.gps.spr},{l:'Max',v:`${p.gps.ms}km/h`},{l:'ACWR',v:p.gps.ac}].map((r,i)=><div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card><Card><div className="text-xs font-bold text-gray-400 uppercase mb-3">Stats</div>{[{l:'Apps',v:p.st.ap},{l:'Tries',v:p.st.tr},{l:'Tackles',v:p.st.tk},{l:'Missed',v:p.st.mi},{l:'Carries',v:p.st.ca},{l:'Metres',v:`${p.st.me}m`}].map((r,i)=><div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card></div>}{pt==='contract'&&<Card><div className="text-sm font-semibold text-white mb-3">Contract</div>{[{l:'Weekly',v:fmt(p.w)},{l:'Annual',v:fmt(p.w*52)},{l:'End',v:p.end},{l:'Intl',v:p.intl?'Yes':'No'},{l:'Cap %',v:`${((p.w*52/2800000)*100).toFixed(1)}%`}].map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card>}{pt==='medical'&&<Card><div className="text-sm font-semibold text-white mb-3">Injury Log</div>{p.inj.length===0?<div className="text-xs text-green-400 bg-green-600/10 border border-green-600/20 rounded-lg p-3">✓ No injuries.</div>:p.inj.map((inj,i)=><div key={i} className={`rounded-lg p-3 border mb-2 ${inj.ok?'border-gray-800':'border-amber-600/30 bg-amber-600/5'}`}><div className="flex justify-between mb-1"><span className="text-sm font-semibold text-white">{inj.i}</span><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${inj.ok?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{inj.ok?'Resolved':'Active'}</span></div><div className="text-xs text-gray-400">{inj.d}{inj.o?` · ${inj.o}d`:''}</div></div>)}</Card>}{pt==='value'&&<Card><div className="text-sm font-semibold text-white mb-4">Market Value</div><div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4 mb-3"><div className="text-purple-400 font-bold text-lg">{p.val.mv}</div></div>{[{l:'Scarcity',v:p.val.sc},{l:'Rec',v:p.val.rec}].map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white text-right ml-4">{r.v}</span></div>)}</Card>}</div></div></div>)}

function VideoAnalysisView() {
  const [filter, setFilter] = useState<string>('All')
  const categories = ['All', 'Match', 'Training', 'Opposition', 'Individual']
  const filtered = filter === 'All' ? VIDEO_CLIPS : VIDEO_CLIPS.filter(c => c.category === filter)
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎬" title="Video Analysis" subtitle={`${VIDEO_CLIPS.length} clips in library — match footage, training, opposition & individual breakdowns`} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filter === c ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 bg-[#0a0c14] text-gray-400 hover:border-gray-700'}`}>
              {c}
            </button>
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500">+ Upload new clip</button>
      </div>

      <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-3 text-xs text-purple-300">
        🤖 AI tagging coming soon — automatic breakdown by player and phase.
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-36 h-20 rounded-lg bg-gradient-to-br from-purple-900/40 to-gray-900 border border-gray-800 flex items-center justify-center text-3xl">▶</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-white truncate">{c.title}</div>
                  <div className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{c.duration} · {c.date}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-600/20 border border-purple-600/30 rounded px-1.5 py-0.5">{c.category}</span>
                  {c.tags.map(t => (
                    <span key={t} className="text-[10px] text-gray-400 bg-gray-800/60 rounded px-1.5 py-0.5">#{t}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 italic">&ldquo;{c.notes}&rdquo;</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── MATCH STATS VIEW ─────────────────────────────────────────────────────────
const MATCH_RESULTS = [
  { date: '5 Apr',  opp: 'Saracens',      ha: 'A' as const, score: '21-27', result: 'L' as const, poss: 48, tackles: 89, lineout: 78, scrum: 75 },
  { date: '29 Mar', opp: 'Bristol',       ha: 'H' as const, score: '34-18', result: 'W' as const, poss: 58, tackles: 91, lineout: 85, scrum: 82 },
  { date: '22 Mar', opp: 'Worcester',     ha: 'A' as const, score: '17-17', result: 'D' as const, poss: 51, tackles: 84, lineout: 80, scrum: 77 },
  { date: '15 Mar', opp: 'Ealing',        ha: 'H' as const, score: '29-12', result: 'W' as const, poss: 61, tackles: 92, lineout: 88, scrum: 81 },
  { date: '8 Mar',  opp: 'Doncaster',     ha: 'A' as const, score: '24-22', result: 'W' as const, poss: 54, tackles: 86, lineout: 81, scrum: 79 },
]

function MatchStatsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Match Stats" subtitle="Last 5 results and season aggregates" />

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Last 5 results</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Opposition</th>
                <th className="text-center py-2 font-medium">H/A</th>
                <th className="text-center py-2 font-medium">Score</th>
                <th className="text-center py-2 font-medium">Result</th>
                <th className="text-right py-2 font-medium">Possession</th>
                <th className="text-right py-2 font-medium">Tackles</th>
                <th className="text-right py-2 font-medium">Lineout %</th>
                <th className="text-right py-2 font-medium">Scrum %</th>
              </tr>
            </thead>
            <tbody>
              {MATCH_RESULTS.map((m, i) => {
                const resClass = m.result === 'W' ? 'text-green-400' : m.result === 'L' ? 'text-red-400' : 'text-amber-400'
                return (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-400">{m.date}</td>
                    <td className="py-2 text-white">{m.opp}</td>
                    <td className="py-2 text-center text-gray-400">{m.ha}</td>
                    <td className="py-2 text-center text-white font-medium">{m.score}</td>
                    <td className={`py-2 text-center font-bold ${resClass}`}>{m.result}</td>
                    <td className="py-2 text-right text-gray-200">{m.poss}%</td>
                    <td className="py-2 text-right text-gray-200">{m.tackles}</td>
                    <td className="py-2 text-right text-gray-200">{m.lineout}%</td>
                    <td className="py-2 text-right text-gray-200">{m.scrum}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-300">54%</div>
          <div className="text-xs text-gray-400 mt-1">Avg possession</div>
        </div>
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">87%</div>
          <div className="text-xs text-gray-400 mt-1">Tackle success</div>
        </div>
        <div className="bg-teal-600/10 border border-teal-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-teal-400">82%</div>
          <div className="text-xs text-gray-400 mt-1">Lineout success</div>
        </div>
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">79%</div>
          <div className="text-xs text-gray-400 mt-1">Scrum win %</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Top performers</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Most tackles / game</span>
              <span className="text-white">Danny Foley <span className="text-purple-300 ml-2">14.0</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Line breaks / game</span>
              <span className="text-white">Tom Harrison <span className="text-purple-300 ml-2">3.0</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Metres made / game</span>
              <span className="text-white">Luke Barnes <span className="text-purple-300 ml-2">108</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Turnovers won / game</span>
              <span className="text-white">Karl Foster <span className="text-purple-300 ml-2">2.4</span></span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-white mb-3">Discipline</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Yellow cards</span>
              <span className="text-amber-400 font-semibold">3</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Red cards</span>
              <span className="text-green-400 font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Penalties conceded / game</span>
              <span className="text-white font-semibold">9.2</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Set piece heat map — lineouts won / lost by zone</div>
        <div className="text-[10px] text-gray-500 mb-2">Green = won · red = lost · size = count</div>
        <svg viewBox="0 0 600 260" className="w-full" style={{ maxHeight: 220 }}>
          {/* pitch */}
          <rect x="10" y="10" width="580" height="240" fill="#0f3d24" stroke="rgba(255,255,255,0.3)" strokeWidth="2" rx="4" />
          <line x1="300" y1="10" x2="300" y2="250" stroke="rgba(255,255,255,0.25)" />
          <line x1="100" y1="10" x2="100" y2="250" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <line x1="500" y1="10" x2="500" y2="250" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          {/* Own 22 */}
          <text x="55" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Own 22</text>
          <text x="200" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Own half</text>
          <text x="380" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Opp half</text>
          <text x="540" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Opp 22</text>
          {/* Won markers */}
          <circle cx="60" cy="80" r="14" fill="#10B981" opacity="0.7" />
          <text x="60" y="84" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">8</text>
          <circle cx="200" cy="120" r="18" fill="#10B981" opacity="0.7" />
          <text x="200" y="124" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">14</text>
          <circle cx="380" cy="80" r="16" fill="#10B981" opacity="0.7" />
          <text x="380" y="84" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">11</text>
          <circle cx="540" cy="160" r="12" fill="#10B981" opacity="0.7" />
          <text x="540" y="164" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">6</text>
          {/* Lost markers */}
          <circle cx="150" cy="180" r="9"  fill="#EF4444" opacity="0.7" />
          <text x="150" y="183" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">3</text>
          <circle cx="250" cy="60"  r="7"  fill="#EF4444" opacity="0.7" />
          <text x="250" y="63" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">2</text>
          <circle cx="430" cy="200" r="10" fill="#EF4444" opacity="0.7" />
          <text x="430" y="203" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">4</text>
        </svg>
      </Card>
    </div>
  )
}

// ─── TRAINING PLANNER VIEW ────────────────────────────────────────────────────
type TrainingSession = { time: string; title: string; group: string; note?: string }
const WEEK_PLAN: { day: string; label: string; sessions: TrainingSession[]; accent: string }[] = [
  { day: 'Mon', label: 'Monday',   accent: 'purple', sessions: [{ time: '09:00', title: 'Gym & S&C', group: 'Full squad' }] },
  { day: 'Tue', label: 'Tuesday',  accent: 'purple', sessions: [
    { time: '10:00', title: 'Tactical — attack patterns', group: 'Full squad' },
    { time: '13:00', title: 'Set piece', group: 'Forwards', note: 'ACWR flag — see alert' },
  ] },
  { day: 'Wed', label: 'Wednesday', accent: 'blue',   sessions: [{ time: '—', title: 'Recovery & analysis only', group: 'Full squad' }] },
  { day: 'Thu', label: 'Thursday',  accent: 'purple', sessions: [{ time: '11:00', title: "Captain's run", group: 'Full squad' }] },
  { day: 'Fri', label: 'Friday',    accent: 'amber',  sessions: [{ time: 'AM',     title: 'Travel + pre-match prep', group: 'Matchday 23' }] },
  { day: 'Sat', label: 'Saturday',  accent: 'red',    sessions: [{ time: '15:00', title: 'MATCH DAY — Bath RFC (A)', group: 'Matchday 23' }] },
  { day: 'Sun', label: 'Sunday',    accent: 'green',  sessions: [{ time: '—', title: 'Rest / recovery', group: 'Full squad' }] },
]

function TrainingPlannerView() {
  const [groupFilter, setGroupFilter] = useState<'All' | 'Forwards' | 'Backs'>('All')
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Training Planner" subtitle="Weekly schedule — Mon–Sun with position group splits" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['All', 'Forwards', 'Backs'] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${groupFilter === g ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 bg-[#0a0c14] text-gray-400 hover:border-gray-700'}`}>
              {g}
            </button>
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500">+ Add Session</button>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-300">
        ⚠ Load monitoring alert — Tuesday double session may spike ACWR for front row. Consider splitting the tactical block.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {WEEK_PLAN.map(d => (
          <Card key={d.day}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 text-${d.accent}-400`}>{d.label}</div>
            <div className="space-y-2">
              {d.sessions.map((s, i) => (
                <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2">
                  <div className="text-[10px] text-gray-500">{s.time}</div>
                  <div className="text-xs text-white font-medium leading-tight">{s.title}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{s.group}</div>
                  {s.note && <div className="text-[10px] text-amber-400 mt-1">⚠ {s.note}</div>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── AI HALFTIME BRIEF VIEW ──────────────────────────────────────────────────
function AIHalftimeBriefView({ club }: { club: RugbyClub }) {
  const [brief, setBrief] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const MATCH = { opponent: 'Jersey Reds', score: '7–10', venue: 'Home', minute: 40 };
  const GPS_HT = {
    distanceKm: 52.4, hiRunningM: 4820, sprints: 94, avgACWR: 1.22,
    flagged: [
      { name: 'Danny Foley', issue: 'ACWR 1.38 — pre-overload', action: 'Reduce contact minutes 2nd half' },
      { name: 'Luke Barnes', issue: 'ACWR 1.52 — overload zone', action: 'Priority sub candidate 55–60 min' },
      { name: 'Karl Foster', issue: 'ACWR 1.44 — manage zone', action: 'Monitor — limit breakdown work' },
    ],
  };
  const FS = {
    scrums:{won:3,lost:2,penAgainst:2},lineouts:{won:7,lost:1,successPct:87},
    rucks:{won:38,lost:6,slowBall:9},tackles:{made:84,missed:12,missRate:12.5},
    territory:{oppHalf:62},carries:{gainLine:22,lostGainLine:11,lineBreaks:3},
  };

  const generate = async () => {
    setLoading(true); setBrief(null);
    try {
      const res = await fetch('/api/ai/rugby', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are the AI performance analyst for ${club.name}, a Championship Rugby club.
Generate a structured AI Halftime Brief for the Head Coach's iPad. Match: ${club.name} ${MATCH.score} ${MATCH.opponent} (HT).

GPS DATA (first 40 minutes):
- Team distance: ${GPS_HT.distanceKm}km | HI running: ${GPS_HT.hiRunningM}m | Sprints: ${GPS_HT.sprints}
- Team avg ACWR: ${GPS_HT.avgACWR} (amber)
- Load flags: ${GPS_HT.flagged.map(f=>`${f.name} (${f.issue})`).join(', ')}

FRAMESPORTS VIDEO TAGS:
- Scrums: ${FS.scrums.won}W/${FS.scrums.lost}L | ${FS.scrums.penAgainst} pen against
- Lineouts: ${FS.lineouts.successPct}% (${FS.lineouts.won}/${FS.lineouts.won+FS.lineouts.lost})
- Rucks: ${FS.rucks.won}W/${FS.rucks.lost}L | ${FS.rucks.slowBall} slow ball
- Tackles: ${FS.tackles.made} made / ${FS.tackles.missed} missed (${FS.tackles.missRate}% miss rate)
- Territory: ${FS.territory.oppHalf}% in opposition half
- Carries: ${FS.carries.gainLine}W gainline / ${FS.carries.lostGainLine}L / ${FS.carries.lineBreaks} line breaks

Generate brief in exactly this format:
## 🔴 SCOREBOARD
One sentence on match state and urgency.
## 📡 PHYSICAL (GPS)
3–4 bullet points on load data. Name flagged players and actions.
## 🏉 SET PIECE
Bullet points on scrum and lineout. What works, what must change.
## ⚔️ CONTACT & BREAKDOWN
Tackle miss rate, ruck speed, gainline — tactical meaning.
## 🎯 3 HALF-TIME ADJUSTMENTS
Numbered list. Specific, actionable. 90 seconds to read.
## 🔄 SUBSTITUTION CALL
1–2 subs with exact reasoning — GPS load + position + game state.
## 💬 TEAM TALK (30 seconds)
One short paragraph. Direct. No clichés.
Keep under 400 words.` }]
        })
      });
      const data = await res.json();
      setBrief(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error generating brief.');
    } catch { setBrief('Connection error. Check API.'); }
    setLoading(false);
  };

  const renderBrief = (text: string) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;
    if (line.match(/^\d\./)) return <div key={i} className="flex gap-2 text-xs text-gray-300 mb-1.5"><span className="text-purple-400 flex-shrink-0 font-bold">{line[0]}.</span><span>{line.slice(2)}</span></div>;
    if (line.startsWith('- ')) return <div key={i} className="flex gap-2 text-xs text-gray-300 mb-1"><span className="text-purple-500 flex-shrink-0 mt-0.5">•</span><span>{line.slice(2)}</span></div>;
    if (line.trim()==='') return <div key={i} className="h-1"/>;
    return <p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;
  });

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤖" title="AI Halftime Brief" subtitle="GPS + FrameSports video tags + Claude API → Head Coach iPad in under 4 minutes"/>
      <div className="bg-gradient-to-r from-purple-900/30 to-gray-900/20 border border-purple-600/30 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[{l:'Score',v:`${club.name} ${MATCH.score} ${MATCH.opponent}`},{l:'Venue',v:MATCH.venue},{l:'Minute',v:`${MATCH.minute}' (HT)`},{l:'Team ACWR',v:`${GPS_HT.avgACWR} — Amber`}].map((d,i)=>(
            <div key={i}><div className="text-gray-500">{d.l}</div><div className="text-white font-semibold mt-0.5">{d.v}</div></div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📡 GPS — First Half</div>
          {[{label:'Distance',us:`${GPS_HT.distanceKm}km`,bench:'54km bench'},{label:'HI Running',us:`${GPS_HT.hiRunningM}m`,bench:'5,100m bench'},{label:'Sprints',us:`${GPS_HT.sprints}`,bench:'105 bench'}].map((r,i)=>(
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.label}</span><div className="text-right"><span className="text-white font-medium">{r.us}</span><span className="text-gray-600 ml-2">{r.bench}</span></div></div>
          ))}
        </Card>
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🎬 FrameSports Tags</div>
          {[{label:'Scrum',v:`${FS.scrums.won}W ${FS.scrums.lost}L — ${FS.scrums.penAgainst} pen`,color:'text-red-400'},{label:'Lineout',v:`${FS.lineouts.successPct}% (${FS.lineouts.won}/${FS.lineouts.won+FS.lineouts.lost})`,color:'text-green-400'},{label:'Tackles missed',v:`${FS.tackles.missed} (${FS.tackles.missRate}%)`,color:'text-amber-400'},{label:'Gainline',v:`${FS.carries.gainLine}W / ${FS.carries.lostGainLine}L`,color:'text-purple-400'}].map((r,i)=>(
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.label}</span><span className={`font-medium ${r.color}`}>{r.v}</span></div>
          ))}
        </Card>
        <Card className="border-amber-600/30">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">⚠ Load Flags</div>
          <div className="space-y-2">{GPS_HT.flagged.map((f,i)=>(
            <div key={i} className="bg-[#0a0c14] border border-amber-600/20 rounded-lg p-2.5">
              <div className="text-xs font-bold text-white">{f.name}</div>
              <div className="text-[10px] text-amber-400 mt-0.5">{f.issue}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">→ {f.action}</div>
            </div>
          ))}</div>
        </Card>
      </div>
      <div>
        <button onClick={generate} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">
          {loading?<><span className="animate-spin inline-block">⟳</span> Generating brief...</>:<><span>🤖</span> Generate AI Halftime Brief</>}
        </button>
        {!brief&&!loading&&<p className="text-xs text-gray-600 mt-2">Combines GPS load + FrameSports video tags → structured coach brief in under 4 minutes.</p>}
      </div>
      {brief&&(
        <Card className="border-purple-600/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 Lumio AI Brief</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">COACHING STAFF ONLY</span></div>
            <button onClick={generate} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button>
          </div>
          <div className="divide-y divide-gray-800/40">{renderBrief(brief)}</div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Powered by Claude · Lumio Rugby · HT {MATCH.minute}&apos;</span>
            <button className="text-xs text-purple-400 hover:text-purple-300">Print for dressing room →</button>
          </div>
        </Card>
      )}
      <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
        <p className="text-xs text-purple-300"><strong>Why this is world-leading:</strong> No Championship Rugby club has a system that combines live GPS load data, FrameSports auto-tagged video (scrums, lineouts, rucks), and AI narrative into a single coaching brief delivered within 4 minutes of the halftime whistle. Lumio Rugby does this first.</p>
      </div>
    </div>
  );
}

// ─── RUGBY ROLE CONFIG ───────────────────────────────────────────────────────
const RUGBY_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; hiddenTabs: string[]; roundupChannels: 'all' | string[]; message: string | null }> = {
  player: { label: 'Player', icon: '🏉', accent: '#7C3AED', sidebar: 'all', hiddenTabs: [], roundupChannels: 'all', message: null },
  agent: { label: 'Agent', icon: '💼', accent: '#F59E0B', sidebar: ['dashboard','sponsorship','matchdayrev','contracts','agents','calendar','mediahr','stadium','activation'], hiddenTabs: ['team','dailytasks'], roundupChannels: ['agent','sponsor'], message: 'Commercial and contracts view.' },
  coach: { label: 'Coach', icon: '📋', accent: '#22C55E', sidebar: ['dashboard','dorbriefing','insights','matchday','selection','availability','gps-load','gps-heatmaps','video-analysis','match-stats','setpiece','carryanalytics','training-planner','periodisation','opposition','halftime'], hiddenTabs: ['quickwins','dontmiss'], roundupChannels: ['coach','medical'], message: 'Performance and tactical view.' },
  physio: { label: 'Physio', icon: '⚕️', accent: '#EF4444', sidebar: ['dashboard','concussion','rtp','medical','welfareaudit','mentalperformance','gps-load'], hiddenTabs: ['quickwins','dontmiss','team'], roundupChannels: ['medical'], message: 'Medical and recovery view.' },
  sponsor: { label: 'Sponsor', icon: '🤝', accent: '#F59E0B', sidebar: ['dashboard','sponsorship','mediahr','fanhub','matchdayrev'], hiddenTabs: ['quickwins','dailytasks','dontmiss','team'], roundupChannels: ['sponsor'], message: null },
}

// ─── RUGBY AI SECTION ────────────────────────────────────────────────────────
interface RugbyAISectionProps {
  context: string
  club: RugbyClub
  session: SportsDemoSession
  rugbyCode: RugbyCode
}

function RugbyAISection({ context, club, session, rugbyCode }: RugbyAISectionProps) {
  if (context !== 'dashboard') return null
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const hasGenerated = useRef(false)

  const codeLabel = 'Rugby Union'

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard: [
      `League position: #${club.leaguePosition} in ${club.league}`,
      `Cap headroom: ${fmt(club.capCeiling - club.currentSpend)} — compliant`,
      `Franchise readiness: ${club.franchiseScore}% (target 85%)`,
      `Next fixture: ${club.nextFixture} — ${club.nextFixtureDate}`,
      'Lineout success: 85% — above league avg',
    ],
    performance: [
      'Lineout retention: 85% — top 4 in Championship',
      'GPS avg ACWR: 1.22 — amber zone',
      '2 players in overload — Barnes, Foster',
      'Scrum success: 71% — needs improvement',
      'Tackle miss rate: 10% — within target (<12%)',
    ],
    medical: [
      '1 active HIA: Danny Foster — Day 8 of protocol',
      '2 injured: Briggs (shoulder), Patel (hamstring)',
      '2 GPS overload flags — rest recommended',
      'Annual screenings: 36/38 complete',
      'Mental health flags: 3 players below 6.5 threshold',
    ],
    sponsorship: [
      `Total sponsorship: ${fmt(172000)} across 5 partners`,
      'Pipeline: 2 prospects worth est. £43k',
      '1 overdue obligation — Hartfield Building Society video',
      '2 renewals due within 60 days',
      'Matchday revenue: £374k vs £400k target (94%)',
    ],
    financial: [
      `Cap spend: ${fmt(club.currentSpend)} of ${fmt(club.capCeiling)}`,
      `Headroom: ${fmt(club.capCeiling - club.currentSpend)} — GREEN`,
      'Academy credits: -£48,000 applied',
      'Effective cap charge post-credits: £2,257,000',
      'Next cap return due: 10 May (34 days)',
    ],
    default: [
      `${club.name} — ${club.league} — #${club.leaguePosition}`,
      `Code: ${codeLabel}`,
      `Squad: ${club.squadSize} players — 28 available`,
      `Franchise: ${club.franchiseScore}% — 2 RED criteria`,
      `Next: ${club.nextFixture}`,
    ],
  }

  const highlights = HIGHLIGHTS[context] ?? HIGHLIGHTS.default

  const generateSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/rugby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a club intelligence AI for ${session.clubName || club.name}, a ${codeLabel} club in ${club.league}.

Generate an AI OPERATIONAL SUMMARY for the "${context}" section.

IMPORTANT: This summary must be specifically about "${context}".
Do NOT give generic rugby advice. Be specific to this section.

Context guide:
- "dashboard" → today's priorities, urgent items, match week status
- "performance" → GPS load, ACWR, set piece stats, tackle data
- "medical" → HIA protocols, injury status, return-to-play, welfare
- "sponsorship" → obligations, renewals, pipeline, matchday revenue
- "financial" → salary cap, headroom, credits, audit status

Write 4-5 bullet points. Each starts with a relevant emoji.
Each point is a complete sentence with specific details.
Max 200 words.`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.map((b: {type:string;text?:string}) =>
        b.type === 'text' ? b.text : ''
      ).join('') || ''
      setSummary(text)
      setGenerated(true)
    } catch {
      setSummary('Unable to generate summary. Check API connection.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasGenerated.current) return
    hasGenerated.current = true
    generateSummary()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const renderSummary = (text: string) =>
    text.split('\n').filter(l => l.trim()).map((line, i) => (
      <div key={i} className="flex gap-2 text-xs text-gray-300 py-1 border-b border-gray-800/40 last:border-0">
        <span className="flex-shrink-0">{/^[\u{1F300}-\u{1FAFF}]/u.test(line) ? '' : '•'}</span>
        <span>{line}</span>
      </div>
    ))

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold text-sm">🤖 Lumio AI</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
            {context.toUpperCase()}
          </span>
        </div>
        <button onClick={generateSummary} disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50">
          {loading ? '...' : '↺ Refresh'}
        </button>
      </div>

      <div className="mb-3">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Performance Intelligence</div>
        <div className="grid grid-cols-1 gap-1">
          {highlights.map((h, i) => (
            <div key={i} className="text-xs text-gray-400 flex items-start gap-1.5 py-0.5">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-purple-400 py-3">
          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          Generating AI summary...
        </div>
      )}

      {summary && !loading && (
        <div className="pt-3 border-t border-gray-800">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">AI Operational Summary</div>
          {renderSummary(summary)}
          {generated && (
            <div className="text-[10px] text-gray-700 mt-2">Powered by Claude · Lumio Rugby</div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── RUGBY SPONSOR DASHBOARD ─────────────────────────────────────────────────
function RugbySponsorDashboard({ session, club }: { session: SportsDemoSession; club: RugbyClub }) {
  const [tab, setTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const GOLD = '#D4AF37'

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'obligations' as const, label: 'Obligations', icon: '📋' },
    { id: 'content' as const, label: 'Content', icon: '📱' },
    { id: 'events' as const, label: 'Events', icon: '🎟️' },
    { id: 'roi' as const, label: 'ROI & Reach', icon: '📈' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🤝</span>
        <div>
          <h1 className="text-xl font-bold text-white">Sponsor Portal</h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            {session.clubName || club.name} — Partnership Dashboard
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${tab === t.id ? 'text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            style={tab === t.id ? { borderColor: GOLD, color: GOLD } : {}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Partnership Value" value={fmt(85000)} sub="Shirt sponsor" color="yellow" />
            <StatCard label="Obligations Met" value="34/38" sub="Season to date" color="green" />
            <StatCard label="Matchday Events" value="4" sub="Remaining this season" color="purple" />
            <StatCard label="Est. Brand Reach" value="289k" sub="Cumulative this month" color="blue" />
          </div>
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Upcoming Matchdays</div>
            <div className="space-y-2">
              {[
                { date: 'Sat 11 Apr', match: 'vs Jersey Reds', type: 'Premiership', hospitality: '4 boxes available' },
                { date: 'Sat 25 Apr', match: 'vs Saracens', type: 'Championship', hospitality: '2 boxes available' },
                { date: 'Sat 3 May', match: 'Hartfield Building Society Day', type: 'Sponsor Event', hospitality: '40 guests confirmed' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs">
                  <div><span className="text-white font-medium">{m.match}</span> <span className="text-gray-500">— {m.date}</span></div>
                  <span className="text-gray-400">{m.hospitality}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'obligations' && (
        <div className="space-y-4">
          <Card className="border-red-600/30">
            <div className="text-sm font-semibold text-red-400 mb-2">Overdue (1)</div>
            <div className="text-xs text-gray-300">Monthly player video (March) — Due: 31 March — <span className="text-red-400 font-medium">OVERDUE</span></div>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Upcoming This Month</div>
            {[
              { obligation: 'Player appearance — Karl Foster', due: '20 April' },
              { obligation: 'Social media mention for new development', due: '15 April' },
              { obligation: 'Community match programme Q4 report', due: '30 April' },
            ].map((o, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
                <span className="text-gray-300">{o.obligation}</span>
                <span className="text-gray-500">{o.due}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'content' && (
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Content Calendar</div>
          <div className="text-xs text-gray-400">Sponsor content posts, social media mentions, and video obligations are tracked here.</div>
          <div className="mt-4 space-y-2">
            {[
              { type: 'Video', desc: 'Monthly player video — March (OVERDUE)', status: 'overdue' },
              { type: 'Social', desc: 'Smith & Sons development mention', status: 'due' },
              { type: 'Photo', desc: 'Matchday hospitality photos — Jersey Reds', status: 'upcoming' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs">
                <div><span className="text-white font-medium">{c.type}</span> — <span className="text-gray-400">{c.desc}</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${c.status === 'overdue' ? 'bg-red-600/20 text-red-400' : c.status === 'due' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-800 text-gray-500'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          {[
            { date: 'Sat 11 Apr', event: 'Fan Zone — Jersey Reds (H)', tickets: 'Free entry' },
            { date: 'Sat 3 May', event: 'Hartfield Building Society Hospitality Day', tickets: '40 guests — invite only' },
            { date: 'Sat 10 May', event: 'Season Finale vs Saracens', tickets: 'Free entry' },
            { date: 'Sun 25 May', event: 'End of Season Awards', tickets: 'Club Members+' },
          ].map((e, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{e.event}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{e.date} — {e.tickets}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'roi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Media Reach" value="289k" sub="This month" color="purple" />
            <StatCard label="Matchday Attendance" value="2,800" sub="Avg per game" color="teal" />
            <StatCard label="Social Mentions" value="23" sub="This month" color="blue" />
            <StatCard label="Positive Sentiment" value="92%" sub="Press coverage" color="green" />
          </div>
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Brand Exposure Summary</div>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Shirt visibility (TV/media)</span><span className="text-white">14 broadcasts</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Stadium signage impressions</span><span className="text-white">~48,000</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Digital/social reach</span><span className="text-white">289,000</span></div>
              <div className="flex justify-between py-1.5"><span>Hospitality guest total</span><span className="text-white">180 this season</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────
function ModalHeader({ icon, title, subtitle, onClose }: { icon: string; title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-base font-bold text-white">{title}</div>
          <div className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</div>
        </div>
      </div>
      <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">✕</button>
    </div>
  )
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: i < current ? '#22C55E' : i === current ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: i <= current ? '#fff' : '#4B5563' }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs font-semibold" style={{ color: i === current ? '#7C3AED' : i < current ? '#22C55E' : '#4B5563' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: i < current ? '#22C55E' : '#1F2937' }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── MODAL COMPONENTS ────────────────────────────────────────────────────────

function RugbyFlightFinder({ onClose, session, club }: { onClose: () => void; session: SportsDemoSession; club: RugbyClub }) {
  const [step, setStep] = useState<'configure'|'searching'|'results'|'book'>('configure')
  const [from, setFrom] = useState('London Heathrow (LHR)')
  const [to, setTo] = useState('Dublin (DUB) — European Cup')
  const [depart, setDepart] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [cabinClass, setCabinClass] = useState('Economy')
  const [passengers, setPassengers] = useState(35)
  const [results, setResults] = useState<Array<{airline:string;flightNo:string;departs:string;arrives:string;duration:string;stops:string;price:number;currency:string;score:number;badge?:string}>>([])
  const [selectedFlight, setSelectedFlight] = useState<typeof results[0] | null>(null)

  const UPCOMING = [
    { label: 'European Cup — Dublin', to: 'Dublin (DUB)', date: '2026-04-25' },
    { label: 'Challenge Cup — Toulouse', to: 'Toulouse (TLS)', date: '2026-05-10' },
    { label: 'Pre-season — Lisbon', to: 'Lisbon (LIS)', date: '2026-08-15' },
  ]

  const FALLBACK_RESULTS = [
    { airline:'British Airways', flightNo:'BA834', departs:'07:15', arrives:'08:45', duration:'1h30m', stops:'Direct', price:185, currency:'GBP', score:96, badge:'Best value' },
    { airline:'Ryanair', flightNo:'FR204', departs:'06:30', arrives:'08:00', duration:'1h30m', stops:'Direct', price:89, currency:'GBP', score:88, badge:'Cheapest' },
    { airline:'Aer Lingus', flightNo:'EI153', departs:'09:00', arrives:'10:30', duration:'1h30m', stops:'Direct', price:142, currency:'GBP', score:92, badge:'Recommended' },
    { airline:'easyJet', flightNo:'EZY442', departs:'11:45', arrives:'13:15', duration:'1h30m', stops:'Direct', price:118, currency:'GBP', score:85 },
  ]

  const searchFlights = async () => {
    setStep('searching')
    try {
      const res = await fetch('/api/ai/rugby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Find 4 ${cabinClass} class flights from ${from} to ${to} departing ${depart || 'next week'} for ${passengers} passengers (rugby squad). Return ONLY a JSON array: [{"airline":"","flightNo":"","departs":"","arrives":"","duration":"","stops":"","price":0,"currency":"GBP","score":0,"badge":""}]. Score 0-100 for value. Badge: "Best value", "Cheapest", "Recommended", or null. Realistic prices for group booking.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('') || ''
      const match = text.match(/\[[\s\S]*\]/)
      setResults(match ? JSON.parse(match[0]) : FALLBACK_RESULTS)
    } catch { setResults(FALLBACK_RESULTS) }
    setStep('results')
  }

  return (
    <>
      <ModalHeader icon="✈️" title="Smart Flight Finder" subtitle="AI searches flights for squad travel" onClose={onClose} />
      {step !== 'searching' && <StepIndicator steps={['Configure','Search','Results','Book']} current={['configure','searching','results','book'].indexOf(step)} />}
      <div className="p-6 space-y-4">
        {step === 'configure' && (
          <>
            <div className="text-xs text-gray-500 mb-2">Quick select — upcoming fixtures:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {UPCOMING.map(u => (
                <button key={u.label} onClick={() => { setTo(u.to); setDepart(u.date) }}
                  className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-purple-500/50 transition-all">
                  {u.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">From</label><input value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">To</label><input value={to} onChange={e => setTo(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Depart</label><input type="date" value={depart} onChange={e => setDepart(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Return</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Class</label><select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"><option>Economy</option><option>Premium</option><option>Business</option></select></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Passengers</label><input type="number" value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
            </div>
            <button onClick={searchFlights} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all">Search Flights</button>
          </>
        )}
        {step === 'searching' && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-purple-400 font-medium">Searching airlines...</div>
            <div className="text-xs text-gray-500 mt-1">Checking {session.clubName || club.name} group rates</div>
          </div>
        )}
        {step === 'results' && (
          <div className="space-y-3">
            {results.map((f, i) => (
              <button key={i} onClick={() => { setSelectedFlight(f); setStep('book') }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedFlight === f ? 'border-purple-500 bg-purple-600/10' : 'border-gray-800 hover:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{f.airline}</span>
                  <div className="flex items-center gap-2">
                    {f.badge && <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400">{f.badge}</span>}
                    <span className="text-lg font-bold text-white">£{f.price}<span className="text-xs text-gray-500">/pp</span></span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{f.flightNo} · {f.departs}→{f.arrives} · {f.duration} · {f.stops}</div>
              </button>
            ))}
          </div>
        )}
        {step === 'book' && selectedFlight && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-bold text-white mb-1">{selectedFlight.airline} — {selectedFlight.flightNo}</div>
            <div className="text-sm text-gray-400">{selectedFlight.departs} → {selectedFlight.arrives} · {passengers} passengers</div>
            <div className="text-xl font-bold text-purple-400 mt-3">£{selectedFlight.price * passengers} total</div>
            <div className="text-xs text-gray-500 mt-1">Group booking reference would be generated here</div>
            <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white">Done</button>
          </div>
        )}
      </div>
    </>
  )
}

function RugbyMatchPrepAI({ onClose, club }: { onClose: () => void; club: RugbyClub }) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/rugby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `Generate a 250-word opposition analysis brief for ${club.name} vs Jersey Reds (${club.nextFixtureDate}). Include: set piece stats, key threats, tactical recommendations. Be specific and data-driven.` }]
        })
      })
      const data = await res.json()
      setBrief(data.content?.[0]?.text || 'Generation failed.')
    } catch { setBrief('Error connecting to AI service.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🏉" title="Match Prep AI" subtitle="Opposition analysis brief" onClose={onClose} />
      <div className="p-6 space-y-4">
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white">
          {loading ? 'Generating...' : 'Generate Opposition Brief'}
        </button>
        {brief && <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{brief}</div>}
      </div>
    </>
  )
}

function RugbySponsorPost({ onClose, session, club }: { onClose: () => void; session: SportsDemoSession; club: RugbyClub }) {
  const [post, setPost] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sponsor, setSponsor] = useState('Hartfield Building Society')

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/rugby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 500,
          messages: [{ role: 'user', content: `Write a social media sponsor post for ${session.clubName || club.name} featuring ${sponsor}. Make it authentic, professional, and suitable for Instagram/Twitter. Include relevant hashtags. Max 150 words.` }]
        })
      })
      const data = await res.json()
      setPost(data.content?.[0]?.text || 'Generation failed.')
    } catch { setPost('Error connecting to AI service.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="📱" title="Sponsor Post Generator" subtitle="AI writes authentic sponsor content" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Sponsor</label>
          <select value={sponsor} onChange={e => setSponsor(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none">
            {SPONSORS.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white">
          {loading ? 'Generating...' : 'Generate Post'}
        </button>
        {post && <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-xs text-gray-300 whitespace-pre-wrap">{post}</div>}
      </div>
    </>
  )
}

function RugbyInjuryLogger({ onClose }: { onClose: () => void }) {
  const [bodyPart, setBodyPart] = useState('')
  const [severity, setSeverity] = useState('mild')
  const [notifyPhysio, setNotifyPhysio] = useState(true)
  const [logged, setLogged] = useState(false)

  const BODY_PARTS = ['Head / Concussion', 'Neck', 'Shoulder', 'Chest / Ribs', 'Back', 'Hip / Groin', 'Knee (ACL/MCL)', 'Ankle', 'Hamstring', 'Quadricep', 'Calf', 'Foot', 'Wrist / Hand', 'Elbow']

  return (
    <>
      <ModalHeader icon="⚕️" title="Log Injury" subtitle="Log and auto-notify the physio team" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!logged ? (
          <>
            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-2 block">Body Part</label>
              <div className="grid grid-cols-3 gap-2">
                {BODY_PARTS.map(bp => (
                  <button key={bp} onClick={() => setBodyPart(bp)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all ${bodyPart === bp ? 'border-red-500 bg-red-600/10 text-red-400' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                    {bp}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-2 block">Severity</label>
              <div className="flex gap-2">
                {['mild','moderate','severe'].map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-all ${severity === s ? (s === 'severe' ? 'border-red-500 bg-red-600/10 text-red-400' : s === 'moderate' ? 'border-amber-500 bg-amber-600/10 text-amber-400' : 'border-green-500 bg-green-600/10 text-green-400') : 'border-gray-800 text-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={notifyPhysio} onChange={e => setNotifyPhysio(e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-400">Notify physio team immediately</span>
            </div>
            <button onClick={() => setLogged(true)} disabled={!bodyPart}
              className="w-full py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white">
              Log Injury
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-bold text-white">Injury Logged</div>
            <div className="text-xs text-gray-400 mt-1">{bodyPart} — {severity}</div>
            {notifyPhysio && <div className="text-xs text-green-400 mt-2">Physio team notified</div>}
            <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white">Done</button>
          </div>
        )}
      </div>
    </>
  )
}

function RugbyExpenseLogger({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Travel')
  const [note, setNote] = useState('')
  const [logged, setLogged] = useState(false)

  return (
    <>
      <ModalHeader icon="🧾" title="Log Expense" subtitle="Quick expense logging" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!logged ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Amount (GBP)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"><option>Travel</option><option>Accommodation</option><option>Equipment</option><option>Medical</option><option>Nutrition</option><option>Other</option></select></div>
            </div>
            <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Note</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="Description..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" /></div>
            <button onClick={() => setLogged(true)} disabled={!amount} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white">Log Expense</button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-bold text-white">Expense Logged</div>
            <div className="text-xs text-gray-400 mt-1">£{amount} — {category}</div>
            <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white">Done</button>
          </div>
        )}
      </div>
    </>
  )
}

function RugbyVideoAnalysis({ onClose }: { onClose: () => void }) {
  return (
    <>
      <ModalHeader icon="🎬" title="Video Analysis" subtitle="Tag and review match footage" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎬</div>
          <div className="text-lg font-bold text-white">Video Analysis</div>
          <div className="text-xs text-gray-400 mt-2">Session tagging and clip review tools.</div>
          <div className="text-xs text-purple-400 mt-4">Coming soon — AI auto-tagging for scrums, lineouts, rucks and tackles.</div>
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-gray-800 text-gray-300">Close</button>
      </div>
    </>
  )
}

function RugbyContractCheck({ onClose, club }: { onClose: () => void; club: RugbyClub }) {
  const expiring = SQUAD.filter(p => p.contractEnd.includes('2026'))
  return (
    <>
      <ModalHeader icon="📋" title="Contract Status" subtitle="Quick contract overview" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Squad" value={club.squadSize} color="purple" />
          <StatCard label="Expiring" value={expiring.length} sub="This season" color="red" />
          <StatCard label="Loans" value="5" sub="3 in, 2 out" color="blue" />
        </div>
        <div className="text-xs font-semibold text-white mb-2">Expiring Contracts</div>
        {expiring.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
            <span className="text-gray-200">{p.name} — {p.pos}</span>
            <span className="text-red-400">{p.contractEnd}</span>
          </div>
        ))}
        <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-gray-800 text-gray-300">Close</button>
      </div>
    </>
  )
}

function RugbyVisaCheck({ onClose }: { onClose: () => void }) {
  return (
    <>
      <ModalHeader icon="🌍" title="Visa Check" subtitle="Requirements for away fixtures" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="text-xs text-gray-500 mb-3">European Cup and Challenge Cup fixture visa requirements:</div>
        {[
          { dest: 'Dublin, Ireland', req: 'No visa required (CTA)', status: 'ok' },
          { dest: 'Toulouse, France', req: 'No visa required (EU travel)', status: 'ok' },
          { dest: 'Cape Town, South Africa', req: 'Visa on arrival (30 days)', status: 'check' },
          { dest: 'Lisbon, Portugal', req: 'No visa required (EU travel)', status: 'ok' },
        ].map((v, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs">
            <div>
              <div className="text-white font-medium">{v.dest}</div>
              <div className="text-gray-500 mt-0.5">{v.req}</div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${v.status === 'ok' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>
              {v.status === 'ok' ? 'Clear' : 'Check required'}
            </span>
          </div>
        ))}
        <div className="text-[10px] text-gray-600">Note: Non-British passport holders may have additional requirements. Check with club admin.</div>
        <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-gray-800 text-gray-300">Close</button>
      </div>
    </>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function RugbyPortalPage() {
  return (
    <SportsDemoGate
      sport="rugby"
      accentColor="#7C3AED"
      sportLabel="Rugby"
      defaultClubName="Hartfield RFC"
      roles={RUGBY_ROLES}
    >
      {(session) => <RugbyPortalInner session={session} />}
    </SportsDemoGate>
  )
}

// ─── PRE-SEASON CAMP MODE ─────────────────────────────────────────────────────
// Static pre-season AI content used in demo shells to avoid two live
// /api/ai/rugby hits when a user activates the camp. Persona: Hartfield RFC
// Director of Rugby / Head Coach brief.
const DEMO_RUGBY_PRESEASON_SUMMARY = `1. Squad fitness — 24 of 26 players through the bleep test above 13.5, two flagged for monitoring this week.
2. Contact readiness — live tackle sessions start Monday; scrum prep drills show front-row cohesion at 78%, up from 64% last week.
3. Scrum + lineout — lineout accuracy 86% over the last ten sessions; scrum penalty conceded rate down to one every 6.1 attempts.
4. Injuries — two long-term knees (Ellis, Grant) both tracking on timeline; Wilson (calf), Moore (shoulder), Porter (hamstring) all expected back this week.
5. Key players — Patel and Ellis leading the fitness stats; Whitmore's handling sessions have lifted the backs' offload count by 18%.
6. Watch-out — contact loading has been conservative to protect the knee group; next week's sessions spike loads, physio briefed to monitor acutely.`

const DEMO_RUGBY_PRESEASON_HIGHLIGHTS = `🏋️ Bleep-test re-ups for the two flagged players — book Tuesday before live contact starts.
⚕️ Physio-led knee-management session for Ellis + Grant — 90 min, Wednesday before squad trains.
🛡️ Scrum live-fire session with external coach — lock in Thursday morning, front-row full intensity.
🎯 Lineout throwing + caller work with Whitmore — three 30-min drills across the week.
🔄 Recovery protocol spike — load jumps 15% from Monday, schedule ice and nutrition review before the weekend.`

function PreSeasonView({ club, session }: { club: RugbyClub; session?: SportsDemoSession }) {
  const [campActive, setCampActive] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [campConfig, setCampConfig] = useState<{ openerDate: string; opposition: string; squadSize: number; formation: string; activatedAt: string } | null>(null)

  // Activation form
  const [openerDate, setOpenerDate] = useState('')
  const [opposition, setOpposition] = useState('')
  const [squadSize, setSquadSize] = useState(35)
  const [formation, setFormation] = useState('4-3-1')

  // Active state
  const [dailyChecklist, setDailyChecklist] = useState<boolean[]>([false,false,false,false,false,false,false,false])
  const [fitnessTests] = useState([
    { name: 'Bleep Test', target: 'Level 13', status: 'In Progress' },
    { name: 'Sprint 40m', target: '<5.0s', status: 'Passed' },
    { name: 'GPS Load/session', target: '9km', status: 'Below target' },
    { name: 'Tackle/Contact Load', target: '40 contacts/session', status: 'In Progress' },
    { name: 'Recovery Score HRV', target: '>80', status: 'In Progress' },
  ])
  const [gpsLoad, setGpsLoad] = useState(34)
  const [friendlyMatches, setFriendlyMatches] = useState([{ opponent: 'Riverside RFC', result: 'W 24-17', date: '2026-07-12' }])
  const [setPieceBoard, setSetPieceBoard] = useState<boolean[]>([false,false,false,false,false])
  const [opponentStudy] = useState([
    { area: 'Scrum dominance', note: 'Strong tighthead — target loosehead' },
    { area: 'Lineout', note: 'Predictable at front — disrupt with lift timing' },
    { area: 'Defensive line', note: 'Drift defence — attack inside channels' },
    { area: 'Kicking game', note: 'Fullback weak under high ball' },
    { area: 'Discipline', note: 'Average 12 penalties/game — keep pressure' },
    { area: 'Set piece attack', note: 'Crash ball off 10 — read and blitz' },
  ])
  const [readinessScore, setReadinessScore] = useState(58)
  const [aiSummary, setAiSummary] = useState('')
  const [aiHighlights, setAiHighlights] = useState('')
  const hasGenerated = useRef(false)

  // ── TRAINING CAMP STATE ──
  const CAMP_KEY = 'lumio_rugby_training_camp'
  const [showCampModal, setShowCampModal] = useState(false)
  const [trainingCamp, setTrainingCamp] = useState<{name:string;departure:string;returnDate:string;destination:string;squadSize:number;budget:number;activatedAt:string}|null>(() => {
    try { const s = localStorage.getItem(CAMP_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [campSchedule, setCampSchedule] = useState<Array<{day:number;date:string;am:string;pm:string;eve:string}>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_schedule'); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [kitChecklist, setKitChecklist] = useState<Record<string,boolean>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_kit'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [campBudget, setCampBudget] = useState<Record<string,number>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_budget'); return s ? JSON.parse(s) : {flights:0,accommodation:0,meals:0,facility:0,misc:0} } catch { return {flights:0,accommodation:0,meals:0,facility:0,misc:0} }
  })
  const [campContent, setCampContent] = useState<Record<string,boolean>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_content'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [venueResults, setVenueResults] = useState<string|null>(null)
  const [venueLoading, setVenueLoading] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<string|null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string,boolean>>({venue:true,schedule:true,kit:false,budget:false,content:false})

  // Training camp form state
  const [campForm, setCampForm] = useState({name:'',departure:'',returnDate:'',destination:'',squadSize:35,budget:25000})

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))

  const activateTrainingCamp = () => {
    if (!campForm.name || !campForm.departure || !campForm.returnDate || !campForm.destination) return
    const camp = { ...campForm, activatedAt: new Date().toISOString() }
    localStorage.setItem(CAMP_KEY, JSON.stringify(camp))
    setTrainingCamp(camp)
    setShowCampModal(false)
    // Generate schedule
    const dep = new Date(campForm.departure)
    const ret = new Date(campForm.returnDate)
    const days = Math.max(1, Math.ceil((ret.getTime() - dep.getTime()) / 86400000)) + 1
    const amDefaults = ["Fitness testing", "Scrums & lineouts", "Contact drills", "Double session", "Match simulation"]
    const pmDefaults = ["Recovery & gym", "Video analysis", "Skills & handling", "Rest", "Friendly match"]
    const sched = Array.from({length: days}, (_, i) => {
      const d = new Date(dep); d.setDate(d.getDate() + i)
      return { day: i+1, date: d.toISOString().split('T')[0], am: amDefaults[i % amDefaults.length], pm: pmDefaults[i % pmDefaults.length], eve: i === 0 ? 'Team dinner' : i === days-1 ? 'Awards night' : 'Free time' }
    })
    setCampSchedule(sched)
    localStorage.setItem(CAMP_KEY + '_schedule', JSON.stringify(sched))
  }

  const findVenues = () => {
    if (!trainingCamp) return
    setVenueLoading(true)
    fetch('/api/ai/rugby', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Suggest 3 rugby training camp venues near ${trainingCamp.destination} for a squad of ${trainingCamp.squadSize}. Requirements: Full size grass pitch, gym, pool, video analysis room, medical room. For each venue give: name, location, facilities, estimated cost per night, and a one-line verdict. Format as numbered list.` }] })
    }).then(r => r.json()).then(d => setVenueResults(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setVenueResults('Unable to generate.')).finally(() => setVenueLoading(false))
  }

  const generateContentIdeas = () => {
    if (!trainingCamp) return
    setContentLoading(true)
    fetch('/api/ai/rugby', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Generate 5 social media content ideas for a rugby team's training camp in ${trainingCamp.destination}. Include: behind-the-scenes, player challenges, sponsor integration opportunities, fan engagement, and match-day build-up. One line each with emoji.` }] })
    }).then(r => r.json()).then(d => setContentIdeas(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setContentIdeas('Unable to generate.')).finally(() => setContentLoading(false))
  }

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lumio_rugby_preseason')
      if (stored) {
        const config = JSON.parse(stored)
        setCampConfig(config)
        setCampActive(true)
      }
    } catch { /* ignore */ }
    try {
      const cl = localStorage.getItem('lumio_rugby_preseason_checklist')
      if (cl) setDailyChecklist(JSON.parse(cl))
    } catch { /* ignore */ }
    try {
      const sp = localStorage.getItem('lumio_rugby_setpiece')
      if (sp) setSetPieceBoard(JSON.parse(sp))
    } catch { /* ignore */ }
  }, [])

  // Phase calculations
  const daysToOpener = campConfig ? Math.max(0, Math.ceil((new Date(campConfig.openerDate).getTime() - Date.now()) / 86400000)) : 0
  const campLength = campConfig ? Math.max(1, Math.ceil((new Date(campConfig.openerDate).getTime() - new Date(campConfig.activatedAt).getTime()) / 86400000)) : 1
  const campProgress = Math.round(((campLength - daysToOpener) / campLength) * 100)
  const phase = campProgress < 33 ? 'Fitness Block' : campProgress < 66 ? 'Contact Block' : 'Match Sharpness'
  const phaseColor = phase === 'Fitness Block' ? '#3B82F6' : phase === 'Contact Block' ? '#F59E0B' : '#22C55E'

  // AI auto-generate — gated on demo shells (static fallback)
  useEffect(() => {
    if (!campActive || !campConfig || hasGenerated.current) return
    hasGenerated.current = true
    if (session?.isDemoShell !== false) {
      setAiSummary(DEMO_RUGBY_PRESEASON_SUMMARY)
      setAiHighlights(DEMO_RUGBY_PRESEASON_HIGHLIGHTS)
      return
    }
    fetch('/api/ai/rugby', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Generate a rugby pre-season AI summary for a coach. Camp details: opening fixture vs ${campConfig.opposition}, ${daysToOpener} days remaining, ${phase} phase, squad of ${campConfig.squadSize}. 6 bullet points covering: squad fitness, contact readiness, scrum/lineout progress, injury concerns, key players, one watch-out. Be specific. Max 200 words.` }] })
    }).then(r => r.json()).then(d => setAiSummary(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setAiSummary('Unable to generate.'))
    fetch('/api/ai/rugby', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Generate 5 urgent pre-season action items for a rugby coach, ${daysToOpener} days from opener vs ${campConfig.opposition} in ${phase} phase. Cover: fitness gaps, contact load, set piece issues, squad balance, recovery. Start each with an emoji.` }] })
    }).then(r => r.json()).then(d => setAiHighlights(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setAiHighlights('Unable to generate.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campActive])

  // Checklist readiness bonus
  useEffect(() => {
    const allDone = dailyChecklist.every(Boolean)
    if (allDone) setReadinessScore(prev => Math.min(100, prev + 2))
  }, [dailyChecklist])

  const activateCamp = () => {
    if (!openerDate || !opposition) return
    const config = { openerDate, opposition, squadSize, formation, activatedAt: new Date().toISOString() }
    localStorage.setItem('lumio_rugby_preseason', JSON.stringify(config))
    setCampConfig(config)
    setCampActive(true)
    setShowActivateModal(false)
  }

  const deactivateCamp = () => {
    localStorage.removeItem('lumio_rugby_preseason')
    localStorage.removeItem('lumio_rugby_preseason_checklist')
    localStorage.removeItem('lumio_rugby_setpiece')
    setCampActive(false)
    setCampConfig(null)
    hasGenerated.current = false
    setAiSummary('')
    setAiHighlights('')
  }

  const toggleChecklist = (i: number) => {
    const next = [...dailyChecklist]
    next[i] = !next[i]
    setDailyChecklist(next)
    localStorage.setItem('lumio_rugby_preseason_checklist', JSON.stringify(next))
  }

  const toggleSetPiece = (i: number) => {
    const next = [...setPieceBoard]
    next[i] = !next[i]
    setSetPieceBoard(next)
    localStorage.setItem('lumio_rugby_setpiece', JSON.stringify(next))
  }

  const checklistItems = [
    'Morning fitness / GPS session',
    'Scrums & lineout practice',
    'Contact / tackle drills',
    'Skills & handling',
    'Small-sided games',
    'Recovery / ice bath',
    'Video analysis',
    'Nutrition & hydration logged',
  ]

  const setPieceItems = [
    'Scrum shape drilled',
    'Lineout calls agreed',
    'Defensive patterns set',
    'Attacking phases rehearsed',
    'Kick game strategy locked',
  ]

  const readinessCategories = [
    { label: 'Fitness Base', score: 69 },
    { label: 'Contact Readiness', score: 54 },
    { label: 'Set Pieces', score: 61 },
    { label: 'Squad Depth', score: 74 },
    { label: 'Match Sharpness', score: 47 },
    { label: 'Injury Status', score: 78 },
  ]

  const catColor = (s: number) => s > 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444'
  const catWarning = (s: number) => s < 60

  // ── INACTIVE STATE ──
  if (!campActive) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="text-7xl mb-6">🏉</div>
        <h1 className="text-3xl font-black text-white mb-2">Pre-Season Camp Mode</h1>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>Build the base. Hit the contact. Win the season.</p>
        <button onClick={() => setShowActivateModal(true)}
          className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
          style={{ backgroundColor: '#F59E0B' }}>
          Activate Pre-Season
        </button>

        {/* Activate Modal */}
        {showActivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-2xl p-8 w-full max-w-md text-left" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <h2 className="text-xl font-bold text-white mb-6">Activate Pre-Season Camp</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Season Opener Date</label>
                  <input type="date" value={openerDate} onChange={e => setOpenerDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Opposition (Opening Fixture)</label>
                  <input type="text" value={opposition} onChange={e => setOpposition(e.target.value)} placeholder="e.g. Northside RFC"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Squad Size</label>
                  <input type="number" value={squadSize} onChange={e => setSquadSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Formation</label>
                  <select value={formation} onChange={e => setFormation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                    <option value="4-3-1">4-3-1</option>
                    <option value="4-2-2">4-2-2</option>
                    <option value="3-4-1">3-4-1</option>
                    <option value="3-3-2">3-3-2</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowActivateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
                <button onClick={activateCamp}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>Activate Camp</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── ACTIVE STATE ──
  return (
    <div className="space-y-6">
      {/* Header + Deactivate */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            🏉 Pre-Season Camp
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: phaseColor }}>{phase}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {campConfig?.opposition} · {daysToOpener} days to opener · {campConfig?.squadSize}-man squad · {campConfig?.formation}
          </p>
        </div>
        <button onClick={deactivateCamp}
          className="px-4 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          Deactivate Camp
        </button>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Camp Progress</span>
          <span className="text-xs font-bold" style={{ color: phaseColor }}>{campProgress}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, campProgress)}%`, backgroundColor: phaseColor }} />
        </div>
      </div>

      {/* AI Section — Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🤖 AI Camp Summary</h3>
          {aiSummary ? (
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#D1D5DB' }}>{aiSummary}</p>
          ) : (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
              <span className="animate-spin">⏳</span> Generating summary...
            </div>
          )}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🔥 Action Items</h3>
          {aiHighlights ? (
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#D1D5DB' }}>{aiHighlights}</p>
          ) : (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
              <span className="animate-spin">⏳</span> Generating highlights...
            </div>
          )}
        </div>
      </div>

      {/* Squad Readiness Score */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-4">Squad Readiness Score</h3>
        <div className="text-center mb-6">
          <div className="text-6xl font-black" style={{ color: catColor(readinessScore) }}>{readinessScore}</div>
          <div className="text-xs mt-1" style={{ color: '#6B7280' }}>out of 100</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {readinessCategories.map(cat => (
            <div key={cat.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0D0F17', border: `1px solid ${catColor(cat.score)}30` }}>
              <div className="text-2xl font-black" style={{ color: catColor(cat.score) }}>
                {cat.score}{catWarning(cat.score) && <span className="ml-1 text-sm">⚠️</span>}
              </div>
              <div className="text-[10px] font-medium mt-1" style={{ color: '#9CA3AF' }}>{cat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Training Checklist */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Daily Training Checklist</h3>
        <div className="space-y-2">
          {checklistItems.map((item, i) => (
            <button key={i} onClick={() => toggleChecklist(i)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
              style={{ backgroundColor: dailyChecklist[i] ? 'rgba(34,197,94,0.08)' : '#0D0F17', border: `1px solid ${dailyChecklist[i] ? 'rgba(34,197,94,0.2)' : '#1F2937'}` }}>
              <span className="text-sm">{dailyChecklist[i] ? '✅' : '⬜'}</span>
              <span className="text-xs" style={{ color: dailyChecklist[i] ? '#22C55E' : '#9CA3AF', textDecoration: dailyChecklist[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
          ))}
        </div>
        {dailyChecklist.every(Boolean) && (
          <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
            All tasks complete — +2 readiness bonus applied
          </div>
        )}
      </div>

      {/* Fitness Testing Tracker */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Fitness Testing Tracker</h3>
        <div className="space-y-2">
          {fitnessTests.map((test, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#0D0F17', border: '1px solid #1F2937' }}>
              <div>
                <div className="text-xs font-medium text-white">{test.name}</div>
                <div className="text-[10px]" style={{ color: '#6B7280' }}>Target: {test.target}</div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                backgroundColor: test.status === 'Passed' ? 'rgba(34,197,94,0.15)' : test.status === 'Below target' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                color: test.status === 'Passed' ? '#22C55E' : test.status === 'Below target' ? '#F59E0B' : '#3B82F6',
              }}>
                {test.status === 'Passed' ? '✅ Passed' : test.status === 'Below target' ? '⚠️ Below target' : '🔄 In Progress'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GPS Load Tracker */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">GPS Load Tracker</h3>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-3xl font-black" style={{ color: gpsLoad >= 55 ? '#22C55E' : '#F59E0B' }}>{gpsLoad}km</div>
            <div className="text-[10px]" style={{ color: '#6B7280' }}>Weekly target: 55km</div>
          </div>
          <div className="flex-1">
            <div className="h-3 rounded-full" style={{ backgroundColor: '#1F2937' }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (gpsLoad / 55) * 100)}%`, backgroundColor: gpsLoad >= 55 ? '#22C55E' : '#F59E0B' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGpsLoad(Math.max(0, gpsLoad - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>-</button>
            <button onClick={() => setGpsLoad(gpsLoad + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>+</button>
          </div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#6B7280' }}>Monitor contact load alongside distance — balance collision count with recovery windows.</p>
      </div>

      {/* Friendly Matches */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Friendly Matches ({friendlyMatches.length} of 3 played)</h3>
        <div className="space-y-2">
          {friendlyMatches.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0D0F17', border: '1px solid #1F2937' }}>
              <span className="text-xs text-white font-medium">vs {m.opponent}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#6B7280' }}>{m.date}</span>
                <span className="text-xs font-bold" style={{ color: m.result.startsWith('W') ? '#22C55E' : m.result.startsWith('L') ? '#EF4444' : '#F59E0B' }}>{m.result}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setFriendlyMatches([...friendlyMatches, { opponent: 'TBC', result: 'Scheduled', date: 'TBC' }])}
          className="mt-3 w-full py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151' }}>
          + Add Friendly
        </button>
      </div>

      {/* Set Piece Readiness */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Set Piece Readiness</h3>
        <div className="space-y-2">
          {setPieceItems.map((item, i) => (
            <button key={i} onClick={() => toggleSetPiece(i)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
              style={{ backgroundColor: setPieceBoard[i] ? 'rgba(34,197,94,0.08)' : '#0D0F17', border: `1px solid ${setPieceBoard[i] ? 'rgba(34,197,94,0.2)' : '#1F2937'}` }}>
              <span className="text-sm">{setPieceBoard[i] ? '✅' : '⬜'}</span>
              <span className="text-xs" style={{ color: setPieceBoard[i] ? '#22C55E' : '#9CA3AF', textDecoration: setPieceBoard[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Opponent Study */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Opponent Study — {campConfig?.opposition}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {opponentStudy.map((item, i) => (
            <div key={i} className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#0D0F17', border: '1px solid #1F2937' }}>
              <div className="text-xs font-bold text-white">{item.area}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Camp */}
      {!trainingCamp ? (
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#0F1015', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏕️</span>
              <span className="text-sm font-bold text-white">Training Camp</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>NEW</span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Plan your squad&apos;s away camp — venue, schedule, budget and content all in one place.</p>
          <button onClick={() => setShowCampModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>Schedule Training Camp →</button>
        </div>
      ) : (
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#0F1015', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏕️</span>
              <span className="text-sm font-bold text-white">Training Camp — {trainingCamp.name}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#22C55E' }}>ACTIVE</span>
            </div>
            <button onClick={() => { localStorage.removeItem(CAMP_KEY); localStorage.removeItem(CAMP_KEY+'_schedule'); localStorage.removeItem(CAMP_KEY+'_kit'); localStorage.removeItem(CAMP_KEY+'_budget'); localStorage.removeItem(CAMP_KEY+'_content'); setTrainingCamp(null); setCampSchedule([]); setKitChecklist({}); setCampBudget({flights:0,accommodation:0,meals:0,facility:0,misc:0}); setCampContent({}); setVenueResults(null); setContentIdeas(null) }}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel Camp</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Destination</div><div className="text-xs font-bold text-white">{trainingCamp.destination}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Departure</div><div className="text-xs font-bold text-white">{trainingCamp.departure}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Return</div><div className="text-xs font-bold text-white">{trainingCamp.returnDate}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Budget</div><div className="text-xs font-bold text-white">£{trainingCamp.budget.toLocaleString()}</div></div>
          </div>

          {/* Section 1 — Venue Finder AI */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('venue')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">🤖 Venue Finder AI</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.venue ? '▾' : '▸'}</span>
            </button>
            {expandedSections.venue && (
              <div className="space-y-3 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Destination</div><input readOnly value={trainingCamp.destination} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                  <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Squad Size</div><input readOnly value={trainingCamp.squadSize} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                </div>
                <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Requirements</div><input readOnly value="Full size grass pitch, gym, pool, video analysis room, medical room" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <button onClick={findVenues} disabled={venueLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#3B82F6' }}>{venueLoading ? 'Searching...' : 'Find Venues →'}</button>
                {venueResults && <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: '#111318', color: '#D1D5DB', border: '1px solid #1F2937' }}>{venueResults}</div>}
              </div>
            )}
          </div>

          {/* Section 2 — Camp Schedule */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('schedule')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">📅 Camp Schedule</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.schedule ? '▾' : '▸'}</span>
            </button>
            {expandedSections.schedule && (
              <div className="space-y-2 pb-3">
                {campSchedule.map((day, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Day {day.day}</span>
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>{day.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>AM</div><input value={day.am} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], am: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>PM</div><input value={day.pm} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], pm: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>Evening</div><input value={day.eve} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], eve: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                    </div>
                  </div>
                ))}
                {campSchedule.length === 0 && <p className="text-xs" style={{ color: '#6B7280' }}>No schedule generated yet.</p>}
              </div>
            )}
          </div>

          {/* Section 3 — Kit & Equipment Checklist */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('kit')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">🎒 Kit & Equipment Checklist</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.kit ? '▾' : '▸'}</span>
            </button>
            {expandedSections.kit && (() => {
              const kitItems = ['Training jerseys','Shorts & socks','Boots (FG + SG)','GPS vests','Contact pads','Tackle shields','Cones & poles','Water bottles']
              const medItems = ['First aid kit','Ice machine','Strapping tape','Physio table','Resistance bands','Foam rollers','AED','Medication box']
              const allItems = [...kitItems, ...medItems]
              const checked = allItems.filter(item => kitChecklist[item]).length
              return (
                <div className="space-y-3 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-2 rounded-full transition-all" style={{ width: `${(checked/16)*100}%`, backgroundColor: checked === 16 ? '#22C55E' : '#F59E0B' }} /></div>
                    <span className="text-xs font-bold" style={{ color: checked === 16 ? '#22C55E' : '#F59E0B' }}>{checked}/16</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold mb-2" style={{ color: '#9CA3AF' }}>KIT</div>
                      {kitItems.map(item => (
                        <button key={item} onClick={() => { const next = {...kitChecklist, [item]: !kitChecklist[item]}; setKitChecklist(next); localStorage.setItem(CAMP_KEY+'_kit', JSON.stringify(next)) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] mb-1" style={{ color: kitChecklist[item] ? '#22C55E' : '#9CA3AF' }}>
                          <span>{kitChecklist[item] ? '✅' : '⬜'}</span><span style={{ textDecoration: kitChecklist[item] ? 'line-through' : 'none' }}>{item}</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold mb-2" style={{ color: '#9CA3AF' }}>MEDICAL</div>
                      {medItems.map(item => (
                        <button key={item} onClick={() => { const next = {...kitChecklist, [item]: !kitChecklist[item]}; setKitChecklist(next); localStorage.setItem(CAMP_KEY+'_kit', JSON.stringify(next)) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] mb-1" style={{ color: kitChecklist[item] ? '#22C55E' : '#9CA3AF' }}>
                          <span>{kitChecklist[item] ? '✅' : '⬜'}</span><span style={{ textDecoration: kitChecklist[item] ? 'line-through' : 'none' }}>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Section 4 — Camp Budget */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('budget')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">💰 Camp Budget</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.budget ? '▾' : '▸'}</span>
            </button>
            {expandedSections.budget && (() => {
              const items = [{key:'flights',label:'Flights'},{key:'accommodation',label:'Accommodation'},{key:'meals',label:'Meals'},{key:'facility',label:'Facility hire'},{key:'misc',label:'Misc'}]
              const total = Object.values(campBudget).reduce((a,b) => a+b, 0)
              const overBudget = total > trainingCamp.budget
              return (
                <div className="space-y-3 pb-3">
                  {items.map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="text-xs w-28" style={{ color: '#9CA3AF' }}>{item.label}</span>
                      <input type="number" value={campBudget[item.key] || 0} onChange={e => { const next = {...campBudget, [item.key]: Number(e.target.value)}; setCampBudget(next); localStorage.setItem(CAMP_KEY+'_budget', JSON.stringify(next)) }}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white text-right" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    <span className="text-xs font-bold text-white">Total</span>
                    <span className="text-sm font-black" style={{ color: overBudget ? '#EF4444' : '#22C55E' }}>£{total.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: '#6B7280' }}>/ £{trainingCamp.budget.toLocaleString()}</span></span>
                  </div>
                  {overBudget && <div className="text-[10px] px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Over budget by £{(total - trainingCamp.budget).toLocaleString()}</div>}
                </div>
              )
            })()}
          </div>

          {/* Section 5 — Content & Sponsor Planner */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('content')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">📸 Content & Sponsor Planner</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.content ? '▾' : '▸'}</span>
            </button>
            {expandedSections.content && (() => {
              const contentSlots = ['Behind-the-scenes training reel','Player challenge video','Sponsor integration post','Fan Q&A / live session','Match-day build-up content']
              return (
                <div className="space-y-3 pb-3">
                  {contentSlots.map(slot => (
                    <button key={slot} onClick={() => { const next = {...campContent, [slot]: !campContent[slot]}; setCampContent(next); localStorage.setItem(CAMP_KEY+'_content', JSON.stringify(next)) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left" style={{ backgroundColor: campContent[slot] ? 'rgba(34,197,94,0.08)' : '#111318', border: `1px solid ${campContent[slot] ? 'rgba(34,197,94,0.2)' : '#1F2937'}` }}>
                      <span className="text-sm">{campContent[slot] ? '✅' : '⬜'}</span>
                      <span className="text-xs" style={{ color: campContent[slot] ? '#22C55E' : '#9CA3AF', textDecoration: campContent[slot] ? 'line-through' : 'none' }}>{slot}</span>
                    </button>
                  ))}
                  <button onClick={generateContentIdeas} disabled={contentLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>{contentLoading ? 'Generating...' : 'Generate Content Ideas AI →'}</button>
                  {contentIdeas && <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: '#111318', color: '#D1D5DB', border: '1px solid #1F2937' }}>{contentIdeas}</div>}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Training Camp Activation Modal */}
      {showCampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCampModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">🏕️ Schedule Training Camp</h2>
            <div className="space-y-3">
              <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Camp Name</label><input value={campForm.name} onChange={e => setCampForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Portugal Training Camp" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Departure</label><input type="date" value={campForm.departure} onChange={e => setCampForm(f => ({...f, departure: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Return</label><input type="date" value={campForm.returnDate} onChange={e => setCampForm(f => ({...f, returnDate: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              </div>
              <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Destination</label><input value={campForm.destination} onChange={e => setCampForm(f => ({...f, destination: e.target.value}))} placeholder="e.g. Faro, Portugal" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Squad Size</label><input type="number" value={campForm.squadSize} onChange={e => setCampForm(f => ({...f, squadSize: Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Budget (£)</label><input type="number" value={campForm.budget} onChange={e => setCampForm(f => ({...f, budget: Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              </div>
              <button onClick={activateTrainingCamp} disabled={!campForm.name || !campForm.departure || !campForm.returnDate || !campForm.destination} className="w-full py-2.5 rounded-xl text-xs font-bold text-white mt-2" style={{ backgroundColor: campForm.name && campForm.departure && campForm.returnDate && campForm.destination ? '#F59E0B' : '#374151' }}>Activate Training Camp 🏕️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RugbyPortalInner({ session }: { session: SportsDemoSession }) {
  const [activeSection,setActiveSection]=useState('dashboard');
  const club = DEMO_CLUB;

  // Rugby League removed — Union is the only variant. Code retained as a
  // const so existing prop wiring (rugbyCode={rugbyCode}) keeps working.
  const rugbyCode: RugbyCode = 'union'

  // ALL hooks must be declared before any early return
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sidebarExpanded = sidebarPinned || sidebarHovered

  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_rugby_sidebar_pinned') === 'true') }, [])
  const togglePin = () => setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_rugby_sidebar_pinned', String(next)); return next })
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  // Role config
  const [roleOverride, setRoleOverride] = useState<string | null>(null)
  const currentRole = (roleOverride || session.role || 'player') as keyof typeof RUGBY_ROLE_CONFIG
  const roleConfig = RUGBY_ROLE_CONFIG[currentRole] ?? RUGBY_ROLE_CONFIG.player
  const isPlayer = currentRole === 'player'
  const isSponsor = currentRole === 'sponsor'

  const renderView = () => {
    switch(activeSection) {
      case 'dashboard':       return <ClubDashboardView onOpenModal={setActiveModal} onNavigate={setActiveSection}/>;
      case 'dorbriefing':     return <DoRBriefingView club={club}/>;
      case 'insights':        return <InsightsView club={club} activeRole={session.role}/>;
      case 'matchday':        return <MatchDayCentreView club={club}/>;
      case 'calendar':        return <ClubCalendarView/>;
      case 'preseason':       return <PreSeasonView club={club} session={session}/>;
      case 'capdashboard':    return <CapDashboardView club={club}/>;
      case 'contracts':       return <PlayerContractsView/>;
      case 'scenario':        return <ScenarioModellerView club={club}/>;
      case 'audittrail':      return <AuditTrailView/>;
      case 'readiness':       return <ReadinessScoreView club={club}/>;
      case 'criteria':        return <CriteriaTrackerView/>;
      case 'eoi':             return <ExpressionOfInterestView/>;
      case 'gapanalysis':     return <GapAnalysisView/>;
      case 'availability':    return <SquadAvailabilityView/>;
      case 'selection':       return <SelectionPlannerView/>;
      case 'playerprofile':   return <PlayerProfileView/>;
      case 'international':   return <InternationalDutyView/>;
      case 'loans':           return <LoanManagementView/>;
      case 'gps-load':        return <GPSLoadView/>;
      case 'gps-heatmaps':    return <RugbyGpsHeatmapsView/>;
      case 'video-analysis':  return <VideoAnalysisView/>;
      case 'match-stats':     return <MatchStatsView/>;
      case 'setpiece':        return <SetPieceAnalyticsView/>;
      case 'carryanalytics':  return <CarryAnalyticsView/>;
      case 'training-planner':return <TrainingPlannerView/>;
      case 'periodisation':  return <PeriodisationView/>;
      case 'scouting':        return <ScoutingPipelineView/>;
      case 'capimpact':       return <CapImpactModellerView club={club}/>;
      case 'agents':          return <AgentContactsView/>;
      case 'targets':         return <TargetsShortlistView/>;
      case 'concussion':      return <ConcussionHIAView/>;
      case 'rtp':             return <ReturnToPlayView/>;
      case 'medical':         return <MedicalRecordsView/>;
      case 'welfareaudit':    return <WelfareAuditView/>;
      case 'mentalperformance':return <MentalPerformanceView/>;
      case 'sponsorship':     return <SponsorshipPipelineView/>;
      case 'matchdayrev':     return <MatchdayRevenueView/>;
      case 'stadium':         return <StadiumVenueView club={club}/>;
      case 'activation':      return <PartnershipActivationView/>;
      case 'mediahr':         return <MediaContentModule sport="rugby" accentColor="#8b5cf6" existingContentLabel="Rugby — Media & PR (requests, coverage, guidelines)" existingContent={<MediaPRRugbyView club={club}/>} isDemoShell={session.isDemoShell !== false} />;
      case 'fanhub':          return <FanHubRugbyView club={club}/>;
      case 'womenssquad':     return <WomensSquadView/>;
      case 'pwrcompliance':   return <PWRComplianceView/>;
      case 'sharedfacilities':return <SharedFacilitiesView/>;
      case 'womenscommercial':return <WomensCommercialView/>;
      case 'aibriefing':      return <AIBriefingView club={club}/>;
      case 'halftime':        return <AIHalftimeBriefView club={club}/>;
      case 'clubtocountry':   return <ClubToCountryView/>;
      case 'opposition':      return <OppositionAnalysisView/>;
      case 'industrynews':    return <IndustryNewsView/>;
      default:                return <ClubDashboardView onOpenModal={setActiveModal}/>;
    }
  };

  return (
    <div className="min-h-screen" style={{background:'#07080F',color:'#F9FAFB',zoom:0.9}}>
      {/* Floating/Pinned Sidebar — v2 style */}
      <aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: THEMES.dark.bg,
          borderRight: `1px solid ${THEMES.dark.border}`,
          transition: 'width 250ms ease',
          position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', flexShrink: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: FONT,
        }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', minHeight: 56, borderBottom: `1px solid ${THEMES.dark.border}` }}>
          {session.logoDataUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={session.logoDataUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: 8, background: RUGBY_ACCENT.hex, display: 'grid', placeItems: 'center', color: THEMES.dark.btnText, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>H</div>
          }
          {sidebarExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: THEMES.dark.text }}>Lumio</span>
              <span style={{ fontSize: 9.5, color: THEMES.dark.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hartfield RFC</span>
            </div>
          )}
          {sidebarExpanded && (
            <button onClick={togglePin} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              style={{ background: 'transparent', border: 0, cursor: 'pointer', color: sidebarPinned ? RUGBY_ACCENT.hex : THEMES.dark.text3, padding: 4, transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        {/* Nav groups (sourced from RUGBY_NAV_GROUPS, role-filtered) */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RUGBY_NAV_GROUPS.map(grp => {
            const allowed = roleConfig.sidebar
            const filtered = allowed === 'all' ? grp.items : grp.items.filter(it => (allowed as string[]).includes(it.id))
            if (filtered.length === 0) return null
            return (
              <div key={grp.g}>
                {sidebarExpanded && (
                  <div style={{ padding: '0 8px 6px', fontSize: 9.5, color: THEMES.dark.text3, letterSpacing: '0.1em', textTransform: 'uppercase', userSelect: 'none' }}>{grp.g}</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filtered.map(item => {
                    const isActive = activeSection === item.id
                    return (
                      <button key={item.id}
                        onClick={() => { setActiveSection(item.id); if (!sidebarPinned) setSidebarHovered(false) }}
                        title={sidebarExpanded ? undefined : item.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: sidebarExpanded ? '6px 8px' : '6px 0',
                          borderRadius: 6,
                          background: isActive ? RUGBY_ACCENT.dim : 'transparent',
                          color: isActive ? THEMES.dark.text : THEMES.dark.text2,
                          boxShadow: isActive ? `inset 2px 0 0 ${RUGBY_ACCENT.hex}` : 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                          transition: 'background .12s, color .12s',
                        }}>
                        <V2Icon name={item.icon || 'dot'} size={13} stroke={1.6} style={{ color: isActive ? RUGBY_ACCENT.hex : THEMES.dark.text3, flexShrink: 0 }} />
                        {sidebarExpanded && <span style={{ flex: 1, fontSize: 12.5 }}>{item.label}</span>}
                        {sidebarExpanded && item.badge && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: RUGBY_ACCENT.hex, color: THEMES.dark.btnText, fontWeight: 700, letterSpacing: '0.04em' }}>{item.badge}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <RoleSwitcher
          session={session}
          roles={RUGBY_ROLES}
          accentColor={RUGBY_ACCENT.hex}
          onRoleChange={(role) => {
            setRoleOverride(role)
            const key = 'lumio_rugby_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
            }
          }}
          sidebarCollapsed={!sidebarExpanded}
        />

        {sidebarExpanded && (
          <div style={{ padding: 12, borderTop: `1px solid ${THEMES.dark.border}` }}>
            <div style={{ fontSize: 9, color: THEMES.dark.text3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Plan</div>
            <div style={{ fontSize: 11.5, color: RUGBY_ACCENT.hex, fontWeight: 600, marginTop: 2 }}>{club.plan}</div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: '100vh' }}>
        {/* Demo workspace banner */}
        <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: '#0D9488', color: '#ffffff' }}>
          <span>This is a demo · sample data</span>
          <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>
            Apply for your free founding access → lumiosports.com/sports-signup
          </a>
        </div>

        {/* Role indicator banner */}
        {!isPlayer && !isSponsor && (
          <div className="flex items-center justify-between px-6 py-2 text-xs flex-shrink-0"
            style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <div className="flex items-center gap-2">
              <span>{roleConfig.icon}</span>
              <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong>{roleConfig.message ? ` — ${roleConfig.message}` : ''}</span>
            </div>
            <span style={{ color: `${roleConfig.accent}80` }}>Player controls full access →</span>
          </div>
        )}

        {/* Pre-Season Camp Banner */}
        {(() => {
          try {
            const stored = localStorage.getItem('lumio_rugby_preseason')
            if (!stored) return null
            const config = JSON.parse(stored)
            const days = Math.max(0, Math.ceil((new Date(config.openerDate).getTime() - Date.now()) / 86400000))
            const len = Math.max(1, Math.ceil((new Date(config.openerDate).getTime() - new Date(config.activatedAt).getTime()) / 86400000))
            const prog = Math.round(((len - days) / len) * 100)
            const ph = prog < 33 ? 'Fitness Block' : prog < 66 ? 'Contact Block' : 'Match Sharpness'
            const phC = ph === 'Fitness Block' ? '#3B82F6' : ph === 'Contact Block' ? '#F59E0B' : '#22C55E'
            return (
              <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <div className="flex items-center gap-3">
                  <span>🏉</span>
                  <span>Pre-Season Active — Opening Fixture: {config.opposition} · {days} days to go</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: phC }}>{ph}</span>
                </div>
                <button onClick={() => { localStorage.removeItem('lumio_rugby_preseason'); window.location.reload() }}
                  className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#6B7280' }}>Deactivate</button>
              </div>
            )
          } catch { return null }
        })()}

        {/* Content (right summary panel removed — main fills full width) */}
        {isSponsor ? (
          <RugbySponsorDashboard session={session} club={club} />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>
        )}
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            {activeModal === 'flights' && <RugbyFlightFinder onClose={closeModal} session={session} club={club} />}
            {activeModal === 'matchprep' && <RugbyMatchPrepAI onClose={closeModal} club={club} />}
            {activeModal === 'sponsorpost' && <RugbySponsorPost onClose={closeModal} session={session} club={club} />}
            {activeModal === 'injury' && <RugbyInjuryLogger onClose={closeModal} />}
            {activeModal === 'expense' && <RugbyExpenseLogger onClose={closeModal} />}
            {activeModal === 'video' && <RugbyVideoAnalysis onClose={closeModal} />}
            {activeModal === 'contracts' && <RugbyContractCheck onClose={closeModal} club={club} />}
            {activeModal === 'visa' && <RugbyVisaCheck onClose={closeModal} />}
          </div>
        </div>
      )}
    </div>
  );
}
