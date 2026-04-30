'use client'

import { useState, type ReactNode } from 'react'
import { Plane, Calendar, Globe2, Truck, Briefcase, Users } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
}

type Tab = 'preseason' | 'midseason' | 'tours' | 'logistics' | 'commercial' | 'squad'

const MID_SEASON_CAMPS = [
  { window: 'Lionesses Sep international break', dates: '23 Sep – 06 Oct', location: 'Hartfield (training base)', focus: 'Maintenance + injury recovery for non-internationals · academy minutes', squad: '20 (4 with Lionesses)', cost: '£24,800' },
  { window: 'Champions League window',           dates: '04–18 Nov',       location: 'Hartfield + away fixture support', focus: 'Continental travel prep · sleep / jet-lag protocols', squad: 'Full + 2 academy',                                  cost: '£36,400' },
  { window: 'Lionesses spring camp',             dates: '17 Feb – 03 Mar', location: 'Hartfield', focus: 'Phased load · cycle-aware training · ACL screening', squad: '22 (2 with Lionesses)',                                              cost: '£18,200' },
  { window: 'WSL Cup competition window',         dates: '08–22 Apr',       location: 'Hartfield + cup-fixture support', focus: 'Cup rotation · academy first-team minutes',           squad: 'Full + 4 academy',                                  cost: '£14,600' },
]

const TOURS = [
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
  { sponsor: 'Vanta Sports',     trip: 'Spain pre-season',         obligation: 'Kit launch event + 4 player content posts',          status: 'On track', deadline: '12 Aug' },
  { sponsor: 'Crown Wagers',     trip: 'USA tour',                 obligation: '2 brand video days + lifestyle/family-day content',  status: 'Brief in draft', deadline: '04 Jul' },
  { sponsor: 'Meridian Watches', trip: 'Spain pre-season',         obligation: 'Hospitality activation in Marbella',                  status: 'Confirmed', deadline: '15 Aug' },
  { sponsor: 'Apex Performance', trip: 'USA tour',                 obligation: 'Medical kit launch + Q&A on women\'s injury research', status: 'Pending', deadline: '02 Jul' },
]

const SQUAD_AVAILABILITY = [
  { player: 'Emily Zhang',     role: 'Centre back',   conflicts: 'Lionesses friendly window',  tour: 'Spain',      status: 'Released to Lionesses' },
  { player: 'Lucy Whitmore',   role: 'Midfielder',    conflicts: 'Cycle phase 3 — load adjustment', tour: 'USA',     status: 'Modified load' },
  { player: 'Ava Mitchell',    role: 'Forward',       conflicts: 'Maternity return — Phase 2 RTP', tour: '—',         status: 'Rehab — not travelling' },
  { player: 'Freya Johansson', role: 'Centre mid',    conflicts: 'None',                          tour: 'Spain',     status: 'Available' },
  { player: 'Amara Diallo',    role: 'Forward',       conflicts: 'Dual-reg fixture clash (loan club)', tour: 'USA',  status: 'Liaison required' },
  { player: 'Niamh Gallagher', role: 'CB',            conflicts: 'ACL screening due',              tour: 'Spain',    status: 'Screened — cleared' },
]

interface Props {
  preSeasonContent?: ReactNode
  defaultTab?: Tab
}

export default function WomensToursAndCampsView({ preSeasonContent, defaultTab = 'preseason' }: Props) {
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
                <div style={{ color: C.text3 }}>Westmoor Sports Travel · contracted 2024-2027 · women\'s-team-specific dietary list workflow.</div>
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
    </div>
  )
}
