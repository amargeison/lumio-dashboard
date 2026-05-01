'use client'

import Link from 'next/link'
import SportRoleTabs from '../components/SportRoleTabs'
import { WOMENS_ROLES } from '../components/sportRoles'

const PINK = '#EC4899'
const PURPLE = '#A855F7'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = [
  'FSR compliant',
  'Karen Carney standards',
  'AI powered',
  'Lumio Health ready',
  'WSL approved',
  '30 sections',
]

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '💗', title: 'Player Welfare Hub', desc: 'Karen Carney Review mandatory standards built in. ACL monitoring, maternity tracking, mental health case management. Every player protected.' },
  { icon: '💰', title: 'FSR Compliance', desc: 'Real-time Financial Sustainability Regulation tracking. Salary cap monitoring, bundled sponsorship attribution, headroom calculator. Stay safe automatically.' },
  { icon: '🏦', title: 'Board Suite', desc: 'FSR status, commercial growth, welfare flags, attendance — one executive view. Board pack generated with a click.' },
  { icon: '📊', title: 'Revenue Attribution', desc: 'Women-only Relevant Revenue tracked separately. Bundled deal attribution, YoY growth, permitted spend calculator. Know your number.' },
  { icon: '🪙', title: 'Salary Compliance', desc: 'Every player\u2019s salary tracked against FSR cap. New signing modeller shows headroom impact before you sign.' },
  { icon: '🏗️', title: 'Standalone Identity Tracker', desc: 'Building your commercial independence? Track demerger readiness, standalone revenue %, indicative valuation and dependency score.' },
  { icon: '🗓️', title: 'Morning Briefing', desc: 'Every morning, Lumio briefs your CEO in plain English. FSR status, welfare flags, sponsorship renewals, board pack deadline — all in one place.' },
  { icon: '📋', title: 'Dual Registration', desc: 'Track dual-reg players, expiry dates, parent club agreements. Never miss a registration window.' },
  { icon: '🤖', title: 'AI Department Intelligence', desc: 'Every department has its own AI layer. Insights Report generated fresh daily — performance, compliance, welfare, commercial, all departments.' },
  { icon: '🌸', title: 'Cycle Tracking + GPS Integration', desc: 'Opt-in menstrual cycle phase tracking linked to GPS load management. Training targets auto-adjust per phase. ACL composite risk scored daily.' },
  { icon: '🤖', title: 'AI Halftime Brief (Claude API)', desc: 'GPS + Lumio Data xG + ACL detection + cycle phase welfare flags → structured coaching brief in seconds. Physical, tactical, AND welfare in one document.' },
  { icon: '📊', title: 'Insights — 8 Role Dashboards', desc: 'CEO, DoF, Head Coach, Physio, Commercial, Academy, Welfare, Board — each role gets a tailored AI-generated insights report every morning.' },
  { icon: '🔁', title: 'Transfers + AI Researcher', desc: 'Transfer tracker, shortlist management, and AI-powered transfer researcher that scouts WSL, NWSL, D1 Arkema and Liga F databases.' },
  { icon: '📉', title: 'Analytics (Lumio Data xG)', desc: 'xG timeline, pressing intensity (PPDA), progressive passes, shot map — all from the Lumio Data feed with WSL benchmarks.' },
  { icon: '🔭', title: 'Scouting (WSL · NWSL · D1 Arkema)', desc: 'Database of 2,000+ players across 4 leagues. Filter by position, age, contract status, salary. AI scouting reports on any player.' },
  { icon: '🎓', title: 'Academy / Player Pathway', desc: 'U18 and U21 squads, CoE compliance, GPS profiling, development ratings, dual registration management, and first-team bridge tracking.' },
  { icon: '📣', title: 'Media & PR', desc: 'Press release generator, media obligations tracker, journalist database, and matchday media accreditation management.' },
  { icon: '📱', title: 'Social Media Manager', desc: 'Content calendar, post scheduling, engagement analytics, and AI caption generator across Twitter/X, Instagram, TikTok and Facebook.' },
  { icon: '💜', title: 'Fan Hub', desc: 'Season ticket tracker, membership management, NPS surveys, fan engagement analytics and matchday experience scoring.' },
]

