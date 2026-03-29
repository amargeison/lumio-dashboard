'use client'
// Admin Insights Dashboard — 10 sections with recharts
import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, Users, Activity, Target, Shield, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

// ─── Data ────────────────────────────────────────────────────────────────────

const MRR_DATA = [
  { month: 'Apr', mrr: 8200 }, { month: 'May', mrr: 9800 }, { month: 'Jun', mrr: 11400 },
  { month: 'Jul', mrr: 13100 }, { month: 'Aug', mrr: 14800 }, { month: 'Sep', mrr: 16900 },
  { month: 'Oct', mrr: 18400 }, { month: 'Nov', mrr: 20200 }, { month: 'Dec', mrr: 22100 },
  { month: 'Jan', mrr: 24300 }, { month: 'Feb', mrr: 26100 }, { month: 'Mar', mrr: 28450 },
]

const REVENUE_BY_PLAN = [
  { month: 'Oct', starter: 4200, growth: 9800, enterprise: 4400 },
  { month: 'Nov', starter: 4800, growth: 10600, enterprise: 4800 },
  { month: 'Dec', starter: 5400, growth: 11200, enterprise: 5500 },
  { month: 'Jan', starter: 6000, growth: 12000, enterprise: 6300 },
  { month: 'Feb', starter: 7200, growth: 12400, enterprise: 6500 },
  { month: 'Mar', starter: 8400, growth: 13050, enterprise: 7000 },
]

const CUSTOMER_GROWTH = [
  { month: 'Apr', biz: 8, schools: 2 }, { month: 'May', biz: 12, schools: 3 },
  { month: 'Jun', biz: 16, schools: 5 }, { month: 'Jul', biz: 20, schools: 7 },
  { month: 'Aug', biz: 24, schools: 9 }, { month: 'Sep', biz: 28, schools: 11 },
  { month: 'Oct', biz: 31, schools: 13 }, { month: 'Nov', biz: 35, schools: 15 },
  { month: 'Dec', biz: 38, schools: 17 }, { month: 'Jan', biz: 41, schools: 19 },
  { month: 'Feb', biz: 44, schools: 21 }, { month: 'Mar', biz: 47, schools: 23 },
]

const NET_NEW = [
  { month: 'Oct', newCust: 5, churned: 1 }, { month: 'Nov', newCust: 6, churned: 1 },
  { month: 'Dec', newCust: 4, churned: 1 }, { month: 'Jan', newCust: 7, churned: 2 },
  { month: 'Feb', newCust: 6, churned: 1 }, { month: 'Mar', newCust: 8, churned: 1 },
]

const FUNNEL = [
  { stage: 'Visited site', value: 1847, pct: 100 },
  { stage: 'Started trial', value: 89, pct: 4.8 },
  { stage: 'Completed onboarding', value: 67, pct: 75 },
  { stage: 'Active after day 7', value: 54, pct: 61 },
  { stage: 'Converted to paid', value: 31, pct: 34 },
]

const TRIAL_SOURCES = [
  { name: 'Direct', value: 34, color: '#0D9488' },
  { name: 'Google Search', value: 28, color: '#8B5CF6' },
  { name: 'LinkedIn', value: 18, color: '#22D3EE' },
  { name: 'Word of Mouth', value: 12, color: '#F59E0B' },
  { name: 'Other', value: 8, color: '#6B7280' },
]

const TIME_TO_CONVERT = [
  { name: 'Same day', value: 8, color: '#22C55E' },
  { name: '1-3 days', value: 22, color: '#0D9488' },
  { name: '4-7 days', value: 31, color: '#8B5CF6' },
  { name: '8-14 days', value: 28, color: '#F59E0B' },
  { name: 'Did not', value: 11, color: '#EF4444' },
]

const DROPOFF_REASONS = [
  { name: 'Not ready yet', value: 34, color: '#6B7280' },
  { name: 'Missing feature', value: 28, color: '#F59E0B' },
  { name: 'Too expensive', value: 18, color: '#EF4444' },
  { name: 'Went competitor', value: 12, color: '#8B5CF6' },
  { name: 'Other', value: 8, color: '#374151' },
]

