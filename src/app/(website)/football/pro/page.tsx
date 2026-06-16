'use client'

import Link from 'next/link'
import SportRoleTabs from '../../components/SportRoleTabs'
import { FOOTBALL_ROLES } from '../../components/sportRoles'
import { CrossDiscoveryStrip } from '../components/CrossDiscoveryStrip'

const RED = '#EF4444'
const NAVY = '#1B3A6B'
const GOLD = '#F1C40F'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['50+ features', 'Championship & League', 'AI powered', 'GPS vest ready', 'PSR compliant']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '📡', title: 'AI Half-Time GPS Brief', desc: "The world's first AI coaching brief powered by GPS vest data. Upload first-half load figures at half-time — Claude AI returns fatigue alerts, a substitution recommendation, and your second-half tactical instruction in 10 seconds." },
  { icon: '🤖', title: 'AI Performance Brief', desc: "Three modes — Half-Time, Full-Time and Training. Each brief reads GPS load, xG and red-zone fatigue, then returns tactical adjustments, substitution calls, recovery priorities and next-session management. Built for the dressing room or the coaching-staff iPad." },
  { icon: '📊', title: 'Directors Suite & PSR', desc: "Board-level financial dashboard, PSR (Profitability & Sustainability) compliance tracker, allowable-loss headroom, wage-to-revenue ratios and FA/EFL governance reporting. The full picture before the Board meeting — not just the table position." },
  { icon: '💷', title: 'Club Finance', desc: "The owner's financial command centre. Eight tabs — overview, revenue, costs, wages, contracts, budgets & transfers, cash flow and PSR health — with charts on every view. P&L, donuts, trends, wage-to-revenue and a risk register in one place." },
  { icon: '🪙', title: 'Salary & Squad Cost Compliance', desc: "Every player's salary tracked against the squad-cost ratio. A new-signing modeller shows PSR and wage-bill impact before you commit — know your headroom before you make the offer." },
  { icon: '📈', title: 'Revenue Attribution', desc: "Associated-party transaction and fair-market-value tracking, bundled-deal attribution and year-on-year commercial growth. The number PSR turns on, tracked cleanly." },
  { icon: '🗺️', title: 'Club Vision', desc: "Multi-horizon strategy across 1, 3, 5 and 10 years. Season objectives, transfer plan, KPI roadmap, revenue forecast, stadium and academy plans and a full decade projection — your Championship → Premier League roadmap, owner-grade." },
  { icon: '🏦', title: 'Board Suite', desc: "PSR status, commercial growth, squad value, welfare flags and attendance in one executive view. Board pack generated with a click." },
  { icon: '⚽', title: 'GPS Load Monitoring', desc: "GPS vest integration with pitch heatmaps, ACWR load monitoring, a training-load planner with injury-risk flags and per-player readiness scores every morning before training." },
  { icon: '🔥', title: 'GPS Heatmaps', desc: "Spatial movement analysis across matches, training and the season — positional density, touch maps, sprint paths, speed-and-intensity zones and squad comparison, with top tabs for each view." },
  { icon: '🎯', title: 'Tactics', desc: "Drag-and-drop formation board across six systems (4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 4-5-1, 3-4-3). Build your XI from a GPS-load-aware squad list, auto-fill the best XI and read AI tactical suggestions and opposition notes that adapt to your shape." },
  { icon: '🏃', title: 'Training', desc: "A full coaching week. Day-by-day session tabs with drills, equipment, GPS targets and coaching points, plus an AI Session Builder that turns type / duration / intensity / focus into a complete plan — with load report and recovery schedule alongside." },
  { icon: '🪧', title: 'Set Pieces', desc: "Attacking and defending routine library — corners, free-kicks and throw-ins with assignments, delivery zones and rehearsal notes that feed straight into the training week and match prep." },
  { icon: '🎬', title: 'Video & Analysis', desc: "Library, Detail, Training, Performance, Set-Pieces, Live and Opposition sub-tabs. Match-clip library, training capture, live-match feed and opposition scouting — over the data your analyst captures, no third-party video stack required." },
  { icon: '📉', title: 'Analytics & Performance Data', desc: "Match analytics and player insights computed over the data your club records — GPS feeds, match events, fitness inputs and video tags — AI-summarised. Plugs into whichever feeds you already use." },
  { icon: '🥅', title: 'Fixtures & Results', desc: "Live EFL Championship table, form guide, results and upcoming fixtures with home/away splits — the league picture alongside the football picture." },
  { icon: '🏆', title: 'Cup Manager', desc: "FA Cup and EFL Cup round-by-round brackets, draw tracking, prize-money and TV-revenue projection — the cup run managed alongside the league." },
  { icon: '👥', title: 'Squad Management', desc: "Employment status, contract expiries, loans, age bands, nationality and welfare in one table, with per-player KPI cards and filters for full-time, loan, international and injured." },
  { icon: '🔁', title: 'Transfers & Contracts', desc: "PSR-gated transfer tracker — incoming targets with estimated fee and PSR impact, outgoing contract-expiry risk, a window timeline and a renewal tracker. Model the squad-cost impact before you sign." },
  { icon: '🔄', title: 'Loan Manager', desc: "Track loans in and out, recall clauses and EFL loan-regulation limits (domestic loan caps, eligibility, recall windows) — the development-loan picture for every young player out for minutes." },
  { icon: '🎓', title: 'Academy / Player Pathway', desc: "EPPP Category academy with U18 and U21 squads, GPS profiling, development ratings, an audit-compliance checklist, promotion pipeline and a first-team bridge — from youth-development phase to EFL contract." },
  { icon: '🏥', title: 'Medical & Fitness Hub', desc: "ACWR-based injury-risk flagging, return-to-play tracking, GPS load history per player, a medical-clearance workflow and physio case notes. Know who is at risk before the session starts — not after." },
  { icon: '🛡️', title: 'Player Welfare Hub', desc: "The flagship welfare dashboard — load, recovery, injury, mental health and integration flags in one role-gated view, with PFA and EFL welfare standards built in." },
  { icon: '🧠', title: 'Mental Health', desc: "Clinical mental-health support, confidential check-ins and a clear referral pathway — Sporting Chance, the PFA and an in-house psychologist — kept distinct from on-pitch performance psychology. Player detail is access-controlled and anonymised." },
  { icon: '🤕', title: 'Concussion Tracker', desc: "FA concussion guidelines and the 6-stage graduated return-to-play protocol. Active-case timelines, squad concussion history, baseline records and an FA-compliance audit — built around player safety." },
  { icon: '🔋', title: 'Load & Recovery', desc: "Daily readiness from training load (acute:chronic workload ratio), sleep and wellness, with a weekly load picture and recovery interventions — the physiological view behind selection and load management." },
  { icon: '🩹', title: 'Injury & Return-to-Play', desc: "A five-phase return-to-play pathway with rehab milestones and graduated return-to-play clearance gates — medical and performance sign-off against objective criteria before a player is available." },
  { icon: '🌍', title: 'Player Integration', desc: "End-to-end onboarding for international and relocating players — a live drag-and-drop welfare board, immigration & GBE (Governing Body Endorsement), relocation & setup, family & education, language & culture and wellbeing, each expanding into a full stage checklist." },
  { icon: '💜', title: 'Fan Hub', desc: "Season-ticket tracker, membership management, NPS surveys, fan-engagement analytics and matchday-experience scoring — the supporter relationship in one place." },
  { icon: '🤝', title: 'Sponsorship Pipeline', desc: "Every commercial conversation from prospect to signed — stages, value, probability, renewals and owner — feeding the board view and PSR revenue attribution." },
  { icon: '🛍️', title: 'Commercial Growth', desc: "Retail & Merchandise (range, margin, bestsellers), Ticketing & Yield (pricing, demand, season-ticket renewals) and Sponsor Activation & ROI (deliverables and value-in-kind) — the matchday-and-retail commercial engine in one place." },
  { icon: '📣', title: 'Media & PR', desc: "Press-release generator, media-obligations tracker, journalist database and matchday media accreditation — EFL/PL broadcast obligations handled." },
  { icon: '📱', title: 'Social Media Manager', desc: "Content calendar, post scheduling, engagement analytics and an AI caption generator across X, Instagram, TikTok and Facebook." },
  { icon: '🎯', title: 'Matchday Operations', desc: "The flagship operations command centre. Nine tabs — Overview with live readiness and run-of-day, plus Safety & Stewarding, Pitch & Facilities, Catering & Hospitality, Media & Broadcast, Officials, Ticketing & Turnstiles, Emergency / EAP and the Post-match wrap. Checklists, named contacts, timings, capacities, costs and risk flags in one place." },
  { icon: '📖', title: 'AI Matchday Programme', desc: "A full online matchday programme in one click. The AI pulls in the fixture, squads, table and recent results, writes the chair's welcome and manager's notes, then lays out opposition, line-ups, a tactical board, season charts and feature pages — rendered as a premium editorial flip-book you can share or print." },
  { icon: '🏟️', title: 'Club Operations & Facilities', desc: "Stadium, pitch & grounds and training-ground views — capacity and safety certification, pitch condition and maintenance, floodlights and facility status — alongside suppliers, staffing rota, an ops calendar and live action items." },
  { icon: '♻️', title: 'Energy, Capital Projects & Assets', desc: "Facilities depth that feeds Stadium & Facilities: Energy & Sustainability (ESG) with consumption and net-zero tracking, a Capital Projects tracker (budget, spend, ROI) and an Asset Register / CMMS with maintenance schedules." },
  { icon: '📑', title: 'Procurement & Contracts', desc: "Supplier and contract register with a renewal calendar, spend by category, tender tracking and modern-slavery / supply-chain due diligence — the operations procurement layer." },
  { icon: '✈️', title: 'Travel & Logistics', desc: "An AI Travel Researcher finds and scores coaches, hotels and pre-match meals for every away day — even for a club new to a division with no suppliers saved. Draft the booking enquiry and hand off; Lumio never books for you. Same-day-vs-overnight cost comparison built in." },
  { icon: '🌍', title: 'Tours & Camps', desc: "A full camp and tour builder — windows, day-by-day itineraries, squad and staff, travel and accommodation, live budgets, commercial activation and medical planning, with a one-click AI draft and a history of previous pre-seasons." },
  { icon: '🧭', title: 'Compliance Command Centre', desc: "A single RAG view across every compliance domain — PSR headroom, squad-cost ratio, Club Licensing and EFL/PL game standards — plus a master Compliance Calendar, and dedicated workspaces for Registration & Transfers (EFL squad registration, GBE / work permits, international clearance, intermediary disclosure), Data Protection (UK GDPR), Safeguarding, Anti-Doping (UKAD / WADA), a Risk Register & Insurance and a Policy Library with staff attestations." },
  { icon: '🏛️', title: 'Club Licensing & Game Standards', desc: "Club-side preparation workspace for EFL / Premier League licensing and EPPP academy criteria — overview, criteria, risk register, action plan and audit tabs. Lumio does not issue licences; a visible disclaimer sits on every tab." },
  { icon: '🌐', title: 'Community & Foundation', desc: "Foundation activity, schools and grassroots partnerships, participation numbers and social-value reporting — the club's community programme tracked alongside the football." },
]