const INTEGRATIONS = [
  { icon: '💗', name: 'Lumio Health', desc: 'Player welfare and GPS monitoring' },
  { icon: '📡', name: 'The FA', desc: 'Registration and FSR compliance reporting' },
  { icon: '🏃', name: 'Johan Sports', desc: 'Player load and injury prevention' },
  { icon: '⚽', name: 'Lumio Data', desc: 'Match data and analytics' },
  { icon: '📹', name: 'Lumio Scout', desc: 'Video and scouting' },
  { icon: '🩺', name: 'PFA', desc: 'Player welfare referral pathway' },
  { icon: '💰', name: 'Xero', desc: 'Financial management' },
  { icon: '📧', name: 'Microsoft 365', desc: 'Email and calendar' },
  { icon: '🔔', name: 'Slack', desc: 'Staff notifications' },
  { icon: '📱', name: 'WhatsApp Business', desc: 'Team comms' },
  { icon: '🤖', name: 'Claude AI', desc: 'Intelligence and briefings' },
]

const TIERS: { name: string; price: string; desc: string; badge?: string }[] = [
  { name: 'WSL Pro', price: '£499/mo', desc: 'Full 30-section portal. FSR compliance, Karen Carney welfare, cycle tracking + GPS, ACL intelligence, AI halftime briefs, Lumio Data analytics, scouting, academy, transfers, board suite — the complete Club OS.' },
  { name: "Women's Championship", price: '£299/mo', desc: 'FSR-lite compliance, Karen Carney standards, basic GPS, welfare tracking, squad management, dual registration, morning briefings.', badge: 'For WSL2 clubs meeting professionalisation standards' },
  { name: "Women's National League", price: '£149/mo', desc: 'Everything a growing club needs. Welfare standards, compliance tracking, squad management — affordable and built for football people.' },
]

// ── Mockup chrome ───────────────────────────────────────────────────────────
function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 30px 80px rgba(236,72,153,0.18)' }}>
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