const PLAN_TABLE = [
  { plan: 'Starter', customers: 28, mrr: 8400, tenure: '4.2 months', churn: '3.1%', nps: 58 },
  { plan: 'Growth', customers: 31, mrr: 13050, tenure: '7.8 months', churn: '1.8%', nps: 71 },
  { plan: 'Enterprise', customers: 11, mrr: 7000, tenure: '14.2 months', churn: '0.4%', nps: 82 },
]

const GEO = [
  { region: 'London & SE', pct: 34 }, { region: 'Manchester', pct: 18 },
  { region: 'Birmingham', pct: 12 }, { region: 'Leeds', pct: 8 },
  { region: 'Bristol', pct: 7 }, { region: 'Scotland', pct: 6 },
  { region: 'Other UK', pct: 15 },
]

const FEATURES = [
  { name: 'Morning Briefing', pct: 94 }, { name: 'Morning Roundup', pct: 91 },
  { name: 'Quick Actions', pct: 88 }, { name: 'Voice Commands', pct: 78 },
  { name: 'CRM', pct: 71 }, { name: 'Photo Frame', pct: 67 },
  { name: 'Reports', pct: 45 }, { name: 'SSO (Schools)', pct: 34 },
]

const COHORTS = [
  { cohort: 'Oct 2025', started: 8, m1: 100, m3: 88, m6: 75, m12: 63 },
  { cohort: 'Nov 2025', started: 12, m1: 100, m3: 92, m6: 83, m12: null },
  { cohort: 'Dec 2025', started: 9, m1: 100, m3: 89, m6: 78, m12: null },
  { cohort: 'Jan 2026', started: 14, m1: 100, m3: 93, m6: null, m12: null },
  { cohort: 'Feb 2026', started: 18, m1: 100, m3: 91, m6: null, m12: null },
  { cohort: 'Mar 2026', started: 31, m1: 100, m3: null, m6: null, m12: null },
]

