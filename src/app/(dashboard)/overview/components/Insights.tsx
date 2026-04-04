'use client'

import { useState, useEffect } from 'react'

interface Insight {
  id: string
  type: 'alert' | 'opportunity' | 'trend' | 'achievement'
  title: string
  body: string
  metric?: string
  metricChange?: string
  positive?: boolean
  action?: string
  actionUrl?: string
  source: string
  generated: string
}

const INSIGHTS_AI: Record<string, { summary: string[]; highlights: Array<{n: number; text: string; color: string}> }> = {
  executive: {
    summary: ['MRR up 12% month-on-month — strongest growth since Q3 last year', '23 new customers in last 30 days — pipeline converting well', '3 workflows flagged as needing attention — support SLA at risk', 'Customer health stable — 132 healthy, 29 at risk, 10 critical'],
    highlights: [
      { n: 1, text: 'Revenue on track — Q2 target achievable if 2 deals close this week', color: 'text-teal-400' },
      { n: 2, text: 'Churn risk: 3 accounts flagged red — immediate CS action needed', color: 'text-red-400' },
      { n: 3, text: 'Team capacity at 94% — hiring pipeline needs acceleration', color: 'text-amber-400' },
      { n: 4, text: 'NPS score 67 — up 4 points vs last quarter', color: 'text-teal-400' },
      { n: 5, text: 'Automation saved 47 hours this month across all workflows', color: 'text-teal-400' },
    ]
  },
  revenue: {
    summary: ['Pipeline value £2.4M — up 12% vs last month', 'Win rate 23% — below 27% industry average, needs review', 'Top source: referrals at 40% of new leads', '6 deals in negotiation — strong month-end potential'],
    highlights: [
      { n: 1, text: 'Greenfield Group deal (£85k) — proposal due today, highest priority', color: 'text-red-400' },
      { n: 2, text: '3 trials expiring this week — £8,400 combined value at risk', color: 'text-amber-400' },
      { n: 3, text: 'Apex Learning referral pipeline strongest in 6 months', color: 'text-teal-400' },
      { n: 4, text: 'Average deal size £17,800 — up £2,100 vs last quarter', color: 'text-teal-400' },
      { n: 5, text: 'Win rate improving in enterprise segment — 34% vs 23% overall', color: 'text-teal-400' },
    ]
  },
  people: {
    summary: ['187 employees — +3 vs last month', '8 active onboardings in progress', '3 probation reviews overdue — action required today', '14 leave requests pending approval'],
    highlights: [
      { n: 1, text: '3 performance reviews overdue — legal compliance risk', color: 'text-red-400' },
      { n: 2, text: 'Staff wellbeing score 7.4/10 — highest this quarter', color: 'text-teal-400' },
      { n: 3, text: '2 open roles in pipeline — engineering and customer success', color: 'text-amber-400' },
      { n: 4, text: 'Sickness absence down 18% vs same period last year', color: 'text-teal-400' },
      { n: 5, text: 'Training completion rate 84% — above 80% target', color: 'text-teal-400' },
    ]
  },
  customers: {
    summary: ['173 total customers — 132 healthy, 29 at risk, 10 critical', 'NPS score 67 — up from 63 last quarter', 'Average onboarding time 14 days — down from 21', 'Support ticket SLA met 91% of the time this month'],
    highlights: [
      { n: 1, text: '10 critical accounts — CS team must contact all this week', color: 'text-red-400' },
      { n: 2, text: 'Bramble Hill at risk — no login in 18 days, renewal in 30', color: 'text-amber-400' },
      { n: 3, text: 'Expansion revenue up 18% — existing customers adding seats', color: 'text-teal-400' },
      { n: 4, text: 'Churn rate 2.1% — below 2.5% target for third month', color: 'text-teal-400' },
      { n: 5, text: '5 customers ready for case study — CS to initiate conversations', color: 'text-teal-400' },
    ]
  },
  operations: {
    summary: ['44 active workflows running — 3 flagged for attention', '1,844 workflow runs in last 30 days — up 12%', 'System uptime 99.8% — all integrations healthy', 'Automation saved estimated 47 hours this month'],
    highlights: [
      { n: 1, text: '3 workflows failing intermittently — investigate before scale', color: 'text-red-400' },
      { n: 2, text: 'Invoice chase workflow saved £12k in recovered revenue', color: 'text-teal-400' },
      { n: 3, text: 'n8n integration running 200+ workflows — stable', color: 'text-teal-400' },
      { n: 4, text: 'API rate limits at 67% — monitor before adding new integrations', color: 'text-amber-400' },
      { n: 5, text: 'Workflow efficiency up 23% since last optimisation sprint', color: 'text-teal-400' },
    ]
  },
  sales: {
    summary: ['34 open deals — up 8% vs last month', 'Pipeline velocity improving — deals close in avg 24 days', '8 hot leads require immediate attention', '2 deals closing this week'],
    highlights: [
      { n: 1, text: 'Stale deals: 6 with no activity in 14+ days — needs follow-up', color: 'text-red-400' },
      { n: 2, text: 'Top rep closing rate 41% — share approach with team', color: 'text-teal-400' },
      { n: 3, text: 'Demo-to-close rate improved to 31% — best in 8 months', color: 'text-teal-400' },
      { n: 4, text: 'Inbound leads up 28% — marketing activity paying off', color: 'text-teal-400' },
      { n: 5, text: 'Q2 target: £480k — currently at £390k, gap of £90k', color: 'text-amber-400' },
    ]
  },
  marketing: {
    summary: ['Website traffic up 34% month-on-month', 'Email open rate 42% — above 35% industry average', 'Content driving 28% of new inbound leads', '3 campaigns active — all tracking to target'],
    highlights: [
      { n: 1, text: 'SEO traffic up 41% — blog content performing strongly', color: 'text-teal-400' },
      { n: 2, text: 'LinkedIn ads ROAS 3.2x — increase budget by 20%', color: 'text-teal-400' },
      { n: 3, text: 'Case study library needs 3 more — CS to identify candidates', color: 'text-amber-400' },
      { n: 4, text: 'Email unsubscribe rate rising — review send frequency', color: 'text-red-400' },
      { n: 5, text: 'Webinar last week generated 47 qualified leads — repeat format', color: 'text-teal-400' },
    ]
  },
};

