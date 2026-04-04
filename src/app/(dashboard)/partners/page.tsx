'use client'
import { useState } from 'react'
import {
  TrendingUp, Users, Building2, Calendar, User, Plus, Mail, Phone,
  Sparkles, ChevronDown, ChevronUp, Star, ExternalLink, Clock,
  Activity, Shield, Settings, FileText, MessageSquare, Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead } from '@/lib/staff/deptMatch'

// ─── Constants ───────────────────────────────────────────────────────────────

const TEAL = '#0D9488', GOLD = '#C8960C', NAVY = '#1B3060', PURPLE = '#6D28D9'
const CARD = '#111318', BORDER = '#1F2937', DARK = '#0A0B10'
const tipStyle = { backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }
const tickStyle = { fontSize: 10, fill: '#6B7280' }
const COLORS = ['#0D9488', '#C8960C', '#6D28D9', '#1D4ED8', '#B91C1C']

const TH: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${BORDER}` }
const TD: React.CSSProperties = { padding: '10px 14px', fontSize: 12, color: '#D1D5DB', borderBottom: `1px solid ${BORDER}` }

// ─── Partners Data ───────────────────────────────────────────────────────────

const PARTNERS = [
  { id: 'apex', initials: 'AL', name: 'Apex Learning Solutions', color: '#6D28D9', type: 'EdTech Platform Partner', desc: 'Digital learning platform integration and co-selling agreement', status: 'Active', contact: 'James Thornton', review: 'Aug 2026', score: 84, revenue: '£124,800', deals: 7, winRate: '68%', avgDeal: '£17,800', engagement: 'High', commission: 15 },
  { id: 'meridian', initials: 'ME', name: 'Meridian Education Group', color: '#0D9488', type: 'Reseller Partner', desc: 'UK-wide reseller covering independent and academy school sectors', status: 'Active', contact: 'Claire Hutchinson', review: 'Sep 2026', score: 76, revenue: '£89,200', deals: 5, winRate: '61%', avgDeal: '£12,400', engagement: 'Medium', commission: 12 },
  { id: 'vantage', initials: 'VA', name: 'Vantage Analytics', color: '#B45309', type: 'Data & Integration Partner', desc: 'Data warehousing and analytics integration for enterprise clients', status: 'Active', contact: 'Raj Patel', review: 'Nov 2026', score: 71, revenue: '£67,400', deals: 4, winRate: '58%', avgDeal: '£22,100', engagement: 'Medium', commission: 10 },
  { id: 'nexus', initials: 'NP', name: 'Nexus Professional Services', color: '#1D4ED8', type: 'Implementation Partner', desc: 'Professional services and onboarding delivery for enterprise deployments', status: 'Prospect', contact: 'Sarah Williams', review: 'Jul 2026', score: 0, revenue: '£0', deals: 2, winRate: '—', avgDeal: '£31,200', engagement: 'New', commission: 8 },
  { id: 'stratum', initials: 'SC', name: 'Stratum Capital Partners', color: '#B91C1C', type: 'Strategic Investor Partner', desc: 'Strategic investment and distribution partnership across portfolio companies', status: 'Active', contact: 'Marcus Reid', review: 'Dec 2026', score: 88, revenue: '£201,600', deals: 9, winRate: '72%', avgDeal: '£28,400', engagement: 'High', commission: 18 },
]

// ─── Helper Components ───────────────────────────────────────────────────────

function Stat({ label, value, color, trend, sub }: { label: string; value: string; color?: string; trend?: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px' }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: color || TEAL, margin: '0 0 2px', fontFamily: 'Georgia,serif' }}>{value}</p>
      {(trend || sub) && <p style={{ fontSize: 11, color: trend?.startsWith('+') ? '#22C55E' : trend?.startsWith('-') ? '#EF4444' : '#6B7280', margin: 0 }}>{trend}{sub ? ` ${sub}` : ''}</p>}
    </div>
  )
}

function AIPanel({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #C8960C40' }}>
      <button className="flex w-full items-center justify-between px-5 py-3" style={{ backgroundColor: 'rgba(200,150,12,0.06)', borderBottom: open ? '1px solid rgba(200,150,12,0.2)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2"><Sparkles size={14} style={{ color: GOLD }} /><span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{title}</span></div>
        {open ? <ChevronUp size={14} style={{ color: '#6B7280' }} /> : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
      </button>
      {open && <div className="p-4 text-xs leading-relaxed" style={{ color: '#D1D5DB', backgroundColor: '#0f0e17' }}>{items.map((it, i) => <p key={i} className="mb-1">{it}</p>)}</div>}
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewContent({ partner: p }: { partner: any }) {
  const revTrend = [
    { m: 'Apr', v: 8200 }, { m: 'May', v: 9100 }, { m: 'Jun', v: 10400 },
    { m: 'Jul', v: 11200 }, { m: 'Aug', v: 9800 }, { m: 'Sep', v: 12100 },
    { m: 'Oct', v: 11600 }, { m: 'Nov', v: 13400 }, { m: 'Dec', v: 12800 },
    { m: 'Jan', v: 14200 }, { m: 'Feb', v: 11900 }, { m: 'Mar', v: 15400 },
  ]

  const radarData = [
    { dim: 'Revenue', current: 82, target: 100 },
    { dim: 'Velocity', current: 74, target: 100 },
    { dim: 'Engagement', current: 88, target: 100 },
    { dim: 'Integration', current: 91, target: 100 },
    { dim: 'Marketing', current: 67, target: 100 },
    { dim: 'Executive', current: 85, target: 100 },
  ]

  const pipeline = [
    { stage: 'Prospect', count: 12, value: '£214k', pct: 37 },
    { stage: 'Qualified', count: 8, value: '£142k', pct: 25 },
    { stage: 'Demo', count: 5, value: '£89k', pct: 15 },
    { stage: 'Proposal', count: 4, value: '£71k', pct: 12 },
    { stage: 'Negotiation', count: 2, value: '£36k', pct: 6 },
    { stage: 'Won', count: 18, value: '£320k', pct: 55 },
  ]

  const stageColors: Record<string, string> = {
    Prospect: '#6B7280', Qualified: '#3B82F6', Demo: '#8B5CF6',
    Proposal: '#F59E0B', Negotiation: '#EF4444', Won: '#22C55E',
  }

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        <Stat label="Partner Score" value={`${p.score}/100`} color={p.score >= 80 ? '#22C55E' : p.score >= 60 ? '#F59E0B' : '#EF4444'} />
        <Stat label="Referred Revenue" value={p.revenue} color={TEAL} trend="+12%" sub="vs last Q" />
        <Stat label="Active Deals" value={String(p.deals)} color={PURPLE} />
        <Stat label="Win Rate" value={p.winRate} color={GOLD} />
        <Stat label="Avg Deal Size" value={p.avgDeal} color={NAVY} />
        <Stat label="Engagement" value={p.engagement} color={p.engagement === 'High' ? '#22C55E' : p.engagement === 'Medium' ? '#F59E0B' : '#6B7280'} />
      </div>

      {/* Two-col: Revenue Trend + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Revenue Trend (12 Months)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revTrend}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293780" />
              <XAxis dataKey="m" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`£${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="v" stroke={TEAL} strokeWidth={2} fill="url(#tealGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Deal Pipeline</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pipeline.map(s => (
              <div key={s.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#D1D5DB' }}>{s.stage}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{s.count} deals / {s.value}</span>
                </div>
                <div style={{ height: 8, backgroundColor: '#1F2937', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, backgroundColor: stageColors[s.stage], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Partner Performance Radar</h4>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#1F2937" />
            <PolarAngleAxis dataKey="dim" tick={tickStyle} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Current" dataKey="current" stroke={TEAL} fill={TEAL} fillOpacity={0.2} strokeWidth={2} />
            <Radar name="Target" dataKey="target" stroke={GOLD} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Revenue Tab ─────────────────────────────────────────────────────────────

function RevenueContent({ partner: p }: { partner: any }) {
  const monthlyRev = [
    { m: 'Apr', v: 8200 }, { m: 'May', v: 9400 }, { m: 'Jun', v: 10800 },
    { m: 'Jul', v: 11500 }, { m: 'Aug', v: 9900 }, { m: 'Sep', v: 12400 },
    { m: 'Oct', v: 11800 }, { m: 'Nov', v: 13600 }, { m: 'Dec', v: 12900 },
    { m: 'Jan', v: 14500 }, { m: 'Feb', v: 12100 }, { m: 'Mar', v: 15800 },
  ]

  const productRev = [
    { name: 'Portal', value: 55 },
    { name: 'Schools', value: 25 },
    { name: 'CRM', value: 15 },
    { name: 'Football', value: 5 },
  ]

  const revVsTarget = [
    { m: 'Apr', actual: 8200, target: 10000 }, { m: 'May', actual: 9400, target: 10000 },
    { m: 'Jun', actual: 10800, target: 10500 }, { m: 'Jul', actual: 11500, target: 11000 },
    { m: 'Aug', actual: 9900, target: 11500 }, { m: 'Sep', actual: 12400, target: 12000 },
    { m: 'Oct', actual: 11800, target: 12000 }, { m: 'Nov', actual: 13600, target: 12500 },
    { m: 'Dec', actual: 12900, target: 13000 }, { m: 'Jan', actual: 14500, target: 13000 },
    { m: 'Feb', actual: 12100, target: 13500 }, { m: 'Mar', actual: 15800, target: 14000 },
  ]

  const commRate = p.commission
  const commEarned = '£18,720'
  const commPaid = '£14,400'
  const commOutstanding = '£4,320'

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        <Stat label="Total Revenue" value="£482,400" color={TEAL} trend="+18%" sub="YoY" />
        <Stat label="This Quarter" value={p.revenue} color={GOLD} trend="+12%" sub="vs last Q" />
        <Stat label="Last Quarter" value="£98,600" color={NAVY} />
        <Stat label="YoY Growth" value="+24%" color="#22C55E" />
        <Stat label="Commission Due" value={commOutstanding} color="#F59E0B" />
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Monthly Referred Revenue</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyRev}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293780" />
            <XAxis dataKey="m" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`£${v.toLocaleString()}`, 'Revenue']} />
            <ReferenceLine y={12000} stroke={GOLD} strokeDasharray="4 4" label={{ value: '£12k target', position: 'right', fill: GOLD, fontSize: 10 }} />
            <Bar dataKey="v" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two-col: Pie + Line */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Revenue by Product</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={productRev} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={0} label={({ name, value }) => `${name} ${value}%`}>
                {productRev.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`${v}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Revenue vs Target</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revVsTarget}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293780" />
              <XAxis dataKey="m" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`£${v.toLocaleString()}`, '']} />
              <Line type="monotone" dataKey="actual" stroke={TEAL} strokeWidth={2} dot={false} name="Actual" />
              <Line type="monotone" dataKey="target" stroke={GOLD} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target" />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commission Tracker */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Commission Tracker</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Rate</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: TEAL, margin: '4px 0 0' }}>{commRate}%</p>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Earned</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: '4px 0 0' }}>{commEarned}</p>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Paid</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#22C55E', margin: '4px 0 0' }}>{commPaid}</p>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Outstanding</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B', margin: '4px 0 0' }}>{commOutstanding}</p>
          </div>
        </div>
        <button style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: GOLD, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Generate Invoice</button>
      </div>
    </div>
  )
}

// ─── Deals Tab ───────────────────────────────────────────────────────────────

function DealsContent({ partner: p }: { partner: any }) {
  const stageColors: Record<string, string> = {
    Prospect: '#6B7280', Qualified: '#3B82F6', Demo: '#8B5CF6',
    Proposal: '#F59E0B', Negotiation: '#EF4444', Won: '#22C55E',
  }

  const deals = [
    { name: 'Brightfield Academy', company: 'Brightfield Trust', value: '£42,000', stage: 'Proposal', owner: 'James T', close: '30 Apr', days: '12d' },
    { name: 'Redwood Learning', company: 'Redwood Group', value: '£28,500', stage: 'Demo', owner: 'Claire H', close: '15 May', days: '5d' },
    { name: 'Meadowbank School', company: 'Meadowbank Trust', value: '£16,200', stage: 'Negotiation', owner: 'Raj P', close: '22 Apr', days: '18d' },
    { name: 'Northgate Education', company: 'Northgate MAT', value: '£31,800', stage: 'Qualified', owner: 'James T', close: '10 Jun', days: '3d' },
    { name: 'Summit Academy', company: 'Summit Schools', value: '£19,400', stage: 'Demo', owner: 'Sarah W', close: '28 May', days: '7d' },
    { name: 'Lakeside MAT', company: 'Lakeside Trust', value: '£67,200', stage: 'Proposal', owner: 'Marcus R', close: '5 May', days: '21d' },
    { name: 'Hillcrest Primary', company: 'Hillcrest Education', value: '£8,900', stage: 'Prospect', owner: 'James T', close: '30 Jun', days: '1d' },
  ]

  const velocityData = [
    { stage: 'Prospect', days: 8 },
    { stage: 'Qualified', days: 12 },
    { stage: 'Demo', days: 6 },
    { stage: 'Proposal', days: 14 },
    { stage: 'Negotiation', days: 10 },
  ]

  return (
    <div>
      {/* Deals Table */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Active Deals</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Deal Name</th>
                <th style={TH}>Company</th>
                <th style={TH}>Value</th>
                <th style={TH}>Stage</th>
                <th style={TH}>Owner</th>
                <th style={TH}>Expected Close</th>
                <th style={TH}>Days</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#0D0E1280' }}>
                  <td style={{ ...TD, fontWeight: 600, color: '#F9FAFB' }}>{d.name}</td>
                  <td style={TD}>{d.company}</td>
                  <td style={{ ...TD, fontWeight: 600, color: TEAL }}>{d.value}</td>
                  <td style={TD}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: `${stageColors[d.stage]}20`, color: stageColors[d.stage] }}>
                      {d.stage}
                    </span>
                  </td>
                  <td style={TD}>{d.owner}</td>
                  <td style={TD}>{d.close}</td>
                  <td style={TD}>{d.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-col: Velocity + Won Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Deal Velocity (Avg Days per Stage)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={velocityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293780" />
              <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={tickStyle} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`${v} days`, 'Avg Duration']} />
              <Bar dataKey="days" fill={PURPLE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Won Deals Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 12 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={32} style={{ color: '#22C55E' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#22C55E', margin: '0 0 4px', fontFamily: 'Georgia,serif' }}>18</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px' }}>Deals won this year</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: TEAL, margin: 0 }}>£320,400</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Total won revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Comms Tab ───────────────────────────────────────────────────────────────

function CommsContent() {
  const typeColors: Record<string, string> = {
    Email: '#3B82F6', Call: '#22C55E', Meeting: '#8B5CF6',
  }

  const comms = [
    { date: '28 Mar 2026', type: 'Email', subject: 'Q2 Partnership Review Agenda', sentBy: 'James Thornton', outcome: 'Replied' },
    { date: '25 Mar 2026', type: 'Call', subject: 'Deal Pipeline Update Call', sentBy: 'Claire Hutchinson', outcome: 'Connected' },
    { date: '22 Mar 2026', type: 'Meeting', subject: 'Joint Product Demo — Brightfield', sentBy: 'Raj Patel', outcome: 'Completed' },
    { date: '18 Mar 2026', type: 'Email', subject: 'Commission Statement — March', sentBy: 'Finance Team', outcome: 'Opened' },
    { date: '15 Mar 2026', type: 'Call', subject: 'New Lead Introduction — Lakeside', sentBy: 'Marcus Reid', outcome: 'Voicemail' },
    { date: '12 Mar 2026', type: 'Email', subject: 'Co-Marketing Campaign Brief', sentBy: 'Sarah Williams', outcome: 'Replied' },
    { date: '10 Mar 2026', type: 'Meeting', subject: 'QBR Preparation — Q1 Results', sentBy: 'James Thornton', outcome: 'Completed' },
    { date: '7 Mar 2026', type: 'Email', subject: 'Updated Partner Agreement Draft', sentBy: 'Legal Team', outcome: 'Opened' },
    { date: '4 Mar 2026', type: 'Call', subject: 'Onboarding Status Check — Nexus', sentBy: 'Claire Hutchinson', outcome: 'Connected' },
    { date: '1 Mar 2026', type: 'Email', subject: 'Monthly Partner Newsletter', sentBy: 'Marketing Team', outcome: 'Clicked' },
  ]

  const engagementData = [
    { m: 'Apr', score: 62 }, { m: 'May', score: 68 }, { m: 'Jun', score: 71 },
    { m: 'Jul', score: 74 }, { m: 'Aug', score: 69 }, { m: 'Sep', score: 78 },
    { m: 'Oct', score: 76 }, { m: 'Nov', score: 82 }, { m: 'Dec', score: 80 },
    { m: 'Jan', score: 85 }, { m: 'Feb', score: 79 }, { m: 'Mar', score: 88 },
  ]

  return (
    <div>
      {/* Comms Table */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Recent Communications</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, backgroundColor: TEAL, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}><Mail size={12} /> Send Message</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, backgroundColor: '#1F2937', color: '#D1D5DB', border: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}><MessageSquare size={12} /> Log Communication</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Date</th>
                <th style={TH}>Type</th>
                <th style={TH}>Subject</th>
                <th style={TH}>Sent By</th>
                <th style={TH}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {comms.map((c, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#0D0E1280' }}>
                  <td style={TD}>{c.date}</td>
                  <td style={TD}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: `${typeColors[c.type]}20`, color: typeColors[c.type] }}>
                      {c.type}
                    </span>
                  </td>
                  <td style={{ ...TD, fontWeight: 500, color: '#F9FAFB' }}>{c.subject}</td>
                  <td style={TD}>{c.sentBy}</td>
                  <td style={TD}>{c.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engagement Score Chart */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 14px' }}>Engagement Score (12 Months)</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293780" />
            <XAxis dataKey="m" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`${v}/100`, 'Engagement']} />
            <Line type="monotone" dataKey="score" stroke={TEAL} strokeWidth={2} dot={{ fill: TEAL, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Activity Tab ────────────────────────────────────────────────────────────

function ActivityContent() {
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Deals', 'Comms', 'Payments', 'System']

  const typeColors: Record<string, string> = {
    Deals: '#8B5CF6', Comms: '#3B82F6', Payments: '#22C55E', System: '#6B7280',
  }

  const activities = [
    { date: '2 Apr 2026, 09:14', desc: 'New deal registered: Hillcrest Primary (£8,900)', user: 'James Thornton', type: 'Deals' },
    { date: '1 Apr 2026, 16:42', desc: 'Commission payment processed: £4,800', user: 'Finance System', type: 'Payments' },
    { date: '1 Apr 2026, 11:20', desc: 'Email sent: Q2 Partnership Review Agenda', user: 'James Thornton', type: 'Comms' },
    { date: '31 Mar 2026, 14:55', desc: 'Deal stage updated: Lakeside MAT moved to Proposal', user: 'Marcus Reid', type: 'Deals' },
    { date: '30 Mar 2026, 10:08', desc: 'Partner score recalculated: 84/100 (+2)', user: 'System', type: 'System' },
    { date: '28 Mar 2026, 15:30', desc: 'Call logged: Pipeline review with Claire Hutchinson', user: 'Claire Hutchinson', type: 'Comms' },
    { date: '27 Mar 2026, 09:45', desc: 'Deal won: Ferndale Academy (£24,600)', user: 'Raj Patel', type: 'Deals' },
    { date: '25 Mar 2026, 13:12', desc: 'Invoice generated: Commission Statement — March', user: 'Finance System', type: 'Payments' },
    { date: '24 Mar 2026, 08:30', desc: 'Integration sync completed: 142 records updated', user: 'System', type: 'System' },
    { date: '22 Mar 2026, 16:15', desc: 'Meeting completed: Joint Product Demo — Brightfield', user: 'Raj Patel', type: 'Comms' },
  ]

  const filtered = filter === 'All' ? activities : activities.filter(a => a.type === filter)

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: filter === f ? `1px solid ${TEAL}` : `1px solid ${BORDER}`, backgroundColor: filter === f ? `${TEAL}20` : CARD, color: filter === f ? TEAL : '#9CA3AF' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 16px' }}>Activity Timeline</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, marginBottom: i < filtered.length - 1 ? 0 : 0, position: 'relative' }}>
              {/* Dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: typeColors[a.type] || '#6B7280', flexShrink: 0, marginTop: 4 }} />
                {i < filtered.length - 1 && <div style={{ width: 1, flex: 1, backgroundColor: BORDER, marginTop: 4 }} />}
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: '#F9FAFB', margin: '0 0 4px', fontWeight: 500 }}>{a.desc}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#6B7280' }}>
                  <span>{a.date}</span>
                  <span>{a.user}</span>
                  <span style={{ padding: '1px 8px', borderRadius: 12, backgroundColor: `${typeColors[a.type]}15`, color: typeColors[a.type], fontWeight: 600 }}>{a.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsContent({ partner: p }: { partner: any }) {
  const [formData, setFormData] = useState({
    name: p.name,
    type: p.type,
    status: p.status,
    commission: p.commission,
    contractStart: '2025-09-01',
    contractEnd: '2026-08-31',
    autoRenew: true,
    contactName: p.contact,
    contactEmail: `${p.contact.split(' ')[0].toLowerCase()}@${p.id}.co.uk`,
    contactPhone: '+44 20 7946 0958',
  })

  const [integrations, setIntegrations] = useState({
    crmSync: true,
    dealNotifications: true,
    commissionAutoCalc: true,
    monthlyReport: true,
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: DARK, color: '#F9FAFB', fontSize: 12, outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: 6,
  }

  return (
    <div>
      {/* Partner Details Form */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 16px' }}>Partner Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Partner Name</label>
            <input style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Partner Type</label>
            <select style={inputStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="EdTech Platform Partner">EdTech Platform Partner</option>
              <option value="Reseller Partner">Reseller Partner</option>
              <option value="Data & Integration Partner">Data &amp; Integration Partner</option>
              <option value="Implementation Partner">Implementation Partner</option>
              <option value="Strategic Investor Partner">Strategic Investor Partner</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Paused">Paused</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Commission Rate (%)</label>
            <input type="number" style={inputStyle} value={formData.commission} onChange={e => setFormData({ ...formData, commission: Number(e.target.value) })} min={0} max={100} />
          </div>
          <div>
            <label style={labelStyle}>Contract Start</label>
            <input type="date" style={inputStyle} value={formData.contractStart} onChange={e => setFormData({ ...formData, contractStart: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Contract End</label>
            <input type="date" style={inputStyle} value={formData.contractEnd} onChange={e => setFormData({ ...formData, contractEnd: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>Auto-Renewal</label>
          <button
            onClick={() => setFormData({ ...formData, autoRenew: !formData.autoRenew })}
            style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: formData.autoRenew ? TEAL : '#374151', position: 'relative', transition: 'background-color 0.2s' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: formData.autoRenew ? 21 : 3, transition: 'left 0.2s' }} />
          </button>
          <span style={{ fontSize: 11, color: formData.autoRenew ? '#22C55E' : '#6B7280' }}>{formData.autoRenew ? 'On' : 'Off'}</span>
        </div>
      </div>

      {/* Primary Contact */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 16px' }}>Primary Contact</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" style={inputStyle} value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', margin: '0 0 16px' }}>Integrations</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            { key: 'crmSync' as const, label: 'CRM Sync' },
            { key: 'dealNotifications' as const, label: 'Deal Notifications' },
            { key: 'commissionAutoCalc' as const, label: 'Commission Auto-Calc' },
            { key: 'monthlyReport' as const, label: 'Monthly Report' },
          ]).map(toggle => (
            <div key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 500 }}>{toggle.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setIntegrations({ ...integrations, [toggle.key]: !integrations[toggle.key] })}
                  style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: integrations[toggle.key] ? TEAL : '#374151', position: 'relative', transition: 'background-color 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: integrations[toggle.key] ? 21 : 3, transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontSize: 10, color: integrations[toggle.key] ? '#22C55E' : '#6B7280', fontWeight: 600 }}>{integrations[toggle.key] ? 'On' : 'Off'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: GOLD, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
        <button style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Pause Partnership</button>
        <button style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Archive Partner</button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PartnersPage() {
  const [activePartner, setActivePartner] = useState('apex')
  const [innerTab, setInnerTab] = useState('overview')
  const hasData = useHasDashboardData('partners')
  const deptStaff = getDeptStaff('partners')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="partners" />}
      <DashboardEmptyState pageKey="partners"
        title="No partner data yet"
        description="Manage your partnerships, track referred revenue, and monitor deal pipelines across all your partner relationships."
        uploads={[
          { key: 'partners', label: 'Upload Partner Data (CSV)' },
          { key: 'deals', label: 'Upload Partner Deals (CSV)' },
        ]}
      />
    </>
  )

  const p = PARTNERS.find(x => x.id === activePartner) || PARTNERS[0]
  const INNER_TABS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'deals', label: 'Deals', icon: '🤝' },
    { id: 'comms', label: 'Comms', icon: '📧' },
    { id: 'activity', label: 'Activity', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div>
      {/* ROW 1: Title + partner tabs + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Partners</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {PARTNERS.map(pt => (
            <button key={pt.id} onClick={() => { setActivePartner(pt.id); setInnerTab('overview') }}
              style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: activePartner === pt.id ? pt.color : `${pt.color}40`, border: activePartner === pt.id ? `2px solid ${pt.color}` : '2px solid transparent', cursor: 'pointer' }}>
              {pt.initials}
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, backgroundColor: TEAL, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> Add Partner</button>
        </div>
      </div>

      {/* ROW 2: Partner header card */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{p.initials}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: '0 0 4px' }}>{p.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, backgroundColor: `${p.color}20`, color: p.color, fontWeight: 600 }}>{p.type}</span>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, backgroundColor: p.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: p.status === 'Active' ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>{p.status}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
            <span>Contact: {p.contact}</span>
            <span>Next review: {p.review}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 14px' }}>{p.desc}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { l: 'Revenue this Q', v: p.revenue },
            { l: 'Active Deals', v: String(p.deals) },
            { l: 'Win Rate', v: p.winRate },
            { l: 'Engagement', v: p.engagement },
          ].map(c => (
            <div key={c.l} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: DARK, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 10, color: '#6B7280' }}>{c.l}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', margin: '2px 0 0' }}>{c.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: AI Summary */}
      <div style={{ marginBottom: 12 }}>
        <AIPanel title={`AI Partner Summary — ${p.name}`} items={[
          `${p.name} is performing ${p.score > 80 ? 'above' : 'at'} target this quarter with ${p.revenue} in referred revenue.`,
          `Win rate of ${p.winRate} ${p.winRate !== '—' && parseInt(p.winRate) > 65 ? 'is the highest of any partner' : 'shows room for improvement'}.`,
          `${p.deals} active deals in pipeline with avg deal size of ${p.avgDeal}.`,
          `${p.contact} (primary contact) engagement level: ${p.engagement}.`,
          `Commission rate: ${p.commission}%. Next QBR: ${p.review}.`,
        ]} />
      </div>

      {/* ROW 4: Inner tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 16, overflowX: 'auto' }}>
        {INNER_TABS.map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 12, fontWeight: innerTab === t.id ? 700 : 500, color: innerTab === t.id ? TEAL : '#6B7280', borderBottom: innerTab === t.id ? `2px solid ${TEAL}` : '2px solid transparent', background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: innerTab === t.id ? TEAL : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ROW 5: Tab content */}
      {innerTab === 'overview' && <OverviewContent partner={p} />}
      {innerTab === 'revenue' && <RevenueContent partner={p} />}
      {innerTab === 'deals' && <DealsContent partner={p} />}
      {innerTab === 'comms' && <CommsContent />}
      {innerTab === 'activity' && <ActivityContent />}
      {innerTab === 'settings' && <SettingsContent partner={p} />}

      {/* AI Intelligence Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(108,63,197,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span>{'\u2728'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>AI Partner Summary</span>
            <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 'auto' }}>Generated now</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              `${p.name} is performing ${p.score > 80 ? 'above' : 'at'} target — ${p.winRate} win rate, ${p.revenue} revenue.`,
              `${p.deals} active deals in pipeline with avg deal size of ${p.avgDeal}.`,
              `Engagement level: ${p.engagement}. Primary contact: ${p.contact}.`,
              `Commission rate: ${p.commission}%. Next QBR: ${p.review}.`,
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, backgroundColor: '#7C3AED' }} />
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span>{'\u26A1'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>AI Key Highlights</span>
            <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 'auto' }}>Partners</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: 1, text: 'Apex Learning \u2014 68% win rate, highest of any partner this quarter', color: '#0D9488' },
              { n: 2, text: 'MedCore Solutions \u2014 engagement dropped, QBR overdue by 3 weeks', color: '#EF4444' },
              { n: 3, text: '2 partner renewals needed before end of month', color: '#F59E0B' },
              { n: 4, text: 'Combined pipeline \u00A3847k \u2014 up 18% vs last quarter', color: '#0D9488' },
              { n: 5, text: 'Vertex Analytics first deal expected Q3 \u2014 nurture now', color: '#0D9488' },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, width: 16, flexShrink: 0, marginTop: 2, color: h.color }}>{h.n}</span>
                <span style={{ fontSize: 12, color: '#D1D5DB' }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
