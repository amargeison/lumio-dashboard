'use client'

import React, { useState } from 'react'
import { Plane, Sparkles, X, Bus, BedDouble, Utensils, Truck, CheckCircle2, Loader2, MapPin } from 'lucide-react'

// Men's Pro — Travel & Logistics (mirrors the Women's flagship structure).
// The AI Travel Researcher is the hero; cost-compare and suppliers support it.
// DEMO-SAFE — canned researcher output, no real bookings.

const C = {
  panel: '#111318', panel2: '#0a0c14', border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', accent: '#003DA5',
}

type Book = 'done' | 'partial' | 'none'
const bookCell = (b: Book) => b === 'done'
  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${C.green}1a`, color: C.green }}>Booked</span>
  : b === 'partial'
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${C.amber}1a`, color: C.amber }}>Partial</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${C.text4}26`, color: C.text3 }}>To do</span>

type AwayRow = { opp: string; date: string; dist: string; coach: Book; hotel: Book; meals: Book; overall: 'Ready' | 'In progress' | 'Not started' }
const AWAY: AwayRow[] = [
  { opp: 'Eastcliff Town', date: 'Sat 5 Apr · 15:00', dist: '142 mi', coach: 'done', hotel: 'none', meals: 'done', overall: 'In progress' },
  { opp: 'Barford Town', date: 'Sat 18 Apr · 19:45', dist: '88 mi', coach: 'done', hotel: 'partial', meals: 'partial', overall: 'In progress' },
  { opp: 'Kingsport FC', date: 'Sat 26 Apr · 15:00', dist: '168 mi', coach: 'partial', hotel: 'none', meals: 'none', overall: 'Not started' },
  { opp: 'Riverton Albion', date: 'Sat 10 May · 15:00', dist: '210 mi', coach: 'none', hotel: 'none', meals: 'none', overall: 'Not started' },
]

const SUPPLIERS = [
  { name: 'Coachline Travel', type: 'Team coach', terms: 'Contracted 2024–27', note: '53-seat exec coach · WiFi · galley' },
  { name: 'Northgate Park Hotel', type: 'Overnight (north away days)', terms: 'Preferred rate', note: '4★ · 26 twin rooms · meeting suite' },
  { name: 'Fuel Performance Catering', type: 'Pre-match meals', terms: 'Per-trip', note: 'Sports-nutrition menus · dietary list workflow' },
  { name: 'Apex Freight', type: 'Kit & equipment', terms: 'Ad-hoc', note: 'Skip + medical kit transport' },
]

export default function FootballTravelLogistics() {
  const [tab, setTab] = useState<'overview' | 'compare' | 'suppliers'>('overview')
  const [researcher, setResearcher] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Plane size={18} style={{ color: C.accent }} /> Travel &amp; Logistics</h2>
          <p className="text-sm mt-1" style={{ color: C.text3 }}>Away-day planning, supplier management and the AI Travel Researcher.</p>
        </div>
        <button onClick={() => setResearcher(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: C.accent, boxShadow: `0 4px 14px ${C.accent}55` }}>
          <Sparkles size={15} /> Plan away trip
        </button>
      </div>

      <div className="flex items-center gap-1" style={{ borderBottom: `1px solid ${C.border}` }}>
        {([['overview', 'Overview'], ['compare', 'Cost compare'], ['suppliers', 'Suppliers']] as [typeof tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ color: tab === id ? C.text : C.text3, borderBottom: `2px solid ${tab === id ? C.accent : 'transparent'}`, marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap" style={{ background: `linear-gradient(135deg, ${C.accent}22, ${C.panel} 60%)`, border: `1px solid ${C.accent}44` }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${C.accent}26`, border: `1px solid ${C.accent}55` }}><Sparkles size={20} style={{ color: '#7AA7D9' }} /></div>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>AI Travel Researcher</div>
                <div className="text-[12px]" style={{ color: C.text3 }}>Find &amp; score coaches, hotels and pre-match meals for any away day — in 90 seconds.</div>
              </div>
            </div>
            <button onClick={() => setResearcher(true)} className="rounded-lg px-3.5 py-2 text-xs font-bold text-white" style={{ backgroundColor: C.accent }}>Launch</button>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Upcoming away days</p></div>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Fixture', 'Date', 'Distance', 'Coach', 'Hotel', 'Meals', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
              {AWAY.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{r.opp}</td>
                <td className="px-4 py-3" style={{ color: C.text3 }}>{r.date}</td>
                <td className="px-4 py-3" style={{ color: C.text3 }}>{r.dist}</td>
                <td className="px-4 py-3">{bookCell(r.coach)}</td>
                <td className="px-4 py-3">{bookCell(r.hotel)}</td>
                <td className="px-4 py-3">{bookCell(r.meals)}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.overall === 'Ready' ? `${C.green}1a` : r.overall === 'In progress' ? `${C.amber}1a` : `${C.text4}26`, color: r.overall === 'Ready' ? C.green : r.overall === 'In progress' ? C.amber : C.text3 }}>{r.overall}</span></td>
              </tr>))}
            </tbody></table></div>
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Same-day vs overnight — Barford Town (A), Sat 19:45 KO</h3>
          <p className="text-[11px] mb-4" style={{ color: C.text4 }}>88 mi · evening kick-off · squad of 20 + 12 staff</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([['Same-day return', [['Coach', '£1,200'], ['Pre-match meal', '£640'], ['Post-match food', '£420'], ['Driver hours', 'Within limit']], '£2,260', false],
               ['Overnight stay', [['Coach', '£1,200'], ['Hotel (26 rooms)', '£2,940'], ['Meals (dinner + b/fast)', '£1,180'], ['Recovery benefit', 'High']], '£5,320', true]] as [string, [string, string][], string, boolean][]).map(([title, lines, total, rec]) => (
              <div key={title} className="rounded-xl p-4" style={{ background: C.panel2, border: `1px solid ${rec ? C.accent + '66' : C.border}` }}>
                <div className="flex items-center justify-between mb-2"><div className="text-sm font-bold" style={{ color: C.text }}>{title}</div>{rec && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AA7D9' }}>RECOMMENDED</span>}</div>
                {lines.map(([l, v]) => (<div key={l} className="flex justify-between py-1.5 text-[12px]" style={{ borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.text3 }}>{l}</span><span style={{ color: C.text2 }}>{v}</span></div>))}
                <div className="flex justify-between pt-2 mt-1 text-sm font-bold" style={{ color: C.text }}><span>Total</span><span style={{ color: C.accent }}>{total}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 text-[11px]" style={{ background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, color: C.text2 }}>For a late KO 200+ miles away, the recovery and arrival-time gain of an overnight usually outweighs the cost — under 100 miles, same-day return is the call.</div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Contracted suppliers</p><button onClick={() => setResearcher(true)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: C.accent }}>Find new</button></div>
          <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Supplier', 'Type', 'Terms', 'Notes'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
            {SUPPLIERS.map((s, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="px-4 py-3 font-medium" style={{ color: C.text }}>{s.name}</td><td className="px-4 py-3" style={{ color: C.text3 }}>{s.type}</td><td className="px-4 py-3" style={{ color: C.text3 }}>{s.terms}</td><td className="px-4 py-3" style={{ color: C.text4 }}>{s.note}</td></tr>))}
          </tbody></table>
        </div>
      )}

      {researcher && <Researcher onClose={() => setResearcher(false)} />}
    </div>
  )
}