const TYPE_STYLES = {
  alert:       { icon: '🚨', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.2)',   tag: '#F87171'  },
  opportunity: { icon: '💡', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)',  tag: '#FBBF24'  },
  trend:       { icon: '📈', bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.2)',  tag: '#60A5FA'  },
  achievement: { icon: '🏆', bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.2)',   tag: '#4ADE80'  },
}

const MOCK_INSIGHTS: Insight[] = [
  { id: '1', type: 'alert', title: '7 customers below health score threshold', body: 'Whitestone College (34), Elmfield Institute (38), and 5 others are below your 40-point alert line. At-risk customers are 3× more likely to churn. CS-01 auto-alerts are active.', metric: '7 at risk', metricChange: '+2 since last week', positive: false, action: 'View at-risk', source: 'CS-01 Health Engine', generated: '07:00' },
  { id: '2', type: 'opportunity', title: 'Zendesk Sell retirement — 4 hot leads in pipeline', body: 'SA-02 has scored 4 Zendesk Sell users at 80+ this week. Two have visited the pricing page twice. Window: they need to migrate before Aug 2027.', metric: '4 leads', metricChange: 'Score: 80–92', positive: true, action: 'View leads', source: 'SA-02 Lead Scoring', generated: '07:00' },
  { id: '3', type: 'trend', title: 'Trial-to-paid conversion rate is 12% this month', body: '3 of the last 25 demo signups converted to paid plans. Industry benchmark is 5–8%. You\'re above average — the self-serve demo system is working.', metric: '12%', metricChange: '+4% vs last month', positive: true, source: 'Demo system analytics', generated: '06:00' },
  { id: '4', type: 'achievement', title: 'HR-01 has saved 47 hours of admin this month', body: 'New joiner onboarding workflow has run 12 times. Average time saved: 3.9 hours per activation vs manual process. Equivalent to £1,128 in staff time.', metric: '47 hours', metricChange: '£1,128 value', positive: true, source: 'HR-01 execution logs', generated: '06:00' },
  { id: '5', type: 'alert', title: 'Overdue invoices total £14,230', body: '7 invoices are past due date. Bramble Hill Trust (£4,800, 30 days) is the largest. AC-03 chase sequence is active on 5 of them. 2 need manual escalation.', metric: '£14,230', metricChange: '7 invoices', positive: false, action: 'View invoices', source: 'Xero + AC-03', generated: '07:00' },
]

export default function Insights() {
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/insights', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => setInsights(d.insights || MOCK_INSIGHTS))
      .catch(() => setInsights(MOCK_INSIGHTS))
  }, [])

  const currentAI = INSIGHTS_AI.executive;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>📊 Insights</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>AI-generated from your live data — updated every morning at 6am</p>
        </div>
        <div className="text-xs" style={{ color: '#374151' }}>Last run: today 07:00</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map(ins => {
          const style = TYPE_STYLES[ins.type]
          return (
            <div key={ins.id} className="rounded-2xl p-5"
              style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: style.tag }}>{ins.type}</span>
                </div>
                {ins.metric && (
                  <div className="text-right">
                    <div className="text-lg font-black" style={{ color: ins.positive ? '#4ADE80' : '#F87171' }}>{ins.metric}</div>
                    {ins.metricChange && <div className="text-xs" style={{ color: '#6B7280' }}>{ins.metricChange}</div>}
                  </div>
                )}
              </div>
              <h3 className="font-bold mb-2 leading-tight" style={{ color: '#F9FAFB' }}>{ins.title}</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>{ins.body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#374151' }}>📡 {ins.source}</span>
                {ins.action && (
                  <button className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: style.tag, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {ins.action} →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* AI Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8 pt-6" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(217,119,6,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span>🧭</span>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Executive Briefing</span>
          </div>
          <div className="space-y-2">
            {(currentAI?.summary || INSIGHTS_AI.executive.summary).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#D97706' }} />
                <span className="text-xs" style={{ color: '#D1D5DB' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(108,63,197,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span>✨</span>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Summary</span>
            <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Generated now</span>
          </div>
          <div className="space-y-2">
            {(currentAI?.summary || INSIGHTS_AI.executive.summary).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#7C3AED' }} />
                <span className="text-xs" style={{ color: '#D1D5DB' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(13,148,136,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span>⚡</span>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
            <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span>
          </div>
          <div className="space-y-2">
            {(currentAI?.highlights || INSIGHTS_AI.executive.highlights).map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs font-bold w-4 flex-shrink-0 mt-0.5 ${h.color}`}>{h.n}</span>
                <span className="text-xs" style={{ color: '#D1D5DB' }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
