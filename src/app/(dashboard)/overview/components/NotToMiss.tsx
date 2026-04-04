'use client'

import { useState, useEffect } from 'react'

interface NotToMissItem {
  id: string
  urgency: 'critical' | 'today' | 'soon'
  title: string
  body: string
  deadline?: string
  consequence?: string
  action: string
  actionUrl?: string
  category: string
  dismissed: boolean
}

const URGENCY = {
  critical: { bg: 'rgba(153,27,27,0.15)',  border: 'rgba(239,68,68,0.35)',   tagBg: '#DC2626', label: '🔴 CRITICAL' },
  today:    { bg: 'rgba(120,53,15,0.12)',   border: 'rgba(245,158,11,0.25)',  tagBg: '#D97706', label: '🟡 TODAY'    },
  soon:     { bg: 'rgba(29,78,216,0.08)',   border: 'rgba(59,130,246,0.2)',   tagBg: '#2563EB', label: '🔵 SOON'     },
}

const MOCK_ITEMS: NotToMissItem[] = [
  { id: '1', urgency: 'critical', title: 'Payment terms not yet set on client contracts', body: 'Three new client contracts have been signed without payment terms defined. Finance team need sign-off before first invoices are raised.', deadline: 'Before first invoice', consequence: 'Invoicing disputes risk', action: 'Review Contracts', category: 'Finance', dismissed: false },
  { id: '2', urgency: 'critical', title: 'NDA outstanding — Bramble Hill partnership', body: 'Bramble Hill have requested an NDA before sharing their technical requirements. Legal have drafted it but it has not been sent for signature.', deadline: 'Before next client call', consequence: 'Partnership stalls', action: 'Send NDA', category: 'Legal', dismissed: false },
  { id: '3', urgency: 'today', title: 'Proposal due — Greenfield Group', body: 'Proposal requested by Greenfield Group CEO after last week\'s demo. Deadline is end of business today. Three slides still need revenue projections added.', deadline: 'Today', consequence: 'Lose the deal', action: 'Open Proposal', category: 'Sales', dismissed: false },
  { id: '4', urgency: 'today', title: 'Q2 board report — data not yet pulled', body: 'Board meeting is Thursday. The Q2 report template is ready but revenue, churn, and NPS data has not been pulled from the integrations.', deadline: 'This week', consequence: 'Unprepared for board', action: 'Open Board Report', category: 'Operations', dismissed: false },
  { id: '5', urgency: 'soon', title: 'Three team members — probation reviews overdue', body: 'Probation reviews for Sarah (Marketing), Tom (Engineering), and Priya (Success) were due last week. HR have flagged this twice.', deadline: 'Before end of month', consequence: 'HR compliance risk', action: 'Open HR Dashboard', category: 'HR', dismissed: false },
  { id: '6', urgency: 'soon', title: 'Website case study — approval pending', body: 'Bramble Hill case study is written and designed. Awaiting sign-off from their marketing director before publishing.', deadline: 'Next week', consequence: 'Delay lead generation content', action: 'Chase Approval', category: 'Marketing', dismissed: false },
]

export default function NotToMiss() {
  const [items, setItems] = useState<NotToMissItem[]>([])

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/not-to-miss', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => setItems(d.items || MOCK_ITEMS))
      .catch(() => setItems(MOCK_ITEMS))
  }, [])

  const dismiss = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, dismissed: true } : i))
  const active = items.filter(i => !i.dismissed)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss Today</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Critical items that need your attention — sorted by urgency</p>
        </div>
        <div className="text-sm" style={{ color: '#6B7280' }}>{active.length} items</div>
      </div>

      <div className="space-y-3">
        {active.map(item => {
          const u = URGENCY[item.urgency]
          return (
            <div key={item.id} className="rounded-2xl p-5"
              style={{ backgroundColor: u.bg, border: `1px solid ${u.border}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: u.tagBg }}>{u.label}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{item.category}</span>
                    {item.deadline && <span className="text-xs" style={{ color: '#6B7280' }}>Deadline: {item.deadline}</span>}
                  </div>
                  <h3 className="font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{item.body}</p>
                  {item.consequence && (
                    <p className="text-xs" style={{ color: 'rgba(248,113,113,0.8)' }}>⚠️ If not done: {item.consequence}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {item.actionUrl ? (
                    <a href={item.actionUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap text-center"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {item.action} →
                    </a>
                  ) : (
                    <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {item.action} →
                    </button>
                  )}
                  <button onClick={() => dismiss(item.id)}
                    className="px-4 py-2 text-xs rounded-xl transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {active.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Nothing critical today!</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>All urgent items are handled.</p>
          </div>
        )}
      </div>
    </div>
  )
}
