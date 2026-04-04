'use client'

import { DEMO_STATS } from '@/lib/demoStats'
import { useState } from 'react'
import {
  TrendingUp, Users, Activity, Zap, Star, Shield, Target,
  Headphones, GitBranch, DollarSign, AlertCircle, Clock, BarChart2,
  Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { PageShell } from '@/components/page-ui'
import ExportPdfButton from '@/components/ExportPdfButton'
import { useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════════
// THEME & SHARED
// ═══════════════════════════════════════════════════════════════════════════════

const TIP = { backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }
const CS: React.CSSProperties = { backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 20 }
const DS: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #1F2937', borderRadius: 12 }
const TH: React.CSSProperties = { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }
const TD: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #1F293740' }
const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#6366F1']

function Stat({ label, value, sub, color, trend }: { label: string; value: string | number; sub?: string; color: string; trend?: string }) {
  return (
    <div className="rounded-xl p-4" style={DS}>
      <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: '#6B7280' }}>{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        {trend && <span className="text-xs font-semibold mb-1" style={{ color: trend.startsWith('+') || trend.startsWith('↑') ? '#22C55E' : trend.startsWith('-') || trend.startsWith('↓') ? '#EF4444' : '#6B7280' }}>{trend}</span>}
      </div>
      {sub && <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{sub}</p>}
    </div>
  )
}

function Rag({ label, color }: { label: string; color: string }) {
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>{label}</span>
}

const REGIONS   = ['All Regions', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa', 'United Kingdom', 'United States', 'Canada', 'Australia']
const COUNTRIES = ['All Countries', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Singapore', 'UAE', 'South Africa', 'Brazil', 'India', 'Japan']
const SECTORS   = ['All Sectors', 'Education', 'Healthcare', 'Finance', 'Technology', 'Retail', 'Non-profit', 'Government', 'Sport & Leisure']
const ORG_TYPES = ['All Types', 'Enterprise (500+ staff)', 'Mid-Market (50-500 staff)', 'SME (10-50 staff)', 'Startup (<10 staff)', 'Public Sector', 'Non-profit']

function FilterSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #1F2937', background: '#111318', color: value === options[0] ? '#9CA3AF' : '#F9FAFB', cursor: 'pointer', height: 28 }}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
}

function AIPanel({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '2px solid rgba(200,150,12,0.3)' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(200,150,12,0.06)', borderBottom: open ? '1px solid rgba(200,150,12,0.2)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2"><span>🤖</span><span className="text-sm font-bold" style={{ color: '#C8960C' }}>{title}</span></div>
        {open ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && (<div className="flex flex-col gap-2.5 p-5" style={{ backgroundColor: '#0f0e17' }}>{items.map((item, i) => (<div key={i} className="flex gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>{i + 1}</span><p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p></div>))}</div>)}
    </div>
  )
}

type Tab = 'executive' | 'revenue' | 'people' | 'customers' | 'operations' | 'sales' | 'marketing' | 'workflows' | 'strategy'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'executive', label: 'Executive', icon: '📊' }, { id: 'revenue', label: 'Revenue & Growth', icon: '💰' },
  { id: 'people', label: 'People & Workforce', icon: '👥' }, { id: 'customers', label: 'Customers', icon: '🤝' },
  { id: 'operations', label: 'Operations', icon: '⚡' }, { id: 'sales', label: 'Sales Pipeline', icon: '📈' },
  { id: 'marketing', label: 'Marketing', icon: '🎯' }, { id: 'workflows', label: 'Workflows', icon: '🔄' },
  { id: 'strategy', label: 'Strategy', icon: '💡' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — EXECUTIVE
// ═══════════════════════════════════════════════════════════════════════════════

function ExecutiveTab() {
  const rev = [{ month: 'Oct', actual: 38200, target: 40000 }, { month: 'Nov', actual: 39800, target: 40000 }, { month: 'Dec', actual: 41200, target: 42000 }, { month: 'Jan', actual: 40500, target: 42000 }, { month: 'Feb', actual: 41900, target: 43000 }, { month: 'Mar', actual: 42800, target: 43000 }]
  const eff = [{ dept: 'Sales', score: 96 }, { dept: 'Support', score: 91 }, { dept: 'Success', score: 94 }, { dept: 'HR', score: 88 }, { dept: 'Accounts', score: 83 }, { dept: 'IT', score: 97 }]
  const health = [{ month: 'Oct', score: 82 }, { month: 'Nov', score: 84 }, { month: 'Dec', score: 83 }, { month: 'Jan', score: 85 }, { month: 'Feb', score: 86 }, { month: 'Mar', score: 87 }]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Company Health" value="87/100" color="#22C55E" trend="+3" sub="vs last quarter" />
        <Stat label="MRR" value="£42,800" color="#0D9488" trend="+18%" sub="vs last month" />
        <Stat label="ARR" value="£513.6k" color="#3B82F6" trend="+18% YoY" />
        <Stat label="Headcount" value={String(DEMO_STATS.totalEmployees)} color="#8B5CF6" trend="+3" sub="this month" />
        <Stat label="NPS Score" value="54" color="#22C55E" trend="+6" sub="vs last quarter" />
        <Stat label="Churn Rate" value="2.1%" color="#22C55E" trend="-0.4%" sub="vs last Q" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue vs Target</h4><ResponsiveContainer width="100%" height={200}><BarChart data={rev} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Number(v).toLocaleString()}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="actual" name="Actual" fill="#0D9488" radius={[4, 4, 0, 0]} /><Bar dataKey="target" name="Target" fill="#1F2937" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Health Score Trend</h4><ResponsiveContainer width="100%" height={200}><LineChart data={health} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis domain={[75, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><ReferenceLine y={85} stroke="#22C55E80" strokeDasharray="5 5" /><Line type="monotone" dataKey="score" stroke="#0D9488" strokeWidth={2} dot={{ r: 3, fill: '#0D9488' }} /></LineChart></ResponsiveContainer></div>
        <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Dept Efficiency</h4><ResponsiveContainer width="100%" height={200}><BarChart data={eff} layout="vertical" margin={{ left: 50, right: 10 }}><XAxis type="number" domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis type="category" dataKey="dept" tick={{ fill: '#F9FAFB', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{eff.map((d, i) => <Cell key={i} fill={d.score >= 90 ? '#22C55E' : d.score >= 80 ? '#F59E0B' : '#EF4444'} />)}</Bar></BarChart></ResponsiveContainer></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#EF4444' }}>Risks & Concerns</h4>{['3 workflows flagged — support SLA at risk', 'Year-end filing deadline in 6 weeks — prep at 40%', 'DBS renewal 23 days overdue — M. Taylor', '7 overdue invoices totalling £12,400'].map((t, i) => <div key={i} className="flex items-start gap-2 py-2" style={{ borderBottom: i < 3 ? '1px solid #1F293740' : 'none' }}><div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: i < 2 ? '#EF4444' : '#F59E0B' }} /><p className="text-xs" style={{ color: '#D1D5DB' }}>{t}</p></div>)}</div>
        <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#22C55E' }}>Wins & Highlights</h4>{['MRR up 12% m-o-m — strongest since Q3 last year', '23 new customers in 30 days — pipeline converting well', 'Automation saved estimated 47 hours this month', 'Health stable — 132 healthy, 29 at risk, 10 critical'].map((t, i) => <div key={i} className="flex items-start gap-2 py-2" style={{ borderBottom: i < 3 ? '1px solid #1F293740' : 'none' }}><div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#22C55E' }} /><p className="text-xs" style={{ color: '#D1D5DB' }}>{t}</p></div>)}</div>
      </div>
      <AIPanel title="AI Executive Briefing — March 2026" items={['MRR up 12% month-on-month — strongest growth since Q3 last year', '23 new customers in last 30 days — pipeline converting well', '3 workflows flagged as needing attention — support SLA at risk', 'Customer health stable — 132 healthy, 29 at risk, 10 critical', 'Automation saved an estimated 47 hours this month', 'Expansion revenue up 18% — existing customers adding seats', 'Staff wellbeing: 7.4/10 — highest recorded this academic year']} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — REVENUE
// ═══════════════════════════════════════════════════════════════════════════════
function RevenueTab() {
  const mrr = [{ month: 'Oct', mrr: 38200 }, { month: 'Nov', mrr: 39800 }, { month: 'Dec', mrr: 41200 }, { month: 'Jan', mrr: 40500 }, { month: 'Feb', mrr: 41900 }, { month: 'Mar', mrr: 42800 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="MRR" value="£42,800" color="#0D9488" trend="+18%" /><Stat label="ARR" value="£513.6k" color="#3B82F6" trend="+18% YoY" /><Stat label="Net Revenue Retention" value="112%" color="#22C55E" /><Stat label="Gross Churn" value="2.1%" color="#22C55E" trend="-0.4%" /><Stat label="Avg Contract" value="£4,200" color="#8B5CF6" trend="+£400" /><Stat label="LTV" value="£48,600" color="#F59E0B" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>MRR Trend</h4><ResponsiveContainer width="100%" height={220}><AreaChart data={mrr} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Number(v).toLocaleString()}`} /><Area type="monotone" dataKey="mrr" stroke="#0D9488" fill="#0D9488" fillOpacity={0.15} /></AreaChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Revenue Breakdown</h4><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={[{ name: 'New Business', value: 18200 }, { name: 'Expansion', value: 12400 }, { name: 'Renewal', value: 12200 }]} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }: any) => `${name}: £${(value / 1000).toFixed(1)}k`}>{[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Number(v).toLocaleString()}`} /></PieChart></ResponsiveContainer></div>
    </div>
    <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Cohort Retention (%)</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Cohort', 'M1', 'M3', 'M6', 'M12'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{[{ c: 'Q1 25', m1: 100, m3: 94, m6: 88, m12: 82 }, { c: 'Q2 25', m1: 100, m3: 95, m6: 90, m12: null }, { c: 'Q3 25', m1: 100, m3: 96, m6: null, m12: null }, { c: 'Q4 25', m1: 100, m3: null, m6: null, m12: null }].map((r, i) => <tr key={i}><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>{r.c}</td>{[r.m1, r.m3, r.m6, r.m12].map((v, vi) => <td key={vi} style={{ ...TD, color: v == null ? '#374151' : v >= 90 ? '#22C55E' : v >= 80 ? '#F59E0B' : '#EF4444', fontWeight: 600 }}>{v != null ? `${v}%` : '—'}</td>)}</tr>)}</tbody></table></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PEOPLE
// ═══════════════════════════════════════════════════════════════════════════════
function PeopleTab() {
  const wb = [{ m: 'Oct', s: 6.8 }, { m: 'Nov', s: 7.0 }, { m: 'Dec', s: 6.9 }, { m: 'Jan', s: 7.1 }, { m: 'Feb', s: 7.2 }, { m: 'Mar', s: 7.4 }]
  const hc = [{ dept: 'Engineering', count: 42 }, { dept: 'Sales', count: 28 }, { dept: 'Support', count: 24 }, { dept: 'Marketing', count: 18 }, { dept: 'HR', count: 12 }, { dept: 'Finance', count: 8 }, { dept: 'Other', count: 55 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Headcount" value={DEMO_STATS.totalEmployees} color="#0D9488" trend="+3" /><Stat label="Open Roles" value={2} color="#F59E0B" /><Stat label="Wellbeing" value="7.4/10" color="#22C55E" trend="↑" /><Stat label="Absence Rate" value="3.2%" color="#22C55E" /><Stat label="Retention (12mo)" value="87%" color="#3B82F6" /><Stat label="Avg Tenure" value="2.4 yrs" color="#8B5CF6" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Staff Wellbeing Trend</h4><ResponsiveContainer width="100%" height={200}><LineChart data={wb} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis domain={[5, 10]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><ReferenceLine y={7} stroke="#F59E0B80" strokeDasharray="5 5" /><Line type="monotone" dataKey="s" stroke="#0D9488" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Headcount by Dept</h4><ResponsiveContainer width="100%" height={200}><BarChart data={hc} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="dept" tick={{ fill: '#9CA3AF', fontSize: 9 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
    <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Wellbeing Profile</h4><ResponsiveContainer width="100%" height={220}><RadarChart data={[{ area: 'Workload', score: 6.2 }, { area: 'Relationships', score: 8.1 }, { area: 'Recognition', score: 7.0 }, { area: 'Autonomy', score: 7.8 }, { area: 'Support', score: 7.5 }]}><PolarGrid stroke="#1F2937" /><PolarAngleAxis dataKey="area" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 9 }} /><Radar dataKey="score" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════
function CustomersTab() {
  const hd = [{ band: 'Healthy', count: 132, color: '#22C55E' }, { band: 'At Risk', count: 29, color: '#F59E0B' }, { band: 'Critical', count: 10, color: '#EF4444' }]
  const nps = [{ q: 'Q1 25', score: 42 }, { q: 'Q2 25', score: 46 }, { q: 'Q3 25', score: 48 }, { q: 'Q4 25', score: 52 }, { q: 'Q1 26', score: 54 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Total Customers" value={171} color="#0D9488" trend="+23" /><Stat label="NPS" value={54} color="#22C55E" trend="+6" /><Stat label="Healthy" value={132} color="#22C55E" /><Stat label="At Risk" value={29} color="#F59E0B" /><Stat label="Critical" value={10} color="#EF4444" /><Stat label="CSAT" value="4.3/5" color="#3B82F6" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Health Distribution</h4><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={hd} cx="50%" cy="50%" outerRadius={70} dataKey="count" label={({ band, count }: any) => `${band}: ${count}`}>{hd.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie><Tooltip contentStyle={TIP} /></PieChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>NPS Trend</h4><ResponsiveContainer width="100%" height={200}><LineChart data={nps} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="q" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis domain={[30, 70]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><ReferenceLine y={50} stroke="#22C55E80" strokeDasharray="5 5" /><Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
    </div>
    <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Top 5 by ARR</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#0D0E14' }}>{['#', 'Company', 'ARR', 'Health', 'CSM'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{[{ co: 'Greenfield Academy', arr: '£91,000', h: 'green', csm: 'Dan Marsh' }, { co: 'Oakridge Schools', arr: '£76,000', h: 'green', csm: 'Sophie Bell' }, { co: 'Bramble Hill Trust', arr: '£55,000', h: 'amber', csm: 'Dan Marsh' }, { co: 'Hopscotch Learning', arr: '£42,000', h: 'green', csm: 'Raj Patel' }, { co: 'Crestview Academy', arr: '£33,400', h: 'green', csm: 'Sophie Bell' }].map((c, i) => <tr key={i}><td style={{ ...TD, color: '#6B7280' }}>#{i + 1}</td><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>{c.co}</td><td style={{ ...TD, color: '#F9FAFB' }}>{c.arr}</td><td style={TD}><Rag label={c.h === 'green' ? 'Healthy' : 'At Risk'} color={c.h === 'green' ? '#22C55E' : '#F59E0B'} /></td><td style={{ ...TD, color: '#9CA3AF' }}>{c.csm}</td></tr>)}</tbody></table></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function OperationsTab() {
  const eff = [{ m: 'Oct', pct: 91 }, { m: 'Nov', pct: 92 }, { m: 'Dec', pct: 90 }, { m: 'Jan', pct: 93 }, { m: 'Feb', pct: 92 }, { m: 'Mar', pct: 94 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Efficiency" value="94%" color="#22C55E" trend="+2%" /><Stat label="Runs (30d)" value="1,834" color="#0D9488" /><Stat label="Failed (7d)" value={3} color="#F59E0B" /><Stat label="Uptime" value="99.8%" color="#22C55E" /><Stat label="Avg Run" value="1m 24s" color="#3B82F6" /><Stat label="Hours Saved" value="47/mo" color="#8B5CF6" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Efficiency Trend</h4><ResponsiveContainer width="100%" height={200}><LineChart data={eff} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis domain={[85, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Line type="monotone" dataKey="pct" stroke="#0D9488" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Top Workflows</h4><ResponsiveContainer width="100%" height={200}><BarChart data={[{ name: 'Onboarding', runs: 248 }, { name: 'Invoice Chase', runs: 186 }, { name: 'Lead Nurture', runs: 142 }, { name: 'Support Ticket', runs: 98 }, { name: 'Weekly Report', runs: 64 }]} layout="vertical" margin={{ left: 80, right: 10 }}><XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fill: '#F9FAFB', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="runs" fill="#8B5CF6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
    <AIPanel title="AI Operations Briefing" items={['1,834 workflow runs — 0 critical failures', 'Most triggered: Onboarding (248 runs)', 'Invoice Chase saving £2,400/mo in recovered debt', '3 workflows running slower than baseline', 'Automation at 67% coverage across departments']} />
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — SALES
// ═══════════════════════════════════════════════════════════════════════════════
function SalesTab() {
  const funnel = [{ stage: 'Leads', value: 342 }, { stage: 'Qualified', value: 186 }, { stage: 'Proposal', value: 74 }, { stage: 'Negotiation', value: 38 }, { stage: 'Closed Won', value: 23 }]
  const fc = [{ m: 'Apr', pipeline: 48000, forecast: 32000 }, { m: 'May', pipeline: 52000, forecast: 36000 }, { m: 'Jun', pipeline: 61000, forecast: 42000 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Pipeline" value="£487k" color="#0D9488" /><Stat label="Deals" value={74} color="#3B82F6" /><Stat label="Win Rate" value="31%" color="#22C55E" trend="+4%" /><Stat label="Avg Deal" value="£4,200" color="#8B5CF6" /><Stat label="Cycle" value="38 days" color="#F59E0B" trend="-4d" /><Stat label="Closed" value="£42.8k" color="#22C55E" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Sales Funnel</h4><ResponsiveContainer width="100%" height={220}><BarChart data={funnel} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="stage" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{funnel.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>3-Month Forecast</h4><ResponsiveContainer width="100%" height={220}><BarChart data={fc} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Number(v).toLocaleString()}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="pipeline" name="Pipeline" fill="#1F2937" radius={[4, 4, 0, 0]} /><Bar dataKey="forecast" name="Forecast" fill="#0D9488" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
    <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Rep Performance</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Rep', 'Deals', 'Pipeline', 'Closed', 'Win Rate', 'Attainment'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{[{ r: 'Sophie Bell', d: 18, p: '£124k', c: '£48k', w: '34%', a: '112%' }, { r: 'Dan Marsh', d: 22, p: '£156k', c: '£52k', w: '28%', a: '104%' }, { r: 'Raj Patel', d: 14, p: '£98k', c: '£36k', w: '31%', a: '88%' }, { r: 'Mia Chen', d: 20, p: '£109k', c: '£44k', w: '33%', a: '96%' }].map((r, i) => <tr key={i}><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>{r.r}</td><td style={{ ...TD, color: '#D1D5DB' }}>{r.d}</td><td style={{ ...TD, color: '#D1D5DB' }}>{r.p}</td><td style={{ ...TD, color: '#22C55E', fontWeight: 600 }}>{r.c}</td><td style={{ ...TD, color: '#D1D5DB' }}>{r.w}</td><td style={TD}><Rag label={r.a} color={parseInt(r.a) >= 100 ? '#22C55E' : parseInt(r.a) >= 85 ? '#F59E0B' : '#EF4444'} /></td></tr>)}</tbody></table></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7 — MARKETING
// ═══════════════════════════════════════════════════════════════════════════════
function MarketingTab() {
  const ch = [{ channel: 'Organic', leads: 142, cost: 0 }, { channel: 'Paid Search', leads: 86, cost: 12400 }, { channel: 'Social', leads: 58, cost: 4200 }, { channel: 'Email', leads: 34, cost: 800 }, { channel: 'Referral', leads: 22, cost: 0 }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Leads (30d)" value={342} color="#0D9488" trend="+18%" /><Stat label="MQLs" value={186} color="#3B82F6" /><Stat label="SQLs" value={74} color="#8B5CF6" /><Stat label="CAC" value="£1,240" color="#22C55E" trend="-£80" /><Stat label="Spend" value="£17.4k" color="#F59E0B" /><Stat label="Pipeline" value="£487k" color="#22C55E" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Leads by Channel</h4><ResponsiveContainer width="100%" height={200}><BarChart data={ch} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="channel" tick={{ fill: '#9CA3AF', fontSize: 9 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="leads" fill="#0D9488" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Spend Breakdown</h4><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={ch.filter(c => c.cost > 0)} cx="50%" cy="50%" outerRadius={70} dataKey="cost" label={({ channel, cost }: any) => `${channel}: £${(cost / 1000).toFixed(1)}k`}>{ch.filter(c => c.cost > 0).map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}</Pie><Tooltip contentStyle={TIP} formatter={(v: any) => `£${Number(v).toLocaleString()}`} /></PieChart></ResponsiveContainer></div>
    </div>
    <div className="rounded-xl overflow-hidden" style={DS}><div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Channel Performance</h4></div><table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Channel', 'Leads', 'Cost', 'CAC', 'Conv %'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{ch.map((c, i) => <tr key={i}><td style={{ ...TD, color: '#F9FAFB', fontWeight: 600 }}>{c.channel}</td><td style={{ ...TD, color: '#D1D5DB' }}>{c.leads}</td><td style={{ ...TD, color: '#D1D5DB' }}>{c.cost ? `£${c.cost.toLocaleString()}` : 'Organic'}</td><td style={{ ...TD, color: c.cost === 0 ? '#22C55E' : '#D1D5DB' }}>{c.cost ? `£${Math.round(c.cost / c.leads)}` : '£0'}</td><td style={{ ...TD, color: '#D1D5DB' }}>{Math.round((c.leads / 342) * 100)}%</td></tr>)}</tbody></table></div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8 — WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════════
function WorkflowsTab() {
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Active" value={47} color="#0D9488" /><Stat label="Runs (30d)" value="1,834" color="#3B82F6" /><Stat label="Success" value="99.8%" color="#22C55E" /><Stat label="Failed (7d)" value={3} color="#F59E0B" /><Stat label="Saved" value="47 hrs/mo" color="#8B5CF6" /><Stat label="ROI" value="£28.4k" color="#22C55E" sub="saved/mo" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Runs Over Time</h4><ResponsiveContainer width="100%" height={200}><AreaChart data={[{ w: 'W1', runs: 412 }, { w: 'W2', runs: 445 }, { w: 'W3', runs: 468 }, { w: 'W4', runs: 509 }]} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1F2937" /><XAxis dataKey="w" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} /><Tooltip contentStyle={TIP} /><Area type="monotone" dataKey="runs" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} /></AreaChart></ResponsiveContainer></div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Automation ROI</h4>{[{ l: 'Tasks automated', v: '67%', c: '#22C55E' }, { l: 'Time saved/mo', v: '47 hours', c: '#0D9488' }, { l: 'Cost saving', v: '£28,400', c: '#22C55E' }, { l: 'Error reduction', v: '-84%', c: '#22C55E' }, { l: 'Avg response', v: '< 30s', c: '#3B82F6' }].map((r, i) => <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < 4 ? '1px solid #1F293740' : 'none' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{r.l}</span><span className="text-sm font-semibold" style={{ color: r.c }}>{r.v}</span></div>)}</div>
    </div>
    <AIPanel title="AI Workflows Briefing" items={['1,834 runs — 0 critical failures', 'Invoice Chase saving £2,400/mo', '3 workflows below baseline performance', 'Onboarding most triggered (248 runs)', '67% automation coverage']} />
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 9 — STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════
function StrategyTab() {
  const okrs = [{ obj: 'Grow ARR to £600k', kr: '£513k / £600k', pct: 86, rag: 'green' as const }, { obj: 'Achieve NPS 60+', kr: '54 / 60', pct: 90, rag: 'green' as const }, { obj: 'Reduce churn <2%', kr: '2.1% / 2.0%', pct: 75, rag: 'amber' as const }, { obj: 'Launch US market', kr: 'Soft launch done', pct: 60, rag: 'amber' as const }, { obj: 'Hire 20 new', kr: '15 / 20', pct: 75, rag: 'amber' as const }]
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat label="OKRs On Track" value="2/5" color="#22C55E" /><Stat label="Initiatives" value={8} color="#0D9488" /><Stat label="Strategic Score" value="72%" color="#F59E0B" /><Stat label="Board Meeting" value="15 Apr" color="#3B82F6" /></div>
    <div style={CS}><h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Company OKRs — Q1 2026</h4>{okrs.map((o, i) => <div key={i} className="mb-4"><div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{o.obj}</span><Rag label={o.rag === 'green' ? 'On Track' : 'At Risk'} color={o.rag === 'green' ? '#22C55E' : '#F59E0B'} /></div><p className="text-xs mb-1.5" style={{ color: '#6B7280' }}>{o.kr}</p><div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${o.pct}%`, backgroundColor: o.rag === 'green' ? '#22C55E' : '#F59E0B' }} /></div><p className="text-[10px] text-right mt-0.5" style={{ color: '#4B5563' }}>{o.pct}%</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Strategic Initiatives</h4>{[{ name: 'US Market Entry', status: 'In Progress', pct: 60 }, { name: 'Enterprise Tier', status: 'Planning', pct: 25 }, { name: 'AI Roadmap', status: 'In Progress', pct: 45 }, { name: 'Partner Channel', status: 'In Progress', pct: 70 }].map((init, i) => <div key={i} className="py-2.5" style={{ borderBottom: i < 3 ? '1px solid #1F293740' : 'none' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{init.name}</span><Rag label={init.status} color={init.status === 'In Progress' ? '#3B82F6' : '#6B7280'} /></div><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${init.pct}%`, backgroundColor: '#0D9488' }} /></div><span className="text-[10px]" style={{ color: '#6B7280' }}>{init.pct}%</span></div></div>)}</div>
      <div style={CS}><h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Competitive Position</h4><ResponsiveContainer width="100%" height={220}><RadarChart data={[{ dim: 'Product', us: 82, comp: 75 }, { dim: 'Price', us: 70, comp: 65 }, { dim: 'Support', us: 88, comp: 72 }, { dim: 'Brand', us: 60, comp: 80 }, { dim: 'Features', us: 78, comp: 82 }]}><PolarGrid stroke="#1F2937" /><PolarAngleAxis dataKey="dim" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} /><Radar name="Lumio" dataKey="us" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} strokeWidth={2} /><Radar name="Competitors" dataKey="comp" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1.5} /><Tooltip contentStyle={TIP} /></RadarChart></ResponsiveContainer></div>
    </div>
  </div>)
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('executive')
  const [region, setRegion] = useState('All Regions')
  const [country, setCountry] = useState('All Countries')
  const [sector, setSector] = useState('All Sectors')
  const [orgType, setOrgType] = useState('All Types')

  const hasData = useHasDashboardData('insights')
  const deptStaff = getDeptStaff('strategy')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <PageShell title="Insights" subtitle="Analytics, reporting and performance data">
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="strategy" />}
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
        <div className="rounded-2xl flex items-center justify-center mb-5" style={{ width: 72, height: 72, backgroundColor: '#2D1B69' }}><BarChart2 size={32} style={{ color: '#A78BFA' }} /></div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your insights data` : 'Add data to unlock Insights'}</h2>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>Insights gives every role a tailored live view of your business. Add data across your modules to unlock the full Insights dashboard.</p>
        <div className="w-full space-y-3 mb-6">
          {[{ icon: '⬆', label: 'Upload Business Data (CSV)', template: true }, { icon: '⬆', label: 'Upload Key Metrics (CSV/XLSX)', template: true }, { icon: '⇔', label: 'Connect an Integration (HubSpot, Xero, Slack + more)', template: false }].map((opt, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3"><span className="text-base">{opt.icon}</span><span className="text-sm" style={{ color: '#F9FAFB' }}>{opt.label}</span></div>
              {opt.template && <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>↓ Template</button>}
            </div>
          ))}
        </div>
        <div className="w-full flex items-center gap-3 mb-6"><div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} /><span className="text-xs" style={{ color: '#6B7280' }}>or</span><div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} /></div>
        <button onClick={() => { ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','accounts','support','success','trials','operations','it'].forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true')); localStorage.setItem('lumio_demo_active', 'true'); window.location.reload() }} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#6D28D9', color: '#F9FAFB' }}><Sparkles size={16} /> Explore with Demo Data</button>
        <p className="text-xs mt-3" style={{ color: '#6B7280' }}>Pre-filled sample data so you can explore every feature before adding your own</p>
      </div>
    </PageShell>
  )

  const isFiltered = region !== 'All Regions' || country !== 'All Countries' || sector !== 'All Sectors' || orgType !== 'All Types'
  const activeFilters = [region, country, sector, orgType].filter(v => !v.startsWith('All'))

  return (
    <PageShell title="Insights" subtitle="Analytics, reporting and performance data">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>FILTER BY</span>
        <FilterSelect options={REGIONS} value={region} onChange={setRegion} />
        <FilterSelect options={COUNTRIES} value={country} onChange={setCountry} />
        <FilterSelect options={SECTORS} value={sector} onChange={setSector} />
        <FilterSelect options={ORG_TYPES} value={orgType} onChange={setOrgType} />
        {isFiltered && (<><span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#6C3FC5' }}>Filtered</span><button onClick={() => { setRegion('All Regions'); setCountry('All Countries'); setSector('All Sectors'); setOrgType('All Types') }} className="text-xs" style={{ color: '#9CA3AF' }}>Clear</button></>)}
        <div style={{ marginLeft: 'auto' }}><ExportPdfButton /></div>
      </div>
      {isFiltered && <p className="text-xs px-1" style={{ color: '#9CA3AF' }}>Filtered by: {activeFilters.join(' · ')}</p>}

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: tab === t.id ? '#6C3FC5' : '#111318', color: tab === t.id ? '#fff' : '#6B7280', border: tab === t.id ? '1px solid #6C3FC5' : '1px solid #1F2937' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'executive' && <ExecutiveTab />}
      {tab === 'revenue' && <RevenueTab />}
      {tab === 'people' && <PeopleTab />}
      {tab === 'customers' && <CustomersTab />}
      {tab === 'operations' && <OperationsTab />}
      {tab === 'sales' && <SalesTab />}
      {tab === 'marketing' && <MarketingTab />}
      {tab === 'workflows' && <WorkflowsTab />}
      {tab === 'strategy' && <StrategyTab />}
    </PageShell>
  )
}