function MockupHeader({ emoji, title, subtitle, rightBadges }: { emoji: string; title: string; subtitle: string; rightBadges?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{emoji} {title}</div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{subtitle}</div>
      </div>
      {rightBadges && <div style={{ display: 'flex', gap: 6 }}>{rightBadges}</div>}
    </div>
  )
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, color, backgroundColor: bg, border: `1px solid ${color}55`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

function KPI({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}55`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Mockups ─────────────────────────────────────────────────────────────────
function ClubDashboardMockup() {
  return (
    <MockupFrame>
      <MockupHeader
        emoji="🏠"
        title="Oakridge Women FC — Club Dashboard"
        subtitle="FSR compliant · Karen Carney Review standards"
        rightBadges={<>
          <Badge color="#F59E0B" bg="rgba(245,158,11,0.15)">FSR REVIEW</Badge>
          <Badge color={PURPLE} bg="rgba(168,85,247,0.15)">WSL</Badge>
        </>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <KPI value="SAFE" label="FSR Status" sub="Salary 68% of Revenue" color="#10B981" />
        <KPI value="24" label="Squad" sub="WSL registered" color={PURPLE} />
        <KPI value="2" label="Welfare Flags" sub="1 ACL · 1 mental health" color="#F59E0B" />
        <KPI value="Sat 12 Apr" label="Next Match" sub="vs Brighton Women H" color="#3B82F6" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 8 }}>FSR Compliance Summary</div>
          {[
            ['Relevant Revenue', '£3.2M', PINK],
            ['Total salary spend', '£2.18M', PINK],
            ['Salary %', '68%', '#10B981'],
            ['FSR cap (80%)', '£2.56M', PINK],
            ['Headroom', '£380k', '#10B981'],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED, marginTop: 4 }}>
              <span>{k}</span><span style={{ color: c, fontWeight: 800 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Player Welfare Dashboard</div>
          {[
            { name: 'Emily Zhang', tag: 'ACL', color: '#F59E0B' },
            { name: 'Charlotte Reed', tag: 'Mental Health', color: PURPLE },
            { name: 'Ava Mitchell', tag: 'Maternity', color: '#3B82F6' },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: TEXT, marginTop: 6 }}>
              <span>{p.name}</span>
              <Badge color={p.color} bg={`${p.color}22`}>{p.tag}</Badge>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Sponsorship Pipeline</div>
          <div style={{ fontSize: 9, color: MUTED }}>Apex Performance <span style={{ color: PINK }}>£420k</span> · Active</div>
          <div style={{ fontSize: 9, color: MUTED }}>Barclays <span style={{ color: PINK }}>£85k</span> · Active</div>
          <div style={{ fontSize: 9, color: MUTED }}>Local Energy · Renewal due</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Dual Registration</div>
          <div style={{ fontSize: 9, color: MUTED }}>Lucy Whitmore — 30 Apr</div>
          <div style={{ fontSize: 9, color: MUTED }}>Jade Hopkins — 15 May</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Upcoming</div>
          <div style={{ fontSize: 9, color: MUTED }}>Brighton Women WSL</div>
          <div style={{ fontSize: 9, color: MUTED }}>Board meeting · Apex Performance review</div>
          <div style={{ fontSize: 9, color: MUTED }}>Registration closes</div>
        </div>
      </div>
    </MockupFrame>
  )
}

function FSRMockup() {
  return (
    <MockupFrame>
      <MockupHeader emoji="💰" title="FSR Compliance Dashboard" subtitle="Financial Sustainability Regulations — 2025/26 Season" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <KPI value="SAFE" label="FSR Status" color="#10B981" />
        <KPI value="£3.2M" label="Relevant Revenue" color={PINK} />
        <KPI value="£2.18M" label="Salary Spend" sub="68%" color={PINK} />
        <KPI value="£380k" label="Headroom" color="#10B981" />
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Revenue Attribution</div>
        {[
          ['Matchday revenue', '£680k', 22],
          ['Commercial (women-attributed)', '£1.42M', 45],
          ['Broadcast (WSL allocation)', '£820k', 26],
          ['Prize money & FA distributions', '£280k', 9],
        ].map(([label, val, w]) => (
          <div key={label as string} style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: MUTED }}>
              <span>{label}</span><span style={{ color: PINK, fontWeight: 800 }}>{val}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, backgroundColor: '#1F2937', marginTop: 3 }}>
              <div style={{ width: `${w}%`, height: '100%', borderRadius: 3, backgroundColor: PINK }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Bundled Sponsorship Attribution</div>
        {[
          { name: 'Skyward Atlantic (Shared)', total: 'Total £12M', allocated: '£180k', pct: '1.5%' },
          { name: 'Apex Performance (Kit standalone)', total: '', allocated: '£420k', pct: '100%' },
          { name: 'Local Energy Co (Women-only)', total: '', allocated: '£35k', pct: '100%' },
        ].map(s => (
          <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: MUTED, marginTop: 4 }}>
            <span>{s.name} {s.total && <span style={{ opacity: 0.6 }}>· {s.total}</span>}</span>
            <span style={{ color: PINK, fontWeight: 800 }}>→ {s.allocated} ({s.pct})</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.45)', backgroundColor: 'rgba(245,158,11,0.1)', fontSize: 9, color: '#FBBF24' }}>
        ⚠ FSR Rule: Total salary spend must not exceed 80% of Relevant Revenue
      </div>
    </MockupFrame>
  )
}

function WelfareMockup() {
  const cases = [
    { name: 'Emily Zhang', tag: 'ACL Risk', level: 'High', levelColor: '#EF4444', note: 'Previous bilateral ACL (2023, 2024). Next screening: 18 Apr.' },
    { name: 'Charlotte Reed', tag: 'Mental Health', level: 'Medium', levelColor: '#F59E0B', note: 'Weekly sessions with Dr. Alison Carey. Progress positive.' },
    { name: 'Ava Mitchell', tag: 'Maternity', level: 'Info', levelColor: '#3B82F6', note: 'Maternity leave May 2026. Return plan: January 2027.' },
    { name: 'Sophie Turner', tag: 'ACL Risk', level: 'Medium', levelColor: '#F59E0B', note: 'ACL reconstruction Dec 2024. Final return-to-play phase.' },
  ]
  return (
    <MockupFrame>
      <MockupHeader emoji="💗" title="Player Welfare Hub" subtitle="Karen Carney Review — mandatory welfare standards" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <KPI value="3" label="Active Flags" sub="2 monitoring · 1 leave" color="#F59E0B" />
        <KPI value="4 players" label="ACL History" sub="Screening active" color="#EF4444" />
        <KPI value="1 active" label="Maternity" sub="Ava Mitchell May 26" color="#3B82F6" />
        <KPI value="0" label="PFA Referrals" sub="This season" color="#10B981" />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Active Welfare Cases</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cases.map(c => (
          <div key={c.name} style={{ backgroundColor: '#0A0B10', border: `1px solid ${c.levelColor}55`, borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>{c.name}</span>
              <Badge color={c.levelColor} bg={`${c.levelColor}22`}>{c.level}</Badge>
            </div>
            <div style={{ fontSize: 9, color: PINK, marginBottom: 4 }}>{c.tag}</div>
            <div style={{ fontSize: 9, color: MUTED, lineHeight: 1.4 }}>{c.note}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function StandaloneMockup() {
  return (
    <MockupFrame>
      <MockupHeader emoji="🏷️" title="Standalone Identity Tracker" subtitle="Building standalone commercial identity — FSR incentivised" />
      <div style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${PINK}55`, backgroundColor: 'rgba(236,72,153,0.08)', fontSize: 9, color: PINK, marginBottom: 12 }}>
        Revenue attributed directly to women&apos;s football increases your permitted salary cap under FSR.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: `conic-gradient(${PINK} 0% 68%, ${BORDER_ALT} 68% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: CARD_ALT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: PINK }}>68%</div>
            <div style={{ fontSize: 7, color: MUTED }}>standalone</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>68% standalone revenue</div>
          <div style={{ fontSize: 9, color: MUTED }}>32% affiliated/bundled</div>
        </div>
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Demerger Readiness Checklist</div>
        {[
          { ok: true, label: 'Separate legal entity registered' },
          { ok: true, label: 'Brand assets independently owned' },
          { ok: false, label: 'Stadium/facility agreement — In progress' },
          { ok: false, label: 'TUPE staff transfers — Not started' },
          { ok: true, label: 'Bank account separation' },
          { ok: false, label: 'Independent commercial deals — 2 bundled' },
        ].map(i => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: MUTED, marginTop: 4 }}>
            <span style={{ color: i.ok ? '#10B981' : '#F59E0B' }}>{i.ok ? '✓' : '✗'}</span>
            <span>{i.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
        <div style={{ backgroundColor: 'rgba(236,72,153,0.12)', border: `1px solid ${PINK}55`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: PINK }}>£7,000,000</div>
          <div style={{ fontSize: 9, color: MUTED }}>Indicative Valuation</div>
          <div style={{ fontSize: 8, color: MUTED }}>(Revenue × 2.5x)</div>
        </div>
        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#F59E0B' }}>32%</div>
          <div style={{ fontSize: 9, color: MUTED }}>Dependency Score</div>
          <div style={{ fontSize: 8, color: MUTED }}>(Lower is better)</div>
        </div>
        <div style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#3B82F6' }}>58%</div>
          <div style={{ fontSize: 9, color: MUTED }}>Standalone Readiness</div>
          <div style={{ fontSize: 8, color: MUTED }}>(Target 85%)</div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>Standalone readiness: 58%</div>
      <div style={{ height: 6, borderRadius: 4, backgroundColor: '#1F2937' }}>
        <div style={{ width: '58%', height: '100%', borderRadius: 4, backgroundColor: PINK }} />
      </div>
    </MockupFrame>
  )
}

function BriefingMockup() {
  return (
    <MockupFrame>
      <MockupHeader emoji="☀️" title="Good morning, Kate Brennan" subtitle="Tuesday, 7 April 2026" />
      <div style={{ background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`, borderRadius: 10, padding: 10, marginBottom: 10, color: '#fff' }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }}>MORNING BRIEFING — OAKRIDGE WOMEN FC</div>
        <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>WSL · Match Week · Tuesday, 7 April 2026</div>
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#F59E0B' }}>FSR Compliance · 74% of cap</span>
          <Badge color="#F59E0B" bg="rgba(245,158,11,0.15)">REVIEW</Badge>
        </div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>£180,000 headroom remaining</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT }}>Squad Welfare</div>
          <div style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>1 maternity · return-to-play · ACL overdue 3</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT }}>Sponsorship</div>
          <div style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>2 renewals: Kestrel £85k · NovaTech £40k</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT }}>Compliance</div>
          <div style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>Dual reg expires Fri · Window closes 8d</div>
        </div>
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PINK}55`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: TEXT, fontWeight: 800 }}>
          <span>Board Pack Deadline</span><span style={{ color: PINK }}>11 days · 65% complete</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, backgroundColor: '#1F2937', marginTop: 6 }}>
          <div style={{ width: '65%', height: '100%', borderRadius: 3, backgroundColor: PINK }} />
        </div>
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Today&apos;s Priorities</div>
        {[
          'FSR bundled attribution review — Meridian Insurance',
          'Chase Kestrel Finance renewal — kit deal 30 days',
          'ACL screening overdue — 3 high-risk players',
          'Dual reg expiry — Emma Clarke ends Friday',
          'Transfer window modelling — budget impact',
        ].map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 9, color: MUTED, marginTop: 4 }}>
            <span style={{ color: PINK, marginTop: 2 }}>●</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function BoardSuiteMockup() {
  return (
    <MockupFrame>
      <MockupHeader emoji="🏛️" title="Board Suite — Oakridge Women FC" subtitle="Executive dashboard for board and investors" />
      <div style={{ background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`, borderRadius: 10, padding: 10, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 800 }}>Next board meeting: 15 Apr 2025 · Pack due in 11 days</div>
        <button style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}>Generate Pack — Phase 2</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
        <KPI value="Safe (74%)" label="FSR" color="#10B981" />
        <KPI value="£180k" label="Headroom" color="#10B981" />
        <KPI value="87%" label="Revenue vs Budget" color="#3B82F6" />
        <KPI value="£238k" label="Pipeline" color={PURPLE} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <KPI value="20" label="Squad" color={PURPLE} />
        <KPI value="2" label="Welfare Flags" color="#F59E0B" />
        <KPI value="2,847" label="Attendance" color="#3B82F6" />
        <KPI value="34" label="Points" color="#065F46" />
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Commercial Growth — Season on Season</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 90 }}>
          {[
            { label: '22-23', values: [30, 25, 20] },
            { label: '23-24', values: [45, 35, 30] },
            { label: '24-25', values: [60, 50, 42] },
            { label: '25-26', values: [80, 65, 55] },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 70 }}>
                <div style={{ width: 8, height: `${s.values[0]}%`, backgroundColor: PINK, borderRadius: 2 }} />
                <div style={{ width: 8, height: `${s.values[1]}%`, backgroundColor: PURPLE, borderRadius: 2 }} />
                <div style={{ width: 8, height: `${s.values[2]}%`, backgroundColor: '#14B8A6', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: '#10B981', fontWeight: 800 }}>✓ WSL Compliance · FSR salary cap</div>
    </MockupFrame>
  )
}