const ALERTS = [
  { level: 'red', text: '3 trials expiring in 48 hours — no engagement in last 7 days', names: 'Helix Digital, Vertex Systems, FluxCore Ltd' },
  { level: 'yellow', text: '2 Growth plan customers showing declining usage' },
  { level: 'yellow', text: '5 trials started but never completed onboarding' },
  { level: 'green', text: '7 trials highly engaged — prime for conversion outreach' },
  { level: 'green', text: 'MRR growth on track for £35k target by end of Q2' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MetricCard({ label, value, trend, good, prefix }: { label: string; value: string; trend?: string; good?: boolean; prefix?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-xl font-black" style={{ color: '#F9FAFB' }}>{prefix}{value}</p>
      {trend && <p className="text-xs mt-1 font-semibold" style={{ color: good ? '#22C55E' : '#EF4444' }}>{trend}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold mt-8 mb-4" style={{ color: '#F9FAFB' }}>{children}</h2>
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>{title}</p>
      {children}
    </div>
  )
}

function MiniPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={100} height={100}>
        <PieChart><Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} strokeWidth={0}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie></PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 flex-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /><span style={{ color: '#9CA3AF' }}>{d.name}</span></div>
            <span className="font-bold" style={{ color: '#F9FAFB' }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function retentionColor(pct: number | null) {
  if (pct === null) return '#1F2937'
  if (pct >= 90) return 'rgba(34,197,94,0.15)'
  if (pct >= 75) return 'rgba(13,148,136,0.15)'
  if (pct >= 60) return 'rgba(245,158,11,0.15)'
  return 'rgba(239,68,68,0.15)'
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [range, setRange] = useState('12m')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(245,166,35,0.15)' }}>
            <Sparkles size={18} style={{ color: '#F5A623' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Insights</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Business intelligence & analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['12m', 'Last 12 months'], ['all', 'All time']].map(([key, label]) => (
            <button key={key} onClick={() => setRange(key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: range === key ? '#F5A623' : '#111318', color: range === key ? '#0A0B10' : '#9CA3AF', border: range === key ? 'none' : '1px solid #1F2937' }}>
              {label}
            </button>
          ))}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* SECTION 1 — Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricCard label="Total MRR" value="28,450" prefix="£" trend="+12% vs last month" good />
        <MetricCard label="Annual Run Rate" value="341,400" prefix="£" />
        <MetricCard label="Total Customers" value="70" trend="47 biz + 23 schools" />
        <MetricCard label="Active Trials" value="31" />
        <MetricCard label="Conversion Rate" value="34%" trend="+3% vs last month" good />
        <MetricCard label="Churn Rate" value="2.1%" trend="-0.4% vs last month" good />
        <MetricCard label="ARPU" value="406/mo" prefix="£" />
        <MetricCard label="NPS Score" value="67" trend="Good" good />
      </div>

      {/* SECTION 2 — Revenue Charts */}
      <SectionTitle>Revenue</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="MRR Growth (12 months)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MRR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12, color: '#F9FAFB' }} formatter={(v: number) => [`£${v.toLocaleString()}`, 'MRR']} />
              <Line type="monotone" dataKey="mrr" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by Plan">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REVENUE_BY_PLAN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12, color: '#F9FAFB' }} />
              <Bar dataKey="starter" stackId="a" fill="#0D9488" radius={[0, 0, 0, 0]} name="Starter" />
              <Bar dataKey="growth" stackId="a" fill="#8B5CF6" name="Growth" />
              <Bar dataKey="enterprise" stackId="a" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Enterprise" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SECTION 3 — Customer Growth */}
      <SectionTitle>Customer Growth</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Total Customers (Business vs Schools)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CUSTOMER_GROWTH}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12, color: '#F9FAFB' }} />
              <Line type="monotone" dataKey="biz" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} name="Businesses" />
              <Line type="monotone" dataKey="schools" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} name="Schools" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Net New Customers per Month">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={NET_NEW}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12, color: '#F9FAFB' }} />
              <Bar dataKey="newCust" fill="#22C55E" radius={[3, 3, 0, 0]} name="New" />
              <Bar dataKey="churned" fill="#EF4444" radius={[3, 3, 0, 0]} name="Churned" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SECTION 4 — Trials Funnel */}
      <SectionTitle>Trials Funnel</SectionTitle>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="space-y-2">
          {FUNNEL.map((f, i) => {
            const width = i === 0 ? 100 : f.pct * (i === 1 ? 1 : 0.8 + i * 0.05)
            const dropoff = i > 0 ? FUNNEL[i - 1].value - f.value : 0
            return (
              <div key={f.stage} className="flex items-center gap-4">
                <div className="w-44 text-xs font-medium shrink-0" style={{ color: '#D1D5DB' }}>{f.stage}</div>
                <div className="flex-1 relative">
                  <div className="h-8 rounded-lg flex items-center px-3 transition-all" style={{ width: `${Math.max(width, 8)}%`, backgroundColor: i === 0 ? '#0D9488' : i < 3 ? 'rgba(13,148,136,0.4)' : i < 4 ? 'rgba(139,92,246,0.4)' : '#8B5CF6' }}>
                    <span className="text-xs font-bold text-white">{f.value.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-20 text-right shrink-0">
                  {i > 0 && <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>-{dropoff} ({(100 - (f.value / FUNNEL[i - 1].value) * 100).toFixed(0)}%)</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 5 — Trial Analytics */}
      <SectionTitle>Trial Analytics</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Trial Sources"><MiniPie data={TRIAL_SOURCES} /></ChartCard>
        <ChartCard title="Time to Convert"><MiniPie data={TIME_TO_CONVERT} /></ChartCard>
        <ChartCard title="Drop-off Reasons"><MiniPie data={DROPOFF_REASONS} /></ChartCard>
      </div>

      {/* SECTION 6 — Plan Breakdown */}
      <SectionTitle>Plan Breakdown</SectionTitle>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
            {['Plan', 'Customers', 'MRR', 'Avg Tenure', 'Churn Rate', 'NPS'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {PLAN_TABLE.map(r => (
              <tr key={r.plan} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.plan}</td>
                <td className="px-4 py-3" style={{ color: '#D1D5DB' }}>{r.customers}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: '#0D9488' }}>£{r.mrr.toLocaleString()}</td>
                <td className="px-4 py-3" style={{ color: '#D1D5DB' }}>{r.tenure}</td>
                <td className="px-4 py-3" style={{ color: parseFloat(r.churn) > 2 ? '#EF4444' : '#22C55E' }}>{r.churn}</td>
                <td className="px-4 py-3 font-bold" style={{ color: r.nps >= 70 ? '#22C55E' : r.nps >= 50 ? '#F59E0B' : '#EF4444' }}>{r.nps}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#0A0B10' }}>
              <td className="px-4 py-3 font-bold" style={{ color: '#F9FAFB' }}>Total</td>
              <td className="px-4 py-3 font-bold" style={{ color: '#F9FAFB' }}>70</td>
              <td className="px-4 py-3 font-bold" style={{ color: '#0D9488' }}>£28,450</td>
              <td className="px-4 py-3" style={{ color: '#D1D5DB' }}>7.4 months</td>
              <td className="px-4 py-3" style={{ color: '#22C55E' }}>2.1%</td>
              <td className="px-4 py-3 font-bold" style={{ color: '#22C55E' }}>67</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 7 — Geographic Breakdown */}
      <SectionTitle>Geographic Breakdown</SectionTitle>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="space-y-2">
          {GEO.map(g => (
            <div key={g.region} className="flex items-center gap-3">
              <span className="text-xs w-28 shrink-0" style={{ color: '#9CA3AF' }}>{g.region}</span>
              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full" style={{ width: `${g.pct}%`, backgroundColor: '#0D9488' }} />
              </div>
              <span className="text-xs font-bold w-10 text-right" style={{ color: '#F9FAFB' }}>{g.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8 — Product Usage */}
      <SectionTitle>Product Usage (Daily Active %)</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map(f => (
          <div key={f.name} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{f.name}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black" style={{ color: f.pct >= 80 ? '#22C55E' : f.pct >= 50 ? '#0D9488' : '#F59E0B' }}>{f.pct}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
              <div className="h-full rounded-full" style={{ width: `${f.pct}%`, backgroundColor: f.pct >= 80 ? '#22C55E' : f.pct >= 50 ? '#0D9488' : '#F59E0B' }} />
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 9 — Cohort Analysis */}
      <SectionTitle>Cohort Analysis (Retention %)</SectionTitle>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
            {['Cohort', 'Started', 'Month 1', 'Month 3', 'Month 6', 'Month 12'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {COHORTS.map(c => (
              <tr key={c.cohort} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{c.cohort}</td>
                <td className="px-4 py-3" style={{ color: '#D1D5DB' }}>{c.started}</td>
                {[c.m1, c.m3, c.m6, c.m12].map((v, i) => (
                  <td key={i} className="px-4 py-3 font-semibold" style={{ color: v !== null ? '#F9FAFB' : '#374151', backgroundColor: retentionColor(v) }}>
                    {v !== null ? `${v}%` : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 10 — Health Alerts */}
      <SectionTitle>Health Alerts</SectionTitle>
      <div className="space-y-2">
        {ALERTS.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{
            backgroundColor: a.level === 'red' ? 'rgba(239,68,68,0.06)' : a.level === 'yellow' ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
            border: `1px solid ${a.level === 'red' ? 'rgba(239,68,68,0.2)' : a.level === 'yellow' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}>
            <span className="text-sm mt-0.5">{a.level === 'red' ? '🔴' : a.level === 'yellow' ? '🟡' : '🟢'}</span>
            <div>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{a.text}</p>
              {a.names && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{a.names}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
