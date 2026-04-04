'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, Share2, Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'

const PERIODS = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'] as const
type Period = typeof PERIODS[number]

const ACCENT: Record<string, string> = {
  business: '#0D9488', schools: '#22C55E', football: '#C0392B',
}

const DEPT_LABELS: Record<string, string> = {
  hr: 'HR & People', sales: 'Sales', marketing: 'Marketing', accounts: 'Accounts & Finance',
  operations: 'Operations', success: 'Customer Success', support: 'Support', it: 'IT & Systems',
  crm: 'CRM', strategy: 'Strategy', trials: 'Trials', insights: 'Insights',
  workflows: 'Workflows', partners: 'Partners',
  'school-office': 'School Office', 'hr-staff': 'HR & Staff', curriculum: 'Curriculum',
  safeguarding: 'Safeguarding', 'send-dsl': 'SEND & DSL', 'finance-school': 'Finance',
  admissions: 'Admissions', ofsted: 'Ofsted', trust: 'Trust', students: 'Students',
  wraparound: 'Wraparound', 'facilities-school': 'Facilities', timetable: 'Timetable',
  reports: 'Reports', classes: 'Classes', slt: 'SLT Suite', facilities: 'Facilities',
  squad: 'First Team', tactics: 'Tactics', medical: 'Medical', scouting: 'Scouting',
  academy: 'Academy', transfers: 'Transfers', analytics: 'Analytics', media: 'Media & PR',
  matchday: 'Match Day', training: 'Training', 'finance-football': 'Finance',
  'staff-football': 'Staff', 'facilities-football': 'Facilities',
}