const TIERS = [
  { name: 'Director of Football / Head of Performance', desc: 'Squad management, GPS load monitoring, training planner, medical hub, opposition reports, and tactics & set-piece planning. The complete technical picture — every morning before training.' },
  { name: 'Chairman / CEO / Finance Director', desc: 'Directors Suite, PSR compliance tracker, Board Suite financials, fan engagement dashboard, and commercial pipeline. The business of football, as well as the game.' },
  { name: 'Manager / Coaching Staff', desc: 'Match prep, AI opposition report, AI half-time GPS brief, post-match analysis, press conference briefing, and tactical planning tools. From pre-match prep to the final whistle.' },
]

const PRICING = [
  { name: 'Starter', price: 'Free', features: ['Squad & contract management', 'Fixtures & results (live data)', 'Match Report Builder', 'GPS CSV upload', 'Fan Hub KPI strip', '3 staff accounts'] },
  { name: 'Professional', price: '£199/mo', highlight: true, features: ['Everything in Starter', 'Directors Suite & PSR tracker', 'Opposition Report + AI Performance Brief', 'AI Post-Match Analysis', 'Training Load Planner', 'GPS pitch heatmaps', 'AI half-time GPS brief', 'Full Fan Engagement Dashboard', 'PDF export across all dashboards', '10 staff accounts'] },
  { name: 'Elite', price: '£499/mo', features: ['Everything in Professional', 'GPS vest direct API', 'Lumio Scout video integration', 'Lumio Data feed', 'AI Club Comparison Analysis', 'White-label club branding', 'Unlimited staff accounts', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', features: ['Everything in Elite', 'Custom integrations', 'Multi-club portfolio management', 'Dedicated account manager + SLA', 'Contact us for pricing'] },
]

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 30px 80px ${NAVY}55` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${BORDER_ALT}`, backgroundColor: '#0B1020' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>
        <div style={{ flex: 1, height: 18, borderRadius: 5, backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}` }} />
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function KPI({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}55`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function HalfTimeBriefMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>🤖 AI Half-Time GPS Brief</div>
        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.2)', color: RED, border: `1px solid ${RED}55`, letterSpacing: '0.06em' }}>HALF TIME</span>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>Lumio Sports FC vs Northgate City · Half-time 0-1</div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 8, padding: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B' }}>⚠ C. Nwosu — 268 AU load, ACWR 1.38</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>Withdrawal recommended at 60 min</div>
      </div>
      <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: RED }}>⚠ D. Morris — ACWR 1.12</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>High first-half output. Monitor.</div>
      </div>
      <div style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8, padding: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', marginBottom: 3 }}>📊 TACTICAL</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>Pressing effective in first 20 min but space opened in behind. Drop trigger line 5m.</div>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 8, padding: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', marginBottom: 3 }}>🔄 SUB</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>Barker off at 55 min — 87% weekly load cap. Walsh on.</div>
      </div>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981', marginBottom: 3 }}>▶ SECOND HALF</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>Force play wider. Their left back GPS data shows slower recovery runs in last 15 minutes.</div>
      </div>
      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: NAVY, color: GOLD, border: 'none' }}>📋 Copy for tablet</button>
    </MockupFrame>
  )
}

function BoardSuiteMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Board Suite — Lumio Sports FC</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>Monthly Chairman&apos;s dashboard · Updated live</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <KPI value="✓ Compliant" label="PSR" color="#10B981" />
        <KPI value="64%" label="W:R Ratio" color="#F59E0B" />
        <KPI value="£2.1m" label="Budget Left" color="#3B82F6" />
        <KPI value="30 Jun" label="EFL Due" color="#F59E0B" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
          <span style={{ color: TEXT, fontWeight: 700 }}>Wage budget</span>
          <span style={{ color: '#F59E0B', fontWeight: 800 }}>68% used</span>
        </div>
        <div style={{ height: 5, backgroundColor: '#1F2937', borderRadius: 3 }}>
          <div style={{ width: '68%', height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
          <span style={{ color: TEXT, fontWeight: 700 }}>Playing staff</span>
          <span style={{ color: NAVY, fontWeight: 800 }}>72% used</span>
        </div>
        <div style={{ height: 5, backgroundColor: '#1F2937', borderRadius: 3 }}>
          <div style={{ width: '72%', height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 800 }}>⚠ Transfer window opens in 72 days</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>PSR headroom: £380k</div>
      </div>
      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: NAVY, color: GOLD, border: 'none' }}>Generate Board Report PDF →</button>
    </MockupFrame>
  )
}

function GPSPitchMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>GPS Load Monitor — Lumio Sports FC</div>
        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.2)', color: RED, border: `1px solid ${RED}55`, letterSpacing: '0.06em' }}>● LIVE</span>
      </div>
      <svg viewBox="0 0 320 210" style={{ width: '100%', borderRadius: 8, marginBottom: 10, border: `1px solid ${BORDER_ALT}` }}>
        <rect x={0} y={0} width={320} height={210} fill="#1a3d1a" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={i * 40} y={0} width={40} height={210} fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'} />
        ))}
        <rect x={6} y={6} width={308} height={198} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
        <line x1={160} y1={6} x2={160} y2={204} stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
        <circle cx={160} cy={105} r={28} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <circle cx={160} cy={105} r={2} fill="rgba(255,255,255,0.6)" />
        <rect x={6} y={55} width={44} height={100} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <rect x={6} y={80} width={18} height={50} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
        <rect x={270} y={55} width={44} height={100} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <rect x={296} y={80} width={18} height={50} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
        <circle cx={45} cy={85} r={16} fill={NAVY} opacity="0.7" style={{ filter: 'blur(8px)' }} />
        <circle cx={55} cy={120} r={14} fill={NAVY} opacity="0.65" style={{ filter: 'blur(8px)' }} />
        <circle cx={70} cy={105} r={12} fill={NAVY} opacity="0.55" style={{ filter: 'blur(8px)' }} />
        <circle cx={90} cy={80} r={10} fill={NAVY} opacity="0.5" style={{ filter: 'blur(8px)' }} />
        <circle cx={160} cy={105} r={18} fill={NAVY} opacity="0.68" style={{ filter: 'blur(8px)' }} />
        <circle cx={145} cy={130} r={14} fill={NAVY} opacity="0.5" style={{ filter: 'blur(8px)' }} />
        <circle cx={175} cy={85} r={12} fill={NAVY} opacity="0.45" style={{ filter: 'blur(8px)' }} />
        <circle cx={260} cy={105} r={18} fill={NAVY} opacity="0.72" style={{ filter: 'blur(8px)' }} />
        <circle cx={245} cy={80} r={13} fill={NAVY} opacity="0.55" style={{ filter: 'blur(8px)' }} />
        <circle cx={250} cy={130} r={12} fill={NAVY} opacity="0.5" style={{ filter: 'blur(8px)' }} />
        <circle cx={280} cy={110} r={10} fill={NAVY} opacity="0.4" style={{ filter: 'blur(8px)' }} />
      </svg>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {[
          { l: 'Full Squad', active: true },
          { l: 'J. Hayes', active: false },
          { l: 'C. Nwosu', active: false },
          { l: 'T. Fletcher', active: false },
        ].map(p => (
          <span key={p.l} style={{ fontSize: 8, padding: '4px 8px', borderRadius: 999, backgroundColor: p.active ? NAVY : 'transparent', color: p.active ? GOLD : MUTED, border: `1px solid ${p.active ? NAVY : BORDER_ALT}`, fontWeight: 700 }}>{p.l}</span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {[
          { n: 'C. Nwosu', au: 478, acwr: 1.38, c: '#EF4444' },
          { n: 'D. Morris', au: 445, acwr: 1.12, c: '#F59E0B' },
          { n: 'T. Fletcher', au: 420, acwr: 0.88, c: '#10B981' },
        ].map(p => (
          <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: TEXT }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.c }} />
            <span style={{ fontWeight: 700 }}>{p.n}</span>
            <span style={{ color: MUTED, marginLeft: 'auto' }}>{p.au} AU · ACWR {p.acwr.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: NAVY, color: GOLD, border: 'none' }}>🤖 AI Post-Session Analysis</button>
    </MockupFrame>
  )
}

function InsightsMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Good morning. Here&apos;s your club picture.</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>Lumio Sports FC · Thursday 9 April 2026</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {[
          { l: 'Squad', s: '✓', c: '#10B981' },
          { l: 'Medical', s: '⚠', c: '#F59E0B' },
          { l: 'Transfers', s: '🔴', c: '#EF4444' },
          { l: 'Commercial', s: '✓', c: '#10B981' },
          { l: 'Finance', s: '✓', c: '#10B981' },
          { l: 'Governance', s: '✓', c: '#10B981' },
        ].map(t => (
          <div key={t.l} style={{ backgroundColor: '#0A0B10', border: `1px solid ${t.c}55`, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: t.c }}>{t.s}</div>
            <div style={{ fontSize: 9, color: TEXT, fontWeight: 700, marginTop: 2 }}>{t.l}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderLeft: `3px solid ${NAVY}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, marginBottom: 4 }}>🤖 AI SUMMARY</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.55 }}>Squad availability 18/22. C. Nwosu at injury risk — ACWR 1.38. Contract decision on P. Granger overdue by 6 days. Social sentiment up 12% after Saturday.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          '1. Renew Granger contract — overdue',
          '2. GPS plan — rest Nwosu tomorrow',
          '3. PSR declaration — 72 days remaining',
        ].map(a => (
          <div key={a} style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 6, padding: '7px 10px', fontSize: 9, color: TEXT, fontWeight: 600 }}>{a}</div>
        ))}
      </div>
    </MockupFrame>
  )
}

function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? '#0A0C14' : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ order: reverse ? 1 : 2 }}>{mockup}</div>
      </div>
    </section>
  )
}

export default function FootballProPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${NAVY}66, transparent 50%), radial-gradient(circle at 80% 60%, ${RED}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO FOOTBALL · PRO &amp; ACADEMY
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The complete club management platform.
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 860, margin: '0 auto 40px' }}>
            Squad management, PSR compliance, GPS load monitoring, tactics & set pieces, Directors Suite, fan engagement, and a world-first AI half-time brief. Everything your club needs. One platform.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/sports-signup?sport=football" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: RED, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${RED}66` }}>
              Apply for founding access →
            </Link>
            <Link href="/football/oakridge-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(27,58,107,0.25)', border: `1px solid ${NAVY}`, color: GOLD, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built for professional football clubs.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Fifty-plus features across twelve departments — from the Chairman&apos;s office to the training pitch. Everything in one place.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SportRoleTabs sport="football" demoHref="/football/oakridge-fc" accentColor="#EF4444" accentColorDim="rgba(239,68,68,0.15)" roles={FOOTBALL_ROLES} />

      <Spotlight
        eyebrow="SPOTLIGHT · AI HALF-TIME GPS BRIEF"
        title="World's first. Nothing else like it."
        body="At half-time, your analyst uploads first-half GPS data from the vests. Lumio reads distance covered, session load, and ACWR risk for every player — then Claude AI generates a structured coaching brief in under 10 seconds. Ready before the manager walks back in."
        bullets={['Fatigue alerts per player — flagged automatically from GPS load data', 'Substitution recommendation — names the player and the replacement, with GPS reasoning', 'Tactical insight — what the movement patterns reveal about the first half', 'Second-half instruction — specific sentences based on data, not gut feel']}
        mockup={<HalfTimeBriefMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · DIRECTORS SUITE & PSR"
        title="The boardroom needs data too."
        body="The Directors Suite gives your Chairman, CEO, and Finance Director everything they need — PSR compliance status, wage-to-revenue ratios, EFL/FA governance tracking, finance dashboards, and a one-click Board Report PDF. The full financial picture, updated in real time."
        bullets={['PSR compliance tracker — automatic red/amber/green status with submission deadline calendar', 'Wage-to-revenue ratio — live calculation against EFL financial fair play ceiling', 'Board Report PDF — one-click branded board report ready for the monthly meeting', 'Finance dashboard — budget vs actual, revenue by stream, spend by department']}
        mockup={<BoardSuiteMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · GPS & LOAD MONITORING"
        title="See where every player is. Before and after."
        body="GPS vests plug directly into the platform. Every training session and match generates a pitch heatmap, ACWR load score, and injury risk flag per player. The AI post-session analysis tells you who to rest and who can go harder — before you write tomorrow's session plan."
        bullets={['Pitch heatmap — GPS positional data rendered on a full football pitch, per player or full squad', 'ACWR monitoring — 28-day rolling load vs 7-day acute, green/amber/red risk zones', 'AI post-session analysis — Claude reads the full squad load and generates coaching recommendations', 'Training Load Planner — weekly player × day calendar with auto-generated ACWR risk flags']}
        mockup={<GPSPitchMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · CLUB INSIGHTS"
        title="Every department. One morning view."
        body="The Lumio Insights dashboard gives your Director of Football the complete picture across squad, medical, transfers, commercial, finance, and fan engagement — before the first meeting of the day. AI-generated summaries, priority actions, and weekly trends in one scroll."
        bullets={['Department health scores — squad, medical, commercial, finance, governance at a glance', 'AI department summaries — Claude reads your live data and writes the morning briefing', 'Priority action feed — what needs your attention today, ranked by impact and urgency', 'Weekly trends — squad availability, GPS load, revenue, fan NPS over rolling 8 weeks']}
        mockup={<InsightsMockup />}
      />

      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Who it&apos;s for.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${NAVY}`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>ROLE</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Simple pricing. No contracts.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 56 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${RED}` : `1px solid ${BORDER}`, borderRadius: 16, padding: 24, position: 'relative' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', borderRadius: 999, backgroundColor: RED, color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most popular</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{p.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, marginBottom: 18 }}>{p.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#D1D5DB' }}>
                      <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '120px 24px', backgroundColor: BG, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            The complete platform for professional football clubs.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Explore the live demo with Lumio Sports FC — no signup, no account needed. Or book a 30-minute walkthrough with the Lumio team.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/sports-signup?sport=football" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: RED, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${RED}66` }}>
              Apply for founding access →
            </Link>
            <Link href="/football/oakridge-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: MUTED, opacity: 0.7 }}>Fictional demo club · All player data is illustrative · GPS vest integration from Professional tier</p>
        </div>
      </section>

      <CrossDiscoveryStrip tier="pro" />
    </div>
  )
}
