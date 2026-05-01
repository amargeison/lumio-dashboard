'use client'

import { useState, type ReactNode } from 'react'
import {
  Plane, Calendar, Globe2, Truck, Briefcase, Users,
} from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: 'rgba(255,255,255,0.07)', borderHi: 'rgba(255,255,255,0.13)',
  text: '#F1F5F9', text2: 'rgba(241,245,249,0.78)', text3: 'rgba(241,245,249,0.42)',
  text4: 'rgba(241,245,249,0.22)', accent: '#FBBF24',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

type Tab = 'preseason' | 'midseason' | 'tours' | 'logistics' | 'commercial' | 'squad'

const MID_SEASON_CAMPS = [
  { window: 'Jan international break', dates: '15–22 Jan', location: 'Dubai (warm-weather)', focus: 'Recovery + batting against pace, light bowling', squad: 'A-team minus England-call-ups (4 unavailable)', cost: '£42,000' },
  { window: 'Hundred draft window',     dates: '20–28 Jul', location: 'Loughborough (indoor)', focus: 'Skill camp for non-Hundred players', squad: '12 county-only contracts',         cost: '£14,500' },
  { window: 'Test fortnight',           dates: '01–14 Aug', location: 'Oakridge Park',         focus: 'Maintenance + youth development', squad: '2nd XI + Pathway',                  cost: '£8,800' },
  { window: 'Late-season recovery',     dates: '08–14 Sep', location: 'Algarve, Portugal',     focus: 'Reset + season-review camp',     squad: 'Senior + management',               cost: '£28,400' },
]

const TOURS = [
  { name: 'Pre-season Caribbean tour',   when: 'Mar 2026',  status: 'Active',     squad: '15 + 4 staff', sponsor: 'Crown Wagers — content brief signed', visa: 'All cleared' },
  { name: 'A-team to Sri Lanka',          when: 'Jul 2026',  status: 'Planned',    squad: 'Pathway + 4 fringe', sponsor: 'Apex Performance — kit deal aligned', visa: '6 of 12 visas in flight' },
  { name: 'Mid-season T20 invitational', when: 'Aug 2026',  status: 'Negotiating', squad: 'TBC',          sponsor: 'TBC',                                  visa: 'Pending squad lock' },
]

const LOGISTICS_BUDGET = [
  { line: 'Flights',          amount: '£94,200', pct: 38 },
  { line: 'Hotels',           amount: '£67,800', pct: 27 },
  { line: 'Ground transport', amount: '£18,400', pct: 7  },
  { line: 'Kit freight',      amount: '£12,200', pct: 5  },
  { line: 'Catering',         amount: '£24,600', pct: 10 },
  { line: 'Insurance',        amount: '£14,800', pct: 6  },
  { line: 'Per diem (squad)', amount: '£17,400', pct: 7  },
]

const COMMERCIAL_OBLIGATIONS = [
  { sponsor: 'Crown Wagers',       trip: 'Caribbean pre-season tour', obligation: '4× Instagram posts + 1 brand video', status: 'On track', deadline: '12 Mar' },
  { sponsor: 'Apex Performance',   trip: 'A-team Sri Lanka',          obligation: 'Kit launch + 2 player Q&As',          status: 'Brief drafted', deadline: '08 Jul' },
  { sponsor: 'Meridian Watches',   trip: 'Caribbean pre-season tour', obligation: '1 hospitality activation in Bridgetown', status: 'Confirmed', deadline: '15 Mar' },
  { sponsor: 'Northshore Brewing', trip: 'Algarve recovery',          obligation: 'Squad photo + brand placement reel',  status: 'Pending', deadline: '11 Sep' },
]

const SQUAD_AVAILABILITY = [
  { player: 'Marcus Webb',    role: 'Top order',     conflicts: 'England Test camp 18–28 Jul', tour: 'A-team SL',         status: 'Released to A-team' },
  { player: 'Karan Patel',    role: 'All-rounder',   conflicts: 'Hundred draft pool',           tour: 'Caribbean',         status: 'Available' },
  { player: 'Aaron Reed',     role: 'Wicketkeeper',  conflicts: 'None',                          tour: 'Caribbean',         status: 'Available' },
  { player: 'Chris Dawson',   role: 'Fast bowler',   conflicts: 'Workload cap (post-Lions A camp)', tour: 'Caribbean (lim)', status: 'Modified load' },
  { player: 'Sam Reed',       role: 'Fast bowler',   conflicts: 'None',                          tour: 'Caribbean',         status: 'Available' },
  { player: 'Rajan Steenkamp', role: 'Overseas pro', conflicts: 'SA20 Feb window',              tour: 'Caribbean',         status: 'Available' },
]

interface Props {
  preSeasonContent?: ReactNode
  defaultTab?: Tab
}

export default function CricketToursAndCampsView({ preSeasonContent, defaultTab = 'preseason' }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'preseason',  label: 'Pre-Season',           icon: Calendar },
    { id: 'midseason',  label: 'Mid-Season Camps',     icon: Globe2 },
    { id: 'tours',      label: 'Tours',                icon: Plane },
    { id: 'logistics',  label: 'Logistics & Costs',    icon: Truck },
    { id: 'commercial', label: 'Commercial Activation', icon: Briefcase },
    { id: 'squad',      label: 'Squad Planning',       icon: Users },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Plane size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Tours & Camps</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Pre-Season · mid-season camps · tours · logistics · commercial · squad planning</p>
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
              Pre-season content not wired. Pass <code>preSeasonContent</code> from the page.
            </div>
          )
        )}

        {tab === 'midseason' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['Window','Dates','Location','Focus','Squad','Cost'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MID_SEASON_CAMPS.map(c => (
                  <tr key={c.window} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{c.window}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{c.dates}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{c.location}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{c.focus}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text3 }}>{c.squad}</td>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.accent }}>{c.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'tours' && (
          <div className="space-y-3">
            {TOURS.map(t => (
              <div key={t.name} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
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
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Per-trip budget breakdown — Caribbean pre-season tour</h3>
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
                  <span>Total</span><span className="font-mono">£249,400</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Hotel block</div>
                <div style={{ color: C.text3 }}>Royal Antigua Beach Resort — 24 rooms, 12 nights, dietary list filed.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Travel partner</div>
                <div style={{ color: C.text3 }}>Westmoor Sports Travel · contracted 2024-2027 · 12% off published rates.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Per diem schedule</div>
                <div style={{ color: C.text3 }}>£45/day per player · £65/day staff · GBP wired to local cards day -2.</div>
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
                {['Player','Role','International / format conflicts','Tour','Status'].map(h => (
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
                    <td className="px-3 py-2.5" style={{ color: s.status === 'Available' ? C.good : s.status.includes('Modified') ? C.warn : C.text3 }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