// Demo metrics per department for the comparison table
const DEPT_METRICS: Record<string, { label: string; current: string; previous: string; target: string }[]> = {
  hr: [
    { label: 'Headcount', current: '192', previous: '189', target: '200' },
    { label: 'Attrition Rate', current: '4.2%', previous: '5.0%', target: '<5%' },
    { label: 'Time to Hire', current: '23 days', previous: '21 days', target: '20 days' },
    { label: 'Training Compliance', current: '87%', previous: '82%', target: '90%' },
    { label: 'eNPS Score', current: '42', previous: '36', target: '40' },
    { label: 'Leave Utilisation', current: '62%', previous: '58%', target: '70%' },
  ],
  sales: [
    { label: 'Pipeline Value', current: '£128k', previous: '£114k', target: '£150k' },
    { label: 'Win Rate', current: '28%', previous: '24%', target: '30%' },
    { label: 'Active Leads', current: '34', previous: '29', target: '40' },
    { label: 'Avg Deal Size', current: '£12.4k', previous: '£11.8k', target: '£15k' },
    { label: 'Meetings Booked', current: '18', previous: '14', target: '20' },
  ],
  // ── Business departments ────────────────────────────────────────────────
  accounts: [
    { label: 'Outstanding Invoices', current: '14', previous: '11', target: '<10' },
    { label: 'MRR', current: '£41,999', previous: '£37,500', target: '£50k' },
    { label: 'Overdue Amount', current: '£23,400', previous: '£18,600', target: '£0' },
    { label: 'Collection Rate', current: '89%', previous: '85%', target: '95%' },
    { label: 'Days to Pay (avg)', current: '28', previous: '31', target: '<25' },
  ],
  marketing: [
    { label: 'Leads This Month', current: '34', previous: '28', target: '40' },
    { label: 'Website Traffic', current: '+34%', previous: '+18%', target: '+30%' },
    { label: 'Email Open Rate', current: '42%', previous: '38%', target: '40%' },
    { label: 'Conversion Rate', current: '3.2%', previous: '2.8%', target: '4%' },
    { label: 'Active Campaigns', current: '3', previous: '2', target: '4' },
  ],
  operations: [
    { label: 'Active Projects', current: '8', previous: '6', target: '10' },
    { label: 'Overdue Tasks', current: '3', previous: '5', target: '0' },
    { label: 'System Uptime', current: '99.8%', previous: '99.6%', target: '99.9%' },
    { label: 'Hours Automated', current: '47', previous: '38', target: '60' },
    { label: 'Process Documentation', current: '67%', previous: '58%', target: '80%' },
  ],
  support: [
    { label: 'Open Tickets', current: '23', previous: '28', target: '<20' },
    { label: 'Avg Response Time', current: '1.8h', previous: '2.4h', target: '<1h' },
    { label: 'SLA Compliance', current: '91%', previous: '87%', target: '95%' },
    { label: 'CSAT Score', current: '4.6', previous: '4.4', target: '4.8' },
    { label: 'Resolved Today', current: '8', previous: '6', target: '10' },
  ],
  success: [
    { label: 'Total Customers', current: '173', previous: '168', target: '200' },
    { label: 'At-Risk Accounts', current: '10', previous: '12', target: '<5' },
    { label: 'NPS Score', current: '67', previous: '63', target: '70' },
    { label: 'Churn Rate', current: '2.1%', previous: '2.4%', target: '<2%' },
    { label: 'QBRs Due', current: '4', previous: '3', target: '0' },
  ],
  it: [
    { label: 'Open Tickets', current: '7', previous: '9', target: '<5' },
    { label: 'System Uptime', current: '99.8%', previous: '99.6%', target: '99.9%' },
    { label: 'Security Score', current: '94', previous: '91', target: '95' },
    { label: 'Devices Managed', current: '94', previous: '89', target: '100' },
    { label: 'Licences Managed', current: '89', previous: '82', target: '—' },
  ],
  trials: [
    { label: 'Active Trials', current: '12', previous: '10', target: '20' },
    { label: 'Conversions', current: '4', previous: '3', target: '5' },
    { label: 'Conversion Rate', current: '34%', previous: '30%', target: '40%' },
    { label: 'Avg Trial Length', current: '12 days', previous: '14 days', target: '10 days' },
    { label: 'Expiring Soon', current: '3', previous: '2', target: '0' },
  ],
  crm: [
    { label: 'Total Contacts', current: '847', previous: '812', target: '1000' },
    { label: 'Active Deals', current: '34', previous: '29', target: '40' },
    { label: 'Pipeline Value', current: '£2.4M', previous: '£2.1M', target: '£3M' },
    { label: 'Win Rate', current: '23%', previous: '21%', target: '30%' },
  ],
  partners: [
    { label: 'Active Partners', current: '5', previous: '4', target: '8' },
    { label: 'Partner Pipeline', current: '£847k', previous: '£720k', target: '£1M' },
    { label: 'Partner Win Rate', current: '68%', previous: '62%', target: '70%' },
    { label: 'Referrals This Month', current: '7', previous: '5', target: '10' },
  ],
  strategy: [
    { label: 'OKR Completion', current: '67%', previous: '54%', target: '80%' },
    { label: 'Key Results On Track', current: '8', previous: '6', target: '12' },
    { label: 'Board Actions Open', current: '4', previous: '7', target: '0' },
    { label: 'Competitor Alerts', current: '2', previous: '1', target: '—' },
  ],
  workflows: [
    { label: 'Active Workflows', current: '44', previous: '38', target: '50' },
    { label: 'Runs (30d)', current: '1,844', previous: '1,602', target: '2,000' },
    { label: 'Failure Rate', current: '0.8%', previous: '1.2%', target: '<1%' },
    { label: 'Hours Saved', current: '47', previous: '38', target: '60' },
  ],
  projects: [
    { label: 'Active Projects', current: '8', previous: '6', target: '10' },
    { label: 'On Track', current: '6', previous: '4', target: '8' },
    { label: 'Overdue Milestones', current: '2', previous: '4', target: '0' },
    { label: 'Team Utilisation', current: '87%', previous: '82%', target: '90%' },
  ],
  // ── Schools departments ──────────────────────────────────────────────────
  'school-office': [
    { label: 'Emails flagged for action', current: '7', previous: '4', target: '0' },
    { label: 'Unread SMS alerts', current: '3', previous: '1', target: '0' },
    { label: 'Visitors today', current: '4', previous: '6', target: '—' },
    { label: 'First aid logs today', current: '1', previous: '2', target: '—' },
    { label: 'Urgent parent responses', current: '3', previous: '1', target: '0' },
  ],
  timetable: [
    { label: 'Cover needed', current: '3', previous: '2', target: '0' },
    { label: 'Unassigned lessons', current: '2', previous: '0', target: '0' },
    { label: 'Room conflicts', current: '0', previous: '1', target: '0' },
    { label: 'Change requests pending', current: '3', previous: '2', target: '0' },
  ],
  'hr-staff': [
    { label: 'Staff absent today', current: '1', previous: '2', target: '0' },
    { label: 'Leave requests pending', current: '1', previous: '0', target: '0' },
    { label: 'CPD bookings this month', current: '1', previous: '3', target: '5' },
    { label: 'Contracts expiring', current: '0', previous: '1', target: '0' },
  ],
  students: [
    { label: 'New admissions pending', current: '1', previous: '2', target: '0' },
    { label: 'Behaviour incidents (week)', current: '4', previous: '6', target: '<3' },
    { label: 'Parent contacts needed', current: '3', previous: '2', target: '0' },
    { label: 'Exclusions pending', current: '0', previous: '0', target: '0' },
  ],
  'send-dsl': [
    { label: 'SEND referrals pending', current: '2', previous: '1', target: '0' },
    { label: 'EHCPs due for review', current: '3', previous: '2', target: '0' },
    { label: 'LAC pupils', current: '1', previous: '1', target: '—' },
    { label: 'SEMH concerns', current: '2', previous: '3', target: '0' },
  ],
  safeguarding: [
    { label: 'Open concerns', current: '1', previous: '0', target: '0' },
    { label: 'Referrals pending', current: '0', previous: '1', target: '0' },
    { label: 'Actions overdue', current: '1', previous: '0', target: '0' },
    { label: 'Staff training complete', current: '95%', previous: '92%', target: '100%' },
  ],
  'finance-school': [
    { label: 'Expenses claims pending', current: '2', previous: '1', target: '0' },
    { label: 'Invoices unpaid', current: '3', previous: '2', target: '0' },
    { label: 'Budget remaining', current: '78%', previous: '82%', target: '>70%' },
    { label: 'Grant deadlines', current: '1', previous: '0', target: '0' },
  ],
  facilities: [
    { label: 'Maintenance requests open', current: '4', previous: '3', target: '0' },
    { label: 'Room bookings today', current: '12', previous: '8', target: '—' },
    { label: 'Compliance checks due', current: '2', previous: '0', target: '0' },
    { label: 'H&S incidents (month)', current: '0', previous: '1', target: '0' },
  ],
  curriculum: [
    { label: 'Scheme of work gaps', current: '2', previous: '3', target: '0' },
    { label: 'Assessments due', current: '1', previous: '2', target: '0' },
    { label: 'Resource requests', current: '3', previous: '2', target: '0' },
    { label: 'Moderation due', current: '1', previous: '0', target: '0' },
  ],
  classes: [
    { label: 'Registers missed', current: '0', previous: '1', target: '0' },
    { label: 'Cover lessons today', current: '3', previous: '2', target: '0' },
    { label: 'Behaviour incidents today', current: '2', previous: '4', target: '0' },
    { label: 'Homework overdue', current: '14', previous: '18', target: '<10' },
  ],
  slt: [
    { label: 'Ofsted readiness', current: '87%', previous: '83%', target: '90%' },
    { label: 'Governor report due', current: 'Yes', previous: 'No', target: '—' },
    { label: 'Improvement plan actions', current: '5', previous: '7', target: '0' },
    { label: 'Staff appraisals due', current: '3', previous: '5', target: '0' },
  ],
}