// ── Spotlight wrapper ────────────────────────────────────────────────────────
function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? '#0A0C14' : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PINK, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: PINK, fontWeight: 900, flexShrink: 0 }}>✓</span>
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function WomensLandingPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${PINK}22, transparent 50%), radial-gradient(circle at 80% 60%, ${PURPLE}1f, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PINK, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO WOMEN&apos;S FOOTBALL PORTAL
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The most complete women&apos;s football Club OS ever built.
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 780, margin: '0 auto 40px' }}>
            30 purpose-built sections. FSR compliance, Karen Carney welfare standards, cycle tracking + GPS integration, ACL intelligence, AI halftime briefs, Lumio Data analytics, scouting, academy pathway — built for WSL and Women&apos;s Championship clubs.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/womens/oakridge-women" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PINK, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PINK}55` }}>
              Try the demo →
            </Link>
            <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              See all features ↓
            </a>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(236,72,153,0.08)', border: `1px solid ${PINK}55`, color: PINK, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Everything a women&apos;s club needs.<br />
            <span style={{ color: PINK }}>Nothing a men&apos;s club told you to use.</span>
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56 }}>
            Built with women&apos;s football decision-makers, not adapted from the men&apos;s game.
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

      <SportRoleTabs sport="womens football" demoHref="/womens/oakridge-women" accentColor="#EC4899" accentColorDim="rgba(236,72,153,0.15)" roles={WOMENS_ROLES} />

      {/* ── SPOTLIGHTS ── */}
      <Spotlight
        eyebrow="SPOTLIGHT · CLUB DASHBOARD"
        title="Your whole club. One screen."
        body="The Oakridge Women FC dashboard shows FSR status, welfare flags, next match, sponsorship pipeline and dual registration — all before you've had your first coffee."
        bullets={['FSR status live at a glance', 'Player welfare alerts surfaced immediately', 'Sponsorship pipeline with renewal alerts', 'Upcoming fixtures and deadlines in one view']}
        mockup={<ClubDashboardMockup />}
      />

      <Spotlight
        altBg
        reverse
        eyebrow="SPOTLIGHT · FSR COMPLIANCE"
        title="FSR compliance. Automatic. Accurate."
        body="The Financial Sustainability Regulations are complex, constantly evolving, and the stakes couldn't be higher. Lumio tracks your salary cap, attributes your revenue correctly, and flags the moment you enter the monitoring zone — before it becomes a problem."
        bullets={['Live FSR status: Safe / Monitor / At Risk', 'Bundled sponsorship attribution handled correctly', 'Relevant Revenue calculator (women-only)', 'Salary cap headroom updated in real time']}
        mockup={<FSRMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · PLAYER WELFARE HUB"
        title="Player welfare isn't a checkbox. It's a culture."
        body="The Karen Carney Review set mandatory welfare standards for women's football. Lumio builds them in from day one — ACL screening protocols, maternity leave management, mental health check-ins, PFA referral tracking. Every player, every case, properly managed."
        bullets={['ACL risk monitoring with Lumio Health integration', 'Maternity leave and return-to-play management', 'Mental health case tracking and PFA referrals', 'Welfare flags surfaced on every dashboard']}
        mockup={<WelfareMockup />}
      />

      <Spotlight
        altBg
        reverse
        eyebrow="SPOTLIGHT · STANDALONE IDENTITY"
        title="Build your independence. Track it in real time."
        body="The FA incentivises clubs to build standalone commercial identities. Lumio's Standalone Identity Tracker shows your demerger readiness, revenue independence score, indicative valuation and exactly what you need to do next."
        bullets={['Standalone vs bundled revenue split', 'Demerger readiness checklist', 'Indicative club valuation (Revenue × 2.5x)', 'Dependency score with improvement pathway']}
        mockup={<StandaloneMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · MORNING BRIEFING"
        title="Briefed before breakfast."
        body="Every morning, Lumio reads your club's data and surfaces what matters today. FSR headroom, welfare flags, sponsorship renewals, board pack deadline — in plain English, personalised to your role."
        bullets={['Personalised by role (CEO, DoF, Head Coach)', 'FSR status and headroom front and centre', "Today's priorities auto-generated", 'Board pack deadline tracking']}
        mockup={<BriefingMockup />}
      />

      <Spotlight
        altBg
        reverse
        eyebrow="SPOTLIGHT · BOARD SUITE"
        title="Board-ready. Always."
        body="Your board needs FSR status, commercial growth, welfare overview and attendance trends — not a spreadsheet. Lumio's Board Suite puts it all in one executive view, with a one-click board pack generator."
        bullets={['FSR status and headroom at board level', 'Commercial growth season-on-season chart', 'Welfare flags visible to board', 'Generate Pack button — Phase 2 coming']}
        mockup={<BoardSuiteMockup />}
      />

      {/* ── FSR DIFFERENCE ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG, borderLeft: `4px solid ${PINK}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PINK, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>THE FSR DIFFERENCE</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1, maxWidth: 900 }}>
            Women&apos;s football has its own rules. Your platform should too.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {[
              { icon: '🌸', title: "World's First Cycle + GPS + ACL Integration", body: 'Opt-in menstrual cycle tracking linked directly to GPS load management. Training targets auto-adjust per phase. Daily ACL composite risk score per player. No competitor has this.' },
              { icon: '🤖', title: 'AI Halftime Brief with Welfare Flags', body: 'GPS + Lumio Data xG + ACL detection + cycle phase → structured Claude-powered coaching brief in seconds. Physical, tactical, AND welfare section in one document. Unique to Lumio Women\u2019s FC.' },
              { icon: '🏟️', title: 'Complete Club OS — 30 Sections', body: 'FSR compliance, Karen Carney tracking, Scouting, Academy, Analytics, Transfers, Media, Fan Hub — purpose-built for professional women\u2019s football. Not a men\u2019s platform with a badge change.' },
            ].map(c => (
              <div key={c.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Lumio Women&apos;s connects to the tools you already use.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
            {INTEGRATIONS.map(i => (
              <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 26 }}>{i.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIERS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built for every level of women&apos;s professional football.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${PINK}55`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PINK, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>TIER</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 8 }}>{t.name}</h3>
                <div style={{ fontSize: 32, fontWeight: 900, color: PINK, marginBottom: 16 }}>{t.price}</div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: t.badge ? 16 : 0 }}>{t.desc}</p>
                {t.badge && <div style={{ fontSize: 11, color: '#F59E0B', padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>{t.badge}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Be one of the first women&apos;s clubs on Lumio.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            We&apos;re looking for a small number of clubs to help us build this properly. 6 months free. No commitment. At the end, all we ask is an honest case study.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {['6 months free', 'We build what you ask for', 'No lock-in'].map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(236,72,153,0.08)', border: `1px solid ${PINK}55`, color: PINK, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:hello@lumiosports.com?subject=Womens%20Football%20Early%20Access" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PINK, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PINK}55` }}>
              Apply for early access →
            </a>
            <Link href="/womens/oakridge-women" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              See the world&apos;s most advanced women&apos;s football platform →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