function Researcher({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 1100); return () => clearTimeout(t) }, [])
  const Section = ({ icon: Icon, title, items }: { icon: React.ElementType; title: string; items: [string, string, string][] }) => (
    <div className="rounded-xl p-4" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 mb-2"><Icon size={14} style={{ color: '#7AA7D9' }} /><span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text3 }}>{title}</span></div>
      {items.map(([n, d, s], i) => (<div key={i} className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}><div><div className="text-[12.5px] font-medium" style={{ color: C.text }}>{n}</div><div className="text-[10.5px]" style={{ color: C.text4 }}>{d}</div></div><span className="text-[11px] font-bold flex-shrink-0" style={{ color: C.accent }}>{s}</span></div>))}
    </div>
  )
  return (
    <>
      <div className="fixed inset-0 z-[100]" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden flex flex-col" style={{ width: 'min(640px, 94vw)', maxHeight: '90vh', backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2"><Sparkles size={16} style={{ color: '#7AA7D9' }} /><span className="font-bold" style={{ color: C.text }}>AI Travel Researcher — Eastcliff Town (A)</span></div>
          <button onClick={onClose} style={{ color: C.text4 }}><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-[12.5px] py-10 justify-center" style={{ color: C.text3 }}><Loader2 size={16} className="animate-spin" style={{ color: C.accent }} /> Researching coaches, hotels &amp; meals near Eastcliff…</div>
          ) : (<>
            <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg" style={{ background: `${C.green}12`, color: C.text2 }}><CheckCircle2 size={14} style={{ color: C.green }} /> 142 miles · same-day return recommended (early KO, driver hours fine).</div>
            <Section icon={Bus} title="Coach" items={[['Coachline Travel — 53-seat exec', 'Contracted · WiFi · galley · arrives 90m pre-KO', 'Best'], ['Regional Coaches Ltd', 'Quote on request · standard spec', 'Backup']]} />
            <Section icon={Utensils} title="Pre-match meal" items={[['Fuel Performance Catering', 'On-coach hot meal · 3h pre-KO · dietary list', 'Best'], ['Eastcliff Town facilities', 'Away dressing-room space limited', 'Avoid']]} />
            <Section icon={BedDouble} title="Hotel (if overnight needed)" items={[['Northgate Park Hotel', '4★ · 26 twins · meeting suite · not required today', 'Hold']]} />
            <div className="text-[10px]" style={{ color: C.text4 }}>Demo — canned research, no booking made. Draft the enquiry and hand off; Lumio never books for you.</div>
          </>)}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm" style={{ color: C.text4 }}>Close</button>
          <button onClick={onClose} disabled={loading} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: C.accent }}>Draft enquiry</button>
        </div>
      </div>
    </>
  )
}
