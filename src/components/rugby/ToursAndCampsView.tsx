'use client'

import { useState, type ReactNode } from 'react'
import { Plane, Calendar, Globe2, Truck, Briefcase, Users } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: 'rgba(255,255,255,0.07)', borderHi: 'rgba(255,255,255,0.13)',
  text: '#F1F5F9', text2: 'rgba(241,245,249,0.78)', text3: 'rgba(241,245,249,0.42)',
  text4: 'rgba(241,245,249,0.22)', accent: '#8B5CF6',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

type Tab = 'preseason' | 'midseason' | 'tours' | 'logistics' | 'commercial' | 'squad'

const MID_SEASON_CAMPS = [
  { window: 'Autumn International block', dates: '02–25 Nov', location: 'Hartfield (training base)', focus: 'Maintenance phase + injury recovery for non-internationals', squad: '24 (8 in England camp)', cost: '£32,000' },
  { window: 'Six Nations window',         dates: '01 Feb – 16 Mar', location: 'Hartfield', focus: 'Phased load + academy minutes + B-team fixtures', squad: '22 (6 with England)', cost: '£28,500' },
  { window: 'Lions year supplement',      dates: '15 Jun – 06 Jul (Lions years only)', location: 'Algarve', focus: 'Reset + altitude prep for non-Lions squad', squad: '24 (4 with Lions)', cost: '£44,800' },
  { window: 'Post-international recovery',dates: '20 Mar – 02 Apr', location: 'Hartfield + day-trip rounds', focus: 'Decompress · medical reviews · mental health check-ins', squad: 'Full squad', cost: '£12,400' },
]

const TOURS = [
  { name: 'Pre-season tour to South Africa', when: 'Aug 2026',  status: 'Active',     squad: '32 (incl. 6 academy)', sponsor: 'Vanta Sports — kit launch tied to opening fixture', visa: 'All cleared' },
  { name: 'Italian altitude camp + fixture', when: 'Sep 2026',  status: 'Planned',    squad: '28', sponsor: 'Crown Wagers — content brief in draft', visa: 'EU — none required' },
  { name: 'French invitational match',        when: 'Apr 2026', status: 'Negotiating', squad: 'TBC', sponsor: 'TBC', visa: 'Pending squad lock' },
]

const LOGISTICS_BUDGET = [
  { line: 'Flights',          amount: '£128,400', pct: 35 },
  { line: 'Hotels',           amount: '£94,200',  pct: 26 },
  { line: 'Ground transport', amount: '£24,800',  pct: 7  },
  { line: 'Kit + equipment freight', amount: '£18,600', pct: 5 },
  { line: 'Catering',         amount: '£32,400',  pct: 9  },
  { line: 'Insurance + repatriation', amount: '£28,200', pct: 8 },
  { line: 'Per diem',         amount: '£23,600',  pct: 6  },
  { line: 'Medical kit + match-day',  amount: '£14,800', pct: 4 },
]

const COMMERCIAL_OBLIGATIONS = [
  { sponsor: 'Vanta Sports',     trip: 'Pre-season SA tour', obligation: 'Kit launch event + 4 player content posts', status: 'On track', deadline: '12 Aug' },
  { sponsor: 'Crown Wagers',     trip: 'Italian altitude camp', obligation: '2 brand video days + behind-the-scenes reel', status: 'Brief in draft', deadline: '04 Sep' },
  { sponsor: 'Meridian Watches', trip: 'Pre-season SA tour', obligation: 'Hospitality activation in Cape Town', status: 'Confirmed', deadline: '15 Aug' },
  { sponsor: 'Apex Performance', trip: 'French invitational',   obligation: 'Medical kit launch + DoR Q&A', status: 'Pending', deadline: '02 Apr' },
]

const SQUAD_AVAILABILITY = [
  { player: 'Tom Barnes',   role: 'Prop',          conflicts: 'England Autumn camp (incl. block)', tour: 'SA tour', status: 'Released to England' },
  { player: 'Dan Foster',   role: 'Lock',          conflicts: 'HIA stand-down review',             tour: 'SA tour (lim)', status: 'Modified load' },
  { player: 'Kieran Foster', role: 'Flanker',      conflicts: 'Workload cap (ACWR 1.44)',          tour: 'SA tour', status: 'Available' },
  { player: 'Sam Briggs',    role: 'No.8',          conflicts: 'Shoulder rehab (returns 2 May)',   tour: 'Italian camp', status: 'Pending fitness' },
  { player: 'Tom Foley',     role: 'Academy No.8',   conflicts: 'None',                              tour: 'SA tour',  status: 'Available' },
  { player: 'Connor Walsh',  role: 'Loan in (FH)',   conflicts: 'Parent-club recall window',         tour: '—',        status: 'Recall risk' },
]

interface Props {
  preSeasonContent?: ReactNode
  defaultTab?: Tab
}

export default function RugbyToursAndCampsView({ preSeasonContent, defaultTab = 'preseason' }: Props) {
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
              <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Per-trip budget breakdown — Pre-season SA tour</h3>
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
                  <span>Total</span><span className="font-mono">£365,000</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Hotel block</div>
                <div style={{ color: C.text3 }}>Stellenbosch Lodge — 36 rooms, 14 nights, 2 dietary lists filed.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Travel partner</div>
                <div style={{ color: C.text3 }}>Westmoor Sports Travel · contracted 2024-2027 · medical-kit freight included.</div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>Insurance / repatriation</div>
                <div style={{ color: C.text3 }}>Ascent Sports — concussion, contact-injury, repatriation cover. Reviewed annually.</div>
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
                {['Player','Role','International / load conflicts','Tour','Status'].map(h => (
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
                    <td className="px-3 py-2.5" style={{ color: s.status === 'Available' ? C.good : s.status.includes('Modified') || s.status.includes('Pending') ? C.warn : C.text3 }}>{s.status}</td>
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
