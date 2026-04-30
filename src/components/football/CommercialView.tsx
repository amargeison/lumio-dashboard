'use client'

import { useState } from 'react'
import { Briefcase, Users, Ticket, Sparkles, ChevronRight } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#003DA5', amber: '#F1C40F',
}

type Tab = 'sponsorship' | 'hospitality' | 'matchday' | 'partnerships'

const SPONSORSHIP_DEALS = [
  { partner: 'Meridian Watches',   stage: 'Active',       value: '£420,000', renewal: '01 Jul 2026', tier: 'Principal',     contact: 'C. Whitfield' },
  { partner: 'Apex Performance',   stage: 'Active',       value: '£185,000', renewal: '14 Aug 2026', tier: 'Kit',           contact: 'D. Ross' },
  { partner: 'Northshore Brewing', stage: 'Active',       value: '£95,000',  renewal: '01 Jul 2026', tier: 'Stadium',       contact: 'A. Patel' },
  { partner: 'Riverside Healthcare', stage: 'Active',     value: '£62,000',  renewal: '01 Mar 2027', tier: 'Medical',       contact: 'L. Frost' },
  { partner: 'Vanta Sports Drinks', stage: 'Negotiation', value: '£85,000',  renewal: 'TBC',         tier: 'Hydration',     contact: 'M. Carter' },
  { partner: 'Stowe & Hart LLP',   stage: 'Renewal',      value: '£45,000',  renewal: '12 Jun 2026', tier: 'Legal',         contact: 'M. Carter' },
  { partner: 'Kingsmere Toyota',   stage: 'Lead',         value: '£70,000',  renewal: 'TBC',         tier: 'Auto',          contact: 'A. Patel' },
  { partner: 'Local Energy Co',    stage: 'Lapsed',       value: '£35,000',  renewal: 'Apr 2026',    tier: 'Utilities',     contact: 'A. Patel' },
]

const HOSPITALITY_BOXES = [
  { name: 'Director\'s Box',     capacity: 12, season: 'Sold',    price: '£18,000', occupancy: 100 },
  { name: 'Founders Suite',      capacity: 24, season: 'Sold',    price: '£12,500', occupancy: 100 },
  { name: 'Heritage Lounge',     capacity: 60, season: 'Partial', price: '£950 pp', occupancy: 78  },
  { name: 'Boardroom Hospitality', capacity: 40, season: 'Partial', price: '£780 pp', occupancy: 65 },
  { name: 'Apex Performance Suite', capacity: 30, season: 'Sold', price: '£14,800', occupancy: 100 },
  { name: 'Family Hospitality',  capacity: 80, season: 'Match-by-match', price: '£280 pp', occupancy: 56 },
]

const MATCHDAY_REVENUE = [
  { fixture: 'vs Hartwell Town',   gate: 89400, food: 18200, programme: 1280, retail: 4400, total: 113280 },
  { fixture: 'vs Eastcliff Town',  gate: 91200, food: 19400, programme: 1340, retail: 5100, total: 117040 },
  { fixture: 'vs Kingsport FC',    gate: 78600, food: 15800, programme: 980,  retail: 3400, total: 98780  },
  { fixture: 'vs Redmill United',  gate: 84100, food: 17500, programme: 1180, retail: 4900, total: 107680 },
  { fixture: 'vs Calderbrook Tn',  gate: 92900, food: 20100, programme: 1420, retail: 5800, total: 120220 },
]

const PARTNERSHIPS = [
  { name: 'Meridian Watches',     type: 'Principal sponsor',    status: 'Active',      since: 2023, activations: 12 },
  { name: 'Apex Performance',     type: 'Kit + medical',        status: 'Active',      since: 2024, activations: 8  },
  { name: 'Riverside Healthcare', type: 'Medical partner',      status: 'Active',      since: 2022, activations: 4  },
  { name: 'Stowe & Hart LLP',     type: 'Legal services',       status: 'Active',      since: 2021, activations: 2  },
  { name: 'Northshore Brewing',   type: 'Stadium brand',        status: 'Active',      since: 2023, activations: 6  },
]

