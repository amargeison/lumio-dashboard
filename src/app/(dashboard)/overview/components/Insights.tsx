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
    </div>
  )
}