interface InsightsData {
  executiveSummary: string
  achievements: string[]
  improvements: string[]
  risks: string[]
  actions: string[]
}

export default function AIInsightsReport({ dept, portal = 'business', isOpen, onClose }: {
  dept: string; portal?: 'business' | 'schools' | 'football'; isOpen: boolean; onClose: () => void
}) {
  const accent = ACCENT[portal] || '#0D9488'
  const label = DEPT_LABELS[dept] || dept
  const [period, setPeriod] = useState<Period>('This Month')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<InsightsData | null>(null)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    const cacheKey = `lumio_insights_${dept}_${period}`
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return }
      } catch { /* ignore */ }
    }

    try {
      const res = await fetch('/api/ai/dept-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept, mode: 'insights', period, portal }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setData(result)
      if (typeof window !== 'undefined') sessionStorage.setItem(cacheKey, JSON.stringify(result))
    } catch {
      setData({
        executiveSummary: `The ${label} department has performed within expected parameters for ${period.toLowerCase()}. Key metrics are tracking close to target with minor variances in efficiency and throughput.`,
        achievements: ['✅ Core KPIs met or exceeded target', '✅ Team engagement scores improved', '✅ No critical incidents reported'],
        improvements: ['🔶 Process efficiency below optimal — review workflows', '🔶 Data quality needs attention in some areas', '🔶 Cross-department communication could improve'],
        risks: ['🔴 End-of-period reporting deadline approaching'],
        actions: ['➡️ Schedule department review meeting this week', '➡️ Review and update key processes', '➡️ Address data quality gaps', '➡️ Plan next period objectives'],
      })
    } finally {
      setLoading(false)
    }
  }, [dept, period, portal, label])

  useEffect(() => {
    if (isOpen) fetchInsights()
  }, [isOpen, fetchInsights])

  if (!isOpen) return null

  const metrics = DEPT_METRICS[dept] || DEPT_METRICS['hr'] || []

  function handleExport() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full rounded-2xl flex flex-col print:rounded-none print:max-w-none print:max-h-none" style={{ maxWidth: 800, maxHeight: '92vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 print:hidden" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <BarChart3 size={18} style={{ color: accent }} />
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{label} — Insights Report</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>AI-generated department analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #374151' }}>
              <Download size={12} /> Export PDF
            </button>
            <button onClick={() => { onClose() }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #374151' }}>
              <Share2 size={12} /> Share
            </button>
            <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 px-6 py-3 flex-shrink-0 print:hidden" style={{ borderBottom: '1px solid #1F2937' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: period === p ? `${accent}1f` : 'transparent', color: period === p ? accent : '#6B7280', border: period === p ? `1px solid ${accent}33` : '1px solid transparent' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={28} className="animate-spin" style={{ color: accent }} />
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Generating your insights report...</p>
              <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: accent, width: '60%' }} />
              </div>
            </div>
          ) : data ? (
            <>
              {/* Executive Summary */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: `1px solid ${accent}33` }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: accent }}>Executive Summary</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{data.executiveSummary}</p>
              </div>

              {/* Key Metrics */}
              {metrics.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {metrics.map((m, i) => {
                      const curr = parseFloat(m.current.replace(/[^0-9.-]/g, ''))
                      const prev = parseFloat(m.previous.replace(/[^0-9.-]/g, ''))
                      const diff = curr - prev
                      const isUp = diff > 0
                      const TrendIcon = diff === 0 ? Minus : isUp ? TrendingUp : TrendingDown
                      return (
                        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{m.label}</p>
                          <p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{m.current}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendIcon size={10} style={{ color: isUp ? '#22C55E' : '#EF4444' }} />
                            <span className="text-xs" style={{ color: isUp ? '#22C55E' : '#EF4444' }}>vs {m.previous}</span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: '#4B5563' }}>Target: {m.target}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#22C55E' }}>Top Achievements</h3>
                <div className="space-y-2">
                  {data.achievements.map((a, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{a}</p>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#F59E0B' }}>Areas for Improvement</h3>
                <div className="space-y-2">
                  {data.improvements.map((a, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{a}</p>
                  ))}
                </div>
              </div>

              {/* Risks */}
              {data.risks.length > 0 && (
                <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#EF4444' }}>Risks & Alerts</h3>
                  <div className="space-y-2">
                    {data.risks.map((r, i) => (
                      <p key={i} className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{r}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: `1px solid ${accent}33` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: accent }}>Recommended Actions</h3>
                <div className="space-y-2">
                  {data.actions.map((a, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{a}</p>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              {metrics.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                  <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                    <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Period Comparison</h3>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1F2937' }}>
                        {['Metric', period, 'Previous', 'Change', 'Target'].map(h => (
                          <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, i) => {
                        const curr = parseFloat(m.current.replace(/[^0-9.-]/g, ''))
                        const prev = parseFloat(m.previous.replace(/[^0-9.-]/g, ''))
                        const diff = curr - prev
                        const sign = diff > 0 ? '+' : ''
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                            <td className="px-5 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{m.label}</td>
                            <td className="px-5 py-2.5 font-bold" style={{ color: '#F9FAFB' }}>{m.current}</td>
                            <td className="px-5 py-2.5" style={{ color: '#6B7280' }}>{m.previous}</td>
                            <td className="px-5 py-2.5 font-bold" style={{ color: diff >= 0 ? '#22C55E' : '#EF4444' }}>{sign}{diff.toFixed(1).replace('.0', '')}</td>
                            <td className="px-5 py-2.5" style={{ color: '#6B7280' }}>{m.target}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
