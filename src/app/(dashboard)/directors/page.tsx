'use client'

import { useState } from 'react'
import {
  Crown, FileText, Calendar, Target, Shield, Users, TrendingUp,
  Plus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Lock,
} from 'lucide-react'
import { PageShell } from '@/components/page-ui'
import ExportPdfButton from '@/components/ExportPdfButton'
import { useHasDashboardData } from '@/components/dashboard/EmptyState'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const G = '#C8960C'
const GB = 'rgba(200,150,12,0.08)'
const GBD = 'rgba(200,150,12,0.25)'
const TIP = { backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }
const CS: React.CSSProperties = { backgroundColor: '#0D0E14', border: '1px solid #1F2937', borderRadius: 16, padding: 20 }
const DS: React.CSSProperties = { backgroundColor: '#07080C', border: '1px solid #1F2937', borderRadius: 12 }
const TH: React.CSSProperties = { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }
const TD: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #1F293740' }
const CC = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#6366F1']

function S({ label, value, sub, color, trend }: { label: string; value: string | number; sub?: string; color: string; trend?: string }) {
  return (<div className="rounded-xl p-4" style={DS}><p className="text-[10px] font-semibold uppercase mb-1" style={{ color: '#6B7280' }}>{label}</p><div className="flex items-end gap-2"><p className="text-2xl font-black" style={{ color }}>{value}</p>{trend && <span className="text-xs font-semibold mb-1" style={{ color: trend.startsWith('+') || trend.startsWith('↑') ? '#22C55E' : trend.startsWith('-') || trend.startsWith('↓') ? '#EF4444' : '#6B7280' }}>{trend}</span>}</div>{sub && <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{sub}</p>}</div>)
}
function R({ label, color }: { label: string; color: string }) { return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>{label}</span> }
function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (<div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">{tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: active === t.id ? G : '#0D0E14', color: active === t.id ? '#fff' : '#6B7280', border: active === t.id ? `1px solid ${G}` : '1px solid #1F2937' }}>{t.label}</button>)}</div>)
}
function AI({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(true)
  return (<div className="overflow-hidden rounded-xl" style={{ border: `2px solid ${GBD}` }}><button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: GB, borderBottom: open ? `1px solid ${GBD}` : undefined }} onClick={() => setOpen(v => !v)}><div className="flex items-center gap-2"><Crown size={14} style={{ color: G }} /><span className="text-sm font-bold" style={{ color: G }}>{title}</span></div>{open ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}</button>{open && <div className="flex flex-col gap-2.5 p-5" style={{ backgroundColor: '#05060A' }}>{items.map((item, i) => <div key={i} className="flex gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: GB, color: G }}>{i + 1}</span><p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p></div>)}</div>}</div>)
}

type Tab = 'board' | 'finance' | 'commercial' | 'people' | 'risk' | 'meetings' | 'strategy' | 'events' | 'notes'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'board', label: 'Board Overview', icon: '👑' }, { id: 'finance', label: 'Financial Performance', icon: '💰' },
  { id: 'commercial', label: 'Commercial', icon: '📈' }, { id: 'people', label: 'People & Culture', icon: '👥' },
  { id: 'risk', label: 'Risk & Compliance', icon: '🛡️' }, { id: 'meetings', label: 'Board Meetings', icon: '📋' },
  { id: 'strategy', label: 'Strategy & OKRs', icon: '🎯' }, { id: 'events', label: 'Away Days & Events', icon: '🏖️' },
  { id: 'notes', label: 'Confidential Notes', icon: '📝' },
]

// ═══════════════════════════════════════════════════════════════════════════════
function BoardOverview() {
  const revBurn = [{ m: 'Oct', rev: 32, burn: 112 }, { m: 'Nov', rev: 35, burn: 111 }, { m: 'Dec', rev: 38, burn: 110 }, { m: 'Jan', rev: 40, burn: 109 }, { m: 'Feb', rev: 42, burn: 108 }, { m: 'Mar', rev: 43, burn: 108 }]
  const scorecard = [{ d: 'Revenue', q1: 82, q0: 74 }, { d: 'Retention', q1: 91, q0: 88 }, { d: 'Engagement', q1: 74, q0: 68 }, { d: 'Product', q1: 83, q0: 80 }, { d: 'Ops', q1: 94, q0: 89 }, { d: 'Market', q1: 68, q0: 62 }, { d: 'Finance', q1: 88, q0: 82 }, { d: 'Culture', q1: 79, q0: 73 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <S label="MRR" value="£42,800" color={G} trend="+18% MoM" /><S label="ARR Run Rate" value="£513.6k" color="#0D9488" trend="+127% YoY" /><S label="Cash Runway" value="18 months" color="#22C55E" sub="Series A window Q3" /><S label="Headcount" value="187" color="#3B82F6" trend="+3" /><S label="NPS" value="67" color="#22C55E" trend="+8" /><S label="Burn Multiple" value="0.8" color="#22C55E" sub="Efficient growth" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue vs Burn (£k/mo)</h4><ResponsiveContainer width="100%" height={200}><AreaChart data={revBurn} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Legend wrapperStyle={{ fontSize: 11 }} /><Area type="monotone" dataKey="rev" name="Revenue" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} /><Area type="monotone" dataKey="burn" name="Burn" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Scorecard</h4><ResponsiveContainer width="100%" height={200}><RadarChart data={scorecard}><PolarGrid stroke="#1F2937" /><PolarAngleAxis dataKey="d" tick={{ fill: '#9CA3AF', fontSize: 9 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 8 }} /><Radar name="This Q" dataKey="q1" stroke={G} fill={G} fillOpacity={0.2} strokeWidth={2} /><Radar name="Last Q" dataKey="q0" stroke="#374151" fill="#374151" fillOpacity={0.1} strokeWidth={1} /><Tooltip contentStyle={TIP} /></RadarChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Investor KPIs (Quarterly)</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ q: 'Q1', magic: 0.6, quick: 2.8, ltvcac: 3.2 }, { q: 'Q2', magic: 0.7, quick: 3.1, ltvcac: 3.5 }, { q: 'Q3', magic: 0.8, quick: 3.4, ltvcac: 3.8 }, { q: 'Q4', magic: 0.8, quick: 3.6, ltvcac: 4.1 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="q" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="magic" name="Magic Number" fill="#0D9488" radius={[3, 3, 0, 0]} /><Bar dataKey="quick" name="Quick Ratio" fill="#3B82F6" radius={[3, 3, 0, 0]} /><Bar dataKey="ltvcac" name="LTV:CAC" fill="#8B5CF6" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-4" style={{ color: G }}>Board Priorities This Quarter</h4>{[
        { name: 'Reach £50k MRR by Q3', pct: 86, owner: 'James Hartley', due: 'Sep 2026' },
        { name: 'Series A Readiness', pct: 62, owner: 'James Hartley', due: 'Dec 2026' },
        { name: 'Close PP Gap <3 months', pct: 45, owner: 'Sophie Brennan', due: 'Jul 2026' },
        { name: 'Build world-class team', pct: 71, owner: 'HR Lead', due: 'Jun 2026' },
      ].map((p, i) => <div key={i} className="mb-4"><div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>🎯 {p.name}</span><R label={p.pct >= 75 ? 'On Track' : 'At Risk'} color={p.pct >= 75 ? '#22C55E' : '#F59E0B'} /></div><div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.pct >= 75 ? '#22C55E' : G }} /></div><p className="text-[10px]" style={{ color: '#4B5563' }}>{p.owner} · Due {p.due} · {p.pct}%</p></div>)}</div>
      <AI title={`Director Briefing — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`} items={['MRR up 18% to £42,800 — on track for £50k Series A milestone by Q3', 'Burn multiple at 0.8 — company growing efficiently, below 1.0 target', 'Cash runway 18 months — Series A conversations should begin Q3 2026', '1 compliance alert: M. Taylor DBS expired 23 days — requires urgent action', 'Staff wellbeing at 7.4/10 — highest this year, culture initiative working', '3 open roles delaying capacity expansion by est. 6 weeks', 'NPS up to 67 — strongest score since founding', 'Q2 board meeting scheduled 15 May — pack due by 8 May']} />
    </div>
    <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#EF4444' }}>What needs a director decision?</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[
      { dot: '#EF4444', title: 'M. Taylor DBS — expired 23 days', desc: 'Legal risk. Requires director sign-off on temporary access suspension.', btn: 'Review & Sign Off' },
      { dot: '#F59E0B', title: '3 Open Roles — 6 weeks delayed', desc: 'Engineering, Sales, Support unfilled. Approve revised compensation bands?', btn: 'Review Job Specs' },
      { dot: '#F59E0B', title: 'Series A Timeline — Q3 target', desc: 'Investor deck needs update. Book advisor meeting?', btn: 'Schedule Meeting' },
    ].map((a, i) => <div key={i} className="rounded-xl p-4" style={{ ...DS, borderLeft: `3px solid ${a.dot}` }}><p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{a.title}</p><p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{a.desc}</p><button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: a.dot + '20', color: a.dot }}>{a.btn}</button></div>)}</div></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function FinanceTab() {
  const [sub, setSub] = useState('pnl')
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"><S label="Revenue" value="£55.1k" color="#0D9488" trend="+22%" /><S label="Gross Margin" value="79%" color="#22C55E" /><S label="Burn Rate" value="£107.8k" color="#EF4444" trend="-£8.2k" sub="Improving" /><S label="Cash in Bank" value="£1.94M" color="#22C55E" /><S label="Runway" value="18 months" color="#22C55E" /><S label="EBITDA" value="-£107.8k" color="#EF4444" sub="Gap closing" /></div>
    <SubTabs tabs={[{ id: 'pnl', label: 'P&L' }, { id: 'cash', label: 'Cash & Runway' }, { id: 'rev', label: 'Revenue Breakdown' }, { id: 'forecast', label: 'Forecasts' }]} active={sub} onChange={setSub} />
    {sub === 'pnl' && <div className="space-y-4">
      <div className="rounded-xl overflow-hidden" style={DS}><table className="w-full text-xs"><tbody>
        {[['REVENUE', '', true], ['Subscription MRR', '£42,800', false], ['One-time revenue', '£4,200', false], ['Professional Services', '£8,100', false], ['Total Revenue', '£55,100', true],
          ['', '', false], ['COST OF REVENUE', '', true], ['Hosting & Infrastructure', '£3,200', false], ['Support staff (direct)', '£8,400', false], ['Total COGS', '£11,600', true], ['Gross Profit', '£43,500 (79%)', true],
          ['', '', false], ['OPERATING EXPENSES', '', true], ['Salaries & Benefits', '£118,000', false], ['Marketing', '£14,200', false], ['Software & Tools', '£4,800', false], ['Office & Premises', '£8,400', false], ['Legal & Professional', '£3,100', false], ['Other', '£2,800', false], ['Total OpEx', '£151,300', true],
          ['', '', false], ['EBITDA', '-£107,800/month', true],
        ].map(([label, val, bold], i) => label === '' ? <tr key={i}><td style={{ height: 8 }} colSpan={2} /></tr> : <tr key={i}><td style={{ ...TD, color: bold ? '#F9FAFB' : '#9CA3AF', fontWeight: (bold as boolean) ? 700 : 400, paddingLeft: (bold as boolean) ? 12 : 28 }}>{label as string}</td><td style={{ ...TD, color: (val as string).startsWith('-') ? '#EF4444' : (val as string).includes('£') ? '#F9FAFB' : '#9CA3AF', fontWeight: (bold as boolean) ? 700 : 400, textAlign: 'right' }}>{val as string}</td></tr>)}
      </tbody></table></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Monthly P&L Trend (£k)</h4><ResponsiveContainer width="100%" height={200}><AreaChart data={[{ m: 'Oct', rev: 32, cost: 115 }, { m: 'Nov', rev: 35, cost: 114 }, { m: 'Dec', rev: 38, cost: 112 }, { m: 'Jan', rev: 40, cost: 111 }, { m: 'Feb', rev: 42, cost: 110 }, { m: 'Mar', rev: 43, cost: 108 }]} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Legend wrapperStyle={{ fontSize: 11 }} /><Area type="monotone" dataKey="rev" name="Revenue" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} /><Area type="monotone" dataKey="cost" name="Costs" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div>
    </div>}
    {sub === 'cash' && <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3"><S label="Cash in Bank" value="£1.94M" color="#22C55E" /><S label="Monthly Burn" value="£107.8k" color="#EF4444" /><S label="Runway" value="18 months" color="#22C55E" /></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Cash Flow (£k)</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ m: 'Oct', inflow: 32, outflow: -115 }, { m: 'Nov', inflow: 35, outflow: -114 }, { m: 'Dec', inflow: 38, outflow: -112 }, { m: 'Jan', inflow: 40, outflow: -111 }, { m: 'Feb', inflow: 42, outflow: -110 }, { m: 'Mar', inflow: 43, outflow: -108 }]} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="inflow" name="Revenue In" fill="#22C55E" radius={[3, 3, 0, 0]} /><Bar dataKey="outflow" name="Costs Out" fill="#EF4444" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Scenario Modelling</h4>{[{ s: 'Base (current)', runway: '18 months', color: '#22C55E' }, { s: 'Accelerated growth (+20% MRR)', runway: '22 months', color: '#0D9488' }, { s: 'Cost reduction (-10%)', runway: '21 months', color: '#3B82F6' }, { s: 'Both', runway: '26 months', color: G }].map((sc, i) => <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{sc.s}</span><span className="text-sm font-bold" style={{ color: sc.color }}>{sc.runway}</span></div>)}</div>
    </div>}
    {sub === 'rev' && <div className="space-y-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue by Plan</h4><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[{ name: 'Starter', value: 28 }, { name: 'Pro', value: 45 }, { name: 'Enterprise', value: 27 }]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name} ${value}%`}>{[0, 1, 2].map(i => <Cell key={i} fill={CC[i]} />)}</Pie><Tooltip contentStyle={TIP} /></PieChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue by Geography</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ geo: 'UK', arr: 28.4 }, { geo: 'US', arr: 8.2 }, { geo: 'EU', arr: 4.1 }, { geo: 'Other', arr: 2.1 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="geo" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} formatter={(v: any) => `£${v}k`} /><Bar dataKey="arr" name="MRR (£k)" fill={G} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div><div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue Quality</h4>{[['Net Revenue Retention', '112%', '#22C55E'], ['Gross Revenue Retention', '96.8%', '#22C55E'], ['Expansion MRR', '+£3,100', '#0D9488'], ['Contraction MRR', '-£800', '#F59E0B'], ['Churn MRR', '-£1,400', '#EF4444']].map(([l, v, c], i) => <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-sm font-bold" style={{ color: c as string }}>{v}</span></div>)}</div></div>}
    {sub === 'forecast' && <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>12-Month MRR Forecast (£k)</h4><ResponsiveContainer width="100%" height={240}><LineChart data={Array.from({ length: 12 }, (_, i) => ({ m: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i], base: 45 + i * 2.7, bull: 45 + i * 4.2, bear: 45 + i * 0.8 }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Math.round(v as number)}k`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="bull" name="Bull" stroke="#22C55E" strokeWidth={1.5} strokeDasharray="5 5" dot={false} /><Line type="monotone" dataKey="base" name="Base" stroke={G} strokeWidth={2} dot={{ r: 2 }} /><Line type="monotone" dataKey="bear" name="Bear" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div>}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function CommercialTab() {
  const [sub, setSub] = useState('pipeline')
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"><S label="Pipeline" value="£284k" color={G} /><S label="Weighted" value="£142k" color="#0D9488" /><S label="Close Rate" value="34%" color="#22C55E" trend="+4%" /><S label="Customers" value="171" color="#3B82F6" trend="+23" /><S label="NPS" value="67" color="#22C55E" /><S label="Partner Revenue" value="£124.8k" color="#8B5CF6" /></div>
    <SubTabs tabs={[{ id: 'pipeline', label: 'Pipeline' }, { id: 'customers', label: 'Customers' }, { id: 'partners', label: 'Partnerships' }, { id: 'market', label: 'Market' }]} active={sub} onChange={setSub} />
    {sub === 'pipeline' && <div className="space-y-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Sales Funnel</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ s: 'Leads', v: 47 }, { s: 'Qualified', v: 28 }, { s: 'Demo', v: 19 }, { s: 'Proposal', v: 12 }, { s: 'Negotiation', v: 8 }, { s: 'Won', v: 23 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="s" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="v" radius={[4, 4, 0, 0]}>{[0, 1, 2, 3, 4, 5].map(i => <Cell key={i} fill={CC[i]} />)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F59E0B' }}>Win/Loss Analysis</h4><ResponsiveContainer width="100%" height={160}><PieChart><Pie data={[{ name: 'Price', value: 42 }, { name: 'Feature gap', value: 28 }, { name: 'Competitor', value: 18 }, { name: 'Timing', value: 12 }]} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, value }: any) => `${name} ${value}%`}>{[0, 1, 2, 3].map(i => <Cell key={i} fill={CC[i + 3]} />)}</Pie><Tooltip contentStyle={TIP} /></PieChart></ResponsiveContainer></div>
    </div>}
    {sub === 'customers' && <div className="space-y-4"><div className="grid grid-cols-3 gap-3"><S label="Healthy" value={132} color="#22C55E" /><S label="At Risk" value={29} color="#F59E0B" /><S label="Critical" value={10} color="#EF4444" /></div>
      <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Top 10 by ARR</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#05060A' }}>{['Company', 'ARR', 'Plan', 'Health', 'Since'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{[['Greenfield Academy', '£91k', 'Enterprise', 'green', 'Jan 24'], ['Oakridge Schools', '£76k', 'Enterprise', 'green', 'Mar 24'], ['Bramble Hill Trust', '£55k', 'Pro', 'amber', 'Jun 24'], ['Hopscotch Learning', '£42k', 'Pro', 'green', 'Aug 24'], ['Crestview Academy', '£33.4k', 'Pro', 'green', 'Sep 24']].map(([co, arr, plan, h, since], i) => <tr key={i}><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>{co}</td><td style={{ ...TD, color: '#F9FAFB' }}>{arr}</td><td style={{ ...TD, color: '#9CA3AF' }}>{plan}</td><td style={TD}><R label={h === 'green' ? 'Healthy' : 'At Risk'} color={h === 'green' ? '#22C55E' : '#F59E0B'} /></td><td style={{ ...TD, color: '#6B7280' }}>{since}</td></tr>)}</tbody></table></div></div>}
    {sub === 'partners' && <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Partner Revenue</h4>{[['Apex Learning Solutions', '£68,400', 'Active'], ['Horizon Group', '£28,200', 'Active'], ['BlueStack Education', '£14,800', 'Active'], ['Compass Digital', '£8,400', 'Prospect'], ['Northern EdTech', '£5,000', 'Prospect']].map(([name, arr, status], i) => <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? '1px solid #1F293740' : 'none' }}><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{name}</span><div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: '#0D9488' }}>{arr}</span><R label={status as string} color={status === 'Active' ? '#22C55E' : '#F59E0B'} /></div></div>)}</div>}
    {sub === 'market' && <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Competitive Position</h4><ResponsiveContainer width="100%" height={220}><RadarChart data={[{ d: 'Price', us: 70, comp: 65 }, { d: 'Features', us: 78, comp: 82 }, { d: 'AI', us: 88, comp: 60 }, { d: 'UX', us: 85, comp: 72 }, { d: 'Support', us: 90, comp: 70 }, { d: 'Integrations', us: 65, comp: 80 }]}><PolarGrid stroke="#1F2937" /><PolarAngleAxis dataKey="d" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} /><Radar name="Lumio" dataKey="us" stroke={G} fill={G} fillOpacity={0.2} strokeWidth={2} /><Radar name="Competitors" dataKey="comp" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1.5} /><Tooltip contentStyle={TIP} /></RadarChart></ResponsiveContainer><div className="mt-3 space-y-1">{[['TAM', '£4.2B — global education SaaS'], ['SAM', '£200M — UK MIS market'], ['SOM', '£8M — realistic 5-year capture']].map(([l, v], i) => <div key={i} className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>{l}</span><span style={{ color: '#F9FAFB' }}>{v}</span></div>)}</div></div>}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function PeopleTab() {
  const [sub, setSub] = useState('exec')
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"><S label="Headcount" value={187} color="#0D9488" trend="+3" /><S label="eNPS" value={42} color="#22C55E" /><S label="Wellbeing" value="7.4/10" color="#22C55E" /><S label="Open Roles" value={3} color="#F59E0B" /><S label="Retention" value="87%" color="#3B82F6" /><S label="Comp Bill" value="£2.4M/yr" color="#8B5CF6" /></div>
    <SubTabs tabs={[{ id: 'exec', label: 'Executive Team' }, { id: 'headcount', label: 'Headcount' }, { id: 'wellbeing', label: 'Wellbeing' }, { id: 'remuneration', label: 'Remuneration' }]} active={sub} onChange={setSub} />
    {sub === 'exec' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[
      { name: 'James Hartley', role: 'CEO', tenure: '5 years', hc: 187, okr: 86, perf: 'Exceeding', color: '#7C3AED' },
      { name: 'Sophie Brennan', role: 'Marketing Director', tenure: '3 years', hc: 18, okr: 78, perf: 'Meeting', color: '#EC4899' },
      { name: 'Marcus Webb', role: 'Sales Director', tenure: '2 years', hc: 28, okr: 92, perf: 'Exceeding', color: '#0D9488' },
      { name: 'Rachel Osei', role: 'Operations Manager', tenure: '4 years', hc: 24, okr: 71, perf: 'Meeting', color: '#F59E0B' },
      { name: 'Tom Fielding', role: 'Support Lead', tenure: '2 years', hc: 12, okr: 68, perf: 'Meeting', color: '#6D28D9' },
      { name: 'Claire Donovan', role: 'IT Director', tenure: '5 years', hc: 8, okr: 88, perf: 'Exceeding', color: '#0EA5E9' },
    ].map((e, i) => <div key={i} className="rounded-xl p-4" style={{ ...DS, borderLeft: `3px solid ${e.color}` }}><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: e.color + '20', color: e.color }}>{e.name.split(' ').map(w => w[0]).join('')}</div><div><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{e.name}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{e.role} · {e.tenure}</p></div></div><div className="flex justify-between text-[10px] mb-1"><span style={{ color: '#6B7280' }}>Team: {e.hc}</span><span style={{ color: '#6B7280' }}>OKR: {e.okr}%</span><R label={e.perf} color={e.perf === 'Exceeding' ? '#22C55E' : '#3B82F6'} /></div></div>)}</div>}
    {sub === 'headcount' && <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Headcount by Department</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ d: 'Eng', c: 42 }, { d: 'Sales', c: 28 }, { d: 'Support', c: 24 }, { d: 'Marketing', c: 18 }, { d: 'HR', c: 12 }, { d: 'Finance', c: 8 }, { d: 'Ops', c: 24 }, { d: 'IT', c: 8 }, { d: 'Other', c: 23 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="d" tick={{ fill: '#9CA3AF', fontSize: 9 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="c" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
    {sub === 'wellbeing' && <div className="space-y-4"><div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Wellbeing Trend (12mo)</h4><ResponsiveContainer width="100%" height={200}><LineChart data={[{ m: 'Apr', s: 6.5 }, { m: 'May', s: 6.6 }, { m: 'Jun', s: 6.8 }, { m: 'Jul', s: 6.7 }, { m: 'Aug', s: 6.9 }, { m: 'Sep', s: 6.8 }, { m: 'Oct', s: 7.0 }, { m: 'Nov', s: 6.9 }, { m: 'Dec', s: 7.1 }, { m: 'Jan', s: 7.0 }, { m: 'Feb', s: 7.2 }, { m: 'Mar', s: 7.4 }]} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis domain={[5, 10]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><ReferenceLine y={7} stroke="#F59E0B80" strokeDasharray="5 5" /><Line type="monotone" dataKey="s" stroke={G} strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>Anonymous Feedback Themes</h4><div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] font-semibold mb-1" style={{ color: '#22C55E' }}>Positives</p>{['Autonomy & flexibility', 'Team culture', 'Product vision'].map((t, i) => <p key={i} className="text-xs py-0.5" style={{ color: '#9CA3AF' }}>+ {t}</p>)}</div><div><p className="text-[10px] font-semibold mb-1" style={{ color: '#F59E0B' }}>Concerns</p>{['Workload during peaks', 'Career progression clarity', 'Tooling improvements'].map((t, i) => <p key={i} className="text-xs py-0.5" style={{ color: '#9CA3AF' }}>- {t}</p>)}</div></div></div></div>}
    {sub === 'remuneration' && <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Remuneration Summary</h4>{[['Total comp bill', '£2.4M/year'], ['Gender pay gap', '3.2% (below national avg)'], ['Equity pool remaining', '12%'], ['Salary reviews due Q2', '8 staff'], ['Benefits cost', '£186k/year']].map(([l, v], i) => <div key={i} className="flex justify-between py-2" style={{ borderBottom: i < 4 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{v}</span></div>)}</div>}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function RiskTab() {
  const [sub, setSub] = useState('register')
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><S label="High Risks" value={1} color="#EF4444" /><S label="Medium Risks" value={3} color="#F59E0B" /><S label="Low Risks" value={4} color="#22C55E" /><S label="Compliance" value="85%" color="#F59E0B" /></div>
    <SubTabs tabs={[{ id: 'register', label: 'Risk Register' }, { id: 'compliance', label: 'Compliance' }, { id: 'legal', label: 'Legal' }, { id: 'insurance', label: 'Insurance' }]} active={sub} onChange={setSub} />
    {sub === 'register' && <div className="space-y-3">{[
      { title: 'Key person dependency — CEO/CTO overlap', impact: 'Critical', likelihood: 'Medium', mitigation: 'Succession planning in progress', owner: 'Board', color: '#EF4444' },
      { title: 'Data breach / GDPR incident', impact: 'High', likelihood: 'Low', mitigation: 'ISO27001 in progress', owner: 'IT', color: '#F59E0B' },
      { title: 'Customer concentration risk', impact: 'High', likelihood: 'Low', mitigation: 'No customer >8% ARR', owner: 'Sales', color: '#F59E0B' },
      { title: 'Series A not closing on timeline', impact: 'High', likelihood: 'Low', mitigation: '18mo runway buffer', owner: 'CEO', color: '#F59E0B' },
    ].map((r, i) => <div key={i} className="rounded-xl p-4" style={{ ...DS, borderLeft: `3px solid ${r.color}` }}><div className="flex items-center justify-between mb-1"><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.title}</p><R label={`${r.impact} / ${r.likelihood}`} color={r.color} /></div><p className="text-xs" style={{ color: '#9CA3AF' }}>Mitigation: {r.mitigation}</p><p className="text-[10px]" style={{ color: '#4B5563' }}>Owner: {r.owner}</p></div>)}</div>}
    {sub === 'compliance' && <div style={CS}>{[
      ['GDPR / Data Protection', true], ['Companies House filings', true], ['Corporation Tax', true], ['ISO27001', 'progress'], ['Cyber Essentials', true], ['DBS checks', 'warn'], ['Employment contracts', true], ['IP assignments', true], ['PAYE / NI', true], ['VAT registration', true], ['Board minutes — Q1', 'warn'],
    ].map(([item, ok], i) => <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg mb-1" style={{ backgroundColor: '#07080C' }}><span style={{ fontSize: 14 }}>{ok === true ? '✅' : ok === 'progress' ? '🔄' : '⚠️'}</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{item as string}{ok === 'progress' ? ' — in progress (60%)' : ok === 'warn' ? ' — action required' : ''}</span></div>)}</div>}
    {sub === 'legal' && <div style={CS}>{[['Active contracts', '12'], ['Expiring in 90 days', '3'], ['IP disputes', 'None'], ['Employment claims', 'None'], ['Supplier agreements', '8 active'], ['Customer T&Cs version', 'v2.4 (current)']].map(([l, v], i) => <div key={i} className="flex justify-between py-2" style={{ borderBottom: i < 5 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{v}</span></div>)}</div>}
    {sub === 'insurance' && <div style={CS}>{[['Professional Indemnity', '£2M', 'Sep 2026'], ['Public Liability', '£5M', 'Sep 2026'], ['Cyber Insurance', '£1M', 'Nov 2026'], ['Directors & Officers', '£1M', 'Sep 2026'], ['Employer Liability', '£10M', 'Sep 2026']].map(([type, cover, expiry], i) => <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#F9FAFB' }}>{type}</span><span className="text-xs" style={{ color: '#9CA3AF' }}>Cover: {cover} · Expires: {expiry}</span><R label="Current" color="#22C55E" /></div>)}</div>}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function MeetingsTab() {
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><S label="Next Meeting" value="15 May" color={G} sub="In 43 days" /><S label="Pack Due" value="8 May" color="#F59E0B" sub="In 36 days" /><S label="Outstanding Actions" value={3} color="#F59E0B" /><S label="Meetings This Year" value={2} color="#3B82F6" /></div>
    <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: G }}>Agenda — 15 May 2026</h4>{[['Chair\'s opening', 'Chair', '5 min'], ['Previous minutes', 'Secretary', '5 min'], ['CEO update', 'James Hartley', '15 min'], ['Financial performance', 'CFO', '20 min'], ['Commercial update', 'Sales Director', '15 min'], ['People update', 'HR Lead', '10 min'], ['Risk & compliance', 'IT Director', '10 min'], ['Strategy update', 'CEO', '15 min'], ['AOB', 'All', '5 min']].map(([item, owner, time], i) => <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 8 ? '1px solid #1F293740' : 'none' }}><div className="flex items-center gap-2"><span className="text-xs font-bold w-4" style={{ color: '#4B5563' }}>{i + 1}</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{item}</span></div><div className="flex items-center gap-3"><span className="text-[10px]" style={{ color: '#6B7280' }}>{owner}</span><span className="text-[10px]" style={{ color: '#4B5563' }}>{time}</span></div></div>)}</div>
    <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Board Pack Checklist</h4>{[['CEO report', 'due 8 May', false], ['Management accounts', 'due 5 May', false], ['KPI dashboard', 'due 8 May', false], ['Previous minutes', 'approved', true], ['Risk register update', 'due 8 May', false], ['People update', 'due 7 May', false]].map(([item, due, done], i) => <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 5 ? '1px solid #1F293740' : 'none' }}><span style={{ fontSize: 14 }}>{done ? '✅' : '⬜'}</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{item as string}</span><span className="text-[10px] ml-auto" style={{ color: '#6B7280' }}>{due as string}</span></div>)}</div>
    <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Previous Meetings</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#05060A' }}>{['Date', 'Type', 'Attendees', 'Minutes', 'Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{[['15 Feb 2026', 'Board', '6', '✅', '8 (6 complete)'], ['18 Nov 2025', 'Board', '6', '✅', '11 (11 complete)'], ['20 Aug 2025', 'Board', '5', '✅', '7 (7 complete)']].map(([d, t, a, m, ac], i) => <tr key={i}><td style={{ ...TD, color: '#D1D5DB' }}>{d}</td><td style={{ ...TD, color: '#9CA3AF' }}>{t}</td><td style={{ ...TD, color: '#9CA3AF' }}>{a}</td><td style={TD}>{m}</td><td style={{ ...TD, color: '#9CA3AF' }}>{ac}</td></tr>)}</tbody></table></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function StrategyTab() {
  const okrs = [{ obj: 'Grow ARR to £600k', kr: '£513k / £600k', pct: 86, r: 'green' }, { obj: 'NPS 60+', kr: '67 / 60 ✅', pct: 100, r: 'green' }, { obj: 'Churn <2%', kr: '2.1% / 2.0%', pct: 75, r: 'amber' }, { obj: 'US market launch', kr: 'Soft launch done', pct: 60, r: 'amber' }, { obj: 'Hire 20', kr: '15 / 20', pct: 75, r: 'amber' }]
  return (<div className="space-y-4">
    <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: G }}>3-Year Vision</h4><p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>&ldquo;The operating system for every UK school and SME&rdquo;</p>{[['Year 1 (2026)', 'Product-market fit, £50k MRR'], ['Year 2 (2027)', 'Series A, £200k MRR'], ['Year 3 (2028)', 'Series B, market leader']].map(([yr, goal], i) => <div key={i} className="flex items-center gap-3 py-1.5"><span className="text-xs font-bold" style={{ color: G }}>{yr}</span><span className="text-xs" style={{ color: '#D1D5DB' }}>{goal}</span></div>)}</div>
    <div style={CS}><h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>OKRs — Q1 2026</h4>{okrs.map((o, i) => <div key={i} className="mb-4"><div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{o.obj}</span><R label={o.r === 'green' ? 'On Track' : 'At Risk'} color={o.r === 'green' ? '#22C55E' : '#F59E0B'} /></div><p className="text-[10px] mb-1" style={{ color: '#6B7280' }}>{o.kr}</p><div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${o.pct}%`, backgroundColor: o.r === 'green' ? '#22C55E' : G }} /></div></div>)}</div>
    <div style={{ ...CS, borderColor: GBD }}><h4 className="text-sm font-bold mb-3" style={{ color: G }}><Lock size={12} className="inline mr-1" />Exit Strategy (Confidential)</h4><div className="space-y-1">{[['Preferred exit', 'Strategic acquisition'], ['Target acquirers', 'Microsoft, Salesforce, Pearson, News UK Education'], ['Target multiple', '8-12x ARR'], ['Timeline', '5-7 years'], ['Implied valuation', '£4.1-6.2M (at current ARR × 8-12x)']].map(([l, v], i) => <div key={i} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{v}</span></div>)}</div></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function EventsTab() {
  return (<div className="space-y-4">
    <div className="grid grid-cols-3 gap-3"><S label="Events This Year" value={3} color={G} /><S label="Budget" value="£18,700" color="#3B82F6" /><S label="Committed" value="£6,700" color="#F59E0B" /></div>
    {[
      { emoji: '🎉', title: 'Q2 Team Away Day', date: '14 June 2026 (73 days)', location: 'Wyboston Lakes Resort, Beds', attendees: '23/23', budget: '£4,200', spent: '£1,800', status: 'Confirmed', color: '#22C55E' },
      { emoji: '🎊', title: 'Summer Social', date: '25 July 2026', location: 'TBC', attendees: '25 est.', budget: '£2,500', spent: '£0', status: 'Planning', color: '#F59E0B' },
      { emoji: '🏆', title: 'Annual Conference', date: '15 November 2026', location: 'The Shard, London', attendees: '45 est.', budget: '£12,000', spent: '£0', status: 'Early planning', color: '#3B82F6' },
    ].map((e, i) => <div key={i} className="rounded-xl p-5" style={{ ...DS, borderLeft: `3px solid ${e.color}` }}><div className="flex items-start justify-between mb-2"><div><p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{e.emoji} {e.title}</p><p className="text-xs" style={{ color: '#9CA3AF' }}>{e.date} · {e.location}</p></div><R label={e.status} color={e.color} /></div><div className="grid grid-cols-4 gap-2 mt-3">{[['Attendees', e.attendees], ['Budget', e.budget], ['Spent', e.spent], ['Remaining', `£${(parseInt(e.budget.replace(/[£,]/g, '')) - parseInt(e.spent.replace(/[£,]/g, ''))).toLocaleString()}`]].map(([l, v], vi) => <div key={vi} className="text-center"><p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{v}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{l}</p></div>)}</div></div>)}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
function NotesTab() {
  const [notes, setNotes] = useState<{ id: string; title: string; content: string; date: string }[]>(() => { try { return JSON.parse(localStorage.getItem('lumio_director_notes') || '[]') } catch { return [] } })
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  function save() { if (!title.trim()) return; const n = { id: crypto.randomUUID(), title, content, date: new Date().toISOString() }; const updated = [n, ...notes]; setNotes(updated); localStorage.setItem('lumio_director_notes', JSON.stringify(updated)); setShowNew(false); setTitle(''); setContent('') }
  return (<div className="space-y-4">
    <div className="rounded-xl p-3" style={{ backgroundColor: GB, border: `1px solid ${GBD}` }}><p className="text-xs font-semibold" style={{ color: G }}><Lock size={10} className="inline mr-1" />Confidential — Directors Only. Notes stored locally on this device.</p></div>
    <div className="space-y-3">
      <div style={{ ...CS, borderColor: GBD }}><h4 className="text-sm font-bold mb-2" style={{ color: G }}>Series A Preparation</h4><p className="text-xs whitespace-pre-line" style={{ color: '#9CA3AF' }}>Key targets before raise:{'\n'}- ARR &gt;£600k ← current £513k (86%){'\n'}- NRR &gt;115% ← current 112%{'\n'}- 3 enterprise logos{'\n'}- 18mo runway at time of raise{'\n'}Target VCs: Notion Capital, Episode 1, Forward Partners, Balderton</p></div>
      <div style={{ ...CS, borderColor: GBD }}><h4 className="text-sm font-bold mb-2" style={{ color: G }}>Acquisition Interest Log</h4><div className="rounded-lg overflow-hidden" style={DS}><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#05060A' }}>{['Date', 'Company', 'Contact', 'Status'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody><tr><td style={{ ...TD, color: '#D1D5DB' }}>Mar 2026</td><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>Microsoft Education</td><td style={{ ...TD, color: '#9CA3AF' }}>Informal conversation</td><td style={TD}><R label="Early" color="#3B82F6" /></td></tr></tbody></table></div></div>
    </div>
    <div className="flex items-center justify-between"><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Director Notes</h4><button onClick={() => setShowNew(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: GB, color: G, border: `1px solid ${GBD}` }}><Plus size={12} /> New Note</button></div>
    {showNew && <div className="rounded-xl p-4 space-y-3" style={{ ...CS, borderColor: GBD }}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: '#07080C', border: '1px solid #1F2937', color: '#F9FAFB' }} /><textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write your confidential note..." className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ backgroundColor: '#07080C', border: '1px solid #1F2937', color: '#F9FAFB' }} /><div className="flex gap-2"><button onClick={save} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: G, color: '#fff' }}>Save</button><button onClick={() => setShowNew(false)} className="px-3 py-2 rounded-lg text-xs" style={{ color: '#6B7280' }}>Cancel</button></div></div>}
    {notes.map(n => <div key={n.id} className="rounded-xl p-4" style={{ ...CS, borderColor: GBD }}><div className="flex justify-between mb-1"><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{n.title}</p><span className="text-[10px]" style={{ color: '#4B5563' }}>{new Date(n.date).toLocaleDateString('en-GB')}</span></div><p className="text-xs whitespace-pre-wrap" style={{ color: '#9CA3AF' }}>{n.content}</p></div>)}
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function DirectorsSuite() {
  const [tab, setTab] = useState<Tab>('board')
  const hasData = useHasDashboardData('insights')

  if (hasData === null) return null
  if (!hasData) return (
    <PageShell title="Directors Suite" subtitle="Board-level intelligence and strategic oversight">
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
        <div className="rounded-2xl flex items-center justify-center mb-5" style={{ width: 72, height: 72, backgroundColor: 'rgba(200,150,12,0.15)' }}><Crown size={32} style={{ color: G }} /></div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Add data to unlock Directors Suite</h2>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Board-level intelligence, financial performance, risk register, and strategic planning — all in one place.</p>
        <button onClick={() => { ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','accounts','support','success','trials','operations','it'].forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true')); localStorage.setItem('lumio_demo_active', 'true'); window.location.reload() }} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#6D28D9', color: '#F9FAFB' }}>Explore with Demo Data</button>
      </div>
    </PageShell>
  )

  const now = new Date()
  return (
    <PageShell title="Directors Suite" subtitle="Board-level intelligence and strategic oversight">
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(200,150,12,0.06) 0%, #0D0E14 60%)', border: `1px solid ${GBD}` }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3"><Crown size={24} style={{ color: G }} /><div><h1 className="text-lg font-black" style={{ color: G }}>Directors Suite</h1><p className="text-xs" style={{ color: '#6B7280' }}>Confidential — board &amp; director access only</p></div></div>
          <div className="flex items-center gap-2 flex-wrap"><R label="Revenue On Track" color="#22C55E" /><R label="Pipeline At Risk" color="#F59E0B" /><R label="People Stable" color="#22C55E" /><R label="1 Compliance Alert" color="#EF4444" /><R label="Cash Healthy" color="#22C55E" /><span className="text-[10px]" style={{ color: '#4B5563' }}>{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Updated 2 min ago</span></div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: tab === t.id ? G : '#0D0E14', color: tab === t.id ? '#fff' : '#6B7280', border: tab === t.id ? `1px solid ${G}` : '1px solid #1F2937' }}><span>{t.icon}</span>{t.label}</button>)}
      </div>

      {tab === 'board' && <BoardOverview />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'commercial' && <CommercialTab />}
      {tab === 'people' && <PeopleTab />}
      {tab === 'risk' && <RiskTab />}
      {tab === 'meetings' && <MeetingsTab />}
      {tab === 'strategy' && <StrategyTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'notes' && <NotesTab />}
    </PageShell>
  )
}