const AMBASSADORS = [
  { name: 'Rachel Holt',    role: 'Former Captain (2010-2017)',  appearances: 14, area: 'Schools + matchday' },
  { name: 'Harvey Knibbs',  role: 'Current first team',           appearances: 6,  area: 'Foundation' },
  { name: 'Tony Wilks',     role: 'Club legend (1989-1998)',      appearances: 9,  area: 'Heritage events' },
  { name: 'Emma Stowe',     role: 'Local Olympic medallist',      appearances: 3,  area: 'Community days' },
]

export default function CommercialView({ club }: { club?: { name?: string } | null }) {
  void club
  const [tab, setTab] = useState<Tab>('sponsorship')
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'sponsorship',  label: 'Sponsorship Pipeline', icon: Briefcase },
    { id: 'hospitality',  label: 'Hospitality',          icon: Users },
    { id: 'matchday',     label: 'Matchday Revenue',     icon: Ticket },
    { id: 'partnerships', label: 'Partnerships & Brand', icon: Sparkles },
  ]

  const stageColor = (s: string) => s === 'Active' ? C.good : s === 'Negotiation' || s === 'Renewal' ? C.warn : s === 'Lead' ? C.accent : C.bad

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Briefcase size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Commercial</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Sponsorship · hospitality · matchday revenue · partnerships</p>
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
        {tab === 'sponsorship' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Active" value="£762k" sub="annualised" />
              <KpiCard label="Pipeline" value="£200k" sub="negotiation + leads" accent={C.warn} />
              <KpiCard label="Renewals" value="£465k" sub="next 90 days" accent={C.warn} />
              <KpiCard label="At Risk" value="£35k" sub="Local Energy lapsed" accent={C.bad} />
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Partner','Tier','Stage','Annual Value','Renewal','Lead'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {SPONSORSHIP_DEALS.map(d => (
                    <tr key={d.partner} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{d.partner}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text3 }}>{d.tier}</td>
                      <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${stageColor(d.stage)}26`, color: stageColor(d.stage) }}>{d.stage.toUpperCase()}</span></td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{d.value}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{d.renewal}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text3 }}>{d.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'hospitality' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Boxes Sold (Season)" value="3 of 6" sub="50% sold" />
              <KpiCard label="Suite Occupancy" value="82%" sub="rolling avg" accent={C.good} />
              <KpiCard label="Matchday Hospitality Yield" value="£24,800" sub="per fixture avg" />
              <KpiCard label="Pre-orders MD7" value="178" sub="3-course menu" accent={C.warn} />
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Suite / Box','Capacity','Pricing','Season Status','Occupancy'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {HOSPITALITY_BOXES.map(b => (
                    <tr key={b.name} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{b.name}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{b.capacity}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{b.price}</td>
                      <td className="px-3 py-2.5" style={{ color: b.season === 'Sold' ? C.good : b.season === 'Partial' ? C.warn : C.text3 }}>{b.season}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full" style={{ background: C.borderHi }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${b.occupancy}%`, background: b.occupancy >= 90 ? C.good : b.occupancy >= 60 ? C.warn : C.bad }} />
                          </div>
                          <span className="font-mono text-[11px]" style={{ color: C.text2 }}>{b.occupancy}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'matchday' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Avg Gate" value="£87,240" sub="last 5 home" />
              <KpiCard label="F&B Yield" value="£18,200" sub="avg per fixture" accent={C.good} />
              <KpiCard label="Programme" value="£1,240" sub="avg sales" />
              <KpiCard label="Retail" value="£4,720" sub="avg per fixture" accent={C.good} />
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Fixture','Gate','F&B','Programme','Retail','Total'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {MATCHDAY_REVENUE.map(r => (
                    <tr key={r.fixture} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.fixture}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>£{r.gate.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>£{r.food.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>£{r.programme.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>£{r.retail.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.amber }}>£{r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'partnerships' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Active Partners</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Partner','Type','Status','Since','Activations YTD'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {PARTNERSHIPS.map(p => (
                      <tr key={p.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.type}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.good}26`, color: C.good }}>{p.status.toUpperCase()}</span></td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.since}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.activations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Ambassador Programme</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AMBASSADORS.map(a => (
                  <div key={a.name} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-bold" style={{ color: C.text }}>{a.name}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{a.appearances} apps</span>
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: C.text4 }}>{a.role}</div>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.text3 }}>
                      <ChevronRight size={11} />{a.area}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent ?? C.accent }}>{sub}</div>
    </div>
  )
}
